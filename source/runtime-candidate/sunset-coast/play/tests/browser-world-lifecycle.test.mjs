import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createBrowserWorldLifecycle} from '../browser-world-lifecycle.js';

function fixture(options={}){
 const events=[],cleanupErrors=[];let owned=true,saves=0,resets=0,reloads=0,game;
 const window=new EventTarget();window.location={reload(){reloads++;}};
 const lease={ownsLock:()=>owned,release(){events.push('release');owned=false;}};
 const pack={dispose(){events.push('dispose');}};
 game={paused:false,save(...args){events.push('save');saves++;return args.length?args[0]:true;},resetControls(){events.push('reset');resets++;}};
 const lifecycle=createBrowserWorldLifecycle({window,getGame:()=>game,reportCleanupError:error=>cleanupErrors.push(error),...options});
 const dispatch=(type,persisted=false)=>{const event=new Event(type);Object.defineProperty(event,'persisted',{value:persisted});window.dispatchEvent(event);};
 return{window,lease,pack,lifecycle,dispatch,events,cleanupErrors,get game(){return game;},set game(value){game=value;},setOwned:value=>owned=value,
  get saves(){return saves;},get resets(){return resets;},get reloads(){return reloads;}};
}

test('an acquired lease permits protected writes and explicit readiness',()=>{
 const f=fixture();f.lifecycle.trackLease(f.lease);f.lifecycle.trackPack(f.pack);f.lifecycle.trackGame(f.game);
 f.lifecycle.enableWrites();
 assert.equal(f.game.save('saved'), 'saved');assert.equal(f.saves,1);assert.equal(f.lifecycle.markReady(),f.game);assert.equal(f.lifecycle.isReady,true);
});

test('pagehide closes current and retained save guards before releasing resources',()=>{
 const f=fixture();f.lifecycle.trackLease(f.lease);f.lifecycle.trackPack(f.pack);f.lifecycle.trackGame(f.game);
 f.lifecycle.enableWrites();
 const retained=f.game.save.bind(f.game);let releaseSave,disposeSave;
 f.lease.release=()=>{releaseSave=retained();f.events.push('release');};f.pack.dispose=()=>{disposeSave=f.game.save();f.events.push('dispose');};
 f.dispatch('pagehide',true);
 assert.equal(releaseSave,false);assert.equal(disposeSave,false);assert.equal(f.saves,0);assert.equal(f.game.paused,true);
 assert.deepEqual(f.events,['reset','release','dispose']);assert.equal(f.lifecycle.reason.code,'BROWSER_WORLD_CANCELLED');
 assert.throws(()=>f.lifecycle.checkpoint(),error=>error===f.lifecycle.reason);
});

test('pagehide while lease or material work is pending cleans late results once',async()=>{
 const f=fixture();let resolveLease,resolvePack;
 const leaseWait=new Promise(resolve=>resolveLease=resolve),packWait=new Promise(resolve=>resolvePack=resolve);
 const leaseTask=leaseWait.then(value=>f.lifecycle.trackLease(value));
 const packTask=packWait.then(value=>f.lifecycle.trackPack(value));
 f.dispatch('pagehide',true);const reason=f.lifecycle.reason;resolveLease(f.lease);resolvePack(f.pack);
 await assert.rejects(leaseTask,error=>error===reason);await assert.rejects(packTask,error=>error===reason);
 f.lifecycle.stop(new Error('later failure'));
 assert.equal(f.events.filter(x=>x==='release').length,1);assert.equal(f.events.filter(x=>x==='dispose').length,1);assert.equal(f.lifecycle.reason,reason);assert.equal(f.lifecycle.signal.aborted,true);
});

test('a game created after departure is guarded and paused at the next checkpoint',()=>{
 const f=fixture();const late=f.game;f.game=null;f.dispatch('pagehide',true);f.game=late;
 assert.throws(()=>f.lifecycle.checkpoint(),error=>error===f.lifecycle.reason);assert.equal(late.paused,true);assert.equal(late.save(),false);assert.equal(f.saves,0);
});

