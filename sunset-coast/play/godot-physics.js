import {applyRoadsterTireSnapshot} from './roadster-tire-telemetry.js';
import {parkingBrakeControls} from './touch-transmission.js';
import {cargoGodotControls} from './cargo-career.js';
import {createGodotAssetCache} from './godot-asset-cache.js';
import {createStartupDiagnostics} from './godot-startup-diagnostics.js';
import {physicsSurfaceMesh} from './physics-surfaces.js';
import {stepAxleFault,axleFaultEffects} from './axle-fault.js';
import {clampRoadsterControls,roadsterSpawnConfig,applyRoadsterSnapshot} from './roadster-controls.js';
import {CURRENT_RELEASE} from './release-notes.js';
import * as THREE from './vendor/three.module.js';
import {stepBrakeFault} from './brake-fault.js';
import {captureVehiclePose,resetVehiclePose} from './render-motion.js';
import {updateVehicleVisuals} from './vehicle-physics.js';
import {getVehicleCollider} from './vehicle-dynamics.js';
import {ContactImpactTracker} from './impact-damage.js';
import {WORLD_MIN_X,WORLD_LIMIT} from './regions.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const Y=new THREE.Vector3(0,1,0);
const vector=a=>new THREE.Vector3(...a);
const finiteArray=(a,n)=>Array.isArray(a)&&a.length===n&&a.every(Number.isFinite);
export const GODOT_VERSION='4.6.3';

// This module adapts controls and snapshots. It never integrates position,
// resolves rigid-body collisions or imposes a second clock on Godot.
export function godotCarControls(v,input,dt){
 input=parkingBrakeControls(v,input);
 stepAxleFault(v,input,dt);const axle=axleFaultEffects(v);
 let throttle=clamp(input.throttle,-1,1);
 const request=typeof input.brake==='number'?clamp(input.brake,0,1):input.brake?1:0;
 const pilot=input.brakeSource==='pilot';
 let manual=pilot?0:request,electronic=Math.max(pilot?request:0,clamp(input.electronicBrake,0,1));
 if(throttle<0&&v.speed>1.2){if(pilot)electronic=Math.max(electronic,-throttle);else manual=Math.max(manual,-throttle);throttle=0;}
 v.requestedBrakeAmount=manual;
 const effective=stepBrakeFault(v,manual,dt);
 v.manualBrakeAmount=effective;v.electronicBrakeAmount=electronic;v.brakeSource=pilot?'pilot':'manual';
 v.handbrake=!!input.handbrake;v.propulsionDisabled=v.condition<=0;
 return{throttle,axleBroken:axle.broken,axleSide:axle.side,steer:clamp(input.steer,-.8,.8),manualBrake:effective,electronicBrake:electronic,
  manualBrakeBroken:!!v.brakeFault?.broken,handbrake:!!input.handbrake,condition:v.condition,battery:v.battery,...clampRoadsterControls(v,input)};
}

// Optional authored four-contact layout. The existing Godot binary still simulates
// four suspension points; tandem visual wheels do not create extra physics contacts.
export function authoredPhysicsWheelOffsets(v){
 const offsets=v.physicsWheelOffsets;if(offsets==null)return null;
 if(!Array.isArray(offsets)||offsets.length!==4||offsets.some(w=>!Array.isArray(w)||w.length!==5||!w.every(Number.isFinite)||w[3]<=0))throw Error('Invalid authored four-contact wheel layout');
 return offsets.map(w=>w.slice());
}
export function vehicleSpawnCommand(v,id){
 const collider=getVehicleCollider(v),q=new THREE.Quaternion().setFromAxisAngle(Y,v.yaw??0);
 const height=Math.max(.7,(v.height??1.5)-.35);
 return{type:'spawn',id,kind:'car',...roadsterSpawnConfig(v),pos:[v.pos.x,v.pos.y+.72,v.pos.z],quat:q.toArray(),
  linear:[-Math.sin(v.yaw)*(v.speed??0),0,-Math.cos(v.yaw)*(v.speed??0)],
  ...(v.model.id==='apex'?{suspensionProfile:'low-sports'}:{}),
  mass:v.mass??v.model.mass??1700,size:[Math.max(1.2,collider.halfWidth*2-.08),height,collider.halfLength*2-.1],collisionOffset:[collider.offsetX??0,.2+height/2-.72,collider.offsetZ??0],
  wheelOffsets:authoredPhysicsWheelOffsets(v)??[true,false].flatMap(front=>[-1,1].map(side=>{const w=v.wheels?.find(w=>w.front===front&&w.side===side);return w?[w.pivot.position.x,.1,w.pivot.position.z,w.radius,w.suspensionRestY??w.pivot.position.y]:[side*(v.track??1.65)/2,.1,(front?-1:1)*(v.wheelBase??2.9)/2];})),
  power:v.model.power,maxSpeed:v.model.max,wheelBase:v.wheelBase,track:v.track,maxSteer:v.maxSteer,lateralGrip:v.lateralGrip??v.model.tireGrip??9.8};
}

