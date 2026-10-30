import {BrowserBodyRegistry} from './browser-body-registry.js';
import {tickRoadsterAirLedger} from './roadster-air-ledger.js';
import {BrowserRoadsterAdapter,BROWSER_ROADSTER_IDS} from './browser-roadster-adapter.js';
import {BrowserMotorcycleAdapter,BROWSER_MOTORCYCLE_IDS} from './browser-motorcycle-adapter.js';
import {WORLD_MIN_X,WORLD_LIMIT} from './regions.js';
import {FixedStepClock} from './fixed-step-clock.mjs';
import {stepVehicleMotion,updateVehicleVisuals} from './vehicle-physics.js';
import {captureVehiclePose} from './render-motion.js';
import {resolveVehicleWorld,resolveVehiclePair} from './vehicle-dynamics.js';
export const BROWSER_CAPABILITIES=Object.freeze({carPlanar:true,walk:true,deliveryClock:true,native3D:false,motorcycle:false,aircraft:false,roadsterFlight:false,structuralWheelDetachment:false,surfaceMeshVehicleCollision:false});
export class BrowserPhysicsSystem {
 constructor(game,{hidden=()=>globalThis.document?.hidden??false,motorcycles=false,roadsters=false,roadsterModels=BROWSER_ROADSTER_IDS}={}){this.game=game;this.hidden=hidden;this.clock=new FixedStepClock();this.lastTick=0;this.ready=false;this.failed=false;this.drivesRender=false;this.backend='Browser planar experiment (NOT native 3D)';this.roadsterModels=new Set(roadsterModels);this.roadsters=roadsters?new BrowserRoadsterAdapter(game):null;this.motorcycles=motorcycles?new BrowserMotorcycleAdapter(game):null;this.capabilities=Object.freeze({...BROWSER_CAPABILITIES,motorcycle:!!motorcycles,motorcycleRigidBody:!!motorcycles,roadsterManualFlight:!!roadsters,roadsterFlight:false,roadsterManeuvers:false});this.metrics={ticks:0,bodies:0,contacts:0,droppedSeconds:0};this.unsupported=new Set();}
 supportsModel(id){return (!/roadster/i.test(id??'')||(!!this.roadsters&&this.roadsterModels.has(id)))&&(!BROWSER_MOTORCYCLE_IDS.includes(id)||!!this.motorcycles);}
 supportsVehicle(v){return (v?.kind!=='motorcycle'||(!!this.motorcycles&&BROWSER_MOTORCYCLE_IDS.includes(v?.model?.id)))&&v?.kind!=='aircraft'&&this.supportsModel(v?.model?.id);}
 reject(feature){this.unsupported.add(feature);this.game.ui?.toast('当前日出尚不支持：'+feature+'；未改变原进度','error');return false;}
 async start(){
  const g=this.game;
  this.lifecycle=new AbortController();
  globalThis.document?.addEventListener('visibilitychange',()=>this.clock.suspend(),{signal:this.lifecycle.signal});
  globalThis.window?.addEventListener('blur',()=>this.clock.suspend(),{signal:this.lifecycle.signal});
  globalThis.window?.addEventListener('pagehide',()=>{this.clock.suspend();this.ready=false;this.lifecycle.abort();},{once:true});
  const garage=g.ui?.openGarage?.bind(g.ui);if(garage)g.ui.openGarage=(...args)=>{const result=garage(...args);for(const b of document.querySelectorAll('[data-garage-car]'))if(!this.supportsModel(b.dataset.garageCar)){b.disabled=true;b.textContent='浏览器物理尚未支持 · 保留原版';}return result;};
  const entry=g.toggleEntry?.bind(g);if(entry)g.toggleEntry=()=>!g.inCar&&g.nearestCar&&!this.supportsVehicle(g.nearestCar)?this.reject('该车型上车'):entry();
  for(const service of [g.aircraft,g.flight])for(const name of ['board','start','spawn'])if(typeof service?.[name]==='function')service[name]=()=>{this.reject('飞行');return {ok:false,reason:'浏览器实验未实现飞行物理'};};
  const original=g.spawnCar?.bind(g);if(original)g.spawnCar=id=>!this.supportsModel(id)?this.reject('该车型'):original(id);
  if(!this.supportsVehicle(g.vehicle))throw Error('该实验存档车型尚不支持；原存档保留');
  // The production world lifecycle owns BFCache reload; local previews retain their own owner.
  if(!g.browserWorldLifecycle&&!globalThis.window?.__sunriseBrowserWorldLifecycle)globalThis.window?.addEventListener('pageshow',event=>{if(event.persisted)globalThis.location.reload();});
  this.ready=true;return this;
 }
 queueCommand(command){throw Error('Unsupported native command: '+command?.type);}
 sendControls(){throw Error('Native aircraft controls unavailable in browser backend');}
 interpolationAlpha(){return this.clock.alpha;}
 advance(now){
  if(!this.ready||this.failed)return;
  const g=this.game;
  this.clock.advance(now,g.paused||this.hidden(),(dt,tick)=>{
   if(g.paused||this.hidden()||this.failed)return false;
   const previousTick=this.lastTick,time=g.time,restoreVehicles=(this.motorcycles||this.roadsters)?checkpointVehicles(g.allVehicles()):null,restoreBodies=this.motorcycles?.checkpoint(),restoreAir=this.roadsters?.checkpoint();
   try{
    g.world.update(g.position);this.motorcycles?.begin();this.roadsters?.begin();
    this.lastTick=tick;g.beginVehicleStep();g.physicsTick(dt);
    if(g.paused||this.hidden()||this.failed)return false;
    this.motorcycles?.finish(dt);this.roadsters?.finish(dt);this.resolveContacts();this.motorcycles?.flushDamage();this.roadsters?.flushDamage();if(this.roadsters)tickRoadsterAirLedger(g,dt,new Set(this.roadsters.states.keys()));
    this.metrics.ticks=tick;this.metrics.bodies=g.allVehicles().length;
   }catch(error){
    restoreVehicles?.();restoreBodies?.();restoreAir?.();g.time=time;this.lastTick=previousTick;this.clock.tick=previousTick;this.failed=true;g.paused=true;this.error=error;
    g.ui?.toast?.('浏览器物理异常，已暂停：'+error.message+'；请刷新恢复最近存档','error');return false;
   }
  });this.metrics.droppedSeconds=this.clock.droppedSeconds;
 }
 submitVehicle(v,input,dt,isPlayer=false){
  if(!this.supportsVehicle(v)){if(isPlayer)this.reject(v.kind??v.model?.id);v.speed=0;return;}
  if(BROWSER_ROADSTER_IDS.includes(v.model.id)){this.roadsters.step(v,input,dt,isPlayer);return;}
  if(v.kind==='motorcycle'){this.motorcycles.step(v,input,dt,isPlayer);return;}
  captureVehiclePose(v);const previous={x:v.pos.x,z:v.pos.z,yaw:v.yaw};
  stepVehicleMotion(v,input,dt);
  const hit=resolveVehicleWorld(v,previous,this.game.world.colliders??[]);
  if(hit){this.metrics.contacts++;this.game.applyCollisionDamage(v,hit.impactSpeed,false,hit);}
  const x=Math.max(WORLD_MIN_X+4,Math.min(WORLD_LIMIT-8,v.pos.x)),z=Math.max(-WORLD_LIMIT+8,Math.min(WORLD_LIMIT-8,v.pos.z));if(x!==v.pos.x||z!==v.pos.z){v.pos.x=x;v.pos.z=z;v.speed=0;v.slipVelocityX=0;v.slipVelocityZ=0;}
  if(isPlayer&&v.model.id==='c800'&&(v.brakeFault?.justCounted||v.brakeFault?.justTriggered||v.brakeFault?.justBroke)){this.game.rememberBrakeFault?.();this.game.save?.(false);}
  updateVehicleVisuals(v,dt);v.pos.y=(this.game.world.groundHeight?.(v.pos.x,v.pos.z)??0)+.02;
  if(isPlayer){this.game.handleAxleFault?.(v);v.battery=Math.max(0,v.battery-Math.abs(v.speed)*dt*.0008);}
 }
 resolveContacts(){
  const cars=[...new Set(this.game.allVehicles())].filter(v=>this.supportsVehicle(v)),registry=new BrowserBodyRegistry([this.motorcycles,this.roadsters].filter(Boolean));
  this.bodyRegistry=registry;
  for(let i=0;i<cars.length;i++)for(let j=i+1;j<cars.length;j++){
   const a=cars[i],b=cars[j];const movement=Math.hypot(a.pos.x-(a.collisionPrevious?.x??a.pos.x),a.pos.z-(a.collisionPrevious?.z??a.pos.z))+Math.hypot(b.pos.x-(b.collisionPrevious?.x??b.pos.x),b.pos.z-(b.collisionPrevious?.z??b.pos.z));if(Math.hypot(a.pos.x-b.pos.x,a.pos.z-b.pos.z)>30+movement)continue;
   if(registry.hasRigid(a)||registry.hasRigid(b)){if(registry.pair(a,b))this.metrics.contacts++;continue;}
   const hit=resolveVehiclePair(a,b,{previousA:a.collisionPrevious,previousB:b.collisionPrevious});if(!hit)continue;
   this.metrics.contacts++;this.game.applyCollisionDamage(a,hit.impactSpeed,true,{...hit,normalSign:-1},b);this.game.applyCollisionDamage(b,hit.impactSpeed,true,{...hit,normalSign:1},a);
  }
 }
}

