import test from 'node:test';
import assert from 'node:assert/strict';
import {mixedFixture,attachSession,method,readCitySlot,validateSave,registry,world,THREE,hold} from './services-fixture.mjs';
import {installCargoCareer,cargoPayout} from '../../../sunset-coast/rapier/play/cargo-career.js';
import {updatePolice,updateWantedHeat,raiseWanted} from '../../../sunset-coast/rapier/play/police-response.js';
import {cityFixture} from './physics-fixture.mjs';
const noop=()=>{};
const report=(label,value)=>console.log('SERVICE_MEASURE '+label+' '+JSON.stringify(value));

// Actual current Game methods, original city geometry and Rapier WASM. UI and
// canvas drawing are stubbed. Stage endpoint placement is a fixture operation,
// not a driven route or browser/UI claim. Persistence uses the real citySession
// against an in-memory Storage implementation, never a real player's browser.
async function careerFixture({cargo=false}={}){
 const f=await mixedFixture(),g=f.g;
 Object.assign(g,{acceptJob:method('acceptJob'),checkJob:method('checkJob'),cancelJob:method('cancelJob'),addMoney:method('addMoney'),setDestination(p){this.destination=structuredClone(p);},respawn:noop,repair:noop,teleportTo:noop});
 Object.assign(g.ui,{showMission:noop,updateMission:noop,renderPhone:noop});
 if(cargo){assert.equal(await registry.ensureVehicleAsset('semi'),true);const old=g.vehicle;g.vehicle=g.makeVehicle('semi',164,240);g.removeVehicle(old);g.owned=['s','semi'];installCargoCareer(g,world.PLACES);}
 const tick=g.physicsTick;g.physicsTick=dt=>{tick(dt);g.checkJob();};
 return f;
}
function endpoint(f,target){
 const g=f.g,v=g.vehicle;v.pos.set(target.x,g.world.groundHeight(target.x,target.z)+.06,target.z);v.speed=0;v.slipVelocityX=v.slipVelocityZ=0;v.physicsResetSerial=(v.physicsResetSerial??0)+1;g.world.update(v.pos,true);
}
async function reload(f,s,{cargo=false}={}){
 const entry=await readCitySlot(s.storage,s.entry.slot,validateSave),next=await careerFixture({cargo});
 const nextSession=await attachSession(next,{storage:s.storage,entry});assert.equal(next.g.load(false,entry.save,false),true,'actual current Game.load restores');
 assert.equal(next.g.vehicle.instanceId,entry.save.vehicle.instanceId);assert.equal(next.g.money,entry.save.money);assert.equal(nextSession.session.loadBlocked,false);return{next,nextSession,entry};
}
for(const [type,reward,stages] of [['taxi',1200,2],['courier',1800,2],['race',4000,4],['patrol',1600,3]])test(type+' stage completion pays once through a successful Rapier transaction and survives actual load',async t=>{
 const f=await careerFixture();t.after(f.close);const g=f.g,s=await attachSession(f,{slot:'s-job-'+type}),before=g.money,jobs=g.jobsCompleted;
 g.acceptJob(type);assert.equal(g.job.type,type);assert.equal(g.job.stages.length,stages);assert.equal(g.save(false),true);
 const progress=await reload(f,s);t.after(progress.next.close);assert.equal(progress.next.g.job.type,type);assert.equal(progress.next.g.job.stage,0);progress.nextSession.assertProtected();progress.next.close();
 for(let stage=0;stage<stages;stage++){assert.equal(g.job.stage,stage);endpoint(f,g.job.stages[stage]);f.step(type==='race'?1:80);}
 assert.equal(g.job,null);assert.equal(g.money,before+reward);assert.equal(g.jobsCompleted,jobs+1);assert.equal(g.transactions.length,26,'full 25-row history plus reward is retained');
 const durable=s.session.read();assert.equal(durable.money,g.money);assert.equal(durable.jobsCompleted,g.jobsCompleted);assert.equal(durable.job,null);assert.equal(durable.transactions[0].amount,reward);const paid=durable.money;
 f.step(6);assert.equal(g.money,paid);const restored=await reload(f,s);t.after(restored.next.close);assert.equal(restored.next.g.job,null);assert.equal(restored.next.g.money,paid);assert.equal(restored.next.g.transactions.length,26);s.assertProtected();restored.nextSession.assertProtected();
 report(type,{reward,stages,physicsTicks:f.physics.lastTick,writes:s.storage.writes.length,money:paid,transactionRows:g.transactions.length,sourceOriginalWrites:0,scope:'fixture endpoint transitions, actual methods/physics/save/load; no driven route'});
});

