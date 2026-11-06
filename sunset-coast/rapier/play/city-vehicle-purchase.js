import {releaseVehicleFactory,beginVehicleConstruction,endVehicleConstruction,cleanupVehicleConstruction} from './vehicle-factory-ownership.js';
import {Scene} from './vendor/three.module.js';
import {MODELS} from './world.js';
import {roadsterFlightLocked} from './roadster-controls.js';
import {vehicleAssetReady} from './vehicle-asset-registry.js';
import {queueVehicleAssetAction,cancelPendingVehicleAsset} from './vehicle-asset-flow.js';
import {resetVehicleDynamics} from './vehicle-physics.js';
import {resetVehiclePose} from './render-motion.js';
import {resetDrivingAssist} from './driving-assist.js';
import {disposeVehicleLights} from './vehicle-lights.js';
import {disposeVehicleInstruments} from './vehicle-instruments.js';
import {disposeVehicleDamage} from './vehicle-damage.js';
import {disposeRoadsterJets} from './roadster-jets.js';
import {isControlledWorldVehicle,parkControlledWorldVehicle,worldGarageRecallPosition} from './world-fleet.js';

const defaults={models:MODELS,vehicleAssetReady,queueVehicleAssetAction,cancelPendingVehicleAsset};
const clone=value=>structuredClone(value??{});
const disposers=[disposeVehicleInstruments,disposeVehicleLights,disposeRoadsterJets,disposeVehicleDamage,releaseVehicleFactory];
function discard(prepared,scene,construction){
 if(construction)cleanupVehicleConstruction(construction,{disposeVehicleInstruments,disposeVehicleLights,disposeRoadsterJets,disposeVehicleDamage});
 // Never traverse/dispose shared model geometries or materials. The existing
 // instance services own their clones; a partial constructor may only have a root.
 if(prepared?.root?.parent===scene)for(const dispose of disposers)try{dispose(prepared);}catch{}
 for(const root of [...scene.children])root.removeFromParent();
}
const unavailable=game=>game.physics?.failed===true||game.physics?.disposed===true;
const fail=(game,message)=>{game.ui.toast(message,'error');return false;};

/** Original-city purchase/recall. The actual Game factory runs on a private
 * Scene and private garage books before payment, ride reset or old-car disposal.
 * Detailed recalls retain the live object and mesh; simple recalls retain the
 * live object while receiving an already-constructed detailed mesh.
 */
