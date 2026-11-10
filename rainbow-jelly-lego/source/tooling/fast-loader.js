// TOY FAST LOADER START
// The engine payload is immutable. Race its two routes, then stop the loser.
(()=>{
 const nativeFetch=window.fetch.bind(window),WASM_URL=new URL('index.wasm',document.baseURI);
 const HASH='9352825a316f4449b81d326706e78be95ed5a81c0e797f35879ef8b39bc505bd';
 const CDN='https://cdn.jsdelivr.net/gh/Watertube-bilibili/watertube-bilibili.github.io@9999f5e997852c78230dc964715ab1253bdf588f/rainbow-jelly-lego/index.wasm.gz';
 const TOTAL=9382282,RAW_TOTAL=37700666,FIRST_TIMEOUT=8000,IDLE_TIMEOUT=7000;
 const CACHE_NAME='rainbow-jelly-engine-'+HASH,CACHE_KEY=new URL('engine-cache/'+HASH+'.wasm.gz',WASM_URL).href;
 const clock=()=>performance.now();
 const abortError=()=>new DOMException('Download cancelled','AbortError');
 const status=window.toyDownload={received:0,total:TOTAL,speed:0,source:'',cached:false,done:false};
 if(typeof DecompressionStream!=='function'){status.source='raw';return;}
 function bounded(promise,delay,onTimeout){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>{try{onTimeout?.();}catch(_){}reject(new Error('Download route timed out'));},delay);})]).finally(()=>clearTimeout(timer));}
 async function cacheLookup(){try{const storage=window.caches;if(!storage)return null;const cache=await storage.open(CACHE_NAME),response=await cache.match(CACHE_KEY);if(!response||!response.body)return null;return {cache,response};}catch(_){return null;}}
 async function saveCache(chunks,size,decoded){if(decoded||size!==TOTAL)return;try{const storage=window.caches;if(!storage)return;const bytes=new Uint8Array(size);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.byteLength;}if(!window.crypto?.subtle)return;const digest=await window.crypto.subtle.digest('SHA-256',bytes),hex=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');if(hex!==HASH)return;const cache=await storage.open(CACHE_NAME);await cache.put(CACHE_KEY,new Response(bytes,{headers:{'Content-Type':'application/gzip','Content-Length':String(TOTAL)}}));}catch(_){} }
 function stop(candidate){if(!candidate)return;try{candidate.controller?.abort();}catch(_){}try{const p=candidate.reader?.cancel();p?.catch(()=>{});}catch(_){}candidate.cleanup?.();}
 async function candidate(url,source,signal,offset=0){
  const controller=new AbortController(),item={source,url,controller,reader:null,first:null,decoded:false,cleanup:null};
  const relay=()=>controller.abort();if(signal){if(signal.aborted)throw abortError();signal.addEventListener('abort',relay,{once:true});item.cleanup=()=>signal.removeEventListener('abort',relay);}
  try{return await bounded((async()=>{
   const options={signal:controller.signal,credentials:'omit',mode:'cors'};if(offset)options.headers={Range:'bytes='+offset+'-'};
   let response=await nativeFetch(url,options);if(!response.ok||!response.body)throw new Error('Download route unavailable');
   if(offset&&response.status===206){const header=response.headers.get('Content-Range');if(header){const range=/^bytes (\d+)-(\d+)\/(\d+)$/.exec(header);if(!range||Number(range[1])!==offset||Number(range[3])!==TOTAL)throw new Error('Invalid engine resume range');}else{response.body.cancel().catch(()=>{});delete options.headers;response=await nativeFetch(url,options);if(!response.ok||!response.body||response.status===206)throw new Error('Engine resume unavailable');}}
   item.decoded=/\bgzip\b/i.test(response.headers.get('Content-Encoding')||'');item.reader=response.body.getReader();
   // A route which ignored Range can still recover by discarding the identical prefix.
   let skip=offset&&response.status!==206?offset:0;
   if(offset&&item.decoded)throw new Error('Cannot resume a transport-decoded route');
   while(true){const part=await item.reader.read();if(part.done)throw new Error('Empty or truncated engine route');let bytes=part.value;if(skip){const discarded=Math.min(skip,bytes.byteLength);skip-=discarded;bytes=bytes.subarray(discarded);}if(bytes.byteLength){item.first=bytes;break;}}
   return item;
  })(),FIRST_TIMEOUT,()=>controller.abort());}catch(error){stop(item);throw error;}
 }
 window.fetch=async function(input,init){
  let url;try{url=new URL(typeof input==='string'||input instanceof URL?input:input.url,document.baseURI);}catch(_){return nativeFetch(input,init);}
  const method=(init&&init.method)||(input instanceof Request&&input.method)||'GET';
  if(method!=='GET'||url.origin!==WASM_URL.origin||url.pathname!==WASM_URL.pathname)return nativeFetch(input,init);
  const signal=init?.signal||(input instanceof Request?input.signal:null);if(signal?.aborted)throw abortError();
  const origin=new URL(url);origin.pathname+='.gz';const started=clock();Object.assign(status,{received:0,total:TOTAL,speed:0,source:'',cached:false,done:false});
  let active=null,usedSource='',cached=false,decoded=false,cacheChunks=[],received=0;
  const cachedEntry=await bounded(cacheLookup(),180).catch(()=>null);
  if(signal?.aborted)throw abortError();
  if(cachedEntry){active={source:'cache',reader:cachedEntry.response.body.getReader(),first:null,decoded:false};cached=true;}
  else{
   const routes=[{url:CDN,source:'cdn'},{url:origin.href,source:'origin'}],controllers=routes.map(()=>new AbortController());
   const relay=()=>controllers.forEach(c=>c.abort());if(signal)signal.addEventListener('abort',relay,{once:true});
   const opened=[];let selected=-1;
   const attempts=routes.map((route,index)=>candidate(route.url,route.source,controllers[index].signal).then(item=>{opened[index]=item;if(selected>=0&&selected!==index)stop(item);return {item,index};}));
   try{const winner=await Promise.any(attempts);selected=winner.index;active=winner.item;for(let n=0;n<controllers.length;n++)if(n!==selected){controllers[n].abort();stop(opened[n]);}}
   catch(error){if(signal?.aborted)throw abortError();status.source='failed';throw new Error('游戏引擎下载失败，请检查网络后重试。');}
   finally{if(signal){if(active){const cleanup=active.cleanup;active.cleanup=()=>{cleanup?.();signal.removeEventListener('abort',relay);};}else signal.removeEventListener('abort',relay);}}
  }
  usedSource=active.source;decoded=active.decoded;Object.assign(status,{source:active.source,cached});
  function update(chunk){received+=chunk.byteLength;if(!cached&&!decoded)cacheChunks.push(chunk);status.received=Math.min(TOTAL,decoded?Math.round(received*TOTAL/RAW_TOTAL):received);status.speed=status.received/Math.max(.001,(clock()-started)/1000);}
  async function recover(){
   if(cached){try{const storage=window.caches;if(storage){const cache=await storage.open(CACHE_NAME);await cache.delete(CACHE_KEY);}}catch(_){}throw new Error('Cached engine stream could not be read');}
   if(decoded||usedSource==='retried')throw new Error('Engine download interrupted');
   const previous=active.source;stop(active);active=await candidate(previous==='cdn'?origin.href:CDN,previous==='cdn'?'origin':'cdn',signal,received);usedSource='retried';if(active.decoded)throw new Error('Resume encoding changed');Object.assign(status,{source:active.source,cached:false});
  }
  const compressed=new ReadableStream({
   async pull(controller){try{
    if(signal?.aborted)throw abortError();let part;
    if(active.first){part={done:false,value:active.first};active.first=null;}
    else{try{part=await bounded(active.reader.read(),IDLE_TIMEOUT,()=>active.controller?.abort());}catch(error){if(signal?.aborted)throw abortError();await recover();part={done:false,value:active.first};active.first=null;}}
    if(part.done&&!decoded&&received!==TOTAL&&!cached&&usedSource!=='retried'){await recover();part={done:false,value:active.first};active.first=null;}
    if(part.done){if((!decoded&&received!==TOTAL)||(decoded&&received!==RAW_TOTAL))throw new Error('Engine download incomplete');Object.assign(status,{received:TOTAL,done:true});active.cleanup?.();controller.close();if(!cached)saveCache(cacheChunks,received,decoded);cacheChunks=[];}
    else{update(part.value);controller.enqueue(part.value);}
   }catch(error){stop(active);cacheChunks=[];controller.error(error);}},
   cancel(){stop(active);cacheChunks=[];}
  });
  const body=decoded?compressed:compressed.pipeThrough(new DecompressionStream('gzip'));
  return new Response(body,{headers:{'Content-Type':'application/wasm'}});
 };
})();
// TOY FAST LOADER END
