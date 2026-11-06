import test from 'node:test';
import assert from 'node:assert/strict';
import {rocketFixture,R,THREE,coast} from './fixtures/roadster-physics-fixture.mjs';
import {RAPIER_ROADSTER_ACTIONS} from '../../sunset-coast/rapier/play/rapier-roadster-maneuver.js';
const terminal=v=>['complete','cancelled','rejected'].includes(v.roadsterState?.maneuver?.status);
const box=(f,{x=6880,y=13.02,z=1590,w=4,h=2,d=2,dynamic=false}={})=>{
 const rb=dynamic?f.physics.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(x,y,z).setGravityScale(0)):null;
 const desc=R.ColliderDesc.cuboid(w/2,h/2,d/2);if(!rb)desc.setTranslation(x,y,z);const collider=f.physics.world.createCollider(desc,rb??undefined);f.sync();return{rb,collider};
};
const report=(name,value)=>console.log('RAPIER_VAULT '+name+' '+JSON.stringify(value));
function traceToTerminal(f,limit=31){
 let minUp=1,maxStep=0,last=f.v.pos.clone(),lastPhase='',rollTravel=0,landingUp=1,landingAngle=0;const phases=[],trace=[];
 const seconds=f.until(()=>{
  const m=f.v.roadsterState.maneuver,up=new THREE.Vector3(0,1,0).applyQuaternion(f.v.physicsQuaternion).y;
  minUp=Math.min(minUp,up);maxStep=Math.max(maxStep,last.distanceTo(f.v.pos));
  if(m.phase==='cross'&&Math.hypot(...Object.values(f.physics.vehicles.get(f.v).rb.angvel()))>.3)rollTravel+=Math.abs(f.v.pos.z-last.z);
  if(m.phase==='land'){landingUp=Math.min(landingUp,up);landingAngle=m.angle;}
  if(m.phase!==lastPhase){phases.push(m.phase);trace.push({tick:f.physics.lastTick,phase:m.phase,status:m.status,position:f.v.pos.toArray(),angle:m.angle,code:m.code});lastPhase=m.phase;}
  last.copy(f.v.pos);return terminal(f.v);
 },limit);
 return{seconds,minUp,maxStep,rollTravel,landingUp,landingAngle,phases,trace,final:structuredClone(f.v.roadsterState),position:f.v.pos.toArray(),contacts:f.damage.length};
}

test('all original Rocket actions are declared and run through original public request API',()=>assert.deepEqual([...RAPIER_ROADSTER_ACTIONS],['spin','vault','vault_spin']));
for(const [action,height] of [['vault',2],['vault_spin',2],['vault_spin',3.4]])test(`${action} crosses actual ${height}m obstacle with real forces then settles and lands`,async t=>{
 const f=await rocketFixture({units:2400});t.after(f.close);box(f,{h:height,y:12.02+height/2});
 const body=f.physics.vehicles.get(f.v).rb,id=f.v.instanceId,before=f.v.roadsterAirUnits;
 assert.equal(f.action(action).ok,true);const serial=f.v.roadsterRequest.actionSerial;const r=traceToTerminal(f);
 assert.equal(r.final.maneuver.status,'complete',JSON.stringify(r));assert.equal(r.final.maneuver.code,'COMPLETE');assert.equal(r.final.mode,'road');assert.equal(f.v.grounded,true);assert.equal(f.v.roadsterRequest.air,false);assert.equal(f.v.roadsterRequest.pending,false);
 assert.ok(Math.abs(f.v.pos.z-1586)<.15);assert.ok(Math.abs(f.v.pos.y-12.02)<.15);assert.ok(r.maxStep<.2);assert.equal(r.contacts,0);assert.ok(r.phases.includes('cross')&&r.phases.includes('land'));assert.ok(f.v.roadsterAirUnits<before-80);assert.ok(f.v.roadsterAirUnits>0);
 assert.equal(f.v.instanceId,id);assert.equal(f.physics.vehicles.get(f.v).rb,body);assert.equal(r.final.maneuver.serial,serial);
 if(action==='vault_spin'){assert.ok(r.minUp<-.99);assert.ok(r.rollTravel>5);assert.ok(r.landingUp>.995);assert.ok(r.landingAngle>2*Math.PI+.02);assert.ok(r.phases.includes('settle'));}else assert.ok(r.minUp>.995);
 // Completion and gas ownership survive further real frames; no serial replay.
 f.step(.6);assert.equal(f.v.roadsterState.maneuver.serial,serial);assert.equal(f.v.roadsterState.maneuver.status,'complete');assert.equal(f.physics.failed,false);report(action+'-'+height,r);
});

