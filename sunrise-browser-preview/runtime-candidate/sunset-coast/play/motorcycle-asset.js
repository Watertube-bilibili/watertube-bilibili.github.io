import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {registerVehicleAsset} from './vehicle-asset-registry.js';
import {MOTORCYCLE_MANIFESTS} from './motorcycle-manifests.js';
export const MOTORCYCLE_MODELS=Object.freeze([
 {id:'mica_scooter',assetKey:'scooter',previewImage:'./assets/motorcycle-scooter-review.png',brand:'coast_moto',name:'MICA 配送踏板',trim:'ELECTRIC COURIER',category:'摩托',desc:'原创纯电踏板 · 双轮物理与配送箱',price:3800,power:4.2,max:16.7,range:100,color:0x68a397,mass:185,tireGrip:8.4,powertrain:'electric',seatY:.80},
 {id:'ember_street',assetKey:'street',previewImage:'./assets/motorcycle-street-review.png',brand:'coast_moto',name:'EMBER 街道摩托',trim:'PETROL STREET',category:'摩托',desc:'原创燃油街车 · 后轮驱动与机械发动机',price:6800,power:6.8,max:27.8,range:250,color:0xb26848,mass:230,tireGrip:9.0,powertrain:'combustion',seatY:.84},
 {id:'ridge_dual',assetKey:'dual',previewImage:'./assets/motorcycle-dual-review.png',brand:'coast_moto',name:'RIDGE 双用途摩托',trim:'PETROL TRAIL',category:'摩托',desc:'原创燃油双用途摩托 · 高离地与辐条轮',price:8200,power:6.0,max:25,range:280,color:0x8a9369,mass:215,tireGrip:8.6,powertrain:'combustion',seatY:.93}
]);
const templates=new Map(),loads=new Map();
export const isMotorcycleModel=value=>MOTORCYCLE_MODELS.some(m=>m.id===(typeof value==='string'?value:value?.id));
export function prepareMotorcycleTemplate(scene,key){
 for(const name of ['wheel_front','wheel_rear','steering','kickstand'])if(!scene.getObjectByName(name))throw Error('Motorcycle node missing: '+name);
 scene.traverse(o=>{o.quaternion.normalize();if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.semantic=3;}});
 scene.updateMatrixWorld(true);return scene;
}
export function loadMotorcycleAsset(id,onProgress){
 const model=MOTORCYCLE_MODELS.find(m=>m.id===id);if(!model)return Promise.resolve(false);
 if(templates.has(id))return Promise.resolve(true);if(loads.has(id))return loads.get(id);
 const key=model.assetKey,url=new URL('./assets/motorcycle-'+key+'.glb?v='+MOTORCYCLE_MANIFESTS[key].sha256,import.meta.url);
 const promise=new GLTFLoader().loadAsync(url.href,onProgress).then(g=>{templates.set(id,prepareMotorcycleTemplate(g.scene,key));return true;}).catch(e=>{console.warn('Motorcycle load failed; retry available.',e);return false;}).finally(()=>loads.delete(id));loads.set(id,promise);return promise;
}
export function instantiateMotorcycle(source,model){
 const root=new THREE.Group(),chassis=source.clone(true);root.add(chassis);const get=n=>chassis.getObjectByName(n),manifest=MOTORCYCLE_MANIFESTS[model.assetKey],bounds=manifest.bounds_blender_m;
 // Geometry is shared read-only; each instance owns materials and rig transforms.
 const materials=new Map();chassis.traverse(o=>{if(!o.isMesh)return;const clone=m=>{if(!materials.has(m))materials.set(m,m.clone());return materials.get(m);};o.material=Array.isArray(o.material)?o.material.map(clone):clone(o.material);});
 root.updateMatrixWorld(true);
 const wheels=['wheel_front','wheel_rear'].map((name,index)=>{const spin=get(name),position=root.worldToLocal(spin.getWorldPosition(new THREE.Vector3()));return {pivot:spin,spin,front:index===0,side:0,index,radius:manifest.nodes[name].custom_properties.radius_m,restQuaternion:spin.quaternion.clone(),restPosition:spin.position.clone(),authoredPosition:position,spinAngle:0};});
 const steering=get('steering'),kickstand=get('kickstand');
 const front=wheels[0].authoredPosition.z,rear=wheels[1].authoredPosition.z;
 return {root,chassis,model,kind:'motorcycle',wheels,doors:[],steeringWheel:null,wheelBase:rear-front,frontAxle:front,rearAxle:rear,track:0,maxSteer:.6,lateralGrip:model.tireGrip,mass:model.mass,
 halfWidth:manifest.dimensions_blender_xyz_m[0]/2,halfLength:manifest.dimensions_blender_xyz_m[1]/2,height:manifest.dimensions_blender_xyz_m[2],
 collisionBounds:{minX:bounds.min[0],maxX:bounds.max[0],minZ:-bounds.max[1],maxZ:-bounds.min[1],minY:0,maxY:bounds.max[2]},
 physicsWheelOffsets:wheels.map(w=>[0,.1,w.authoredPosition.z,w.radius,w.authoredPosition.y]),
 driverPosition:new THREE.Vector3(0,model.seatY,model.assetKey==='scooter'?.18:.13),driverCamera:new THREE.Vector3(0,model.seatY+.65,-.15),driverFov:68,driverViewPitch:.10,exitPosition:new THREE.Vector3(-1.1,0,.1),
 motorcycleRig:{steering,kickstand,deliveryBox:get('delivery_box'),steeringRest:steering.quaternion.clone(),kickstandRest:kickstand.quaternion.clone(),kickstandStowed:manifest.nodes.kickstand.custom_properties.stowed_rotation_x_rad},asset:'Original motorcycle GLB / '+model.assetKey};
}
export function createMotorcycle(model){const source=templates.get(model.id);if(!source)throw Object.assign(Error('摩托模型尚未载入，请重试车型加载。'),{code:'MOTORCYCLE_ASSET_NOT_READY'});return instantiateMotorcycle(source,model);}
const axisX=new THREE.Vector3(1,0,0),axisY=new THREE.Vector3(0,1,0),rotation=new THREE.Quaternion();
export function updateMotorcycleVisuals(v,dt){
 const rig=v.motorcycleRig;if(!rig)return;
 if(v.physicsQuaternion)v.root.quaternion.copy(v.physicsQuaternion);
 rig.steering.quaternion.copy(rig.steeringRest).multiply(rotation.setFromAxisAngle(axisY,v.steer??0));
 // Preserve authored rake and rest quaternion; wheel rotation is never Euler-reset.
 for(const wheel of v.wheels){if(dt>0)wheel.spinAngle-=(v.travelDistance??0)/wheel.radius;wheel.spin.quaternion.copy(wheel.restQuaternion).multiply(rotation.setFromAxisAngle(axisX,wheel.spinAngle));
  const compression=v.wheelVisualCompressions?.[wheel.index]??v.wheelCompressions?.[wheel.index];const travel=Number.isFinite(compression)?Math.max(-.08,Math.min(.10,compression-(v.suspensionRest??.18))):0;
  wheel.spin.position.copy(wheel.restPosition);const localUp=axisY.clone().applyQuaternion(wheel.spin.parent.quaternion.clone().invert());wheel.spin.position.addScaledVector(localUp,travel);
 }
 const stowed=!!v.motorcycleOccupied||Math.abs(v.speed??0)>.2;
 rig.kickstand.quaternion.copy(rig.kickstandRest).multiply(rotation.setFromAxisAngle(axisX,stowed?rig.kickstandStowed:0));
}
for(const model of MOTORCYCLE_MODELS)registerVehicleAsset([model.id],{ready:()=>templates.has(model.id),load:p=>loadMotorcycleAsset(model.id,p)});
