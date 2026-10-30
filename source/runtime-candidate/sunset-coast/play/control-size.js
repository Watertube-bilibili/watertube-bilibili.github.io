// UI preference only: never reads or writes gameplay saves or camera/map zoom.
import {requestedEstuary,estuarySlotFromSearch,estuaryConfig} from './estuary-save-slots.js';
import {browserWorldRequest} from './browser-world-policy.js';
import {browserWorldConfig} from './browser-world-slots.js';
export function controlSizeKey(search=globalThis.location?.search??''){
 const request=browserWorldRequest(search);
 if(request)return browserWorldConfig(request.map,request.id).key+':preference:control-button-size';
 return requestedEstuary(search)?estuaryConfig(estuarySlotFromSearch(search)).key+':preference:control-button-size':'sunset-coast:control-button-size:v1';
}
export const CONTROL_SIZE_KEY=controlSizeKey();
export const DEFAULT_CONTROL_SIZE=100;
export function clampControlSize(value){const n=Number(value);return Number.isFinite(n)?Math.max(80,Math.min(120,Math.round(n/5)*5)):100;}
export function readControlSize(storage){try{const v=storage.getItem(CONTROL_SIZE_KEY);return v===null?100:clampControlSize(v);}catch{return 100;}}
export function effectiveControlSize(value,width){const fit=width<350?90:width<400?100:120;return Math.min(clampControlSize(value),fit);}
export function applyControlSize(value,{root=document.documentElement,width=innerWidth}={}){const effective=effectiveControlSize(value,width);root.style.setProperty('--control-button-scale',String(effective/100));return effective;}
export function saveControlSize(value,storage){const size=clampControlSize(value);let stored=true;try{(storage??localStorage).setItem(CONTROL_SIZE_KEY,String(size));}catch{stored=false;}applyControlSize(size);window.dispatchEvent(new Event('controlsizechange'));return{size,stored};}
let installed=false;
export function installControlSize(){if(installed)return;installed=true;const apply=()=>{let size=100;try{size=readControlSize(localStorage);}catch{}applyControlSize(size);};apply();window.addEventListener('resize',apply);}
