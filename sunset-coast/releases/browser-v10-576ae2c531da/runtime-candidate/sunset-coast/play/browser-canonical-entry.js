import {browserWorldRequest} from './browser-world-policy.js';
export function canonicalBrowserRoute(search,hostname=''){
 const p=new URLSearchParams(search);
 try{const request=browserWorldRequest(search);if(request)return {kind:'world',request};}catch(error){return {kind:'chooser',reason:error.message};}
 // Local compatibility testing is still browser-only. No new-tree URL may
 // accidentally reach the native default branch from the recovered source.
 return {kind:'chooser',reason:'请从日出地图页选择独立进度；旧书签不会自动迁移存档'};
}
export async function startCanonicalBrowserEntry({location=globalThis.location,document=globalThis.document,load=()=>import('./candidate-entry.js')}={}){
 const route=canonicalBrowserRoute(location.search,location.hostname);
 if(route.kind==='chooser'){location.replace(new URL('../browser-worlds.html',location.href).href);return route;}
 try{await load();}catch(e){const label=document.getElementById('load-text');if(label)label.textContent='日出启动停止：'+e.message+'；已停止后续写入，不会重建或清空原进度。';throw e;}return route;
}
if(typeof window!=='undefined'&&typeof document!=='undefined')await startCanonicalBrowserEntry();
