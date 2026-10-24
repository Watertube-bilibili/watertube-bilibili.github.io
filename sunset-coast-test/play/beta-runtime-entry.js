import {BETA_PREFIX,BETA_PATH,isBetaSlotId,validateBetaSlot} from './beta-save-slots.js';

// The game module is dynamically imported only while this tab owns its slot.
export async function startBetaRuntime({window,document,storage,locks,validateSave,loadGame,navigate=url=>window.location.replace(url)}={}){
 const values=new URLSearchParams(window.location.search).getAll('slot');
 if(values.length!==1||!isBetaSlotId(values[0])){navigate(BETA_PATH+'?manage=1');return{redirected:true};}
 const slot=values[0],label=document.getElementById('load-text'),loading=document.getElementById('loading');
 const failure=message=>{if(loading){loading.hidden=false;loading.style.opacity='1';}if(label)label.textContent=message+' 原有存档未覆盖。';const back=document.createElement('a');back.href=BETA_PATH+'?manage=1';back.textContent='返回测试版存档页';loading?.append(back);};
 if(!locks?.request){failure('此浏览器不支持安全存档锁，请更新浏览器。');return{blocked:true};}
 let owned=false,released=false,release;
 const done=new Promise(resolve=>release=resolve);
 window.addEventListener('pagehide',()=>{owned=false;released=true;if(window.game){window.game.paused=true;window.game.resetControls?.();}release();},{once:true});
 window.addEventListener('pageshow',event=>{if(event.persisted&&released)navigate(window.location.href);});
 return locks.request(BETA_PREFIX+':play:'+slot,{ifAvailable:true},async lock=>{
  if(!lock){failure('这个测试存档正在另一个标签页中运行，请关闭那个页面后重试。');return{blocked:true};}
  try{await validateBetaSlot(storage,slot,validateSave);if(released)return{cancelled:true};owned=true;await loadGame();
   const game=window.game;if(!game)throw Error('游戏未能启动');
   const save=game.save.bind(game);game.save=(...args)=>owned?save(...args):false;
   if(released){owned=false;game.paused=true;game.resetControls?.();return{cancelled:true};}
   document.documentElement.dataset.betaUiReady='2';
   const home=document.createElement('a');home.href=BETA_PATH+'?manage=1';home.textContent='SUNSET COAST · 存档管理';home.className='beta-save-home';document.body.append(home);
   await done;return{released:true};
  }catch(error){owned=false;if(window.game){window.game.save=()=>false;window.game.paused=true;window.game.resetControls?.();}failure(error.message||'测试版启动失败。');return{blocked:true};}
 });
}
if(typeof window!=='undefined'){
 try{if(getComputedStyle(document.documentElement).getPropertyValue('--beta-ui-contract').trim()!=='2')throw Error('1.0 界面资源未完整载入，请刷新重试');const {validateSave}=await import('./save-validation.js');startBetaRuntime({window,document,storage:localStorage,locks:navigator.locks,validateSave,loadGame:()=>import('./mobile-ui.js')}).catch(error=>{const label=document.getElementById('load-text');if(label)label.textContent='测试版存档锁不可用：'+error.message+'。原有存档未覆盖。';});}
 catch(error){const label=document.getElementById('load-text');if(label)label.textContent='测试版无法启动：'+error.message+'。请返回测试版首页检查，原存档未覆盖。';}
}
