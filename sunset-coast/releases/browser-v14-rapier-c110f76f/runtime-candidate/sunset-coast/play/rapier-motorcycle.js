// Existing motorcycle tire/balance force law, applied to official Rapier bodies.
// No position, velocity, quaternion integration or chassis contact solve lives here.
import {Vector3 as V} from './vendor/three.module.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),approach=(x,y,d)=>x+clamp(y-x,-d,d),vec=a=>new V(...a);
const pointVelocity=(b,r)=>b.velocity.clone().add(b.angularVelocity.clone().cross(r));
export function motorcycleWheelWrench(b,input,dt,surface){
 if(!(dt>0&&dt<=1/60+1e-10)||typeof surface?.raycast!=='function')throw Error('Fixed <=60 Hz substep and surface raycast required');
 const cfg=b.config,m=cfg.mass,q=b.orientation,up=new V(0,1,0).applyQuaternion(q),forward=new V(0,0,-1).applyQuaternion(q),right=new V(1,0,0).applyQuaternion(q);
 const speed=b.velocity.dot(forward),grip=clamp(cfg.lateralGrip,3,14),wheelbase=cfg.wheelOffsets[1][2]-cfg.wheelOffsets[0][2];
 const limit=Math.min(cfg.maxSteer,Math.atan(grip*wheelbase/Math.max(1,speed*speed)));
 b.steer=approach(b.steer,clamp(Number(input.steer)||0,-limit,limit),dt*2.4);
 const manual=input.manualBrakeBroken?0:clamp(Number(input.brake)||0,0,1);
 if(input.manualBrakeBroken)b.manualPressure=0;
 b.manualPressure=approach(b.manualPressure,manual,dt*(manual>b.manualPressure?24:30));
 b.brakeAmount=Math.max(b.manualPressure,clamp(Number(input.electronicBrake)||0,0,1));
 let throttle=clamp(Number(input.throttle)||0,-1,1);
 // Preserve braking-on-reverse input; never fire an ICE-only failure on EV.
 if(throttle<0&&speed>1.2){b.brakeAmount=Math.max(b.brakeAmount,-throttle);throttle=0;}
 const brakeAccel=b.brakeAmount*Math.min(8.4,grip*.9);
 let drive=throttle*clamp(cfg.power,0,14);
 const energyAvailable=(input.energy??100)>0;
 if((input.condition??100)<=0||!energyAvailable||b.brakeAmount>.01||(cfg.powertrain==='combustion'&&input.engineStalled))drive=0;
 if(speed*Math.sign(drive)>=(drive>=0?cfg.maxSpeed:2))drive=0;
 const force=new V(),torque=new V(),normals=new V();
 const apply=(f,r)=>{force.add(f);torque.add(r.clone().cross(f));};
 b.supportCount=0;b.contacts=[];b.compressions=[0,0];b.balanceTorque=0;
 for(let i=0;i<2;i++){
  const geometry=cfg.wheelOffsets[i],mount=vec(geometry.slice(0,3)).applyQuaternion(q),origin=b.position.clone().add(mount);
  let hit=surface.raycast(origin,up.clone().negate(),.90);
  if(hit&&up.y>.5){
   const compression=1-origin.distanceTo(hit.position);
   const center=origin.clone().addScaledVector(up,geometry[4]-.82+compression-.18);
   const foot=surface.raycast(new V(center.x,origin.y,center.z),new V(0,-1,0),.90/up.y);
   if(foot&&foot.normal.dot(up)>=.3&&foot.position.y>hit.position.y+.0001)hit=foot;
  }
  if(!hit||hit.normal.dot(up)<.4)continue;
  const compression=Math.max(0,1-origin.clone().sub(hit.position).dot(up));if(compression<=0)continue;
  const normal=hit.normal.clone().normalize(),support=clamp((9.81*.5+(compression-.18)*36-pointVelocity(b,mount).dot(normal)*3.6)*m,0,m*9.81*1.2);
  b.supportCount++;b.compressions[i]=compression;normals.add(normal);apply(normal.clone().multiplyScalar(support),mount);
  const tireForward=forward.clone().applyAxisAngle(up,i===0?b.steer:0);tireForward.addScaledVector(normal,-tireForward.dot(normal)).normalize();
  const tireRight=tireForward.clone().cross(normal).normalize(),tireOffset=new V(geometry[0],geometry[4]-.72-geometry[3],geometry[2]).applyQuaternion(q);
  const velocity=pointVelocity(b,tireOffset),longitudinal=velocity.dot(tireForward),lateral=velocity.dot(tireRight);
  let brakeForce=m*brakeAccel*(i===0?.65:.35);if(i===1&&input.handbrake)brakeForce=Math.max(brakeForce,m*3);
  brakeForce=Math.min(brakeForce,Math.abs(longitudinal)*m*.5/dt);
  let fx=(i===1&&up.y>.5?m*drive:0)-Math.sign(longitudinal)*brakeForce,fy=-lateral*m*3;
  const maxForce=support*grip/9.81,scale=Math.min(1,maxForce/(Math.hypot(fx,fy)||1));fx*=scale;fy*=scale;
  apply(tireForward.multiplyScalar(fx).addScaledVector(tireRight,fy),tireOffset);
  b.contacts.push({wheel:i,position:hit.position.clone(),normal,support,propulsion:i===1?Math.max(0,fx):0,tractionMagnitude:Math.hypot(fx,fy),tractionLimit:maxForce});
 }
 if(b.supportCount&&up.y>.55){
  const groundUp=normals.normalize(),lean=input.occupied===false?0:clamp(Math.atan(speed*speed*Math.tan(b.steer)/wheelbase/9.81),-.42,.42);
  const groundRight=right.clone().addScaledVector(groundUp,-right.dot(groundUp)).normalize();
  const desired=groundUp.multiplyScalar(Math.cos(lean)).addScaledVector(groundRight,-Math.sin(lean)).normalize();
  const error=up.clone().cross(desired).dot(forward),rollVelocity=b.angularVelocity.dot(forward);
  b.balanceTorque=m*clamp(error*26-rollVelocity*5.5,-8,8);torque.addScaledVector(forward,b.balanceTorque);
 }
 const planar=new V(b.velocity.x,0,b.velocity.z),ps=planar.length();if(ps>.001)force.addScaledVector(planar.normalize(),-m*Math.min(.12+.0012*ps*ps,ps/dt));
 // Energy units are host's existing percent-like display, not kWh/litres.
 // No shared battery/fuel writes here: host selects energyKind explicitly.
 if(energyAvailable&&drive!==0)b.energyUsed+=Math.abs(speed)*dt*.0008;
 b.time+=dt;b.speed=b.velocity.dot(new V(0,0,-1).applyQuaternion(q));
 if(![...b.position.toArray(),...b.velocity.toArray(),...b.angularVelocity.toArray(),...q.toArray()].every(Number.isFinite))throw Error('Non-finite motorcycle body');
 return {force,torque};
}
