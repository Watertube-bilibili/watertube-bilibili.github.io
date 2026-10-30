import {createEntryAnimation,sampleEntryAnimation} from './entry-animation.js';
import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
const unit=v=>Math.max(0,Math.min(1,Number.isFinite(v)?v:0));
export const blenderSPreviewEnabled=(search=globalThis.location?.search??'')=>{const p=new URLSearchParams(search);if(p.get('runtime')==='browser'&&['estuary','crescent'].includes(p.get('world')))return true;return (p.get('world')==='estuary'||p.get('preview')==='1'&&p.get('map')==='estuary')&&p.get('blenderVehicle')==='volt-s-v2';};
let template=null;
export async function loadBlenderSPreview(){
 if(!template){const gltf=await new GLTFLoader().loadAsync(new URL('./assets/volt-s-blender-v2.glb',import.meta.url).href);template=gltf.scene;validateBlenderSAnchors(template);}
 return true;
}
export function validateBlenderSAnchors(root){
 root.updateMatrixWorld(true);
 const position=name=>{const o=root.getObjectByName(name);if(!o)throw Error('Missing Blender S node: '+name);return o.getWorldPosition(new THREE.Vector3());};
 const fl=position('Wheel_FL'),fr=position('Wheel_FR'),rl=position('Wheel_RL'),rr=position('Wheel_RR'),head=position('MatrixHousing-1'),tail=position('RearRibbon'),driver=position('SteeringWheelPivot'),seat=position('FrontSeatInset-1');
 if(!(fl.z<rl.z&&fr.z<rr.z&&head.z<fl.z&&tail.z>rl.z&&fl.x<0&&rl.x<0&&fr.x>0&&rr.x>0&&driver.x<0))throw Error('Blender S coordinate contract failed');
 return{front:'-Z',driverLeft:'-X',wheelBase:rl.z-fl.z,track:fr.x-fl.x,head:head.toArray(),tail:tail.toArray(),driver:driver.toArray(),seat:seat.toArray()};
}
export function createBlenderSPreview(model,source=template){
 if(!source)throw Error('Blender S preview requested before GLB loaded; no substitute model');
 const root=new THREE.Group();root.name='VOLT-S-Blender-v2-preview';root.userData.model='s';
 const chassis=source.clone(true);root.add(chassis);const anchors=validateBlenderSAnchors(root);
 const get=n=>{const o=root.getObjectByName(n);if(!o)throw Error('Missing '+n);return o;};
 const wheels=[];
 for(const [name,side,front] of [['FL',-1,true],['FR',1,true],['RL',-1,false],['RR',1,false]]){
  const authored=get('Wheel_'+name),pivot=new THREE.Group(),spin=new THREE.Group();pivot.name='BlenderS-steer-'+name;spin.name='BlenderS-spin-'+name;
  root.updateMatrixWorld(true);pivot.position.copy(authored.getWorldPosition(new THREE.Vector3()));root.add(pivot);pivot.add(spin);root.updateMatrixWorld(true);
  // Caliper stays with steering, rotor and tire roll. Mesh bytes untouched.
  for(const child of [...authored.children])(/BrakeCaliper/.test(child.name)?pivot:spin).attach(child);
  wheels.push({pivot,spin,side,front,radius:.385});
 }
 const doors=['FL','FR','RL','RR'].map(name=>{const pivot=get('Hinge_Door_'+name),side=name.endsWith('L')?-1:1,rest=pivot.quaternion.clone(),axis=new THREE.Vector3(...pivot.userData.axisLocal);return{pivot,side,opening:'blender-authored',setAngle(angle){if(this.structuralDetached||pivot.userData.structuralDetached)return;pivot.quaternion.copy(rest).multiply(new THREE.Quaternion().setFromAxisAngle(axis,side*Math.min(1.18,Math.abs(Number(angle)||0))));}};});
 const steering=get('SteeringWheelPivot'),steeringRest=steering.quaternion.clone(),steeringAxis=new THREE.Vector3(...steering.userData.rotationAxisLocal);
 const pedals={};for(const key of ['Brake','Accelerator']){const node=get(key+'PedalPivot');pedals[key]={node,rest:node.quaternion.clone(),axis:new THREE.Vector3(...node.userData.axisLocal),travel:node.userData.travelRad};}
 root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.semantic=3;}});
 return{root,chassis,wheels,doors,model,steeringWheel:steering,setSteeringAngle(angle){steering.quaternion.copy(steeringRest).multiply(new THREE.Quaternion().setFromAxisAngle(steeringAxis,-angle));},blenderSRig:{pedals,anchors,steeringRest},wheelBase:anchors.wheelBase,rearAxle:1.43,track:anchors.track,maxSteer:.6,lateralGrip:9.8,height:1.47,halfWidth:.97,dimensions:{length:4.88,width:1.94,height:1.47},mass:model.mass,driverCamera:new THREE.Vector3(-.425,1.25,.03),driverPosition:new THREE.Vector3(anchors.seat[0],anchors.seat[1]+.0125-.18,anchors.seat[2]+.105),exitPosition:new THREE.Vector3(-1.70,0,-.25),driverViewPitch:.14,instrumentPosition:new THREE.Vector3(-.425,.97,-.80),instrumentSize:[.34,.15],entryOpening:{front:-.98,rear:.27,sill:.23,roof:1.47},asset:'Exact reviewed original Blender VOLT S v2; explicit preview only'};
}
export function updateBlenderSPedals(v,input={}){
 if(!v?.blenderSRig)return;
 const pilot=input.brakeSource==='pilot',parked=v.parkingBrakeEngaged;
 let throttle=parked||pilot?0:Number(input.throttle)||0,brake=parked||pilot?0:(input.brake===true?1:unit(input.brake));
 if(throttle<0&&(v.speed??0)>1.2){brake=Math.max(brake,-throttle);throttle=0;}
 for(const [key,value] of [['Brake',brake],['Accelerator',Math.abs(throttle)]]){const p=v.blenderSRig.pedals[key];p.node.quaternion.copy(p.rest).multiply(new THREE.Quaternion().setFromAxisAngle(p.axis,p.travel*unit(value)));}
}
export function resetBlenderSRig(v){if(!v?.blenderSRig)return;updateBlenderSPedals(v,{});v.steeringWheel.quaternion.copy(v.blenderSRig.steeringRest);for(const d of v.doors)d.setAngle(0);}

