import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import * as THREE from '../source/runtime-candidate/sunset-coast/play/vendor/three.module.js';
import {createWorldSlot,readWorldSlot} from '../source/runtime-candidate/sunset-coast/play/browser-world-slots.js';
import {installBrowserWorldSnapshot,installCrescentFullRuntime} from '../source/runtime-candidate/sunset-coast/play/browser-world-runtime.js';
import {validateSave} from '../source/runtime-candidate/sunset-coast/play/save-validation.js';
import {loadRoadsterAirLedger} from '../source/runtime-candidate/sunset-coast/play/roadster-air-ledger.js';
const source=readFileSync(new URL('../source/runtime-candidate/sunset-coast/play/game.js',import.meta.url),'utf8');const noop=()=>{};
const deps={COMMON_MAP:true,loadRoadsterAirLedger,vehicleAssetReady:()=>true,cancelPendingVehicleAsset:noop,resetPolice:noop,resetDrivingAssist:noop,streamPopulation:noop,clamp:THREE.MathUtils.clamp,WORLD_LIMIT:10000,CHARACTERS:[{id:'alex'}]};
const realLoad=new Function(...Object.keys(deps),'return ({'+source.slice(source.indexOf(' load('),source.indexOf('\n restoreQuietly('))+'}).load;')(...Object.values(deps));
function storage(){const m=new Map();return {get length(){return m.size},key:i=>[...m.keys()][i],getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),m};}const locks={request:async(_k,f)=>f({})};
async function fixture(inCar,map='crescent'){const s=storage(),e=await createWorldSlot(s,map,validateSave,{locks,idFactory:()=> 'b-real-load'});Object.assign(e.save,{money:45678,health:83,armor:21,ammo:17,clockMinutes:1337,inCar,transactions:Array.from({length:24},(_,i)=>({label:'ledger '+i,amount:i,time:'12:00'}))});Object.assign(e.save.player,{x:-343,y:19.04,z:205.6,yaw:.4});e.save.vehicle.x=-590;e.save.extraInventory={parcels:['a','b']};s.setItem(e.config.key,JSON.stringify(e.save));
 const g={load:realLoad,validateSave,playerPos:new THREE.Vector3(),vehicle:{},person:{root:{visible:true,scale:{setScalar:noop}}},traffic:[],world:{update:noop,blocked:()=>false},ui:{toast:noop,updateAll:noop},sensor:{reset:noop},physics:{lastTick:0},time:0,cancelEntry:noop,clearDestination:noop,removeVehicle:noop,isGarageCar:()=>false,makeVehicle(id,x,z,yaw){return {model:{id},pos:new THREE.Vector3(x,0,z),yaw,battery:0,condition:0};},switchCharacter:noop,walkingHeight:()=>8.24,animateWalkingPerson:noop,setQuality:noop,setWeather:noop,updateLighting:noop,updateCamera:noop,resetControls:noop,clockString:()=> '12:00'};Object.defineProperty(g,'position',{get(){return this.inCar?this.vehicle.pos:this.playerPos}});
 // Same known fields captured by production Game.snapshot; leaf renderer/asset routines stubbed.
 g.snapshot=()=>({...structuredClone(e.save),transactions:g.transactions,money:g.money,health:g.health,armor:g.armor,ammo:g.ammo,clockMinutes:g.clockMinutes,inCar:g.inCar,player:{x:g.playerPos.x,z:g.playerPos.z,yaw:g.playerYaw},vehicle:{...e.save.vehicle,x:g.vehicle.pos.x,z:g.vehicle.pos.z,battery:g.vehicle.battery,condition:g.vehicle.condition}});
 return {g,s,e};}
for(const inCar of [false,true])test('real Game.load + CRESCENT full store retains height/wallet/inventory/time; car='+inCar,async()=>{const {g,s,e}=await fixture(inCar);const validate=installBrowserWorldSnapshot(g,e.config);installCrescentFullRuntime(g,{config:e.config,lease:{ownsLock:()=>true},storage:s,validate});assert.equal(g.money,45678);assert.equal(g.ammo,17);assert.equal(g.clockMinutes,1337);assert.equal(g.playerPos.y,19.04);assert.equal(g.playerPos.x,-343);assert.equal(g.inCar,inCar);g.money=45000;assert.equal(g.save(false),true);const r=await readWorldSlot(s,'crescent',e.id,validateSave);assert.equal(r.save.transactions.length,24);assert.equal(r.save.money,45000);assert.equal(r.save.player.y,19.04);assert.deepEqual(r.save.extraInventory,{parcels:['a','b']});});
test('restore geometric conflict does not write or rebuild stored snapshot',async()=>{const {g,s,e}=await fixture(false);g.world.blocked=()=>true;const before=JSON.stringify([...s.m]);assert.throws(()=>installCrescentFullRuntime(g,{config:e.config,lease:{ownsLock:()=>true},storage:s,validate:installBrowserWorldSnapshot(g,e.config)}),/几何冲突/);assert.equal(JSON.stringify([...s.m]),before);});
test('lost lease prevents full store saves and leaves bytes unchanged',async()=>{const {g,s,e}=await fixture(false);let own=true;installCrescentFullRuntime(g,{config:e.config,lease:{ownsLock:()=>own},storage:s,validate:installBrowserWorldSnapshot(g,e.config)});const raw=s.getItem(e.config.key);own=false;g.money=0;assert.equal(g.save(),false);assert.equal(s.getItem(e.config.key),raw);});

