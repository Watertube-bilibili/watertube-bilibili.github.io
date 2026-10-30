import {WORLD_MIN_X,WORLD_LIMIT} from './regions.js';
import {FixedStepClock} from './fixed-step-clock.mjs';
import {stepVehicleMotion,updateVehicleVisuals} from './vehicle-physics.js';
import {captureVehiclePose} from './render-motion.js';
import {resolveVehicleWorld,resolveVehiclePair} from './vehicle-dynamics.js';
export const BROWSER_CAPABILITIES=Object.freeze({carPlanar:true,walk:true,deliveryClock:true,native3D:false,motorcycle:false,aircraft:false,roadsterFlight:false,structuralWheelDetachment:false,surfaceMeshVehicleCollision:false});
export class BrowserPhysicsSystem {
 constructor(game,{hidden=()=>globalThis.document?.hidden??false}={}){this.game=game;this.hidden=hidden;this.clock=new FixedStepClock();this.lastTick=0;this.ready=false;this.failed=false;this.drivesRender=false;this.backend='Browser planar experiment (NOT native 3D)';this.capabilities=BROWSER_CAPABILITIES;this.metrics={ticks:0,bodies:0,contacts:0,droppedSeconds:0};this.unsupported=new Set();}
 supportsVehicle(v){return v?.kind!=='motorcycle'&&v?.kind!=='aircraft'&&!/roadster/i.test(v?.model?.id??'');}
 reject(feature){this.unsupported.add(feature);this.game.ui?.toast('浏览器实验暂不支持：'+feature+'；正式功能尚未迁移','error');return false;}
 async start(){
  const g=this.game;
  this.lifecycle=new AbortController();
  globalThis.document?.addEventListener('visibilitychange',()=>this.clock.suspend(),{signal:this.lifecycle.signal});
  globalThis.window?.addEventListener('blur',()=>this.clock.suspend(),{signal:this.lifecycle.signal});
  globalThis.window?.addEventListener('pagehide',()=>{this.clock.suspend();this.ready=false;this.lifecycle.abort();},{once:true});
  const garage=g.ui?.openGarage?.bind(g.ui);if(garage)g.ui.openGarage=(...args)=>{const result=garage(...args);for(const b of document.querySelectorAll('[data-garage-car]'))if(/mica_scooter|ember_street|ridge_dual|roadster/i.test(b.dataset.garageCar)){b.disabled=true;b.textContent='浏览器物理尚未支持 · 保留原版';}return result;};
  const entry=g.toggleEntry?.bind(g);if(entry)g.toggleEntry=()=>!g.inCar&&g.nearestCar&&!this.supportsVehicle(g.nearestCar)?this.reject('该车型上车'):entry();
  for(const service of [g.aircraft,g.flight])for(const name of ['board','start','spawn'])if(typeof service?.[name]==='function')service[name]=()=>{this.reject('飞行');return {ok:false,reason:'浏览器实验未实现飞行物理'};};
  const original=g.spawnCar?.bind(g);if(original)g.spawnCar=id=>/mica_scooter|ember_street|ridge_dual|roadster/i.test(id)?this.reject('该车型'):original(id);
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
   this.lastTick=tick;g.beginVehicleStep();g.world.update(g.position);g.physicsTick(dt);
   if(g.paused||this.hidden()||this.failed)return false;
   this.resolveContacts();
   this.metrics.ticks=tick;this.metrics.bodies=g.allVehicles().length;
  });this.metrics.droppedSeconds=this.clock.droppedSeconds;
 }
 submitVehicle(v,input,dt,isPlayer=false){
  if(!this.supportsVehicle(v)){if(isPlayer)this.reject(v.kind??v.model?.id);v.speed=0;return;}
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
  const cars=this.game.allVehicles().filter(v=>this.supportsVehicle(v));
  for(let i=0;i<cars.length;i++)for(let j=i+1;j<cars.length;j++){
   const a=cars[i],b=cars[j];if(Math.hypot(a.pos.x-b.pos.x,a.pos.z-b.pos.z)>30)continue;
   const hit=resolveVehiclePair(a,b,{previousA:a.collisionPrevious,previousB:b.collisionPrevious});if(!hit)continue;
   this.metrics.contacts++;this.game.applyCollisionDamage(a,hit.impactSpeed,true,{...hit,normalSign:-1},b);this.game.applyCollisionDamage(b,hit.impactSpeed,true,{...hit,normalSign:1},a);
  }
 }
}
