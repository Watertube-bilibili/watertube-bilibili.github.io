// LOCAL EXPERIMENT ONLY. Ordinary manual Rocket flight and 4-wheel road driving.
// Shared finite3D contacts, actual body pose and force telemetry; no Godot flag.
import {Vector3 as V,Quaternion as Q} from './vendor/three.module.js';
import {BrowserRoadsterSurface} from './browser-roadster-surface.js';
import {BrowserMotorcycleAdapter} from './browser-motorcycle-adapter.js';
import {resolveMotorcyclePlane} from './browser-motorcycle-rigidbody.js';
import {staticBox,snapshotBody,collideBodies,collideBodyTriangle} from './browser-rigidbody-contacts.js';
import {getVehicleCollider} from './vehicle-dynamics.js';
import {createRoadsterAirController,stepRoadsterAir,commitRoadsterAirTelemetry,AirReserve} from './browser-roadster-air.js';
import {roadsterAirUnits,rememberRoadsterAir} from './roadster-air-ledger.js';
import {createRoadsterWheels,roadsterWheelWrench} from './browser-roadster-wheels.js';
import {integrateAirWrench} from './browser-air-rigidbody.js';
import {browserRoadsterControls} from './browser-roadster-controls.js';
import {captureVehiclePose,resetVehiclePose} from './render-motion.js';
import {updateVehicleVisuals} from './vehicle-physics.js';
export const BROWSER_ROADSTER_IDS=Object.freeze(['roadster','roadster_thrust','roadster_rocket']);
const Y=new V(0,1,0),COM=new V(0,.72,0);
export class BrowserRoadsterAdapter extends BrowserMotorcycleAdapter {
 constructor(game){super(game);this.surface=new BrowserRoadsterSurface(game.world);}
 begin(){for(const c of this.game.world.colliders??[])staticBox(c);this.surface.refresh();this.tickContacts.clear();this.stepped.clear();const desired=new Set(this.game.allVehicles());for(const [v,e]of this.states)if(!desired.has(v)){rememberRoadsterAir(this.game,v);this.states.delete(v);delete v.browserRoadsterBody;}for(const e of this.states.values())e.previous=snapshotBody(e.body);}
 checkpoint(){const undo=super.checkpoint(),ledger=structuredClone(this.game.roadsterAirLedger),extras=[...this.states].map(([v,e])=>[e,structuredClone(e.wheels),{...e.air,reserve:new AirReserve(e.air.reserve.units)}]),visible=this.game.allVehicles().filter(v=>BROWSER_ROADSTER_IDS.includes(v.model.id)).map(v=>[v,structuredClone(v.roadsterState),structuredClone(v.roadsterRequest),v.roadsterTires?structuredClone(v.roadsterTires):null]);return()=>{undo();if(ledger===undefined)delete this.game.roadsterAirLedger;else this.game.roadsterAirLedger=ledger;for(const[e,wheels,air]of extras){e.wheels=wheels;e.air=air;}for(const[v,state,request,tires]of visible){v.roadsterRequest=request;v.roadsterState=state;v.roadsterTires=tires;}};}

