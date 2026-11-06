// Official current US reference; no model year is asserted by this page.
// This reference is NOT a claim that this four-contact game recreates the truck.
export const SEMI_OFFICIAL_REFERENCE=Object.freeze({source:'https://www.tesla.com/semi',checked:'2026-10-18',variant:'US Long Range',motorCount:3,maximumDrivePowerW:800000,grossCombinationWeightLb:82000,curbWeightLb:23000,rangeMiles:500,torqueNm:null,zeroToSixtySeconds:null});
// Existing game mass and cargo are retained. Payload does not change the native
// rigid body, add a trailer, or represent the manufacturer's gross combination.
// Launch force is a GAME assumption, NOT a disclosed Tesla torque specification.
export const SEMI_GAME_POWERTRAIN=Object.freeze({baseMassKg:11500,launchForceN:80500,maxAcceleration:7});
export function semiDriveScale(vehicle,payloadKg=0){
 if(vehicle?.model?.id!=='semi')return 1;
 const mass=SEMI_GAME_POWERTRAIN.baseMassKg+Math.min(26000,Math.max(0,Number.isFinite(payloadKg)?payloadKg:0));
 const speed=Number.isFinite(vehicle.speed)?Math.abs(vehicle.speed):0;
 const base=Number.isFinite(vehicle.model.power)&&vehicle.model.power>0?vehicle.model.power:7;
 const acceleration=Math.min(base,SEMI_GAME_POWERTRAIN.maxAcceleration,SEMI_GAME_POWERTRAIN.launchForceN/mass,SEMI_OFFICIAL_REFERENCE.maximumDrivePowerW/(mass*Math.max(.1,speed)));
 return Math.max(0,Math.min(1,acceleration/base));
}
