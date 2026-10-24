// Bounded gameplay electronic limited-slip mode, not a manufacturer hardware
// differential simulation. Thresholds are game tuning, not real vehicle specs.
export const OFFROAD_LOCK_MODELS=Object.freeze(['g9','nomad','b7','cybr']);
export const OFFROAD_LOCK_ENGAGE_SPEED=50/3.6;
export const OFFROAD_LOCK_RELEASE_SPEED=60/3.6;
export const supportsOffroadLock=v=>OFFROAD_LOCK_MODELS.includes(v?.model?.id??v?.id);
// Full native chassis velocity, including side-slip/vertical motion, not wheel
// speed or the HUD's signed forward projection. Fallback is for pre-snapshot UI.
export const offroadChassisSpeed=v=>Number.isFinite(v?.offroadChassisSpeed)?Math.max(0,v.offroadChassisSpeed):Math.abs(v?.speed??0);
export function setOffroadDiffLock(v,enabled,{manual=true}={}){
 if(!supportsOffroadLock(v))return{ok:false,reason:'这款车没有电控差速锁游戏配置。'};
 if(!enabled){v.offroadDiffLockRequested=false;v.offroadDiffLockSuspended=null;return{ok:true,reason:'电控差速锁已关闭，不会自行重新开启。'};}
 if(!manual)return{ok:false,reason:'请先退出 Pilot，再预选电控差速锁。'};
 if(v.condition<=0||v.axleFault?.broken)return{ok:false,reason:'请先修复车辆再启用。'};
 v.offroadDiffLockRequested=true;v.offroadDiffLockSuspended=null;
 return{ok:true,reason:offroadChassisSpeed(v)>OFFROAD_LOCK_ENGAGE_SPEED?'已预选：降至 50 km/h 自动接合，无需再次开关。':'已请求电控差速锁：30–50 km/h 上坡保持可用；超过 60 km/h 暂停，降至 50 km/h 自动恢复。'};
}
export function offroadDriveControls(v,input={}){
 if(!supportsOffroadLock(v)){v.offroadDiffLockRequested=false;return{offroadDiffLock:false};}
 // Suspension never discards the driver's selection. Native code owns speed
 // hysteresis, so a stale browser snapshot cannot re-engage above the limit.
 v.offroadDiffLockSuspended=input.offroadDriverPresent===false?'driver':input.brakeSource==='pilot'?'pilot':v.condition<=0||v.axleFault?.broken?'damage':null;
 return{offroadDiffLock:!!v.offroadDiffLockRequested&&!v.offroadDiffLockSuspended};
}
export const offroadDriveSpawnConfig=v=>supportsOffroadLock(v)?{offroadDiffLockCapable:true}:{};
export function offroadDriveStatus(v,{manual=true,driver=true}={}){
 if(!supportsOffroadLock(v))return'此车型未配备';
 if(!v.offroadDiffLockRequested)return'关闭';
 if(!driver||v.offroadDiffLockSuspended==='driver')return'已预选 · 等待驾驶员上车';
 if(!manual||v.offroadDiffLockSuspended==='pilot')return'已预选 · Pilot 中暂停';
 if(v.condition<=0||v.axleFault?.broken||v.offroadDiffLockSuspended==='damage')return'已预选 · 车辆需维修';
 const speed=offroadChassisSpeed(v);
 if(speed>OFFROAD_LOCK_RELEASE_SPEED||(!v.offroadDiffLockActive&&speed>OFFROAD_LOCK_ENGAGE_SPEED))return'已预选 · 降至 50 km/h 自动接合';
 return v.offroadDiffLockActive?'已接合':'已预选 · 等待物理引擎接合';
}
export function offroadDriveHudLabel(v,options){
 if(!supportsOffroadLock(v)||!v.offroadDiffLockRequested)return'';
 const status=offroadDriveStatus(v,options);
 return status==='已接合'?' · 电控差速锁已接合':status.includes('50 km/h')?' · 差速锁待命 ≤50 km/h':status.includes('Pilot')?' · 差速锁待命/Pilot':status.includes('维修')?' · 差速锁待命/维修':' · 差速锁已预选';
}
