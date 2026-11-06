import {CITY_PREFIX,parseCitySlot,readCitySlot,createCitySession} from './city-save-store.js';

export const cityHomeURL=(moduleURL=import.meta.url)=>new URL('../../',moduleURL).href;

export async function startCityRuntime({window,document,storage=window.localStorage,locks=window.navigator?.locks,validateSave,loadGame}={}){
 const loading=document.getElementById('loading'),label=document.getElementById('load-text');
 const showFailure=error=>{if(loading){loading.hidden=false;loading.style.opacity='1';}if(label)label.textContent='Rapier 启动已停止：'+String(error?.message??error)+'。原存档未修改。';};
 let slot;try{slot=parseCitySlot(window.location.search);}catch(error){showFailure(error);return {blocked:true,error};}
 if(!locks?.request){const error=Error('安全存档锁不可用');showFailure(error);return {blocked:true,error};}
 let session=null,released=false,release,game=null;const disposed=new WeakSet();
 const done=new Promise(resolve=>release=resolve);
 const stop=error=>{
  const first=!released;released=true;if(first)session?.stop(error);
  // Import can create a game after pagehide. Cleanup still runs on a second
  // stop, while lease release and each backend disposal remain one-shot.
  game=window.game??game;if(game){game.paused=true;try{game.resetControls?.();}catch{}const physics=game.physics;if(physics&&!disposed.has(physics)){disposed.add(physics);try{physics.dispose?.();}catch{}}}
  if(first)release();
 };
 window.addEventListener('pagehide',()=>stop(Error('页面已离开，进度写入已停止')),{once:true});
 window.addEventListener('pageshow',event=>{if(event.persisted&&released)window.location.replace(window.location.href);});
 try{return await locks.request(CITY_PREFIX+':play:'+slot,{ifAvailable:true},async lock=>{
  if(!lock){const error=Error('这个 Rapier 进度正在其他标签页运行');showFailure(error);return {blocked:true,error};}
  try{
   const entry=await readCitySlot(storage,slot,validateSave);if(released)return {cancelled:true};
   session=createCitySession({storage,entry,validateSave,ownsLock:()=>!released,onStop:stop});window.__sunriseCitySession=session;
   // Every imported legacy module resolves localStorage through this window.
   // Keep the stopped facade installed: late async callbacks must never regain
   // access to original keys after a failed boot or pagehide.
   Object.defineProperty(window,'localStorage',{configurable:true,get:()=>session.storage});
   await loadGame();game=window.game;if(!game)throw Error('游戏实例未创建');
   if(game.physicsReady)await game.physicsReady;
   if(released){stop(Error('Rapier 启动已取消'));return {cancelled:true};}
   if(game.physics?.failed||!game.physics?.ready)throw game.physics?.error??Error('物理后端未就绪');
   // Game.load already restores the full ledger and opaque saved fields.
   // Repeating it here could erase actions performed while startup was pending.
   session.markReady(game);game.paused=false;
   document.documentElement.dataset.betaUiReady='2';
   const home=document.createElement('a');home.href=cityHomeURL();home.textContent='SUNRISE COAST · 存档管理';home.className='beta-save-home';document.body.append(home);
   await done;return {released:true};
  }catch(error){stop(error);showFailure(error);return {blocked:true,error};}
 });}catch(error){stop(error);showFailure(error);return {blocked:true,error};}
}
if(typeof window!=='undefined'){
 const storage=window.localStorage;
 try{const {validateSave}=await import('./save-validation.js');startCityRuntime({window,document,storage,validateSave,loadGame:()=>import('./mobile-ui.js')});}
 catch(error){const label=document.getElementById('load-text');if(label)label.textContent='Rapier 启动失败：'+error.message+'。原存档未修改。';}
}