// Reuse the actual selected game character and original entry choreography.
// No duplicate avatar, hidden occupant, scaling, or alternate vehicle geometry.
export function updateBlenderSOccupant(game){
 const v=game?.vehicle,p=game?.person;
 // Restore the exact prior visibility first, including leaving this vehicle/view.
 if(p?.blenderSViewVisibility){for(const [node,visible] of p.blenderSViewVisibility)node.visible=visible;delete p.blenderSViewVisibility;}
 if(!v?.blenderSRig||!p||!game.inCar||game.transition)return false;
 const plan=createEntryAnimation({entering:true,vehiclePosition:{x:0,y:0,z:0},vehicleYaw:0,driverPosition:v.driverPosition,exitPosition:v.exitPosition,halfWidth:v.halfWidth,height:v.height,kind:game.character==='mochi'?'cat':'human'});
 const pose=sampleEntryAnimation(plan,plan.duration);v.chassis.updateWorldMatrix(true,false);
 p.root.position.set(pose.position.x,pose.position.y,pose.position.z).applyMatrix4(v.chassis.matrixWorld);
 const local=new THREE.Quaternion().setFromEuler(new THREE.Euler(pose.pitch,pose.yaw,0,'YXZ'));
 p.root.quaternion.copy(v.chassis.getWorldQuaternion(new THREE.Quaternion())).multiply(local);p.root.scale.set(1,1,1);p.root.visible=true;
 // Actual Game cameraMode 1 is first-person. The monolithic torso mesh
 // crosses the close camera view; mask that mesh, not the original character
 // root or limb groups. Preserve hands/legs and restore all prior visibility.
 if(game.cameraMode===1){const nodes=new Set([p.head,p.hair,p.body].filter(Boolean));p.root.traverse(node=>{if(['CharacterHead','CharacterHair','CharacterHairExtra','CharacterHeadwear'].includes(node.name))nodes.add(node);});p.blenderSViewVisibility=[...nodes].map(node=>[node,node.visible]);for(const node of nodes)node.visible=false;}
 for(const [limbs,angles] of [[p.arms??[],pose.arms],[p.legs??[],pose.legs]])limbs.forEach((limb,i)=>{const a=angles[i];if(a)limb.rotation.set(a.x,a.y,a.z);});return true;
}