test('ESTUARY new browser identity restores through actual delivery runtime and saves a full wallet snapshot',async()=>{
 const {installDeliveryRuntime}=await import('../source/runtime-candidate/sunset-coast/play/delivery-runtime.js');
 const {g,s,e}=await fixture(true,'estuary');globalThis.location={search:'?runtime=browser&world=estuary&browserSlot=b-real-load'};globalThis.window={addEventListener:noop};
 Object.assign(g,{setDestination:noop,acceptJob:()=>false,addMoney(n){this.money+=n},physicsTick:noop,animateEntry:noop});g.ui.updateMoney=noop;
 const validate=installBrowserWorldSnapshot(g,e.config);g.validateSave=validate;
 const facade=installDeliveryRuntime(g,{config:e.config,lease:{ownsLock:()=>true},storage:s,document:{hidden:false},mountUI:noop});assert.ok(facade);assert.equal(g.money,45678);assert.equal(g.ammo,17);assert.equal(g.playerPos.y,19.04);g.addMoney(123,'award');assert.equal(g.save(false),true);
 const restored=await readWorldSlot(s,'estuary',e.id,validateSave);assert.equal(restored.save.transactions.length,25);assert.equal(restored.save.player.y,19.04);assert.equal(restored.save.money,45801);assert.equal(restored.save.ammo,17);assert.equal(restored.save.browserWorld.backend,'browser');assert.equal(g.importSave(),false);delete globalThis.location;
});
test('ESTUARY collider-array and CRESCENT blocked APIs both validate restore without assuming same interface',async()=>{const {browserRestoreBlocked}=await import('../source/runtime-candidate/sunset-coast/play/browser-world-runtime.js');const world={colliders:[{x:0,z:0,w:2,d:3,baseY:0,height:4}]};assert.equal(browserRestoreBlocked(world,{x:0,y:0,z:0}),true);assert.equal(browserRestoreBlocked(world,{x:5,y:0,z:0}),false);assert.equal(browserRestoreBlocked(world,{x:0,y:5,z:0}),false);assert.equal(browserRestoreBlocked({blocked:()=>true},{x:0,y:0,z:0}),true);assert.throws(()=>browserRestoreBlocked({},{x:0,y:0,z:0}));});

test('actual Game.snapshot CRESCENT region survives complete-store save and reload',async()=>{
 const {g,s,e}=await fixture(false);const regionSource=readFileSync(new URL('../source/runtime-candidate/sunset-coast/play/regions.js',import.meta.url),'utf8');
 const regionAt=new Function('CRESCENT_MAP','return '+regionSource.match(/export (function regionAt\(pos\)\{[^\n]+\})/)[1])(true);
 const d={regionAt,serializeRoadsterAirLedger:()=>({}),roadsterTrim:()=>false,serializeVehicleDamage:()=>null,serializeAxleFault:()=>undefined,serializeBrakeFault:()=>undefined};
 g.snapshot=new Function(...Object.keys(d),'return ({'+source.slice(source.indexOf(' snapshot('),source.indexOf('\n validateSave('))+'}).snapshot;')(...Object.values(d));
 g.rememberBrakeFault=noop;g.vehicleStates={};g.vehicleFaults={};g.assistSettings={};
 installCrescentFullRuntime(g,{config:e.config,lease:{ownsLock:()=>true},storage:s,validate:installBrowserWorldSnapshot(g,e.config)});
 assert.equal(g.snapshot().region,'sunrise-crescent-v1');assert.equal(g.save(false),true);
 const r=await readWorldSlot(s,'crescent',e.id,validateSave);assert.equal(r.save.region,'sunrise-crescent-v1');assert.equal(r.save.money,45678);assert.equal(r.save.ammo,17);
 for(const browserWorld of [undefined,{version:2,map:'estuary',backend:'browser'},{version:2,map:'crescent',backend:'native'}])assert.throws(()=>validateSave({...r.save,browserWorld}),/地区存档/);
});

test('ESTUARY browser old-career click is rejected before mutation and does not freeze or corrupt the slot',async()=>{
 const {installDeliveryRuntime}=await import('../source/runtime-candidate/sunset-coast/play/delivery-runtime.js');
 const {g,s,e}=await fixture(true,'estuary');const previous={location:globalThis.location,window:globalThis.window};let called=0;
 globalThis.location={search:'?runtime=browser&world=estuary&browserSlot=b-real-load'};globalThis.window={addEventListener:noop};
 try{Object.assign(g,{setDestination:noop,acceptJob:()=>{called++;g.job={type:'taxi',stage:0};},addMoney(n){this.money+=n},physicsTick:noop,animateEntry:noop});g.ui.updateMoney=noop;
  const validate=installBrowserWorldSnapshot(g,e.config);g.validateSave=validate;installDeliveryRuntime(g,{config:e.config,lease:{ownsLock:()=>true},storage:s,document:{hidden:false},mountUI:noop});
  const raw=s.getItem(e.config.key),wallet=g.money;assert.equal(g.acceptJob('taxi'),false);assert.equal(called,0);assert.equal(g.money,wallet);assert.equal(s.getItem(e.config.key),raw);assert.notEqual(g.paused,true);assert.equal(g.save(false),true);await readWorldSlot(s,'estuary',e.id,validateSave);
 }finally{if(previous.location===undefined)delete globalThis.location;else globalThis.location=previous.location;if(previous.window===undefined)delete globalThis.window;else globalThis.window=previous.window;}
});
