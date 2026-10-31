// Local browser rigid-contact primitives. 3D OBB SAT + conservative swept interval.
// A normal points B -> A. Planar cars are explicitly constrained, not fake 6DOF.
import {Vector3 as V,Quaternion as Q,Triangle} from './vendor/three.module.js';
const axes=[new V(1,0,0),new V(0,1,0),new V(0,0,1)],EPS=1e-8;
export function bodyBox(body){validateBody(body);if(!body.config.size||body.config.size.length!==3||body.config.size.some(x=>!Number.isFinite(x)||x<=0))throw Error('Invalid body box dimensions');if(body.config.collisionOffset&&body.config.collisionOffset.some(x=>!Number.isFinite(x)))throw Error('Invalid collision offset');const q=body.orientation;return{center:new V(...(body.config.collisionOffset??[0,0,0])).applyQuaternion(q).add(body.position),half:body.config.size.map(x=>x/2),axes:axes.map(v=>v.clone().applyQuaternion(q)),body};}
const radius=(b,n)=>b.half.reduce((sum,h,i)=>sum+h*Math.abs(b.axes[i].dot(n)),0);
function directions(a,b){const result=[...a.axes,...b.axes].map(x=>x.clone());for(const x of a.axes)for(const y of b.axes){const z=x.clone().cross(y);if(z.lengthSq()>1e-10)result.push(z.normalize());}return result;}
function support(b,n){const point=b.center.clone();for(let i=0;i<3;i++){const dot=b.axes[i].dot(n);if(Math.abs(dot)>1e-6)point.addScaledVector(b.axes[i],Math.sign(dot)*b.half[i]);}return point;}
function point(a,b,n){return support(a,n.clone().negate()).add(support(b,n)).multiplyScalar(.5);}
export function boxContact3D(a,b){const delta=a.center.clone().sub(b.center);let depth=Infinity,normal;
 for(const axis of directions(a,b)){const d=delta.dot(axis),overlap=radius(a,axis)+radius(b,axis)-Math.abs(d);if(overlap< -EPS)return null;if(overlap<depth){depth=Math.max(0,overlap);normal=axis.clone().multiplyScalar(d<0?-1:1);}}
 return{normal,depth,point:point(a,b,normal),time:1,swept:false};
}
// Both endpoint bases plus angular-radius padding conservatively cover rotation.
// Conservative early stop is preferable to tunnelling; not an exact curved TOI.
export function sweepBoxes3D(a0,a1,b0,b1=b0){
 const initial=boxContact3D(a0,b0);if(initial&&initial.depth>1e-6)return{...initial,time:0,swept:true};
 const delta=a0.center.clone().sub(b0.center),motion=a1.center.clone().sub(a0.center).sub(b1.center.clone().sub(b0.center));let enter=0,leave=1,normal;
 const turn=(a,b)=>Math.max(...a.axes.map((x,i)=>Math.acos(Math.max(-1,Math.min(1,x.dot(b.axes[i]))))));
 const padding=Math.hypot(...a0.half)*Math.sin(Math.min(Math.PI/2,turn(a0,a1)))+Math.hypot(...b0.half)*Math.sin(Math.min(Math.PI/2,turn(b0,b1)));
 for(const axis of [...directions(a0,b0),...directions(a1,b1)]){const extent=Math.max(radius(a0,axis),radius(a1,axis))+Math.max(radius(b0,axis),radius(b1,axis))+padding;const at=delta.dot(axis),rate=motion.dot(axis);
  if(Math.abs(rate)<EPS){if(Math.abs(at)>extent)return null;continue;}
  let t0=(-extent-at)/rate,t1=(extent-at)/rate;let sign=-1;if(t0>t1){[t0,t1]=[t1,t0];sign=1;}
  if(t0>enter||(Math.abs(t0-enter)<EPS&&!normal)){enter=t0;normal=axis.clone().multiplyScalar(sign);}leave=Math.min(leave,t1);if(enter>leave)return null;
 }
 if(!normal||enter<0||enter>1)return boxContact3D(a1,b1);
 const aa={...a0,center:a0.center.clone().lerp(a1.center,enter)},bb={...b0,center:b0.center.clone().lerp(b1.center,enter)};
 return{normal,depth:0,point:point(aa,bb,normal),time:enter,swept:true};
}
function inverseLinear(body,v){if(body.static)return new V();return body.planar?new V(v.x/body.config.mass,0,v.z/body.config.mass):v.clone().multiplyScalar(1/body.config.mass);}
function inverseAngular(body,v){if(body.static)return new V();if(body.planar)return new V(0,v.y/body.inertia.y,0);return v.clone().applyQuaternion(body.orientation.clone().invert()).divide(body.inertia).applyQuaternion(body.orientation);}
const velocityAt=(b,r)=>b.velocity.clone().add(b.angularVelocity.clone().cross(r));
const effective=(b,r,n)=>n.dot(inverseLinear(b,n))+n.dot(inverseAngular(b,r.clone().cross(n)).cross(r));
function impulse(b,j,r){if(b.static)return;b.velocity.add(inverseLinear(b,j));b.angularVelocity.add(inverseAngular(b,r.clone().cross(j)));}
export function resolveBodyContact(a,b,hit,options={}){
 validateBody(a);validateBody(b);if(!hit||![...hit.normal.toArray(),...hit.point.toArray(),hit.depth].every(Number.isFinite)||hit.normal.lengthSq()<1e-12||hit.depth<0)throw Error('Invalid contact manifold');
 const {friction=.45,restitution=.06}=options;if(!Number.isFinite(friction)||friction<0||!Number.isFinite(restitution)||restitution<0||restitution>1)throw Error('Invalid contact material');
 const A=cloneBody(a),B=cloneBody(b),result=resolveContact(A,B,hit,{friction,restitution});validateBody(A);validateBody(B);commitBody(a,A);commitBody(b,B);return result;
}
function resolveContact(a,b,hit,{friction=.45,restitution=.06}={}){
 const n=hit.normal.clone().normalize(),ra=hit.point.clone().sub(a.position),rb=hit.point.clone().sub(b.position);
 const rel=velocityAt(a,ra).sub(velocityAt(b,rb)),vn=rel.dot(n),den=effective(a,ra,n)+effective(b,rb,n);if(den<EPS)return{...hit,impactSpeed:0,impulse:0};
 const amount=vn<0?-(1+restitution)*vn/den:0;
 if(amount>0){const j=n.clone().multiplyScalar(amount);impulse(a,j,ra);impulse(b,j.clone().negate(),rb);
  const tangent=velocityAt(a,ra).sub(velocityAt(b,rb));tangent.addScaledVector(n,-tangent.dot(n));const speed=tangent.length();if(speed>EPS){tangent.divideScalar(speed);const mass=effective(a,ra,tangent)+effective(b,rb,tangent);if(mass>EPS){const jt=tangent.multiplyScalar(-Math.min(speed/mass,friction*amount));impulse(a,jt,ra);impulse(b,jt.clone().negate(),rb);}}
 }
 if(hit.depth>0){const ia=inverseLinear(a,n),ib=inverseLinear(b,n),total=n.dot(ia)+n.dot(ib);if(total>EPS){const correction=(hit.depth+.0001)/total;a.position.addScaledVector(ia,correction);b.position.addScaledVector(ib,-correction);}}
 return{...hit,impactSpeed:Math.max(0,-vn),impulse:amount};
}
export function snapshotBody(b){return{...b,position:b.position.clone(),orientation:b.orientation.clone()};}
export function collideBodies(a,b,previousA=null,previousB=null){
 const A=cloneBody(a),B=cloneBody(b),result=collide(A,B,previousA,previousB);validateBody(A);validateBody(B);commitBody(a,A);commitBody(b,B);return result;
}
function collide(a,b,previousA=null,previousB=null){
 const aa=bodyBox(a),bb=bodyBox(b),hit=previousA?sweepBoxes3D(bodyBox(previousA),aa,previousB?bodyBox(previousB):bb,bb):boxContact3D(aa,bb);if(!hit)return null;
 if(hit.swept&&hit.time<1){const endA=a.orientation.clone(),endB=b.orientation.clone(),posA=a.position.clone(),posB=b.position.clone();if(!a.static){a.position.copy(previousA.position).lerp(posA,Math.max(0,hit.time-1e-5));a.orientation.copy(previousA.orientation).slerp(endA,hit.time);}if(previousB&&!b.static){b.position.copy(previousB.position).lerp(posB,Math.max(0,hit.time-1e-5));b.orientation.copy(previousB.orientation).slerp(endB,hit.time);}}
 return resolveBodyContact(a,b,hit);
}
export function staticBox(collider){const w=collider.w,d=collider.d,h=collider.height??10,y=collider.baseY??0;if(![w,d,h,y,collider.x,collider.z,collider.yaw??0].every(Number.isFinite)||Math.min(w,d,h)<=0)throw Error('Invalid static collider');return{static:true,config:{size:[2*w,h,2*d],mass:Infinity},position:new V(collider.x,y+h/2,collider.z),orientation:new Q().setFromAxisAngle(axes[1],collider.yaw??0),velocity:new V(),angularVelocity:new V(),inertia:new V(Infinity,Infinity,Infinity)};}

