import RAPIER from './vendor/rapier/rapier.js';
import {initRapierWasm} from './vendor/rapier/rapier_wasm3d.js';
import {Vector3 as V,Quaternion as Q} from './vendor/three.module.js';
import {FixedStepClock} from './fixed-step-clock.mjs';
import {RapierWorldGeometry} from './rapier-world.js';
import {getVehicleCollider} from './vehicle-dynamics.js';
import {browserRoadsterControls} from './browser-roadster-controls.js';
import {createRoadsterWheels,rapierWheelWrench} from './rapier-wheels.js';
import {createMotorcycleBody} from './browser-motorcycle-rigidbody.js';
import {motorcycleWheelWrench} from './rapier-motorcycle.js';
import {createRoadsterAirController,stepRoadsterAir,commitRoadsterAirTelemetry,AirReserve} from './browser-roadster-air.js';
import {roadsterAirUnits,rememberRoadsterAir,tickRoadsterAirLedger} from './roadster-air-ledger.js';
import {captureVehiclePose,resetVehiclePose} from './render-motion.js';
import {updateVehicleVisuals} from './vehicle-physics.js';
import {cargoEffects} from './cargo-career.js';
import {BROWSER_WORLD_ROADSTER_MODELS} from './browser-world-policy.js';
const MOTORCYCLES=new Set(['mica_scooter','ember_street','ridge_dual']);
const ROADSTERS=new Set(['roadster','roadster_thrust','roadster_rocket']);
const COM=new V(0,.72,0),UP=new V(0,1,0),IDENTITY={x:0,y:0,z:0,w:1};
const vec=x=>new V(x.x,x.y,x.z),quat=x=>new Q(x.x,x.y,x.z,x.w).normalize();
// Use pre-step velocities: the solver has already removed impact motion
// by the time contact-force events are drained. A missing point cannot support
// an angular estimate, so that case deliberately retains only linear velocity.
const contactVelocity=(e,point)=>{
 const velocity=e?.beforeVelocity?.clone()??new V();
 // Rapier reconstructs solver points using the current body transforms. The
 // lever arm needs that same COM frame; a pre-step COM adds omega × travel
 // and changes impact speed when both colliders share a common translation.
 if(point&&e?.beforeAngularVelocity)velocity.add(e.beforeAngularVelocity.clone().cross(point.clone().sub(vec(e.rb.worldCom()))));
 return velocity;
};
const finitePose=b=>[...Object.values(b.translation()),...Object.values(b.rotation()),...Object.values(b.linvel()),...Object.values(b.angvel())].every(Number.isFinite);
export const RAPIER_CAPABILITIES=Object.freeze({carPlanar:false,walk:true,deliveryClock:true,native3D:true,rapierRigidBodies:true,motorcycle:true,motorcycleRigidBody:true,roadsterManualFlight:true,roadsterFlight:false,roadsterManeuvers:false,aircraft:false,structuralWheelDetachment:false,surfaceMeshVehicleCollision:true});
export async function preloadRapier(source){await initRapierWasm(source);if(RAPIER.version()!=='0.21.0')throw Error('Unexpected Rapier runtime version');return RAPIER;}

/** One official Rapier world owns every vehicle's 6DOF integration and contacts.
 * Tire/air controllers only output SI forces and torques; they cannot move bodies.
 * A failed substep is restored and permanently latched until a fresh game load.
 */
