// Read the complete response through the native fetch path before parsing.
// The authored manifest, rather than transfer headers, is the integrity source.
export const MOTORCYCLE_LOAD_TIMEOUT_MS=30000;
// A rejected deadline races the entire operation, even if a browser API ignores
// AbortSignal. Checks after awaits also prevent its late result from publishing.
// Timers cannot interrupt synchronous parsing; elapsed-time checks reject its
// result once control returns. The first caller owns a shared load's options.
export function withMotorcycleLoadDeadline(task,{signal,timeoutMs=MOTORCYCLE_LOAD_TIMEOUT_MS}={}){
 return new Promise((resolve,reject)=>{
  if(!Number.isFinite(timeoutMs)||timeoutMs<=0||timeoutMs>MOTORCYCLE_LOAD_TIMEOUT_MS){reject(new RangeError('Motorcycle load timeout must be between 0 and 30000 ms'));return;}
  if(signal!==undefined&&(!signal||typeof signal.addEventListener!=='function'||typeof signal.removeEventListener!=='function')){reject(new TypeError('Motorcycle load requires an AbortSignal'));return;}
  const controller=new AbortController(),deadline=performance.now()+timeoutMs;
  const timeoutError=()=>new DOMException('Motorcycle load timed out','TimeoutError');
  let settled=false,timer;
  const cleanup=()=>{clearTimeout(timer);signal?.removeEventListener('abort',onAbort);};
  const fail=error=>{if(settled)return;settled=true;cleanup();controller.abort(error);reject(error);};
  const onAbort=()=>fail(signal.reason);
  const check=()=>{
   if(controller.signal.aborted)throw controller.signal.reason;
   if(signal?.aborted){fail(signal.reason);throw signal.reason;}
   if(performance.now()>=deadline){const error=timeoutError();fail(error);throw error;}
  };
  if(signal?.aborted){fail(signal.reason);return;}
  signal?.addEventListener('abort',onAbort,{once:true});
  timer=setTimeout(()=>fail(timeoutError()),timeoutMs);
  Promise.resolve().then(()=>{check();return task({signal:controller.signal,check});}).then(value=>{
   try{check();if(settled)return;settled=true;cleanup();resolve(value);}catch(error){fail(error);}
  },fail);
 });
}
export function downloadMotorcycleGlb(url,manifest,onProgress,options){
 const total=manifest?.glb_bytes,expected=manifest?.sha256;
 let operation;
 return withMotorcycleLoadDeadline(async scope=>{
 operation=scope;
 if(!Number.isSafeInteger(total)||total<=0||typeof expected!=='string'||!/^[a-f0-9]{64}$/.test(expected))throw Error('Invalid motorcycle download manifest');
 onProgress?.({lengthComputable:true,loaded:0,total});
 scope.check();
 const response=await fetch(url,{signal:scope.signal});scope.check();
 if(!response.ok)throw Error('Motorcycle download HTTP '+response.status);
 const buffer=await response.arrayBuffer();scope.check();
 if(buffer.byteLength!==total)throw Error('Motorcycle download byte length mismatch');
 if(!globalThis.crypto?.subtle)throw Error('Motorcycle SHA-256 verification unavailable');
 const digest=await globalThis.crypto.subtle.digest('SHA-256',buffer);scope.check();
 const actual=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
 if(actual!==expected)throw Error('Motorcycle download SHA-256 mismatch');
 return buffer;
 },options).then(buffer=>{
 operation.check();
 // Full-buffer reads expose no intermediate byte progress. Completion here
 // means verified download bytes; GLTF parsing still happens in the caller.
 onProgress?.({lengthComputable:true,loaded:total,total});
 operation.check();
 return buffer;
 });
}
