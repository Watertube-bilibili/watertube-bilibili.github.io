// Complete original-city Game startup. No map replacement or silent backend fallback.
export async function startCityPhysics(game){
 try{
  if(game.citySession?.stopped)throw Error('候选存档会话已关闭');
  await game.physics.start();
  if(game.citySession?.stopped||game.physics.failed||!game.physics.ready)throw game.physics.error??Error('Rapier 未建立原城市物理世界');
  document.documentElement.dataset.physicsBackend=game.physics.backendId;
  const loading=document.getElementById('loading');loading.style.opacity='0';
  setTimeout(()=>{if(!game.citySession?.stopped)loading.hidden=true;},650);
  return game.physics;
 }catch(error){failCityPhysics(game,error);throw error;}
}
export function failCityPhysics(game,error){
 if(game.cityFailed)return;
 game.cityFailed=true;game.paused=true;
 if(game.physics){game.physics.failed=true;game.physics.ready=false;game.physics.error=error;}
 game.citySession?.stop(error);
 game.physicsTransactions?.rollback(error);
 const loading=document.getElementById('loading'),label=document.getElementById('load-text');
 if(loading){loading.hidden=false;loading.style.opacity='1';loading.classList.add('load-failed');loading.setAttribute('role','alert');}
 if(label)label.textContent='原城市 Rapier 迁移候选已停止：'+String(error?.message??error)+'。原槽与初始副本保留；请刷新恢复最近成功存档。';
}
