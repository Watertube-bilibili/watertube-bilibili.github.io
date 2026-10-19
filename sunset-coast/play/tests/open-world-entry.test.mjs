import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import {createWorld,createPerson,createCat,createCar,CHARACTERS} from '../world.js';
import {createGroundContact,safeVehicleExit,getActorGroundHeight,getActorFootOffset} from '../ground-contact.js';
import {pedestrianVehicleContact} from '../vehicle-dynamics.js';
import {WORLD_MIN_X,WORLD_LIMIT} from '../regions.js';
import {freshSave,createBetaSlot,betaStorageKeys,validateBetaSlot} from '../beta-save-slots.js';
import {validateSave} from '../save-validation.js';
import {LEGACY_STANDARD_SAVE_KEY} from '../standard-save-keys.js';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const getMethod=(start,end,dependencies={})=>new Function(...Object.keys(dependencies),`return ({${source.slice(source.indexOf(start),source.indexOf(end))}});`)(...Object.values(dependencies));
const noop=()=>{};
const methods={
 ...getMethod(' placePlayerOnFoot(', '\n walkingHeight(', {safeVehicleExit}),
 ...getMethod(' walkingHeight(', '\n animateWalkingPerson(', {createGroundContact,getActorGroundHeight}),
 ...getMethod(' animateWalkingPerson(', '\n cancelEntry(', {getActorGroundHeight}),
 ...getMethod(' recenterCamera(', '\n teleportTo('),
 ...getMethod(' cycleCamera(', '\n updateCamera('),
};
// The real world/character geometry and production ground-contact logic run
// without WebGL. Canvas drawing is stubbed only for scene label textures.
const context=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),measureText:()=>({width:100})},{get:(target,key)=>key in target?target[key]:noop});
globalThis.document={createElement:()=>({getContext:()=>context,toDataURL:()=>'',data:new Uint8Array(4),width:1,height:1})};
const scene=new THREE.Scene(),world=createWorld(scene),groundContact=createGroundContact(world,scene);
world.update({x:9.5,z:174},true);
function fixture(character='alex'){
 const vehicle=createCar('s');vehicle.pos=vehicle.root.position;vehicle.pos.set(9.5,0,174);vehicle.yaw=0;vehicle.speed=0;vehicle.battery=98;vehicle.condition=100;
 const person=character==='mochi'?createCat():createPerson();scene.add(vehicle.root,person.root);
 const g={...methods,scene,world,groundContact,vehicle,person,playerPos:new THREE.Vector3(13,0,174),playerYaw:0,character,time:0,inCar:true,cameraMode:2,cameraYaw:2,cameraPitch:.8,transition:{},jump:.5,traffic:[],police:[],keys:{},touch:{},ui:{toast:noop,updateAll:noop},sensor:{reset:noop},allVehicles(){return[this.vehicle];}};
 Object.defineProperty(g,'position',{get(){return this.inCar?this.vehicle.pos:this.playerPos;}});
 return g;
}

function assertGrounded(g){
 assert.equal(g.inCar,false);assert.equal(g.person.root.visible,true);
 assert.ok(g.playerPos.distanceTo(g.vehicle.pos)<5,'Parked car is immediately within E interaction range');
 assert.equal(pedestrianVehicleContact(g.playerPos,.3,g.vehicle),null,'Spawn must not penetrate vehicle');
 for(const b of world.colliders)assert.ok(!(Math.abs(g.playerPos.x-b.x)<b.w+.3&&Math.abs(g.playerPos.z-b.z)<b.d+.3),'Spawn must not penetrate buildings');
 const expected=getActorGroundHeight(g.person,groundContact,g.playerPos,{posed:true,yaw:g.playerYaw});
 assert.ok(Math.abs(g.person.root.position.y-expected)<1e-7,'Shoe/paw geometry rests on actual scene floor');
 assert.ok(g.person.root.position.y+getActorFootOffset(g.person,{posed:true})>=groundContact.heightAt(g.playerPos.x,g.playerPos.z)-.001,'No feet below floor');
 assert.equal(g.nearestCar,g.vehicle);assert.equal(g.cameraMode,0);assert.equal(g.cameraYaw,g.playerYaw);assert.equal(g.jump,0);
}

