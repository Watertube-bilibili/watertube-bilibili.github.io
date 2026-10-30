// Local, per-page diagnostics only. No uploads, extra requests or stored data.
export function createStartupDiagnostics({now=()=>performance.now(),resources=()=>performance.getEntriesByType('resource')}={}){
 const started=now(),state={startedAt:started,events:[],phase:'preparing',loaded:0,total:0,cache:'unknown',failed:false};
 const record=(phase,detail={})=>{state.phase=phase;Object.assign(state,detail);state.events.push({phase,elapsedMs:Math.round(now()-started),...detail});};
 const progress=(loaded,total)=>{state.loaded=loaded;state.total=total;};
 const cache=()=>{const entries=resources().filter(e=>/\/neon-physics\.wasm\.gz(?:\?|$)/.test(e.name));const entry=entries.at(-1);if(!entry)return;state.resource={name:entry.name,transferSize:entry.transferSize,encodedBodySize:entry.encodedBodySize,decodedBodySize:entry.decodedBodySize,durationMs:Math.round(entry.duration),responseStartMs:Math.round(entry.responseStart-entry.startTime)};state.cache=entry.transferSize>0?'network-or-revalidated':entry.encodedBodySize>0?'local-cache':'unknown';};
 const label=()=>{const elapsed=Math.floor((now()-started)/1000),received=state.total>0?Math.min(100,Math.floor(state.loaded/state.total*100))+'%':(state.loaded/1048576).toFixed(1)+' MB';
  const phase=state.phase==='body-complete'?'数据已接收，正在完成编译':state.phase==='compiled'||state.phase==='runtime-ready'?'正在初始化':state.phase==='bridge-wait'?'正在连接场景':state.phase==='fetch-start'?'正在连接下载':state.phase==='manifest'||state.phase==='script'?'正在准备引擎':'正在下载 / 解压';
  return 'Godot · '+phase+(phase==='正在下载 / 解压'?' '+received:'')+' · '+elapsed+'秒';};
 return {state,record,progress,cache,label};
}