// Finite, double-sided triangle contact. No infinite floor substitution; the SAT
// includes triangle edges so a roof cannot catch a chassis beyond its perimeter.
export function collideBodyTriangle(body,face,previous=null){
 const draft=cloneBody(body),result=collideTriangle(draft,face,previous);validateBody(draft);commitBody(body,draft);return result;
}
function collideTriangle(body,face,previous=null){
 const current=bodyBox(body),start=previous?bodyBox(previous):current,points=face.points,n=face.normal;
 const edges=[points[1].clone().sub(points[0]),points[2].clone().sub(points[1]),points[0].clone().sub(points[2])];
 const axesFor=box=>{const result=[...box.axes,n].map(v=>v.clone());for(const axis of box.axes)for(const edge of edges){const a=axis.clone().cross(edge);if(a.lengthSq()>1e-10)result.push(a.normalize());}return result;};
 const projection=axis=>{const values=points.map(p=>p.dot(axis));return[Math.min(...values),Math.max(...values)];};
 const overlaps=box=>axesFor(box).every(axis=>{const [lo,hi]=projection(axis),c=box.center.dot(axis),r=radius(box,axis);return c+r>=lo-EPS&&c-r<=hi+EPS;});
 let hit=null;
 if(overlaps(start)){
  const distance=start.center.clone().sub(points[0]).dot(n),normal=n.clone().multiplyScalar(distance<0?-1:1),depth=Math.max(0,radius(start,n)-Math.abs(distance));
  // Touching while leaving needs no contact; touching into the surface does.
  if(depth>EPS||current.center.clone().sub(start.center).dot(normal)<0)hit={normal,depth,time:0,swept:true};
 }else if(previous){
  const motion=current.center.clone().sub(start.center),turn=Math.max(...start.axes.map((a,i)=>Math.acos(Math.max(-1,Math.min(1,a.dot(current.axes[i])))))),padding=Math.hypot(...start.half)*Math.sin(Math.min(Math.PI/2,turn));
  let enter=0,leave=1,normal=null,miss=false;
  for(const axis of [...axesFor(start),...axesFor(current)]){const [lo,hi]=projection(axis),r=Math.max(radius(start,axis),radius(current,axis))+padding,c=start.center.dot(axis),rate=motion.dot(axis);
   if(Math.abs(rate)<EPS){if(c+r<lo||c-r>hi){miss=true;break;}continue;}
   let a=(lo-r-c)/rate,b=(hi+r-c)/rate,sign=-1;if(a>b){[a,b]=[b,a];sign=1;}if(a>enter||(Math.abs(a-enter)<EPS&&!normal)){enter=a;normal=axis.clone().multiplyScalar(sign);}leave=Math.min(leave,b);if(enter>leave){miss=true;break;}
  }
  if(!miss&&normal&&enter>=0&&enter<=1)hit={normal,depth:0,time:enter,swept:true};
 }
 if(!hit&&overlaps(current)){const d=current.center.clone().sub(points[0]).dot(n);hit={normal:n.clone().multiplyScalar(d<0?-1:1),depth:Math.max(0,radius(current,n)-Math.abs(d)),time:1,swept:false};}
 if(!hit)return null;
 if(previous&&hit.swept&&hit.time<1){const end=body.orientation.clone(),endPosition=body.position.clone();body.position.copy(previous.position).lerp(endPosition,Math.max(0,hit.time-1e-5));body.orientation.copy(previous.orientation).slerp(end,hit.time);}
 hit.point=new Triangle(...points).closestPointToPoint(support(bodyBox(body),hit.normal.clone().negate()),new V());
 const obstacle={static:true,config:{mass:Infinity},position:hit.point.clone(),velocity:new V(),angularVelocity:new V()};return resolveBodyContact(body,obstacle,hit);
}

function validateBody(b){
 if(!b||!b.config||(!b.static&&(!Number.isFinite(b.config.mass)||b.config.mass<=0)))throw Error('Invalid rigid body mass');
 for(const k of ['position','velocity','angularVelocity'])if(!b[k]||!b[k].toArray().every(Number.isFinite))throw Error('Invalid rigid body '+k);
 if(b.orientation&&(!b.orientation.toArray().every(Number.isFinite)||Math.abs(b.orientation.length()-1)>.001))throw Error('Invalid rigid body orientation');
 if(!b.static&&(!b.inertia||b.inertia.toArray().some((n,i)=>!(n>0)||(!Number.isFinite(n)&&!(b.planar&&i!==1)))))throw Error('Invalid inertia');
}
function cloneBody(b){validateBody(b);return{...b,position:b.position.clone(),velocity:b.velocity.clone(),angularVelocity:b.angularVelocity.clone(),...(b.orientation?{orientation:b.orientation.clone()}: {})};}
function commitBody(b,d){b.position.copy(d.position);b.velocity.copy(d.velocity);b.angularVelocity.copy(d.angularVelocity);if(b.orientation)b.orientation.copy(d.orientation);}