for(const [name,configure,code] of [
 ['no-obstacle',()=>{},'NO_OBSTACLE'],
 ['too-close',f=>box(f,{z:1596}),'OBSTACLE_TOO_CLOSE'],
 ['too-high',f=>box(f,{h:4,y:14.02}),'OBSTACLE_TOO_HIGH'],
 ['no-pad',f=>{box(f);box(f,{z:1579.5,y:12.52,d:23,h:1,w:5});},'NO_LANDING_PAD'],
 ['roll-clearance',f=>{box(f);box(f,{x:6882.8,y:17.72,z:1590,w:.5,h:4,d:4});},'VAULT_SPIN_CLEARANCE'],
])test(`unsafe vault_spin refuses actual ${name} geometry and remains drivable`,async t=>{
 const f=await rocketFixture({units:2400});t.after(f.close);configure(f);const before=f.v.pos.clone();assert.equal(f.action('vault_spin').ok,true);f.step();
 assert.equal(f.v.roadsterState.maneuver.status,'rejected');assert.equal(f.v.roadsterState.maneuver.code,code);assert.equal(f.v.roadsterRequest.pending,false);assert.equal(f.v.roadsterState.mode,'road');assert.equal(f.physics.failed,false);assert.ok(f.v.pos.distanceTo(before)<.01);f.step(.2);assert.equal(f.physics.failed,false);report(name,{state:f.v.roadsterState.maneuver,position:f.v.pos.toArray()});
});

test('upright vault still fits the actual corridor which rejects rolling vault',async t=>{
 const f=await rocketFixture({units:2400});t.after(f.close);box(f);box(f,{x:6882.8,y:17.72,z:1590,w:.5,h:4,d:4});assert.equal(f.action('vault').ok,true);const r=traceToTerminal(f);assert.equal(r.final.maneuver.status,'complete');assert.equal(r.contacts,0);assert.ok(r.minUp>.995);report('upright-narrow',r);
});

for(const interruption of ['cancel','manual','intruder','landing-changed','power'])test(`crossing interruption ${interruption} never claims completed landing`,async t=>{
 const f=await rocketFixture({units:2400});t.after(f.close);box(f);f.action('vault_spin');f.until(()=>f.v.roadsterState.maneuver.phase==='cross'&&f.v.roadsterState.maneuver.angle>1.5);const body=f.physics.vehicles.get(f.v).rb,gas=f.v.roadsterAirUnits;
 if(interruption==='cancel')assert.equal(f.action('cancel').ok,true);
 if(interruption==='manual'){f.g.keys.KeyW=true;f.g.baseInput={throttle:1};}
 if(interruption==='intruder'){const p=body.translation();box(f,{x:p.x,y:p.y,z:p.z-4.5,w:.5,h:.5,d:.5,dynamic:true});}
 if(interruption==='landing-changed')box(f,{z:1586,y:12.52,w:4,h:1,d:4});
 if(interruption==='power')f.v.condition=0;
 const r=traceToTerminal(f,10);assert.equal(r.final.maneuver.status,'cancelled');assert.equal(r.final.maneuver.code,({cancel:'CANCELLED',manual:'MANUAL_OVERRIDE',intruder:'VAULT_SPIN_BLOCKED','landing-changed':'CANCELLED',power:'NO_POWER'})[interruption]);assert.equal(f.physics.failed,false);assert.equal(f.physics.vehicles.get(f.v).rb,body);assert.ok(f.v.roadsterAirUnits<=gas);assert.equal(r.contacts,0);
 if(interruption==='power')assert.equal(r.final.mode,'unpowered');else assert.equal(r.final.mode,'air');
 if(interruption==='cancel'||interruption==='intruder'){f.step(4);assert.ok(new THREE.Vector3(0,1,0).applyQuaternion(f.v.physicsQuaternion).y>.995);}
 report(interruption,r);
});

