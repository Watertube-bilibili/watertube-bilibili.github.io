import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {restoreQualityPreference} from './performance-profile.js';
import {registerVehicleAsset} from './vehicle-asset-registry.js';
// Optional add-on for Neon Coast 2.0 Beta. Catalog/physics integration is separate.
export const SEMI_MODEL_IDS=Object.freeze(['semi']);
export const SEMI_ASSETS=Object.freeze({
 high:Object.freeze({file:'semi_detailed.glb',sha256:'0d760315d724d5b63e8356420554cee06d716e4e8eda47f845261e64ec9e02c0'}),
 medium:Object.freeze({file:'semi_medium.glb',sha256:'4e7e8405e912d13e1a40cd57749166fc2bc93fc79043133b45092e7afb800ae4'}),
 low:Object.freeze({file:'semi_low.glb',sha256:'2b8d4474c28c7e252b68802589c5c78fdff4f90e160095a2ce7c37aa85153f8f'})
});
export const SEMI_ASSET_SHA256=SEMI_ASSETS.high.sha256;
export function selectSemiAssetQuality(env=globalThis){
 let storage;try{storage=env.localStorage;}catch{}
 return restoreQualityPreference(storage,env);
}
export const semiAssetDescriptor=quality=>SEMI_ASSETS[quality]??SEMI_ASSETS.medium;
export const getSemiLoadedQuality=()=>loadedQuality;
export const SEMI_REQUIRED_NODES=Object.freeze(['Chassis','DriverSeat','SteeringWheel','DriverCamera','Left_Display_Surface','Right_Display_Surface','DoorPivot_L','DoorPivot_R','TrailerHitch',...['FL','FR','ML','MR','RL','RR'].flatMap(s=>['WheelPivot_'+s,'WheelSpin_'+s])]);
let template=null,loading=null,loadedQuality=null;
export const semiAssetReady=()=>!!template;
export function prepareSemiTemplate(scene){
 for(const name of SEMI_REQUIRED_NODES)if(!scene.getObjectByName(name))throw Error('Semi rig missing '+name);
 scene.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;o.userData.semantic=3;
  if(o.material.name==='Semi_Laminated_Glass'){o.material.transparent=true;o.material.depthWrite=false;o.material.side=THREE.DoubleSide;}
 });
 scene.updateMatrixWorld(true);return scene;
}
export function loadSemiAsset(onProgress){
 if(template)return Promise.resolve(true);
 // Select once on first explicit vehicle load, never prefetch or silently upgrade.
 // A changed preference takes effect after page reload, keeping existing cars stable.
 if(!loading){
  const quality=selectSemiAssetQuality(),asset=semiAssetDescriptor(quality);
  loading=new GLTFLoader().loadAsync(new URL('./assets/'+asset.file+'?v='+asset.sha256,import.meta.url).href,onProgress).then(gltf=>{
   template=prepareSemiTemplate(gltf.scene);loadedQuality=quality;template.userData.meshDetail=quality;return true;
  }).catch(error=>{loading=null;loadedQuality=null;console.warn('Semi asset failed to load; retry available.',error);return false;});
 }
 return loading;
}
export function instantiateSemiTemplate(source,model={id:'semi'},colorOverride=null){
 const root=source.clone(true),get=n=>root.getObjectByName(n),paint=new Map();
 // Each screen material belongs to its own vehicle instance.
 for(const side of ['Left','Right'])get(side+'_Display_Surface').material=get(side+'_Display_Surface').material.clone();
 root.traverse(o=>{if(!o.isMesh||colorOverride===null||o.material.name!=='Semi_Pearl_White')return;if(!paint.has(o.material)){const m=o.material.clone();m.color.setHex(colorOverride);paint.set(o.material,m);}o.material=paint.get(o.material);});
 const wheels=['FL','FR','ML','MR','RL','RR'].map(s=>({pivot:get('WheelPivot_'+s),spin:get('WheelSpin_'+s),side:s.endsWith('L')?-1:1,front:s.startsWith('F'),radius:.56,axle:s[0]}));
 const doors=['L','R'].map((s,i)=>({pivot:get('DoorPivot_'+s),side:i===0?-1:1,opening:'conventional'}));
 root.userData={...root.userData,model:model.id,release:'2.0 Beta',design:'original-detailed-semi',cabin:{rows:1,seats:1,layout:'center-driver',roofHeight:3.85},physicsPrototype:"four-contact-tandem-visual",requiresSixWheelPhysicsValidation:true};
 return{root,chassis:get('Chassis'),model,wheels,doors,steeringWheel:get('SteeringWheel'),asset:'Original detailed Semi GLB',
  wheelBase:4.725,frontAxle:-2.38,rearAxle:2.345,track:2.08,maxSteer:.48,halfLength:3.91,mass:model.mass??11500,lateralGrip:model.tireGrip??9.0,
  physicsWheelOffsets:[[-1.04,.1,-2.38,.56,.57],[1.04,.1,-2.38,.56,.57],[-1.04,.1,2.345,.56,.57],[1.04,.1,2.345,.56,.57]],
  collisionBounds:{minX:-1.25,maxX:1.25,minZ:-3.91,maxZ:3.84,minY:0,maxY:3.85},dimensions:{length:7.75,width:2.5,height:3.85},height:3.85,halfWidth:1.25,
  driverPosition:new THREE.Vector3(0,1.71,-1.47),driverCamera:new THREE.Vector3(0,2.73,-1.37),driverViewPitch:.10,
  exitPosition:new THREE.Vector3(-1.85,0,-.55),entryOpening:{front:-1.23,rear:.48,sill:1.12,roof:3.12},
  semiRig:{leftDisplay:get('Left_Display_Surface'),rightDisplay:get('Right_Display_Surface'),hitch:get('TrailerHitch'),camera:get('DriverCamera')}
 };
}
export function createSemiCar(model,simple=false,colorOverride=null){return template?instantiateSemiTemplate(template,typeof model==='string'?{id:model}:model,colorOverride):null;}
export function setSemiDoorOpen(car,side,amount){const door=car?.doors?.find(d=>d.side===(side==='L'?-1:1));if(door)door.pivot.rotation.y=Math.max(0,Math.min(1,Number(amount)||0))*1.25*(side==='L'?1:-1);}
registerVehicleAsset(SEMI_MODEL_IDS,{ready:semiAssetReady,load:loadSemiAsset});
