// Data-only saved world-instance identities and bounded record merging.
export const isWorldVehicleId=id=>typeof id==='string'&&id.startsWith('world:')&&id.length>6&&id.length<=96&&!/[\u0000-\u001f\u007f]/.test(id);
export const isGarageVehicleSave=v=>v?.isGarageVehicle??!isWorldVehicleId(v?.instanceId);
export const WORLD_VEHICLE_LIMIT=128;
const clone=value=>structuredClone(value);
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
function merge(previous,current){
 if(!object(previous)||!object(current))return clone(current);
 const result=clone(previous);for(const [key,value] of Object.entries(current)){if(['__proto__','constructor','prototype'].includes(key))throw Error('世界车辆包含不安全字段');if(value!==undefined)result[key]=merge(previous[key],value);}return result;
}
export function assertWorldFleetIdentities(value){
 if(value===undefined)return;
 if(!object(value)||Object.keys(value).length>WORLD_VEHICLE_LIMIT)throw Error('已使用世界车辆最多保留 128 辆；未删除任何记录');
 for(const [id,record] of Object.entries(value))if(!isWorldVehicleId(id)||!object(record)||record.instanceId!==id||record.isGarageVehicle!==false||typeof record.model!=='string')throw Error('世界车辆实例存档身份无效');
}
export function mergeWorldFleets(...layers){
 const result=Object.create(null);
 for(const layer of layers){assertWorldFleetIdentities(layer);for(const [id,record] of Object.entries(layer??{})){
  if(result[id]&&result[id].model!==record.model)throw Error('保留世界车辆的实例车型冲突');
  result[id]=merge(result[id],record);
 }}
 assertWorldFleetIdentities(result);return result;
}
export function worldFleetForSave(save){
 const result=mergeWorldFleets(save?.worldVehicleStates),active=save?.vehicle;
 if(active&&!isGarageVehicleSave(active)&&active.instanceId!==undefined){
  const record={...clone(active),isGarageVehicle:false};
  return mergeWorldFleets(result,{[active.instanceId]:record});
 }
 return result;
}
