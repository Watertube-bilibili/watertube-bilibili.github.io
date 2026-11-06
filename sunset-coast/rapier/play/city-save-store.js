import {BETA_PREFIX,BETA_INDEX_PREFIX,betaStorageKeys,betaIndexKey,validateBetaSlot,validateBetaRaw,freshSave,isBetaSlotId} from './beta-save-slots.js';
import {isStandardSaveKey} from './standard-save-keys.js';
import {isGarageVehicleSave,assertSavedVehicleIdentities,savedVehicleReservations} from './vehicle-identity.js';
import {worldFleetForSave,mergeWorldFleets} from './world-fleet-state.js';

export const CITY_PREFIX='sunrise-coast:original-city-rapier:v1';
export const CITY_ACTIVE_KEY=CITY_PREFIX+':active-save-key';
export const isCitySlotId=isBetaSlotId;
const suffixes={SAVE_KEY:'save-v1',ASSIST_SETTINGS_KEY:'assist-settings',QUALITY_PREFERENCE_KEY:'quality',RELEASE_READ_KEY:'release-read',COCKPIT_OPEN_KEY:'cockpit-open',COCKPIT_POSITION_KEY:'cockpit-position',INPUT_MODE_KEY:'input-mode',MISSION_HIDDEN_KEY:'mission-hidden'};
const clone=value=>structuredClone(value),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function cityStorageKeys(slot){if(slot!==null&&!isCitySlotId(slot))throw Error('候选存档编号无效');return Object.freeze(Object.fromEntries(Object.entries(suffixes).map(([name,suffix])=>[name,CITY_PREFIX+':'+(slot===null?'unselected:':'slot-'+slot+':')+suffix])));}
export const cityIndexKey=slot=>CITY_PREFIX+':slot-index:'+slot;
export const cityBackupKey=slot=>cityIndexKey(slot)+':initial-backup';
export function parseCitySlot(search=''){const p=new URLSearchParams(search),slots=p.getAll('citySlot');if(slots.length!==1||!isCitySlotId(slots[0]))throw Error('请从原始城市候选存档页选择独立副本');return slots[0];}
const keys=storage=>Array.from({length:storage.length},(_,i)=>storage.key(i)).filter(key=>typeof key==='string');
const hash=async(raw,crypto=globalThis.crypto)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw))),byte=>byte.toString(16).padStart(2,'0')).join('');
const betaSlotForKey=key=>{const prefix=BETA_PREFIX+':slot-';if(typeof key!=='string'||!key.startsWith(prefix)||!key.endsWith(':save-v1'))return null;const slot=key.slice(prefix.length,-':save-v1'.length);return isBetaSlotId(slot)?slot:null;};
export async function readOriginalSource(storage,key,validateSave){
 const slot=betaSlotForKey(key);
 if(slot){const entry=await validateBetaSlot(storage,slot,validateSave);return {raw:entry.raw,source:{kind:'beta',key,slot}};}
 if(isStandardSaveKey(key)||key===betaStorageKeys(null).SAVE_KEY){const raw=storage.getItem(key);validateBetaRaw(raw,validateSave);return {raw,source:{kind:isStandardSaveKey(key)?'standard':'legacy-beta',key,slot:key.match(/:slot-(s-[a-z0-9-]+):save-v1$/)?.[1]??null}};}
 throw Error('原存档身份不支持；未读取或改写其他存档');
}
export async function listOriginalSources(storage,validateSave){
 const candidates=new Set(keys(storage).filter(key=>isStandardSaveKey(key)||key===betaStorageKeys(null).SAVE_KEY||betaSlotForKey(key)));
 for(const key of keys(storage))if(key.startsWith(BETA_INDEX_PREFIX)&&!key.endsWith(':initial-backup')){const slot=key.slice(BETA_INDEX_PREFIX.length);if(isBetaSlotId(slot))candidates.add(betaStorageKeys(slot).SAVE_KEY);}
 const out=[];for(const key of candidates)try{const entry=await readOriginalSource(storage,key,validateSave);out.push({...entry,save:JSON.parse(entry.raw)});}catch(error){out.push({source:{key},error:error.message});}return out;
}
export async function readCitySlot(storage,slot,validateSave){
 if(!isCitySlotId(slot))throw Error('候选存档编号无效');
 const key=cityStorageKeys(slot).SAVE_KEY,raw=storage.getItem(key),indexRaw=storage.getItem(cityIndexKey(slot)),backupRaw=storage.getItem(cityBackupKey(slot));
 if(raw===null||indexRaw===null||backupRaw===null)throw Error('候选进度、来源记录或初始备份缺失；禁止自动重建');
 validateBetaRaw(raw,validateSave);
 const record=JSON.parse(indexRaw),backup=JSON.parse(backupRaw);
 if(record.version!==1||record.slot!==slot||!record.source||!['beta','standard','legacy-beta','file','fresh'].includes(record.source.kind)||!/^[a-f0-9]{64}$/.test(record.checksum??'')||backup.format!=='sunrise-original-city-copy'||backup.version!==1||backup.saveSchema!==1||!same(record.source,backup.source)||backup.checksum!==record.checksum||typeof backup.raw!=='string')throw Error('候选来源记录或初始备份格式无效');
 validateBetaRaw(backup.raw,validateSave);if(await hash(JSON.stringify({source:backup.source,raw:backup.raw}))!==record.checksum)throw Error('候选初始备份校验失败');
 if(storage.getItem(key)!==raw||storage.getItem(cityIndexKey(slot))!==indexRaw||storage.getItem(cityBackupKey(slot))!==backupRaw)throw Error('读取期间候选存档改变，未覆盖任何数据');
 return {slot,key,raw,save:JSON.parse(raw),record};
}
export async function listCitySlots(storage,validateSave){
 const out=[],prefix=CITY_PREFIX+':slot-index:';
 for(const key of keys(storage))if(key.startsWith(prefix)&&!key.endsWith(':initial-backup')){const slot=key.slice(prefix.length);try{out.push(await readCitySlot(storage,slot,validateSave));}catch(error){out.push({slot,error:error.message});}}
 return out;
}
export async function createCitySlot(storage,{sourceKey,fileRaw,fresh=false,validateSave,locks=globalThis.navigator?.locks,idFactory=()=> 's-'+crypto.randomUUID(),now=()=>new Date().toISOString()}={}){
 if(Number(sourceKey!==undefined)+Number(fileRaw!==undefined)+Number(fresh)!==1)throw Error('请选择一个明确来源，或新建独立进度');
 if(!locks?.request)throw Error('安全存档锁不可用，未复制任何数据');
 return locks.request(CITY_PREFIX+':import',async()=>{
  const selected=sourceKey!==undefined?await readOriginalSource(storage,sourceKey,validateSave):{raw:fresh?freshSave(now()):fileRaw,source:{kind:fresh?'fresh':'file',key:null,slot:null}};
  validateBetaRaw(selected.raw,validateSave);const checksum=await hash(JSON.stringify({source:selected.source,raw:selected.raw})),slot=idFactory();if(!isCitySlotId(slot))throw Error('候选编号无效');
  if(keys(storage).some(key=>key.startsWith(CITY_PREFIX+':slot-'+slot+':')||key===cityIndexKey(slot)||key===cityBackupKey(slot)))throw Error('候选副本已存在，禁止覆盖');
  // Revalidate beta index/backup as well as raw data after asynchronous hashing.
  if(sourceKey!==undefined){const current=await readOriginalSource(storage,sourceKey,validateSave);if(current.raw!==selected.raw||!same(current.source,selected.source))throw Error('原存档在复制期间改变，请重新选择；原档未覆盖');}
  const createdAt=now(),record={version:1,slot,source:selected.source,checksum,createdAt},backup={format:'sunrise-original-city-copy',version:1,saveSchema:1,source:selected.source,checksum,createdAt,raw:selected.raw};
  const writes=[[cityBackupKey(slot),JSON.stringify(backup)],[cityStorageKeys(slot).SAVE_KEY,selected.raw],[cityIndexKey(slot),JSON.stringify(record)]];
  const attempted=[];
  try{
   for(const [key,value]of writes){
    if(storage.getItem(key)!==null)throw Error('候选目标已存在，禁止覆盖');
    attempted.push([key,value]);let error;try{storage.setItem(key,value);}catch(e){error=e;}
    if(storage.getItem(key)!==value)throw error??Error('候选副本写入未确认');
   }
   return await readCitySlot(storage,slot,validateSave);
  }catch(cause){
   const cleanup={removedKeys:[],unresolvedKeys:[]};
   // Keep the import lock during cleanup. Only this attempt's still-matching
   // values may be removed; revoke the index before the save and backup.
   for(const [key,value]of [...attempted].reverse()){
    try{
     const current=storage.getItem(key);if(current===null)continue;
     if(current!==value){cleanup.unresolvedKeys.push(key);continue;}
     try{storage.removeItem(key);}catch{}
     if(storage.getItem(key)===null)cleanup.removedKeys.push(key);else cleanup.unresolvedKeys.push(key);
    }catch{cleanup.unresolvedKeys.push(key);}
   }
   const uncertain=cleanup.unresolvedKeys.length>0;
   throw Object.assign(new Error(uncertain?'候选创建失败，无法确认临时数据已清理；已停止创建，请保留当前数据。':'候选创建失败，本次临时数据已清理；原存档和已有副本未修改。',{cause}),{code:uncertain?'CITY_SLOT_CREATE_UNCERTAIN':'CITY_SLOT_CREATE_FAILED',uncertain,slot,cleanup});
  }
 });
}
export function mergeCitySnapshot(previous,current){
 if(current===undefined)return clone(previous);
 if(!previous||!current||typeof previous!=='object'||typeof current!=='object'||Array.isArray(previous)||Array.isArray(current))return clone(current);
 const result=clone(previous);for(const key of Object.keys(current)){if(['__proto__','constructor','prototype'].includes(key))throw Error('不安全的存档字段');result[key]=mergeCitySnapshot(previous[key],current[key]);}return result;
}
export function createCitySession({storage,entry,ownsLock,validateSave,onStop=()=>{}}){
 let durable=clone(entry.save),expectedRaw=entry.raw,ready=false,stopped=false,failure=null,game=null,legacyVehicle=null,loadBlocked=false;
 let reservations=savedVehicleReservations(durable);
 const pendingPreferences=new Map(),historyWrapped=new WeakSet();
 const fail=error=>{if(stopped)return false;stopped=true;ready=false;failure=error??Error('候选游戏已停止');if(game){game.paused=true;try{game.resetControls?.();}catch{}}pendingPreferences.clear();try{onStop(failure);}catch{}return false;};
 const alive=()=>{if(stopped)return false;if(!ownsLock()||game?.physics?.failed||game?.physicsTransactions?.failed)return fail(game?.physics?.error??game?.physicsTransactions?.error??Error('存档锁或物理状态已失效'));return true;};
 const own=key=>{if(typeof key!=='string'||!(key.startsWith(CITY_PREFIX+':slot-'+entry.slot+':')||key===CITY_ACTIVE_KEY))throw Error('候选运行时禁止访问原存档或其他槽位');};
 const preference=key=>{own(key);if(key===entry.key)throw Error('完整进度只能由候选会话提交');};
 const guardedStorage={get length(){return keys(storage).filter(key=>key.startsWith(CITY_PREFIX+':slot-'+entry.slot+':')||key===CITY_ACTIVE_KEY).length;},key(index){return keys(storage).filter(key=>key.startsWith(CITY_PREFIX+':slot-'+entry.slot+':')||key===CITY_ACTIVE_KEY)[index]??null;},getItem(key){own(key);if(pendingPreferences.has(key))return pendingPreferences.get(key);return storage.getItem(key);},setItem(key,value){preference(key);if(!alive())throw Error('候选写入已停止');if(!ready||loadBlocked)pendingPreferences.set(key,String(value));else storage.setItem(key,String(value));},removeItem(key){preference(key);if(!alive())throw Error('候选写入已停止');if(!ready||loadBlocked)pendingPreferences.set(key,null);else storage.removeItem(key);},clear(){throw Error('候选运行时禁止清空浏览器存档');}};
 function restoreGameData(g,source=durable){
  game=g;g.transactions=clone(source.transactions??[]);g.vehicleStates=mergeCitySnapshot(source.vehicleStates??{},g.vehicleStates??{});g.vehicleFaults=mergeCitySnapshot(source.vehicleFaults??{},g.vehicleFaults??{});
  // A legacy save may acquire its first canonical ID during this exact load.
  // Bind its opaque fields to the restored object, never to another same-model car.
  legacyVehicle=source.vehicle?.instanceId===undefined&&same(source.vehicle,durable.vehicle)&&g.vehicle?.model?.id===source.vehicle.model?g.vehicle:null;
  if(source.aircraft&&g.aircraft&&!g.aircraft.aircraft)g.aircraft.savedState=clone(source.aircraft);
  if(!historyWrapped.has(g)&&typeof g.addMoney==='function'){
   const addMoney=g.addMoney;g.addMoney=function(...args){const full=this.transactions,result=Reflect.apply(addMoney,this,args);if(Array.isArray(full)&&this.transactions!==full)this.transactions=full;return result;};historyWrapped.add(g);
  }
  return g;
 }
 function mergeSnapshot(snapshot){
  const previous=clone(durable),old=previous.vehicle,next=snapshot.vehicle;
  previous.worldVehicleStates=worldFleetForSave(previous);
  // Opaque active-car fields belong to that identity, never its replacement.
  // Keep garage-car extensions in that model's existing save record as well.
  const known=new Set(['model','isGarageVehicle','instanceId','x','y','z','yaw','battery','condition','roadsterCharge','roadsterAirUnits','damageRegions','axleFault','brakeFault']);
  if(isGarageVehicleSave(old)&&old?.model){const extra=Object.fromEntries(Object.entries(old).filter(([key])=>!known.has(key)));if(Object.keys(extra).length){previous.vehicleStates??={};previous.vehicleStates[old.model]={condition:old.condition,battery:old.battery,...previous.vehicleStates[old.model],...extra};}}
  const restoredLegacy=old?.instanceId===undefined&&legacyVehicle&&[game?.vehicle,game?.aircraft?.personalVehicle,game?.aircraft?.entryContext?.vehicle,game?.robotaxi?.originalVehicle,game?.autonomyTest?.originalVehicle].includes(legacyVehicle)&&legacyVehicle.model.id===next?.model&&legacyVehicle.instanceId===next?.instanceId;
  if(old&&next&&(old.model!==next.model||old.instanceId!==next.instanceId&&!restoredLegacy)){
   const state=isGarageVehicleSave(next)?previous.vehicleStates?.[next.model]:snapshot.worldVehicleStates?.[next.instanceId]??previous.worldVehicleStates?.[next.instanceId];
   previous.vehicle=state?Object.fromEntries(Object.entries(state).filter(([key])=>!known.has(key))):{};
  }
  const merged=mergeCitySnapshot(previous,snapshot);merged.worldVehicleStates=mergeWorldFleets(previous.worldVehicleStates,worldFleetForSave(snapshot));assertSavedVehicleIdentities(merged);return merged;
 }
 function save(g=game,{notify=false}={}){
  game=g;if(!ready||loadBlocked||!alive())return false;
  try{
   const snapshot=mergeSnapshot(g.snapshot());validateBetaRaw(JSON.stringify(snapshot),validateSave);
   if(storage.getItem(entry.key)!==expectedRaw)throw Error('候选进度已被其他写入改变，未覆盖');
   if(!alive())return false;const next=JSON.stringify(snapshot);let writeError;try{storage.setItem(entry.key,next);}catch(error){writeError=error;}
   const actual=storage.getItem(entry.key);if(actual!==next)throw writeError??Error('候选保存结果未确认，已停止后续写入');
   expectedRaw=next;durable=clone(snapshot);reservations=savedVehicleReservations(durable);g.lastSave=g.time;
  }catch(error){fail(error);try{g.ui?.toast?.(error.message,'error');}catch{}return false;}
  // Notifications cannot undo a storage write that was already confirmed.
  try{g.ui?.setSaveStatus?.('原始城市候选副本已保存');}catch{}
  if(notify)try{g.ui?.toast?.('已保存独立候选副本；原存档未修改');}catch{}
  return true;
 }
 function markReady(g){game=g;if(loadBlocked)throw Error('存档仍在读取或等待重试，禁止启用写入');if(!alive()||!g.physics?.ready)throw failure??Error('物理尚未就绪，候选写入未启用');ready=true;try{for(const [key,value]of pendingPreferences){if(!alive())throw failure;if(value===null)storage.removeItem(key);else storage.setItem(key,value);}pendingPreferences.clear();}catch(error){fail(error);throw error;}return true;}
 function beginLoad(){if(!alive())throw failure??Error('候选写入已停止');loadBlocked=true;return true;}
 function completeLoad(g){if(!alive())throw failure??Error('候选写入已停止');loadBlocked=false;if(ready)markReady(g);return true;}
 return {slot:entry.slot,key:entry.key,source:clone(entry.record.source),storage:guardedStorage,read:()=>clone(durable),readRaw:()=>expectedRaw,reservedVehicleIds:()=>reservations,mergeSnapshot,restoreGameData,save,markReady,beginLoad,completeLoad,stop:fail,canWrite:()=>ready&&!loadBlocked&&alive(),get loadBlocked(){return loadBlocked;},get stopped(){return stopped;},get error(){return failure;},get ready(){return ready;}};
}
