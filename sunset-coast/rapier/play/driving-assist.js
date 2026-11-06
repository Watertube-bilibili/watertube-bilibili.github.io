import {effectiveBrakeDeceleration} from './vehicle-physics.js';
import {getVehicleCollider} from './vehicle-dynamics.js';
import {AEB_SENSITIVITY_PRESETS} from './assist-settings.js';
// Game-only FCW / AEB. Geometry is from the current Pilot path or the driver's
// predicted steering arc; every obstacle comes from measured camera output.
// Only the ego car's collider supplies its own size; no hidden road users,
// obstacle meshes, world geometry or collision lists are inspected.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
const separation=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const states=new WeakMap();

function cameraPoint(track,v){
 if(Number.isFinite(track.worldX)&&Number.isFinite(track.worldZ))return{x:track.worldX,z:track.worldZ};
 if(!Number.isFinite(track.distance)||!Number.isFinite(track.lateral))return null;
 return{x:v.pos.x-Math.sin(v.yaw)*track.distance+Math.cos(v.yaw)*track.lateral,z:v.pos.z-Math.cos(v.yaw)*track.distance-Math.sin(v.yaw)*track.lateral};
}
function corridor(game,input,state){
 // An early intervention can stop well before the usual low-speed horizon.
 // Keep checking the last observed braking target along the *current* path,
 // rather than losing it merely because ego speed fell. This extends only the
 // geometry corridor; a fresh camera observation is still required and the
 // existing .45/.85 s dropout bounds still release unseen threats.
 const heldRange=state.aeb?finite(state.brakingHazard?.distance)+10:0;
 const v=game.vehicle,speed=Math.max(0,v.speed),range=clamp(Math.max(speed*4.5+15,heldRange),18,110),points=[{x:v.pos.x,z:v.pos.z,s:0}];
 const pilot=game.pilot;
 if(game.autopilot&&pilot?.path?.length>1&&typeof pilot.at==='function'){
  let last=points[0],s=0;
  for(let d=1.5;d<=range;d+=1.5){const p=pilot.at(pilot.progress+d),length=separation(last,p);if(length<.001)break;s+=length;points.push({x:p.x,z:p.z,s});last=p;}
 }else{
  // Follow actual wheel angle, with a small command preview. A new steering
  // command cannot instantly make a real collision disappear from the arc.
  const wheelBase=finite(v.wheelBase,2.9),rear=finite(v.rearAxle,1.45),maxSteer=finite(v.maxSteer,.6);
  const grip=Math.atan(finite(v.lateralGrip,8)*wheelBase/Math.max(1,speed*speed));
  const steer=clamp(finite(v.steer)*.8+finite(input.steer)*.2,-Math.min(maxSteer,grip),Math.min(maxSteer,grip));
  const beta=Math.atan(rear/wheelBase*Math.tan(steer)),curvature=Math.cos(beta)*Math.tan(steer)/wheelBase;
  let yaw=v.yaw,x=v.pos.x,z=v.pos.z;
  for(let s=1.5;s<=range;s+=1.5){const middle=yaw+curvature*.75+beta;x-=Math.sin(middle)*1.5;z-=Math.cos(middle)*1.5;yaw+=curvature*1.5;points.push({x,z,s});}
 }
 return points;
}
function project(point,path){
 let best={distance:Infinity,s:0,tx:0,tz:-1};
 for(let i=0;i<path.length-1;i++){
  const a=path[i],b=path[i+1],dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz;
  if(l2<1e-8)continue;
  const t=clamp(((point.x-a.x)*dx+(point.z-a.z)*dz)/l2,0,1),distance=Math.hypot(point.x-a.x-dx*t,point.z-a.z-dz*t);
  if(distance<best.distance){const length=Math.sqrt(l2);best={distance,s:a.s+(b.s-a.s)*t,tx:dx/length,tz:dz/length,lateral:((point.x-a.x-dx*t)*-dz+(point.z-a.z-dz*t)*dx)/length,overrun:((point.x-a.x-dx*t)*dx+(point.z-a.z-dz*t)*dz)/length};}
 }
 return best;
}
function egoEnvelope(v){
 const body=getVehicleCollider(v),dx=body.x-v.pos.x,dz=body.z-v.pos.z;
 return{halfWidth:body.halfWidth,sideOffset:dx*Math.cos(v.yaw)-dz*Math.sin(v.yaw),front:Math.max(.5,body.halfLength-dx*Math.sin(v.yaw)-dz*Math.cos(v.yaw))};
}
const lateralClearance=(projection,ego)=>Math.hypot(projection.lateral-ego.sideOffset,projection.overrun);
function evaluateTrack(track,isStatic,game,path,state,frameAge,ego,thresholds){
 const v=game.vehicle,speed=Math.max(0,v.speed),confidence=finite(track.confidence),now=finite(game.time);
 const age=Math.max(frameAge,finite(track.age),Number.isFinite(track.lastSeen)?now-track.lastSeen:0);
 // Lost detections are not stationary objects. The bounded intervention latch
 // below bridges a brief occlusion; only observed geometry can start braking.
 if(confidence<(isStatic?.4:.32)||age>.32||track.visible===false||!Number.isFinite(track.distance)||track.distance<=.15||track.distance>110)return null;
 const world=cameraPoint(track,v);if(!world)return null;
 const p=project(world,path),pedestrian=track.cls===4,width=clamp(finite(track.width,pedestrian?.6:1.9),.1,isStatic?8:3.2),physicalRadius=ego.halfWidth+width*.5,radius=physicalRadius+.08;
 if(p.s<.25)return null;
 const key=track.id!=null?`${isStatic?'s':'t'}:${track.id}`:`s:${Math.round(world.x*2)}:${Math.round(world.z*2)}`;
 const sample=finite(track.lastSeen,finite(game.sensor?.data?.timestamp,now));
 let memory=state.tracks.get(key);
 if(!memory||sample-memory.sample>.4||sample<memory.sample)memory={first:sample,sample,inside:false,motionAt:-Infinity};
 const measured=!isStatic&&track.motionValid&&finite(track.motionConfidence)>.2&&Number.isFinite(track.vx)&&Number.isFinite(track.vz);
 if(measured){memory.vx=track.vx;memory.vz=track.vz;memory.motionAt=sample;}
 // Brief reacquisition must not replace a measured moving lead with zero speed.
 const retained=!isStatic&&!measured&&sample-memory.motionAt<=.4;
 const motion=measured||retained,vx=motion?memory.vx:0,vz=motion?memory.vz:0;
 const objectSpeed=vx*p.tx+vz*p.tz,sideSpeed=Math.abs(vx*p.tz-vz*p.tx),closing=Math.max(0,speed-objectSpeed);
 const lateral=lateralClearance(p,ego),gap=Math.max(0,p.s-ego.front),inside=lateral<radius+(memory.inside?.2:0),solid=lateral<physicalRadius;
 // Only the extra camera margin needs confirmation. Actual body overlap
 // triggers immediately, including thin posts beside the widest models. Once
 // confirmed, a small exit band
 // prevents lateral camera jitter from repeatedly engaging/disengaging AEB.
 if(!inside)memory.edgeSince=null;
 else if(memory.edgeSince==null)memory.edgeSince=sample;
 const confirmedOverlap=solid||memory.inside&&inside||inside&&sample-memory.edgeSince>=.12;
 memory.inside=confirmedOverlap;memory.sample=sample;memory.seen=now;state.tracks.set(key,memory);
 let collisionTime=null,collisionAhead=null;
 if(motion&&(pedestrian||sideSpeed>.6)){
  for(let t=.1;t<=3.25;t+=.1){
   const predicted=project({x:world.x+vx*t,z:world.z+vz*t},path);
   if(lateralClearance(predicted,ego)<physicalRadius&&Math.abs(predicted.s-speed*t)<ego.front+(pedestrian?.4:1.4)){
    collisionTime=t;collisionAhead=predicted.s;break;
   }
  }
 }
 if(!inside&&collisionTime===null)return null;
 if(pedestrian&&motion&&collisionTime===null&&!(inside&&gap<3.3))return null;
 const ttc=collisionTime??(closing>.2?gap/closing:Infinity);
 const brakingGap=Math.max(.25,(collisionAhead??p.s)-ego.front-1.35);
 const requiredDeceleration=(collisionTime!==null?speed*speed:closing*closing)/(2*brakingGap);
 const stoppingHold=confirmedOverlap&&gap<5&&Math.abs(objectSpeed)<1;
 const {deceleration,brakeThreshold,emergencyTtc}=thresholds;
 const warningTtc=clamp(2.2+speed*.035,2.3,3.15);
 const closingRisk=closing>.7||collisionTime!==null;
 const warning=closingRisk&&(ttc<warningTtc||requiredDeceleration>3.1)||inside&&gap<1.1&&closing>.2;
 // Relative closing speed, rather than ego speed alone, distinguishes a close
 // moving lead from an actual collision. First uncertain frames warn first,
 // except when delaying would already consume the available stopping room.
 // This only bypasses motion confirmation for an already observed, overlapping
 // threat. It never bypasses the AEB OFF switch or increases brake strength.
 const urgent=closingRisk&&(requiredDeceleration>deceleration*.94||ttc<.65);
 const motionConfirmed=isStatic||motion||sample-memory.first>=.18;
 const emergency=closingRisk&&(confirmedOverlap||collisionTime!==null)&&(motionConfirmed||urgent)&&
  ((ttc<emergencyTtc&&requiredDeceleration>2)||requiredDeceleration>brakeThreshold||gap<.7&&closing>.2);
 return{warning,emergency,stoppingHold,inside:confirmedOverlap,objectSpeed,world,ttc,distance:gap,requiredDeceleration,pedestrian,kind:pedestrian?'pedestrian':isStatic?'obstacle':'vehicle',id:track.id??null};
}