export class GodotPhysicsSystem{
 constructor(game,{now=()=>performance.now(),loadEngine=loadGodotEngine}={}){
  this.game=game;this.now=now;this.loadEngine=loadEngine;this.vehicles=new Map();this.byId=new Map();this.chunks=new Map();
  this.surfaceStats=new Map();this.contactImpacts=new ContactImpactTracker();this.commands=[];this.controlMap=new Map();this.externalControls=new Map();this.serial=0;this.lastTick=0;this.lastSnapshotTime=0;
  this.renderAlpha=null;this.drivesRender=false;this.ready=false;this.failed=false;this.backend='Godot Physics 3D · loading';this.metrics={ticks:0,bodies:0,chunks:0,contacts:0};
 }
 async start(){
  let resolveReady,rejectReady,timer;
  const readyWait=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});
  // The scene may report _ready on the next engine frame after startGame's
  // promise resolves. Wait for its real handshake, not a synchronous guess.
  readyWait.catch(()=>{});
  try{
   const callbacks={frame:alpha=>this.renderFrame(alpha),ready:(version,backend)=>{if(this.failed)return;if(version!==CURRENT_RELEASE||!backend.includes(GODOT_VERSION)){const error=Error('物理引擎版本不匹配');this.fail(error);rejectReady(error);return;}this.backend=backend;this.ready=true;globalThis.__neonGodotStartup?.record('ready');resolveReady();},tick:json=>JSON.stringify(this.tick(JSON.parse(json))),error:message=>{const error=Error(message);this.fail(error);rejectReady(error);}};
   this.engine=await this.loadEngine(callbacks);
   if(this.failed)throw Error('Godot 物理桥启动失败');
   await Promise.race([readyWait,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Godot 未建立物理桥，请重新加载')),15000);})]);
   return this;
  }catch(error){this.fail(error);throw error;}finally{clearTimeout(timer);}
 }
 fail(error){if(this.failed)return;this.failed=true;this.ready=false;this.game.paused=true;this.game.resetControls?.();this.game.onPhysicsFailure?.(error);}
 queueCommand(command){this.commands.push(command);}
 sendControls(control){this.externalControls.set(control.id,control);}
 submitVehicle(v,input,dt,isPlayer=false){
  const controls=cargoGodotControls(v,godotCarControls(v,input,dt));this.controlMap.set(v,controls);
  if(isPlayer){this.game.handleAxleFault?.(v);v.battery=Math.max(0,v.battery-dt*(Math.abs(v.speed)*.0008+(v.roadsterState?.lift??0)*.06+(v.roadsterState?.boost??0)*.04));if(v.model.id==='c800'&&(v.brakeFault.justCounted||v.brakeFault.justTriggered||v.brakeFault.justBroke)){this.game.rememberBrakeFault?.();this.game.save?.(false);}}
 }
 // Godot's process phase is authoritative. A callback arrival timestamp is
 // not a physics boundary when the browser batches ticks at 30/90 Hz.
 interpolationAlpha(){return this.renderAlpha??clamp((this.now()-this.lastSnapshotTime)/(1000/60),0,1);}
 renderFrame(alpha){
  if(this.failed||!this.ready)return;
  if(!Number.isFinite(alpha)){this.fail(Error('Godot 返回了无效渲染相位'));return;}
  this.renderAlpha=clamp(alpha,0,1);this.drivesRender=true;
  try{this.game.loop(this.now(),true);}catch(error){this.fail(error);}
 }
 desiredVehicles(){const g=this.game,p=g.aircraft?.pendingBoard?g.aircraft.aircraft.pos:g.position;return g.allVehicles().filter(v=>v.kind!=='aircraft'&&Math.hypot(v.pos.x-p.x,v.pos.z-p.z)<550);}
 syncVehicles(){
  const desired=new Set(this.desiredVehicles());
  for(const [v,entry]of this.vehicles)if(!desired.has(v)){this.commands.push({type:'remove',id:entry.id});this.contactImpacts.forgetBody(entry.id);this.vehicles.delete(v);this.byId.delete(entry.id);v.godotPhysics=false;}
  for(const v of desired){
   let entry=this.vehicles.get(v);
   if(!entry){const id='vehicle:'+ ++this.serial;entry={id,position:v.pos.clone(),yaw:v.yaw,resetSerial:v.physicsResetSerial??0,skipSnapshot:true};this.vehicles.set(v,entry);this.byId.set(id,v);v.godotPhysics=true;v.physicsId=id;const spawn=vehicleSpawnCommand(v,id);entry.mass=spawn.mass;this.commands.push(spawn);resetVehiclePose(v);}
   else if(v.pos.distanceToSquared(entry.position)>1e-8||Math.abs(wrap(v.yaw-entry.yaw))>1e-5||entry.resetSerial!==(v.physicsResetSerial??0)){
    const q=new THREE.Quaternion().setFromAxisAngle(Y,v.yaw),origin=v.pos.clone().add(new THREE.Vector3(0,.72,0).applyQuaternion(q));
    this.contactImpacts.forgetBody(entry.id);this.commands.push({type:'teleport',id:entry.id,pos:origin.toArray(),quat:q.toArray(),linear:[-Math.sin(v.yaw)*(v.speed??0),0,-Math.cos(v.yaw)*(v.speed??0)],angular:[0,0,0]});
    entry.position.copy(v.pos);entry.yaw=v.yaw;entry.resetSerial=v.physicsResetSerial??0;entry.skipSnapshot=true;resetVehiclePose(v);
   }
  }
 }
 applySnapshot(snapshot){
  const ignoredContacts=new Set();
  for(const state of snapshot.bodies??[]){
   const v=this.byId.get(state.id);if(!v){this.game.aircraft?.applySnapshot?.(state);continue;}
   const entry=this.vehicles.get(v);if(entry.skipSnapshot){entry.skipSnapshot=false;ignoredContacts.add(state.id);continue;}
   if(!finiteArray(state.pos,3)||!finiteArray(state.quat,4)||!finiteArray(state.linear,3))throw Error('Godot 返回了无效姿态');
   if(Number.isFinite(state.mass)&&state.mass>0)entry.mass=state.mass;
   captureVehiclePose(v);const previous=v.pos.clone(),oldSpeed=v.speed;
   const q=new THREE.Quaternion(...state.quat).normalize(),p=vector(state.pos).sub(new THREE.Vector3(0,state.rideHeight??.72,0).applyQuaternion(q));
   v.physicsQuaternion??=new THREE.Quaternion();v.physicsQuaternion.copy(q);v.pos.copy(p);v.root.quaternion.copy(q);
   const forward=new THREE.Vector3(0,0,-1).applyQuaternion(q);v.yaw=Math.atan2(-forward.x,-forward.z);
   v.speed=state.speed;v.yawRate=state.angular?.[1]??0;v.lateralSpeed=state.lateralSpeed??0;v.slipVelocityX=state.linear[0]+Math.sin(v.yaw)*v.speed;v.slipVelocityZ=state.linear[2]+Math.cos(v.yaw)*v.speed;
   v.travelDistance=previous.distanceTo(p)*Math.sign(v.speed||oldSpeed||1);v.longitudinalAcceleration=(v.speed-oldSpeed)/(snapshot.dt||1/60);
   v.steer=state.steer;v.manualBrakePressure=state.manualBrakePressure;v.brakeAmount=state.brakeAmount;v.brake=state.brakeAmount>.025;v.driftAmount=state.driftAmount;v.grounded=state.grounded;v.suspensionRest=state.suspensionRest??.18;v.suspensionRebound=state.suspensionRebound??.08;v.wheelCompressions=state.wheelCompressions;v.wheelVisualCompressions=state.wheelVisualCompressions??state.wheelCompressions;
   applyRoadsterSnapshot(v,state);applyRoadsterTireSnapshot(v,state);updateVehicleVisuals(v,snapshot.dt||1/60);entry.position.copy(v.pos);entry.yaw=v.yaw;entry.resetSerial=v.physicsResetSerial??0;
  }
  for(const c of this.contactImpacts.collect(snapshot.contacts??[],snapshot.tick,ignoredContacts)){
   const a=this.byId.get(c.a),b=this.byId.get(c.b),point={x:c.point[0],y:c.point[1],z:c.point[2]};
   // A manifold point is often a box corner. Position-only classification
   // can label a head-on hit as a side hit. Godot's normal points into A;
   // transform its outward counterpart into each body's actual local frame.
   const regionFor=(v,sign)=>{
    if(!finiteArray(c.normal,3))return undefined;
    const outward=vector(c.normal).multiplyScalar(sign);
    const q=v.physicsQuaternion??new THREE.Quaternion().setFromAxisAngle(Y,v.yaw);
    outward.applyQuaternion(q.clone().invert());
    if(Math.max(Math.abs(outward.x),Math.abs(outward.z))<.25)return undefined;
    return Math.abs(outward.x)>Math.abs(outward.z)?outward.x<0?'left':'right':outward.z<0?'front':'rear';
   };
   if(a)this.game.applyCollisionDamage(a,c.relativeNormalSpeed,!!b,{point,impulse:c.impulse,normalImpulse:c.impulse,bodyMass:this.vehicles.get(a)?.mass,otherMass:b?this.vehicles.get(b)?.mass:Infinity,region:regionFor(a,-1),damageEvent:c.damageEvent},b);
   if(b)this.game.applyCollisionDamage(b,c.relativeNormalSpeed,!!a,{point,impulse:c.impulse,normalImpulse:c.impulse,bodyMass:this.vehicles.get(b)?.mass,otherMass:a?this.vehicles.get(a)?.mass:Infinity,region:regionFor(b,1),damageEvent:c.damageEvent},a);
   this.game.aircraft?.onContact?.(c,snapshot.tick);
  }
 }
 syncWorld(){
  const world=this.game.world,next=new Set();
  if(!this.coreSurfacesLoaded){this.coreSurfacesLoaded=true;const mesh=physicsSurfaceMesh(this.game.scene,world.groundHeight??(()=>0),{exclude:world.root});if(mesh.indices.length)this.commands.push({type:'staticChunk',id:'road-surfaces:core',surfaceMesh:mesh});this.surfaceStats.set('core',mesh.indices.length/3);}
  if(!this.boundariesLoaded){
   this.boundariesLoaded=true;const west=WORLD_MIN_X-2,east=WORLD_LIMIT-2,north=-WORLD_LIMIT+2,south=WORLD_LIMIT-2,mid=(west+east)/2;
   this.commands.push({type:'staticChunk',id:'world-boundaries',boxes:[
    {id:'map-edge-west',pos:[west,2000,0],size:[4,6000,WORLD_LIMIT*2]},
    {id:'map-edge-east',pos:[east,2000,0],size:[4,6000,WORLD_LIMIT*2]},
    {id:'map-edge-north',pos:[mid,2000,north],size:[east-west,6000,4]},
    {id:'map-edge-south',pos:[mid,2000,south],size:[east-west,6000,4]}]});
  }
  for(const [key,chunk]of world.chunks??[]){
   next.add(key);if(this.chunks.get(key)===chunk)continue;
   const heights=chunk.heightfield??world.buildTerrainHeightfield?.(chunk.cx,chunk.cz);
   if(!heights)throw Error('场景缺少物理地形采样');
   const boxes=(chunk.colliders??[]).map((b,i)=>colliderCommand(b,'chunk:'+key+':'+i));
   const surfaceMesh=physicsSurfaceMesh(chunk.group,world.groundHeight??(()=>0));this.surfaceStats.set(key,surfaceMesh.indices.length/3);
   this.commands.push({type:'staticChunk',id:'terrain:'+key,boxes,heightfield:heights,...(surfaceMesh.indices.length?{surfaceMesh}: {})});this.chunks.set(key,chunk);
  }
  for(const key of this.chunks.keys())if(!next.has(key)){this.commands.push({type:'staticChunk',id:'terrain:'+key,remove:true});this.chunks.delete(key);this.surfaceStats.delete(key);}
  // The streamer mutates a stable collider array. Its revision avoids scanning
  // and allocating strings for thousands of static boxes on every 60 Hz tick.
  const revision=world.stats?.colliderRevision;
  if(revision===undefined||revision!==this.extraRevision){
   this.extraRevision=revision;
   const extras=(world.colliders??[]).filter(b=>!b.chunk),signature=extras.map(b=>`${b.x},${b.z},${b.w},${b.d},${b.baseY},${b.height},${b.yaw??0}`).join(';');
   if(signature!==this.extraSignature){this.extraSignature=signature;this.commands.push({type:'staticChunk',id:'world-extras',boxes:extras.map((b,i)=>colliderCommand(b,'static:'+i))});
    for(const root of world.root?.children??[])if(root.userData?.airport){const id='airport:'+root.userData.airport,mesh=root.visible?physicsSurfaceMesh(root,world.groundHeight):null;this.commands.push({type:'staticChunk',id:'road-surfaces:'+id,...(mesh?.indices.length?{surfaceMesh:mesh}:{remove:true})});this.surfaceStats.set(id,mesh?.indices.length/3||0);}
   }
  }
  this.metrics.chunks=this.chunks.size;this.metrics.surfaceTriangles=[...this.surfaceStats.values()].reduce((a,b)=>a+b,0);
 }
 tick(snapshot){
  if(this.failed)return{paused:true,commands:[],controls:[]};
  try{
   if(snapshot.v!==1||!Number.isFinite(snapshot.tick)||snapshot.tick<=this.lastTick)throw Error('Godot 物理时钟无效');
   this.lastTick=snapshot.tick;this.lastSnapshotTime=this.now();this.metrics.ticks++;this.metrics.bodies=snapshot.bodies.length;this.metrics.contacts=snapshot.contacts.length;
   this.game.beginVehicleStep?.();this.syncVehicles();this.applySnapshot(snapshot);this.controlMap.clear();
   if(!this.game.paused)this.game.physicsTick(snapshot.dt||1/60);
   this.game.world.update(this.game.aircraft?.pendingBoard?this.game.aircraft.aircraft.pos:this.game.position);this.syncWorld();this.syncVehicles();
   const controls=[];
   for(const [v,entry]of this.vehicles)controls.push({id:entry.id,...(this.controlMap.get(v)??{throttle:0,steer:0,manualBrake:0,electronicBrake:1,handbrake:!!v.parkingBrakeEngaged,condition:v.condition,battery:v.battery,axleBroken:axleFaultEffects(v).broken,axleSide:axleFaultEffects(v).side})});
   controls.push(...this.externalControls.values());this.externalControls.clear();
   const commands=this.commands.splice(0);return{paused:!!this.game.paused,commands,controls};
  }catch(error){this.fail(error);return{paused:true,commands:[],controls:[]};}
 }
}

