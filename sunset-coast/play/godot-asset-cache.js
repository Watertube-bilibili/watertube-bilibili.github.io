// Content-addressed engine bytes only. No saves, credentials, service worker or uploads.
export function createGodotAssetCache(manifest,{baseURL=new URL('./physics/',globalThis.location?.href??import.meta.url).href,storage,crypto=globalThis.crypto,fetch:network=globalThis.fetch,timeoutMs=200,maxEntries=6}={}){
 const inflight=new Map(),writes=new Set(),stats={hits:0,misses:0,network:0,corrupt:0,unavailable:0,writes:0};
 const entries=new Map();
 for(const name of ['neon-physics.wasm.gz','neon-physics.pck']){
  const item=manifest.files?.[name];if(item&&/^[a-f0-9]{64}$/.test(item.sha256)&&Number.isSafeInteger(item.bytes)&&item.bytes>0)entries.set(new URL(name,baseURL).href,{...item,name});
 }
 const bounded=async promise=>{let timer;try{return await Promise.race([promise,new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('cache unavailable')),timeoutMs))]);}finally{clearTimeout(timer)}};
 let opened;
 const open=()=>opened??=(async()=>{try{const store=storage===undefined?globalThis.caches:storage;if(!store||!crypto?.subtle)return null;return await bounded(store.open('neon-physics-verified-v1'));}catch{stats.unavailable++;return null;}})();
 const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
 const valid=async(response,item)=>{const bytes=await response.arrayBuffer();return bytes.byteLength===item.bytes&&await digest(bytes)===item.sha256?bytes:null;};
 const cacheKey=item=>new URL('__neon_engine_cache__/'+item.sha256+'/'+item.name,baseURL).href;
 async function load(url,options,item){
  const cache=await open(),key=cacheKey(item);
  if(cache){try{const stored=await bounded(cache.match(key));if(stored){const bytes=await valid(stored,item);if(bytes){stats.hits++;return new Response(bytes,{headers:{'Content-Type':item.name.endsWith('.gz')?'application/gzip':'application/octet-stream'}});}stats.corrupt++;await bounded(cache.delete(key));}}catch{stats.unavailable++;}}
  stats.misses++;stats.network++;
  // A fresh manifest must not stream an older HTTP-cached pack into Godot.
  // CacheStorage already keys by content; version only the PCK network URL too.
  const networkURL=new URL(url);if(item.name==='neon-physics.pck')networkURL.searchParams.set('v',item.sha256);
  const response=await network(networkURL.href,options);if(!response.ok||!cache)return response;
  // Start the caller's original streaming path immediately. A second stream verifies
  // compressed bytes before committing; slow/denied storage never gates gameplay.
  const reusable=response.clone();
  const saving=(async()=>{try{const bytes=await valid(response,item);if(!bytes)return;await bounded(cache.put(key,new Response(bytes,{headers:{'Content-Type':item.name.endsWith('.gz')?'application/gzip':'application/octet-stream'}})));stats.writes++;
   const keys=await cache.keys();for(const old of keys.slice(0,Math.max(0,keys.length-maxEntries)))await cache.delete(old);
  }catch{stats.unavailable++;}})();
  writes.add(saving);saving.finally(()=>writes.delete(saving));return reusable;
 }
 function fetchAsset(input,options){
  const url=new URL(String(input),new URL('../',baseURL)).href,item=entries.get(url);if(!item)return network(input,options);
  // Keep an unread branch for concurrent consumers until persistence finishes.
  // Every caller receives its own stream; downloaded bytes are never fetched twice.
  if(!inflight.has(url)){
   const request=load(url,options,item);inflight.set(url,request);
   request.then(async response=>{await Promise.allSettled([...writes]);inflight.delete(url);response.body?.cancel().catch(()=>{});},()=>inflight.delete(url));
  }
  return inflight.get(url).then(response=>response.clone());
 }
 return {fetch:fetchAsset,stats,settled:()=>Promise.allSettled([...writes])};
}
