// Only this world's initialization writes are staged. Never roll back a live key.
export function createBrowserWorldBootStorage({storage,key,lifecycle,lease}){
 const original=storage.getItem(key);if(original===null)throw Error('启动存档缺失，禁止重建');
 let pending=original,committed=false,cancelled=false,receipt=null,uncertain=null;
 const check=()=>{lifecycle.checkpoint();if(cancelled||!lease.ownsLock())throw Error('启动事务已取消或存档锁失效');};
 const own=k=>{if(k!==key)throw Error('启动事务禁止访问其他存档');};
 const writer=()=>{check();if(committed&&!lifecycle.writesEnabled)throw Error('完整进度尚未允许写入');};
 const adapter={getItem(k){own(k);check();return committed?storage.getItem(key):pending;},setItem(k,value){own(k);writer();if(committed)storage.setItem(key,String(value));else pending=String(value);}};
 return{storage:adapter,cancel(){cancelled=true;},get receipt(){return receipt;},commit(){
  if(uncertain)throw uncertain;
  check();if(committed)return true;
  if(storage.getItem(key)!==original)throw Error('启动期间原存档改变，拒绝覆盖');
  if(pending!==original){
   const target=pending;
   // Retain comparison bytes privately, even after cancellation. This receipt
   // can inspect the outcome but can never retry a write or resume the game.
   receipt=Object.freeze({key,inspect(){try{const raw=storage.getItem(key);return Object.freeze({outcome:raw===target?'applied':raw===original?'not-applied':'different'});}catch{return Object.freeze({outcome:'unavailable'});}}});
   let writeError;try{storage.setItem(key,target);}catch(error){writeError=error;}
   let observed;try{observed=storage.getItem(key);}catch{
    cancelled=true;uncertain=Object.assign(Error('启动保存结果暂时无法确认，已停止写入；请保留本页并稍后检查，禁止重建或回滚。'),{code:'BOOT_SAVE_UNCERTAIN'});throw uncertain;
   }
   if(observed!==target){if(writeError)throw writeError;throw Error('启动存档写入未能确认');}
  }
  committed=true;check();return true;
 },get committed(){return committed;}};
}
