import {impactStructuralWheels,repairStructuralWheels} from './structural-wheels.js';
import * as THREE from './vendor/three.module.js';
import {validateStructuralDamageRecord} from './structural-save.js';
import {attachStructuralVehicle,impactStructuralVehicle,disposeStructuralVehicle,stepStructuralDebris,structuralVehicleStats,serializeStructuralVehicle,restoreStructuralVehicle} from './structural-vehicle.js';
// Integration candidate: legacy region records remain readable, but never synthesize dents.
// Structural v1 is a separate bounded local field; no cloud schema is changed here.
export const DAMAGE_REGIONS=Object.freeze(['front','rear','left','right']);
const records=new WeakMap(),pendingRecords=new WeakMap(),empty=()=>Object.fromEntries(DAMAGE_REGIONS.map(k=>[k,0]));
export function sanitizeDamageRegions(data){if(!data||typeof data!=='object'||Array.isArray(data)||!DAMAGE_REGIONS.some(k=>Number.isFinite(data[k])))return null;return Object.fromEntries(DAMAGE_REGIONS.map(k=>[k,Math.max(0,Math.min(1,Number.isFinite(data[k])?data[k]:0))]));}
export const validateDamageRegions=sanitizeDamageRegions;
export function attachVehicleDamage(v){if(!records.has(v))records.set(v,empty());return structuralVehicleStats(v);}
export function restoreVehicleDamage(v,data){repairStructuralWheels(v);disposeStructuralVehicle(v);records.set(v,sanitizeDamageRegions(data)??empty());return attachVehicleDamage(v);}
export function serializeVehicleDamage(v){return {...(records.get(v)??empty())};}
export function repairVehicleDamage(v){repairStructuralWheels(v);pendingRecords.delete(v);disposeStructuralVehicle(v);records.set(v,empty());delete v.structuralDamageStatus;delete v.structuralDamageActive;return attachVehicleDamage(v);}
export function disposeVehicleDamage(v){repairStructuralWheels(v);pendingRecords.delete(v);disposeStructuralVehicle(v);records.delete(v);delete v.structuralDamageStatus;delete v.structuralDamageActive;}
export function warmVehicleDamage(){/* no per-frame geometry or condition-derived warmup */}
const xyz=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
/** Full world-space contact only. Planar legacy contacts intentionally fail closed. */
export function structuralContact(v,contact,normalSpeed){
 if(!xyz(contact?.point)||!xyz(contact?.forceDirection)||!Number.isFinite(contact?.normalImpulse)||!Number.isFinite(normalSpeed)||contact.damageEvent==null)return null;
 const q=(v.physicsQuaternion??v.root.quaternion).clone().invert();
 const point=new THREE.Vector3(contact.point.x,contact.point.y,contact.point.z).sub(v.pos).applyQuaternion(q);
 const direction=new THREE.Vector3(contact.forceDirection.x,contact.forceDirection.y,contact.forceDirection.z).applyQuaternion(q);
 const points=Array.isArray(contact.manifoldPoints)?contact.manifoldPoints.filter(p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite)).slice(0,8).map(p=>new THREE.Vector3(...p).sub(v.pos).applyQuaternion(q).toArray()):[];
 return {points,point:point.toArray(),direction:direction.toArray(),normalSpeed,normalImpulse:contact.normalImpulse,eventId:contact.damageEvent};
}
export function updateVehicleDamage(v,{contact,normalSpeed,scene}={}){
 if(pendingRecords.has(v))return{accepted:false,reason:'Saved structure belongs to a different asset; repair or load the matching asset'};
 const impact=structuralContact(v,contact,normalSpeed);if(!impact)return {accepted:false,reason:'Full 3D contact, impulse and stable event required'};
 // No fallback guesses from condition/region. Unsupported assets remain undamaged visually.
 try {attachStructuralVehicle(v);} catch(error){v.structuralDamageStatus=String(error.message);return {accepted:false,reason:v.structuralDamageStatus};}
 const result=impactStructuralVehicle(v,impact,{scene,worldVelocity:v.physicsLinearVelocity??new THREE.Vector3()});
 if(result.accepted){impactStructuralWheels(v,impact);v.structuralDamageActive=true;const data=records.get(v)??empty();if(DAMAGE_REGIONS.includes(contact.region))data[contact.region]=Math.max(data[contact.region],Math.max(0,Math.min(1,(100-v.condition)/100)));records.set(v,data);}
 return result;
}
export function stepVehicleDamage(v,dt,world){stepStructuralDebris(v,dt,{groundHeight:(x,z)=>world?.groundHeight?.(x,z)??0});}

export {validateStructuralDamageRecord};
export function serializeVehicleStructure(v){return pendingRecords.has(v)?structuredClone(pendingRecords.get(v)):serializeStructuralVehicle(v);}
export function restoreVehicleStructure(v,data){
 if(!validateStructuralDamageRecord(data))return{accepted:false,reason:'Invalid structural save schema'};
 try{const result=restoreStructuralVehicle(v,data);if(result.accepted){pendingRecords.delete(v);v.structuralDamageActive=!!data&&(data.revision>0||data.parts.some(p=>p.detached));delete v.structuralDamageStatus;}else{v.structuralDamageStatus=result.reason;if(data)pendingRecords.set(v,structuredClone(data));}return result;}
 catch(error){v.structuralDamageStatus=String(error.message);if(data)pendingRecords.set(v,structuredClone(data));return{accepted:false,reason:v.structuralDamageStatus};}
}
