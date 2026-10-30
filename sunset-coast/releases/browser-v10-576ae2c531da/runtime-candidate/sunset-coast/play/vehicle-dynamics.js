import * as THREE from './vendor/three.module.js';

// Small planar contact solver. Metres, seconds and kilograms; no mesh
// deformation or render/camera state belongs here. A normal points from B to A.
const EPS = 1e-8, SKIN = .008;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const wrap = n => Math.atan2(Math.sin(n), Math.cos(n));
const dimensions = new WeakMap();
const dot = (a, b) => a.x * b.x + a.z * b.z;
const pose = (v, p) => ({x:p?.position?.x ?? p?.x ?? v.pos.x,
  z:p?.position?.z ?? p?.z ?? v.pos.z, yaw:p?.yaw ?? v.yaw ?? 0});
const interpolate = (a, b, t) => ({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,
  yaw:a.yaw+wrap(b.yaw-a.yaw)*t});

function footprint(v) {
  // Optional authored contract keeps articulated doors/wing/LOD from changing
  // an asset vehicle's physical body envelope during loading or animation.
  const f=v.collisionBounds;
  if(f&&['minX','maxX','minZ','maxZ','minY','maxY'].every(k=>Number.isFinite(f[k]))&&f.maxX>f.minX&&f.maxZ>f.minZ&&f.maxY>f.minY)return{halfWidth:(f.maxX-f.minX)/2,halfLength:(f.maxZ-f.minZ)/2,offsetX:(f.maxX+f.minX)/2,offsetZ:(f.maxZ+f.minZ)/2,minY:f.minY,maxY:f.maxY};
  // Read actual model-local extents once, including the imported model. Local
  // transforms keep this correct even when the car first appears at an angle.
  // Root replacement (simple -> detailed) naturally gets a fresh cache entry.
  if (v.root && dimensions.has(v.root)) return dimensions.get(v.root);
  let halfWidth = v.halfWidth ?? 1, halfLength = v.halfLength ?? (v.wheelBase ?? 2.9) * .86;
  let offsetX = 0, offsetZ = 0,minY=0,maxY=vehicleHeight(v);
  if (v.root?.traverse) {
    v.root.updateWorldMatrix(true, true);
    const inverse = v.root.matrixWorld.clone().invert(), bounds = new THREE.Box3();
    const part = new THREE.Box3(), matrix = new THREE.Matrix4();
    v.root.traverse(object => {
      if (!object.isMesh || !object.geometry) return;
      if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
      if (!object.geometry.boundingBox) return;
      matrix.multiplyMatrices(inverse, object.matrixWorld);
      part.copy(object.geometry.boundingBox).applyMatrix4(matrix);bounds.union(part);
    });
    if (!bounds.isEmpty()) {
      halfWidth = Math.max(halfWidth, (bounds.max.x-bounds.min.x)/2);
      halfLength = Math.max(v.halfLength??0, (bounds.max.z-bounds.min.z)/2);
      offsetX = (bounds.max.x+bounds.min.x)/2;offsetZ = (bounds.max.z+bounds.min.z)/2;
      minY=bounds.min.y;maxY=bounds.max.y;
    }
  }
  const result = {halfWidth:Math.max(.25, halfWidth),halfLength:Math.max(.5, halfLength),offsetX,offsetZ,minY,maxY};
  if (v.root) dimensions.set(v.root, result);
  return result;
}
const vehicleHeight=v=>Number.isFinite(v.height)?v.height:v.kind==='aircraft'?3.2:1.8;
export function vehicleVerticalOverlap(position,vehicle,actorHeight=1.8){
  if(!Number.isFinite(position?.y)||!Number.isFinite(vehicle.pos?.y))return true;
  const f=footprint(vehicle),q=vehicle.physicsQuaternion;
  let min=vehicle.pos.y+f.minY,max=vehicle.pos.y+f.maxY;
  if(q){min=Infinity;max=-Infinity;for(const x of [-f.halfWidth,f.halfWidth])for(const y of [f.minY,f.maxY])for(const z of [-f.halfLength,f.halfLength]){const p=new THREE.Vector3(x+f.offsetX,y,z+f.offsetZ).applyQuaternion(q);min=Math.min(min,vehicle.pos.y+p.y);max=Math.max(max,vehicle.pos.y+p.y);}}
  return position.y+actorHeight>=min-.08&&position.y<=max+.08;
}

function box(p, halfWidth, halfLength, offsetX=0, offsetZ=0) {
  const s=Math.sin(p.yaw),c=Math.cos(p.yaw),right={x:c,z:-s},back={x:s,z:c};
  return {x:p.x+right.x*offsetX+back.x*offsetZ,z:p.z+right.z*offsetX+back.z*offsetZ,
    yaw:p.yaw,halfWidth,halfLength,right,back,radius:Math.hypot(halfWidth,halfLength)};
}

