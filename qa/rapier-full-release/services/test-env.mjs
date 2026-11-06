import {readFileSync} from 'node:fs';
const noop=()=>{},ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),measureText:()=>({width:100})},{get:(target,key)=>key in target?target[key]:noop});
globalThis.document={createElement:()=>({getContext:()=>ctx,toDataURL:()=>'',data:new Uint8Array(4),width:1,height:1})};
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
globalThis.ProgressEvent=class{constructor(type,event){this.type=type;Object.assign(this,event);}};
export const requests=[];
let responder=null;
export const respondWith=callback=>{responder=callback;};
const localFetch=globalThis.fetch;
globalThis.fetch=async input=>{
 const url=new URL(typeof input==='string'?input:input.url??input.href);if(url.protocol==='blob:')return localFetch(input);
 if(url.protocol!=='file:')throw Error('Network forbidden in motorcycle CPU tests: '+url.protocol);
 requests.push(url.href);const original=readFileSync(url),response=responder?.(url,original);
 return response??new Response(original,{headers:{'Content-Length':String(original.length)}});
};
