import {assertVehicleOwners} from './vehicle-identity.js';
import {worldFleetForSave,mergeWorldFleets} from './world-fleet-state.js';
export {WORLD_VEHICLE_LIMIT,assertWorldFleetIdentities,worldFleetForSave,mergeWorldFleets} from './world-fleet-state.js';
import {serializeVehicleDamage} from './vehicle-damage.js';
import {serializeAxleFault} from './axle-fault.js';
import {serializeBrakeFault} from './brake-fault.js';
import {roadsterTrim} from './roadster-controls.js';
import {getVehicleCollider,boxContact} from './vehicle-dynamics.js';
import {WORLD_MIN_X,WORLD_LIMIT} from './regions.js';

const clone=value=>structuredClone(value);
export const eligibleWorldVehicle=(game,v)=>!!v&&v.kind!=='aircraft'&&!v.isRobotaxi&&v!==game.robotaxi?.taxi&&v!==game.autonomyTest?.workVehicle&&v!==game.aircraft?.aircraft&&v.isGarageVehicle===false;
export const isControlledWorldVehicle=(game,v)=>eligibleWorldVehicle(game,v)&&(v===game.vehicle||Object.hasOwn(game.worldVehicleStates??{},v.instanceId));
export function worldVehicleRecord(v){
 return {model:v.model.id,instanceId:v.instanceId,isGarageVehicle:false,x:v.pos.x,y:v.pos.y,z:v.pos.z,yaw:v.yaw,battery:v.battery,condition:v.condition,
  ...(roadsterTrim(v)?{roadsterCharge:v.roadsterCharge??100,roadsterAirUnits:v.roadsterAirUnits}:{}),damageRegions:serializeVehicleDamage(v),axleFault:serializeAxleFault(v),brakeFault:serializeBrakeFault(v)};
}
// Build the complete replacement before assigning it. A purchase's shadow host
// therefore never mutates the real host's registry or any shared live vehicle.
export function claimWorldVehicles(game,...vehicles){
 assertVehicleOwners(game);
 const records=Object.create(null);
 for(const v of vehicles)if(eligibleWorldVehicle(game,v))records[v.instanceId]=worldVehicleRecord(v);
 const next=mergeWorldFleets(game.worldVehicleStates,records);game.worldVehicleStates=next;return next;
}
export function captureWorldVehicle(game,v){if(isControlledWorldVehicle(game,v))claimWorldVehicles(game,v);}
export function currentWorldFleet(game,active=game.vehicle){
 const vehicles=[...new Set([active,game.vehicle,game.personalVehicle,...(game.traffic??[])])];
 const records=Object.create(null);
 for(const v of vehicles)if(v?.pos&&(v===active&&eligibleWorldVehicle(game,v)||isControlledWorldVehicle(game,v)))records[v.instanceId]=worldVehicleRecord(v);
 return mergeWorldFleets(game.worldVehicleStates,records);
}
export function serializeWorldFleet(game,active=game.vehicle){
 game.worldVehicleStates=currentWorldFleet(game,active);return clone(game.worldVehicleStates);
}
export function restoreWorldFleet(game,save){
 let records=worldFleetForSave(save);
 // Only this restored object receives opaque fields from a missing-ID legacy
 // active vehicle. Later same-model objects have a different registry key.
 if(game.vehicle?.isGarageVehicle===false){const active={...clone(save.vehicle),instanceId:game.vehicle.instanceId,isGarageVehicle:false};records=mergeWorldFleets(records,{[active.instanceId]:active});}
 game.worldVehicleStates=records;
 for(const [id,record] of Object.entries(records)){
  if(game.vehicle?.instanceId===id){if(Number.isFinite(record.y))game.vehicle.pos.y=record.y;continue;}
  const parked=game.makeVehicle(record.model,record.x,record.z,record.yaw,false,null,{isGarageVehicle:false,instanceId:id,state:record});
  if(Number.isFinite(record.y))parked.pos.y=record.y;
  parked.parked=true;parked.populationProtected=true;parked.populationDormant=false;parked.speed=0;game.traffic.push(parked);
 }
}
export function parkControlledWorldVehicle(game,v){
 claimWorldVehicles(game,v);v.parked=true;v.populationProtected=true;v.populationDormant=false;v.speed=0;v.root.visible=true;
 if(!(game.traffic??=[]).includes(v))game.traffic.push(v);
}
// Reuse authored vehicle footprints and original ground/exit queries. New
// garage vehicles move to a nearby clear place; the retained world car stays put.
export function worldGarageRecallPosition(game,target,previous){
 if(!isControlledWorldVehicle(game,previous))return null;
 const origin=game.position,yaw=game.yaw,c=Math.cos(yaw),s=Math.sin(yaw),prior=getVehicleCollider(previous),shape=getVehicleCollider(target);
 const side=prior.halfWidth+shape.halfWidth+1.6,end=prior.halfLength+shape.halfLength+1.8;
 const vehicles=[...new Set([game.vehicle,...(game.traffic??[]),...(game.police??[]),game.personalVehicle])].filter(v=>v&&v!==target&&!v.populationDormant);
 for(const scale of [1,1.5,2])for(const [dx,dz] of [[side,0],[-side,0],[0,end],[0,-end],[side,end],[-side,end],[side,-end],[-side,-end]]){
  const p=origin.clone();p.x+=(dx*c+dz*s)*scale;p.z+=(-dx*s+dz*c)*scale;
  if(p.x<WORLD_MIN_X+5||p.x>WORLD_LIMIT-8||Math.abs(p.z)>WORLD_LIMIT-8)continue;
  p.y=(game.groundContact?.heightAt(p.x,p.z)??game.world?.groundHeight?.(p.x,p.z)??0)+.02;
  const candidate={...target,pos:p,yaw},box=getVehicleCollider(candidate);box.halfWidth+=.35;box.halfLength+=.35;box.radius=Math.hypot(box.halfWidth,box.halfLength);
  if(vehicles.some(v=>Math.abs((v.pos.y??p.y)-p.y)<4&&boxContact(box,getVehicleCollider(v))))continue;
  if((game.world?.colliders??[]).some(b=>{
   if(Number.isFinite(b.baseY)&&Number.isFinite(b.height)&&(p.y+(target.height??2)<b.baseY-.08||p.y>b.baseY+b.height+.08))return false;
   const angle=b.yaw??0,obstacle={x:b.x,z:b.z,halfWidth:b.w,halfLength:b.d,right:{x:Math.cos(angle),z:-Math.sin(angle)},back:{x:Math.sin(angle),z:Math.cos(angle)},radius:Math.hypot(b.w,b.d)};return !!boxContact(box,obstacle);
  }))continue;
  if(game.groundContact&&(!game.groundContact.findExit(candidate,{vehicles})||!game.groundContact.findExit(previous,{vehicles:[...vehicles,candidate]})))continue;
  return p;
 }
 throw Error('附近没有可安全停放并上下车的空位；原车与存档保持不变');
}