export function getVehicleCollider(vehicle, previousPose=null) {
  const f=footprint(vehicle);
  return box(pose(vehicle,previousPose),f.halfWidth,f.halfLength,f.offsetX,f.offsetZ);
}

const worldBox = b => box({x:b.x,z:b.z,yaw:b.yaw??0},b.w,b.d);
const radiusOn = (b,n) => b.halfWidth*Math.abs(dot(b.right,n))+b.halfLength*Math.abs(dot(b.back,n));
const support = (b,n) => {
  // Centre of the contacted face, rather than an arbitrary diagonal corner.
  const localX=dot(n,b.right),localZ=dot(n,b.back);
  const scale=1/Math.max(Math.abs(localX)/b.halfWidth,Math.abs(localZ)/b.halfLength,EPS);
  return {x:b.x-n.x*scale,z:b.z-n.z*scale};
};

export function boxContact(a,b) {
  const delta={x:a.x-b.x,z:a.z-b.z};
  if(Math.abs(delta.x)>a.radius+b.radius||Math.abs(delta.z)>a.radius+b.radius)return null;
  let depth=Infinity,normal;
  for(const axis of [a.right,a.back,b.right,b.back]) {
    const distance=dot(delta,axis),overlap=radiusOn(a,axis)+radiusOn(b,axis)-Math.abs(distance);
    if(overlap < -EPS)return null;
    if(overlap<depth){depth=Math.max(0,overlap);const sign=distance<0?-1:1;normal={x:axis.x*sign,z:axis.z*sign};}
  }
  return {normal,depth,point:support(a,normal),time:1,swept:false};
}

export function vehicleContact(a,b) {return boxContact(getVehicleCollider(a),getVehicleCollider(b));}

// Continuous separating-axis test: exact for translating boxes. For turning,
// endpoint extents plus an arc bound conservatively cover the tiny per-step
// rotation. This also catches vehicles that cross completely in one step.
export function sweepBoxContact(a0,a1,b0,b1=b0) {
  const initial=boxContact(a0,b0);
  if(initial&&initial.depth>EPS)return {...initial,time:0,swept:true,initialOverlap:true};
  const start={x:a0.x-b0.x,z:a0.z-b0.z};
  const motion={x:a1.x-a0.x-b1.x+b0.x,z:a1.z-a0.z-b1.z+b0.z};
  const turnA=Math.abs(wrap(a1.yaw-a0.yaw)),turnB=Math.abs(wrap(b1.yaw-b0.yaw));
  const padA=a0.radius*(1-Math.cos(turnA/2)),padB=b0.radius*(1-Math.cos(turnB/2));
  let entry=0,exit=1,normal=null;
  for(const axis of [a0.right,a0.back,a1.right,a1.back,b0.right,b0.back,b1.right,b1.back]) {
    const radius=Math.max(radiusOn(a0,axis),radiusOn(a1,axis))+padA+
      Math.max(radiusOn(b0,axis),radiusOn(b1,axis))+padB;
    const at=dot(start,axis),rate=dot(motion,axis);
    if(Math.abs(rate)<EPS){if(Math.abs(at)>radius+EPS)return null;continue;}
    let near=(-radius-at)/rate,far=(radius-at)/rate;
    if(near>far)[near,far]=[far,near];
    if(near>=entry-EPS){entry=Math.max(0,near);const sign=at+rate*entry<0?-1:1;normal={x:axis.x*sign,z:axis.z*sign};}
    exit=Math.min(exit,far);if(entry>exit+EPS)return null;
  }
  if(entry>1||exit<0)return null;
  normal??=initial?.normal;
  if(!normal||dot(motion,normal)>=-EPS)return null;
  return {normal,depth:0,time:entry,swept:true,initialOverlap:false};
}

export function vehicleVelocity(v) {
  return {x:-Math.sin(v.yaw)*(v.speed??0)+(v.slipVelocityX??0),
    z:-Math.cos(v.yaw)*(v.speed??0)+(v.slipVelocityZ??0)};
}

function setVelocity(v,velocity) {
  const fx=-Math.sin(v.yaw),fz=-Math.cos(v.yaw);
  v.speed=velocity.x*fx+velocity.z*fz;
  if(Math.abs(v.speed)<EPS)v.speed=0;
  v.slipVelocityX=velocity.x-fx*v.speed;v.slipVelocityZ=velocity.z-fz*v.speed;
  v.lateralSpeed=v.slipVelocityX*Math.cos(v.yaw)-v.slipVelocityZ*Math.sin(v.yaw);
  v.slipAngle=Math.atan2(v.lateralSpeed,Math.max(.1,Math.abs(v.speed)));
}

function inverseMass(v,explicit) {
  if(Number.isFinite(explicit))return Math.max(0,explicit);
  if(v.parked)return 0;
  const mass=v.mass??v.model?.mass??1500;
  return 1/Math.max(300,mass);
}