test('late trackGame also disables a game not exposed through getGame',()=>{
 const f=fixture();const late=f.game;f.game=null;f.dispatch('pagehide');
 assert.throws(()=>f.lifecycle.trackGame(late),error=>error===f.lifecycle.reason);assert.equal(late.paused,true);assert.equal(late.save(),false);
});

test('cleanup failures do not mask the original failure or skip other resources',async()=>{
 const f=fixture(),original=new Error('restore failed'),releaseError=new Error('release failed'),disposeError=new Error('dispose failed');
 f.lifecycle.trackLease(f.lease);f.lifecycle.trackPack(f.pack);f.lifecycle.trackGame(f.game);
 f.lease.release=()=>{assert.equal(f.game.save(),false);throw releaseError;};f.pack.dispose=()=>Promise.reject(disposeError);
 assert.equal(f.lifecycle.fail(original),original);f.lifecycle.stop(new Error('ignored'));await Promise.resolve();
 assert.equal(f.lifecycle.reason,original);assert.equal(f.game.paused,true);assert.equal(f.resets,1);assert.deepEqual(f.cleanupErrors,[releaseError,disposeError]);
});

test('BFCache return reloads once and keeps the old runtime unable to write',()=>{
 const f=fixture();f.lifecycle.trackLease(f.lease);f.lifecycle.trackGame(f.game);f.lifecycle.enableWrites();f.lifecycle.markReady();
 f.dispatch('pageshow',true);assert.equal(f.reloads,0);
 f.dispatch('pagehide',true);f.dispatch('pageshow',false);assert.equal(f.reloads,0);
 f.dispatch('pageshow',true);f.dispatch('pageshow',true);assert.equal(f.reloads,1);assert.equal(f.lifecycle.isReady,false);assert.equal(f.game.save(),false);
});

test('lost ownership prevents writes and closes the runtime',()=>{
 const f=fixture();f.lifecycle.trackLease(f.lease);f.lifecycle.trackGame(f.game);f.lifecycle.enableWrites();f.setOwned(false);
 assert.equal(f.game.save(),false);assert.equal(f.saves,0);assert.equal(f.game.paused,true);assert.equal(f.lifecycle.stopped,true);
 assert.throws(()=>f.lifecycle.markReady(),error=>error===f.lifecycle.reason);
});

test('an ownership check that throws fails closed and preserves that error',()=>{
 const f=fixture(),error=new Error('lease query failed');f.lifecycle.trackLease(f.lease);f.lifecycle.trackGame(f.game);f.lifecycle.enableWrites();f.lease.ownsLock=()=>{throw error;};
 assert.equal(f.game.save(),false);assert.equal(f.lifecycle.reason,error);assert.equal(f.saves,0);assert.equal(f.game.paused,true);
});

test('writer replacement preserves wrappers without recursion or retained-writer bypass',()=>{
 const f=fixture();f.lifecycle.trackLease(f.lease);f.lifecycle.trackGame(f.game);
 f.lifecycle.enableWrites();
 const previous=f.game.save.bind(f.game);let runtimeWrites=0;
 f.game.save=function(value){runtimeWrites++;return previous(value);};const runtimeSave=f.game.save.bind(f.game);
 assert.equal(f.game.save('ok'),'ok');assert.equal(runtimeWrites,1);assert.equal(f.saves,1);
 f.lifecycle.stop(new Error('finished'));f.game.save=()=>{throw Error('must not write');};
 assert.equal(previous(),false);assert.equal(runtimeSave(),false);assert.equal(f.game.save(),false);assert.equal(runtimeWrites,1);assert.equal(f.saves,1);
});

