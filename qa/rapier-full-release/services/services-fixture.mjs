import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as factory from './factory-fixture.mjs';
import {cityFixture,R} from './physics-fixture.mjs';
import {createCitySlot,createCitySession,readCitySlot,cityBackupKey,cityIndexKey} from '../../../sunset-coast/rapier/play/city-save-store.js';
import {STANDARD_DEFAULT_SAVE_KEY,STANDARD_ACTIVE_KEY} from '../../../sunset-coast/rapier/play/standard-save-keys.js';
import {validateSave} from '../../../sunset-coast/rapier/play/save-validation.js';
import {spawnCityVehicle} from '../../../sunset-coast/rapier/play/city-vehicle-purchase.js';
import {requests,respondWith} from './test-env.mjs';
export {R,requests,respondWith,readCitySlot,validateSave,STANDARD_DEFAULT_SAVE_KEY,STANDARD_ACTIVE_KEY,cityBackupKey,cityIndexKey};
export const {THREE,world,registry,identity,ledger,damage,ownership}=factory;
export const ids=['s','mica_scooter','ember_street','ridge_dual'],hold={throttle:0,steer:0,brake:1},drive={throttle:1,steer:0,brake:0};
const play=new URL('../../../sunset-coast/rapier/play/',import.meta.url),source=readFileSync(new URL('game.js',play),'utf8');
const modules=await Promise.all(['regions.js','vehicle-asset-flow.js','vehicle-dynamics.js','ground-contact.js','entry-animation.js','render-motion.js','vehicle-physics.js','vehicle-instruments.js','vehicle-lights.js','roadster-asset.js','lane-change.js','driving-assist.js','assist-settings.js','police-response.js','population-stream.js','impact-damage.js','world-fleet.js','motorcycle-rider.js'].map(name=>import(new URL(name,play))));
const noop=()=>{},element={style:{},classList:{remove:noop,add:noop,contains:()=>false}};
const commitCitySave=Function('return '+source.split('\n').find(line=>line.startsWith('function commitCitySave(')))();
const dependencies=Object.assign({},...Object.values(factory).filter(value=>value&&typeof value==='object'),...modules,{THREE,commitCitySave,clamp:THREE.MathUtils.clamp,dist:(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),$:()=>element,createVehicleEnvironment:()=>null});
const starts=[...source.matchAll(/^ (?:async )?([a-zA-Z]\w*)\(/gm)].filter(m=>!['if','for','while','switch','catch'].includes(m[1]));
export function method(name){const index=starts.findIndex(m=>m[1]===name);assert.ok(index>=0,name);return Function(...Object.keys(dependencies),'return ({'+source.slice(starts[index].index+1,starts[index+1].index).trim()+'}).'+name)(...Object.values(dependencies));}
function getter(name){const line=source.split('\n').find(line=>line.startsWith(' get '+name+'('));return Object.getOwnPropertyDescriptor(Function('return ({'+line+'})')(),name);}
export function memory(raw){const values=new Map([[STANDARD_DEFAULT_SAVE_KEY,raw],[STANDARD_ACTIVE_KEY,STANDARD_DEFAULT_SAVE_KEY],['sunset-coast-original-other-slot','untouched original other slot']]),writes=[];return{values,writes,get length(){return values.size;},key:index=>[...values.keys()][index]??null,getItem:key=>values.get(key)??null,setItem(key,value){values.set(key,String(value));writes.push({key,value:String(value)});},removeItem:key=>values.delete(key)};}
const locks={request:async(_key,options,fn)=>(fn??options)({})};
export async function attachSession(f,{storage=null,entry=null,slot='s-mixed-garage'}={}){
 const existingStorage=storage!==null;const raw=JSON.stringify(f.g.snapshot());storage??=memory(raw);entry??=await createCitySlot(storage,{sourceKey:STANDARD_DEFAULT_SAVE_KEY,validateSave,locks,idFactory:()=>slot});
 const protectedRecords=new Map([...storage.values].filter(([key])=>key!==entry.key)),session=f.g.citySession=createCitySession({storage,entry,validateSave,ownsLock:()=>true});session.restoreGameData(f.g);session.markReady(f.g);if(!existingStorage)storage.writes.length=0;
 return{storage,entry,session,protectedRecords,assertProtected(){for(const [key,value]of protectedRecords)assert.equal(storage.getItem(key),value,key);assert.ok(storage.writes.every(write=>write.key===entry.key));}};
}
export async function mixedFixture(){
 const f=await cityFixture(),g=f.g,old=g.vehicle;
 document.getElementById=()=>element;document.addEventListener??=noop;document.body??={};document.body.classList=element.classList;document.body.append=noop;
 const createElement=document.createElement.bind(document);document.createElement=tag=>tag==='div'?{className:'',remove:noop}:createElement(tag);
 Object.assign(g,factory.gameMethods(dependencies),{health:100,armor:70,money:50000,owned:['s'],jobsCompleted:4,clockMinutes:1122,transactions:Array.from({length:25},(_,i)=>({label:'prior '+i,amount:i,time:'18:42'})),vehicleStates:{},vehicleFaults:{},roadsterAirLedger:{},job:null,destination:null,character:'alex',weather:'clear',assistSettings:dependencies.DEFAULT_ASSIST_SETTINGS,god:false,ammo:60,playerPos:new THREE.Vector3(13,0,174),playerYaw:0,cameraMode:0,touch:{},keys:{},person:world.createPerson(),performanceProfile:{trafficBudget:16},validateSave,
  resetControls:noop,pilot:{reset:noop},sensor:{reset:noop},robotaxi:{active:false,passenger:false,reset:noop,saveContext:()=>null},clockString:()=> '18:42',clearDestination(){this.destination=null;},switchCharacter(id){this.character=id;return true;},setAssistSettings(value){this.assistSettings=value;},setQuality(value){this.quality=value;},setWeather(value){this.weather=value;},updateLighting:noop,animateWalkingPerson:noop});
 Object.assign(g.ui,{closePhone:noop,closeModal:noop,updateMoney:noop,updateAll:noop,updateWanted:noop,updatePilot:noop,refreshVehicleAssets:noop,setSaveStatus:noop});
 for(const name of ['allVehicles','snapshot','save','load','applyCollisionDamage','addWanted','toggleEntry','animateEntry','walkingHeight','cancelEntry','resetControls'])g[name]=method(name);
 for(const key of ['position','yaw'])Object.defineProperty(g,key,{...getter(key),configurable:true});
 g.scene.add(g.person.root);g.removeVehicle(old);g.vehicle=g.makeVehicle('s',9.5,174,0);g.spawnCar=id=>spawnCityVehicle(g,id);g.physics.reconcile();
 const controls=new Map(),hits=[],actualDamage=g.applyCollisionDamage;
 g.applyCollisionDamage=function(v,force,dynamic,contact,other){const before=v.condition,increment=actualDamage.call(this,v,force,dynamic,contact,other);hits.push({id:v.instanceId,other:other?.instanceId??null,dynamic,increment,before,after:v.condition,impactSpeed:force,point:contact.point.toArray(),normal:contact.normal.toArray(),source:contact.source});return increment;};
 g.physicsTick=dt=>{g.time+=dt;if(g.transition)g.animateEntry(dt);for(const v of g.allVehicles())g.physics.submitVehicle(v,controls.get(v.instanceId)??hold,dt,v===g.vehicle);};
 const step=(count=1)=>{for(let i=0;i<count;i++)if(!g.physics.step(1/60))throw g.physics.error??Error('Physics stopped');};
 let closed=false;const close=()=>{if(closed)return;closed=true;const vehicles=g.allVehicles();g.citySession?.stop(Error('CPU fixture closed'));g.physics.dispose();for(const v of vehicles)g.removeVehicle(v);g.world.dispose();};
 return{...f,g,controls,hits,step,close};
}
export function state(v){return{model:v.model.id,instanceId:v.instanceId,isGarageVehicle:v.isGarageVehicle,condition:v.condition,battery:v.battery,damageRegions:damage.serializeVehicleDamage(v)};}
export function seedState(v,{condition,battery,damageRegions}){v.condition=condition;v.battery=battery;damage.restoreVehicleDamage(v,damageRegions);}
export async function loadMotorcycles(){for(const id of ids.slice(1))assert.equal(await registry.ensureVehicleAsset(id),true);}
export function board(f,target){const g=f.g;
 if(g.inCar){g.toggleEntry();assert.equal(g.transition?.entering,false,'actual exit must start');const steps=Math.ceil(g.transition.duration*60)+2;assert.ok(steps<=600);for(let i=0;g.transition&&i<steps;i++)f.step();assert.equal(g.inCar,false);}
 g.playerPos.copy(target.pos).add(new THREE.Vector3(3,0,0));g.playerPos.y=g.walkingHeight(g.playerPos.x,g.playerPos.z);g.person.root.position.copy(g.playerPos);g.nearestCar=target;g.toggleEntry();assert.equal(g.transition?.entering,true,'actual entry must start');const steps=Math.ceil(g.transition.duration*60)+2;assert.ok(steps<=600);for(let i=0;g.transition&&i<steps;i++)f.step();assert.equal(g.inCar,true);assert.equal(g.vehicle,target);
}
export const report=(label,value)=>console.log('MIXED_GARAGE '+label+' '+JSON.stringify(value));
