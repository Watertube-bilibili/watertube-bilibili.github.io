/** Force controller, not a physics backend.
 * Ported from physics/source/roadster_{forces,air_reserve}.gd. Gameplay values only.
 * Caller owns gravity, rigid integration, terrain query, contacts and pose/save bridge.
 * Rapier's host supplies real collision queries for all original maneuvers.
 * Automatic jump catch retains the original bounded cushion impulse and input latch.
 */
import {Vector3 as V,Quaternion as Q} from './vendor/three.module.js';
import {createRoadsterManeuver,stepRoadsterManeuver,roadsterManeuverSnapshot} from './rapier-roadster-maneuver.js';
export const AIR_CAPABILITIES=Object.freeze({manualRocketForces:true,groundBoost:true,automaticJumpCatch:true,maneuvers:true,aircraft:false,gameplayReady:false});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const n=(x,d=0)=>Number.isFinite(x)?x:d;
const axis=(c,k)=>clamp(n(c[k]),-1,1);
const AIR_AXES=['roadsterPitch','roadsterRoll','roadsterYaw','roadsterVertical','roadsterForward','roadsterLateral'];
const trims={roadster:'performance',roadster_thrust:'thrust',roadster_rocket:'rocket'};
export class AirReserve {
 constructor(value=2400){this.units=clamp(n(value),0,2400);}
 pressure(){return clamp(this.units/360,0,1);}
 consume(demand,dt){
  if(!Number.isFinite(dt)||dt<=0||dt>.1||!Number.isFinite(demand)||demand<=0)return 0;
  const before=this.units;let remaining=dt;
  if(this.units>360){const time=Math.min(remaining,(this.units-360)/demand);this.units-=time*demand;remaining-=time;}
  if(remaining>0)this.units*=Math.exp(-demand*remaining/360);
  this.units=clamp(this.units,0,2400);return clamp((before-this.units)/(demand*dt),0,1);
 }
 refill(dt,{grounded,upright,speed,angularSpeed,spraying}){
  if(Number.isFinite(dt)&&dt>0&&dt<=.1&&grounded&&upright&&!spraying&&Number.isFinite(speed)&&speed>=0&&speed<.25&&Number.isFinite(angularSpeed)&&angularSpeed>=0&&angularSpeed<.2)this.units=Math.min(2400,this.units+8*dt);
 }
}
export function createRoadsterAirController({modelId,instanceId,airUnits,charge,resetSerial=0}){
 if(!Object.hasOwn(trims,modelId)||!Number.isSafeInteger(resetSerial)||resetSerial<0||typeof instanceId!=='string'||!instanceId||instanceId.length>96||['__proto__','constructor','prototype'].includes(instanceId))throw Error('Roadster identity required');
 const units=airUnits!==undefined?n(airUnits):charge!==undefined?n(charge)*24:2400;
 return {modelId,instanceId,trim:trims[modelId],reserve:new AirReserve(units),resetSerial,mode:'road',previousAir:false,previousRecover:false,launching:false,landingTime:0,recoveryTime:0,rollTarget:0,wing:0,airborneTime:0,automaticAirborne:false,automaticInputLatch:{},automaticCushionImpulse:20,maneuver:createRoadsterManeuver()};
}
export function cloneRoadsterAirController(s){return{...s,reserve:new AirReserve(s.reserve.units),automaticInputLatch:{...s.automaticInputLatch},maneuver:structuredClone(s.maneuver??createRoadsterManeuver())};}
// Repair/reset is edge-triggered by serial and NEVER refills the air inventory.
export function resetRoadsterAirController(s,serial){
 if(!Number.isSafeInteger(serial)||serial<0)throw Error('Invalid reset serial');
 if(serial<=s.resetSerial)return false;
 const maneuver=createRoadsterManeuver();maneuver.serial=s.maneuver?.serial??0;maneuver.lastSerial=s.maneuver?.lastSerial??0;
 Object.assign(s,{resetSerial:serial,mode:'road',previousAir:true,previousRecover:false,launching:false,landingTime:0,recoveryTime:0,rollTarget:0,wing:0,airborneTime:0,automaticAirborne:false,automaticInputLatch:{},automaticCushionImpulse:20,maneuver});return true;
}
const limit=(v,m)=>v.length()>m?v.multiplyScalar(m/v.length()):v;
/** Pure wrench output; no position or velocity mutations and no native snapshot impersonation.
 * body uses shared 6DOF convention: config.mass, orientation Q, velocity V,
 * angularVelocity V, body-frame diagonal inertia V. terrain.grounded + altitude
 * must be obtained from real contacts/raycast, not inferred from render height.
 */
