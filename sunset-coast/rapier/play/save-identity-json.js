// JSON.parse loses duplicate members before a validator can inspect them.
// Reject ambiguity only in identity/air-inventory paths; unrelated opaque
// extension fields retain the original parser semantics and original raw bytes.
const vehicleFields=new Set(['model','instanceId','isGarageVehicle','roadsterAirUnits','roadsterCharge']);
const critical=(path,key)=>path.length===0?['vehicle','vehicleStates','worldVehicleStates','roadsterAirLedger','owned'].includes(key):path[0]==='vehicle'&&path.length===1?vehicleFields.has(key):['vehicleStates','worldVehicleStates'].includes(path[0])?path.length===1||path.length===2&&vehicleFields.has(key):path[0]==='roadsterAirLedger'?path.length===1||path.length===2&&['model','airUnits','parked'].includes(key):false;
export function parseSaveIdentityJSON(raw){
 const parsed=JSON.parse(raw);let at=0;
 const space=()=>{while(/\s/.test(raw[at]??'')&&at<raw.length)at++;};
 function string(){const start=at++;while(at<raw.length){if(raw[at]==='\\'){at+=2;continue;}if(raw[at++]==='"')break;}return JSON.parse(raw.slice(start,at));}
 function value(path){
  space();const token=raw[at];
  if(token==='{'){
   at++;space();const seen=new Set();if(raw[at]==='}'){at++;return;}
   while(at<raw.length){space();const key=string();if(seen.has(key)&&critical(path,key))throw Error('存档包含重复的车辆身份或储气罐字段');seen.add(key);space();at++;value([...path,key]);space();if(raw[at++]==='}')break;}
  }else if(token==='['){at++;space();if(raw[at]===']'){at++;return;}let index=0;while(at<raw.length){value([...path,index++]);space();if(raw[at++]===']')break;}}
  else if(token==='"')string();else while(at<raw.length&&!/[\s,}\]]/.test(raw[at]))at++;
 }
 value([]);return parsed;
}