test('protected writes are disabled before ownership and readiness requires a lease',()=>{
 const f=fixture();f.lifecycle.trackGame(f.game);assert.equal(f.game.save(),false);assert.equal(f.saves,0);assert.throws(()=>f.lifecycle.markReady(),/尚未取得/);
});

test('an already-invalid late lease stops the boot instead of enabling a writer',()=>{
 const f=fixture();f.setOwned(false);assert.throws(()=>f.lifecycle.trackLease(f.lease),/独立存档锁已失效/);assert.equal(f.game.save(),false);assert.equal(f.lifecycle.stopped,true);
});

test('failure identity is preserved for errors from another realm',()=>{
 const f=fixture(),original=vm.runInNewContext('new Error("foreign restore failure")');
 assert.equal(original instanceof Error,false);assert.equal(f.lifecycle.fail(original),original);assert.equal(f.lifecycle.reason,original);
 assert.throws(()=>f.lifecycle.checkpoint(),error=>error===original);
});

test('throwing control reset does not skip lease or material cleanup',()=>{
 const f=fixture(),error=new Error('reset failure');f.lifecycle.trackLease(f.lease);f.lifecycle.trackPack(f.pack);f.lifecycle.trackGame(f.game);
 f.game.resetControls=()=>{f.events.push('reset');throw error;};f.dispatch('pagehide');
 assert.deepEqual(f.events,['reset','release','dispose']);assert.deepEqual(f.cleanupErrors,[error]);assert.equal(f.game.save(),false);
});

test('cleanup remains safe if releasing the lease reenters stop',()=>{
 const f=fixture();f.lifecycle.trackLease(f.lease);f.lifecycle.trackPack(f.pack);f.lifecycle.trackGame(f.game);
 f.lease.release=()=>{f.events.push('release');f.lifecycle.stop(new Error('reentrant stop'));};
 const original=new Error('first failure');f.lifecycle.stop(original);
 assert.deepEqual(f.events,['reset','release','dispose']);assert.equal(f.lifecycle.reason,original);
});

test('the write gate blocks old and replacement writers until explicitly enabled',()=>{
 const f=fixture();f.lifecycle.trackLease(f.lease);f.lifecycle.trackGame(f.game);
 const retained=f.game.save.bind(f.game);let replacementWrites=0;
 assert.equal(retained(),false);assert.equal(f.lifecycle.writesEnabled,false);
 f.game.save=()=>{replacementWrites++;return true;};
 assert.equal(f.game.save(),false);assert.equal(replacementWrites,0);assert.equal(f.saves,0);
 assert.throws(()=>f.lifecycle.markReady(),/存档写入尚未启用/);assert.equal(f.lifecycle.isReady,false);
 f.lifecycle.enableWrites();assert.equal(f.game.save(),true);assert.equal(replacementWrites,1);assert.equal(f.lifecycle.writesEnabled,true);
});

test('enabling writes requires the current game to be tracked and a valid lease',()=>{
 const f=fixture();assert.throws(()=>f.lifecycle.enableWrites(),/尚未取得独立存档锁/);
 f.lifecycle.trackLease(f.lease);assert.throws(()=>f.lifecycle.enableWrites(),/存档保护尚未安装/);assert.equal(f.lifecycle.writesEnabled,false);
 f.lifecycle.trackGame(f.game);f.setOwned(false);assert.throws(()=>f.lifecycle.enableWrites(),/独立存档锁已失效/);assert.equal(f.lifecycle.writesEnabled,false);
});

test('stop aborts its signal after pausing controls and before resource release',()=>{
 const f=fixture();f.lifecycle.trackLease(f.lease);f.lifecycle.trackPack(f.pack);f.lifecycle.trackGame(f.game);f.lifecycle.enableWrites();
 assert.equal(f.lifecycle.signal.aborted,false);
 f.lifecycle.signal.addEventListener('abort',()=>{assert.equal(f.game.paused,true);assert.equal(f.game.save(),false);f.events.push('abort');});
 f.dispatch('pagehide',true);
 assert.equal(f.lifecycle.signal.aborted,true);assert.equal(f.lifecycle.signal.reason,f.lifecycle.reason);assert.equal(f.lifecycle.writesEnabled,false);
 assert.deepEqual(f.events,['reset','abort','release','dispose']);
});