export function stepRoadsterAir(s,body,c,dt,terrain){
 const draft=cloneRoadsterAirController(s);
 const result=advanceRoadsterAir(draft,body,c,dt,terrain);
 if(![...result.force.toArray(),...result.torque.toArray(),result.demand,result.scale,result.batteryUsed,draft.reserve.units].every(Number.isFinite))throw Error('Nonfinite air controller result');
 Object.assign(s,draft);return result;
}
function advanceRoadsterAir(s,body,c,dt,terrain){
 if(!Number.isFinite(dt)||dt<=0||dt>1/60+1e-10)throw Error('Fixed substep required');
 const m=body.config.mass,q=body.orientation;
 if(!(Number.isFinite(m)&&m>0)||![...q.toArray(),...body.velocity.toArray(),...body.angularVelocity.toArray(),...body.inertia.toArray(),terrain.altitude].every(Number.isFinite)||body.inertia.toArray().some(x=>x<=0)||Math.abs(q.length()-1)>1e-6||terrain.altitude<0||typeof terrain.grounded!=='boolean')throw Error('Invalid rigid body/contact input');
 const grounded=terrain.grounded,altitude=terrain.altitude,up=new V(0,1,0).applyQuaternion(q),forward=new V(0,0,-1).applyQuaternion(q),velocity=body.velocity,omega=body.angularVelocity;
 const healthy=n(c.condition,100)>0&&n(c.battery,100)>0,air=c.roadsterAir===true&&s.trim==='rocket',recover=c.roadsterRecover===true&&s.trim==='rocket';
 let warning='',boost=0,lift=0,cushion=0,autoStabilizing=false,automaticCushionRequested=0;
 if(air&&!s.previousAir&&s.mode==='road'){
  if(healthy&&up.y>.6&&velocity.length()<25){s.mode='air';s.automaticAirborne=false;s.rollTarget=Math.atan2(new V(1,0,0).applyQuaternion(q).y,up.y);s.launching=grounded||altitude<1.5;s.landingTime=0;}else warning='起飞条件未满足';
 }
 s.previousAir=air;
 if(recover&&!s.previousRecover&&s.mode==='road'&&healthy&&velocity.length()<3&&altitude<1.8){s.mode='recover';s.recoveryTime=0;}
 s.previousRecover=recover;
 s.airborneTime=!grounded&&altitude>.65?s.airborneTime+dt:0;
 if(s.trim==='rocket'&&s.mode==='road'&&healthy&&s.airborneTime>=.12){
  s.mode='landing';s.automaticAirborne=true;s.automaticCushionImpulse=20;s.automaticInputLatch={};
  for(const key of AIR_AXES)if(Math.abs(axis(c,key))>.01)s.automaticInputLatch[key]=axis(c,key);
  if(c.roadsterAirBrake===true)s.automaticInputLatch.roadsterAirBrake=true;
  s.launching=false;s.landingTime=0;s.rollTarget=Math.atan2(new V(1,0,0).applyQuaternion(q).y,up.y);
 }
 const special=stepRoadsterManeuver(s.maneuver,body,c,dt,{grounded,altitude,mode:s.mode,healthy,trim:s.trim,query:terrain.maneuverQueries});
 if(special.controlled){s.mode=special.landing?'landing':'air';s.launching=false;s.automaticAirborne=false;}
 else if(special.stopped)s.mode=grounded?'road':special.land?'landing':'air';
 else if(special.finished)s.mode=special.landed?'road':'air';
 if(s.mode==='air'&&!air&&s.maneuver.status!=='active'&&Object.keys(special).length===0){s.mode='landing';s.launching=false;}
 if(!healthy){if(s.mode!=='road')s.mode=grounded?'road':'unpowered';warning=n(c.condition,100)<=0?'动力损坏':'车辆电量耗尽';}
 if(s.mode==='unpowered'&&grounded)s.mode='road';
 if(s.mode==='landing'){s.landingTime=grounded&&up.y>.7&&Math.abs(velocity.y)<1?s.landingTime+dt:0;if(s.landingTime>.3)s.mode='road';}
 if(s.mode==='recover'){s.recoveryTime+=dt;if(s.recoveryTime>3||!recover||up.y>.98&&omega.length()<.25)s.mode=grounded?'road':'landing';}
 if(s.mode==='road'){s.automaticAirborne=false;s.automaticInputLatch={};}
 let flightControls=c,manualAirControl=false;
 if(s.automaticAirborne){
  flightControls={...c};
  for(const key of Object.keys(s.automaticInputLatch)){
   const held=key==='roadsterAirBrake'?c[key]===true:axis(c,key)*s.automaticInputLatch[key]>.001;
   if(held)flightControls[key]=key==='roadsterAirBrake'?false:0;else delete s.automaticInputLatch[key];
  }
  manualAirControl=AIR_AXES.some(key=>Math.abs(axis(flightControls,key))>.01)||flightControls.roadsterAirBrake===true;
 }
 if(s.automaticAirborne&&healthy&&!recover&&['air','landing'].includes(s.mode)&&s.maneuver.status!=='active'&&!special.controlled){
  if(air){s.automaticAirborne=false;s.automaticInputLatch={};flightControls=c;s.mode='air';}
  else if(manualAirControl)s.mode='air';
 }
 const active=['air','landing','recover'].includes(s.mode)&&healthy,automaticFall=s.automaticAirborne&&s.mode==='landing'&&!air&&!recover&&!manualAirControl&&!special.controlled,force=new V(),torque=new V();let demand=0;
 const request=f=>{force.add(f);demand+=f.length()/m;};
 if(active){
  const vertical=axis(flightControls,'roadsterVertical');if(altitude>2)s.launching=false;
  let target=vertical*(vertical>=0?4:2);if(s.launching)target=Math.max(target,2.6);
  if(s.mode==='landing')target=altitude>6?-2.5:altitude>1.4?-1.3:-.65;
  else if(s.mode==='recover')target=altitude<1.2?.9:0;
  if(special.controlled)target=special.vertical;
  if(altitude>60)target=Math.min(target,-Math.min(2,(altitude-60)*.4));
  let cushioning=s.mode==='landing'&&altitude<6&&velocity.y<0;
  let liftAccel=clamp(9.81+(target-velocity.y)*(cushioning?4.5:3.5),0,cushioning?26:18);
  if(automaticFall){
   liftAccel=0;cushioning=altitude<6&&velocity.y<-.8&&altitude/Math.max(.8,-velocity.y)<.65&&s.automaticCushionImpulse>0;
   if(cushioning){const needed=Math.max(0,(velocity.y*velocity.y-.64)/(2*Math.max(.12,altitude-.12)));liftAccel=Math.min(26,9.81+needed,s.automaticCushionImpulse/dt);automaticCushionRequested=liftAccel;}
  }
  request(new V(0,m*liftAccel,0));lift=clamp(liftAccel/18,0,1);cushion=cushioning?clamp((liftAccel-9.81)/16.19,0,1):0;
  const heading=new V(forward.x,0,forward.z);if(heading.lengthSq()<.001)heading.set(0,0,-1);heading.normalize();const right=heading.clone().cross(new V(0,1,0));
  const f=s.mode==='air'&&!recover?axis(flightControls,'roadsterForward'):0,l=s.mode==='air'&&!recover?axis(flightControls,'roadsterLateral'):0,brake=flightControls.roadsterAirBrake===true||s.mode!=='air'||recover;
  const accel=brake?new V():limit(heading.multiplyScalar(f*8).addScaledVector(right,l*5),8);
  let maneuverAccel=limit(accel.addScaledVector(new V(velocity.x,0,velocity.z),brake?-1.1:-.32),20);
  if(special.controlled)maneuverAccel=special.acceleration;
  else if(automaticFall)maneuverAccel=new V();
  else if(special.braking)maneuverAccel=limit(new V(velocity.x,0,velocity.z).multiplyScalar(-4),20);
  request(maneuverAccel.clone().multiplyScalar(m));boost=Math.abs(f)*.6;
  const level=special.controlled?special.level:recover||s.mode==='recover',roll=level?0:special.controlled?special.roll:axis(flightControls,'roadsterRoll');let feed=0;
  if(level)s.rollTarget=0;else if(Math.abs(roll)>.001){feed=roll*3.4;s.rollTarget=((s.rollTarget-feed*dt+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;}else{const old=s.rollTarget;s.rollTarget+=clamp(-s.rollTarget,-1.15*dt,1.15*dt);feed=(old-s.rollTarget)/dt;}
  autoStabilizing=level||Math.abs(roll)<=.001;
  const yaw=Math.atan2(-forward.x,-forward.z),targetQ=new Q().setFromAxisAngle(new V(0,1,0),yaw).multiply(new Q().setFromAxisAngle(new V(1,0,0),level?0:axis(flightControls,'roadsterPitch')*.36)).multiply(new Q().setFromAxisAngle(new V(0,0,1),s.rollTarget));
  const error=targetQ.multiply(q.clone().invert()).normalize();if(error.w<0){error.x*=-1;error.y*=-1;error.z*=-1;error.w*=-1;}
  const rotation=new V(error.x,error.y,error.z),length=rotation.length();if(length>1e-5)rotation.multiplyScalar(2*Math.atan2(length,clamp(error.w,-1,1))/length);else rotation.set(0,0,0);
  const desired=new V(0,level?0:axis(flightControls,'roadsterYaw')*.8,0).addScaledVector(forward,feed).sub(omega).multiplyScalar(5).addScaledVector(rotation,10);
  torque.copy(limit(desired.applyQuaternion(q.clone().invert()).multiply(body.inertia).applyQuaternion(q),m*12));demand+=torque.length()/(m*2);
 }else if(s.trim!=='performance'&&healthy&&c.roadsterBoost&&grounded&&up.y>.65){
  const throttle=Math.max(0,axis(c,'throttle'));if(throttle>.1&&n(c.manualBrake)<.05&&n(c.electronicBrake)<.05&&!c.handbrake){boost=throttle;request(forward.clone().multiplyScalar(m*19*throttle*clamp((80-velocity.length())/15,0,1)));}
 }
 if(special.groundPrepare&&healthy)request(special.acceleration.clone().multiplyScalar(m));
 const scale=s.reserve.consume(demand,dt);s.automaticCushionImpulse=Math.max(0,s.automaticCushionImpulse-automaticCushionRequested*scale*dt);force.multiplyScalar(scale);torque.multiplyScalar(scale);boost*=scale;lift*=scale;cushion*=scale;
 const eligible=grounded&&up.y>.65&&velocity.length()<.25&&omega.length()<.2&&demand===0&&!active;
 s.reserve.refill(dt,{grounded,upright:up.y>.65,speed:velocity.length(),angularSpeed:omega.length(),spraying:demand>0||active});
 if(s.reserve.units<360&&demand>0)warning=s.reserve.units>0?'储气不足：推力降低':'储气耗尽';
 const braking=Math.max(n(c.manualBrake),n(c.electronicBrake)),wingTarget=active||braking>.15||c.roadsterWingMode==='raised'||(c.roadsterWingMode??'auto')==='auto'&&velocity.length()>20?1:0;s.wing+=clamp(wingTarget-s.wing,-dt*1.4,dt*1.4);
 const local=force.clone().multiplyScalar(1/m).applyQuaternion(q.clone().invert()),angular=torque.clone().applyQuaternion(q.clone().invert()).divide(body.inertia);
 const jet=(value,den)=>clamp(value/den,0,1),jets={up:jet(local.y,26),down:jet(-local.y,26),forward:jet(-local.z,8),reverse:jet(local.z,8),right:jet(local.x,8),left:jet(-local.x,8),pitchUp:jet(angular.x,12),pitchDown:jet(-angular.x,12),rollRight:jet(-angular.z,12),rollLeft:jet(angular.z,12),yawLeft:jet(angular.y,12),yawRight:jet(-angular.y,12)};
 return {force,torque,demand,scale,energyKind:'battery' ,batteryUsed:dt*(Math.abs(velocity.dot(forward))*.0008+lift*.06+boost*.04),telemetry:{source:'browser-force-controller',vehicleInstanceId:s.instanceId,trim:s.trim,mode:s.mode,jets,heat:0,automaticAirborne:s.automaticAirborne,rollRate:omega.dot(forward),airUnits:s.reserve.units,airCapacity:2400,airPressure:s.reserve.pressure(),charge:s.reserve.units/24,airSpraying:demand>0,airRefillEligible:eligible,boost,lift,wing:s.wing,wingPitch:s.wing*(braking>.15?.6:.35),altitude,verticalSpeed:velocity.y,warning,autoStabilizing,landingCushion:cushion,maneuver:roadsterManeuverSnapshot(s.maneuver)}};
}
/** Explicit browser telemetry bridge, never calls applyNativeSnapshot. Does not own pose.
 * Host still needs to commit the 6DOF body/contact state and render interpolation.
 */
export function commitRoadsterAirTelemetry(v,s,result){
 if(v.instanceId!==s.instanceId||v.model?.id!==s.modelId||result.telemetry?.vehicleInstanceId!==s.instanceId)throw Error('Roadster identity mismatch');
 if(!Number.isFinite(result.telemetry.airUnits)||result.telemetry.airUnits<0||result.telemetry.airUnits>2400||!Number.isFinite(result.batteryUsed)||result.batteryUsed<0)throw Error('Invalid air telemetry');
 v.roadsterAirUnits=result.telemetry.airUnits;v.roadsterCharge=v.roadsterAirUnits/24;
 const previousMode=v.roadsterState?.mode,previousManeuver=v.roadsterState?.maneuver,maneuver=result.telemetry.maneuver;
 v.roadsterState={...v.roadsterState,...result.telemetry};
 const request=v.roadsterRequest??={air:false,wingMode:'auto'};
 if(maneuver.serial>=(request.actionSerial??0)){
  request.pending=false;
  if((previousManeuver?.status!==maneuver.status||previousManeuver?.serial!==maneuver.serial||previousMode!==result.telemetry.mode)&&['active','complete','cancelled'].includes(maneuver.status)&&result.telemetry.mode==='air'&&result.telemetry.automaticAirborne!==true)request.air=true;
 }
 if(result.telemetry.mode==='road'&&maneuver.status==='complete'&&(previousManeuver?.status!==maneuver.status||previousManeuver?.serial!==maneuver.serial))request.air=false;
 if(['unpowered','landing'].includes(result.telemetry.mode)||result.telemetry.warning==='起飞条件未满足'){v.roadsterRequest??={air:false,wingMode:'auto'};v.roadsterRequest.air=false;}
 v.battery=Math.max(0,n(v.battery)-result.batteryUsed);
 // Fuel/ICE faults, stable instance identity, resetSerial and saved pose unchanged.
}
