import {Vector3 as V,Quaternion as Q} from './vendor/three.module.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),number=(x,f=0)=>Number.isFinite(x)?x:f;
const vec=x=>new V(x.x,x.y,x.z),rotation=x=>new Q(x.x,x.y,x.z,x.w).normalize();
const finiteArray=(x,n)=>Array.isArray(x)&&x.length===n&&x.every(Number.isFinite);
const GEARS=[[0,-.2,-2.3],[-1.2,-.2,1.8],[1.2,-.2,1.8]];

export function validateAircraftCommand(command){
 if(!command||command.id!=='plane:trainer'||!['spawn','teleport','remove'].includes(command.type))throw Error('Unsupported Rapier aircraft command');
 if(command.type==='remove')return structuredClone(command);
 if(!finiteArray(command.pos,3)||!finiteArray(command.quat,4)||Math.hypot(...command.quat)<1e-8||!finiteArray(command.linear,3)||!finiteArray(command.angular,3))throw Error('Invalid Rapier aircraft pose');
 if(command.type==='spawn'&&(command.kind!=='aircraft'||command.mass!==1300||!finiteArray(command.size,3)||command.size.some((v,i)=>v!==[2.2,1.3,8][i])||command.wingSpan!==11||command.wingArea!==18||command.thrust!==5.6))throw Error('Unsupported Rapier aircraft configuration');
 return structuredClone(command);
}
export function aircraftControls(input){
 if(input?.id!=='plane:trainer')throw Error('Unsupported Rapier aircraft control identity');
 return{id:input.id,throttle:clamp(number(input.throttle),0,1),pitch:clamp(number(input.pitch),-1,1),roll:clamp(number(input.roll),-1,1),yaw:clamp(number(input.yaw),-1,1),flaps:clamp(number(input.flaps),0,1),brake:clamp(number(input.brake),0,1),condition:clamp(number(input.condition,100),0,100),battery:clamp(number(input.battery,100),0,100)};
}

/** Original vehicle_body.gd::_aircraft_forces, expressed only as a wrench.
 * Rapier owns gravity, mass/inertia, integration, contacts and every pose.
 */
export function aircraftWrench(body,controls,dt,raycast){
 if(!Number.isFinite(dt)||dt<=0||dt>1/60+1e-10)throw Error('Aircraft fixed step required');
 const {config,position,orientation:q,velocity,angularVelocity:omega,worldCom}=body,m=config.mass,forward=new V(0,0,-1).applyQuaternion(q),up=new V(0,1,0).applyQuaternion(q),right=new V(1,0,0).applyQuaternion(q),airspeed=velocity.length(),speed=velocity.dot(forward),lateralSpeed=velocity.dot(right),force=new V(),torque=new V();
 const c=controls,throttle=c.condition>0&&c.battery>0?c.throttle:0,aoa=Math.atan2(-velocity.dot(up),Math.max(.1,speed)),cl=clamp(.45+c.flaps*.35+aoa*4,-1.25,1.45+c.flaps*.25),t=clamp((Math.abs(aoa)-.3)/.65,0,1),stallFactor=1-t*t*(3-2*t)*.88,pressure=.5*1.225*airspeed*airspeed;
 force.addScaledVector(forward,m*config.thrust*throttle);
 const direction=airspeed>.01?velocity.clone().multiplyScalar(1/airspeed):new V(),liftDirection=airspeed>.1?up.clone().addScaledVector(direction,-up.dot(direction)).normalize():up;
 force.addScaledVector(liftDirection,pressure*config.wingArea*cl*stallFactor);
 if(airspeed>.01){force.addScaledVector(direction,-pressure*config.wingArea*(.035+c.flaps*.065+.065*cl*cl+(1-stallFactor)*.7));force.addScaledVector(right,-lateralSpeed*m*Math.min(1.6,airspeed*.02));}
 const localOmega=omega.clone().applyQuaternion(q.clone().invert()),authority=clamp(airspeed/28,.08,1.4);
 torque.add(new V(c.pitch*4.2-localOmega.x*4.8-aoa*.8,c.yaw*2.5-localOmega.y*4.2,-c.roll*5.6-localOmega.z*4).applyQuaternion(q).multiplyScalar(m*authority));
 const compressions=[],loads=[];let supportCount=0;
 for(const gear of GEARS){
  const offset=new V(...gear).applyQuaternion(q),start=position.clone().add(offset),hit=raycast(start,up.clone().negate(),1.25);
  if(!hit||hit.normal.y<.25){compressions.push(0);loads.push(0);continue;}
  const compression=Math.max(0,1.1-start.distanceTo(hit.position));compressions.push(compression);if(!compression){loads.push(0);continue;}supportCount++;
  const lever=start.clone().sub(worldCom),pointVelocity=velocity.clone().add(omega.clone().cross(lever)),normal=hit.normal.clone().normalize(),support=clamp(compression*m*22-pointVelocity.dot(normal)*m*2.5,0,m*9.81);loads.push(support);
  const apply=f=>{force.add(f);torque.add(lever.clone().cross(f));};apply(normal.clone().multiplyScalar(support));
  const groundRight=right.clone().addScaledVector(normal,-right.dot(normal)).normalize(),groundForward=forward.clone().addScaledVector(normal,-forward.dot(normal)).normalize();
  apply(groundRight.multiplyScalar(-clamp(pointVelocity.dot(groundRight)*m*.8,-support*.6,support*.6)));
  const groundSpeed=pointVelocity.dot(groundForward);apply(groundForward.multiplyScalar(-Math.sign(groundSpeed)*Math.min(Math.abs(groundSpeed)*m/(3*dt),m*(c.brake*2.4+.04))));
 }
 if(![...force.toArray(),...torque.toArray(),airspeed,aoa,stallFactor].every(Number.isFinite))throw Error('Nonfinite Rapier aircraft force');
 return{force,torque,telemetry:{airspeed,speed,lateralSpeed,angleOfAttack:aoa,stallFactor,grounded:supportCount>0,supportCount,compressions,loads}};
}