export function colliderCommand(b,id){
 if(![b.x,b.z,b.w,b.d,b.baseY,b.height].every(Number.isFinite)||b.height<=0)throw Error('场景碰撞体缺少有限高度：'+id);
 return{id,pos:[b.x,b.baseY+b.height/2,b.z],size:[b.w*2,b.height,b.d*2],quat:new THREE.Quaternion().setFromAxisAngle(Y,b.yaw??0).toArray()};
}

let preparedEnginePromise,engineDownloadPromise;
export function shouldPreloadEngine(navigator=globalThis.navigator){
 return !navigator?.connection?.saveData&&!(Number.isFinite(navigator?.deviceMemory)&&navigator.deviceMemory<=4);
}
function downloadPreparedEngine(manifest){
 return engineDownloadPromise??=globalThis.Engine.load('./physics/neon-physics',manifest.fileSizes['./physics/neon-physics.wasm']);
}
export function prepareGodotEngine({downloadEngine=true}={}){
 if(preparedEnginePromise)return preparedEnginePromise;
 globalThis.__neonGodotStartup=createStartupDiagnostics();
 globalThis.__neonGodotStartup.record('manifest');
 preparedEnginePromise=(async()=>{
 if(typeof WebAssembly==='undefined')throw Error('此浏览器不支持 WebAssembly');if(typeof DecompressionStream!=='function')throw Error('此浏览器不支持流解压，请更新至 Safari 16.4 或更新版本，或当前 Chrome/Firefox');
 const manifest=await fetch('./physics/manifest.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('物理引擎清单下载失败');return r.json();});
 if(manifest.version!==GODOT_VERSION)throw Error('物理引擎包版本不匹配');
 const assetCache=createGodotAssetCache(manifest);
 globalThis.__neonGodotAssetCache=assetCache;
 globalThis.__neonGodotAssetFetch=assetCache.fetch;
 globalThis.__neonGodotStartup.record('script');
 await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='./physics/neon-physics.js?v='+manifest.files['neon-physics.js'].sha256.slice(0,16);s.onload=resolve;s.onerror=()=>reject(Error('Godot 引擎脚本下载失败'));document.head.append(s);});
 const missing=globalThis.Engine.getMissingFeatures({threads:false});if(missing.length)throw Error('浏览器缺少 '+missing.join(', '));

 // Engine.load shares its own promise with startGame/init; no second fetch.
 if(downloadEngine)await downloadPreparedEngine(manifest);
 return manifest;
 })();
 return preparedEnginePromise;
}

