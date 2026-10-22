// Physics runs at 60 Hz. Rendering may run at 30, 60, 120 Hz or an uneven cadence.
// Interpolate only the displayed pose; collision/Pilot/save state stays authoritative.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const wrap=n=>Math.atan2(Math.sin(n),Math.cos(n));
const wheelPose=v=>(v.wheels??[]).map(w=>({steer:w.pivot.rotation.y,spin:w.spinAngle??w.spin.rotation.x,y:w.pivot.position.y}));
export const PHYSICS_STEP=1/60;
export function captureVehiclePose(v){
 v.previousRenderPose??={position:v.pos.clone(),yaw:v.yaw,roll:v.bodyRoll??0};
 const p=v.previousRenderPose;p.position.copy(v.pos);p.yaw=v.yaw;p.roll=v.bodyRoll??0;
 if(v.physicsQuaternion)p.quaternion=v.physicsQuaternion.clone();else delete p.quaternion;
 p.wheels??=[];p.wheels.length=v.wheels?.length??0;p.wheelSource=v.wheels;
 for(let i=0;i<p.wheels.length;i++){const w=v.wheels[i],previous=p.wheels[i]??={};previous.steer=w.pivot.rotation.y;previous.spin=w.spinAngle??w.spin.rotation.x;previous.y=w.pivot.position.y;}
 p.steeringWheel=v.steeringWheel?.rotation.z;
}
export function resetVehiclePose(v){delete v.previousRenderPose;}
export function sampleVehiclePose(v,alpha=1){
 const p=v.previousRenderPose,t=clamp(alpha,0,1),wheels=wheelPose(v),steeringWheel=v.steeringWheel?.rotation.z;
 // Teleports, respawns and replaced cars must never fly through intervening scenery.
 if(!p||p.position.distanceToSquared(v.pos)>400)return{position:v.pos.clone(),yaw:v.yaw,roll:v.bodyRoll??0,quaternion:v.physicsQuaternion?.clone(),wheels,steeringWheel};
 // Wheel steering and rolling use the same two physics snapshots as the body.
 // Unwrapped spin preserves complete revolutions, including > PI in one tick.
 for(let i=0;i<wheels.length;i++)if(p.wheelSource===v.wheels&&p.wheels?.[i]){
  const previous=p.wheels[i],next=wheels[i];
  next.steer=previous.steer+wrap(next.steer-previous.steer)*t;
  next.spin=previous.spin+(next.spin-previous.spin)*t;
  next.y=Number.isFinite(previous.y)?previous.y+(next.y-previous.y)*t:next.y;
 }
 return{position:p.position.clone().lerp(v.pos,t),yaw:p.yaw+wrap(v.yaw-p.yaw)*t,roll:p.roll+((v.bodyRoll??0)-p.roll)*t,quaternion:p.quaternion&&v.physicsQuaternion?p.quaternion.clone().slerp(v.physicsQuaternion,t):v.physicsQuaternion?.clone(),wheels,
  steeringWheel:p.wheelSource===v.wheels&&Number.isFinite(p.steeringWheel)&&Number.isFinite(steeringWheel)?p.steeringWheel+(steeringWheel-p.steeringWheel)*t:steeringWheel};
}
export function applyVehiclePose(v,pose){
 const position=v.root.position.clone(),rotation=v.root.rotation.clone(),roll=v.chassis?.rotation.z;
 const wheels=(v.wheels??[]).map(w=>({steer:w.pivot.rotation.y,spin:w.spin.rotation.x,y:w.pivot.position.y})),steeringWheel=v.steeringWheel?.rotation.z;
 v.root.position.copy(pose.position);if(pose.quaternion)v.root.quaternion.copy(pose.quaternion);else v.root.rotation.set(0,pose.yaw,0);if(v.chassis)v.chassis.rotation.z=pose.roll;
 for(let i=0;i<(v.wheels?.length??0);i++)if(pose.wheels?.[i]){v.wheels[i].pivot.rotation.y=pose.wheels[i].steer;v.wheels[i].spin.rotation.x=wrap(pose.wheels[i].spin);if(Number.isFinite(pose.wheels[i].y))v.wheels[i].pivot.position.y=pose.wheels[i].y;}
 if(v.steeringWheel&&Number.isFinite(pose.steeringWheel))v.steeringWheel.rotation.z=pose.steeringWheel;
 return()=>{
  v.root.position.copy(position);v.root.rotation.copy(rotation);if(v.chassis)v.chassis.rotation.z=roll;
  for(let i=0;i<wheels.length;i++){v.wheels[i].pivot.rotation.y=wheels[i].steer;v.wheels[i].spin.rotation.x=wheels[i].spin;v.wheels[i].pivot.position.y=wheels[i].y;}
  if(v.steeringWheel)v.steeringWheel.rotation.z=steeringWheel;
 };
}
