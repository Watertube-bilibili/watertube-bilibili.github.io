// Reuses existing control/parking/fault semantics without importing the Godot bridge.
import {parkingBrakeControls} from './touch-transmission.js';
import {stepAxleFault,axleFaultEffects} from './axle-fault.js';
import {stepBrakeFault} from './brake-fault.js';
import {clampRoadsterControls} from './roadster-controls.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
export function browserRoadsterControls(v,input,dt){
 input=parkingBrakeControls(v,input);
 stepAxleFault(v,input,dt);const axle=axleFaultEffects(v);
 let throttle=clamp(input.throttle,-1,1);
 const request=typeof input.brake==='number'?clamp(input.brake,0,1):input.brake?1:0;
 const pilot=input.brakeSource==='pilot';
 let manual=pilot?0:request,electronic=Math.max(pilot?request:0,clamp(input.electronicBrake,0,1));
 if(throttle<0&&v.speed>1.2){if(pilot)electronic=Math.max(electronic,-throttle);else manual=Math.max(manual,-throttle);throttle=0;}
 v.requestedBrakeAmount=manual;
 const effective=stepBrakeFault(v,manual,dt);
 v.manualBrakeAmount=effective;v.electronicBrakeAmount=electronic;v.brakeSource=pilot?'pilot':'manual';
 v.handbrake=!!input.handbrake;v.propulsionDisabled=v.condition<=0;
 return{throttle,axleBroken:axle.broken,axleSide:axle.side,steer:clamp(input.steer,-.8,.8),manualBrake:effective,electronicBrake:electronic,
  manualBrakeBroken:!!v.brakeFault?.broken,handbrake:!!input.handbrake,condition:v.condition,battery:v.battery,motorcycleOccupied:!!v.motorcycleOccupied,...clampRoadsterControls(v,input)};
}

