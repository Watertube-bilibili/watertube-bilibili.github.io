// A bounded gameplay electronic limited-slip mode, not a manufacturer hardware
// differential simulation. Stable, explicitly AWD/all-terrain model whitelist.
export const OFFROAD_LOCK_MODELS=Object.freeze(['g9','nomad','b7','cybr']);
export const OFFROAD_LOCK_ENGAGE_SPEED=10/3.6;
export const OFFROAD_LOCK_RELEASE_SPEED=30/3.6;
export const supportsOffroadLock=v=>OFFROAD_LOCK_MODELS.includes(v?.model?.id??v?.id);
export function setOffroadDiffLock(v,enabled,{manual=true}={}){
 if(!supportsOffroadLock(v))return{ok:false,reason:'这款车没有电控差速锁游戏配置。'};
 if(!enabled){v.offroadDiffLockRequested=false;return{ok:true,reason:'电控差速锁已关闭。'};}
 if(!manual)return{ok:false,reason:'请先退出 Pilot，再启用电控差速锁。'};
 if(Math.abs(v.speed??0)>OFFROAD_LOCK_ENGAGE_SPEED)return{ok:false,reason:'请减速至 10 km/h 以下再启用。'};
 if(v.condition<=0||v.axleFault?.broken)return{ok:false,reason:'请先修复车辆再启用。'};
 v.offroadDiffLockRequested=true;return{ok:true,reason:'已请求电控差速锁：把驱动力分给仍有抓地的车轮，不增加总动力或轮胎抓地上限。'};
}
export function offroadDriveControls(v,input={}){
 if(!supportsOffroadLock(v)||Math.abs(v.speed??0)>OFFROAD_LOCK_RELEASE_SPEED||input.brakeSource==='pilot')v.offroadDiffLockRequested=false;
 return{offroadDiffLock:!!v.offroadDiffLockRequested&&supportsOffroadLock(v)};
}
export const offroadDriveSpawnConfig=v=>supportsOffroadLock(v)?{offroadDiffLockCapable:true}:{};
export function offroadDriveStatus(v){
 if(!supportsOffroadLock(v))return'此车型未配备';
 if(!v.offroadDiffLockRequested)return'关闭';
 return v.offroadDiffLockActive?'已启用':'等待物理引擎确认';
}
