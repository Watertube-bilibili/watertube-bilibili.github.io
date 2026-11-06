import {readFileSync} from 'node:fs';
import * as THREE from '../../../sunset-coast/rapier/play/vendor/three.module.js';
import {RapierPhysicsSystem,preloadRapier} from '../../../sunset-coast/rapier/play/rapier-physics.js';
import {RapierWorldGeometry,rapierTerrainMesh} from '../../../sunset-coast/rapier/play/rapier-world.js';
import {createWorld,createCar,createPerson,MODELS,ROAD} from '../../../sunset-coast/rapier/play/world.js';
import {vehicleAssetReady,ensureVehicleAsset} from '../../../sunset-coast/rapier/play/vehicle-asset-registry.js';
import {trafficControls} from '../../../sunset-coast/rapier/play/traffic-controller.js';
import {updatePolice} from '../../../sunset-coast/rapier/play/police-response.js';
import {createPhysicsTransactions} from '../../../sunset-coast/rapier/play/physics-transaction.js';
export {THREE,RapierPhysicsSystem,RapierWorldGeometry,rapierTerrainMesh,createWorld,MODELS};
export const R=await preloadRapier(readFileSync(new URL('../../../sunset-coast/rapier/play/vendor/rapier/rapier_wasm3d_bg.wasm',import.meta.url)));
const noop=()=>{},context=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),measureText:()=>({width:100})},{get:(target,key)=>key in target?target[key]:noop});
// Only canvas text/texture drawing is stubbed. Scene geometry, production car
// factories, traffic controls and Rapier collision/stepping remain real.
globalThis.document={createElement:()=>({getContext:()=>context,toDataURL:()=>'',data:new Uint8Array(4),width:1,height:1}),addEventListener:noop,body:{classList:{contains:()=>false}}};
const source=readFileSync(new URL('../../../sunset-coast/play/game.js',import.meta.url),'utf8');
const productionMethod=name=>source.split('\n').find(line=>line.startsWith(' '+name+'('));
const methods=new Function('MODELS','vehicleAssetReady','ROAD','createPerson',`return {${productionMethod('spawnPopulation')},${productionMethod('allVehicles')}}`)(MODELS,vehicleAssetReady,ROAD,createPerson);
let serial=0;
export async function loadOriginalModels(){
 const originalFetch=globalThis.fetch,originalSelf=globalThis.self,originalBitmap=globalThis.createImageBitmap,originalProgress=globalThis.ProgressEvent;
 globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});globalThis.ProgressEvent=class{constructor(type,event){this.type=type;Object.assign(this,event);}};
 globalThis.fetch=async(input,init)=>{const url=typeof input==='string'?input:input.url??input.href;if(String(url).startsWith('file:')){const bytes=readFileSync(new URL(url));return new Response(bytes,{headers:{'Content-Length':String(bytes.length)}});}return originalFetch(input,init);};
 try{for(const id of ['vision','g9','roadster','semi'])if(!await ensureVehicleAsset(id))throw Error('Original model failed to load: '+id);}
 finally{globalThis.fetch=originalFetch;globalThis.self=originalSelf;globalThis.createImageBitmap=originalBitmap;globalThis.ProgressEvent=originalProgress;}
}
export function vehicle({id='s',x=9.5,z=174,y=.02,yaw=0,speed=0,...extra}={}){
 const car=createCar(id,true),v={...car,pos:car.root.position,yaw,speed,steer:0,yawRate:0,travelDistance:0,bodyRoll:0,battery:100,condition:100,brake:false,simple:true,instanceId:'world:physics-test:'+(++serial),...extra};
 v.pos.set(x,y,z);v.root.rotation.y=yaw;return v;
}
export async function cityFixture({population=false,cars=null,position={x:9.5,z:174},police=false}={}){
 const scene=new THREE.Scene(),world=createWorld(scene);world.update(position,true);
 const damage=[],g={...methods,scene,world,time:0,paused:false,inCar:true,traffic:[],pedestrians:[],police:[],wanted:0,money:1000,quality:'high',ui:{toast:noop,updateWanted:noop},signalState:()=> 'green',
  makeVehicle(id,x,z,yaw=0){const v=vehicle({id,x,z,yaw,y:world.groundHeight(x,z)+.02});scene.add(v.root);return v;},
  removeVehicle(v){scene.remove(v.root);this.traffic=this.traffic.filter(c=>c!==v);this.police=this.police.filter(c=>c!==v);},
  get position(){return this.vehicle.pos;},integrate(v,input,dt){this.physics.submitVehicle(v,input,dt,v===this.vehicle);},
  applyCollisionDamage(v,impact,dynamic,hit,other){damage.push({v,yaw:v.yaw,impact,dynamic,hit,other});},
  physicsTick(dt){this.time+=dt;this.integrate(this.vehicle,typeof this.input==='function'?this.input(dt):this.input??{throttle:0,steer:0,brake:1},dt);for(const v of this.traffic)this.integrate(v,this.trafficInput??trafficControls(this,v,dt),dt);if(police)updatePolice(this,dt);},
 };
 g.vehicle=cars?.[0]??g.makeVehicle('s',position.x,position.z);if(population)g.spawnPopulation();if(cars){g.traffic=cars.slice(1);for(const v of cars)scene.add(v.root);}
 const tx=createPhysicsTransactions(g);g.beginPhysicsTransaction=tx.begin;g.commitPhysicsTransaction=tx.commit;g.rollbackPhysicsTransaction=tx.rollback;g.physicsTransactions=tx;
 g.physics=new RapierPhysicsSystem(g,{hidden:()=>false,loadRapier:async()=>R});await g.physics.start();
 const run=(seconds,input)=>{g.input=input;for(let i=0;i<Math.round(seconds*60);i++)if(!g.physics.step(1/60))throw g.physics.error??Error('Physics stopped');};
 return{g,physics:g.physics,world,scene,damage,run,close(){g.physics.dispose();world.dispose();}};
}