export function resetDrivingAssist(game){states.delete(game);game.assistTelemetry=null;}

// Settings can release just this actuator immediately without clearing held
// manual controls, Pilot service braking, or the independent FCW warning.
export function releaseAebIntervention(game){
 const state=states.get(game);if(state){state.aeb=false;state.clearTime=0;state.lostTime=0;}
 const t=game.assistTelemetry;if(t){t.aeb=false;t.aebEnabled=game.aebEnabled!==false&&game.assistSettings?.aebEnabled!==false;t.electronicBrake=0;t.reason=t.fcw?(t.kind==='pedestrian'?'注意横穿行人':'前向碰撞预警'):!t.perceptionAvailable?'摄像头视野受限':'AEB 已关闭 · 前碰撞预警独立工作';}
}

/** Return ordinary controls plus an independent electronicBrake channel.
 * Manual steer, pedal brake, handbrake and their source are preserved. */
export function evaluateDrivingAssist(game,input,dt=1/60){
 const controls={...input},v=game.vehicle,s=game.sensor?.data??{},now=finite(game.time);
 dt=clamp(finite(dt,1/60),.001,.1);
 let state=states.get(game);
 if(!state||state.vehicle!==v||state.position&&separation(state.position,v.pos)>25){state={vehicle:v,aeb:false,clearTime:0,warningTime:0,lastHazard:null,position:null,lostTime:0,tracks:new Map()};states.set(game,state);}
 state.position={x:v.pos.x,z:v.pos.z};
 const enabled=game.inCar!==false&&!game.transition,fcwEnabled=game.fcwEnabled!==false,aebEnabled=game.aebEnabled!==false&&game.assistSettings?.aebEnabled!==false;
 const requestedSensitivity=game.assistSettings?.aebSensitivity,aebSensitivity=typeof requestedSensitivity==='string'&&Object.hasOwn(AEB_SENSITIVITY_PRESETS,requestedSensitivity)?requestedSensitivity:'medium',preset=AEB_SENSITIVITY_PRESETS[aebSensitivity];
 const speed=Math.max(0,finite(v.speed)),deceleration=effectiveBrakeDeceleration(v),thresholds={deceleration,brakeThreshold:Math.min(preset.decelerationCap,deceleration*preset.decelerationRatio),emergencyTtc:clamp(preset.ttcBase+speed*preset.ttcPerSpeed,preset.ttcMin,preset.ttcMax)};
 const age=now-finite(s.timestamp,-100),available=enabled&&age>=-.1&&age<.65&&finite(s.confidence)>.08;
 let hazard=null,emergency=null,stopHold=false,observedThreat=false;
 for(const [key,memory] of state.tracks)if(now-memory.seen>.8)state.tracks.delete(key);
 if(available&&v.speed>-.2){
  const entries=[...(Array.isArray(s.tracks)?s.tracks:[]).map(t=>[t,false]),...(Array.isArray(s.staticObstacles)?s.staticObstacles:[]).map(t=>[t,true])],path=entries.length?corridor(game,input,state):[],ego=entries.length?egoEnvelope(v):null;
  for(const [track,isStatic] of entries){
   const risk=evaluateTrack(track,isStatic,game,path,state,Math.max(0,age),ego,thresholds);if(!risk)continue;
   const sameStoppedThreat=state.aeb&&risk.inside&&Math.abs(risk.objectSpeed)<1&&state.brakingHazard?.world&&separation(risk.world,state.brakingHazard.world)<4;
   if(risk.stoppingHold||sameStoppedThreat)stopHold=true;
   if(risk.emergency||risk.stoppingHold||sameStoppedThreat)observedThreat=true;
   if(risk.warning&&(!hazard||risk.ttc<hazard.ttc))hazard=risk;
   if(risk.emergency&&(!emergency||risk.ttc<emergency.ttc))emergency=risk;
  }
 }
 const reversingAway=!game.autopilot&&finite(input.throttle)<-.05&&v.speed<.5;
 if(!enabled||!aebEnabled||v.speed<-.2||reversingAway){state.aeb=false;state.clearTime=0;state.lostTime=0;}
 else if(emergency){state.aeb=true;state.clearTime=0;state.lostTime=0;state.lastHazard=emergency;state.brakingHazard=emergency;}
 else if(state.aeb){
  // FCW can remain on after emergency braking is no longer necessary. It
  // must not turn a small speed correction into a full stop. Bridge short
  // camera misses, but never hold an unseen vehicle indefinitely.
  state.clearTime=available&&!stopHold?state.clearTime+dt:0;
  state.lostTime=observedThreat?0:state.lostTime+dt;
  if(state.clearTime>.45||state.lostTime>.85){state.aeb=false;state.clearTime=0;state.lostTime=0;}
 }
 if(hazard||state.aeb){state.warningTime=.6;if(hazard)state.lastHazard=hazard;}else state.warningTime=Math.max(0,state.warningTime-dt);
 const fcw=enabled&&fcwEnabled&&(!!hazard||state.aeb||state.warningTime>0),aeb=enabled&&aebEnabled&&state.aeb;
 const last=hazard??(aeb||fcw?state.lastHazard:null),electronic=aeb?(v.speed>.6?1:.45):0;
 controls.electronicBrake=Math.max(finite(input.electronicBrake),electronic);
 if(aeb){
  // S/reverse while moving is the physical brake pedal in the game. Preserve
  // that held request when AEB suppresses propulsion, including fault counting.
  if(input.brakeSource!=='pilot'&&v.speed>1.2&&finite(input.throttle)<0)controls.brake=Math.max(typeof input.brake==='number'?input.brake:input.brake?1:0,-input.throttle);
  controls.throttle=0;
 }
 const reason=aeb?(last?.pedestrian?'行人危险 · 自动紧急制动':'碰撞危险 · 自动紧急制动'):fcw?(last?.pedestrian?'注意横穿行人':'前向碰撞预警'):!available?'摄像头视野受限':!aebEnabled?'AEB 已关闭 · 前碰撞预警独立工作':'碰撞辅助待命';
 game.assistTelemetry={fcw,aeb,fcwEnabled,aebEnabled,aebSensitivity,aebSensitivityLabel:preset.label,interventionTtc:thresholds.emergencyTtc,interventionDeceleration:thresholds.brakeThreshold,reason,ttc:last&&Number.isFinite(last.ttc)?last.ttc:null,distance:last?.distance??null,kind:last?.kind??null,requiredDeceleration:last?.requiredDeceleration??0,electronicBrake:electronic,perceptionAvailable:available,perceptionAge:Math.max(0,age),source:'camera-tracks',pathSource:game.autopilot&&game.pilot?.path?.length?'pilot':'steering'};
 return controls;
}
