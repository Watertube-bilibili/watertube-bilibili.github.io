/** Bounded, grounded rigid-body furniture physics (XZ translation + yaw only).
 * Fixed 120 Hz substeps, impulses, contact/friction, walls, player and sleeping.
 * This is not a replacement for Godot vehicle/gravity physics; no tipping/flying.
 */
export const FURNITURE_STEP=1/120;
export const FURNITURE_LIMITS=Object.freeze({mobileActive:4,desktopActive:8,maxLinearSpeed:3.8,maxAngularSpeed:4.0,maxDistance:45,reach:2.15,cooldown:.34});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),finite=(n,f=0)=>Number.isFinite(n)?n:f;
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const dot=(a,b)=>a.x*b.x+a.z*b.z,cross=(a,b)=>a.x*b.z-a.z*b.x;
const axes=b=>{const c=Math.cos(b.angle??0),s=Math.sin(b.angle??0);return[{x:c,z:s},{x:-s,z:c}];};
function radius(b,n){if(b.shape==='circle')return b.radius;const [u,v]=axes(b);return Math.abs(dot(n,u))*b.w+Math.abs(dot(n,v))*b.d;}
const magnitude=b=>Math.hypot(b.vx??0,b.vz??0);
function asStatic(c){return{x:c.x,z:c.z,w:c.w,d:c.d,angle:-(c.yaw??0),vx:0,vz:0,omega:0,invMass:0,invInertia:0,shape:c.shape??'box',radius:c.radius,source:c};}
export function furnitureContact(a,b){
 const dx=b.x-a.x,dz=b.z-a.z;if(Math.abs(dx)>(a.radius??Math.hypot(a.w,a.d))+(b.radius??Math.hypot(b.w,b.d))+.002||Math.abs(dz)>(a.radius??Math.hypot(a.w,a.d))+(b.radius??Math.hypot(b.w,b.d))+.002)return null;
 let candidates=[...axes(a),...axes(b)];
 if(a.shape==='circle'&&b.shape==='circle'){const l=Math.hypot(dx,dz);if(l>=a.radius+b.radius)return null;const n=l>1e-8?{x:dx/l,z:dz/l}:{x:1,z:0};return{n,depth:a.radius+b.radius-l,point:{x:a.x+n.x*a.radius,z:a.z+n.z*a.radius}};}
 if(a.shape==='circle'||b.shape==='circle'){
  const c=a.shape==='circle'?a:b,r=c===a?b:a,[u,v]=axes(r),offset={x:c.x-r.x,z:c.z-r.z},px=clamp(dot(offset,u),-r.w,r.w),pz=clamp(dot(offset,v),-r.d,r.d),nx=c.x-(r.x+u.x*px+v.x*pz),nz=c.z-(r.z+u.z*px+v.z*pz),l=Math.hypot(nx,nz);if(l>1e-8)candidates.push({x:nx/l,z:nz/l});
 }
 let depth=Infinity,n=null;for(const axis of candidates){const overlap=radius(a,axis)+radius(b,axis)-Math.abs(dx*axis.x+dz*axis.z);if(overlap<=0)return null;if(overlap<depth){depth=overlap;const sign=dx*axis.x+dz*axis.z<0?-1:1;n={x:axis.x*sign,z:axis.z*sign};}}
 const t={x:-n.z,z:n.x},an=a.x*n.x+a.z*n.z,bn=b.x*n.x+b.z*n.z,at=a.x*t.x+a.z*t.z,bt=b.x*t.x+b.z*t.z;
 const pn=(an+radius(a,n)+bn-radius(b,n))/2,lo=Math.max(at-radius(a,t),bt-radius(b,t)),hi=Math.min(at+radius(a,t),bt+radius(b,t)),pt=(lo+hi)/2;
 return{n,depth,point:{x:n.x*pn+t.x*pt,z:n.z*pn+t.z*pt}};
}
function impulse(body,x,z,point){if(!body.invMass)return;body.vx+=x*body.invMass;body.vz+=z*body.invMass;if(point)body.omega+=((point.x-body.x)*z-(point.z-body.z)*x)*body.invInertia;}
function solve(a,b,hit){
 const {n,point}=hit,sum=a.invMass+b.invMass;if(sum<=0)return;
 const correction=Math.max(0,hit.depth-.0015)*.86/sum;a.x-=n.x*correction*a.invMass;a.z-=n.z*correction*a.invMass;b.x+=n.x*correction*b.invMass;b.z+=n.z*correction*b.invMass;
 const ra={x:point.x-a.x,z:point.z-a.z},rb={x:point.x-b.x,z:point.z-b.z},va={x:(a.vx??0)-(a.omega??0)*ra.z,z:(a.vz??0)+(a.omega??0)*ra.x},vb={x:(b.vx??0)-(b.omega??0)*rb.z,z:(b.vz??0)+(b.omega??0)*rb.x},rv={x:vb.x-va.x,z:vb.z-va.z},vn=dot(rv,n);
 if(vn>=0)return;const rnA=cross(ra,n),rnB=cross(rb,n),den=sum+rnA*rnA*a.invInertia+rnB*rnB*b.invInertia,j=-(1+(Math.abs(vn)>.45?.08:0))*vn/den;
 impulse(a,-j*n.x,-j*n.z,point);impulse(b,j*n.x,j*n.z,point);
 const t={x:-n.z,z:n.x},rtA=cross(ra,t),rtB=cross(rb,t),jt=clamp(-dot(rv,t)/(sum+rtA*rtA*a.invInertia+rtB*rtB*b.invInertia),-j*.44,j*.44);
 impulse(a,-jt*t.x,-jt*t.z,point);impulse(b,jt*t.x,jt*t.z,point);
}
export function createFurniturePhysics(definitions,staticColliders,{mobile=false,rooms=[]}={}){
 const limit=mobile?FURNITURE_LIMITS.mobileActive:FURNITURE_LIMITS.desktopActive;
 const bodies=definitions.map((d,i)=>{const mass=d.type==='chair'?7:24,w=d.width/2,depth=d.depth/2,inertia=mass*(w*w+depth*depth)/3;return{id:d.id??'prop-'+i,type:d.type,roomId:d.roomId,x:d.x,z:d.z,angle:-(d.yaw??0),w,d:depth,shape:d.type==='table'?'circle':'box',radius:d.type==='table'?Math.max(w,depth):undefined,baseY:d.baseY??.09,height:d.height,mass,invMass:1/mass,invInertia:1/inertia,vx:0,vz:0,omega:0,awake:false,sleepTime:0,lastAction:-100,revision:1,home:{x:d.x,z:d.z,angle:-(d.yaw??0)},definition:d};});
 const bodyMap=new Map(bodies.map(b=>[b.id,b])),statics=staticColliders.filter(b=>!b.dynamicFurniture&&(b.baseY??0)<2.0&&(b.baseY??0)+(b.height??10)>.1).map(asStatic),roomMap=new Map(rooms.map(r=>[r.id,r]));
 // Keep the existing 3m doorway and its landing free. This small safety keepout
 // affects loose furniture only, never the player's walkable space.
 const exits=rooms.map(r=>{const c=Math.cos(r.yaw??0),s=Math.sin(r.yaw??0),z=r.d/2-1.15;return{...asStatic({x:r.x+z*s,z:r.z+z*c,w:1.65,d:1.85,yaw:r.yaw??0}),roomId:r.id,protectedExit:true};});
 let accumulator=0,time=0,focus={x:0,z:0},player=null,extraStatics=[];
 const stats={steps:0,contacts:0,awake:0,maxActive:limit,droppedSteps:0,kicks:0,pushes:0,sleeping:bodies.length};
 const active=()=>bodies.filter(b=>b.awake);
 function sleep(b){b.awake=false;b.vx=b.vz=b.omega=0;b.sleepTime=0;b.revision++;}
 function wake(b){if(b.awake)return;const current=active();if(current.length>=limit){current.sort((a,c)=>(magnitude(a)+Math.abs(a.omega)*.1)-(magnitude(c)+Math.abs(c.omega)*.1));sleep(current[0]);}b.awake=true;b.sleepTime=0;}
 const nearby=(b,p=focus)=>Math.hypot(b.x-p.x,b.z-p.z)<=FURNITURE_LIMITS.maxDistance;
 function boundsOK(b){const room=roomMap.get(b.roomId);if(!room)return Math.hypot(b.x-b.home.x,b.z-b.home.z)<=6;const c=Math.cos(room.yaw??0),s=Math.sin(room.yaw??0),dx=b.x-room.x,dz=b.z-room.z,xx=dx*c-dz*s,zz=dx*s+dz*c,r=Math.hypot(b.w,b.d);return Math.abs(xx)+r<room.w/2-.42&&Math.abs(zz)+r<room.d/2-.42;}
 const validPose=(b,others=bodies,actor=null)=>boundsOK(b)&&!statics.some(s=>furnitureContact(b,s))&&!exits.some(s=>s.roomId===b.roomId&&furnitureContact(b,s))&&!others.some(o=>o!==b&&furnitureContact(b,o))&&(!actor||!furnitureContact(b,actor));
 function playerBody(p){return p&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&finite(p.y)<2.2?{x:p.x,z:p.z,shape:'circle',radius:p.radius??.31,w:p.radius??.31,d:p.radius??.31,angle:0,invMass:0,invInertia:0,vx:finite(p.vx),vz:finite(p.vz),omega:0}:null;}
 function targetFrom(p,forward=null){
  if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.z)||finite(p.y)>2.2)return null;
  let best=null,distance=Infinity;for(const b of bodies){const dx=b.x-p.x,dz=b.z-p.z,l=Math.hypot(dx,dz),edge=l-(b.radius??Math.hypot(b.w,b.d));if(edge>FURNITURE_LIMITS.reach||l<.001)continue;if(forward&&(dx*forward.x+dz*forward.z)/l<.35)continue;
   // A wall/counter between feet and prop forbids through-wall or across-shop kicks.
   let blocked=false;for(const obstacle of statics){const [u,v]=axes(obstacle),start={x:p.x-obstacle.x,z:p.z-obstacle.z},end={x:b.x-obstacle.x,z:b.z-obstacle.z};let lo=0,hi=1;
    for(const [axis,extent]of [[u,obstacle.w+.06],[v,obstacle.d+.06]]){const a=dot(start,axis),d=dot(end,axis)-a;if(Math.abs(d)<1e-9){if(Math.abs(a)>extent){hi=-1;break;}}else{let t0=(-extent-a)/d,t1=(extent-a)/d;if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);}}
    if(hi>=lo&&hi>.01&&lo<.97){blocked=true;break;}
   }
   if(!blocked&&edge<distance){distance=edge;best=b;}
  }return best;
 }
 function act(id,p,{mode='kick',forward=null}={}){
  if(!['kick','push'].includes(mode))return{ok:false,reason:'unknown-action'};const b=bodyMap.get(id);if(!b||targetFrom(p,forward)?.id!==id||time-b.lastAction<FURNITURE_LIMITS.cooldown)return{ok:false,reason:'out-of-reach-or-cooldown'};
  const dx=b.x-p.x,dz=b.z-p.z,len=Math.hypot(dx,dz);if(len<.05)return{ok:false,reason:'overlap'};
  wake(b);b.lastAction=time;const strength=mode==='push'?(b.type==='chair'?7:17):(b.type==='chair'?24:44),point={x:b.x-dx/len*(b.w*.7),z:b.z-dz/len*(b.d*.7)};
  const fx=dx/len*.8+(forward?.x??dx/len)*.2,fz=dz/len*.8+(forward?.z??dz/len)*.2,fl=Math.hypot(fx,fz);impulse(b,fx/fl*strength,fz/fl*strength,point);b.revision++;stats[mode==='push'?'pushes':'kicks']++;return{ok:true,id:b.id};
 }
 function substep(dt){
  time+=dt;stats.steps++;
  for(const b of bodies){if(!b.awake)continue;if(!nearby(b)){sleep(b);continue;}const speed=magnitude(b),newSpeed=Math.max(0,speed-1.55*dt);if(speed>0){b.vx*=newSpeed/speed;b.vz*=newSpeed/speed;}const ang=Math.max(0,Math.abs(b.omega)-2.2*dt);b.omega=Math.sign(b.omega)*ang;
   const cap=Math.min(1,FURNITURE_LIMITS.maxLinearSpeed/Math.max(.001,magnitude(b)));b.vx*=cap;b.vz*=cap;b.omega=clamp(b.omega,-FURNITURE_LIMITS.maxAngularSpeed,FURNITURE_LIMITS.maxAngularSpeed);b.x+=b.vx*dt;b.z+=b.vz*dt;b.angle=wrap(b.angle+b.omega*dt);b.revision++;
  }
  const actor=playerBody(player);
  for(let iteration=0;iteration<4;iteration++){
   for(const b of bodies){if(!b.awake)continue;
    for(const s of [...statics,...extraStatics,...exits.filter(e=>e.roomId===b.roomId),...(actor?[actor]:[])]){const hit=furnitureContact(b,s);if(hit){solve(b,s,hit);stats.contacts++;}}
   }
   for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){const a=bodies[i],b=bodies[j];if((!a.awake&&!b.awake)||a.roomId!==b.roomId)continue;const hit=furnitureContact(a,b);if(!hit)continue;
    if(!a.awake)wake(a);if(!b.awake)wake(b);solve(a,b,hit);a.revision++;b.revision++;stats.contacts++;
   }
  }
  // Fail closed on non-finite/unsafe escape; normal contacts never teleport.
  for(const b of bodies){if(!b.awake)continue;if(![b.x,b.z,b.angle,b.vx,b.vz,b.omega].every(Number.isFinite)){Object.assign(b,b.home);sleep(b);continue;}
   if(magnitude(b)<.045&&Math.abs(b.omega)<.045){b.sleepTime+=dt;if(b.sleepTime>.42)sleep(b);}else b.sleepTime=0;
  }
 }
 function step(dt,{position=focus,actor=null,blockers=[]}={}){
  focus=position??focus;player=actor;extraStatics=blockers.slice(0,8).map(asStatic);if(!Number.isFinite(dt)||dt<=0)return stats;
  const safe=Math.min(dt,.08);if(dt>.08)stats.droppedSteps++;accumulator+=safe;let count=0;while(accumulator+1e-9>=FURNITURE_STEP&&count++<10){substep(FURNITURE_STEP);accumulator-=FURNITURE_STEP;}stats.awake=active().length;stats.sleeping=bodies.length-stats.awake;return stats;
 }
 function placeSafe(b,preferred,placed,actor){
  Object.assign(b,preferred);if(validPose(b,placed,actor))return true;
  const base=b.home;for(const offset of [[0,0],...[.85,1.7,2.55,3.4].flatMap(r=>Array.from({length:16},(_,i)=>[Math.cos(i*Math.PI/8)*r,Math.sin(i*Math.PI/8)*r]))]){b.x=base.x+offset[0];b.z=base.z+offset[1];b.angle=base.angle;if(validPose(b,placed,actor))return true;}return false;
 }
 function reset(roomId=null,{actor=null}={}){
  const selected=bodies.filter(b=>!roomId||b.roomId===roomId),p=playerBody(actor),positions=selected.map(b=>({b,x:b.x,z:b.z,angle:b.angle})),placed=bodies.filter(b=>!selected.includes(b));
  for(const b of selected){if(!placeSafe(b,b.home,placed,p)){for(const old of positions)Object.assign(old.b,{x:old.x,z:old.z,angle:old.angle});return{ok:false,reason:'请先离开家具位置再整理'};}placed.push(b);}
  selected.forEach(sleep);accumulator=0;return{ok:true,count:selected.length};
 }
 function snapshot(){return{version:1,poses:bodies.filter(b=>Math.hypot(b.x-b.home.x,b.z-b.home.z)>.01||Math.abs(wrap(b.angle-b.home.angle))>.01).map(b=>({id:b.id,x:+b.x.toFixed(4),z:+b.z.toFixed(4),yaw:+(-b.angle).toFixed(4)}))};}
 function restore(data,{actor=null}={}){
  const saved=data?.version===1&&Array.isArray(data.poses)&&data.poses.length<=bodies.length?data.poses:[],map=new Map(),p=playerBody(actor),placed=[];let rejected=0;
  for(const row of saved){if(!row||typeof row.id!=='string'||!bodyMap.has(row.id)||map.has(row.id)||![row.x,row.z,row.yaw].every(Number.isFinite)||Math.abs(row.yaw)>Math.PI*8){rejected++;continue;}map.set(row.id,row);}
  for(const b of bodies){const row=map.get(b.id),pose=row?{x:row.x,z:row.z,angle:wrap(-row.yaw)}:b.home;if(!placeSafe(b,pose,placed,p)){Object.assign(b,b.home);rejected++;}else if(row&&(Math.hypot(b.x-row.x,b.z-row.z)>.01))rejected++;placed.push(b);sleep(b);b.lastAction=-100;}
  accumulator=0;return{ok:true,restored:saved.length-rejected,rejected};
 }
 return{bodies,bodyMap,statics,exits,stats,step,act,targetFrom,reset,snapshot,restore,get time(){return time;},setFocus(p){focus=p;},isValid:b=>validPose(b)};
}
