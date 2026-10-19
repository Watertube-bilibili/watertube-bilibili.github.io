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
