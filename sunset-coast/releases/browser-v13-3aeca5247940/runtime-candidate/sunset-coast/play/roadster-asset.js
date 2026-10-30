import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {registerVehicleAsset} from './vehicle-asset-registry.js';
import {ROADSTER_MODELS} from './roadster-vehicle.js';

// The actual Blender-authored GLB supplies body, interior, doors, wing and wheels.
// One shared download/template serves all trims and all player/NPC instances.
export const ROADSTER_ASSET_SHA256='8dd82b6e02f96b26f67cb092f8f9ee55db5578c5d3a0998fce9498ed3a051424';
let template=null,loading=null;
export const roadsterAssetReady=()=>!!template;
export function loadRoadsterAsset(onProgress){
 if(template)return Promise.resolve(true);
 if(!loading)loading=new GLTFLoader().loadAsync(new URL('./assets/roadster.glb?v='+ROADSTER_ASSET_SHA256,import.meta.url).href,onProgress).then(gltf=>{template=prepare(gltf.scene);return true;}).catch(error=>{loading=null;console.warn('Roadster model could not load; retry available.',error);return false;});
 return loading;
}
const required=['Chassis','DoorPivot_L','DoorPivot_R','WheelPivot_FL','WheelPivot_FR','WheelPivot_RL','WheelPivot_RR','WheelSpin_FL','WheelSpin_FR','WheelSpin_RL','WheelSpin_RR','WingLift','WingPitch','HoodAeroPivot','SideAeroPivot_L','SideAeroPivot_R','FrontAero','RearThrusters','AttitudeThrusters','DriverSeat','PassengerSeat','RocketEquipment','SteeringWheel','Center_Display_Surface'];
function removeNumericSlivers(mesh){
 // Bevel intersections can export sub-micron triangles. Removing only faces
 // below 10 micrometers avoids Float32 collapse during real dent deformation.
 const g=mesh.geometry,p=g.attributes.position,index=g.index,keep=[],a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),ab=new THREE.Vector3(),ac=new THREE.Vector3(),cross=new THREE.Vector3();
 const count=index?.count??p.count;
 for(let i=0;i+2<count;i+=3){const ids=[0,1,2].map(k=>index?index.getX(i+k):i+k);a.fromBufferAttribute(p,ids[0]);b.fromBufferAttribute(p,ids[1]);c.fromBufferAttribute(p,ids[2]);ab.subVectors(b,a);ac.subVectors(c,a);const longest=Math.sqrt(Math.max(ab.lengthSq(),ac.lengthSq(),b.distanceToSquared(c)));if(longest&&cross.crossVectors(ab,ac).length()/longest>1e-5)keep.push(...ids);}
 if(keep.length<count)g.setIndex(keep);
}
function prepare(source){
 source.traverse(o=>{if(o.isMesh)removeNumericSlivers(o);});
 const root=new THREE.Group();root.name='BlenderRoadster';root.add(source);
 for(const name of required)if(!root.getObjectByName(name))throw Error('Roadster rig is missing '+name);
 // Merge static material batches only within each existing rigid group. Door,
 // wing, trim, seat, steering and wheel pivots remain independent named nodes.
 function batch(group){
  for(const child of [...group.children])if(!child.isMesh)batch(child);
  const sets=new Map();for(const child of [...group.children]){
   if(!child.isMesh||Array.isArray(child.material)||['Driver_Display_Surface','Center_Display_Surface','Aux_Display_Surface'].includes(child.name))continue;
   const key=child.material.uuid+':'+Object.keys(child.geometry.attributes).sort().join(',')+':'+!!child.geometry.index;
   if(!sets.has(key))sets.set(key,[]);sets.get(key).push(child);
  }
  for(const parts of sets.values()){
   if(parts.length<2)continue;
   const geometries=parts.map(o=>{o.updateMatrix();return o.geometry.clone().applyMatrix4(o.matrix);});
   const geometry=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());if(!geometry)continue;
   const merged=new THREE.Mesh(geometry,parts[0].material);merged.name=group.name+'_'+parts[0].material.name;group.add(merged);parts.forEach(o=>group.remove(o));
  }
 }
 batch(root);
 root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.semantic=3;if(o.material.name==='Roadster_Copper_Glass'){o.material.depthWrite=false;o.material.side=THREE.DoubleSide;}}});
 root.updateMatrixWorld(true);return root;
}
export function createRoadsterCar(model,simple=false,colorOverride=null){
 if(typeof model==='string')model=ROADSTER_MODELS.find(m=>m.id===model);
 if(!model||!template)return null;
 const root=template.clone(true),get=name=>root.getObjectByName(name),chassis=get('Chassis'),trim=model.roadsterTrim;
 get('PassengerSeat').visible=trim!=='rocket';get('RocketEquipment').visible=trim==='rocket';get('RearThrusters').visible=trim!=='performance';get('AttitudeThrusters').visible=trim==='rocket';
 const paintMaterials=new Map();root.traverse(o=>{if(!o.isMesh)return;if(colorOverride!==null&&o.material.name==='Roadster_Ano_White'){if(!paintMaterials.has(o.material)){const clone=o.material.clone();clone.color.setHex(colorOverride);paintMaterials.set(o.material,clone);}o.material=paintMaterials.get(o.material);}});
 const wheels=[];for(const [suffix,side,front]of[['FL',-1,true],['FR',1,true],['RL',-1,false],['RR',1,false]]){
  const pivot=get('WheelPivot_'+suffix),spin=get('WheelSpin_'+suffix);pivot.rotation.set(0,0,0);spin.rotation.set(0,0,0);wheels.push({pivot,spin,side,front,radius:.389});
  if(simple)get('WheelDetail_'+suffix).visible=false;
 }
 const doors=[[-1,'L'],[1,'R']].map(([side,suffix])=>({pivot:get('DoorPivot_'+suffix),side,opening:'upward',openAxis:new THREE.Vector3(-.94,side*.34,0).normalize()}));
 root.userData={...root.userData,model:model.id,design:'blender-roadster-2026',gameplaySpecifications:true,reference:'https://www.tesla.com/roadster',cabin:{rows:1,seats:trim==='rocket'?1:2,layout:trim==='rocket'?'1':'2',seatRows:[.22],roofHeight:1.26}};
 root.updateMatrixWorld(true);
 return{root,chassis,wheels,doors,model,steeringWheel:get('SteeringWheel'),asset:'Blender-authored Roadster GLB',roadsterTrim:trim,
  roadsterRig:{wingLift:get('WingLift'),wingPitch:get('WingPitch'),wingSupports:[get('WingSupport_L'),get('WingSupport_R')],frontAero:get('FrontAero'),hoodAero:get('HoodAeroPivot'),sideAero:[get('SideAeroPivot_L'),get('SideAeroPivot_R')],rearThrusters:get('RearThrusters'),attitudeThrusters:get('AttitudeThrusters')},
  wheelBase:2.85,rearAxle:1.42,track:1.76,maxSteer:.58,lateralGrip:model.tireGrip,mass:model.mass,
  collisionBounds:{minX:-1.06,maxX:1.06,minZ:-2.41,maxZ:2.44,minY:-.004,maxY:1.265},dimensions:{length:4.76,width:2.08,height:1.26},height:1.26,halfWidth:1.04,
  driverPosition:new THREE.Vector3(-.425,.225,.22),driverCamera:new THREE.Vector3(-.425,1.035,.08),driverViewPitch:.10,
  exitPosition:new THREE.Vector3(-1.87,0,.15),entryOpening:{front:-.96,rear:.795,sill:.205,roof:1.26},
  instrumentPosition:new THREE.Vector3(-.62,.94,-.878),instrumentSize:[.207,.061],instrumentTilt:0,pedalMount:new THREE.Vector3(-.425,.27,-.73)};
}
// Common entry code uses angle about a conventional door's Y hinge. A Roadster
// door follows its explicit inclined front hinge instead, rising up and out.
export function setVehicleDoorAngle(door,angle=0){
 if(!door?.pivot)return;
 if(door.setAngle){door.setAngle(angle);return;}
 if(door.opening==='upward')door.pivot.quaternion.setFromAxisAngle(door.openAxis,Math.min(1,Math.abs(angle)/1.16)*1.28);
 else door.pivot.rotation.y=angle;
}

registerVehicleAsset(ROADSTER_MODELS.map(model=>model.id),{ready:roadsterAssetReady,load:loadRoadsterAsset});
