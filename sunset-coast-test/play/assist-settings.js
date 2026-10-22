import {ASSIST_SETTINGS_KEY} from './storage-keys.js';
export const FOLLOW_GAP_PRESETS=Object.freeze({
 near:Object.freeze({label:'近',headway:.85,standstill:2.6}),
 medium:Object.freeze({label:'中',headway:1.2,standstill:3.2}),
 far:Object.freeze({label:'远',headway:1.7,standstill:4.5})
});
// Game-tuned intervention timing, independent of Pilot's following headway.
// TTC = clamp(ttcBase + speed[m/s] * ttcPerSpeed, ttcMin, ttcMax) seconds.
// Required deceleration threshold = min(decelerationCap[m/s²], available
// braking * decelerationRatio). The TTC branch also requires > 2 m/s² demand.
// Medium is the unchanged 1.3.2 calibration. All settings retain real-path
// overlap, camera confidence and the same bounded last-chance confirmation.
export const AEB_SENSITIVITY_PRESETS=Object.freeze({
 low:Object.freeze({label:'低',ttcBase:.8,ttcPerSpeed:.019,ttcMin:.9,ttcMax:1.3,decelerationCap:7.1,decelerationRatio:.86}),
 medium:Object.freeze({label:'中',ttcBase:1.02,ttcPerSpeed:.023,ttcMin:1.1,ttcMax:1.5,decelerationCap:6.25,decelerationRatio:.76}),
 high:Object.freeze({label:'高',ttcBase:1.3,ttcPerSpeed:.028,ttcMin:1.4,ttcMax:2.05,decelerationCap:4.8,decelerationRatio:.58})
});
const validAebSensitivity=value=>typeof value==='string'&&Object.hasOwn(AEB_SENSITIVITY_PRESETS,value);
export const DEFAULT_ASSIST_SETTINGS=Object.freeze({maxSpeedKmh:100,driveStyle:'sport',followGap:'medium',aebEnabled:true,aebSensitivity:'medium',steeringAssistEnabled:false,roadsterStabilityAssist:false});
export function normalizeAssistSettings(value={},model=null,previous=DEFAULT_ASSIST_SETTINGS){
 const maximum=Math.max(10,Math.min(220,Math.floor((model?.max??220/3.6)*3.6)));
 const raw=value?.maxSpeedKmh,number=typeof raw==='number'?raw:typeof raw==='string'&&raw.trim()!==''?Number(raw):NaN;
 const old=Number(previous?.maxSpeedKmh);const speed=Number.isFinite(number)?number:Number.isFinite(old)?old:100;
 const previousGap=Object.hasOwn(FOLLOW_GAP_PRESETS,previous?.followGap)?previous.followGap:'medium';
 const previousSensitivity=validAebSensitivity(previous?.aebSensitivity)?previous.aebSensitivity:'medium';
 return{maxSpeedKmh:Math.round(Math.max(10,Math.min(maximum,speed))),driveStyle:value?.driveStyle==='normal'?'normal':value?.driveStyle==='sport'?'sport':previous?.driveStyle==='normal'?'normal':'sport',followGap:Object.hasOwn(FOLLOW_GAP_PRESETS,value?.followGap)?value.followGap:previousGap,aebEnabled:typeof value?.aebEnabled==='boolean'?value.aebEnabled:typeof previous?.aebEnabled==='boolean'?previous.aebEnabled:true,aebSensitivity:validAebSensitivity(value?.aebSensitivity)?value.aebSensitivity:previousSensitivity,steeringAssistEnabled:typeof value?.steeringAssistEnabled==='boolean'?value.steeringAssistEnabled:previous?.steeringAssistEnabled===true,roadsterStabilityAssist:typeof value?.roadsterStabilityAssist==='boolean'?value.roadsterStabilityAssist:previous?.roadsterStabilityAssist===true};
}
export function restoreAssistSettings(storage){try{return normalizeAssistSettings(JSON.parse(storage.getItem(ASSIST_SETTINGS_KEY)||'null'));}catch{return{...DEFAULT_ASSIST_SETTINGS};}}
export function saveAssistSettings(storage,value){try{storage.setItem(ASSIST_SETTINGS_KEY,JSON.stringify(value));return true;}catch{return false;}}