export class RapierPhysicsSystem {
 constructor(game,{hidden=()=>globalThis.document?.hidden??false,loadRapier=preloadRapier}={}){
  this.game=game;this.hidden=hidden;this.loadRapier=loadRapier;this.clock=new FixedStepClock();this.lastTick=0;this.ready=false;this.failed=false;this.disposed=false;this.drivesRender=false;
  this.backendId='rapier';this.rapierVersion='0.21.0';this.backend='Rapier 0.21.0 · WASM 3D';this.capabilities=RAPIER_CAPABILITIES;
  this.vehicles=new Map();this.states=this.vehicles;this.byCollider=new Map();this.controls=new Map();this.patches=[];this.retired=[];
  this.metrics={ticks:0,bodies:0,colliders:0,contacts:0,droppedSeconds:0,backend:'rapier',version:'0.21.0'};
 }
 supportsModel(id){return !/roadster/i.test(id??'')||BROWSER_WORLD_ROADSTER_MODELS.includes(id);}
 supportsVehicle(v){return !!v&&v.kind!=='aircraft'&&(v.kind!=='motorcycle'||MOTORCYCLES.has(v.model?.id))&&this.supportsModel(v.model?.id);}
 reject(feature){this.game.ui?.toast?.('当前 Rapier 候选尚不支持：'+feature+'；未改变原进度','error');return false;}
 queueCommand(command){throw Error('Unsupported Rapier command: '+command?.type);}
 sendControls(){throw Error('Aircraft unavailable in Rapier candidate');}
 async start(){
  if(this.disposed)throw Error('Rapier backend disposed');
  if(this.failed)throw this.error??Error('Rapier backend failed');
  if(this.ready)return this;
  if(this.starting)return this.starting;
  this.starting=(async()=>{
   try{
    const R=await this.loadRapier();if(this.disposed)throw Error('Rapier startup cancelled');this.R=R;
    if(!this.supportsVehicle(this.game.vehicle))throw Error('当前存档车型不受 Rapier 候选支持');
    this.world=new R.World({x:0,y:-9.81,z:0});this.world.timestep=1/60;this.world.integrationParameters.numSolverIterations=8;this.world.integrationParameters.maxCcdSubsteps=4;
    this.events=new R.EventQueue(true);this.geometry=new RapierWorldGeometry(R,this.world,this.game.world);
    this.reconcile();this.geometry.sync([...this.vehicles.keys()]);
    // Seed Rapier's broad phase for the first suspension ray query, before any game tick.
    this.world.timestep=0;this.world.step(this.events);this.world.timestep=1/60;
    this.installGuards();this.lifecycle=new AbortController();const signal=this.lifecycle.signal;
    globalThis.document?.addEventListener('visibilitychange',()=>this.clock.suspend(),{signal});
    globalThis.window?.addEventListener('blur',()=>this.clock.suspend(),{signal});
    globalThis.window?.addEventListener('pagehide',()=>this.dispose(),{signal,once:true});
    this.ready=true;return this;
   }catch(error){this.failed=true;this.error=error;this.game.paused=true;this.game.rollbackPhysicsTransaction?.(error);this.release();throw error;}
  })();return this.starting;
 }
 installGuards(){
  const g=this.game,wrap=(object,key,make)=>{if(typeof object?.[key]!=='function')return;const original=object[key],replacement=make(original);object[key]=replacement;this.patches.push({object,key,original,replacement});};
  wrap(g.ui,'openGarage',original=>(...args)=>{const result=original.apply(g.ui,args);for(const button of globalThis.document?.querySelectorAll?.('[data-garage-car]')??[])if(!this.supportsModel(button.dataset.garageCar)){button.disabled=true;button.textContent='Rapier 候选尚未支持 · 保留原版';}return result;});
  wrap(g,'spawnCar',original=>(...args)=>!this.supportsModel(args[0])?this.reject('该车型'):original.apply(g,args));
  wrap(g,'toggleEntry',original=>(...args)=>!g.inCar&&g.nearestCar&&!this.supportsVehicle(g.nearestCar)?this.reject('该车型上车'):original.apply(g,args));
  for(const service of [g.aircraft,g.flight])for(const name of ['board','start','spawn'])wrap(service,name,()=>()=>{this.reject('飞机与自动飞行');return{ok:false,reason:'Rapier 候选未实现飞机'};});
 }
 config(v){
  const c=getVehicleCollider(v),height=Math.max(.7,(v.height??1.5)-.35),mass=v.mass??v.model.mass??1500;
  const wheelOffsets=v.physicsWheelOffsets??[true,false].flatMap(front=>[-1,1].map(side=>{const w=v.wheels?.find(w=>w.front===front&&w.side===side);return[w?.pivot.position.x??side*(v.track??1.65)/2,.1,w?.pivot.position.z??(front?-1:1)*(v.wheelBase??2.9)/2,w?.radius??.36,w?.suspensionRestY??w?.pivot.position.y??.36];}));
  const cfg={mass,size:[Math.max(v.kind==='motorcycle'?.3:1.2,c.halfWidth*2-.08),height,c.halfLength*2-.1],collisionOffset:[c.offsetX??0,.2+height/2-.72,c.offsetZ??0],power:v.model.power,maxSpeed:v.model.max,lateralGrip:v.lateralGrip??v.model.tireGrip??9.8,maxSteer:v.maxSteer??.55,wheelBase:v.wheelBase??2.9,track:v.track>0?v.track:1.65,wheelOffsets,powertrain:v.model.powertrain};
  if(![mass,...cfg.size,cfg.power,cfg.maxSpeed,cfg.lateralGrip,cfg.wheelBase,cfg.track,cfg.maxSteer].every(x=>Number.isFinite(x)&&x>0))throw Error('Invalid Rapier vehicle configuration');
  if(!Array.isArray(wheelOffsets)||wheelOffsets.length!==(v.kind==='motorcycle'?2:4)||wheelOffsets.some(w=>!Array.isArray(w)||w.length!==5||!w.every(Number.isFinite)||w[3]<=0))throw Error('Invalid authored Rapier wheel geometry');
  return cfg;
 }
 createVehicle(v){
  const R=this.R,cfg=this.config(v),[w,h,l]=cfg.size,m=cfg.mass,inertia=new V(m*(h*h+l*l)/12,m*(w*w+l*l)/12,m*(w*w+h*h)/12),q=quat(v.physicsQuaternion??new Q().setFromAxisAngle(UP,v.yaw??0)),p=v.pos.clone().add(COM.clone().applyQuaternion(q));
  if(![...p.toArray(),...q.toArray(),v.yaw,v.speed??0].every(Number.isFinite))throw Error('Invalid Rapier spawn pose');
  const state=v.kind==='motorcycle'?createMotorcycleBody(cfg,{position:p.toArray(),orientation:q.toArray()}):{config:cfg,inertia,position:p,orientation:q,velocity:new V(),angularVelocity:new V()};
  const air=ROADSTERS.has(v.model.id)?createRoadsterAirController({modelId:v.model.id,instanceId:v.instanceId,airUnits:roadsterAirUnits(v),resetSerial:v.physicsResetSerial??0}):null;
  const rb=this.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(p.x,p.y,p.z).setRotation(q).setLinvel(-Math.sin(v.yaw)*(v.speed??0),0,-Math.cos(v.yaw)*(v.speed??0)).setAngularDamping(.3).setCcdEnabled(true).setSoftCcdPrediction(.5).setAdditionalMassProperties(m,{x:0,y:0,z:0},inertia,IDENTITY));
  const collider=this.world.createCollider(R.ColliderDesc.cuboid(w/2,h/2,l/2).setTranslation(...cfg.collisionOffset).setDensity(0).setFriction(.45).setRestitution(.02).setActiveEvents(R.ActiveEvents.CONTACT_FORCE_EVENTS).setContactForceEventThreshold(m*.5),rb);
  const e={rb,collider,state,wheels:v.kind==='motorcycle'?null:createRoadsterWheels(cfg,v.speed??0),serial:v.physicsResetSerial??0,published:v.pos.clone(),yaw:v.yaw,grounded:false};
  if(air)e.air=air;
  this.vehicles.set(v,e);this.byCollider.set(collider.handle,v);v.rapierBody=true;resetVehiclePose(v);return e;
 }
 reconcile(){
  const desired=new Set(this.game.allVehicles().filter(v=>this.supportsVehicle(v)));
  for(const [v,e]of this.vehicles)if(!desired.has(v)){if(e.air)rememberRoadsterAir(this.game,v);this.retire(e);this.byCollider.delete(e.collider.handle);this.vehicles.delete(v);delete v.rapierBody;}
  for(const v of desired){const e=this.vehicles.get(v);if(!e){this.createVehicle(v);continue;}
   if(e.serial!==(v.physicsResetSerial??0)||e.published.distanceToSquared(v.pos)>1e-8||Math.abs(e.yaw-v.yaw)>1e-5){
    const oldAir=e.air?.reserve.units;this.retire(e);this.byCollider.delete(e.collider.handle);this.vehicles.delete(v);const replacement=this.createVehicle(v);
    if(replacement.air){replacement.air.reserve.units=Math.min(roadsterAirUnits(v),oldAir??2400);replacement.air.previousAir=true;}
   }
  }
 }
 retire(e){if(this.inStep){e.rb.setEnabled(false);this.retired.push(e);}else this.world.removeRigidBody(e.rb);}
 interpolationAlpha(){return this.clock.alpha;}
 submitVehicle(v,input,dt,isPlayer=false){
  if(!this.ready||this.failed||this.disposed)return;
  if(!this.supportsVehicle(v)){if(isPlayer)this.reject(v.kind??v.model?.id);return;}
  if(!(Number.isFinite(dt)&&dt>0&&dt<=1/60+1e-10))throw Error('Rapier fixed step required');
  if(v.structuralWheelPreview)throw Error('Detached structures are disabled in Rapier');
  this.controls.set(v,{input:{...input},isPlayer});
 }
 advance(now){
  if(!this.ready||this.failed||this.disposed)return;
  this.clock.advance(now,this.game.paused||this.hidden(),(dt,tick)=>this.step(dt,tick));this.metrics.droppedSeconds=this.clock.droppedSeconds;
 }
 step(dt,tick=this.lastTick+1){
  if(!this.ready||this.failed||this.disposed||this.game.paused||this.hidden())return false;
  const g=this.game,previousTick=this.lastTick,previousTime=g.time,checkpoint=this.checkpoint();
  try{
   this.inStep=true;g.beginPhysicsTransaction?.();g.world.update?.(g.position);this.controls.clear();g.beginVehicleStep?.();g.physicsTick(dt);
   if(g.paused||this.hidden()||this.disposed){checkpoint();this.inStep=false;this.clock.tick=previousTick;g.rollbackPhysicsTransaction?.(null);g.time=previousTime;return false;}
   this.reconcile();this.geometry.sync([...this.vehicles.keys()],dt);this.world.propagateModifiedBodyPositionsToColliders();
   for(const [v,e]of this.vehicles)this.applyControls(v,e,this.controls.get(v)??{input:{throttle:0,steer:0,brake:1},isPlayer:false},dt);
   this.world.timestep=dt;this.world.step(this.events);
   for(const [v,e]of this.vehicles)this.publish(v,e,dt);
   this.flushDamage(dt);tickRoadsterAirLedger(g,dt,new Set(this.vehicles.keys()));
   this.lastTick=tick;this.metrics.ticks=tick;this.metrics.bodies=this.vehicles.size;this.metrics.colliders=this.geometry.colliderCount;
   if(g.commitPhysicsTransaction?.()===false)throw Error('Physics transaction commit rejected');
   for(const e of this.retired.splice(0))if(e.rb.isValid())this.world.removeRigidBody(e.rb);this.inStep=false;return true;
  }catch(error){
   checkpoint();this.inStep=false;g.time=previousTime;this.lastTick=previousTick;this.clock.tick=previousTick;this.failed=true;this.ready=false;this.error=error;g.paused=true;g.rollbackPhysicsTransaction?.(error);
   g.ui?.toast?.('Rapier 物理异常，已暂停：'+error.message+'；请刷新恢复最近存档','error');return false;
  }
 }
 applyControls(v,e,{input,isPlayer},dt){
  const b=e.state,rb=e.rb;b.position.copy(rb.translation());b.orientation.copy(rb.rotation()).normalize();b.velocity.copy(rb.linvel());b.angularVelocity.copy(rb.angvel());
  e.beforeVelocity=b.velocity.clone();e.beforeAngularVelocity=b.angularVelocity.clone();e.oldPosition=v.pos.clone();e.oldSpeed=v.speed;e.isPlayer=isPlayer;captureVehiclePose(v);
  rb.resetForces(true);rb.resetTorques(true);v.motorcycleOccupied=isPlayer&&!!this.game.inCar;
  const c=browserRoadsterControls(v,input,dt),surface=this.geometry.surface(rb);let wrench;
  const cargo=cargoEffects(v);c.manualBrake*=cargo.brakeScale;c.electronicBrake*=cargo.brakeScale;
  if(v.kind==='motorcycle'){
   const energy=b.energyUsed;wrench=motorcycleWheelWrench(b,{...c,brake:c.manualBrake,occupied:v.motorcycleOccupied,energy:v.battery,engineStalled:!!v.engineStalled},dt,surface);
   if(isPlayer)v.battery=Math.max(0,v.battery-(b.energyUsed-energy));e.grounded=b.supportCount>0;
  }else{
   // Cargo effects scale force capacity, while chassis inertia remains actual mass.
   const power=b.config.power;b.config.power=power*cargo.driveScale;
   try{wrench=rapierWheelWrench(b,e.wheels,c,dt,surface,e.air??{mode:'road',wing:0});}finally{b.config.power=power;}
   e.grounded=e.wheels.supportCount>0;
   if(e.air){const hit=surface.raycast(b.position,new V(0,-1,0),2000),altitude=hit?Math.max(0,hit.distance-.72):2000;
    const result=stepRoadsterAir(e.air,b,c,dt,{grounded:e.grounded,altitude});wrench.force.add(result.force);wrench.torque.add(result.torque);
    if(!isPlayer)result.batteryUsed=0;result.telemetry.source='rapier-force-controller';commitRoadsterAirTelemetry(v,e.air,result);
   }else if(isPlayer)v.battery=Math.max(0,v.battery-Math.abs(v.speed)*dt*.0008);
  }
  if(![...wrench.force.toArray(),...wrench.torque.toArray()].every(Number.isFinite))throw Error('Nonfinite Rapier force');
  rb.addForce(wrench.force,true);rb.addTorque(wrench.torque,true);
 }
 publish(v,e,dt){
  if(!finitePose(e.rb))throw Error('Nonfinite Rapier body');
  const rb=e.rb,q=quat(rb.rotation()),velocity=vec(rb.linvel()),omega=rb.angvel(),forward=new V(0,0,-1).applyQuaternion(q),t=e.wheels??e.state;
  v.physicsQuaternion??=new Q();v.physicsQuaternion.copy(q);v.pos.copy(rb.translation()).sub(COM.clone().applyQuaternion(q));v.yaw=Math.atan2(-forward.x,-forward.z);v.speed=velocity.dot(forward);v.yawRate=omega.y;v.lateralSpeed=velocity.dot(new V(1,0,0).applyQuaternion(q));
  v.slipVelocityX=velocity.x+Math.sin(v.yaw)*v.speed;v.slipVelocityZ=velocity.z+Math.cos(v.yaw)*v.speed;v.travelDistance=e.oldPosition.distanceTo(v.pos)*Math.sign(v.speed||e.oldSpeed||1);v.longitudinalAcceleration=(v.speed-e.oldSpeed)/dt;
  v.steer=t.steer;v.manualBrakePressure=t.manualPressure;v.brakeAmount=t.brakeAmount;v.brake=t.brakeAmount>.025;v.grounded=e.grounded;v.wheelSupportCount=t.supportCount;v.wheelCompressions=[...t.compressions];v.wheelVisualCompressions=[...t.compressions];v.suspensionRest=.18;v.suspensionRebound=.08;v.driftAmount=t.drift??0;
  if(e.air){v.roadsterTires=structuredClone(t);rememberRoadsterAir(this.game,v);}
  v.root.position.copy(v.pos);v.root.quaternion.copy(q);updateVehicleVisuals(v,dt);e.published.copy(v.pos);e.yaw=v.yaw;e.serial=v.physicsResetSerial??0;
  if(e.isPlayer){this.game.handleAxleFault?.(v);if(v.model.id==='c800'&&(v.brakeFault?.justCounted||v.brakeFault?.justTriggered||v.brakeFault?.justBroke)){this.game.rememberBrakeFault?.();this.game.save?.(false);}}
 }
 flushDamage(dt){
  const hits=new Map();
  this.events.drainContactForceEvents(event=>{
   const a=this.byCollider.get(event.collider1()),b=this.byCollider.get(event.collider2());if(!a&&!b)return;
   const ea=this.vehicles.get(a),eb=this.vehicles.get(b);this.metrics.contacts++;
   let impact=0,normal=null,point=null,pointCount=0;
   const consider=(p,n)=>{
    // n points from event collider1 to collider2. Only approaching contact
    // points contribute: abs(dot) would also count separating/rebound motion.
    const closing=contactVelocity(ea,p).sub(contactVelocity(eb,p)).dot(n);
    if(closing>impact){impact=closing;normal=n;point=p;}
   };
   const collider1=this.world.getCollider(event.collider1()),collider2=this.world.getCollider(event.collider2());
   if(collider1&&collider2)this.world.contactPair(collider1,collider2,(manifold,flipped)=>{
    // Rapier may store this pair in the opposite order. Its manifold normal is
    // world-space; flipped reverses which collider its first shape refers to.
    const n=vec(manifold.normal()).normalize().multiplyScalar(flipped?-1:1);
    for(let i=0;i<manifold.numSolverContacts();i++){const p=manifold.solverContactPoint(i);if(p){pointCount++;consider(vec(p),n);}}
   });
   // A CCD force event may no longer expose a solver point. Preserve linear
   // impact reporting without inventing a lever arm or angular contribution.
   if(!pointCount)consider(null,vec(event.maxForceDirection()).normalize());
   if(impact<.75)return;
   for(const[v,e,other,sign]of[[a,ea,b,-1],[b,eb,a,1]])if(v){const hit={impactSpeed:impact,normal:normal.clone().multiplyScalar(sign),point:point?point.clone():vec(e.rb.translation()),normalImpulse:event.totalForceMagnitude()*dt,bodyMass:e.state.config.mass,otherMass:other?this.vehicles.get(other).state.config.mass:Infinity,source:'rapier-contact'};let contacts=hits.get(v);if(!contacts)hits.set(v,contacts=new Map());if(!contacts.has(other)||contacts.get(other).impactSpeed<impact)contacts.set(other,hit);}
  });
  for(const[v,contacts]of hits)for(const[other,hit]of contacts)this.game.applyCollisionDamage?.(v,hit.impactSpeed,!!other,hit,other??null);
 }
 checkpoint(){
  // The failure latch prevents further stepping, so restoring body state is sufficient;
  // no full-world serialization/allocation of immutable terrain is needed each tick.
  const states=[...this.vehicles].map(([v,e])=>({v,e,translation:{...e.rb.translation()},rotation:{...e.rb.rotation()},velocity:{...e.rb.linvel()},angular:{...e.rb.angvel()},air:e.air?{...e.air,reserve:new AirReserve(e.air.reserve.units)}:null,wheels:e.wheels?structuredClone(e.wheels):null,state:{manualPressure:e.state.manualPressure,steer:e.state.steer,energyUsed:e.state.energyUsed,time:e.state.time},published:e.published.clone(),yaw:e.yaw}));
  const metrics={...this.metrics};
  return()=>{
   if(!this.world)return;
   const originals=new Set(states.map(x=>x.e));for(const[v,e]of this.vehicles)if(!originals.has(e)){this.world.removeRigidBody(e.rb);this.vehicles.delete(v);this.byCollider.delete(e.collider.handle);delete v.rapierBody;}
   for(const s of states){const {v,e}=s;if(!e.rb.isValid())throw Error('Rapier rollback body missing');e.rb.setEnabled(true);e.rb.setTranslation(s.translation,false);e.rb.setRotation(s.rotation,false);e.rb.setLinvel(s.velocity,false);e.rb.setAngvel(s.angular,false);e.rb.resetForces(false);e.rb.resetTorques(false);e.air=s.air;e.wheels=s.wheels;Object.assign(e.state,s.state);e.published.copy(s.published);e.yaw=s.yaw;this.vehicles.set(v,e);this.byCollider.set(e.collider.handle,v);}
   this.retired.length=0;Object.assign(this.metrics,metrics);this.events?.clear();
  };
 }
 release(){
  this.lifecycle?.abort();for(const p of this.patches.splice(0).reverse())if(p.object[p.key]===p.replacement)p.object[p.key]=p.original;
  for(const v of this.vehicles.keys())delete v.rapierBody;this.vehicles.clear();this.byCollider.clear();this.controls.clear();this.retired.length=0;this.geometry?.clear();this.events?.free();this.events=null;this.world?.free();this.world=null;this.geometry=null;
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.ready=false;this.clock.suspend();this.release();}
}
