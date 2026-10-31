// Owns one browser-world boot. Application/bootstrap code must call checkpoint
// after asynchronous work, before it enables gameplay or a durable writer.
export function createBrowserWorldLifecycle({window=globalThis.window,getGame=()=>window?.game,reportCleanupError=()=>{},AbortController:AbortControllerClass=globalThis.AbortController}={}){
 const controller=new AbortControllerClass();
 let stopped=false,ready=false,writesEnabled=false,hidden=false,reloadRequested=false,abortRequested=false,reason=null,lease=null;
 const leases=new Set(),packs=new Set(),released=new Set(),disposed=new Set(),games=new Map(),paused=new Set(),disposedPhysics=new Set();
 const cancellation=()=>Object.assign(new Error('页面已离开，日出启动已取消'),{name:'AbortError',code:'BROWSER_WORLD_CANCELLED'});
 const report=error=>{try{reportCleanupError(error);}catch{}};
 const cleanup=(item,method,done)=>{
  if(!item||done.has(item))return;done.add(item);
  try{const result=item[method]?.();if(result&&typeof result.then==='function')Promise.resolve(result).catch(report);}catch(error){report(error);}
 };
 const currentGame=()=>{try{return getGame();}catch(error){report(error);return null;}};
 const pause=game=>{
  if(!game)return;
  try{game.paused=true;}catch(error){report(error);}
  if(!paused.has(game)){paused.add(game);try{game.resetControls?.();}catch(error){report(error);}}
 };
 const installGuard=game=>{
  if(!game||games.has(game))return game;
  let writer=game.save;const wrappers=new Map();
  const wrapped=fn=>{
   if(typeof fn!=='function')return()=>false;
   if(!wrappers.has(fn))wrappers.set(fn,function(...args){if(!canWrite())return false;return Reflect.apply(fn,game,args);});
   return wrappers.get(fn);
  };
  // Each getter captures the current writer. A runtime can retain the previous
  // save and install a new wrapper without the old guard recursing into it.
  Object.defineProperty(game,'save',{configurable:true,enumerable:true,get:()=>wrapped(writer),set:value=>{writer=value;}});
  games.set(game,true);return game;
 };
 const stop=error=>{
  if(!stopped){stopped=true;ready=false;reason=error&&(typeof error==='object'||typeof error==='function')?error:new Error(String(error??'日出启动已停止'));}
  writesEnabled=false;
  const game=currentGame();
  if(game){try{installGuard(game);}catch(error){report(error);}pause(game);}
  for(const known of games.keys()){pause(known);cleanup(known.physics,'dispose',disposedPhysics);}
  if(game)cleanup(game.physics,'dispose',disposedPhysics);
  // Abort pending acquisition only after disabling writers and controls. Abort
  // listeners may synchronously reenter stop or resource cleanup.
  if(!abortRequested){abortRequested=true;try{controller.abort(reason);}catch(error){report(error);}}
  // Writers stay disabled before releasing ownership, even if cleanup throws.
  for(const item of leases)cleanup(item,'release',released);
  for(const item of packs)cleanup(item,'dispose',disposed);
  return reason;
 };
 const hasLock=()=>{
  try{return typeof lease?.ownsLock==='function'&&lease.ownsLock()===true;}catch(error){stop(error);return false;}
 };
 const physicsFailed=()=>{const game=currentGame();if(game?.physics?.failed||game?.physicsTransactions?.failed){stop(game.physics?.error??game.physicsTransactions?.error??new Error('物理运行已失败，已停止写入'));return true;}return false;};
 function canWrite(){
  if(stopped||physicsFailed()||!writesEnabled)return false;
  if(!lease)return false;
  if(!hasLock()){if(!stopped)stop(new Error('独立存档锁已失效，已停止写入'));return false;}
  return true;
 }
 const checkpoint=()=>{
  if(!stopped)physicsFailed();
  if(stopped){stop(reason);throw reason;}
  if(lease&&!hasLock()){if(!stopped)stop(new Error('独立存档锁已失效，已停止启动'));throw reason;}
  return true;
 };
 const trackLease=value=>{
  if(!value||typeof value.ownsLock!=='function'||typeof value.release!=='function')throw Error('独立存档锁缺少生命周期合同');
  leases.add(value);
  if(stopped){cleanup(value,'release',released);checkpoint();}
  if(lease&&value!==lease){
   // One boot cannot borrow a second slot's lock to authorize its old writer.
   writesEnabled=false;ready=false;cleanup(value,'release',released);
   stop(new Error('同一次启动不能切换独立存档锁'));throw reason;
  }
  lease=value;
  checkpoint();return value;
 };
 const trackPack=value=>{
  if(!value||typeof value!=='object')throw Error('道路材质包缺少生命周期合同');
  packs.add(value);
  if(stopped){cleanup(value,'dispose',disposed);checkpoint();}
  checkpoint();return value;
 };
 const trackGame=value=>{
  if(!value||typeof value!=='object')throw Error('游戏实例缺少生命周期合同');
  try{installGuard(value);}catch(error){stop(error);throw reason;}
  if(stopped)pause(value);checkpoint();return value;
 };
 const protectedGame=()=>{
  checkpoint();if(!lease)throw Error('尚未取得独立存档锁');
  const game=currentGame();if(!game)throw Error('游戏实例未成功创建');
  if(!games.has(game))throw Error('游戏存档保护尚未安装');return game;
 };
 const enableWrites=()=>{const game=protectedGame();writesEnabled=true;return game;};
 const markReady=()=>{
  const game=protectedGame();if(!writesEnabled)throw Error('存档写入尚未启用');ready=true;return game;
 };
 window?.addEventListener('pagehide',()=>{hidden=true;stop(cancellation());},{once:true});
 window?.addEventListener('pageshow',event=>{
  if(!event.persisted||!hidden||reloadRequested)return;
  reloadRequested=true;try{window.location.reload();}catch(error){report(error);}
 });
 return{trackLease,trackPack,trackGame,checkpoint,enableWrites,markReady,stop,fail:stop,signal:controller.signal,
  get stopped(){return stopped;},get isReady(){return ready;},get writesEnabled(){return writesEnabled;},get hidden(){return hidden;},get reason(){return reason;}};
}