test('same action serial cannot restart crossing; failure restores nested planner and blocks staged save',async t=>{
 const f=await rocketFixture({units:2400});t.after(f.close);box(f);f.action('vault_spin');f.until(()=>f.v.roadsterState.maneuver.phase==='cross'&&f.v.roadsterState.maneuver.angle>1.5);
 const e=f.physics.vehicles.get(f.v),body=e.rb,elapsed=e.air.maneuver.elapsed;f.step();assert.ok(e.air.maneuver.elapsed>elapsed);assert.equal(e.air.maneuver.lastSerial,1);
 const old={air:structuredClone({...e.air,reserve:{units:e.air.reserve.units}}),request:structuredClone(f.v.roadsterRequest),state:structuredClone(f.v.roadsterState),pose:{...body.translation()},rotation:{...body.rotation()},tick:f.physics.lastTick};let writes=0;
 const publish=f.physics.publish.bind(f.physics);f.physics.publish=(...args)=>{publish(...args);f.g.physicsTransactions.requestSave(()=>{writes++;return true;});throw Error('injected vault publication failure');};
 assert.equal(f.physics.step(1/60),false);assert.equal(f.physics.failed,true);assert.equal(f.g.physicsTransactions.canWrite(),false);assert.equal(writes,0);assert.equal(f.physics.lastTick,old.tick);assert.deepEqual({...body.translation()},old.pose);assert.deepEqual({...body.rotation()},old.rotation);assert.deepEqual({...e.air,reserve:{units:e.air.reserve.units}},old.air);assert.deepEqual(f.v.roadsterRequest,old.request);assert.deepEqual(f.v.roadsterState,old.state);report('rollback',{tick:old.tick,gas:old.air.reserve.units,status:old.state.maneuver.status,writes});
});

test('empty tank cannot lift over obstacle or manufacture reserve; only terminal grounded compressor can refill',async t=>{
 const f=await rocketFixture({units:0});t.after(f.close);box(f);
 // A saved empty tank is installed before the action, through the same actual
 // same-instance reset/reconcile boundary tested by the original spin suite.
 f.v.roadsterAirUnits=0;f.v.roadsterCharge=0;f.v.physicsResetSerial=1;f.physics.reconcile();f.sync();const original=f.v.pos.clone();f.action('vault_spin');let active=0;
 const seconds=f.until(()=>{if(f.v.roadsterState.maneuver.status==='active'){active++;assert.equal(f.v.roadsterAirUnits,0);assert.ok(f.v.pos.distanceTo(original)<.05);assert.equal(f.v.roadsterState.maneuver.angle,0);}return terminal(f.v);},31);
 assert.equal(f.v.roadsterState.maneuver.status,'cancelled');assert.equal(f.v.roadsterState.maneuver.code,'TIMEOUT');assert.ok(active>=1800);assert.ok(Math.abs(f.v.roadsterAirUnits-8/60)<1e-8);assert.equal(f.v.grounded,true);assert.equal(f.physics.failed,false);report('empty-tank',{seconds,active,position:f.v.pos.toArray(),gas:f.v.roadsterAirUnits,state:f.v.roadsterState.maneuver});
});
