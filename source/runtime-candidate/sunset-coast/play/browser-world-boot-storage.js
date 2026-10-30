// Only this world's initialization writes are staged. Never roll back a live key.
export function createBrowserWorldBootStorage({storage,key,lifecycle,lease}){
 const original=storage.getItem(key);if(original===null)throw Error('启动存档缺失，禁止重建');
 let pending=original,committed=false,cancelled=false;
 const check=()=>{lifecycle.checkpoint();if(cancelled||!lease.ownsLock())throw Error('启动事务已取消或存档锁失效');};
 const own=k=>{if(k!==key)throw Error('启动事务禁止访问其他存档');};
 const writer=()=>{check();if(committed&&!lifecycle.writesEnabled)throw Error('完整进度尚未允许写入');};
 const adapter={getItem(k){own(k);check();return committed?storage.getItem(key):pending;},setItem(k,value){own(k);writer();if(committed)storage.setItem(key,String(value));else pending=String(value);}};
 return{storage:adapter,cancel(){cancelled=true;},commit(){
  check();if(committed)return true;
  if(storage.getItem(key)!==original)throw Error('启动期间原存档改变，拒绝覆盖');
  if(pending!==original){
   try{storage.setItem(key,pending);}catch(error){if(storage.getItem(key)!==pending)throw error;}
   if(storage.getItem(key)!==pending)throw Error('启动存档写入未能确认');
  }
  committed=true;check();return true;
 },get committed(){return committed;}};
}
