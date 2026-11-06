import {assertVehicleOwners,validLedgerIdentity} from './vehicle-identity.js';
// Gameplay air inventory. Physics owns every streamed body; this ledger only
// recharges dormant instances using validated online simulation dt, never dates.
export const ROADSTER_AIR_CAPACITY=2400;
export const ROADSTER_AIR_REFILL_RATE=8;
const trims=new Set(['roadster','roadster_thrust','roadster_rocket']);
const validId=id=>typeof id==='string'&&id.length>0&&id.length<=96&&!['__proto__','constructor','prototype'].includes(id);
const finite=(n,f=0)=>Number.isFinite(n)?n:f;
const clamp=n=>Math.max(0,Math.min(ROADSTER_AIR_CAPACITY,finite(n)));
export function roadsterAirUnits(v){return clamp(Number.isFinite(v?.roadsterAirUnits)?v.roadsterAirUnits:v?.roadsterAirUnits!==undefined?0:finite(v?.roadsterCharge,v?.roadsterCharge===undefined?100:0)*24);}
export function setRoadsterAirUnits(v,units){v.roadsterAirUnits=clamp(units);v.roadsterCharge=v.roadsterAirUnits/24;}
export function roadsterAirEligible(v){
 return v.roadsterState?.airRefillEligible===true&&v.grounded===true&&v.roadsterRequest?.air!==true&&v.roadsterRequest?.pending!==true;
}
export function rememberRoadsterAir(game,v){
 if(!trims.has(v?.model?.id)||!validId(v.instanceId))return;
 assertVehicleOwners(game);
 const ledger=game.roadsterAirLedger??=Object.create(null);
 if(!validLedgerIdentity(v.instanceId,v.model.id)||ledger[v.instanceId]&&ledger[v.instanceId].model!==v.model.id)throw Error('车辆身份与储气罐账本车型冲突');
 ledger[v.instanceId]={...ledger[v.instanceId],model:v.model.id,airUnits:roadsterAirUnits(v),parked:roadsterAirEligible(v)};
}
export function restoreRoadsterAir(game,v,saved={}){
 if(!trims.has(v?.model?.id))return;
 const record=validId(v.instanceId)?game.roadsterAirLedger?.[v.instanceId]:null;
 if(record&&record.model!==v.model.id)throw Error('车辆身份与储气罐账本车型冲突');
 setRoadsterAirUnits(v,record?.model===v.model.id?record.airUnits:roadsterAirUnits(saved));
}
export function tickRoadsterAirLedger(game,dt,physicsOwnedThisStep=new Set()){
 if(game.paused||!Number.isFinite(dt)||dt<=0||dt>.1)return;
 assertVehicleOwners(game);
 const live=new Map();
 for(const v of game.allVehicles())if(trims.has(v?.model?.id)&&validId(v.instanceId))live.set(v.instanceId,v);
 const ledger=game.roadsterAirLedger??=Object.create(null);
 for(const v of live.values())rememberRoadsterAir(game,v);
 for(const [id,r] of Object.entries(ledger)){
  const v=live.get(id);
  if(v&&(game.physics?.vehicles?.has(v)||physicsOwnedThisStep.has(v)))continue;
  if(r.parked===true){r.airUnits=clamp(r.airUnits+ROADSTER_AIR_REFILL_RATE*dt);if(v)setRoadsterAirUnits(v,r.airUnits);}
 }
}
export function serializeRoadsterAirLedger(game){
 assertVehicleOwners(game);
 for(const v of game.allVehicles())rememberRoadsterAir(game,v);
 return structuredClone(game.roadsterAirLedger??{});
}
export function validRoadsterAirLedger(value){
 return value===undefined||!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length<=2000&&Object.entries(value).every(([id,r])=>validId(id)&&r&&!Array.isArray(r)&&trims.has(r.model)&&validLedgerIdentity(id,r.model)&&Number.isFinite(r.airUnits)&&r.airUnits>=0&&r.airUnits<=ROADSTER_AIR_CAPACITY&&typeof r.parked==='boolean');
}
export function loadRoadsterAirLedger(game,value){
 if(!validRoadsterAirLedger(value))throw Error('储气罐账本无效');
 const ledger=Object.assign(Object.create(null),structuredClone(value??{})),owners=assertVehicleOwners(game);
 for(const [id,v]of owners)if(ledger[id]&&ledger[id].model!==v.model?.id)throw Error('车辆身份与储气罐账本车型冲突');
 const entries=[...owners].filter(([id])=>ledger[id]).map(([id,vehicle])=>({vehicle,instanceId:id,model:ledger[id].model,airUnits:ledger[id].airUnits}));
 game.physics?.restoreRoadsterAirInventory?.(entries);
 game.roadsterAirLedger=ledger;
 // Surviving live cars must adopt the restored record too. Otherwise their old
 // tank would overwrite this same-instance authority on the next publication.
 for(const entry of entries)setRoadsterAirUnits(entry.vehicle,entry.airUnits);
}