function checkpointVehicles(vehicles){
 const saved=vehicles.map(v=>{const scalar=Object.fromEntries(Object.entries(v).filter(([,x])=>x===null||['number','string','boolean','undefined'].includes(typeof x))),arrays=Object.fromEntries(['wheelCompressions','wheelVisualCompressions'].map(k=>[k,v[k]?.slice()]));
  return{v,scalar,arrays,pos:v.pos.clone(),rootPosition:v.root.position.clone(),rootQuaternion:v.root.quaternion.clone(),q:v.physicsQuaternion?.clone(),previous:v.previousRenderPose?{...v.previousRenderPose,position:v.previousRenderPose.position.clone(),quaternion:v.previousRenderPose.quaternion?.clone(),wheels:v.previousRenderPose.wheels?.map(w=>({...w}))}:undefined,wheels:(v.wheels??[]).map(w=>({w,spinAngle:w.spinAngle,p:w.pivot.position.clone(),q:w.pivot.quaternion.clone(),sq:w.spin.quaternion.clone()}))};});
 return()=>{for(const {v,scalar,arrays,pos,rootPosition,rootQuaternion,q,previous,wheels}of saved){for(const [k,x]of Object.entries(v))if((x===null||['number','string','boolean','undefined'].includes(typeof x))&&!(k in scalar))delete v[k];Object.assign(v,scalar);for(const[k,x]of Object.entries(arrays))if(x)v[k]=x;else delete v[k];v.pos.copy(pos);v.root.position.copy(rootPosition);v.root.quaternion.copy(rootQuaternion);if(q){v.physicsQuaternion??=q.clone();v.physicsQuaternion.copy(q);}else delete v.physicsQuaternion;if(previous)v.previousRenderPose=previous;else delete v.previousRenderPose;for(const x of wheels){x.w.spinAngle=x.spinAngle;x.w.pivot.position.copy(x.p);x.w.pivot.quaternion.copy(x.q);x.w.spin.quaternion.copy(x.sq);}}};
}
