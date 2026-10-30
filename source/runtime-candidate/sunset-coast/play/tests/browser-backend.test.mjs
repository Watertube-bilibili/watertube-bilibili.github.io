import test from 'node:test';import assert from 'node:assert/strict';
import {FixedStepClock} from '../fixed-step-clock.mjs';
import {BrowserPhysicsSystem} from '../browser-physics.js';
import {createDesignedCar} from '../vehicle-design.js';
import * as THREE from '../vendor/three.module.js';
function fixture(){const v={...createDesignedCar('s',true),pos:new THREE.Vector3(),yaw:0,speed:0,steer:0,travelDistance:0,battery:98,condition:100};v.root.position.copy(v.pos);const g={paused:false,time:0,vehicle:v,position:v.pos,world:{colliders:[],groundHeight:()=>0,update(){}},ui:{toast(){}},allVehicles:()=>[v],beginVehicleStep(){v.collisionPrevious={x:v.pos.x,z:v.pos.z,yaw:v.yaw};},physicsTick(dt){this.time+=dt;this.physics.submitVehicle(v,this.input,dt,true)},input:{throttle:1,brake:0,steer:0},applyCollisionDamage(v,force){v.condition-=force;},spawnCar(){return true}};g.physics=new BrowserPhysicsSystem(g,{hidden:()=>g.hidden});return g;}
test('60 Hz clock deterministic across render cadence',()=>{for(const fps of [30,60,120]){const c=new FixedStepClock();let time=0;c.advance(0,false,()=>{});for(let i=1;i<=fps*10;i++)c.advance(i*1000/fps,false,dt=>time+=dt);assert.equal(c.tick,600);assert.ok(Math.abs(time-10)<1e-8);}});
test('pause/hidden resets pending time, resume never catches up',()=>{const c=new FixedStepClock();c.advance(0,false,()=>{});c.advance(100,false,()=>{});assert.equal(c.tick,6);c.advance(10000,true,()=>assert.fail());c.advance(20000,false,()=>assert.fail());c.advance(20017,false,()=>{});assert.equal(c.tick,7);});
test('bounded long-frame step and dropped-time telemetry',()=>{const c=new FixedStepClock();c.advance(0,false,()=>{});c.advance(10000,false,()=>{});assert.equal(c.tick,6);assert.ok(c.droppedSeconds>9);});
test('real JS car throttle/brake and non-null authoritative ticks',async()=>{const g=fixture();await g.physics.start();g.physics.advance(0);for(let i=1;i<=120;i++)g.physics.advance(i*1000/60);assert.equal(g.physics.lastTick,120);assert.ok(g.vehicle.pos.z< -1);assert.ok(g.vehicle.speed>1);g.input={throttle:0,brake:1,steer:0};for(let i=121;i<=360;i++)g.physics.advance(i*1000/60);assert.ok(g.vehicle.speed<.1);assert.ok(Math.abs(g.time-6)<1e-8);});
test('backend pause and background visibility freeze car and game time',async()=>{const g=fixture();await g.physics.start();g.physics.advance(0);g.physics.advance(100);const before={z:g.vehicle.pos.z,time:g.time,tick:g.physics.lastTick};g.hidden=true;g.physics.advance(5000);assert.equal(g.time,before.time);g.hidden=false;g.physics.advance(6000);assert.equal(g.physics.lastTick,before.tick);g.paused=true;g.physics.advance(10000);assert.equal(g.vehicle.pos.z,before.z);});
test('unsupported motorcycle and native commands are explicit',async()=>{const g=fixture();await g.physics.start();assert.equal(g.physics.capabilities.motorcycle,false);assert.equal(g.spawnCar('mica_scooter'),false);assert.throws(()=>g.physics.queueCommand({type:'spawnAircraft'}),/Unsupported/);});
test('real planar swept collision stops car at static wall',async()=>{const g=fixture();g.world.colliders=[{x:0,z:-12,w:8,d:1}];await g.physics.start();g.physics.advance(0);for(let i=1;i<=600;i++)g.physics.advance(i*1000/60);assert.ok(g.physics.metrics.contacts>0);assert.ok(g.vehicle.pos.z>-12);assert.ok(g.vehicle.condition<100);});
test('isolated delivery store persists real fixture movement and retains foreign save',async()=>{
 const {createDeliveryStore,DELIVERY_SAVE_SCHEMA}=await import('../delivery-store.js');
 const {freshSave}=await import('../beta-save-slots.js');
 const {validateSave}=await import('../save-validation.js');
 const g=fixture();await g.physics.start();g.physics.advance(0);for(let i=1;i<=120;i++)g.physics.advance(i*1000/60);
 const data=new Map([['sunrise:formal:existing','DO NOT CHANGE']]);const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 const base=JSON.parse(freshSave('2026-10-30T00:00:00.000Z'));
 const capture=()=>({...base,vehicle:{...base.vehicle,x:g.vehicle.pos.x,z:g.vehicle.pos.z},futureFeature:{keep:true}});
 const opts={storage,key:'sunrise:browser-physics:20261030:delivery',capture,publish(){},validateHost:validateSave,ownsLock:()=>true,schema:DELIVERY_SAVE_SCHEMA};
 const a=createDeliveryStore(opts);a.initialize();assert.equal(a.save(),true);const b=createDeliveryStore(opts);const restored=b.initialize();assert.equal(restored.vehicle.z,g.vehicle.pos.z);assert.equal(restored.futureFeature.keep,true);assert.equal(data.get('sunrise:formal:existing'),'DO NOT CHANGE');assert.equal(data.size,2);
});
test('lifecycle suspension without hidden RAF discards all elapsed time',()=>{const c=new FixedStepClock();c.advance(0,false,()=>{});c.advance(100,false,()=>{});c.suspend();c.advance(10000,false,()=>assert.fail());assert.equal(c.tick,6);});
test('delivery-style pause inside physicsTick stops contacts and remaining substeps',async()=>{const g=fixture();await g.physics.start();g.physics.advance(0);let runs=0,contacts=0;g.physicsTick=()=>{runs++;g.paused=true;};g.physics.resolveContacts=()=>contacts++;g.physics.advance(100);assert.equal(runs,1);assert.equal(contacts,0);});
