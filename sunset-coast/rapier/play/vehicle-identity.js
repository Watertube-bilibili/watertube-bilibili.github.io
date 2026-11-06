import {isWorldVehicleId,isGarageVehicleSave,WORLD_VEHICLE_LIMIT,assertWorldFleetIdentities,worldFleetForSave,mergeWorldFleets} from './world-fleet-state.js';
export {isWorldVehicleId,isGarageVehicleSave} from './world-fleet-state.js';
// Saved ownership is an identity claim, not a hint for the allocator. This
// module is data-only so import validation and the actual factory share rules.
// Existing imports may have nonnumeric suffixes (including additional colons).
// Newly allocated IDs remain numeric; valid legacy spellings stay byte-exact.
export function savedVehicleInstanceId(v){
 if(v?.isGarageVehicle!==undefined&&typeof v.isGarageVehicle!=='boolean')throw Error('车辆身份存档无效');
 const garage=isGarageVehicleSave(v),id=v?.instanceId;
 if(id===undefined)return garage?'garage:'+v?.model:null;
 if(garage?id!=='garage:'+v?.model:!isWorldVehicleId(id))throw Error('车辆身份编号与归属不一致');
 return id;
}
export function validLedgerIdentity(id,model){return isWorldVehicleId(id)||id==='garage:'+model;}
export function assertSavedVehicleIdentities(save){
 const id=savedVehicleInstanceId(save?.vehicle),ledger=save?.roadsterAirLedger??{};
 if(id&&Object.hasOwn(ledger,id)&&ledger[id]?.model!==save?.vehicle?.model)throw Error('车辆身份与储气罐账本车型冲突');
 if(id===null&&Object.entries(ledger).some(([key,record])=>isWorldVehicleId(key)&&record?.model===save.vehicle.model))throw Error('世界车辆缺少实例编号，无法确定储气罐账本归属');
 for(const [model,state] of Object.entries(save?.vehicleStates??{})){
  if(state?.instanceId!==undefined&&state.instanceId!=='garage:'+model||state?.isGarageVehicle!==undefined&&state.isGarageVehicle!==true||state?.model!==undefined&&state.model!==model)throw Error('车库车况包含冲突的车辆身份');
 }
 assertWorldFleetIdentities(save?.worldVehicleStates);
 const fleet=worldFleetForSave(save);
 if(id===null&&Object.keys(fleet).length>=WORLD_VEHICLE_LIMIT)throw Error('已使用世界车辆最多保留 128 辆；未删除任何记录');
 if(id===null&&Object.values(fleet).some(record=>record.model===save.vehicle.model))throw Error('世界车辆缺少实例编号，无法确定已用车辆归属');
 for(const [key,record] of Object.entries(fleet))if(ledger[key]&&ledger[key].model!==record.model)throw Error('世界车辆与储气罐账本车型冲突');
}
export function identityVehicles(game){
 return [...new Set([game.vehicle,game.personalVehicle,game.robotaxi?.taxi,game.robotaxi?.originalVehicle,game.aircraft?.personalVehicle,game.aircraft?.entryContext?.vehicle,game.autonomyTest?.originalVehicle,game.autonomyTest?.workVehicle,...(game.traffic??[]),...(game.police??[]),...(game.allVehicles?.()??[])].filter(v=>v&&v.kind!=='aircraft'))];
}
export function assertVehicleOwners(game){
 const owners=new Map();
 for(const v of identityVehicles(game)){
  if(v.instanceId===undefined)continue;
  if(owners.has(v.instanceId))throw Error('多个车辆占用了相同实例编号：'+v.instanceId);
  owners.set(v.instanceId,v);
  const record=game.roadsterAirLedger?.[v.instanceId];
  if(record&&record.model!==v.model?.id)throw Error('车辆身份与储气罐账本车型冲突');
 }
 return owners;
}
export function assertVehicleLoadIdentity(game,save,currentFleet=game.worldVehicleStates){
 // Session saves retain omitted dormant accounts. Build the same effective
 // inventory before allocating/restoring anything: explicit provided records
 // override current records, which override the last durable save. A model may
 // never change under an existing ID, even when a later layer would hide it.
 const ledger=Object.create(null),durable=game.citySession?.read?.();
 for(const layer of [durable?.roadsterAirLedger,game.roadsterAirLedger,save.roadsterAirLedger])for(const [id,record]of Object.entries(layer??{})){
  if(ledger[id]&&ledger[id].model!==record?.model)throw Error('保留账本中的车辆实例车型冲突');
  ledger[id]={...ledger[id],...structuredClone(record)};
 }
 const fleet=mergeWorldFleets(worldFleetForSave(durable),currentFleet,worldFleetForSave(save));
 const prepared={...save,roadsterAirLedger:ledger,worldVehicleStates:fleet};
 assertSavedVehicleIdentities(prepared);
 const owners=assertVehicleOwners(game),id=savedVehicleInstanceId(save.vehicle),owner=id?owners.get(id):null;
 if(owner&&owner.model?.id!==save.vehicle.model)throw Error('存档车辆实例编号与现有车型冲突');
 // Mirror Game.load's aircraft -> autonomy -> taxi reset order without calling
 // services or mutating anything. These exact service objects are retired; an
 // arbitrary personalVehicle/traffic reference does not get an exemption.
 let current=game.aircraft?.entryContext?.vehicle??game.vehicle;
 const retiring=new Set();
 if(game.autonomyTest?.workVehicle){retiring.add(game.autonomyTest.workVehicle);if(game.autonomyTest.originalVehicle)current=game.autonomyTest.originalVehicle;}
 if(game.robotaxi?.taxi)retiring.add(game.robotaxi.taxi);
 if(game.robotaxi?.originalVehicle)current=game.robotaxi.originalVehicle;
 retiring.add(current);
 for(const [key,v] of owners)if(Object.hasOwn(game.worldVehicleStates??{},key))retiring.add(v);
 if(owner&&!retiring.has(owner))throw Error('存档车辆实例编号已被另一辆车占用：'+id);
 for(const [key,record] of Object.entries(ledger)){
  const live=owners.get(key);
  if(live&&!retiring.has(live)&&record.model!==live.model?.id)throw Error('存档账本与现有车辆身份冲突');
 }
 for(const [key,record] of Object.entries(fleet)){
  const live=owners.get(key);
  if(live&&(live.model?.id!==record.model||!retiring.has(live)))throw Error('存档世界车辆实例已被另一辆车占用：'+key);
 }
 return prepared;
}
export function nextVehicleInstanceId(game,requested=null){
 const used=new Set(assertVehicleOwners(game).keys());
 if(requested!==null&&requested!==undefined){
  if(!isWorldVehicleId(requested))throw Error('车辆实例编号无效');
  if(used.has(requested))throw Error('车辆实例编号已被占用：'+requested);
  return requested;
 }
 // Derive reservations from the durable source even before Game.load runs.
 // No shared mutable registry can leak out of a failed prepared purchase.
 const reserved=game.citySession?.reservedVehicleIds?.()??savedVehicleReservations(game.citySession?.read?.());
 for(const id of [...Object.keys(game.roadsterAirLedger??{}),...Object.keys(game.worldVehicleStates??{}),...reserved])used.add(id);
 let id;do{game.vehicleSerial=(game.vehicleSerial??0)+1;id='world:'+game.vehicleSerial;}while(used.has(id));return id;
}
export function savedVehicleReservations(save){
 const id=save?.vehicle?savedVehicleInstanceId(save.vehicle):null;
 return Object.freeze([...new Set([...Object.keys(save?.roadsterAirLedger??{}),...Object.keys(save?.worldVehicleStates??{}),...(id?[id]:[])])]);
}
