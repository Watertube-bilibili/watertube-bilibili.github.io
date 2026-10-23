import {LEGACY_STANDARD_SAVE_KEY,STANDARD_ACTIVE_KEY,STANDARD_DEFAULT_SAVE_KEY,isStandardSaveKey} from './standard-save-keys.js';
export {STANDARD_ACTIVE_KEY,isStandardSaveKey} from './standard-save-keys.js';
// Same-origin, append-only beta save transfer. No standard key is ever written.
// Copy-record compatibility identity. Preserve existing backup validation.
export const BETA_VERSION='2.0-dev.1';
export const BETA_PREFIX='sunset-coast-test-2.0-beta';
export const ACTIVE_BETA_KEY=BETA_PREFIX+':active-save-key';
export const BETA_INDEX_PREFIX=BETA_PREFIX+':slot-index:';
export const BETA_LOCK=BETA_PREFIX+':transfer';
// Derive navigation from the deployed module: Sites / and project Pages /name/.
export function appBaseForModule(moduleURL=import.meta.url){
 const url=new URL(moduleURL);if(url.protocol==='file:')return '/';
 for(const suffix of ['/play/beta-save-slots.js'])
  if(url.pathname.endsWith(suffix))return url.pathname.slice(0,-suffix.length)+'/';
 return new URL('./',url).pathname;
}
export const APP_BASE=appBaseForModule();
export const BETA_PATH=APP_BASE;
export const MAX_SAVE_BYTES=512*1024;
export const MAX_BACKUP_BYTES=MAX_SAVE_BYTES*2+4096;
const SUFFIXES={SAVE_KEY:'save-v1',ASSIST_SETTINGS_KEY:'assist-settings',QUALITY_PREFERENCE_KEY:'quality',RELEASE_READ_KEY:'release-read',COCKPIT_OPEN_KEY:'cockpit-open',COCKPIT_POSITION_KEY:'cockpit-position',INPUT_MODE_KEY:'input-mode',MISSION_HIDDEN_KEY:'mission-hidden'};
export class BetaSaveError extends Error {constructor(code,message){super(message);this.name='BetaSaveError';this.code=code;}}
const fail=(code,message)=>{throw new BetaSaveError(code,message);};
const bytes=value=>new TextEncoder().encode(value).byteLength;
export const isBetaSlotId=value=>typeof value==='string'&&/^s-[a-z0-9][a-z0-9-]{0,95}$/.test(value);
export function betaStorageKeys(slot){
 if(slot!==null&&!isBetaSlotId(slot))fail('invalid-slot','测试版存档编号无效。');
 return Object.freeze(Object.fromEntries(Object.entries(SUFFIXES).map(([name,suffix])=>[name,BETA_PREFIX+':'+(slot===null?'':'slot-'+slot+':')+suffix])));
}
export function betaIndexKey(slot){if(!isBetaSlotId(slot))fail('invalid-slot','测试版存档编号无效。');return BETA_INDEX_PREFIX+slot;}
export const betaBackupKey=slot=>betaIndexKey(slot)+':initial-backup';
export const betaPlayURL=slot=>BETA_PATH+'play/?slot='+encodeURIComponent(slot);
function get(storage,key){try{return storage.getItem(key);}catch{fail('storage-read','无法读取浏览器存档，请允许本网站使用本地存储后重试。');}}
function keys(storage){try{const all=[];if(!Number.isSafeInteger(storage.length)||storage.length<0)throw Error();for(let i=0;i<storage.length;i++)all.push(storage.key(i));return all.filter(k=>typeof k==='string');}catch{fail('storage-read','无法读取浏览器存档列表。');}}
function exactKeys(object,names){return object&&typeof object==='object'&&!Array.isArray(object)&&Object.keys(object).sort().join('|')===[...names].sort().join('|');}
// Parsed JSON stays data. Reject prototype-related keys before handing it to
// existing gameplay validation, and bound nesting/graph size independently of bytes.
function assertSafeData(value){
 const stack=[[value,0]];let nodes=0;
 while(stack.length){const [item,depth]=stack.pop();if(++nodes>20000||depth>32)fail('invalid-save','存档结构过深或过大，已保留原数据。');
  if(!item||typeof item!=='object')continue;
  for(const key of Object.keys(item)){if(['__proto__','prototype','constructor'].includes(key))fail('invalid-save','存档包含不安全的数据键，已保留原数据。');stack.push([item[key],depth+1]);}
 }
}
function assertOptionalSchema(save){
 const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
 const invalid=()=>fail('invalid-save','存档字段类型或设置版本不支持，已保留原数据。');
 if(!object(save))invalid();
 for(const name of ['inCar','god'])if(save[name]!==undefined&&typeof save[name]!=='boolean')invalid();
 if(save.savedAt!==undefined&&(typeof save.savedAt!=='string'||save.savedAt.length>128||!Number.isFinite(Date.parse(save.savedAt))))invalid();
 for(const name of ['job','destination'])if(save[name]!==undefined&&save[name]!==null&&!object(save[name]))invalid();
 if(save.settings===undefined||save.settings===null)return;
 if(!object(save.settings))invalid();const settings=save.settings;
 if(settings.quality!==undefined&&!['low','medium','high'].includes(settings.quality))invalid();
 if(settings.weather!==undefined&&!['clear','rain','fog'].includes(settings.weather))invalid();
 if(settings.assist===undefined||settings.assist===null)return;
 if(!object(settings.assist))invalid();const assist=settings.assist;
 if(assist.maxSpeedKmh!==undefined&&(!Number.isFinite(assist.maxSpeedKmh)||assist.maxSpeedKmh<10||assist.maxSpeedKmh>220))invalid();
 for(const [name,values]of [['driveStyle',['normal','sport']],['followGap',['near','medium','far']],['aebSensitivity',['low','medium','high']]])if(assist[name]!==undefined&&!values.includes(assist[name]))invalid();
 if(assist.aebEnabled!==undefined&&typeof assist.aebEnabled!=='boolean')invalid();
}
export function validateBetaRaw(raw,validateSave){
 if(typeof raw!=='string'||!raw.length||bytes(raw)>MAX_SAVE_BYTES)fail('invalid-save','存档缺失或超过安全大小限制，已保留原数据。');
 let parsed;try{parsed=JSON.parse(raw);assertSafeData(parsed);assertOptionalSchema(parsed);if(typeof validateSave!=='function'||validateSave(parsed)!==parsed)throw Error();}catch{fail('invalid-save','存档损坏、版本不支持或数据不完整，已保留原数据。');}
 return parsed;
}
export function readBetaSlotRecord(storage,slot){
 let record;const raw=get(storage,betaIndexKey(slot));
 try{if(typeof raw!=='string'||raw.length>4096)throw Error();record=JSON.parse(raw);}catch{fail('invalid-record','测试版存档入口缺失或损坏，原数据已保留。');}
 if(!exactKeys(record,['version','slot','mode','createdAt','operationToken','initialChecksum'])||record.version!==1||record.slot!==slot||!['copy','fresh'].includes(record.mode)||typeof record.createdAt!=='string'||!Number.isFinite(Date.parse(record.createdAt))||!/^sha256-[a-f0-9]{64}$/.test(record.operationToken)||!/^[a-f0-9]{64}$/.test(record.initialChecksum))fail('invalid-record','测试版存档入口版本不支持或损坏，原数据已保留。');
 return record;
}
async function checksum(raw,crypto=globalThis.crypto){
 if(!crypto?.subtle?.digest)fail('crypto-unavailable','此浏览器缺少安全存档校验能力，请更新浏览器后重试。');
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw))),v=>v.toString(16).padStart(2,'0')).join('');
}
export function freshSave(now=new Date().toISOString()){
 // New slots begin in daylight; copied/existing saves retain their own clock.
 return JSON.stringify({version:1,savedAt:now,region:'coast',money:12500,health:100,armor:70,wanted:0,owned:['s'],jobsCompleted:0,clockMinutes:8*60,transactions:[],vehicle:{model:'s',isGarageVehicle:true,instanceId:'garage:s',x:9.5,z:174,yaw:0,battery:98,condition:100},inCar:false,player:{x:13,z:174,yaw:0},job:null,destination:null,character:'alex',god:false,ammo:60});
}
export function resolveStandardSave(storage,preferredKey){
 if(preferredKey!==undefined){if(!isStandardSaveKey(preferredKey))fail('invalid-source','标准版存档入口无效。');return{key:preferredKey,raw:get(storage,preferredKey)};}
 const active=get(storage,STANDARD_ACTIVE_KEY);
 if(active!==null){let pointer;try{pointer=JSON.parse(active);}catch{pointer={key:active};}if(!isStandardSaveKey(pointer?.key))fail('invalid-source','标准版当前存档指向不完整，请先返回标准版确认存档。');return{key:pointer.key,raw:get(storage,pointer.key)};}
 const defaultKey=STANDARD_DEFAULT_SAVE_KEY;if(get(storage,defaultKey)!==null)return{key:defaultKey,raw:get(storage,defaultKey)};
 const candidates=keys(storage).filter(k=>isStandardSaveKey(k)&&k.includes(':slot-'));
 if(candidates.length===1)return{key:candidates[0],raw:get(storage,candidates[0])};
 if(candidates.length>1)fail('ambiguous-source','有多个标准版存档，请在标准版打开要复制的进度，再点测试版入口。');
 return{key:LEGACY_STANDARD_SAVE_KEY,raw:get(storage,LEGACY_STANDARD_SAVE_KEY)};
}
function backupBody(mode,raw,sourceKey,betaVersion=BETA_VERSION){return{format:'sunset-coast-save-copy',version:1,saveSchema:1,betaVersion,mode,sourceKey,save:raw};}
function supportedBetaVersion(value){return typeof value==='string'&&/^2\.0-dev\.[1-9][0-9]{0,3}$/.test(value)&&Number(value.split('.').at(-1))<=Number(BETA_VERSION.split('.').at(-1));}
export async function validateBetaSlot(storage,slot,validateSave,{crypto=globalThis.crypto}={}){
 const record=readBetaSlotRecord(storage,slot),raw=get(storage,betaStorageKeys(slot).SAVE_KEY);validateBetaRaw(raw,validateSave);
 const backupRaw=get(storage,betaBackupKey(slot));let backup;
 try{if(typeof backupRaw!=='string'||bytes(backupRaw)>MAX_BACKUP_BYTES)throw Error();backup=JSON.parse(backupRaw);}catch{fail('invalid-backup','测试版初始备份缺失或损坏，已停止进入并保留现有进度。');}
 if(!exactKeys(backup,['format','version','saveSchema','betaVersion','mode','sourceKey','save','checksum'])||backup.format!=='sunset-coast-save-copy'||backup.version!==1||backup.saveSchema!==1||!supportedBetaVersion(backup.betaVersion)||backup.mode!==record.mode||(backup.mode==='copy'?!isStandardSaveKey(backup.sourceKey):backup.sourceKey!==null))fail('invalid-backup','测试版初始备份格式不支持，已保留现有进度。');
 validateBetaRaw(backup.save,validateSave);
 const hash=await checksum(JSON.stringify(backupBody(backup.mode,backup.save,backup.sourceKey,backup.betaVersion)),crypto);
 if(backup.checksum!==hash||record.initialChecksum!==hash)fail('checksum','测试版初始备份校验失败，已保留全部数据。');
 if(get(storage,betaStorageKeys(slot).SAVE_KEY)!==raw||get(storage,betaIndexKey(slot))!==JSON.stringify(record)||get(storage,betaBackupKey(slot))!==backupRaw)fail('concurrent-change','存档在检查期间发生变化，请关闭另一个游戏标签页后重试。');
 return{...record,raw,save:JSON.parse(raw),url:betaPlayURL(slot)};
}
export async function listBetaSlots(storage,validateSave,options){
 const entries=[],warnings=[];
 for(const key of keys(storage).filter(k=>k.startsWith(BETA_INDEX_PREFIX)&&!k.endsWith(':initial-backup'))){const slot=key.slice(BETA_INDEX_PREFIX.length);try{if(!isBetaSlotId(slot))throw Error();entries.push(await validateBetaSlot(storage,slot,validateSave,options));}catch(error){warnings.push(error.message||'有一个测试版存档入口无效，数据已保留。');}}
 const known=new Set(entries.map(e=>betaStorageKeys(e.slot).SAVE_KEY));
 const knownBackups=new Set(entries.map(e=>betaBackupKey(e.slot)));
 if(keys(storage).some(k=>k.startsWith(BETA_INDEX_PREFIX)&&k.endsWith(':initial-backup')&&!knownBackups.has(k)))warnings.push('发现未完成或损坏的测试版初始备份，已保留数据。');
 if(keys(storage).some(k=>k.startsWith(BETA_PREFIX+':slot-')&&k.endsWith(':save-v1')&&!known.has(k)))warnings.push('发现未完成或损坏的测试版副本，已保留数据。');
 entries.sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)||a.slot.localeCompare(b.slot));
 return{entries,warnings};
}
export async function activeBetaSlot(storage,validateSave,options){
 const slot=get(storage,ACTIVE_BETA_KEY);if(slot===null)return null;
 // Runtime stores the full active save key, while the chooser writes it too.
 const prefix=BETA_PREFIX+':slot-';if(!slot.startsWith(prefix)||!slot.endsWith(':save-v1'))fail('invalid-active','测试版当前存档指向损坏，已停止自动进入。');
 return validateBetaSlot(storage,slot.slice(prefix.length,-':save-v1'.length),validateSave,options);
}
export function selectBetaSlot(storage,entry){
 const value=betaStorageKeys(entry.slot).SAVE_KEY;
 try{storage.setItem(ACTIVE_BETA_KEY,value);if(get(storage,ACTIVE_BETA_KEY)!==value)throw Error();}catch{fail('storage-write','无法记录当前测试版存档，已保留副本，请检查空间后重试。');}
 return entry;
}
function randomSlot(crypto){if(!crypto?.randomUUID)fail('crypto-unavailable','此浏览器无法创建独立存档编号，请更新浏览器。');return's-'+crypto.randomUUID();}
export async function createBetaSlot(storage,{mode,sourceKey,sourceRaw,validateSave,locks=globalThis.navigator?.locks,crypto=globalThis.crypto,idFactory=()=>randomSlot(crypto),now=()=>new Date().toISOString()}={}){
 if(mode==='copy')fail('test-isolation','此隔离测试入口只使用新测试存档，不读取正式版存档。');
 if(!['copy','fresh'].includes(mode))fail('invalid-mode','请选择复制标准版存档、新存档进入，或取消。');
 if(!locks?.request)fail('locks-unavailable','此浏览器不支持安全的跨标签页存档锁，请更新浏览器后重试。原数据未修改。');
 return locks.request(BETA_LOCK,async()=>{
  let original=null,raw,key=null;
  if(mode==='copy'){original=resolveStandardSave(storage,sourceKey);key=original.key;raw=sourceRaw??original.raw;if(raw===null)fail('missing-source','还没有标准版存档，请先在标准版点“存档”，或选择新存档进入。');}
  else raw=freshSave(now());
  validateBetaRaw(raw,validateSave);
  const body=backupBody(mode,raw,key),hash=await checksum(JSON.stringify(body),crypto),operationToken='sha256-'+(mode==='copy'?hash:await checksum(hash+idFactory(),crypto));
  await activeBetaSlot(storage,validateSave,{crypto});
  const existing=await listBetaSlots(storage,validateSave,{crypto});
  // Never create a second copy when the previous operation's record is damaged.
  if(existing.warnings.length)fail('existing-corrupt',existing.warnings.join(' ')+' 请先检查测试版存档，未新建或覆盖。');
  const previous=existing.entries.find(e=>e.operationToken===operationToken);
  if(previous)return selectBetaSlot(storage,{...previous,resumed:true});
  let slot;for(let attempt=0;attempt<32;attempt++){const proposed=idFactory();if(!isBetaSlotId(proposed))fail('invalid-slot','无法创建有效的独立存档编号。');const prefix=BETA_PREFIX+':slot-'+proposed+':';if(!keys(storage).some(k=>k.startsWith(prefix)||k===betaIndexKey(proposed)||k===betaBackupKey(proposed))){slot=proposed;break;}}
  if(!slot)fail('collision','独立存档编号冲突，请重试。');
  if(original&&get(storage,original.key)!==original.raw)fail('concurrent-change','标准版存档刚刚改变，请再点一次复制。原存档未修改。');
  const record={version:1,slot,mode,createdAt:now(),operationToken,initialChecksum:hash};
  const writes=[[betaBackupKey(slot),JSON.stringify({...body,checksum:hash})],[betaStorageKeys(slot).SAVE_KEY,raw],[betaIndexKey(slot),JSON.stringify(record)]],attempted=[];
  try{for(const [k,v]of writes){if(get(storage,k)!==null)fail('collision','存档编号已使用，未覆盖已有数据。');attempted.push([k,v]);storage.setItem(k,v);if(get(storage,k)!==v)throw Error('write verification');}}
  catch(error){let incomplete=false;for(const[k,v]of attempted.reverse())try{if(get(storage,k)===v){storage.removeItem(k);if(get(storage,k)!==null)incomplete=true;}}catch{incomplete=true;}fail('storage-write',incomplete?'副本未完整写入，原有存档已保留。请检查浏览器空间和存储权限。':'副本未能保存，原有存档未修改。请检查浏览器空间后重试。');}
  return selectBetaSlot(storage,{...record,raw,save:JSON.parse(raw),url:betaPlayURL(slot),resumed:false});
 });
}