export class RapierAircraftSystem{
 constructor(backend){this.backend=backend;this.entries=new Map();this.commands=[];this.controls=new Map();}
 queue(command){if(this.backend.failed||this.backend.disposed)return false;this.commands.push(validateAircraftCommand(command));return true;}
 control(input){if(this.backend.failed||this.backend.disposed)return false;const c=aircraftControls(input);this.controls.set(c.id,c);return true;}
 pendingFocus(){const lastRemove=this.commands.findLastIndex(c=>c.type==='remove'),index=this.commands.findLastIndex(c=>c.type==='spawn'||c.type==='teleport'),c=this.commands[index];return index>lastRemove?{x:c.pos[0],y:c.pos[1],z:c.pos[2]}:null;}
 entry(vehicle){const entry=this.entries.get(vehicle?.physicsId);return entry?.vehicle===vehicle?entry:null;}
 bind(entry){for(const c of entry.colliders)this.backend.byCollider.set(c.handle,entry.vehicle);entry.vehicle.rapierBody=true;}
 unbind(entry){for(const c of entry.colliders)this.backend.byCollider.delete(c.handle);delete entry.vehicle.rapierBody;}
 remove(id){const e=this.entries.get(id);if(!e)return;this.backend.retire(e);this.unbind(e);this.entries.delete(id);this.controls.delete(id);}
 create(command){
  const b=this.backend,R=b.R,world=b.world,v=b.game.aircraft?.aircraft;
  if(!v||v.physicsId!==command.id||v.model?.id!=='nc11')throw Error('Rapier aircraft has no matching original service entity');
  if(this.entries.has(command.id))throw Error('Duplicate Rapier aircraft spawn');
  const q=new Q(...command.quat).normalize(),rb=world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(...command.pos).setRotation(q).setLinvel(...command.linear).setAngvel(new V(...command.angular)).setAngularDamping(.08).setCanSleep(false).setCcdEnabled(true).setSoftCcdPrediction(.5)),volume=2.2*1.3*8+11*.18*1.8,density=command.mass/volume,colliders=[];
  try{for(const [size,offset]of[[command.size,[0,0,0]],[[command.wingSpan,.18,1.8],[0,.1,0]]])colliders.push(world.createCollider(R.ColliderDesc.cuboid(...size.map(x=>x/2)).setTranslation(...offset).setDensity(density).setFriction(.18).setRestitution(.03).setActiveEvents(R.ActiveEvents.CONTACT_FORCE_EVENTS).setContactForceEventThreshold(command.mass*.35),rb));}catch(error){world.removeRigidBody(rb);throw error;}
  const entry={id:command.id,vehicle:v,rb,colliders,state:{config:structuredClone(command)},telemetry:{grounded:false,airspeed:0,angleOfAttack:0,stallFactor:1}};this.entries.set(command.id,entry);this.bind(entry);return entry;
 }
 syncCommands(){
  // The service can prepare/cancel/reload before the next fixed step. Nothing
  // before the last remove can be observed, and its former mesh may be gone.
  const pending=this.commands.splice(0),lastRemove=pending.findLastIndex(c=>c.type==='remove'),commands=lastRemove<0?pending:pending.slice(lastRemove),latest=this.controls.get('plane:trainer');
  for(const command of commands){
  if(command.type==='spawn')this.create(command);
  else if(command.type==='remove')this.remove(command.id);
  else{const e=this.entries.get(command.id);if(!e)throw Error('Cannot teleport missing Rapier aircraft');const q=new Q(...command.quat).normalize();e.rb.setTranslation(new V(...command.pos),true);e.rb.setRotation(q,true);e.rb.setLinvel(new V(...command.linear),true);e.rb.setAngvel(new V(...command.angular),true);e.rb.resetForces(true);e.rb.resetTorques(true);e.telemetry={grounded:false,airspeed:0,angleOfAttack:0,stallFactor:1};}
  }
  if(latest&&commands.some(c=>c.type==='spawn'))this.controls.set(latest.id,latest);
 }
 raycast(origin,direction,maxDistance){const b=this.backend,hit=b.world.castRayAndGetNormal(new b.R.Ray(origin,direction),maxDistance,false,b.R.QueryFilterFlags.ONLY_FIXED);if(!hit)return null;return{position:origin.clone().addScaledVector(direction,hit.timeOfImpact),normal:vec(hit.normal),distance:hit.timeOfImpact};}
 applyForces(dt){for(const e of this.entries.values()){
  const rb=e.rb,body={config:e.state.config,position:vec(rb.translation()),orientation:rotation(rb.rotation()),velocity:vec(rb.linvel()),angularVelocity:vec(rb.angvel()),worldCom:vec(rb.worldCom())};e.beforeVelocity=body.velocity.clone();e.beforeAngularVelocity=body.angularVelocity.clone();
  const c=this.controls.get(e.id)??aircraftControls({id:e.id,brake:1}),wrench=aircraftWrench(body,c,dt,this.raycast.bind(this));e.telemetry=wrench.telemetry;rb.resetForces(true);rb.resetTorques(true);rb.addForce(wrench.force,true);rb.addTorque(wrench.torque,true);
 }}
 publish(){for(const e of this.entries.values()){
  const rb=e.rb,q=rotation(rb.rotation()),linear=vec(rb.linvel()),angular=vec(rb.angvel()),pos=vec(rb.translation());if(![...pos.toArray(),...q.toArray(),...linear.toArray(),...angular.toArray()].every(Number.isFinite))throw Error('Nonfinite Rapier aircraft body');
  let grounded=e.telemetry.grounded;for(const c of e.colliders)this.backend.world.contactPairsWith(c,other=>this.backend.world.contactPair(c,other,(m,flipped)=>{if(m.numSolverContacts()>0&&m.normal().y*(flipped?1:-1)>.45)grounded=true;}));
  const airspeed=linear.length(),speed=linear.dot(new V(0,0,-1).applyQuaternion(q));e.telemetry.grounded=grounded;
  const snapshot={id:e.id,kind:'aircraft',mass:rb.mass(),pos:pos.toArray(),quat:q.toArray(),linear:linear.toArray(),angular:angular.toArray(),grounded,speed,airspeed,angleOfAttack:e.telemetry.angleOfAttack,stallFactor:e.telemetry.stallFactor,stalled:!grounded&&(e.telemetry.stallFactor<.65||airspeed<27),rideHeight:1.16};
  if(this.backend.game.aircraft?.aircraft!==e.vehicle)throw Error('Rapier aircraft service identity changed without a command');this.backend.game.aircraft.applySnapshot(snapshot);
 }}
 checkpoint(){
  const commands=structuredClone(this.commands),controls=new Map([...this.controls].map(([id,c])=>[id,{...c}])),saved=[...this.entries.values()].map(e=>({e,pos:{...e.rb.translation()},quat:{...e.rb.rotation()},linear:{...e.rb.linvel()},angular:{...e.rb.angvel()},telemetry:structuredClone(e.telemetry)}));
  return()=>{const b=this.backend;if(!b.world)return;const retained=new Set(saved.map(s=>s.e));for(const e of this.entries.values())if(!retained.has(e)){this.unbind(e);b.world.removeRigidBody(e.rb);}this.entries.clear();for(const s of saved){const e=s.e;if(!e.rb.isValid())throw Error('Rapier aircraft rollback body missing');e.rb.setEnabled(true);e.rb.setTranslation(s.pos,false);e.rb.setRotation(s.quat,false);e.rb.setLinvel(s.linear,false);e.rb.setAngvel(s.angular,false);e.rb.resetForces(false);e.rb.resetTorques(false);e.telemetry=s.telemetry;this.entries.set(e.id,e);this.bind(e);}this.commands=commands;this.controls=controls;};
 }
 clear(){for(const e of this.entries.values())this.unbind(e);this.entries.clear();this.commands.length=0;this.controls.clear();}
}
