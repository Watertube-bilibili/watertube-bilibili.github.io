import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Execute the exact production function without pretending the unprovided
// snapshot, catalog and validation dependencies are part of this test fixture.
const source=readFileSync(new URL('../browser-world-slots.js',import.meta.url),'utf8');
const acquireWorldLease=new Function(source.slice(source.indexOf('export async function acquireWorldLease')).replace(/^export /,'')+';return acquireWorldLease;')();
const tick=()=>new Promise(resolve=>setImmediate(resolve));
class Page extends EventTarget{
 constructor(){super();this.listeners=new Map();this.reloads=0;this.location={reload:()=>{this.reloads++;}};}
 addEventListener(type,listener,options){super.addEventListener(type,listener,options);if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(listener);}
 removeEventListener(type,listener,options){super.removeEventListener(type,listener,options);this.listeners.get(type)?.delete(listener);}
 count(type){return this.listeners.get(type)?.size??0;}
 emit(type,persisted=false){const event=new Event(type);Object.defineProperty(event,'persisted',{value:persisted});this.dispatchEvent(event);}
}
function controlled(){
 const requests=[];
 return {requests,request(key,options,callback){let resolve,reject;const result=new Promise((r,j)=>{resolve=r;reject=j;});requests.push({key,options,callback,resolve,reject});return result;},grant(index=0,lock={}){const request=requests[index],held=Promise.resolve(request.callback(lock));held.then(request.resolve,request.reject);return held;}};
}
function setup(options={}){const locks=controlled(),window=new Page(),config={key:'sunrise-coast:browser-world:v2:estuary:b-test'};return {locks,window,config,options:{locks,window,...options}};}

