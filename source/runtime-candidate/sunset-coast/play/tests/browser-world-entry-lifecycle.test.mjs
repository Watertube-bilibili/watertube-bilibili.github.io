import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, dirname} from 'node:path';
import {pathToFileURL} from 'node:url';

const sourceDirectory=new URL('../',import.meta.url);
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const turn=()=>new Promise(resolve=>setImmediate(resolve));
async function until(check){for(let i=0;i<100&&!check();i++)await turn();assert.ok(check(),'fixture did not reach the expected boot boundary');}
function element(tag){return {tag,attributes:{},style:{setProperty(){}},setAttribute(k,v){this.attributes[k]=v;},remove(){this.removed=true;}};}
async function fixture(map='estuary',{actualLease=false}={}){
 const root=await mkdtemp(join(tmpdir(),'sunrise-entry-lifecycle-')),play=join(root,'runtime/sunset-coast/play');
 await mkdir(play,{recursive:true});
 for(const file of ['browser-world-entry.js','browser-world-lifecycle.js','browser-world-boot-storage.js'])await writeFile(join(play,file),await readFile(new URL(file,sourceDirectory)));
 const events=[],state={events,map,owned:true,disposed:0,released:0,writes:0,installations:0,constructed:0,reloads:0};state.locks={request(_key,_options,callback){state.events.push('actual-lock-request');return Promise.resolve(state.lockGate).then(()=>callback({}));}};
 const win=new EventTarget();win.location={reload(){state.reloads++;}};
 const body={children:[],append(node){this.children.push(node);}};
 const doc={body,documentElement:{dataset:{}},createElement:element,getElementById:()=>state.label,querySelector:()=>null};state.label=element('label');
 const game={paused:false,renderer:{},validateSave:s=>s,save(){state.writes++;return true;},resetControls(){events.push('reset');},ui:{toast(){},updateMoney(){}}};
 state.game=game;state.makeGame=()=>{state.constructed++;events.push('construct');return game;};
 state.lease={ownsLock:()=>state.owned,release(){events.push('release');state.released++;state.owned=false;}};
 state.pack={configureRenderer(){events.push('configure');},dispose(){events.push('dispose');state.disposed++;}};
 state.config={map,key:'isolated-test-key',schema:2};state.entry={save:{player:{x:13,y:0,z:174,yaw:0}}};
 state.validate=s=>s;
 state.installRuntime=(g)=>{state.installations++;events.push('install');g.save=()=>{state.writes++;return true;};};
 state.importState={window:win,document:doc};
 const stubs={
  'browser-world-slots.js':`const s=globalThis.__sunriseEntryTest;export const browserWorldConfig=()=>s.config;export async function acquireWorldLease(_config,options){s.acquireOptions=options;s.events.push('acquire');return await(s.leaseGate??s.lease);}export async function readWorldSlot(){s.events.push('read');return await(s.slotGate??s.entry);}`,
  'browser-world-runtime.js':`const s=globalThis.__sunriseEntryTest;export function installBrowserWorldSnapshot(){s.events.push('snapshot');return s.validate;}export async function installCrescentFullRuntime(g,o){return await s.installRuntime(g,o);}`,
  'map-feature.js':`export function setCommonMaterialPack(p){globalThis.__sunriseEntryTest.events.push('set-pack');}`,
  'save-validation.js':`export const validateSave=s=>s;`,
  'vendor/three.module.js':`export const fixture=true;`,
  'mobile-ui.js':`const s=globalThis.__sunriseEntryTest;s.events.push('mobile-import');await s.mobileGate;s.importState.window.game=s.makeGame();`,
  'delivery-runtime.js':`export async function installDeliveryRuntime(g,o){return await globalThis.__sunriseEntryTest.installRuntime(g,o);}`
 };
 if(actualLease){
  await writeFile(join(play,'actual-slots.js'),await readFile(new URL('browser-world-slots.js',sourceDirectory)));
  stubs['browser-world-slots.js']=`import {acquireWorldLease as acquire} from './actual-slots.js';const s=globalThis.__sunriseEntryTest;export const browserWorldConfig=()=>s.config;export async function acquireWorldLease(config,options){s.acquireOptions=options;return acquire(config,{...options,locks:s.locks,window:s.importState.window});}export async function readWorldSlot(){return s.entry;}`;
  stubs['beta-save-slots.js']=`export const freshSave=()=>'';export const validateBetaRaw=(raw,validate)=>validate(JSON.parse(raw));`;
  stubs['delivery-offers.js']=`export const ESTUARY_DELIVERY_CATALOG='controlled-test-catalog';`;
  stubs['browser-world-policy.js']=`export const BROWSER_WORLD_SCHEMA=2;export function assertBrowserSnapshotCapability(){}`;
 }
 for(const [path,content]of Object.entries(stubs)){await mkdir(dirname(join(play,path)),{recursive:true});await writeFile(join(play,path),content);}
 await mkdir(join(root,'materials'));
 await writeFile(join(root,'materials/owned-asphalt-pack.js'),`export async function createOwnedAsphaltPack(){const s=globalThis.__sunriseEntryTest;s.events.push('create-pack');return await(s.packGate??s.pack);}`);
 const previous={window:globalThis.window,document:globalThis.document,localStorage:globalThis.localStorage,state:globalThis.__sunriseEntryTest};
 globalThis.window=win;globalThis.document=doc;globalThis.localStorage={getItem:()=>'{"fixture":true}',setItem(){}};globalThis.__sunriseEntryTest=state;
 const {startBrowserWorld}=await import(pathToFileURL(join(play,'browser-world-entry.js')).href);
 const emit=(name,persisted=false)=>{const event=new Event(name);Object.defineProperty(event,'persisted',{value:persisted});win.dispatchEvent(event);};
 return {state,win,doc,emit,boot:()=>startBrowserWorld({map,id:'s-isolated-test'}),async cleanup(){for(const [key,value]of [['window',previous.window],['document',previous.document],['localStorage',previous.localStorage],['__sunriseEntryTest',previous.state]]){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}await rm(root,{recursive:true,force:true});}};
}