// No reversal when already separating: drivers can back away from touching
// bumpers/walls. Coulomb-limited tangent impulse preserves a natural slide.
function impulse(a,b,normal,options={}) {
  const ia=inverseMass(a,options.inverseMassA),ib=b?inverseMass(b,options.inverseMassB):0;
  const av=vehicleVelocity(a),bv=b?vehicleVelocity(b):{x:0,z:0};
  const relative={x:av.x-bv.x,z:av.z-bv.z},closing=dot(relative,normal),sum=ia+ib;
  if(closing>=0||sum<=EPS)return {impactSpeed:Math.max(0,-closing),normalImpulse:0};
  const restitution=clamp(options.restitution??0,0,.25),normalImpulse=-(1+restitution)*closing/sum;
  const tangent={x:-normal.z,z:normal.x},friction=clamp(options.friction??.12,0,1);
  const tangentImpulse=clamp(-dot(relative,tangent)/sum,-friction*normalImpulse,friction*normalImpulse);
  const jx=normal.x*normalImpulse+tangent.x*tangentImpulse,jz=normal.z*normalImpulse+tangent.z*tangentImpulse;
  if(ia){setVelocity(a,{x:av.x+jx*ia,z:av.z+jz*ia});a.yawRate=0;}
  if(ib){setVelocity(b,{x:bv.x-jx*ib,z:bv.z-jz*ib});b.yawRate=0;}
  return {impactSpeed:-closing,normalImpulse};
}

function separate(a,b,contact,options={}) {
  const ia=inverseMass(a,options.inverseMassA),ib=b?inverseMass(b,options.inverseMassB):0,sum=ia+ib;
  // Two accidentally coincident parked cars still need a deterministic repair.
  const share=sum>EPS?ia/sum:(b?.5:1),depth=contact.depth+(options.skin??SKIN);
  a.pos.x+=contact.normal.x*depth*share;a.pos.z+=contact.normal.z*depth*share;
  if(b){b.pos.x-=contact.normal.x*depth*(1-share);b.pos.z-=contact.normal.z*depth*(1-share);}
}

export function resolveVehiclePair(a,b,options={}) {
  const endA=pose(a),endB=pose(b),startA=pose(a,options.previousA),startB=pose(b,options.previousB);
  let contact=vehicleContact(a,b);
  const swept=(options.previousA||options.previousB)?sweepBoxContact(
    getVehicleCollider(a,startA),getVehicleCollider(a,endA),getVehicleCollider(b,startB),getVehicleCollider(b,endB)):null;
  if(swept&&!swept.initialOverlap){
    contact=swept;
    const atA=interpolate(startA,endA,swept.time),atB=interpolate(startB,endB,swept.time);
    let ax=endA.x-atA.x,az=endA.z-atA.z,bx=endB.x-atB.x,bz=endB.z-atB.z;
    const inward=Math.min(0,(ax-bx)*contact.normal.x+(az-bz)*contact.normal.z);
    const ia=inverseMass(a,options.inverseMassA),ib=inverseMass(b,options.inverseMassB),sum=ia+ib;
    const share=sum>EPS?ia/sum:.5;
    ax-=contact.normal.x*inward*share;az-=contact.normal.z*inward*share;
    bx+=contact.normal.x*inward*(1-share);bz+=contact.normal.z*inward*(1-share);
    a.pos.x=atA.x+ax;a.pos.z=atA.z+az;a.yaw=atA.yaw;
    b.pos.x=atB.x+bx;b.pos.z=atB.z+bz;b.yaw=atB.yaw;
    const overlap=vehicleContact(a,b);if(overlap)contact={...contact,depth:overlap.depth};
  }
  if(!contact)return null;
  Object.assign(contact,impulse(a,b,contact.normal,options));
  separate(a,b,contact,options);
  contact.point=support(getVehicleCollider(a),contact.normal);
  a.travelDistance=0;b.travelDistance=0;
  return contact;
}

