export const cityPlayURL=(slot,moduleURL=import.meta.url)=>new URL('./?citySlot='+encodeURIComponent(slot),moduleURL).href;
const message=error=>error?.message??String(error);
async function loadDependencies(){
 const [store,validation]=await Promise.all([import('./city-save-store.js'),import('./save-validation.js')]);
 return {...store,validateSave:validation.validateSave};
}

export function installCityChooser({document=globalThis.document,getStorage=()=>globalThis.localStorage,loadDependencies:load=loadDependencies,navigate=url=>globalThis.location.assign(url)}={}){
 const status=document.getElementById('status'),originals=document.getElementById('originals'),candidates=document.getElementById('candidates'),fresh=document.getElementById('fresh'),file=document.getElementById('import-file'),retry=document.getElementById('retry-init');
 const controls=new Set([fresh,file]);let phase='loading',dependencies;
 function state(next,text){phase=next;status.textContent=text;document.documentElement.dataset.cityChooserState=next;for(const control of controls)control.disabled=next!=='ready';retry.hidden=next!=='init-error';retry.disabled=next!=='init-error';}
 function candidateRow(entry,created=false){
  const row=document.createElement(entry.error?'p':'a');row.className='card';
  if(entry.error)row.textContent=entry.slot+'：'+entry.error;
  else{row.href=cityPlayURL(entry.slot);row.textContent='继续 Rapier 进度 · $'+entry.save.money.toLocaleString()+' · '+entry.slot;
   row.onclick=event=>{if(phase!=='ready'&&!(created&&phase==='navigation-error'))event.preventDefault();};
   const note=document.createElement('small');note.textContent='来源：'+(entry.record.source.key??(entry.record.source.kind==='fresh'?'明确新建':'导入文件'));row.append(note);}
  return row;
 }
 function render(cityEntries,originalEntries){
  originals.replaceChildren();candidates.replaceChildren();controls.clear();controls.add(fresh);controls.add(file);
  for(const entry of cityEntries)candidates.append(candidateRow(entry));
  if(!candidates.children.length){const row=document.createElement('p');row.textContent='还没有 Rapier 进度。请选择下面的原档复制，或明确新建。';candidates.append(row);}
  for(const entry of originalEntries){
   const row=document.createElement('article');row.className='card';const title=document.createElement('strong'),key=document.createElement('code');key.textContent=entry.source.key;
   title.textContent=entry.error?'原档校验未通过':'原始完整城市 · $'+entry.save.money.toLocaleString();row.append(title,key);
   if(entry.error){const note=document.createElement('p');note.textContent=entry.error+' 数据保持原样。';row.append(note);}
   else{const button=document.createElement('button');button.type='button';button.textContent='复制此原档进入 Rapier';button.onclick=()=>create(()=>({sourceKey:entry.source.key}));controls.add(button);button.disabled=true;row.append(button);}
   originals.append(row);
  }
  if(!originals.children.length){const row=document.createElement('p');row.textContent='此浏览器未找到原始标准版或 Beta 存档。可导入版本 1 存档文件；不会自动新建或读取其他地图档。';originals.append(row);}
 }
 async function initialize(){
  if(phase!=='loading'&&phase!=='init-error')return false;
  state('loading','正在初始化存档选择页，请稍候…');
  try{
   const loaded=await load(),storage=getStorage();
   const [cityEntries,originalEntries]=await Promise.all([loaded.listCitySlots(storage,loaded.validateSave),loaded.listOriginalSources(storage,loaded.validateSave)]);
   dependencies=loaded;render(cityEntries,originalEntries);state('ready','存档选择页已就绪。请选择已有副本、复制原档或明确新建。');return true;
  }catch(error){state('init-error','存档选择页初始化失败：'+message(error)+'。重试只会重新读取列表，不会新建或改写存档。');return false;}
 }
 async function create(optionsForOperation){
  if(phase!=='ready')return false;
  state('busy','正在读取、校验并创建独立副本…');let options,storage,entry;
  try{options=await optionsForOperation();storage=getStorage();}
  catch(error){state('ready',message(error)+' 未开始创建；原存档未修改。');return false;}
  try{entry=await dependencies.createCitySlot(storage,{...options,validateSave:dependencies.validateSave});}
  catch(error){
   if(error?.code==='CITY_SLOT_CREATE_FAILED'&&error.uncertain===false)state('ready',message(error)+' 本次进度写入已确认清理；原存档未修改。');
   else if(error?.code==='CITY_SLOT_CREATE_UNCERTAIN'||error?.uncertain===true)state('blocked',message(error)+' 进度写入或清理结果无法确认，已停止本页创建操作；原存档未修改，请保留现有数据。');
   else state('init-error',message(error)+' 未确认创建结果。可显式重读存档列表；不会自动重试创建或删除现有数据。');
   return false;
  }
  state('navigating','独立副本已创建，正在进入…');
  try{await navigate(cityPlayURL(entry.slot));return true;}
  catch(error){candidates.prepend(candidateRow(entry,true));state('navigation-error','副本 '+entry.slot+' 已创建，但进入失败：'+message(error)+'。请使用上方该副本的继续链接；不会重复创建。');return false;}
 }
 // Bind before loading the validation/render dependency graph. No operation is
 // accepted until both read-only listings complete successfully.
 fresh.onclick=()=>create(()=>({fresh:true}));
 file.onchange=()=>{
  if(phase!=='ready')return Promise.resolve(false);
  const selected=file.files?.[0];if(!selected)return Promise.resolve(false);
  return create(async()=>{if(selected.size>512*1024)throw Error('文件超过原始存档允许的 512 KiB，未导入。');return {fileRaw:await selected.text()};}).finally(()=>{file.value='';});
 };
 retry.onclick=()=>phase==='init-error'?initialize():Promise.resolve(false);
 const initialized=initialize();
 return {initialized,get phase(){return phase;}};
}

if(typeof document!=='undefined')installCityChooser();
