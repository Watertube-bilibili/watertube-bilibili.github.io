import assets from './engine/assets.mjs';
const CACHE='ridgebound-assets-v1';
const root=new URL('./engine/',import.meta.url);
const MB=n=>(n/1e6).toFixed(1);
const now=()=>performance.now();
const assetURL=name=>new URL(name,root).href;
export const bootStats={transport:'',cacheHit:false,downloadBytes:0,compressedBytes:assets.wasm.compressedBytes,rawBytes:assets.wasm.bytes,startedAt:now(),downloadMs:0,decodeMs:0,readyMs:0};
async function digest(buffer){const bytes=await crypto.subtle.digest('SHA-256',buffer);return Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,'0')).join('');}
async function valid(buffer,hash){return crypto?.subtle?(await digest(buffer))===hash:true;}
async function readResponse(response,expected,onProgress){
 if(!response.ok)throw new Error('资源下载失败 '+response.status);
 const reader=response.body?.getReader();
 if(!reader){const buffer=await response.arrayBuffer();onProgress(buffer.byteLength,expected);return buffer;}
 const parts=[];let length=0;
 while(true){const {done,value}=await reader.read();if(done)break;parts.push(value);length+=value.byteLength;onProgress(length,expected);}
 const bytes=new Uint8Array(length);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}return bytes.buffer;
}
async function openCache(){try{return await caches.open(CACHE);}catch{return null;}}
async function download(name,size,hash,onProgress,{cacheable=true}={}){
 const url=assetURL(name),cache=cacheable?await openCache():null;
 if(cache){try{const hit=await cache.match(url);if(hit){const buffer=await hit.arrayBuffer();if(buffer.byteLength===size&&await valid(buffer,hash)){onProgress(size,size,true);return{buffer,cached:true};}await cache.delete(url);}}catch{/* Storage access is optional. */}}
 const response=await fetch(url,{cache:'default'});const buffer=await readResponse(response,size,(n,total)=>onProgress(n,total,false));
 if(buffer.byteLength!==size||!await valid(buffer,hash))throw new Error('下载资源不完整，请重新载入');
 if(cache){cache.put(url,new Response(buffer,{headers:{'Content-Type':'application/octet-stream'}})).catch(()=>{});}
 return{buffer,cached:false};
}
async function loadWasm(report){
 const started=now();let data;
 const progress=(n,total,cached)=>{bootStats.cacheHit=!!cached;bootStats.downloadBytes=cached?0:n;report(cached?'正在读取已缓存的引擎…':`首次下载 · ${MB(n)} / ${MB(total)} MB`);};
 if(typeof DecompressionStream==='function'){
  try{
   const packed=await download(assets.wasm.url,assets.wasm.compressedBytes,assets.wasm.compressedSha256,progress);
   bootStats.downloadMs=now()-started;bootStats.transport='gzip';report('引擎下载完成，正在解压…');const decode=now();
   data=await new Response(new Blob([packed.buffer]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
   if(data.byteLength!==assets.wasm.bytes||!await valid(data,assets.wasm.sha256))throw new Error('引擎校验失败');
   bootStats.decodeMs=now()-decode;
  }catch(error){data=null;console.warn('压缩引擎暂不可用，尝试标准版本',error.message);report('正在使用兼容加载方式…');}
 }
 if(!data){
  bootStats.transport='raw';const result=await download(assets.wasm.raw,assets.wasm.bytes,assets.wasm.sha256,progress,{cacheable:false});data=result.buffer;bootStats.downloadMs=now()-started;
 }
 return new Response(data,{headers:{'Content-Type':'application/wasm'}});
}
function loadScript(){return new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=assetURL(assets.loader.url)+'?v='+assets.loader.sha256.slice(0,16);el.onload=resolve;el.onerror=()=>reject(new Error('引擎脚本未能载入'));document.head.append(el);});}
export async function bootEngine({canvas,report=()=>{},onError=console.error}){
 // Fetch script, game pack and compact engine in parallel; no service-worker activation wait.
 const [wasm,pack]=await Promise.all([loadWasm(report),download(assets.pack.url,assets.pack.bytes,assets.pack.sha256,()=>{}),loadScript()]);
 if(typeof window.Engine?.loadFromResponse!=='function')throw new Error('启动器版本不匹配，请刷新页面');
 const base=new URL('ridgebound',root).href;
 await window.Engine.loadFromResponse(base,wasm);
 report('正在启动引擎与车辆…');
 const engine=new window.Engine({executable:base,canvas,canvasResizePolicy:2,focusCanvasOnStart:false,experimentalVK:false,onPrintError:onError});
 await engine.preloadFile(pack.buffer,'ridgebound.pck');
 await engine.start({args:['--main-pack','ridgebound.pck']});
 return engine;
}