export function resolveVehicleWorld(v,previousPose,colliders,options={}) {
  let from=pose(v,previousPose),to=pose(v),best=null,count=0;
  const skin=options.skin??SKIN;
  const report=(contact,obstacle)=>{
    Object.assign(contact,impulse(v,null,contact.normal,options));contact.obstacle=obstacle;
    contact.point=support(getVehicleCollider(v),contact.normal);count++;
    if(!best||contact.impactSpeed>best.impactSpeed)best=contact;
  };
  // Four contact planes cover a normal corner without an unbounded loop.
  for(let iteration=0;iteration<4;iteration++){
    const a0=getVehicleCollider(v,from),a1=getVehicleCollider(v,to);
    let earliest=null,obstacle=null;
    for(const item of colliders){
      const b=worldBox(item),r=a0.radius+b.radius;
      if(Math.min(a0.x,a1.x)-r>b.x||Math.max(a0.x,a1.x)+r<b.x||Math.min(a0.z,a1.z)-r>b.z||Math.max(a0.z,a1.z)+r<b.z)continue;
      const hit=sweepBoxContact(a0,a1,b);
      if(hit&&!hit.initialOverlap&&(!earliest||hit.time<earliest.time)){earliest=hit;obstacle=item;}
    }
    if(!earliest){v.pos.x=to.x;v.pos.z=to.z;v.yaw=to.yaw;break;}
    const at=interpolate(from,to,earliest.time),n=earliest.normal;
    let dx=to.x-at.x,dz=to.z-at.z;const inward=Math.min(0,dx*n.x+dz*n.z);
    dx-=inward*n.x;dz-=inward*n.z;
    v.pos.x=at.x+n.x*skin;v.pos.z=at.z+n.z*skin;v.yaw=at.yaw;
    report(earliest,obstacle);from=pose(v);to={x:from.x+dx,z:from.z+dz,yaw:from.yaw};
  }
  // An initial spawn overlap is pushed out, never rolled back into itself.
  for(let pass=0;pass<4;pass++){
    let changed=false;
    for(const item of colliders){
      const contact=boxContact(getVehicleCollider(v),worldBox(item));
      if(!contact||contact.depth<=EPS)continue;
      separate(v,null,contact,options);report(contact,item);changed=true;
    }
    if(!changed)break;
  }
  if(best){v.travelDistance=0;best.contacts=count;}
  return best;
}

export function pedestrianVehicleContact(position,radius,vehicle,previousPose=null) {
  if(!vehicleVerticalOverlap(position,vehicle,radius<.28?.8:1.8))return null;
  const b=getVehicleCollider(vehicle,previousPose),relative={x:position.x-b.x,z:position.z-b.z};
  const x=dot(relative,b.right),z=dot(relative,b.back);
  const dx=x-clamp(x,-b.halfWidth,b.halfWidth),dz=z-clamp(z,-b.halfLength,b.halfLength);
  const distance=Math.hypot(dx,dz);let nx,nz,depth;
  if(distance>radius)return null;
  if(distance>EPS){nx=dx/distance;nz=dz/distance;depth=radius-distance;}
  else{
    const side=b.halfWidth-Math.abs(x),end=b.halfLength-Math.abs(z);
    if(side<end){nx=x<0?-1:1;nz=0;depth=radius+side;}
    else{nx=0;nz=z<0?-1:1;depth=radius+end;}
  }
  return {normal:{x:b.right.x*nx+b.back.x*nz,z:b.right.z*nx+b.back.z*nz},depth,time:1,swept:false};
}

export function resolvePedestrianVehicle(position,radius,vehicle,previousPosition=null,options={}) {
  if(!vehicleVerticalOverlap(position,vehicle,options.actorHeight??(radius<.28?.8:1.8)))return null;
  let contact=pedestrianVehicleContact(position,radius,vehicle);
  const b1=getVehicleCollider(vehicle),b0=getVehicleCollider(vehicle,options.previousVehicle);
  if(previousPosition){
    // A swept square conservatively bounds the pedestrian circle. The final
    // overlap test is circular; this small safety margin prevents corner clips.
    const p0=box({...previousPosition,yaw:b0.yaw},radius,radius),p1=box({...position,yaw:b1.yaw},radius,radius);
    const swept=sweepBoxContact(p0,p1,b0,b1);
    if(swept&&!swept.initialOverlap){
      contact=swept;
      const relStart={x:previousPosition.x-b0.x,z:previousPosition.z-b0.z};
      const relEnd={x:position.x-b1.x,z:position.z-b1.z};
      let dx=(relEnd.x-relStart.x)*(1-swept.time),dz=(relEnd.z-relStart.z)*(1-swept.time);
      const inward=Math.min(0,dx*contact.normal.x+dz*contact.normal.z);
      dx-=contact.normal.x*inward;dz-=contact.normal.z*inward;
      position.x=b1.x+relStart.x+(relEnd.x-relStart.x)*swept.time+dx;
      position.z=b1.z+relStart.z+(relEnd.z-relStart.z)*swept.time+dz;
      const overlap=pedestrianVehicleContact(position,radius,vehicle);if(overlap)contact={...contact,depth:overlap.depth};
    }
  }
  if(!contact)return null;
  position.x+=contact.normal.x*(contact.depth+(options.skin??SKIN));
  position.z+=contact.normal.z*(contact.depth+(options.skin??SKIN));
  contact.impactSpeed=Math.max(0,dot(vehicleVelocity(vehicle),contact.normal));
  contact.point={x:position.x-contact.normal.x*radius,z:position.z-contact.normal.z*radius};
  return contact;
}