// These are entry/lifecycle contract tests with controlled dependencies, not
// rendering, physics, asset, persistence or whole-game acceptance tests.
for(const map of ['estuary','crescent'])test(map+' waits for runtime restore before marking the entry ready',async()=>{
 const f=await fixture(map);try{
  const gate=deferred();f.state.installRuntime=async g=>{f.state.installations++;f.state.events.push('install');await gate.promise;g.save=()=>{f.state.writes++;return true;};};
  const boot=f.boot();await until(()=>f.state.installations===1);
  assert.equal(f.doc.documentElement.dataset.betaUiReady,undefined);assert.equal(f.state.events.includes('configure'),false);assert.equal(f.state.game.save(false),false);assert.equal(f.state.writes,0);assert.equal(f.state.acquireOptions.manageLifecycle,false);assert.ok(f.state.acquireOptions.signal instanceof AbortSignal);
  gate.resolve();await boot;assert.equal(f.doc.documentElement.dataset.betaUiReady,'2');assert.equal(f.state.game.save(false),true);assert.equal(f.state.writes,1);
  f.emit('pagehide',true);assert.equal(f.state.game.save(false),false);assert.equal(f.state.game.paused,true);assert.equal(f.state.released,1);assert.equal(f.state.disposed,1);
  f.emit('pageshow',true);assert.equal(f.state.reloads,1);
 }finally{await f.cleanup();}
});
test('leaving while acquiring a slot releases a late lease without importing Game',async()=>{
 const f=await fixture();try{const gate=deferred();f.state.leaseGate=gate.promise;const boot=f.boot();await until(()=>f.state.events.includes('acquire'));f.emit('pagehide',true);gate.resolve(f.state.lease);assert.deepEqual(await boot,{cancelled:true});assert.equal(f.state.released,1);assert.equal(f.state.constructed,0);assert.equal(f.doc.documentElement.dataset.betaUiReady,undefined);}finally{await f.cleanup();}
});
test('leaving while textures load disposes the late pack and never constructs Game',async()=>{
 const f=await fixture();try{const gate=deferred();f.state.packGate=gate.promise;const boot=f.boot();await until(()=>f.state.events.includes('create-pack'));f.emit('pagehide',true);gate.resolve(f.state.pack);assert.deepEqual(await boot,{cancelled:true});assert.equal(f.state.disposed,1);assert.equal(f.state.released,1);assert.equal(f.state.constructed,0);assert.equal(f.state.events.includes('set-pack'),false);}finally{await f.cleanup();}
});
test('a Game created by an already pending import is stopped before installing a writer',async()=>{
 const f=await fixture();try{const gate=deferred();f.state.mobileGate=gate.promise;const boot=f.boot();await until(()=>f.state.events.includes('mobile-import'));f.emit('pagehide',true);gate.resolve();assert.deepEqual(await boot,{cancelled:true});assert.equal(f.state.constructed,1);assert.equal(f.state.installations,0);assert.equal(f.state.game.paused,true);assert.equal(f.state.game.save(false),false);assert.equal(f.state.writes,0);assert.equal(f.doc.documentElement.dataset.betaUiReady,undefined);}finally{await f.cleanup();}
});
test('failed restore disables writes before cleanup and preserves the original error',async()=>{
 const f=await fixture();try{
  const error=Error('restore rejected'),cleanupError=Error('release cleanup rejected');
  f.state.installRuntime=()=>{throw error;};f.state.lease.release=()=>{assert.equal(f.state.game.save(false),false);f.state.events.push('release');f.state.released++;throw cleanupError;};
  await assert.rejects(f.boot(),e=>e===error);assert.equal(f.state.disposed,1);assert.equal(f.state.game.paused,true);assert.equal(f.state.writes,0);assert.match(f.state.label.textContent,/restore rejected/);assert.equal(f.doc.documentElement.dataset.betaUiReady,undefined);
 }finally{await f.cleanup();}
});
test('losing the lease during async restore prevents readiness and the installed writer',async()=>{
 const f=await fixture();try{const gate=deferred();f.state.installRuntime=async g=>{f.state.installations++;await gate.promise;g.save=()=>{f.state.writes++;return true;};};const boot=f.boot();await until(()=>f.state.installations===1);f.state.owned=false;gate.resolve();await assert.rejects(boot);assert.equal(f.state.game.save(false),false);assert.equal(f.state.writes,0);assert.equal(f.state.disposed,1);assert.equal(f.doc.documentElement.dataset.betaUiReady,undefined);}finally{await f.cleanup();}
});
test('leaving during async restore blocks a writer installed after pagehide',async()=>{
 const f=await fixture();try{const gate=deferred();f.state.installRuntime=async g=>{f.state.installations++;await gate.promise;g.save=()=>{f.state.writes++;return true;};};const boot=f.boot();await until(()=>f.state.installations===1);f.emit('pagehide',true);gate.resolve();assert.deepEqual(await boot,{cancelled:true});assert.equal(f.state.game.save(false),false);assert.equal(f.state.writes,0);assert.equal(f.doc.documentElement.dataset.betaUiReady,undefined);assert.equal(f.state.disposed,1);assert.equal(f.state.released,1);}finally{await f.cleanup();}
});
test('an async restore rejected after departure does not append a stale startup alert',async()=>{
 const f=await fixture();try{const gate=deferred();f.state.installRuntime=async()=>{f.state.installations++;await gate.promise;};const boot=f.boot();await until(()=>f.state.installations===1);f.emit('pagehide',true);gate.reject(Error('restore finished too late'));assert.deepEqual(await boot,{cancelled:true});assert.equal(f.doc.body.children.some(node=>node.attributes.role==='alert'),false);assert.equal(f.doc.documentElement.dataset.betaUiReady,undefined);assert.equal(f.state.game.save(false),false);}finally{await f.cleanup();}
});
test('a second boot in the same document cannot acquire another lease or stop the first Game',async()=>{
 const f=await fixture();try{await f.boot();const first=f.win.__sunriseBrowserWorldLifecycle;await assert.rejects(f.boot(),/此页面已启动过/);assert.equal(f.win.__sunriseBrowserWorldLifecycle,first);assert.equal(first.stopped,false);assert.equal(f.state.events.filter(x=>x==='acquire').length,1);assert.equal(f.state.game.paused,false);}finally{await f.cleanup();}
});
test('entry and actual lease cancel a pending lock immediately, without waiting for its late callback',async()=>{
 const f=await fixture('estuary',{actualLease:true});try{const gate=deferred();f.state.lockGate=gate.promise;const boot=f.boot();await until(()=>f.state.events.includes('actual-lock-request'));f.emit('pagehide',true);assert.deepEqual(await boot,{cancelled:true});assert.equal(f.state.acquireOptions.signal.aborted,true);gate.resolve();await turn();assert.equal(f.state.constructed,0);assert.equal(f.doc.documentElement.dataset.betaUiReady,undefined);}finally{await f.cleanup();}
});
test('entry and actual lease use one BFCache reload and permanently close the old writer',async()=>{
 const f=await fixture('crescent',{actualLease:true});try{await f.boot();assert.equal(f.state.game.save(false),true);f.emit('pagehide',true);assert.equal(f.state.acquireOptions.signal.aborted,true);assert.equal(f.state.game.save(false),false);f.emit('pageshow',true);f.emit('pageshow',true);assert.equal(f.state.reloads,1);assert.equal(f.state.disposed,1);}finally{await f.cleanup();}
});

for(const map of ['estuary','crescent'])test(map+' waits for actual physics readiness before restoring or opening writes',async()=>{
 const f=await fixture(map);try{const gate=deferred();f.state.game.physicsReady=gate.promise;const boot=f.boot();await until(()=>f.state.constructed===1);await turn();assert.equal(f.state.installations,0);assert.equal(f.state.game.save(),false);assert.equal(f.doc.documentElement.dataset.betaUiReady,undefined);gate.resolve(true);await boot;assert.equal(f.state.installations,1);assert.equal(f.state.game.save(),true);}finally{await f.cleanup();}
});
test('physics startup failure during entry releases ownership and never restores or marks ready',async()=>{
 const f=await fixture();try{const gate=deferred();f.state.game.physicsReady=gate.promise;const boot=f.boot();await until(()=>f.state.constructed===1);const error=Error('physics start rejected');f.win.__sunriseBrowserWorldLifecycle.fail(error);gate.resolve(false);await assert.rejects(boot,e=>e===error);assert.equal(f.state.installations,0);assert.equal(f.state.game.save(),false);assert.equal(f.state.writes,0);assert.equal(f.doc.documentElement.dataset.betaUiReady,undefined);assert.equal(f.state.released,1);}finally{await f.cleanup();}
});
