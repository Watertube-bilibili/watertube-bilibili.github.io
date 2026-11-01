import {validateSave} from './play/save-validation.js';
import {ACTIVE_BETA_KEY,betaStorageKeys,activeBetaSlot,listBetaSlots,validateBetaSlot,createBetaSlot,selectBetaSlot} from './play/beta-save-slots.js?v=df6ffeb514da';
export async function installBetaLauncher({document,window,storage,locks=window.navigator?.locks,navigate=url=>window.location.replace(url),manage=false,createSlot=createBetaSlot}={}){
 const $=id=>document.getElementById(id),status=$('beta-status'),list=$('beta-slots'),fresh=$('beta-new'),cont=$('beta-continue');let busy=false,generation=0,active=null;
 const setBusy=value=>{busy=value;fresh.disabled=cont.disabled=value;for(const button of list.children)button.disabled=value;};
 const go=async operation=>{if(busy)return;setBusy(true);const token=++generation;status.textContent='正在校验并准备独立测试存档…';try{const entry=await operation();if(token!==generation)return;navigate(entry.url);}catch(error){if(token===generation)status.textContent=error.message+' 原有存档已保留。';}finally{if(token===generation)setBusy(false);}};
 fresh.onclick=()=>go(()=>createSlot(storage,{mode:'fresh',validateSave,locks}));
 cont.onclick=()=>go(async()=>{const selected=await activeBetaSlot(storage,validateSave);if(!selected)throw Error('测试存档入口已改变，请刷新后重新选择。');return selected;});
 const refresh=async(auto=false)=>{
  list.replaceChildren();active=null;let issue=null;
  const {entries,warnings}=await listBetaSlots(storage,validateSave);
  const pointer=storage.getItem(ACTIVE_BETA_KEY);active=entries.find(entry=>betaStorageKeys(entry.slot).SAVE_KEY===pointer)??null;
  if(pointer&&!active)issue='当前测试存档无法读取；可以选择另一份进度或新建存档。原数据保留。';
  for(const entry of entries){const button=document.createElement('button');button.textContent=(entry.mode==='copy'?'标准版副本':'新测试进度')+' · '+new Date(entry.save.savedAt??entry.createdAt).toLocaleString('zh-CN')+' · $'+entry.save.money.toLocaleString();button.onclick=()=>go(async()=>selectBetaSlot(storage,await validateBetaSlot(storage,entry.slot,validateSave)));list.append(button);}
  if(!active&&!issue&&!warnings.length&&entries.length){active=selectBetaSlot(storage,[...entries].sort((a,b)=>(Date.parse(b.save.savedAt)||Date.parse(b.createdAt))-(Date.parse(a.save.savedAt)||Date.parse(a.createdAt)))[0]);}
  cont.hidden=!active;
  status.textContent=issue||warnings.join(' ')||(active?'已有测试版进度已保留。可继续，也可新建测试存档。':'请选择新测试存档开始；正式版存档不会读取或修改。');
  if(issue||warnings.length)$('beta-saved').open=true;
  if(auto&&active&&!issue&&!warnings.length)navigate(active.url);
 };
 window.addEventListener('pagehide',()=>{generation++;});window.addEventListener('pageshow',event=>{if(event.persisted){generation++;setBusy(false);refresh().catch(error=>status.textContent=error.message);}});
 try{await refresh(!manage);}catch(error){status.textContent=error.message+' 原有存档已保留，未进入游戏。';}
 return{refresh,status,fresh,cont};
}
if(typeof window!=='undefined'){
 try{installBetaLauncher({document,window,storage:localStorage,manage:new URLSearchParams(location.search).get('manage')==='1'});}catch(error){document.getElementById('beta-status').textContent='无法访问本地存储：'+error.message+'。原有存档未修改。';}
}
