import * as THREE from './vendor/three.module.js';
// Keep the original proxy/cat pose; loaded human bones additionally target
// the unchanged motorcycle saddle, real grips and supported foot surfaces.
export const isMotorcycle=v=>v?.kind==='motorcycle';
// Measured from the unchanged original GLB components: paired handle grips,
// front foot pegs (street/dual), and supported points on the scooter board.
const anchors={mica_scooter:{grip:[.276,1.081,-.455],foot:[.13,.364,.06]},ember_street:{grip:[.316,1.091,-.425],foot:[.29,.39,.25]},ridge_dual:{grip:[.346,1.186,-.405],foot:[.29,.48,.25]}};
const gripLocals=new WeakMap();
export function motorcycleRiderAnchors(vehicle){
 const points=anchors[vehicle.model?.id],rig=vehicle.motorcycleRig;if(!points||!rig?.steering)return null;
 vehicle.root.updateMatrixWorld(true);
 let hands=gripLocals.get(vehicle);
 if(!hands){const rest=new THREE.Matrix4().compose(rig.steering.position,rig.steeringRest,rig.steering.scale).premultiply(rig.steering.parent.matrixWorld).invert();
  hands=[-1,1].map(sign=>new THREE.Vector3(sign*points.grip[0],points.grip[1],points.grip[2]).applyMatrix4(vehicle.root.matrixWorld).applyMatrix4(rest));gripLocals.set(vehicle,hands);}
 return {hip:vehicle.driverPosition.clone().applyMatrix4(vehicle.root.matrixWorld),hands:hands.map(p=>p.clone().applyMatrix4(rig.steering.matrixWorld)),
  feet:[-1,1].map(sign=>new THREE.Vector3(sign*points.foot[0],points.foot[1],points.foot[2]).applyMatrix4(vehicle.root.matrixWorld)),quaternion:vehicle.root.getWorldQuaternion(new THREE.Quaternion())};
}
export function applyMotorcycleEntryPose(game,pose){
 const actor=game.person;if(!isMotorcycle(game.vehicle)||!actor?.applyRiderPose||pose.phase==='approach')return false;
 const targets=motorcycleRiderAnchors(game.vehicle);if(!targets)return false;
 actor.root.updateMatrixWorld(true);targets.hip=new THREE.Vector3(0,.8,0).applyMatrix4(actor.root.matrixWorld);targets.blend=pose.carBlend;
 actor.applyRiderPose(targets);return true;
}
export function motorcycleRiderPose(vehicle,{cat=false}={}){
 const seat=vehicle.driverPosition??{x:0,y:.8,z:0},pitch=cat?0:-.12;
 const hip=cat?0:.8;
 return{position:{x:seat.x,y:seat.y-hip*Math.cos(pitch),z:seat.z-hip*Math.sin(pitch)},pitch,
  arms:cat?[{x:0,y:0,z:0},{x:0,y:0,z:0}]:[{x:.98,y:0,z:-.12},{x:.98,y:0,z:.12}],
  legs:cat?[{x:0,y:0,z:0},{x:0,y:0,z:0}]:[{x:.22,y:0,z:-.28},{x:.22,y:0,z:.28}]};
}
export function updateMotorcycleRider(game){
 const v=game.vehicle,p=game.person;if(!isMotorcycle(v)||!game.inCar||game.transition||!p?.root)return false;
 const pose=motorcycleRiderPose(v,{cat:game.character==='mochi'}),q=v.root.quaternion;
 p.root.position.set(pose.position.x,pose.position.y,pose.position.z).applyQuaternion(q).add(v.root.position);
 p.root.quaternion.copy(q).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),pose.pitch));
 p.root.scale.setScalar(1);p.root.visible=game.cameraMode!==1;
 for(const [limbs,angles]of[[p.arms,pose.arms],[p.legs,pose.legs]])(limbs??[]).forEach((limb,i)=>limb.rotation.set(angles[i].x,angles[i].y,angles[i].z));
 const targets=motorcycleRiderAnchors(v);if(targets)p.applyRiderPose?.(targets);
 if(game.gun)game.gun.visible=false;
 return true;
}
export const vehicleEnergyLabel=v=>isMotorcycle(v)&&v.model?.powertrain==='combustion'?'燃油':'电量';
export const vehicleRefillLabel=v=>vehicleEnergyLabel(v)==='燃油'?'加油':'充电';