 config(v){const c=getVehicleCollider(v),height=Math.max(.7,(v.height??1.5)-.35);return{mass:v.mass??v.model.mass,size:[Math.max(1.2,c.halfWidth*2-.08),height,c.halfLength*2-.1],collisionOffset:[c.offsetX??0,.2+height/2-.72,c.offsetZ??0],power:v.model.power,maxSpeed:v.model.max,lateralGrip:v.lateralGrip??v.model.tireGrip??11.8,maxSteer:v.maxSteer??.55,wheelBase:v.wheelBase??2.9,track:v.track??1.65,wheelOffsets:[true,false].flatMap(front=>[-1,1].map(side=>{const w=v.wheels.find(w=>w.front===front&&w.side===side);return[w.pivot.position.x,.1,w.pivot.position.z,w.radius,w.suspensionRestY??w.pivot.position.y];}))};}
 state(v){let e=this.states.get(v);const serial=v.physicsResetSerial??0,changed=e&&(serial>e.serial||e.published.distanceToSquared(v.pos)>1e-8||Math.abs(e.yaw-v.yaw)>1e-5);
  if(!e||changed){const cfg=this.config(v),q=new Q().setFromAxisAngle(Y,v.yaw??0),m=cfg.mass,[w,h,l]=cfg.size;
   if(![m,w,h,l,cfg.power,cfg.maxSpeed,cfg.lateralGrip,cfg.maxSteer,cfg.wheelBase,cfg.track].every(x=>Number.isFinite(x)&&x>0))throw Error('Invalid Roadster rigid configuration');
   const body={config:cfg,position:v.pos.clone().add(COM.clone().applyQuaternion(q)),orientation:q,velocity:new V(-Math.sin(v.yaw)*(v.speed??0),0,-Math.cos(v.yaw)*(v.speed??0)),angularVelocity:new V(),inertia:new V(m*(h*h+l*l)/12,m*(w*w+l*l)/12,m*(w*w+h*h)/12)};
   const air=createRoadsterAirController({modelId:v.model.id,instanceId:v.instanceId,airUnits:roadsterAirUnits(v),resetSerial:serial});if(e)air.previousAir=true;
   e={body,air,wheels:createRoadsterWheels(cfg,v.speed??0),previous:snapshotBody(body),serial,published:v.pos.clone(),yaw:v.yaw,grounded:false};this.states.set(v,e);resetVehiclePose(v);v.browserRoadsterBody=true;
  }return e;
 }
 finish(dt){for(const v of this.game.allVehicles())if(BROWSER_ROADSTER_IDS.includes(v.model.id)&&!this.stepped.has(v))this.step(v,{throttle:0,steer:0,brake:1},dt,false);}
 step(v,input,dt,isPlayer){this.stepped.add(v);if(v.structuralWheelPreview)throw Error('Structural Roadster wheels not supported');const e=this.state(v),b=e.body;captureVehiclePose(v);e.previous=snapshotBody(b);e.oldPosition=v.pos.clone();e.oldSpeed=v.speed;
  const c=browserRoadsterControls(v,input,dt);const wheels=roadsterWheelWrench(b,e.wheels,c,dt,this.surface,{...v.roadsterState,trim:e.air.trim,mode:e.air.mode,wing:e.air.wing});
  const groundRay=this.surface.raycast(b.position,new V(0,-1,0),1000),altitude=groundRay?Math.max(0,groundRay.distance-.72):1000;
  const result=stepRoadsterAir(e.air,b,c,dt,{grounded:e.wheels.supportCount>0||e.grounded,altitude});
  integrateAirWrench(b,{force:result.force.clone().add(wheels.force),torque:result.torque.clone().add(wheels.torque)},dt);
  e.grounded=e.wheels.supportCount>0;
  const reach=Math.hypot(...b.config.size)/2+Math.hypot(...(b.config.collisionOffset??[0,0,0]))+b.position.distanceTo(e.previous.position);
  for(const collider of this.game.world.colliders??[]){const h=collider.height??10;if(Math.hypot(collider.x-b.position.x,(collider.baseY??0)+h/2-b.position.y,collider.z-b.position.z)>Math.hypot(collider.w,collider.d,h/2)+reach)continue;const hit=collideBodies(b,staticBox(collider),e.previous);if(hit){this.remember(v,collider.id??collider,hit);if(hit.normal.y>.4)e.grounded=true;}}
  for(const face of this.surface.nearby(b,e.previous)){const hit=collideBodyTriangle(b,face,e.previous);if(hit){if(hit.impactSpeed>1)this.remember(v,face,hit);if(hit.normal.y>.4)e.grounded=true;}}
  const world=this.game.world,height=world.groundHeight?.(b.position.x,b.position.z)??0,normal=this.surface.normal(b.position.x,b.position.z),point=new V(b.position.x,height,b.position.z),hit=resolveMotorcyclePlane(b,{normal,offset:point.dot(normal),friction:.6});if(hit){if(hit.impactSpeed>1)this.remember(v,'terrain',hit);e.grounded=true;}
  if(world.bounds){for(const [n,o]of [[new V(1,0,0),world.bounds.minX+2],[new V(-1,0,0),-world.bounds.maxX+2],[new V(0,0,1),world.bounds.minZ+2],[new V(0,0,-1),-world.bounds.maxZ+2]]){const hit=resolveMotorcyclePlane(b,{normal:n,offset:o});if(hit)this.remember(v,'boundary',hit);}}
  if(!isPlayer)result.batteryUsed=0;commitRoadsterAirTelemetry(v,e.air,result);this.publish(v,e,dt);rememberRoadsterAir(this.game,v);
 }
 publish(v,e,dt=0){const b=e.body,t=e.wheels,oldSpeed=e.oldSpeed??v.speed,oldPosition=e.oldPosition??v.pos.clone();v.physicsQuaternion??=new Q();v.physicsQuaternion.copy(b.orientation);v.pos.copy(b.position).sub(COM.clone().applyQuaternion(b.orientation));const forward=new V(0,0,-1).applyQuaternion(b.orientation);v.yaw=Math.atan2(-forward.x,-forward.z);v.speed=b.velocity.dot(forward);v.yawRate=b.angularVelocity.y;v.lateralSpeed=b.velocity.dot(new V(1,0,0).applyQuaternion(b.orientation));v.slipVelocityX=b.velocity.x+Math.sin(v.yaw)*v.speed;v.slipVelocityZ=b.velocity.z+Math.cos(v.yaw)*v.speed;v.travelDistance=dt>0?oldPosition.distanceTo(v.pos)*Math.sign(v.speed||oldSpeed||1):0;v.longitudinalAcceleration=dt>0?(v.speed-oldSpeed)/dt:0;v.steer=t.steer;v.manualBrakePressure=t.manualPressure;v.brakeAmount=t.brakeAmount;v.brake=t.brakeAmount>.025;v.grounded=e.grounded;v.wheelSupportCount=t.supportCount;v.wheelCompressions=[...t.compressions];v.wheelVisualCompressions=[...t.compressions];v.suspensionRest=.18;v.suspensionRebound=.08;v.driftAmount=t.drift;v.roadsterTires=structuredClone(t);v.root.position.copy(v.pos);v.root.quaternion.copy(b.orientation);updateVehicleVisuals(v,dt);e.published.copy(v.pos);e.yaw=v.yaw;e.serial=Math.max(e.serial,v.physicsResetSerial??0);}
 // Real Roadster/motorcycle bodies are selected by the unified browser dispatcher.
 pairWith(a,b,otherAdapter){const ea=this.states.get(a)??otherAdapter?.states.get(a),eb=this.states.get(b)??otherAdapter?.states.get(b),A=ea?.body??this.planarBody(a),B=eb?.body??this.planarBody(b),hit=collideBodies(A,B,ea?.previous??this.planarBody(a,true),eb?.previous??this.planarBody(b,true));if(!hit)return null;
  for(const[v,e,body]of[[a,ea,A],[b,eb,B]])if(e){(this.states.has(v)?this:otherAdapter).publish(v,e);}else{v.pos.x=body.position.x;v.pos.z=body.position.z;const f=new V(0,0,-1).applyQuaternion(body.orientation);v.yaw=Math.atan2(-f.x,-f.z);v.speed=body.velocity.dot(f);v.yawRate=body.angularVelocity.y;v.slipVelocityX=body.velocity.x+Math.sin(v.yaw)*v.speed;v.slipVelocityZ=body.velocity.z+Math.cos(v.yaw)*v.speed;}
  this.remember(a,b,hit);this.remember(b,a,{...hit,normal:hit.normal.clone().negate()});return hit;
 }
}
