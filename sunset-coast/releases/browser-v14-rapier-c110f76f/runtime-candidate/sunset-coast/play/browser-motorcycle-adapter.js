import {Vector3 as V,Quaternion as Q} from './vendor/three.module.js';
import {createMotorcycleBody,stepMotorcycleBody,resolveMotorcyclePlane} from './browser-motorcycle-rigidbody.js';
import {BrowserMotorcycleSurface} from './browser-motorcycle-surface.js';
import {collideBodies,staticBox,snapshotBody,collideBodyTriangle} from './browser-rigidbody-contacts.js';
import {getVehicleCollider} from './vehicle-dynamics.js';
import {captureVehiclePose,resetVehiclePose} from './render-motion.js';
import {updateMotorcycleVisuals} from './motorcycle-asset.js';
import {parkingBrakeControls} from './touch-transmission.js';
const Y=new V(0,1,0),COM=new V(0,.72,0);
export const BROWSER_MOTORCYCLE_IDS=Object.freeze(['mica_scooter','ember_street','ridge_dual']);
export class BrowserMotorcycleAdapter {
 constructor(game){this.game=game;this.states=new Map();this.surface=new BrowserMotorcycleSurface(game.world);this.tickContacts=new Map();this.stepped=new Set();}
 begin(){for(const c of this.game.world.colliders??[])staticBox(c);this.surface.refresh();this.tickContacts.clear();this.stepped.clear();const desired=new Set(this.game.allVehicles());for(const v of this.states.keys())if(!desired.has(v)){this.states.delete(v);delete v.browserMotorcycleBody;}for(const [v,e]of this.states)e.previous=snapshotBody(e.body);}
 checkpoint(){const states=[...this.states].map(([v,e])=>[v,e,{...e,body:{...e.body,position:e.body.position.clone(),orientation:e.body.orientation.clone(),velocity:e.body.velocity.clone(),angularVelocity:e.body.angularVelocity.clone()},published:e.published.clone()}]);return()=>{this.states.clear();for(const [v,e,s]of states){Object.assign(e.body,s.body);Object.assign(e,{...s,body:e.body});this.states.set(v,e);}this.tickContacts.clear();};}
 config(v){const c=getVehicleCollider(v),height=Math.max(.7,(v.height??1.5)-.35);return{mass:v.mass??v.model.mass,size:[Math.max(.3,c.halfWidth*2-.08),height,c.halfLength*2-.1],collisionOffset:[c.offsetX??0,.2+height/2-.72,c.offsetZ??0],wheelOffsets:v.physicsWheelOffsets,power:v.model.power,maxSpeed:v.model.max,lateralGrip:v.lateralGrip??8.5,maxSteer:v.maxSteer??.6,powertrain:v.model.powertrain};}
 state(v){let e=this.states.get(v);const changed=e&&(e.serial!==(v.physicsResetSerial??0)||e.published.distanceToSquared(v.pos)>1e-8||Math.abs(e.yaw-v.yaw)>1e-5);
  if(!e||changed){const q=new Q().setFromAxisAngle(Y,v.yaw??0),body=createMotorcycleBody(this.config(v),{position:v.pos.clone().add(COM.clone().applyQuaternion(q)).toArray(),orientation:q.toArray(),velocity:[-Math.sin(v.yaw)*(v.speed??0),0,-Math.cos(v.yaw)*(v.speed??0)]});e={body,previous:snapshotBody(body),serial:v.physicsResetSerial??0,published:v.pos.clone(),yaw:v.yaw};this.states.set(v,e);resetVehiclePose(v);v.browserMotorcycleBody=true;}return e;
 }
 finish(dt){for(const v of this.game.allVehicles())if(v.kind==='motorcycle'&&BROWSER_MOTORCYCLE_IDS.includes(v.model.id)&&!this.stepped.has(v))this.step(v,{throttle:0,steer:0,brake:1},dt,false);}
 step(v,input,dt,isPlayer){this.stepped.add(v);const e=this.state(v),b=e.body;captureVehiclePose(v);e.previous=snapshotBody(b);e.oldPosition=v.pos.clone();e.oldSpeed=v.speed;
  const controls=parkingBrakeControls(v,input),occupied=isPlayer&&!!this.game.inCar;v.motorcycleOccupied=occupied;
  // Energy remains the existing per-vehicle save field, whose UI label already
  // distinguishes fuel from battery. No new key or silent refill on ICE/EV switch.
  const energyBefore=b.energyUsed;
  stepMotorcycleBody(b,{...controls,brake:controls.brake===true?1:controls.brake,occupied,condition:v.condition,energy:v.battery,engineStalled:!!v.engineStalled},dt,this.surface);
  const world=this.game.world;
  for(const c of world.colliders??[]){if(Math.hypot(c.x-b.position.x,c.z-b.position.z)>Math.hypot(c.w,c.d)+v.wheelBase+3+b.position.distanceTo(e.previous.position))continue;const hit=collideBodies(b,staticBox(c),e.previous);if(hit)this.remember(v,c.id??c,hit);}
  // Terrain is a heightfield; authored elevated surfaces are finite, double-sided
  // triangle manifolds. Never select a roof above the chassis as an infinite floor.
  for(const face of this.surface.nearby(b,e.previous)){const hit=collideBodyTriangle(b,face,e.previous);if(hit&&hit.impactSpeed>1)this.remember(v,face,hit);}
  const height=world.groundHeight?.(b.position.x,b.position.z)??0,normal=this.surface.normal(b.position.x,b.position.z),point=new V(b.position.x,height,b.position.z);
  const groundHit=resolveMotorcyclePlane(b,{normal,offset:point.dot(normal),friction:.6});if(groundHit&&groundHit.impactSpeed>1)this.remember(v,'terrain',groundHit);
  const bounds=world.bounds;if(bounds){const sides=[[new V(1,0,0),bounds.minX+2],[new V(-1,0,0),-bounds.maxX+2],[new V(0,0,1),bounds.minZ+2],[new V(0,0,-1),-bounds.maxZ+2]];for(const [normal,offset]of sides){const hit=resolveMotorcyclePlane(b,{normal,offset});if(hit)this.remember(v,'boundary',hit);}}
  if(isPlayer)v.battery=Math.max(0,v.battery-(b.energyUsed-energyBefore));this.publish(v,e,dt);
 }
 publish(v,e,dt=0){const b=e.body,oldSpeed=e.oldSpeed??v.speed,oldPosition=e.oldPosition??v.pos.clone();v.physicsQuaternion??=new Q();v.physicsQuaternion.copy(b.orientation);v.pos.copy(b.position).sub(COM.clone().applyQuaternion(b.orientation));const forward=new V(0,0,-1).applyQuaternion(b.orientation);v.yaw=Math.atan2(-forward.x,-forward.z);v.speed=b.velocity.dot(forward);v.yawRate=b.angularVelocity.y;v.lateralSpeed=b.velocity.dot(new V(1,0,0).applyQuaternion(b.orientation));v.slipVelocityX=b.velocity.x+Math.sin(v.yaw)*v.speed;v.slipVelocityZ=b.velocity.z+Math.cos(v.yaw)*v.speed;v.travelDistance=dt>0?oldPosition.distanceTo(v.pos)*Math.sign(v.speed||oldSpeed||1):0;v.longitudinalAcceleration=dt>0?(v.speed-oldSpeed)/dt:0;v.steer=b.steer;v.manualBrakePressure=b.manualPressure;v.brakeAmount=b.brakeAmount;v.brake=b.brakeAmount>.025;v.grounded=b.supportCount>0;v.wheelSupportCount=b.supportCount;v.wheelCompressions=[...b.compressions];v.wheelVisualCompressions=[...b.compressions];v.suspensionRest=.18;v.suspensionRebound=.08;v.driftAmount=0;v.root.position.copy(v.pos);v.root.quaternion.copy(b.orientation);updateMotorcycleVisuals(v,dt);e.published.copy(v.pos);e.yaw=v.yaw;e.serial=v.physicsResetSerial??0;}
 remember(v,other,hit){let contacts=this.tickContacts.get(v);if(!contacts)this.tickContacts.set(v,contacts=new Map());if(!contacts.has(other)||contacts.get(other).impactSpeed<hit.impactSpeed)contacts.set(other,hit);}
 planarBody(v,previous=false){const c=getVehicleCollider(v),height=Math.max(.7,(v.height??1.5)-.35),p=previous?v.collisionPrevious:null,yaw=p?.yaw??v.yaw,mass=v.mass??v.model.mass??1500,size=[c.halfWidth*2,height,c.halfLength*2];return{planar:true,config:{mass,size,collisionOffset:[c.offsetX??0,.2+height/2,c.offsetZ??0]},position:new V(p?.x??v.pos.x,v.pos.y,p?.z??v.pos.z),orientation:new Q().setFromAxisAngle(Y,yaw),velocity:new V(-Math.sin(v.yaw)*v.speed+(v.slipVelocityX??0),0,-Math.cos(v.yaw)*v.speed+(v.slipVelocityZ??0)),angularVelocity:new V(0,v.yawRate??0,0),inertia:new V(Infinity,mass*(size[0]**2+size[2]**2)/12,Infinity)};}
 pair(a,b){if(a.kind!=='motorcycle'&&b.kind!=='motorcycle')return null;const ea=a.kind==='motorcycle'?this.state(a):null,eb=b.kind==='motorcycle'?this.state(b):null,A=ea?.body??this.planarBody(a),B=eb?.body??this.planarBody(b),hit=collideBodies(A,B,ea?.previous??this.planarBody(a,true),eb?.previous??this.planarBody(b,true));if(!hit)return null;
  for(const [v,e,body]of [[a,ea,A],[b,eb,B]]){if(e)this.publish(v,e);else{v.pos.x=body.position.x;v.pos.z=body.position.z;const f=new V(0,0,-1).applyQuaternion(body.orientation);v.yaw=Math.atan2(-f.x,-f.z);v.speed=body.velocity.dot(f);v.yawRate=body.angularVelocity.y;v.slipVelocityX=body.velocity.x+Math.sin(v.yaw)*v.speed;v.slipVelocityZ=body.velocity.z+Math.cos(v.yaw)*v.speed;}}
  this.remember(a,b,hit);this.remember(b,a,{...hit,normal:hit.normal.clone().negate()});return hit;
 }
 flushDamage(){for(const [v,contacts]of this.tickContacts)for(const [other,hit]of contacts){if(hit.impactSpeed<.75)continue;const dynamic=typeof other==='object'&&other?.model;this.game.applyCollisionDamage(v,hit.impactSpeed,!!dynamic,{...hit,normalImpulse:hit.impulse,bodyMass:v.mass??v.model.mass,otherMass:dynamic?(other.mass??other.model.mass):Infinity},dynamic?other:null);}}
}
