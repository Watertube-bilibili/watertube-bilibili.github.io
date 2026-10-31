// Startup completion is awaited by the map host before it enables durable saves.
export async function startGamePhysics(game,{loading,loadText,installReleaseUI=()=>{}}={}){
 try{
  game.browserWorldLifecycle?.checkpoint();
  await game.physics.start();
  game.browserWorldLifecycle?.checkpoint();
  if(game.physics.failed||!game.physics.ready)throw game.physics.error??Error('物理后端未就绪');
  loading.style.opacity='0';
  setTimeout(()=>{try{game.browserWorldLifecycle?.checkpoint();}catch{return;}loading.hidden=true;},650);
  if(game.physics.capabilities?.native3D!==false&&game.physics.backendId!=='rapier'&&!/^rapier/i.test(game.physics.backend??''))installReleaseUI(game);
  return game.physics;
 }catch(error){
  game.physics.failed=true;game.physics.error=error;game.paused=true;
  game.rollbackPhysicsTransaction?.(error);
  game.browserWorldLifecycle?.fail(error);
  if(!game.browserWorldLifecycle?.hidden)showPhysicsFailure(game,error,{loading,loadText});
  throw error;
 }
}
export function showPhysicsFailure(game,error,{loading,loadText,document=globalThis.document,location=globalThis.location}={}){
 if(!loading||!loadText)return;
 loading.hidden=false;loading.style.opacity='1';loading.classList.add('load-failed');
 const name=game.physics?.backendId==='rapier'||/^rapier/i.test(game.physics?.backend??'')?'Rapier':'浏览器';
 loadText.textContent=name+' 物理启动失败：'+String(error?.message??error)+'。原存档保留，请刷新重试。';
 if(!loading.querySelector('[data-physics-retry]')){const button=document.createElement('button');button.dataset.physicsRetry='1';button.textContent='重新加载';button.onclick=()=>location.reload();loading.append(button);}
}