test('no-save constructor starts as a visible person and grounds before the first render',()=>{
 const constructor=source.slice(source.indexOf(' constructor('),source.indexOf('\n async startPhysics'));
 assert.match(constructor,/this\.inCar=false/);assert.doesNotMatch(constructor,/this\.inCar=true/);
 assert.match(constructor,/this\.person\.root\.visible=true/);
 assert.match(constructor,/this\.spawnPopulation\(\);this\.placePlayerOnFoot\(\)/);
 assert.ok(constructor.indexOf('this.placePlayerOnFoot()')<constructor.indexOf('this.restoreQuietly()'),'Saved state restores after new game initialization');
 assert.match(constructor,/this\.restoreQuietly\(\);this\.world\.update\(this\.position,true\);if\(!this\.inCar\)this\.animateWalkingPerson\(0\)/);
 for(const character of ['alex','mochi']){const g=fixture(character);g.placePlayerOnFoot();assertGrounded(g);}
});

for(const heading of [0,.7,-1.2])test(`walking C and R recenter behind player at heading ${heading}`,()=>{
 const g=fixture();g.inCar=false;g.playerYaw=heading;g.releaseCameraDrag=()=>g.released=true;
 g.cycleCamera();assert.equal(g.cameraMode,0);assert.equal(g.cameraYaw,heading);assert.equal(g.released,true);assert.equal(g.cameraRecentering,false);
 g.cameraMode=2;g.cameraYaw=-2;g.recenterCamera();assert.equal(g.cameraMode,0);assert.equal(g.cameraYaw,heading);
});
test('driving C still cycles all three existing views',()=>{
 const g=fixture();g.cameraMode=0;g.cycleCamera();assert.equal(g.cameraMode,1);g.cycleCamera();assert.equal(g.cameraMode,2);g.cycleCamera();assert.equal(g.cameraMode,0);
});

const load=getMethod(' load(', '\n restoreQuietly(',{vehicleAssetReady:()=>true,cancelPendingVehicleAsset:noop,resetPolice:noop,resetDrivingAssist:noop,streamPopulation:noop,clamp:THREE.MathUtils.clamp,WORLD_LIMIT,WORLD_MIN_X,CHARACTERS}).load;
for(const inCar of [true,false])test(`existing save inCar=${inCar} retains stored mode and exact horizontal position`,()=>{
 const g=fixture();g.placePlayerOnFoot();g.cameraMode=2;
 Object.assign(g,{validateSave:s=>s,cancelEntry:noop,clearDestination:noop,removeVehicle:noop,isGarageCar:()=>false,makeVehicle(id,x,z,yaw){const v=this.vehicle;v.pos.set(x,0,z);v.yaw=yaw;return v;},switchCharacter:noop,setQuality:noop,setWeather:noop,updateLighting:noop});
 const save={vehicle:{model:'s',x:4.5,z:174,yaw:.2,battery:91,condition:89},vehicleStates:{},money:12500,health:100,armor:70,wanted:0,owned:['s'],inCar,player:{x:17,z:210,yaw:.6},character:'alex',settings:{},ammo:60};
 assert.equal(load.call(g,false,save,false),true);
 assert.equal(g.inCar,inCar);assert.equal(g.person.root.visible,!inCar);assert.equal(g.playerPos.x,17);assert.equal(g.playerPos.z,210);assert.equal(g.playerYaw,.6);assert.equal(g.vehicle.pos.x,4.5);
 if(!inCar){assert.ok(Math.abs(g.person.root.position.y-getActorGroundHeight(g.person,groundContact,g.playerPos,{posed:true,yaw:g.playerYaw}))<1e-7);g.cycleCamera();assert.equal(g.cameraMode,0);assert.equal(g.cameraYaw,.6);}
});

const respawn=getMethod(' respawn(', '\n shoot(',{cancelPendingVehicleAsset:noop,resetVehicleDynamics:noop,resetVehiclePose:noop,repairVehicleDamage:noop,resetPolice:noop,streamPopulation:noop,resetDrivingAssist:noop}).respawn;
for(const arrest of [false,true])for(const character of ['alex','mochi'])test(`${arrest?'arrest':'death'} recovery returns ${character} safely on foot`,()=>{
 const g=fixture(character);g.inCar=true;g.vehicle.pos.set(100,0,100);g.vehicle.yaw=1.2;g.health=0;g.wanted=3;g.autopilot=true;
 Object.assign(g,{cancelEntry:noop,addMoney(amount){this.fee=amount;}});
 respawn.call(g,arrest);assertGrounded(g);assert.equal(g.health,100);assert.equal(g.wanted,0);assert.equal(g.autopilot,false);assert.equal(g.fee,arrest?-500:-300);
});