test('lease uses the exact slot key and holds the lock callback until idempotent release',async()=>{
 const f=setup(),ready=acquireWorldLease(f.config,f.options);assert.equal(f.locks.requests[0].key,f.config.key);assert.deepEqual(f.locks.requests[0].options,{ifAvailable:true});
 let settled=false;const held=f.locks.grant().then(()=>settled=true),lease=await ready;await tick();assert.equal(settled,false);assert.equal(lease.ownsLock(),true);
 assert.doesNotThrow(()=>{lease.release();lease.release();});assert.equal(lease.ownsLock(),false);await held;assert.equal(settled,true);assert.equal(f.window.count('pagehide'),0);assert.equal(f.window.count('pageshow'),0);
});
test('leaving before acquisition rejects immediately and a late callback never owns the slot',async()=>{
 const f=setup(),ready=acquireWorldLease(f.config,f.options),rejected=assert.rejects(ready,error=>error.code==='BROWSER_WORLD_CANCELLED');
 f.window.emit('pagehide',true);await rejected;await f.locks.grant();assert.equal(f.window.count('pagehide'),0);assert.equal(f.window.count('pageshow'),1);
 f.window.emit('pageshow',true);f.window.emit('pageshow',true);assert.equal(f.window.reloads,1);assert.equal(f.window.count('pageshow'),0);
});
test('already aborted acquisition never requests a lock or leaves page listeners',async()=>{
 const controller=new AbortController(),reason=Error('already left');controller.abort(reason);const f=setup({signal:controller.signal});
 await assert.rejects(acquireWorldLease(f.config,f.options),error=>error===reason);assert.equal(f.locks.requests.length,0);assert.equal(f.window.count('pagehide'),0);assert.equal(f.window.count('pageshow'),0);
});
test('aborting a pending acquisition rejects ready and safely finishes a late callback',async()=>{
 const controller=new AbortController(),f=setup({signal:controller.signal,manageLifecycle:false}),reason=Error('cancel pending'),ready=acquireWorldLease(f.config,f.options),rejected=assert.rejects(ready,error=>error===reason);
 controller.abort(reason);await rejected;await f.locks.grant();assert.equal(f.window.count('pagehide'),0);assert.equal(f.window.count('pageshow'),0);
});
test('aborting an acquired lease invalidates ownership synchronously and releases its callback',async()=>{
 const controller=new AbortController(),f=setup({signal:controller.signal,manageLifecycle:false}),ready=acquireWorldLease(f.config,f.options),held=f.locks.grant(),lease=await ready;
 controller.abort(Error('leave'));assert.equal(lease.ownsLock(),false);lease.release();await held;assert.equal(f.window.reloads,0);
});
test('signal abort and release can reenter without retaining the lock or throwing',async()=>{
 const controller=new AbortController(),f=setup({signal:controller.signal,manageLifecycle:false});let lease;
 controller.signal.addEventListener('abort',()=>lease?.release());const ready=acquireWorldLease(f.config,f.options),held=f.locks.grant();lease=await ready;
 assert.doesNotThrow(()=>controller.abort());assert.equal(lease.ownsLock(),false);lease.release();await held;
});
test('caller-managed lifecycle installs no page handlers and does not duplicate BFCache reload',async()=>{
 const f=setup({manageLifecycle:false}),ready=acquireWorldLease(f.config,f.options),held=f.locks.grant(),lease=await ready;
 assert.equal(f.window.count('pagehide'),0);assert.equal(f.window.count('pageshow'),0);f.window.emit('pagehide',true);f.window.emit('pageshow',true);assert.equal(f.window.reloads,0);assert.equal(lease.ownsLock(),true);lease.release();await held;
});
test('default lifecycle releases ownership on pagehide and reloads only after a persisted return',async()=>{
 const f=setup(),ready=acquireWorldLease(f.config,f.options),held=f.locks.grant(),lease=await ready;
 f.window.emit('pageshow',true);assert.equal(f.window.reloads,0);f.window.emit('pagehide',true);assert.equal(lease.ownsLock(),false);await held;
 f.window.emit('pageshow',false);assert.equal(f.window.reloads,0);f.window.emit('pageshow',true);f.window.emit('pageshow',true);assert.equal(f.window.reloads,1);
});
test('a competing tab receives an error and no orphaned lifecycle listeners',async()=>{
 const f=setup(),ready=acquireWorldLease(f.config,f.options),rejected=assert.rejects(ready,/其他标签页/);await f.locks.grant(0,null);await rejected;assert.equal(f.window.count('pagehide'),0);assert.equal(f.window.count('pageshow'),0);
});
test('synchronous request failure preserves the original error and cleans listeners',async()=>{
 const f=setup(),reason=Error('request failed');f.locks.request=()=>{throw reason;};
 await assert.rejects(acquireWorldLease(f.config,f.options),error=>error===reason);assert.equal(f.window.count('pagehide'),0);assert.equal(f.window.count('pageshow'),0);
});
test('asynchronous request failure rejects ready and cleans listeners',async()=>{
 const f=setup(),reason=Error('async request failed'),ready=acquireWorldLease(f.config,f.options),rejected=assert.rejects(ready,error=>error===reason);
 f.locks.requests[0].reject(reason);await rejected;assert.equal(f.window.count('pagehide'),0);assert.equal(f.window.count('pageshow'),0);
});
test('request failure after granting invalidates the returned lease',async()=>{
 const f=setup(),ready=acquireWorldLease(f.config,f.options),held=f.locks.grant(),lease=await ready;
 f.locks.requests[0].reject(Error('lock request failed after grant'));await tick();assert.equal(lease.ownsLock(),false);await held;assert.equal(f.window.count('pagehide'),0);assert.equal(f.window.count('pageshow'),0);
});
test('release remains synchronous and nonthrowing if listener cleanup throws',async()=>{
 const f=setup(),ready=acquireWorldLease(f.config,f.options),held=f.locks.grant(),lease=await ready;
 f.window.removeEventListener=()=>{throw Error('cleanup failed');};assert.doesNotThrow(()=>{lease.release();lease.release();});assert.equal(lease.ownsLock(),false);await held;
});
test('same-map same-slot locks exclude each other while a different map remains independent',async()=>{
 const active=new Set(),locks={request(key,options,callback){return Promise.resolve().then(async()=>{const available=!active.has(key);if(available)active.add(key);try{return await callback(available?{}:null);}finally{if(available)active.delete(key);}});}};
 const key='sunrise-coast:browser-world:v2:estuary:b-test',options={locks,window:new Page(),manageLifecycle:false};
 const first=await acquireWorldLease({key},options);await assert.rejects(acquireWorldLease({key},options),/其他标签页/);
 const other=await acquireWorldLease({key:key.replace(':estuary:',':crescent:')},options);assert.equal(first.ownsLock(),true);assert.equal(other.ownsLock(),true);
 first.release();other.release();await tick();assert.equal(active.size,0);
});