test('a pending signal-aware acquisition is cancelled on departure',async()=>{
 const f=fixture();const pending=new Promise((resolve,reject)=>{f.lifecycle.signal.addEventListener('abort',()=>reject(f.lifecycle.signal.reason),{once:true});});
 const acquisition=pending.then(value=>f.lifecycle.trackLease(value));f.dispatch('pagehide',true);
 await assert.rejects(acquisition,error=>error===f.lifecycle.reason&&error.code==='BROWSER_WORLD_CANCELLED');
 assert.equal(f.events.includes('release'),false);assert.throws(()=>f.lifecycle.enableWrites(),error=>error===f.lifecycle.reason);
});

test('abort callbacks may reenter stop without repeating abort or cleanup',()=>{
 const f=fixture();f.lifecycle.trackLease(f.lease);f.lifecycle.trackPack(f.pack);f.lifecycle.trackGame(f.game);let aborts=0;
 f.lifecycle.signal.addEventListener('abort',()=>{aborts++;f.lifecycle.stop(new Error('abort callback'));});
 const error=new Error('original failure');f.lifecycle.fail(error);f.lifecycle.stop(error);
 assert.equal(aborts,1);assert.equal(f.lifecycle.reason,error);assert.deepEqual(f.events,['reset','release','dispose']);
});

test('an injected abort failure cannot skip resource cleanup',()=>{
 const error=new Error('abort failed');let aborts=0;
 class ThrowingAbortController{signal={aborted:false};abort(){aborts++;throw error;}}
 const f=fixture({AbortController:ThrowingAbortController});f.lifecycle.trackLease(f.lease);f.lifecycle.trackPack(f.pack);f.lifecycle.trackGame(f.game);
 const original=new Error('restore failed');f.lifecycle.stop(original);f.lifecycle.stop(original);
 assert.equal(aborts,1);assert.equal(f.lifecycle.reason,original);assert.deepEqual(f.cleanupErrors,[error]);assert.deepEqual(f.events,['reset','release','dispose']);
});

test('a different second lease is released and cannot authorize the old slot writer',()=>{
 const f=fixture();f.lifecycle.trackLease(f.lease);f.lifecycle.trackGame(f.game);f.lifecycle.enableWrites();
 const oldSave=f.game.save.bind(f.game);let rejectedReleases=0;
 const second={ownsLock:()=>true,release(){rejectedReleases++;assert.equal(oldSave(),false);f.events.push('reject-second');}};
 assert.throws(()=>f.lifecycle.trackLease(second),/不能切换独立存档锁/);
 assert.equal(rejectedReleases,1);assert.deepEqual(f.events,['reject-second','reset','release']);assert.equal(f.lifecycle.stopped,true);assert.equal(oldSave(),false);
 assert.throws(()=>f.lifecycle.trackLease(second),error=>error===f.lifecycle.reason);assert.equal(rejectedReleases,1);
});

test('tracking the same lease again is idempotent and does not unlock a closed gate',()=>{
 const f=fixture();assert.equal(f.lifecycle.trackLease(f.lease),f.lease);assert.equal(f.lifecycle.trackLease(f.lease),f.lease);
 f.lifecycle.trackGame(f.game);assert.equal(f.game.save(),false);assert.equal(f.events.length,0);
 f.lifecycle.enableWrites();assert.equal(f.lifecycle.trackLease(f.lease),f.lease);assert.equal(f.game.save(),true);
 f.lifecycle.stop(new Error('finished'));assert.equal(f.events.filter(x=>x==='release').length,1);
});