test('desktop walking hints replace car controls while touch and aircraft modes remain available',()=>{
 const ui=readFileSync(new URL('../ui.js',import.meta.url),'utf8'),css=readFileSync(new URL('../beta-interface.css',import.meta.url),'utf8');
 assert.match(ui,/walking=!this\.g\.inCar&&!this\.g\.aircraft\?\.active/);
 for(const label of ['步行','奔跑','跳跃','右键拖动','射击'])assert.ok(ui.includes(label));
 assert.match(css,/\.disabled-driving:not\(\.aircraft-active\) \.drive-hud\{display:none\}/);
 assert.match(css,/body\[data-input-mode="keyboard"\] \.mobile-controls\{display:none!important\}/);
 assert.match(source,/\['Space','Enter'\]\.includes\(e\.code\)&&e\.target\.closest\?\.\('button,a,\[role=button\]'\)/);
});


test('fresh beta slots create a walking save; existing and imported/copied saves retain mode',async()=>{
 const values=new Map(),storage={get length(){return values.size;},key:i=>[...values.keys()][i]??null,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
 const locks={request:async(name,callback)=>callback()},date='2026-10-19T13:00:00.000Z';
 const raw=freshSave(date),save=JSON.parse(raw);assert.equal(validateSave(save),save);assert.equal(save.inCar,false);assert.equal(save.vehicle.x,9.5);assert.equal(save.player.x,13);
 const entry=await createBetaSlot(storage,{mode:'fresh',validateSave,locks,idFactory:()=> 's-new-open-world',now:()=>date});
 const current=await validateBetaSlot(storage,entry.slot,validateSave);assert.equal(current.save.inCar,false);assert.equal(current.save.player.x,13);
 // Simulate old progress in this slot. Reading/validating it must not migrate it.
 const legacy={...current.save,inCar:true,vehicle:{...current.save.vehicle,x:4.5},player:{x:1.7,z:174,yaw:0}};
 const legacyRaw=JSON.stringify(legacy);storage.setItem(betaStorageKeys(entry.slot).SAVE_KEY,legacyRaw);
 assert.equal((await validateBetaSlot(storage,entry.slot,validateSave)).save.inCar,true);assert.equal(storage.getItem(betaStorageKeys(entry.slot).SAVE_KEY),legacyRaw);
 storage.setItem(LEGACY_STANDARD_SAVE_KEY,legacyRaw);
 const copy=await createBetaSlot(storage,{mode:'copy',sourceKey:LEGACY_STANDARD_SAVE_KEY,validateSave,locks,idFactory:()=> 's-copy-open-world',now:()=>date});
 assert.equal(copy.save.inCar,true);assert.equal(copy.raw,legacyRaw);assert.equal(storage.getItem(LEGACY_STANDARD_SAVE_KEY),legacyRaw);
 const g=fixture();g.playerPos.set(save.player.x,0,save.player.z);g.inCar=false;g.nearestCar=g.vehicle;g.cameraMode=0;g.cameraYaw=0;g.jump=0;g.animateWalkingPerson(0);assertGrounded(g);
});

test('desktop vehicle screen defaults off on foot, restores driving preference, allows manual walking access',()=>{
 const cockpit=readFileSync(new URL('../cockpit.js',import.meta.url),'utf8');
 assert.match(cockpit,/this\.setOpen\(game\.inCar && open, false\)/);
 const sync=new Function(`return ({${cockpit.slice(cockpit.indexOf('  syncContext()'),cockpit.indexOf('  get isOpen'))}}).syncContext;`)();
 const g={inCar:false},p={g,wasDriving:false,drivingOpenPreference:true,open:false,setOpen(value,save){assert.equal(save,false);this.open=!!value;}};
 sync.call(p);assert.equal(p.open,false);g.inCar=true;sync.call(p);assert.equal(p.open,true);g.inCar=false;sync.call(p);assert.equal(p.open,false);
 p.open=true;sync.call(p);assert.equal(p.open,true,'Manual access on foot is not forced closed each update');
});
