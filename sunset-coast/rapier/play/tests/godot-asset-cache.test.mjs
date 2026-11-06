import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {createGodotAssetCache} from '../godot-asset-cache.js';
const baseURL='https://example.test/sunset-coast/play/physics/';
const info=value=>({bytes:Buffer.byteLength(value),sha256:createHash('sha256').update(value).digest('hex')});
function memoryStorage(){const entries=new Map();return{entries,async open(){return{async match(key){return entries.get(key)?.clone();},async put(key,response){entries.set(key,response.clone());},async delete(key){return entries.delete(key);},async keys(){return[...entries.keys()];}};}};}
const manifest=(pck,wasm='wasm')=>({files:{'neon-physics.pck':info(pck),'neon-physics.wasm.gz':info(wasm)}});
test('new manifest bypasses stale raw-URL HTTP PCK and old CacheStorage bytes',async()=>{
 const old='old pack',fresh='combined roll pack',storage=memoryStorage(),requests=[];
 const network=async(url,options)=>{requests.push({url,options});const version=new URL(url).searchParams.get('v');return new Response(version===info(fresh).sha256?fresh:old);};
 const initial=createGodotAssetCache(manifest(old),{baseURL,storage,crypto:webcrypto,fetch:network});
 assert.equal(await(await initial.fetch('./physics/neon-physics.pck')).text(),old);await initial.settled();
 const current=createGodotAssetCache(manifest(fresh),{baseURL,storage,crypto:webcrypto,fetch:network});
 const options={credentials:'same-origin'};
 assert.equal(await(await current.fetch('./physics/neon-physics.pck',options)).text(),fresh);await current.settled();
 assert.equal(requests.length,2);assert.equal(requests[1].url,baseURL+'neon-physics.pck?v='+info(fresh).sha256);assert.equal(requests[1].options,options);
 assert.ok([...storage.entries.keys()].some(key=>key.includes(info(old).sha256)));assert.ok([...storage.entries.keys()].some(key=>key.includes(info(fresh).sha256)));
});
test('verified current CacheStorage hit still avoids all network requests',async()=>{
 const bytes='pack',storage=memoryStorage();let calls=0;
 const options={baseURL,storage,crypto:webcrypto,fetch:async()=>{calls++;return new Response(bytes);}};
 const first=createGodotAssetCache(manifest(bytes),options);await(await first.fetch('./physics/neon-physics.pck')).arrayBuffer();await first.settled();
 const second=createGodotAssetCache(manifest(bytes),options);assert.equal(await(await second.fetch('./physics/neon-physics.pck')).text(),bytes);assert.equal(calls,1);assert.equal(second.stats.hits,1);
});
test('PCK request stays versioned when browser storage is unavailable',async()=>{
 const bytes='pack',requests=[],options={cache:'default'};
 const cache=createGodotAssetCache(manifest(bytes),{baseURL,storage:null,crypto:webcrypto,fetch:async(url,received)=>{requests.push([url,received]);return new Response(bytes);}});
 assert.equal(await(await cache.fetch('./physics/neon-physics.pck',options)).text(),bytes);assert.equal(requests[0][0],baseURL+'neon-physics.pck?v='+info(bytes).sha256);assert.equal(requests[0][1],options);
});
test('WASM transport and unrelated resource URLs remain unchanged',async()=>{
 const requests=[],cache=createGodotAssetCache(manifest('pack'),{baseURL,storage:null,crypto:webcrypto,fetch:async(url)=>{requests.push(url);return new Response('wasm');}});
 await(await cache.fetch('./physics/neon-physics.wasm.gz')).arrayBuffer();await(await cache.fetch('./other.js?existing=1')).arrayBuffer();
 assert.deepEqual(requests,[baseURL+'neon-physics.wasm.gz','./other.js?existing=1']);
});
test('a cached body that never resolves falls back to network without deleting it as corrupt',async()=>{
 const bytes='current pack',storage=memoryStorage(),key=baseURL+'__neon_engine_cache__/'+info(bytes).sha256+'/neon-physics.pck';
 let deleted=0,calls=0;
 const hanging={async open(){return{async match(){return{arrayBuffer:()=>new Promise(()=>{})};},async put(k,response){storage.entries.set(k,response);},async delete(){deleted++;},async keys(){return[];}};}};
 const cache=createGodotAssetCache(manifest(bytes),{baseURL,storage:hanging,crypto:webcrypto,verifyTimeoutMs:15,fetch:async()=>{calls++;return new Response(bytes);}});
 assert.equal(await(await cache.fetch('./physics/neon-physics.pck')).text(),bytes);await cache.settled();
 assert.equal(calls,1);assert.equal(deleted,0);assert.equal(cache.stats.corrupt,0);assert.equal(cache.stats.unavailable,1);assert.equal(await storage.entries.get(key).text(),bytes);
});
test('late cache verification cannot evict the newer successfully verified network write',async()=>{
 const bytes='current pack';let complete,deleted=0,calls=0;const entries=new Map();
 const storage={async open(){return{async match(){return{arrayBuffer:()=>new Promise(r=>complete=r)};},async put(k,response){entries.set(k,response);},async delete(k){deleted++;entries.delete(k);},async keys(){return[...entries.keys()];}};}};
 const cache=createGodotAssetCache(manifest(bytes),{baseURL,storage,crypto:webcrypto,verifyTimeoutMs:15,fetch:async()=>{calls++;return new Response(bytes);}});
 assert.equal(await(await cache.fetch('./physics/neon-physics.pck')).text(),bytes);await cache.settled();
 complete(new TextEncoder().encode('bad').buffer);await new Promise(r=>setTimeout(r,10));
 assert.equal(calls,1);assert.equal(deleted,0);assert.equal(cache.stats.corrupt,0);assert.equal(entries.size,1);assert.equal(await[...entries.values()][0].text(),bytes);
});
test('stalled cache pruning does not keep asset completion waiting forever',async()=>{
 const bytes='pack';const storage={async open(){return{async match(){},async put(){},async keys(){return new Promise(()=>{});}};}};
 const cache=createGodotAssetCache(manifest(bytes),{baseURL,storage,crypto:webcrypto,timeoutMs:15,fetch:async()=>new Response(bytes)});
 assert.equal(await(await cache.fetch('./physics/neon-physics.pck')).text(),bytes);
 const completed=await Promise.race([cache.settled().then(()=>true),new Promise(r=>setTimeout(()=>r(false),300))]);
 assert.equal(completed,true);assert.equal(cache.stats.writes,1);assert.equal(cache.stats.unavailable,1);
});
test('digest verification remains mandatory: corrupt cached and downloaded bytes are never persisted',async()=>{
 const bytes='good',storage=memoryStorage(),key=baseURL+'__neon_engine_cache__/'+info(bytes).sha256+'/neon-physics.pck';storage.entries.set(key,new Response('evil'));
 const cache=createGodotAssetCache(manifest(bytes),{baseURL,storage,crypto:webcrypto,fetch:async()=>new Response('evil')});
 await(await cache.fetch('./physics/neon-physics.pck')).text();await cache.settled();
 assert.equal(cache.stats.corrupt,1);assert.equal(cache.stats.writes,0);assert.equal(storage.entries.size,0);
});
