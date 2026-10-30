import {structuralWheelStats} from './structural-wheels.js';
import {structuralVehicleStats,structuralBindingDiagnostics} from './structural-vehicle.js';
import {createCar as originalCreateCar,MODELS} from './world.js';
import * as legacy from './vehicle-damage.js';
import * as structural from './structural-damage-adapter.js';
import {prepareVoltSFactory} from './s-factory.js';
import {createVoltSDamageLifecycle} from './s-damage-lifecycle.js';
let factory=null,lifecycle=null,preparing=null;
export const composedSRequested=(search=globalThis.location?.search??'')=>{const p=new URLSearchParams(search);return (p.get('world')==='estuary'||p.get('preview')==='1'&&p.get('map')==='estuary')&&p.get('blenderVehicle')==='volt-s-v2'&&p.get('damage')==='structure';};
export async function prepareComposedS(){if(!composedSRequested())return false;if(factory)return true;if(!preparing)preparing=(async()=>{const response=await fetch(new URL('./assets/volt-s-blender-v2.glb',import.meta.url));if(!response.ok)throw Error('S GLB preload failed');const verified=await prepareVoltSFactory(new Uint8Array(await response.arrayBuffer()));factory=verified;lifecycle=createVoltSDamageLifecycle(factory,structural);return true;})();return preparing;}
export function createComposedCar(id='s',simple=false,color=null){if(composedSRequested()&&id==='s'&&!simple){if(!factory)throw Error('S audited preload must finish before Game construction');return factory.createCar(MODELS.find(m=>m.id==='s'));}return originalCreateCar(id,simple,color);}
export const isComposedS=v=>!!factory&&factory.recognizes(v);
const api=v=>isComposedS(v)?lifecycle:legacy;
export const attachVehicleDamage=v=>api(v).attachVehicleDamage(v);
const diagnosticContacts=new WeakMap();
export const structuralDiagnosticsRequested=(search=globalThis.location?.search??'')=>new URLSearchParams(search).get('world')!=='estuary'&&composedSRequested(search)&&new URLSearchParams(search).get('structuralDiagnostics')==='1';
export function updateVehicleDamage(v,...args){const result=api(v).updateVehicleDamage(v,...args);if(structuralDiagnosticsRequested()&&factory?.owns(v)&&isComposedS(v)){const c=args[0]?.contact;const known=['native','manifold-normal-speed-loss','solver-impulse'];diagnosticContacts.set(v,{impulseSource:known.includes(c?.impulseSource)?c.impulseSource:'unknown',normalImpulse:Number.isFinite(c?.normalImpulse)?c.normalImpulse:'unknown',accepted:typeof result?.accepted==='boolean'?result.accepted:'unknown'});}return result;}
export function readStructuralDiagnostics(v){if(!structuralDiagnosticsRequested())return null;const a=factory?.diagnostics(v),s=a?structuralVehicleStats(v):null;return {wheels:structuralWheelStats(v),nativeWheelDamageSupported:!!v?.nativeWheelDamageSupported,bound:!!(a&&s),...(a??{}),...(s?structuralBindingDiagnostics(v):{}),maxDisplacement:s?.maxDisplacement??'unknown',brokenBeams:s?.broken??'unknown',detachedParts:s?.detached??'unknown',revision:s?.revision??'unknown',repairRebindGeneration:'unknown',lastContact:diagnosticContacts.get(v)??{impulseSource:'unknown',normalImpulse:'unknown',accepted:'unknown'}};}

export const repairVehicleDamage=v=>api(v).repairVehicleDamage(v);
export function disposeVehicleDamage(v){if(isComposedS(v)){structural.disposeVehicleDamage(v);factory.release(v);}else legacy.disposeVehicleDamage(v);}
export function restoreVehicleDamage(v,data){if(!isComposedS(v))return legacy.restoreVehicleDamage(v,data);if(factory.status(v)!=='unbound')throw Error('Preview S restoration requires a new issued instance');structural.restoreVehicleDamage(v,data);return lifecycle.attachVehicleDamage(v);}
export const serializeVehicleDamage=v=>isComposedS(v)?structural.serializeVehicleDamage(v):legacy.serializeVehicleDamage(v);
export const sanitizeDamageRegions=legacy.sanitizeDamageRegions;
export const warmVehicleDamage=(v,...a)=>isComposedS(v)?undefined:legacy.warmVehicleDamage(v,...a);
export const stepComposedS=(v,dt,world)=>isComposedS(v)?structural.stepVehicleDamage(v,dt,world):undefined;