test('Semi freight loads payload, restores cargo state and settles the original damaged/overloaded payout once',async t=>{
 const f=await careerFixture({cargo:true});t.after(f.close);const g=f.g,s=await attachSession(f,{slot:'s-cargo-payout'}),before=g.money;
 g.acceptJob('freight-overload');assert.equal(g.job.stage,0);endpoint(f,g.job.stages[0]);f.step(180);assert.equal(g.job.stage,1);assert.equal(g.vehicle.cargoPayloadKg,26000);assert.equal(s.session.read().job.stage,1);
 g.vehicle.condition-=10;f.step();assert.equal(g.job.cargoIntegrity,85);assert.equal(g.save(false),true);
 const loaded=await reload(f,s,{cargo:true});t.after(loaded.next.close);assert.equal(loaded.next.g.job.cargoIntegrity,85);assert.equal(loaded.next.g.vehicle.cargoPayloadKg,26000);loaded.nextSession.assertProtected();loaded.next.close();
 endpoint(f,g.job.stages[1]);f.step(180);const reward=cargoPayout('freight-overload',85);assert.equal(reward,3390);assert.equal(g.money,before+reward);assert.equal(g.job,null);assert.equal(g.vehicle.cargoPayloadKg,undefined);assert.equal(s.session.read().money,g.money);assert.equal(g.transactions.length,26);f.step(5);assert.equal(g.money,before+reward);s.assertProtected();
 report('freight-overload',{reward,integrity:85,money:g.money,physicsTicks:f.physics.lastTick,transactions:g.transactions.length,scope:'fixture endpoints; actual payload and payout/save/load'});
});

test('career payout queued in a failing real physics step restores job and wallet with zero durable writes',async t=>{
 const f=await careerFixture();t.after(f.close);const g=f.g,s=await attachSession(f,{slot:'s-job-failure'});g.acceptJob('taxi');g.job.stage=1;g.job.hold=.795;endpoint(f,g.job.stages[1]);assert.equal(g.save(false),true);
 const raw=s.session.readRaw(),money=g.money,jobs=g.jobsCompleted,beforeWrites=s.storage.writes.length,job=structuredClone(g.job);
 const publish=f.physics.publish.bind(f.physics);f.physics.publish=(...args)=>{publish(...args);throw Error('injected after career payout before publish completion');};
 assert.throws(()=>f.step(),/injected after career payout/);assert.equal(f.physics.failed,true);assert.equal(g.money,money);assert.equal(g.jobsCompleted,jobs);assert.deepEqual(g.job,job);assert.equal(s.session.readRaw(),raw);assert.equal(s.storage.writes.length,beforeWrites);assert.equal(g.save(false),false);s.assertProtected();
 report('failed-career-step',{money,jobs,writesInFailedStep:s.storage.writes.length-beforeWrites,physicsFailed:f.physics.failed,originalWrites:0});
});

test('original police patrols and pursuit use actual Rapier movement, then clear wanted without deleting nearby actors',async t=>{
 const f=await cityFixture({police:true});t.after(f.close);const g=f.g;g.quality='low';g.respawn=()=>{g.arrested=true;};
 f.run(4,hold);assert.ok(g.police.length>=1);const first=g.police[0],initial=first.pos.clone();raiseWanted(g,1);assert.equal(g.wanted,1);
 f.run(12,hold);assert.ok(first.pos.distanceTo(initial)>10,'actual responding body moves');assert.ok(g.police.some(v=>v.policeMode==='pursuit'));for(const v of g.police){assert.ok(f.physics.vehicles.has(v));assert.ok([...v.pos.toArray(),v.speed,v.yaw].every(Number.isFinite));}
 for(let elapsed=0;elapsed<60&&!g.police.some(v=>Math.hypot(v.pos.x-g.position.x,v.pos.z-g.position.z)<85);elapsed+=5)f.run(5,hold);
 const retained=g.police.filter(v=>Math.hypot(v.pos.x-g.position.x,v.pos.z-g.position.z)<85),wantedCount=g.police.length;assert.ok(retained.length>0,'at least one actually approaching officer is close before clearing');g.heat=.001;updateWantedHeat(g,.01);assert.equal(g.wanted,0);f.run(2,hold);assert.ok(retained.every(v=>g.police.includes(v)));assert.ok(g.police.every(v=>v.policeMode!=='pursuit'));assert.equal(f.physics.failed,false);
 report('police-pursuit-clear',{distance:first.pos.distanceTo(initial),wantedCount,retained:retained.length,remaining:g.police.length,ticks:f.physics.lastTick,scope:'direct raiseWanted API, real patrol spawn and movement; no UI crime event'});
});

test('police/car impact uses actual Rapier contact and original damage while unrelated identities stay unchanged',async t=>{
 const f=await careerFixture();t.after(f.close);const g=f.g,s=await attachSession(f,{slot:'s-police-contact'});const officer=g.makeVehicle('s',9.5,163,0,true,null,{isGarageVehicle:false});officer.isPolice=true;officer.policeMode='pursuit';g.police.push(officer);raiseWanted(g,1);f.controls.set(officer.instanceId,hold);
 const untouched=g.makeVehicle('s',30,175,0,true,null,{isGarageVehicle:false});g.traffic.push(untouched);const state={id:untouched.instanceId,condition:untouched.condition,battery:untouched.battery};f.step(30);const start=g.vehicle.pos.clone();f.controls.set(g.vehicle.instanceId,{throttle:1,brake:0,steer:0});f.step(140);
 const hits=f.hits.filter(hit=>hit.other===officer.instanceId||hit.id===officer.instanceId);assert.ok(hits.length,'real contact with officer');assert.ok(g.vehicle.condition<100||officer.condition<100);assert.equal(untouched.instanceId,state.id);assert.equal(untouched.condition,state.condition);assert.equal(untouched.battery,state.battery);assert.ok(g.wanted>=1);assert.equal(g.save(false),true);s.assertProtected();
 report('police-impact',{distance:g.vehicle.pos.distanceTo(start),hits:hits.length,playerCondition:g.vehicle.condition,policeCondition:officer.condition,wanted:g.wanted,unrelated:state,scope:'fixture officer initial placement; real solver-driven impact'});
});
