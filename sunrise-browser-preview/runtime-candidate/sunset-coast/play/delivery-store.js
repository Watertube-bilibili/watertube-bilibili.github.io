import {validateDeliverySnapshot} from './delivery-career.mjs';
import {ESTUARY_DELIVERY_OFFERS,ESTUARY_DELIVERY_CATALOG} from './delivery-offers.js';
export const DELIVERY_SAVE_KEY=new URLSearchParams(globalThis.location?.search??'').get('physics')==='browser'?'sunrise:browser-physics:20261030:delivery':'sunrise:isolated-delivery:estuary:v1:qa-player';
export const DELIVERY_SAVE_SCHEMA=Object.freeze({version:1,map:'estuary',catalog:ESTUARY_DELIVERY_CATALOG,playerId:'isolated-delivery-player'});
const clone=v=>structuredClone(v);
// Preserve extension fields the legacy host does not know about. Arrays and
// explicit null values are authoritative; they are not concatenated/filled.
export function mergeCompleteSnapshot(previous,current){
 if(!previous||!current||typeof previous!=='object'||typeof current!=='object'||Array.isArray(previous)||Array.isArray(current))return clone(current);
 const result=clone(previous);for(const key of Object.keys(current)){
  if(['__proto__','prototype','constructor'].includes(key))throw Error('不安全的存档字段');
  result[key]=mergeCompleteSnapshot(previous[key],current[key]);
 }return result;
}
export function validateDeliveryHost(s,validateHost=()=>{},schema=DELIVERY_SAVE_SCHEMA) {
 validateHost(s);validateDeliverySnapshot(s,{allowMissing:true,offerCatalog:ESTUARY_DELIVERY_OFFERS});
 if(JSON.stringify(s.deliveryHost)!==JSON.stringify(schema))throw Error('外卖测试存档版本、地图或目录不兼容；原档未覆盖');
 if(s.deliveryCareer?.active&&s.deliveryCareer.active.ownerId!==schema.playerId)throw Error('外卖订单角色身份不匹配，原档未覆盖');
 if(s.deliveryCareer?.active&&s.job)throw Error('存档包含冲突职业；原档未覆盖');
 return s;
}
/** One complete key, protected by a lifecycle Web Lock. No beta/ULTRA keys. */
export function createDeliveryStore({storage,key=DELIVERY_SAVE_KEY,capture,publish,validateHost,ownsLock=()=>false,schema=DELIVERY_SAVE_SCHEMA,requireExisting=false}) {
 let durable=null,view=null,busy=false;
 const check=s=>validateDeliveryHost(s,validateHost,schema);
 const rawRead=()=>{const raw=storage.getItem(key);return raw===null?null:check(JSON.parse(raw));};
 const initialize=()=>{if(!ownsLock())throw Error('未持有外卖测试存档锁');durable=rawRead();if(!durable){if(requireExisting)throw Error('存档缺失，拒绝重建覆盖');durable={...capture(),deliveryHost:clone(schema),saveRevision:0};check(durable);storage.setItem(key,JSON.stringify(durable));}return clone(durable);};
 const compose=()=>({...mergeCompleteSnapshot(durable,capture()),deliveryHost:clone(schema),saveRevision:durable.saveRevision,deliveryCareer:clone(durable.deliveryCareer)});
 const read=()=>clone(view??durable);
 function commit(next,{expectedRevision}) {
  if(!ownsLock()||busy)return false;
  busy=true;
  try {
   const current=rawRead();
   if(!current||current.saveRevision!==expectedRevision){if(current)durable=current;view=clone(durable);return false;}
   check(next);
   try{storage.setItem(key,JSON.stringify(next));}
   catch(error){
    // A synchronous adapter may write and then throw. Establish the actual outcome.
    const observed=rawRead();if(observed&&JSON.stringify(observed)===JSON.stringify(next)){durable=observed;view=clone(observed);publish(clone(observed));return true;}
    if(observed){durable=observed;view=clone(observed);}throw error;
   }
   durable=clone(next);view=clone(next);publish(clone(next));return true;
  }finally{busy=false;}
 }
 function scope(fn){if(view)throw Error('重入外卖存档操作');view=compose();try{return fn();}finally{view=null;}}
 function save(){return scope(()=>{const next=read();next.saveRevision++;return commit(next,{expectedRevision:durable.saveRevision});});}
 return {initialize,scope,read,commit,save,readDurable:()=>clone(durable),rawRead};
}
export async function acquireDeliveryLease({locks=globalThis.navigator?.locks,window=globalThis.window}={}) {
 if(!locks?.request)throw Error('安全存档锁不可用，外卖测试未启动');
 let owned=false,release,resolveReady,rejectReady;
 const ready=new Promise((r,j)=>{resolveReady=r;rejectReady=j;}),done=new Promise(r=>release=r);
 const task=locks.request(DELIVERY_SAVE_KEY,{ifAvailable:true},async lock=>{
  if(!lock){rejectReady(Error('该外卖测试存档已在另一标签页使用；请先关闭那一页'));return;}
  owned=true;resolveReady({ownsLock:()=>owned,release:()=>{owned=false;release();}});await done;owned=false;
 });task.catch(rejectReady);
 window.addEventListener('pagehide',()=>{owned=false;release();},{once:true});
 window.addEventListener('pageshow',event=>{if(event.persisted)window.location.reload();});
 return ready;
}