export async function loadGodotEngine(callbacks){
 const preparation=prepareGodotEngine(),diagnostics=globalThis.__neonGodotStartup;
 const show=()=>{const label=document.getElementById('load-text');if(label)label.textContent=diagnostics.label();};
 show();const statusTimer=setInterval(show,1000);
 try{
 const manifest=await preparation;
 await downloadPreparedEngine(manifest);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=32;canvas.id='physics-canvas';canvas.setAttribute('aria-hidden','true');canvas.tabIndex=-1;canvas.style.cssText='position:fixed;left:-64px;top:0;width:32px;height:32px;pointer-events:none';document.body.append(canvas);
 globalThis.__neonPhysics=callbacks;
 const engine=new globalThis.Engine({executable:'./physics/neon-physics',canvasResizePolicy:0,focusCanvas:false,ensureCrossOriginIsolationHeaders:false,fileSizes:manifest.fileSizes,
  onProgress:(loaded,total)=>{diagnostics.progress(loaded,total);show();},onPrint:()=>{},onPrintError:console.error});
 await engine.startGame({canvas});
 // The compiled Godot project can set its old title during scene startup.
 const title='SUNSET COAST · 2.0 Beta',titleNode=document.querySelector('title');
 document.title=title;if(titleNode)new MutationObserver(()=>{if(document.title!==title)document.title=title;}).observe(titleNode,{childList:true,subtree:true,characterData:true});
 if(diagnostics.state.phase!=='ready')diagnostics.record('bridge-wait');show();return engine;
 }catch(error){diagnostics.record('failed',{failed:true,error:String(error?.message??error)});throw error;}finally{clearInterval(statusTimer);diagnostics.cache();console.info('Godot startup diagnostics',diagnostics.state);}
}
