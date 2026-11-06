import test from 'node:test';
import assert from 'node:assert/strict';
import {rocketFixture,R,THREE} from './fixtures/roadster-physics-fixture.mjs';
import {AirReserve,createRoadsterAirController,cloneRoadsterAirController,resetRoadsterAirController,stepRoadsterAir} from '../../sunset-coast/rapier/play/browser-roadster-air.js';
import {toggleRoadsterAir} from '../../sunset-coast/rapier/play/roadster-controls.js';
const DT=1/60,UP=new THREE.Vector3(0,1,0);
const near=(actual,expected,tolerance=1e-8)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} != ${expected}`);
const controller=(units=2400,modelId='roadster_rocket')=>createRoadsterAirController({modelId,instanceId:'world:autoair:'+modelId,airUnits:units});
const body=()=>({config:{mass:1940},position:new THREE.Vector3(0,11,0),orientation:new THREE.Quaternion(),velocity:new THREE.Vector3(0,-2,-12),angularVelocity:new THREE.Vector3(),inertia:new THREE.Vector3(4500,7000,2500)});
const tick=(s,b,c={},terrain={grounded:false,altitude:10})=>stepRoadsterAir(s,b,{condition:100,battery:100,...c},DT,terrain);
const snapshot=s=>structuredClone({...s,reserve:{units:s.reserve.units}});
function addRamp(f){
 // Collider setup only: a 12 m ramp rising approximately 3 m, on the original
 // NCI runway. The car itself is never repositioned or assigned a velocity.
 const rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),.245);
 f.physics.world.createCollider(R.ColliderDesc.cuboid(5,.12,6).setTranslation(6880,13.35,1586).setRotation(rotation));f.sync();
 f.g.keys.KeyW=true;f.g.baseInput={throttle:1};
}
function until(f,predicate,limit=900){for(let i=0;i<limit;i++){f.step();if(predicate(i))return i;}throw Error('Actual ramp condition not reached: '+JSON.stringify(f.v.roadsterState));}

test('original 0.12 s airborne gate resets on support or low altitude, and only Rocket automatically catches',()=>{
 const b=body();
 for(const interrupt of [{grounded:true,altitude:10},{grounded:false,altitude:.65}]){
  const s=controller();for(let i=0;i<7;i++)assert.equal(tick(s,b).telemetry.automaticAirborne,false);
  tick(s,b,{},interrupt);near(s.airborneTime,0);
  for(let i=0;i<7;i++)assert.equal(tick(s,b).telemetry.automaticAirborne,false);
  const result=tick(s,b);assert.equal(result.telemetry.automaticAirborne,true);assert.equal(s.mode,'landing');near(s.airborneTime,8/60);near(result.force.y,0);near(result.force.z,0);
 }
 for(const id of ['roadster','roadster_thrust']){const s=controller(2400,id);for(let i=0;i<60;i++)tick(s,b);assert.equal(s.mode,'road');assert.equal(s.automaticAirborne,false);near(s.reserve.units,2400);}
});

test('held driving axes and brake cannot request hover; release and fresh input control genuine air forces',()=>{
 const s=controller(),b=body(),held={roadsterForward:1,roadsterRoll:1,roadsterAirBrake:true};
 for(let i=0;i<8;i++)tick(s,b,held);
 assert.deepEqual(s.automaticInputLatch,held);assert.equal(s.mode,'landing');
 const heldResult=tick(s,b,held);near(heldResult.force.length(),0);near(heldResult.torque.length(),0);assert.equal(s.mode,'landing');
 tick(s,b);assert.deepEqual(s.automaticInputLatch,{});
 const fresh=tick(s,b,{roadsterForward:1});assert.equal(s.mode,'air');assert.equal(s.automaticAirborne,true);assert.ok(fresh.force.y>0);assert.ok(fresh.force.z<0);
 tick(s,b);assert.equal(s.mode,'landing');assert.equal(s.automaticAirborne,true);
 const explicit=tick(s,b,{roadsterAir:true,roadsterForward:1});assert.equal(s.mode,'air');assert.equal(s.automaticAirborne,false);assert.deepEqual(s.automaticInputLatch,{});assert.ok(explicit.force.y>0);assert.ok(explicit.force.z<0);
});

test('automatic cushioning spends at most the original 20 m/s delivered allowance and the single air inventory',()=>{
 const original=AirReserve.prototype.consume;let consumes=0;
 AirReserve.prototype.consume=function(...args){consumes++;return Reflect.apply(original,this,args);};
 try{
  const s=controller(),b=body();b.velocity.set(0,-5,0);let delivered=0,used=0,steps=0;
  for(let i=0;i<140;i++){
   const before=s.reserve.units,allowance=s.automaticCushionImpulse,result=tick(s,b,{}, {grounded:false,altitude:1});steps++;
   const impulse=result.force.y/b.config.mass*DT;delivered+=impulse;used+=before-s.reserve.units;
   near(before-s.reserve.units,result.demand*DT*result.scale);near(s.automaticCushionImpulse,allowance-impulse,1e-7);
   assert.ok(s.automaticCushionImpulse>=0);assert.ok(result.force.y/b.config.mass<=26+1e-8);assert.equal(result.telemetry.airRefillEligible,false);
  }
  assert.equal(consumes,steps);near(delivered,20,1e-7);near(used,20,1e-7);near(s.automaticCushionImpulse,0);near(tick(s,b,{}, {grounded:false,altitude:1}).force.y,0);
  console.log('AUTOAIR delivered-budget '+JSON.stringify({steps,delivered,used,remaining:s.reserve.units}));
 }finally{AirReserve.prototype.consume=original;}
});

test('low gas consumes only delivered cushion, exhausted or dead vehicles receive no free lift',()=>{
 const b=body();b.velocity.set(0,-5,0);const s=controller(.25);let delivered=0;
 for(let i=0;i<100;i++){const result=tick(s,b,{}, {grounded:false,altitude:1});delivered+=result.force.y/b.config.mass*DT;}
 assert.ok(delivered>0&&delivered<.25);near(s.automaticCushionImpulse,20-delivered,1e-7);near(s.reserve.units,.25-delivered,1e-7);
 const empty=controller(0);for(let i=0;i<60;i++){const result=tick(empty,b,{}, {grounded:false,altitude:1});near(result.force.length(),0);near(result.torque.length(),0);near(empty.reserve.units,0);near(empty.automaticCushionImpulse,20);}
 const dead=controller();for(let i=0;i<8;i++)tick(dead,b);assert.equal(dead.mode,'landing');const gas=dead.reserve.units;
 const result=tick(dead,b,{battery:0}, {grounded:false,altitude:1});assert.equal(dead.mode,'unpowered');near(result.force.length(),0);near(result.torque.length(),0);near(dead.reserve.units,gas);
});

test('autoair clone/reset and failed controller input preserve reserve and independently owned latches',()=>{
 const s=controller(17),b=body();for(let i=0;i<8;i++)tick(s,b,{roadsterForward:1});
 const copy=cloneRoadsterAirController(s);copy.automaticInputLatch.roadsterForward=-1;copy.maneuver.goal[0]=99;copy.reserve.units=0;
 assert.equal(s.automaticInputLatch.roadsterForward,1);assert.equal(s.maneuver.goal[0],0);near(s.reserve.units,17);
 const before=snapshot(s);assert.throws(()=>stepRoadsterAir(s,b,{},NaN,{grounded:false,altitude:1}),/Fixed substep/);assert.deepEqual(snapshot(s),before);
 assert.equal(resetRoadsterAirController(s,1),true);near(s.reserve.units,17);assert.equal(s.automaticAirborne,false);assert.deepEqual(s.automaticInputLatch,{});near(s.airborneTime,0);assert.equal(resetRoadsterAirController(s,1),false);
});

test('real NCI ramp drive jumps, retains held W latch, uses bounded cushioning, lands then brakes',async t=>{
 const f=await rocketFixture({units:2400});t.after(f.close);addRamp(f);
 const v=f.v,entry=f.physics.vehicles.get(v),rb=entry.rb,id=v.instanceId,beforeGas=v.roadsterAirUnits,trace=[];
 let firstAir=null,landing=null,maxY=v.pos.y,maxAllowanceUsed=0,maxCushion=0,last=f.v.pos.clone(),maxStep=0;
 for(let i=0;i<900;i++){
  f.step();const s=v.roadsterState;maxY=Math.max(maxY,v.pos.y);maxStep=Math.max(maxStep,v.pos.distanceTo(last));last.copy(v.pos);maxAllowanceUsed=Math.max(maxAllowanceUsed,20-entry.air.automaticCushionImpulse);maxCushion=Math.max(maxCushion,s.landingCushion);
  if(i%30===0)trace.push({tick:i,position:v.pos.toArray(),speed:v.speed,grounded:v.grounded,mode:s.mode,automatic:s.automaticAirborne,cushion:s.landingCushion,remainingAllowance:entry.air.automaticCushionImpulse,gas:v.roadsterAirUnits});
  if(s.automaticAirborne){firstAir??={tick:i,position:v.pos.toArray()};assert.equal(s.mode,'landing');assert.equal(entry.air.automaticInputLatch.roadsterForward,1);assert.equal(v.roadsterRequest.air,false);assert.equal(s.airRefillEligible,false);}
  if(firstAir&&s.mode==='road'&&v.grounded){landing={tick:i,position:v.pos.toArray()};break;}
 }
 assert.ok(firstAir&&landing,'the real jump must return to grounded road mode');assert.ok(maxY>15);assert.ok(maxStep<.6);assert.ok(maxCushion>0);assert.ok(maxAllowanceUsed>1&&maxAllowanceUsed<=20);assert.ok(v.roadsterAirUnits<beforeGas);assert.equal(v.instanceId,id);assert.equal(f.physics.vehicles.get(v).rb,rb);assert.equal(f.physics.failed,false);assert.equal(v.roadsterState.automaticAirborne,false);assert.deepEqual(entry.air.automaticInputLatch,{});
 f.g.keys={};f.g.baseInput={brake:1};f.step(4);assert.ok(Math.abs(v.speed)<.5);assert.ok(UP.clone().applyQuaternion(v.physicsQuaternion).y>.98);
 console.log('AUTOAIR real-ramp '+JSON.stringify({firstAir,landing,maxY,maxStep,maxCushion,maxAllowanceUsed,beforeGas,afterGas:v.roadsterAirUnits,contacts:f.damage.map(d=>({impact:d.impact,dynamic:d.dynamic})),finalSpeed:v.speed,trace}));
});

test('fresh key release/repress takes over during a genuine jump, then release resumes automatic descent',async t=>{
 const f=await rocketFixture({units:2400});t.after(f.close);addRamp(f);
 until(f,()=>f.v.roadsterState.automaticAirborne);const entry=f.physics.vehicles.get(f.v),bodyIdentity=entry.rb,gas=f.v.roadsterAirUnits;
 f.g.keys.KeyW=false;f.g.baseInput={};f.step();assert.equal(entry.air.automaticInputLatch.roadsterForward,undefined);assert.equal(f.v.roadsterState.mode,'landing');
 f.g.keys.KeyW=true;f.g.baseInput={throttle:1};f.step();assert.equal(f.v.roadsterState.mode,'air');assert.equal(f.v.roadsterState.automaticAirborne,true);assert.ok(f.v.roadsterState.lift>0);assert.equal(f.v.roadsterRequest.air,false);
 f.g.keys.KeyW=false;f.g.baseInput={};f.step();assert.equal(f.v.roadsterState.mode,'landing');assert.equal(f.v.roadsterState.automaticAirborne,true);assert.ok(f.v.roadsterAirUnits<gas);assert.equal(f.physics.vehicles.get(f.v).rb,bodyIdentity);
 until(f,()=>f.v.grounded&&f.v.roadsterState.mode==='road');assert.equal(f.physics.failed,false);
});

test('real failed physics publication restores automatic allowance, latch, reserve and body before blocking saves',async t=>{
 const f=await rocketFixture({units:2400});t.after(f.close);addRamp(f);
 until(f,()=>f.v.roadsterState.automaticAirborne&&f.v.roadsterState.landingCushion>0);
 const entry=f.physics.vehicles.get(f.v),rb=entry.rb,before={air:snapshot(entry.air),state:structuredClone(f.v.roadsterState),request:structuredClone(f.v.roadsterRequest),pose:{...rb.translation()},rotation:{...rb.rotation()},linear:{...rb.linvel()},angular:{...rb.angvel()},gas:f.v.roadsterAirUnits,tick:f.physics.lastTick};let writes=0;
 const publish=f.physics.publish.bind(f.physics);f.physics.publish=(...args)=>{publish(...args);f.g.physicsTransactions.requestSave(()=>{writes++;return true;});throw Error('injected autoair publication failure');};
 assert.equal(f.physics.step(DT),false);assert.equal(f.physics.failed,true);assert.equal(f.g.physicsTransactions.canWrite(),false);assert.equal(writes,0);assert.equal(f.physics.lastTick,before.tick);assert.equal(f.physics.vehicles.get(f.v).rb,rb);assert.deepEqual(snapshot(entry.air),before.air);assert.deepEqual(f.v.roadsterState,before.state);assert.deepEqual(f.v.roadsterRequest,before.request);assert.deepEqual({...rb.translation()},before.pose);assert.deepEqual({...rb.rotation()},before.rotation);assert.deepEqual({...rb.linvel()},before.linear);assert.deepEqual({...rb.angvel()},before.angular);near(f.v.roadsterAirUnits,before.gas);
});


for(const prior of ['complete','cancelled'])test(`prior ${prior} maneuver cannot turn a fresh jump key into latched explicit flight`,async t=>{
 const f=await rocketFixture({units:2400});t.after(f.close);const v=f.v,entry=f.physics.vehicles.get(v),rb=entry.rb,id=v.instanceId;
 assert.equal(f.action('spin').ok,true);
 if(prior==='complete')f.until(()=>v.roadsterState.maneuver.status==='complete');
 else f.until(()=>v.roadsterState.maneuver.phase==='spin'&&v.roadsterState.maneuver.angle>1.5);
 // The real public T action lands a completed spin, or cancels an active one
 // with descent. No fake terminal telemetry, position or velocity is supplied.
 assert.equal(toggleRoadsterAir(f.g).ok,true);f.until(()=>v.grounded&&v.roadsterState.mode==='road');f.step(.5);
 assert.equal(v.roadsterState.maneuver.status,prior);assert.equal(v.roadsterRequest.air,false);const serial=v.roadsterState.maneuver.serial;
 addRamp(f);until(f,()=>v.roadsterState.automaticAirborne);
 const observations=[];const observe=label=>observations.push({label,mode:v.roadsterState.mode,automatic:v.roadsterState.automaticAirborne,requestAir:v.roadsterRequest.air,status:v.roadsterState.maneuver.status,serial:v.roadsterState.maneuver.serial,position:v.pos.toArray(),gas:v.roadsterAirUnits});
 observe('jump');assert.equal(v.roadsterState.mode,'landing');assert.equal(v.roadsterRequest.air,false);
 f.g.keys.KeyW=false;f.g.baseInput={};f.step();observe('released');assert.equal(entry.air.automaticInputLatch.roadsterForward,undefined);
 f.g.keys.KeyW=true;f.g.baseInput={throttle:1};f.step();observe('fresh');
 // Log before asserting so the old implementation's exact bad latch survives.
 console.log('AUTOAIR prior-terminal-fresh '+JSON.stringify({prior,observations}));
 assert.equal(v.roadsterState.mode,'air');assert.equal(v.roadsterState.automaticAirborne,true);assert.equal(v.roadsterRequest.air,false,'automatic temporary manual control is not an explicit flight request');
 f.g.keys.KeyW=false;f.g.baseInput={};f.step();observe('release-after-fresh');assert.equal(v.roadsterState.mode,'landing');assert.equal(v.roadsterState.automaticAirborne,true);assert.equal(v.roadsterRequest.air,false);
 // Explicit T while fresh input owns air mode must still take over deliberately.
 f.g.keys.KeyW=true;f.g.baseInput={throttle:1};f.step();assert.equal(v.roadsterState.mode,'air');assert.equal(toggleRoadsterAir(f.g).ok,true);assert.equal(v.roadsterRequest.air,true);
 f.g.keys.KeyW=false;f.g.baseInput={};f.step();observe('explicit-flight');assert.equal(v.roadsterState.mode,'air');assert.equal(v.roadsterState.automaticAirborne,false);assert.equal(v.roadsterRequest.air,true);f.step(.2);assert.equal(v.roadsterState.mode,'air');
 assert.equal(toggleRoadsterAir(f.g).ok,true);until(f,()=>v.grounded&&v.roadsterState.mode==='road');observe('landed');
 assert.equal(v.roadsterState.maneuver.status,prior);assert.equal(v.roadsterState.maneuver.serial,serial);assert.equal(v.instanceId,id);assert.equal(f.physics.vehicles.get(v).rb,rb);assert.equal(f.physics.failed,false);assert.equal(v.roadsterRequest.air,false);
 console.log('AUTOAIR prior-terminal-final '+JSON.stringify({prior,observations,contacts:f.damage.map(d=>({impact:d.impact,dynamic:d.dynamic}))}));
});
