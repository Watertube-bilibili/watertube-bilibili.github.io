import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import './test-env.mjs';
const play=new URL('../../../sunset-coast/rapier/play/',import.meta.url),at=name=>import(new URL(name,play));
const modules=await Promise.all(['vendor/three.module.js','world.js','vehicle-identity.js','roadster-air-ledger.js','roadster-controls.js','axle-fault.js','brake-fault.js','vehicle-instruments.js','brake-closeup.js','vehicle-damage.js','vehicle-lights.js','roadster-jets.js','vehicle-asset-registry.js','vehicle-factory-ownership.js'].map(at));
export const [THREE,world,identity,ledger,roadster,axle,brake,instruments,pedal,damage,lights,jets,registry,ownership]=modules;
export const {spawnCityVehicle}=await at('city-vehicle-purchase.js');
export const noop=()=>{};
export function gameMethods(overrides={}){
 const source=readFileSync(new URL('game.js',play),'utf8'),names=['newVehicleInstanceId','makeVehicle','promoteVehicle','isGarageCar','captureGarageVehicle','rememberBrakeFault','removeVehicle','thumbnail'];
 const starts=[...source.matchAll(/^ (?:async )?([a-zA-Z]\w*)\(/gm)].filter(m=>!['if','for','while','switch','catch'].includes(m[1]));
 const methods=names.map(name=>{const index=starts.findIndex(m=>m[1]===name);assert.ok(index>=0,name);return source.slice(starts[index].index+1,starts[index+1].index).trim();}).join(',');
 const dependencies=Object.assign({THREE,createVehicleEnvironment:()=>null},...modules.slice(1),overrides);
 return Function(...Object.keys(dependencies),'return ({'+methods+'});')(...Object.values(dependencies));
}
export function trackFactory(overrides={}){
 const made=[];
 const createCar=(...args)=>{const v=world.createCar(...args),materials=new Set(),geometries=new Set(),entry={v,materials,geometries,materialDisposals:0,geometryDisposals:0};if(v.kind==='motorcycle')v.chassis.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);for(const material of Array.isArray(o.material)?o.material:[o.material])materials.add(material);}});for(const m of materials)m.addEventListener('dispose',()=>entry.materialDisposals++);for(const g of geometries)g.addEventListener('dispose',()=>entry.geometryDisposals++);made.push(entry);return v;};
 return {made,methods:gameMethods({createCar,...overrides})};
}
export function harness(methods=gameMethods()){
 const events=[],storage=new Map([['original-save','immutable original'],['candidate-save','prior candidate']]),g={...methods,scene:new THREE.Scene(),world:{groundHeight:()=>7},vehicleStates:{},vehicleFaults:{},roadsterAirLedger:{},traffic:[],police:[],money:1_000_000,owned:['s'],transactions:[],physics:{ready:true},person:{root:new THREE.Group()},playerPos:new THREE.Vector3(13,7,174),playerYaw:.6,time:0,inCar:true,cameraMode:0,autopilot:false,transition:null,destination:null,ui:{toast:(...args)=>events.push(['toast',...args]),updateMoney:()=>events.push(['money']),updateAll:()=>events.push(['ui'])},pilot:{reset:noop},sensor:{reset:noop},clockString:()=> '18:42',cancelEntry(){this.transition=null;events.push(['entry']);},save(){events.push(['save']);storage.set('candidate-save',JSON.stringify({id:this.vehicle.instanceId,money:this.money}));return true;}};
 Object.defineProperties(g,{position:{get(){return this.inCar?this.vehicle.pos:this.playerPos;}},yaw:{get(){return this.inCar?this.vehicle.yaw:this.playerYaw;}}});g.vehicle=g.makeVehicle('s',17,175,.4);g.robotaxi={active:false,passenger:false,reset:()=>events.push(['taxiReset'])};g.spawnCar=id=>spawnCityVehicle(g,id);return {g,events,storage};
}
export function checkpoint(g,storage){return{vehicle:g.vehicle,root:g.vehicle.root,children:[...g.scene.children],money:g.money,owned:g.owned,transactions:g.transactions,states:g.vehicleStates,faults:g.vehicleFaults,ledger:g.roadsterAirLedger,books:JSON.stringify([g.vehicleStates,g.vehicleFaults,g.roadsterAirLedger]),traffic:g.traffic,members:[...g.traffic],storage:[...storage]};}
export function assertUnchanged(g,storage,b){assert.equal(g.vehicle,b.vehicle);assert.equal(g.vehicle.root,b.root);assert.deepEqual(g.scene.children,b.children);assert.equal(g.money,b.money);assert.equal(g.owned,b.owned);assert.equal(g.transactions,b.transactions);assert.equal(g.vehicleStates,b.states);assert.equal(g.vehicleFaults,b.faults);assert.equal(g.roadsterAirLedger,b.ledger);assert.equal(JSON.stringify([g.vehicleStates,g.vehicleFaults,g.roadsterAirLedger]),b.books);assert.equal(g.traffic,b.traffic);assert.deepEqual(g.traffic,b.members);assert.deepEqual([...storage],b.storage);}
