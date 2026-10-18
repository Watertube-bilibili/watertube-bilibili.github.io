import {validateSave} from './play/save-validation.js';
import {activeBetaSlot,listBetaSlots,createBetaSlot,selectBetaSlot} from './play/beta-save-slots.js';
export async function installBetaLauncher({document,window,storage,locks=window.navigator?.locks,navigate=url=>window.location.replace(url),manage=false,createSlot=createBetaSlot}={}){
 const $=id=>document.getElementById(id),status=$('beta-status'),list=$('beta-slots'),copy=$('beta-copy'),fresh=$('beta-new'),cont=$('beta-continue');let busy=false,generation=0,active=null;
 const setBusy=value=>{busy=value;copy.disabled=fresh.disabled=cont.disabled=value;for(const button of list.children)button.disabled=value;};
 const go=async operation=>{if(busy)return;setBusy(true);const token=++generation;status.textContent='正在校验并准备独立测试存档…';try{const entry=await operation();if(token!==generation)return;navigate(entry.url);}catch(error){if(token===generation)status.textContent=error.message+' 原有存档已保留。';}finally{if(token===generation)setBusy(false);}};
 copy.onclick=()=>go(()=>createSlot(storage,{mode:'copy',validateSave,locks}));fresh.onclick=()=>go(()=>createSlot(storage,{mode:'fresh',validateSave,locks}));
 cont.onclick=()=>go(async()=>{const selected=await activeBetaSlot(storage,validateSave);if(!selected)throw Error('测试存档入口已改变，请刷新后重新选择。');return selected;});
 const refresh=async(auto=false)=>{
  list.replaceChildren();let issue=null;try{active=await activeBetaSlot(storage,validateSave);}catch(error){issue=error.message;active=null;}
  const {entries,warnings}=await listBetaSlots(storage,validateSave);
  for(const entry of entries){const button=document.createElement('button');button.textContent=(entry.mode==='copy'?'标准版副本':'新测试进度')+' · '+new Date(entry.save.savedAt??entry.createdAt).toLocaleString('zh-CN')+' · $'+entry.save.money.toLocaleString();button.onclick=()=>go(async()=>{const current=await listBetaSlots(storage,validateSave),chosen=current.entries.find(e=>e.slot===entry.slot);if(!chosen)throw Error('该存档无法通过校验，请保留原数据。');return selectBetaSlot(storage,chosen);});list.append(button);}
  if(!active&&!issue&&!warnings.length&&entries.length){active=selectBetaSlot(storage,[...entries].sort((a,b)=>(Date.parse(b.save.savedAt)||Date.parse(b.createdAt))-(Date.parse(a.save.savedAt)||Date.parse(a.createdAt)))[0]);}
  cont.hidden=!active;copy.textContent=active?'另建副本：复制标准版存档':'复制标准版存档进入';
  status.textContent=issue||warnings.join(' ')||(active?'已有测试版进度已保留。可继续，也可另建独立副本。':'选择复制标准版存档或从新存档开始。');
  if(issue||warnings.length)$('beta-saved').open=true;
  if(auto&&active&&!issue&&!warnings.length)navigate(active.url);
 };
 window.addEventListener('pagehide',()=>{generation++;});window.addEventListener('pageshow',event=>{if(event.persisted){generation++;setBusy(false);refresh().catch(error=>status.textContent=error.message);}});
 try{await refresh(!manage);}catch(error){status.textContent=error.message+' 原有存档已保留，未进入游戏。';}
 return{refresh,status,copy,fresh,cont};
}
if(typeof window!=='undefined'){
 try{installBetaLauncher({document,window,storage:localStorage,manage:new URLSearchParams(location.search).get('manage')==='1'});}catch(error){document.getElementById('beta-status').textContent='无法访问本地存储：'+error.message+'。原有存档未修改。';}
}