export function spawnCityVehicle(game,id,dependencies={}){
 const d={...defaults,...dependencies};
 if(unavailable(game))return fail(game,'物理后端已停止，请重新载入后更换车辆');
 if(roadsterFlightLocked(game.vehicle))return fail(game,'请先着陆再更换车辆');
 if(game.aircraft?.active||game.autonomyTest?.active)return fail(game,'请先结束飞行或路测工作');
 if(game.flight?.active)return fail(game,'请等待航程结束');
 const model=d.models.find(m=>m.id===id);if(!model)return false;
 const buying=!game.owned.includes(id),price=buying?model.price:0;
 if(!Number.isFinite(game.money)||!Number.isFinite(price)||price<0)return fail(game,'购车账户状态无效，未更换车辆');
 if(game.money<price)return fail(game,'余额不足，还差 $'+(price-game.money).toLocaleString());
 if(!d.vehicleAssetReady(id))return d.queueVehicleAssetAction(game,id,'spawn',()=>game.spawnCar(id),model.name);
 d.cancelPendingVehicleAsset(game);

 const scene=new Scene(),construction=beginVehicleConstruction();let prepared,shadow,recalled,financial,safePosition;
 try{
  for(const name of ['makeVehicle','rememberBrakeFault','captureGarageVehicle']){
   if(typeof game[name]!=='function'||game[name].name.startsWith('bound '))throw Error('车辆工厂无法安全准备，请重新载入');
  }
  // reset() restores the personal vehicle when leaving a Robo Taxi. Do not
  // cancel that ride merely because construction of the requested car fails.
  const previous=game.robotaxi?.passenger?(game.robotaxi.originalVehicle??game.personalVehicle??game.vehicle):game.vehicle;
  recalled=[...new Set([previous,...(game.traffic??[])])].find(v=>game.isGarageCar(v)&&v.model.id===id);
  shadow=Object.create(game);
  Object.assign(shadow,{scene,vehicle:previous,vehicleStates:clone(game.vehicleStates),worldVehicleStates:clone(game.worldVehicleStates),vehicleFaults:clone(game.vehicleFaults),roadsterAirLedger:clone(game.roadsterAirLedger),vehicleSerial:game.vehicleSerial});
  Reflect.apply(game.rememberBrakeFault,shadow,[]);
  if(!recalled||recalled.simple){
   const pos=game.position;
   prepared=Reflect.apply(game.makeVehicle,shadow,[id,pos.x,pos.z,game.yaw,false,recalled?.paintColor??null,{isGarageVehicle:true}]);
   if(!prepared?.root?.isObject3D||prepared.root.parent!==scene||prepared.model?.id!==id||prepared.instanceId!=='garage:'+id||![prepared.pos?.x,prepared.pos?.y,prepared.pos?.z,prepared.yaw].every(Number.isFinite))throw Error('车型创建结果无效');
  }
  safePosition=worldGarageRecallPosition(game,prepared??recalled,previous);
  if(unavailable(game))throw Error('物理后端已停止');
  if(!Array.isArray(game.transactions))throw Error('购车账户记录无效');
  financial={money:game.money-price,owned:buying?[...game.owned,id]:game.owned,transactions:price>0?[{label:'购买 '+model.name,amount:-price,time:game.clockString()},...game.transactions]:game.transactions};
 }catch(error){
  discard(prepared,scene,construction);
  return fail(game,'车辆准备失败：'+String(error?.message??error)+'；未扣费或改动存档');
 }finally{endVehicleConstruction(construction);}

 // All fallible model construction is complete. Preserve the original service
 // exit and recall placement rules before committing the prepared purchase.
 try{game.robotaxi?.reset();}catch(error){discard(prepared,scene,construction);return fail(game,'接送服务无法结束：'+String(error?.message??error)+'；未扣费');}
 if(unavailable(game)){discard(prepared,scene,construction);return fail(game,'物理后端已停止，未扣费');}
 const pos=safePosition??game.position.clone(),yaw=game.yaw,previous=game.vehicle;
 game.cancelEntry();
 game.vehicleStates=shadow.vehicleStates;game.worldVehicleStates=shadow.worldVehicleStates;game.vehicleFaults=shadow.vehicleFaults;game.roadsterAirLedger=shadow.roadsterAirLedger;
 const candidates=[...new Set([previous,...(game.traffic??[])])].filter(v=>game.isGarageCar(v)&&v.model.id===id);
 for(const duplicate of candidates)if(duplicate!==recalled)game.removeVehicle(duplicate);
 if(previous!==recalled&&!candidates.includes(previous)){if(isControlledWorldVehicle(game,previous))parkControlledWorldVehicle(game,previous);else game.removeVehicle(previous);}
 if(recalled){
  if(prepared){
   for(const dispose of disposers)dispose(recalled);
   recalled.root.removeFromParent();
   // Keep references held by the garage/physics services and its stable ID.
   const instanceId=recalled.instanceId;Object.assign(recalled,prepared);recalled.instanceId=instanceId;
   game.scene.add(recalled.root);
  }
  game.vehicle=recalled;game.traffic=(game.traffic??[]).filter(v=>v!==recalled);
  recalled.parked=false;recalled.populationProtected=false;recalled.pos.copy(pos);recalled.yaw=yaw;recalled.speed=0;recalled.root.rotation.y=yaw;recalled.root.visible=true;
  resetVehicleDynamics(recalled);resetVehiclePose(recalled);
 }else{
  prepared.pos.set(pos.x,safePosition?pos.y:(game.world?.groundHeight?.(pos.x,pos.z)??0)+.02,pos.z);prepared.yaw=yaw;prepared.root.rotation.y=yaw;
  game.vehicle=prepared;game.scene.add(prepared.root);
 }
 game.money=financial.money;game.owned=financial.owned;game.transactions=financial.transactions;
 if(price>0)game.ui.updateMoney();
 game.nearestCar=game.vehicle;game.inCar=true;game.person.root.visible=game.vehicle.kind==='motorcycle'&&game.cameraMode!==1;if(game.vehicle.kind==='motorcycle')globalThis.document?.getElementById?.('interaction')?.classList.remove('show');game.transition=null;game.autopilot=false;
 game.pilot?.reset();game.sensor.reset?.();resetDrivingAssist(game);
 if(game.destination)game.replan();
 game.ui.updateAll();game.ui.toast(model.name+' 已就绪');game.save(false);return true;
}
