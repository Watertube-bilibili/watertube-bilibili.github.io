import test from 'node:test';
import assert from 'node:assert/strict';
import {BrowserPhysicsSystem} from '../browser-physics.js';
import {assertBrowserSnapshotCapability} from '../browser-world-policy.js';

let revision=0;
async function factory(search,hostname='localhost') {
 globalThis.location={search,hostname,reload(){}};
 return import('../physics-backend.js?air-policy-test='+revision++);
}
const game=()=>({vehicle:{kind:'car',model:{id:'s'}},ui:{toast(){}},world:{colliders:[]}});
const query='?physics=browser&preview=1&map=estuary';

test('production browser worlds retain planar capabilities and deny unsupported save content',async()=>{
 for(const world of ['estuary','crescent']){
  const backend=await factory('?runtime=browser&world='+world+'&browserSlot=b-test','example.com');
  const {PhysicsSystem}=await backend.loadPhysicsBackend(),physics=new PhysicsSystem(game());
  assert.equal(physics.roadsters,null);assert.equal(physics.motorcycles,null);
  assert.equal(physics.capabilities.roadsterManualFlight,false);assert.equal(physics.capabilities.roadsterFlight,false);
  assert.equal(physics.supportsVehicle({kind:'car',model:{id:'roadster_rocket'}}),false);
  assert.throws(()=>assertBrowserSnapshotCapability({vehicle:{model:'roadster_rocket'}},world),/尚未完成迁移/);
 }
});
test('explicit local air and motorcycle options select only the requested adapters',async()=>{
 for(const [options,air,moto]of [['',false,false],['&air=1',true,false],['&moto=1',false,true],['&air=1&moto=1',true,true]]){
  const {loadPhysicsBackend}=await factory(query+options),{PhysicsSystem}=await loadPhysicsBackend(),p=new PhysicsSystem(game());
  assert.equal(!!p.roadsters,air);assert.equal(!!p.motorcycles,moto);
  assert.equal(p.capabilities.roadsterManualFlight,air);assert.equal(p.capabilities.roadsterFlight,false);
  assert.equal(p.capabilities.roadsterManeuvers,false);assert.equal(p.capabilities.aircraft,false);
 }
});
test('public hosts, ambiguous options and production-slot air injection fail closed',async()=>{
 const remote=await factory(query+'&air=1','example.com');await assert.rejects(remote.loadPhysicsBackend(),/本机隔离预览/);
 for(const option of ['air=0','air=true','air=1&air=1','moto=0','moto=1&moto=1']){
  const f=await factory(query+'&'+option);await assert.rejects(f.loadPhysicsBackend(),/必须唯一/);
 }
 await assert.rejects(factory('?runtime=browser&world=estuary&browserSlot=b-test&air=1'),/不接受实验/);
 const missingPreview=await factory('?physics=browser&map=estuary&air=1');await assert.rejects(missingPreview.loadPhysicsBackend(),/本机隔离预览/);
});
test('formal lifecycle remains the sole BFCache reload owner, local previews reload once',async()=>{
 for(const formal of [true,false]){
  const w=new EventTarget(),d=new EventTarget();let reloads=0;
  globalThis.window=w;globalThis.document=d;globalThis.location={reload:()=>reloads++};
  const g=game();if(formal){g.browserWorldLifecycle={};w.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});}
  const p=new BrowserPhysicsSystem(g,{roadsters:true});await p.start();
  const e=new Event('pageshow');Object.defineProperty(e,'persisted',{value:true});w.dispatchEvent(e);
  assert.equal(reloads,1);w.dispatchEvent(new Event('pagehide'));
  delete globalThis.window;delete globalThis.document;delete globalThis.location;
 }
});
