import test from 'node:test';
import assert from 'node:assert/strict';
import {mixedFixture,attachSession,method,readCitySlot,validateSave,hold} from './services-fixture.mjs';
import {RoboTaxiService} from '../../../sunset-coast/rapier/play/robotaxi.js';
import {AutonomyTestJobService} from '../../../sunset-coast/rapier/play/autonomy-test-job.js';
const noop=()=>{};
const report=(name,value)=>console.log('RIDE_MEASURE '+name+' '+JSON.stringify(value));
async function fixture(){const f=await mixedFixture();Object.assign(f.g,{route:[],blockedRoads:[],routeIndex:0,addMoney:method('addMoney'),setDestination(p){this.destination=p;},replan:noop,updateRoutePresentation:noop});Object.assign(f.g.ui,{updateMission:noop,renderPhone:noop,isPhoneOpen:()=>false});return f;}
function until(f,predicate,budget){let ticks=0;while(!predicate()&&ticks<budget){f.step();ticks++;}return ticks;}

test('RoboTaxi physical pickup, boarding and cancellation preserve personal-car identity and save context',async t=>{
 const f=await fixture();t.after(f.close);const g=f.g;g.inCar=false;const original=g.vehicle,money=g.money,id=original.instanceId,condition=original.condition,battery=original.battery;
 g.robotaxi=new RoboTaxiService(g);const originalTick=g.physicsTick;g.physicsTick=dt=>{originalTick(dt);g.robotaxi.update(dt);};const s=await attachSession(f,{slot:'s-service-robotaxi'});
 const request=g.robotaxi.requestRide('s',{x:4,z:80,name:'VOLT 体验中心'});assert.equal(request.ok,true,request.reason);const taxi=g.robotaxi.taxi,start=taxi.pos.clone();
 const approachTicks=until(f,()=>g.robotaxi.phase==='waiting',6000);report('taxi-approach',{phase:g.robotaxi.phase,approachTicks,distance:taxi.pos.distanceTo(start),pickup:g.robotaxi.pickup,position:taxi.pos.toArray(),speed:taxi.speed,reason:g.robotaxi.driver.reason});assert.equal(g.robotaxi.phase,'waiting','actual native-control pickup must reach waiting without pose correction');assert.ok(taxi.pos.distanceTo(start)>40);
 // Place only the on-foot avatar beside its already arrived pickup for the entry
 // boundary. This is not a browser walk-to-car or full passenger-route claim.
 g.playerPos.copy(taxi.pos);g.playerPos.x+=3;g.person.root.position.copy(g.playerPos);assert.equal(g.robotaxi.board().ok,true);const boardingTicks=until(f,()=>g.robotaxi.phase==='riding',600);assert.equal(g.robotaxi.phase,'riding');assert.equal(g.vehicle,taxi);assert.equal(g.robotaxi.originalVehicle,original);assert.equal(g.save(false),true);
 const saved=s.session.read();assert.equal(saved.vehicle.instanceId,id);assert.equal(saved.vehicle.model,'s');assert.equal(saved.inCar,false);assert.equal(saved.money,money);assert.equal(saved.vehicle.condition,condition);assert.equal(saved.vehicle.battery,battery);s.assertProtected();
 assert.equal(g.robotaxi.cancel().ok,true);const exitTicks=until(f,()=>!g.robotaxi.active,900);assert.equal(g.robotaxi.phase,'cancelled');assert.equal(g.vehicle,original);assert.equal(g.inCar,false);assert.equal(g.money,money);assert.equal(g.vehicle.instanceId,id);assert.equal(g.save(false),true);s.assertProtected();
 const entry=await readCitySlot(s.storage,s.entry.slot,validateSave),f2=await fixture();t.after(f2.close);const next=await attachSession(f2,{storage:s.storage,entry});assert.equal(f2.g.load(false,entry.save,false),true);assert.equal(f2.g.vehicle.instanceId,id);assert.equal(f2.g.money,money);assert.equal(f2.g.inCar,false);next.assertProtected();
 report('robotaxi-context',{approachTicks,boardingTicks,exitTicks,money,personalId:id,taxiId:taxi.instanceId,sourceWrites:0,scope:'direct service API, physical approach, native entry and cancel; no completed passenger trip/UI'});
});

test('autonomy-test company car genuinely drives and cancellation restores personal vehicle without payout',async t=>{
 const f=await fixture();t.after(f.close);const g=f.g,original=g.vehicle,money=g.money,id=original.instanceId,jobs=g.jobsCompleted;
 g.autonomyTest=new AutonomyTestJobService(g);const tick=g.physicsTick;g.physicsTick=dt=>{tick(dt);g.autonomyTest.update(dt,f.controls.get(g.vehicle.instanceId)??hold);};const s=await attachSession(f,{slot:'s-service-autonomy'});
 const start=g.autonomyTest.start();assert.equal(start.ok,true,start.reason);const work=g.autonomyTest.workVehicle,initial=work.pos.clone();assert.notEqual(work.instanceId,id);assert.equal(g.vehicle,work);assert.equal(g.autonomyTest.originalVehicle,original);assert.equal(s.session.read().vehicle.instanceId,id);assert.equal(s.session.read().job,null);
 f.controls.set(work.instanceId,{throttle:1,brake:0,steer:0});f.step(90);assert.ok(work.pos.distanceTo(initial)>1);assert.ok(f.physics.vehicles.has(work));assert.ok(Number.isFinite(work.speed));
 const request=g.autonomyTest.cancel();assert.equal(request.ok,true);f.controls.set(work.instanceId,hold);const stoppingTicks=until(f,()=>!g.autonomyTest.active,900);assert.equal(g.autonomyTest.phase,'cancelled');assert.equal(g.vehicle,original);assert.equal(g.money,money);assert.equal(g.jobsCompleted,jobs);assert.equal(g.job,null);assert.equal(s.session.read().vehicle.instanceId,id);assert.equal(s.session.read().money,money);assert.equal(s.session.read().job,null);s.assertProtected();
 report('autonomy-cancel',{workId:work.instanceId,personalId:id,drivenMetres:work.pos.distanceTo(initial),stoppingTicks,money,jobs,scope:'direct service start, actual manual control motion/cancel; no full Pilot/takeover/reward completion'});
});
