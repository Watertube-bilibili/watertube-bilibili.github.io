import {createDeliveryCareer} from './delivery-career.mjs';
import {ESTUARY_DELIVERY_OFFERS} from './delivery-offers.js';
import {createDeliveryStore,DELIVERY_SAVE_KEY,validateDeliveryHost,mergeCompleteSnapshot} from './delivery-store.js';
import {requestedEstuary} from './estuary-save-slots.js';
import {mountDeliveryUI} from './delivery-ui.js';
export function deliveryRequested(search=globalThis.location?.search??'') {const p=new URLSearchParams(search);return p.get('runtime')==='browser'&&p.get('world')==='estuary'||requestedEstuary(search)||p.get('preview')==='1'&&p.get('map')==='estuary'&&p.get('delivery')==='1';}
export function installDeliveryRuntime(g,{lease,storage=globalThis.localStorage,document=globalThis.document,mountUI=mountDeliveryUI,config=null}={}) {
 if(!deliveryRequested()||g.delivery)return;
 const base=Object.fromEntries(['snapshot','load','save','setDestination','clearDestination','acceptJob','addMoney','buyCar','spawnCar','repair','cheat','respawn','teleportTo','physicsTick','animateEntry'].filter(k=>typeof g[k]==='function').map(k=>[k,g[k].bind(g)]));
 let restoring=false,depth=0,footSpeed=0,lastExited=null,blocked=null,navMutation=false,store;
 g.deliveryHost={restoring:false};g.deliveryNavigation={owned:false,previous:null};
 const history=[];const event=(kind,detail={})=>{history.push({kind,tick:g.physics?.lastTick??0,time:g.time,position:{x:g.position.x,z:g.position.z},inCar:g.inCar,...detail});if(history.length>1600)history.shift();};
 const freeze=message=>{blocked=String(message);g.paused=true;g.resetControls();g.ui.toast('外卖存档已暂停：'+blocked+'；请重载恢复，原存档不会重置','error');};
 const writable=()=>!blocked&&!g.physics?.failed&&!g.browserWorldLifecycle?.stopped;
 const rejectFailed=()=>{if(!writable()){if(!blocked)freeze('物理或游戏生命周期已失败，禁止写入');return true;}return false;};
 const active=()=>!!store?.readDurable()?.deliveryCareer?.active;
 const actor=()=>({playerId:config?.schema.playerId??'isolated-delivery-player',x:g.position.x,z:g.position.z,inVehicle:!!g.inCar,speedMps:g.inCar?Math.hypot(g.vehicle.speed??0,g.vehicle.lateralSpeed??0):footSpeed,lastVehicleSpeedMps:lastExited?Math.hypot(lastExited.speed??0,lastExited.lateralSpeed??0):null,transitioning:!!g.transition,paused:!!(g.paused||document.hidden||blocked),busy:!!(g.job||g.autonomyTest?.active||g.robotaxi?.active||g.aircraft?.active||g.flight?.active)});
 const publish=s=>{g.money=s.money;g.transactions=structuredClone(s.transactions??[]);g.jobsCompleted=s.jobsCompleted??0;};
 store=createDeliveryStore({storage,...(config?{key:config.key,schema:config.schema,requireExisting:true}:{}),capture:()=>({...base.snapshot(),deliveryNavigation:structuredClone(g.deliveryNavigation)}),publish,validateHost:s=>g.validateSave(s),ownsLock:lease.ownsLock,canWrite:writable});
 const saved=store.initialize();
 if(saved.deliveryCareer||config){
  validateDeliveryHost(saved,s=>g.validateSave(s),config?.schema);restoring=true;g.deliveryHost.restoring=true;
  try{if(!base.load(false,saved,false))throw Error('无法恢复完整外卖存档');g.deliveryNavigation=structuredClone(saved.deliveryNavigation??{owned:false,previous:null});publish(saved);}
  finally{restoring=false;g.deliveryHost.restoring=false;}
 }
 const navigate=(target,ctx)=>{
  if(!g.deliveryNavigation.owned)return;
  navMutation=true;
  try{
   if(target)base.setDestination(target,false);
   else{const previous=g.deliveryNavigation.previous;if(previous)base.setDestination(previous,false);else base.clearDestination();g.deliveryNavigation={owned:false,previous:null};}
  }finally{navMutation=false;}
  event('navigation',{target,orderId:ctx.orderId,phase:ctx.phase});
 };
 const core=createDeliveryCareer({readSnapshot:store.read,commitSnapshot:store.commit,getActor:actor,navigate,offerCatalog:ESTUARY_DELIVERY_OFFERS});
 const result=store.scope(()=>core.initialize());if(!result.ok)throw Error(result.message);
 if(saved.deliveryCareer){const r=store.scope(()=>core.restore());if(!r.ok)throw Error(r.message);}
 const flush=(notify=false)=>{
  if(restoring||depth)return true;
  if(rejectFailed()||!lease.ownsLock())return false;
  try{if(!store.save())throw Error('完整存档写入冲突或锁已失效');g.lastSave=g.time;if(notify)g.ui.toast(config?'已保存当前新地图进度':'已保存隔离外卖测试进度（不读取个人存档）');return true;}
  catch(e){freeze(e.message);return false;}
 };
 function invoke(method,...args){
  if(!lease.ownsLock()){freeze('存档锁已失效');}if(rejectFailed())return{ok:false,code:'SAVE_BLOCKED',message:blocked};
  const previous=structuredClone(g.deliveryNavigation);
  if(method==='accept')g.deliveryNavigation={owned:true,previous:g.destination?structuredClone(g.destination):null};
  if(method==='refreshNavigation'&&active()&&!g.deliveryNavigation.owned)g.deliveryNavigation={owned:true,previous:g.destination?structuredClone(g.destination):null};
  let r;
  try{r=store.scope(()=>core[method](...args));}catch(e){r={ok:false,code:'SAVE_UNCERTAIN',message:e.message};}
  if(!r.ok){if(method==='accept'||method==='refreshNavigation')g.deliveryNavigation=previous;if(/^SAVE_|INVALID_SAVE/.test(r.code))freeze(r.message);}
  if(!['status','advance'].includes(method)){event(method,{args,result:r,money:g.money});if(r.ok)flush();g.ui.updateMoney();g.ui.updateAll?.();}
  return r;
 }
 const facade={};for(const key of Object.keys(core))facade[key]=(...args)=>invoke(key,...args);
 g.delivery=Object.freeze(facade);g.deliveryEvidence=()=>({actualGame:true,backend:g.physics?.backend,nativeTick:g.physics?.lastTick,position:{x:g.position.x,z:g.position.z},inCar:g.inCar,vehicle:g.vehicle.model.id,actor:actor(),delivery:g.delivery.status(),snapshot:store.readDurable(),navigation:g.destination,loadedChunks:[...g.world.chunks.keys()],history:structuredClone(history),storageKeys:Object.keys(storage),saveKey:config?.key??DELIVERY_SAVE_KEY,blocked});
 g.snapshot=()=>({...mergeCompleteSnapshot(store.readDurable(),base.snapshot()),deliveryHost:store.readDurable().deliveryHost,saveRevision:store.readDurable().saveRevision,deliveryCareer:store.readDurable().deliveryCareer,deliveryNavigation:structuredClone(g.deliveryNavigation)});
 g.save=flush;
 g.load=(notify=true)=>{if(notify)g.ui.toast(config?'请刷新恢复当前新地图完整存档；旧城存档保持不变':'外卖测试请刷新恢复自己的完整测试存档；旧地图存档禁止混入');return false;};
 g.importSave=()=>{g.ui.toast(config?'新地图暂不支持导入或回退备份，旧城存档不会被覆盖':'此隔离候选禁用外部导入，个人进度未读取');return false;};
 g.exportSave=()=>{if(!config){g.ui.toast('此隔离候选不导出旧地图格式；测试证据单独记录');return false;}if(!flush())return false;const blob=new Blob([JSON.stringify({format:'sunrise-estuary-full-backup',version:1,slot:config.slot,snapshot:store.readDurable()})],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='sunrise-estuary-'+config.slot+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return true;};
 const conflict=()=>{event('career-conflict',{activeOrderId:store.readDurable().deliveryCareer?.active?.orderId});g.ui.toast('请先完成或取消外卖订单，再开始其他职业或行程');return{ok:false,reason:'外卖订单进行中'};};
 g.acceptJob=(...args)=>active()?conflict():hostMutation('acceptJob',args);
 for(const service of [g.autonomyTest,g.robotaxi,g.aircraft,g.flight])for(const method of ['start','board','request','requestRide'])if(typeof service?.[method]==='function'){const original=service[method].bind(service);service[method]=(...args)=>active()?conflict():original(...args);}
 function hostMutation(method,args){if(!lease.ownsLock()){freeze('存档锁已失效');}if(rejectFailed())return false;depth++;let r;try{r=base[method](...args);}finally{depth--;if(!depth)flush();}return r;}
 for(const method of ['addMoney','buyCar','spawnCar','repair','cheat'])if(base[method])g[method]=(...args)=>hostMutation(method,args);
 g.respawn=(...args)=>{if(active()){const r=g.delivery.fail(store.readDurable().deliveryCareer.active.orderId,'player-unavailable');if(!r.ok)return false;}return hostMutation('respawn',args);};
 g.teleportTo=(...args)=>active()?(g.ui.toast('外卖期间不能传送；请先取消订单'),false):base.teleportTo(...args);
 g.setDestination=(...args)=>{if(active()&&!navMutation&&!restoring){g.deliveryNavigation.owned=false;event('manual-navigation',{target:args[0]});}const r=base.setDestination(...args);if(!restoring)flush();return r;};
 g.clearDestination=(...args)=>{if(active()&&!navMutation&&!restoring)g.deliveryNavigation.owned=false;const r=base.clearDestination(...args);if(!restoring)flush();return r;};
 g.animateEntry=dt=>{const exiting=g.transition&&!g.transition.entering,car=g.vehicle;const r=base.animateEntry(dt);if(exiting&&!g.transition&&!g.inCar){lastExited=car;footSpeed=0;event('exit-vehicle',{instanceId:car.instanceId});}return r;};
 g.physicsTick=dt=>{
  if(rejectFailed()||document.hidden||!lease.ownsLock()){g.paused=true;g.resetControls();return;}
  if(active()){const r=g.delivery.advance(dt*1000,{paused:g.paused||document.hidden});if(!r.ok){freeze(r.message);return;}}
  const before={x:g.playerPos.x,z:g.playerPos.z},wasInCar=g.inCar;
  base.physicsTick(dt);footSpeed=g.inCar?0:Math.hypot(g.playerPos.x-before.x,g.playerPos.z-before.z)/Math.max(dt,.00001);
  if(g.physics.lastTick%60===0)event('movement',{footSpeed,vehicleSpeed:g.vehicle.speed,chunk:[Math.floor(g.position.x/400),Math.floor(g.position.z/400)],phase:store.readDurable().deliveryCareer?.active?.phase??null});
  if(wasInCar!==g.inCar)event('travel-mode',{mode:g.inCar?'vehicle':'foot'});
 };
 window.addEventListener('pagehide',()=>{g.paused=true;g.resetControls();},{once:true});
 mountUI(g,{production:!!config,offers:ESTUARY_DELIVERY_OFFERS,onEvidence:()=>event('ui-evidence')});
 event(saved.deliveryCareer?'restored':'initialized');flush();return g.delivery;
}
