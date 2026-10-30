import {createDeliveryStore} from './delivery-store.js';
import {validateWorldSnapshot} from './browser-world-slots.js';
export function browserRestoreBlocked(world,p){
 if(typeof world.blocked==='function')return world.blocked(p.x,p.z,p.y);
 if(!Array.isArray(world.colliders))throw Error('地图缺少恢复位置碰撞合同');
 return world.colliders.some(b=>{const c=Math.cos(b.yaw??0),s=Math.sin(b.yaw??0),dx=p.x-b.x,dz=p.z-b.z,x=dx*c-dz*s,z=dx*s+dz*c,base=b.baseY??0,top=base+(b.height??100);return Math.abs(x)<b.w+.3&&Math.abs(z)<b.d+.3&&p.y<top&&p.y+1.7>base;});
}
export function installBrowserWorldSnapshot(g,config){
 const snapshot=g.snapshot.bind(g),validate=g.validateSave.bind(g),load=g.load.bind(g);
 g.load=(notify=true,provided=null,persist=false)=>{
  if(!provided)return load(notify,provided,persist);
  validateWorldSnapshot(provided,config,validate);
  // Validate the stored floor before Game.load mutates any live state.
  g.world.update(provided.player,true);if(browserRestoreBlocked(g.world,provided.player))throw Error('玩家位置与地图几何冲突，原档保留');
  const ok=load(notify,provided,false);if(!ok)return false;
  g.playerPos.y=provided.player.y;g.transactions=structuredClone(provided.transactions??[]);
  if(!g.inCar)g.animateWalkingPerson(0);g.cameraAnchor=null;g.updateCamera(10);
  if(persist)return g.save(false);return true;
 };
 // The legacy HUD keeps eighteen rows; the full new-world ledger must not be
 // truncated by an unrelated runtime's display limit.
 g.addMoney=(amount,label)=>{g.money=Math.max(0,g.money+amount);g.transactions.unshift({label,amount,time:g.clockString()});g.ui.updateMoney();};
 g.snapshot=()=>{const s=snapshot();s.player.y=g.playerPos.y;s.browserWorld={version:2,map:config.map,backend:'browser'};return s;};
 // Validation includes map/capability before any real Game load or writer mutation.
 return s=>validateWorldSnapshot(s,config,validate);
}
export function installCrescentFullRuntime(g,{config,lease,storage,validate}){
 const baseLoad=g.load.bind(g);let store,blocked=false;
 const restore=s=>{validate(s);g.deliveryHost={restoring:true};try{if(!baseLoad(false,s,false))throw Error('完整玩家快照恢复失败');
  g.world.update(s.player,true);const y=s.player.y;
  if(browserRestoreBlocked(g.world,s.player))throw Error('玩家位置与地图几何冲突，原档保留');
  g.playerPos.set(s.player.x,y,s.player.z);g.playerYaw=s.player.yaw;g.cameraYaw=s.player.yaw;g.cameraAnchor=null;if(!g.inCar)g.animateWalkingPerson(0);g.updateCamera(10);
 }finally{g.deliveryHost.restoring=false;}};
 store=createDeliveryStore({storage,key:config.key,schema:config.schema,requireExisting:true,capture:()=>g.snapshot(),publish:()=>{},validateHost:validate,ownsLock:lease.ownsLock});
 const saved=store.initialize();restore(saved);
 g.load=(notify=true,provided=null)=>{try{if(provided)throw Error('导入尚未开放，请保留原备份');restore(store.rawRead());return true;}catch(e){blocked=true;g.paused=true;g.ui.toast(e.message,'error');return false;}};
 g.save=(notify=true)=>{if(blocked||!lease.ownsLock())return false;try{const ok=store.save();if(!ok)throw Error('保存版本冲突，未覆盖原档');g.lastSave=g.time;g.ui.setSaveStatus?.('弧湾完整玩家进度已保存');if(notify)g.ui.toast('弧湾完整玩家进度已保存');return true;}catch(e){blocked=true;g.paused=true;g.resetControls();g.ui.toast(e.message,'error');return false;}};
 g.acceptJob=()=>{g.ui.toast('弧湾职业路线尚未适配；不会使用旧城任务坐标','error');return false;};
 g.importSave=()=>{g.ui.toast('完整地图存档导入尚未开放；原档保留','error');return false;};
 g.exportSave=()=>{if(!g.save(false))return false;const blob=new Blob([JSON.stringify({format:'sunrise-browser-world-full-backup',version:2,map:config.map,slot:config.slot,snapshot:store.readDurable()})],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='sunrise-'+config.map+'-'+config.slot+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return true;};
 g.browserWorldStore=store;return store;
}
