import {FORMAL_STORAGE_KEYS,PREVIEW_SLOT_INDEX_PREFIX,PreviewSlotError,isPreviewSlotId,
 storageKeysForSlot,previewSlotIndexKey,readPreviewSlotRecord} from './storage-keys.js';
import {normalizeAssistSettings} from './assist-settings.js';

export {PreviewSlotError} from './storage-keys.js';
export const PREVIEW_PATH=new URL('./',import.meta.url).pathname;
const modes=new Set(['copy','fresh']);
const read=(storage,key)=>{try{return storage.getItem(key);}catch(cause){throw new PreviewSlotError('storage-read','无法读取本地存档。请允许此网站使用本地存储后重试。',{cause});}};
function storedKeys(storage){
 try{
  const length=storage.length;
  if(!Number.isSafeInteger(length)||length<0||typeof storage.key!=='function')throw Error('Storage enumeration is unavailable');
  const keys=[];for(let i=0;i<length;i++){const key=storage.key(i);if(typeof key==='string')keys.push(key);}return keys;
 }catch(cause){throw new PreviewSlotError('storage-read','无法读取已有测试存档列表，请检查浏览器的本地存储权限。',{cause});}
}
function entry(record){
 const date=new Date(record.createdAt).toLocaleString('zh-CN',{hour12:false});
 return{slot:record.slot,mode:record.mode,createdAt:record.createdAt,
  label:(record.mode==='copy'?'正式版副本':'新测试存档')+' · '+date,
  url:PREVIEW_PATH+'?slot='+encodeURIComponent(record.slot),default:false,warnings:[]};
}
function defaultEntry(){return{slot:null,mode:'default',createdAt:null,label:'原有测试存档（1.5 系列）',url:PREVIEW_PATH,default:true,warnings:[]};}
function hasDefault(storage){return Object.values(storageKeysForSlot(null)).some(key=>read(storage,key)!==null);}
export function listPreviewSlots(storage){
 const records=[],warnings=[];
 for(const key of storedKeys(storage)){
  if(!key.startsWith(PREVIEW_SLOT_INDEX_PREFIX))continue;
  const slot=key.slice(PREVIEW_SLOT_INDEX_PREFIX.length);
  if(!isPreviewSlotId(slot)){warnings.push('有一个测试存档入口记录损坏，相关数据已保留，未作修改。');continue;}
  try{records.push(entry(readPreviewSlotRecord(storage,slot)));}catch(error){
   if(!['invalid-slot-record','unknown-slot'].includes(error?.code))throw error;
   // An unreadable record must not hide healthy slots. Report it separately,
   // leave its bytes intact, and still reject any attempt to resume that slot.
   warnings.push('有一个测试存档入口记录损坏或不完整，相关数据已保留，未作修改。');
  }
 }
 records.sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)||a.slot.localeCompare(b.slot));
 if(hasDefault(storage))records.unshift(defaultEntry());
 Object.defineProperty(records,'warnings',{value:warnings,enumerable:false});
 return records;
}
export function resumePreviewSlot(storage,slot){
 if(slot===null){
  if(!hasDefault(storage))throw new PreviewSlotError('unknown-slot','尚无原有测试存档，请选择新建测试存档。');
  return defaultEntry();
 }
 return entry(readPreviewSlotRecord(storage,slot));
}
function preference(name,raw,warnings){
 if(raw===null)return null;
 const ignored=()=>{warnings.push(name+' 无效，测试存档将使用默认设置。');return null;};
 if(name==='ASSIST_SETTINGS_KEY'){
  let value;try{value=JSON.parse(raw);}catch{return ignored();}
  if(!value||typeof value!=='object'||Array.isArray(value))return ignored();
  const normalized=normalizeAssistSettings(value);
  if(Object.keys(value).length===Object.keys(normalized).length&&Object.entries(normalized).every(([key,val])=>value[key]===val))return raw;
  warnings.push('驾驶辅助设置已按测试版支持的范围标准化。');return JSON.stringify(normalized);
 }
 if(name==='QUALITY_PREFERENCE_KEY')return ['low','medium','high'].includes(raw)?raw:ignored();
 if(name==='INPUT_MODE_KEY')return ['auto','keyboard','touch'].includes(raw)?raw:ignored();
 if(name==='COCKPIT_OPEN_KEY'||name==='MISSION_HIDDEN_KEY')return ['true','false'].includes(raw)?raw:ignored();
 if(name==='COCKPIT_POSITION_KEY'){
  let value;try{value=JSON.parse(raw);}catch{return ignored();}
  if(value?.version!==1||!Number.isFinite(value.x)||!Number.isFinite(value.y))return ignored();
  if(value.x>=0&&value.x<=1&&value.y>=0&&value.y<=1&&Object.keys(value).length===3)return raw;
  warnings.push('车机位置已调整到可见范围。');
  return JSON.stringify({version:1,x:Math.max(0,Math.min(1,value.x)),y:Math.max(0,Math.min(1,value.y))});
 }
 return null;
}
function copyValues(storage,validateSave,warnings){
 if(typeof validateSave!=='function')throw new PreviewSlotError('validator-required','无法校验正式版存档，请等待正式版加载完成后重试。');
 const raw=read(storage,FORMAL_STORAGE_KEYS.SAVE_KEY);
 if(raw===null)throw new PreviewSlotError('no-formal-save','尚未找到正式版存档。请先在正式版保存进度，或选择“新存档进入”。');
 try{
  const parsed=JSON.parse(raw),validated=validateSave(parsed);
  // The actual Game.validateSave method returns its input on success. Do not
  // accept missing, boolean or asynchronous adapters that skip validation.
  if(!parsed||validated!==parsed)throw Error('存档校验未完成');
 }catch(cause){throw new PreviewSlotError('invalid-formal-save','正式版存档无法通过校验，未复制任何数据。可返回正式版检查存档，或选择“新存档进入”。',{cause});}
 const values={SAVE_KEY:raw};
 for(const [name,key]of Object.entries(FORMAL_STORAGE_KEYS)){
  if(name==='SAVE_KEY'||name==='RELEASE_READ_KEY')continue;
  const value=preference(name,read(storage,key),warnings);if(value!==null)values[name]=value;
 }
 return values;
}
function randomId(){
 if(globalThis.crypto?.randomUUID)return 's-'+globalThis.crypto.randomUUID();
 if(globalThis.crypto?.getRandomValues){const values=globalThis.crypto.getRandomValues(new Uint32Array(4));return 's-'+Array.from(values,n=>n.toString(36)).join('-');}
 throw new PreviewSlotError('slot-id-unavailable','浏览器无法创建安全的独立存档编号，请使用较新的浏览器重试。');
}
function allocateSlot(storage,idFactory){
 const existing=new Set(storedKeys(storage));
 for(let attempt=0;attempt<32;attempt++){
  const slot=idFactory(attempt);if(!isPreviewSlotId(slot))throw new PreviewSlotError('invalid-slot','无法创建有效的测试存档编号。');
  const keys=storageKeysForSlot(slot),index=previewSlotIndexKey(slot);
  const prefix=keys.SAVE_KEY.slice(0,-'save-v1'.length);
  if([...existing].some(key=>key===index||key.startsWith(prefix)))continue;
  if([index,...Object.values(keys)].every(key=>read(storage,key)===null))return{slot,keys,index};
 }
 throw new PreviewSlotError('slot-collision','测试存档编号重复，未改变已有数据。请重试。');
}
export function createPreviewSlot(storage,{mode,validateSave,now=Date.now,idFactory=randomId,operationToken}={}){
 if(!modes.has(mode))throw new PreviewSlotError('invalid-mode','请选择复制正式版存档或新建测试存档。');
 if(operationToken!==undefined&&(typeof operationToken!=='string'||!operationToken.length||operationToken.length>128))
  throw new PreviewSlotError('invalid-operation','本次操作标识无效，请关闭弹窗后重试。');
 // Retrying the same completed button action resumes its committed slot. It
 // never takes a second snapshot or overwrites later progress in that slot.
 if(operationToken!==undefined){
  for(const key of storedKeys(storage)){
   if(!key.startsWith(PREVIEW_SLOT_INDEX_PREFIX))continue;
   const slot=key.slice(PREVIEW_SLOT_INDEX_PREFIX.length);if(!isPreviewSlotId(slot))continue;
   let record;try{record=readPreviewSlotRecord(storage,slot);}catch(error){
    if(['invalid-slot-record','unknown-slot'].includes(error?.code))continue;
    throw error;
   }
   if(record.operationToken!==operationToken)continue;
   if(record.mode!==mode)throw new PreviewSlotError('operation-conflict','这次操作已经创建了另一种测试存档，请重新选择。');
   return{...entry(record),resumed:true};
  }
 }
 const warnings=[],values=mode==='copy'?copyValues(storage,validateSave,warnings):{};
 let createdAt;try{createdAt=new Date(typeof now==='function'?now():now).toISOString();}catch(cause){throw new PreviewSlotError('invalid-time','无法记录测试存档创建时间，请重试。',{cause});}
 const {slot,keys,index}=allocateSlot(storage,idFactory);
 const record={version:1,slot,mode,createdAt,...(operationToken!==undefined?{operationToken}:{})};
 const writes=[...Object.entries(values).map(([name,value])=>[keys[name],value]),[index,JSON.stringify(record)]];
 const attempted=[];
 try{
  for(const [key,value]of writes){
   if(read(storage,key)!==null)throw new PreviewSlotError('slot-collision','测试存档编号已被使用，未覆盖已有数据。请重试。');
   attempted.push([key,value]);storage.setItem(key,value);
   if(read(storage,key)!==value)throw Error('Storage write verification failed');
  }
 }catch(cause){
  const rollbackFailures=[];
  // Delete only values written by this failed transaction. Never remove old
  // slots, the original default preview, formal data, or another writer's value.
  for(const [key,value]of attempted.reverse()){
   try{if(storage.getItem(key)===value){storage.removeItem(key);if(storage.getItem(key)===value)throw Error('Storage removal verification failed');}}catch(error){rollbackFailures.push(error);}
  }
  if(rollbackFailures.length)throw new PreviewSlotError('rollback-failed','新测试存档未能完整创建，浏览器也未能清理本次未完成的数据。原有存档未被覆盖；请检查存储权限后重试。',{cause});
  if(cause instanceof PreviewSlotError)throw cause;
  throw new PreviewSlotError('storage-write','测试存档未能保存，未进入测试版。请检查浏览器可用空间和存储权限后重试。',{cause});
 }
 return{...entry(record),warnings};
}
