import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';

// All six characters are Quaternius CC0 adaptations. Geometry/materials are
// shared; every actor owns an independent skeleton and AnimationMixer.
export const CHARACTER_ASSETS=Object.freeze([
 {id:'male-hoodie',gender:'male',outfit:'hoodie'},
 {id:'female-casual',gender:'female',outfit:'casual'},
 {id:'male-casual',gender:'male',outfit:'casual'},
 {id:'female-formal',gender:'female',outfit:'formal'},
 {id:'male-worker',gender:'male',outfit:'worker'},
 {id:'female-worker',gender:'female',outfit:'worker'}
]);
const templates=new Map(),requests=new Map();
let nextVariant=0;
const CLIPS=Object.freeze({idle:'Idle_Neutral',walk:'Walk',run:'Run',death:'Death',aim:'Idle_Gun_Pointing',interact:'Interact'});
const PLAYER_ASSETS=new Map([[0xddd6b4,'male-hoodie'],[0x8a8e9b,'female-casual'],[0x476c74,'male-worker']]);
export function characterAssetId(color,options={}){
 return CHARACTER_ASSETS.some(a=>a.id===options.assetId)?options.assetId:
  PLAYER_ASSETS.get(color)??CHARACTER_ASSETS[nextVariant++%CHARACTER_ASSETS.length].id;
}
export function characterAssetReady(id){return templates.has(id);}
export function registerCharacterTemplate(id,gltf){
 if(!gltf?.scene||!gltf?.animations?.length)throw new Error('CHARACTER_ASSET_INVALID');
 const clips=new Map(gltf.animations.map(c=>[c.name,c]));
 for(const name of ['Idle_Neutral','Walk','Run','Death'])if(!clips.has(name))throw new Error('CHARACTER_ANIMATION_MISSING: '+name);
 let meshes=0;gltf.scene.traverse(o=>{if(o.isSkinnedMesh){meshes++;o.geometry.computeBoundingSphere();o.geometry.boundingSphere.radius=Math.max(2.4,o.geometry.boundingSphere.radius);o.frustumCulled=true;o.userData.semantic=4;}});
 if(meshes!==1)throw new Error('CHARACTER_MESH_BUDGET_EXCEEDED');
 const template={scene:gltf.scene,clips};templates.set(id,template);return template;
}
export function loadCharacterAsset(id){
 if(templates.has(id))return Promise.resolve(templates.get(id));
 if(!CHARACTER_ASSETS.some(a=>a.id===id))return Promise.reject(new Error('UNKNOWN_CHARACTER_ASSET'));
 if(!requests.has(id))requests.set(id,new GLTFLoader().loadAsync(new URL(`./assets/characters/${id}.glb`,import.meta.url).href)
  .then(gltf=>registerCharacterTemplate(id,gltf)).catch(error=>{requests.delete(id);throw error;}));
 return requests.get(id);
}
export function cloneCharacterSkeleton(source){
 const clone=source.clone(true),nodes=new Map(),skeletons=new Map();
 function pair(a,b){nodes.set(a,b);for(let i=0;i<a.children.length;i++)pair(a.children[i],b.children[i]);}pair(source,clone);
 source.traverse(original=>{if(!original.isSkinnedMesh)return;const mesh=nodes.get(original);
  if(!skeletons.has(original.skeleton)){const skeleton=original.skeleton.clone();skeleton.bones=original.skeleton.bones.map(b=>nodes.get(b));if(skeleton.bones.some(b=>!b))throw new Error('CHARACTER_BONE_CLONE_MISSING');skeletons.set(original.skeleton,skeleton);}
  mesh.skeleton=skeletons.get(original.skeleton);mesh.bindMatrix.copy(original.bindMatrix);mesh.bindMatrixInverse.copy(original.bindMatrixInverse);
 });return clone;
}

/** Keep the old proxy limbs for entry/weapon/collision callers. Successful
 * loading hides only their old meshes, not the pivot objects or attached gun. */
export function attachCharacterAsset(actor,{color,assetId,autoLoad=true}={}){
 const id=assetId??characterAssetId(color),root=actor.root,placeholderMeshes=[];
 root.traverse(o=>{if(o.isMesh)placeholderMeshes.push(o);});
 root.userData.characterAssetId=id;root.userData.characterAssetState='loading';root.userData.characterHeight=1.85;
 const legacyAnimate=actor.animate.bind(actor),headProxy=actor.head;
 let disposed=false,model=null,mesh=null,mixer=null,template=null,current=null,forced=null,lastTime=null,lastSample=-Infinity,poseMode=false;
 let headBone=null,restFeet=null;const footPoints=Array.from({length:8},()=>new THREE.Vector3()),v=new THREE.Vector3();
 const bones={},bindPose={},aimPose={};
 function select(state,phase=0){
  if(!mixer)return false;const name=CLIPS[state]??CLIPS.idle,clip=template.clips.get(name)??template.clips.get(CLIPS.idle);
  if(current?.clip===clip)return true;
  const previous=current?.action,action=mixer.clipAction(clip);action.reset();action.clampWhenFinished=state==='death';action.setLoop(state==='death'?THREE.LoopOnce:THREE.LoopRepeat,state==='death'?1:Infinity);action.time=state==='death'?0:Math.max(0,phase)%clip.duration;action.play();if(previous)previous.crossFadeTo(action,.12,false);
  current={action,clip,state};root.userData.characterAnimation=state;return true;
 }
 actor.setAnimationState=state=>{if(state==null){forced=null;return !!mixer;}if(state==='aim'){forced='aim';return !!mixer;}forced=state==='death'||state==='aim'||state==='interact'?state:null;if(current?.state!==(state??'idle'))lastSample=-Infinity;return select(state??'idle');};
 actor.getFootSamples=({posed=false}={})=>{
  if(!mesh)return null;if((!posed||current?.state==='death')&&restFeet)return restFeet;
  root.updateMatrixWorld(true);mesh.skeleton.update();const ids=mesh.userData.soleVertexIndices??[];
  for(let i=0;i<ids.length;i++){const p=footPoints[i]??(footPoints[i]=new THREE.Vector3());p.fromBufferAttribute(mesh.geometry.attributes.position,ids[i]);mesh.applyBoneTransform(ids[i],p);p.applyMatrix4(mesh.matrixWorld);root.worldToLocal(p);}
  footPoints.length=ids.length;return footPoints;
 };
 actor.applyPose=pose=>{
  if(!mixer)return false;poseMode=!!pose;
  if(!pose){current=null;lastSample=-Infinity;return true;}
  // Existing entry curves operate in proxy world axes. Build rotations from
  // the rig's bind pose instead of overwriting its non-zero rest orientation.
  mixer.stopAllAction();
  for(const [name,bone] of Object.entries(bones)){bone.position.copy(bindPose[name].position);bone.quaternion.copy(bindPose[name].quaternion);}
  for(const [side,i] of [['L',0],['R',1]])for(const [name,angles] of [[`UpperArm${side}`,pose.arms?.[i]],[`UpperLeg${side}`,pose.legs?.[i]]]){
   const bone=bones[name];if(!bone||!angles)continue;
   const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(angles.x??0,angles.y??0,angles.z??0));bone.quaternion.premultiply(q);
  }
  model.updateMatrixWorld(true);updateHead();return true;
 };
 function updateHead(){if(!headBone)return;headBone.getWorldPosition(v);root.worldToLocal(v);headProxy.position.copy(v);}
 function install(value){
  // A shared loading promise can have several retry subscribers. Install
  // exactly once per actor, and never mount after that actor was disposed.
  if(disposed||model)return actor;template=value;model=cloneCharacterSkeleton(value.scene);model.name='licensed-character-'+id;
  // Quaternius faces +Z, while game actors face -Z. Keep the public root's
  // unit scale and world coordinates unchanged for entry and collisions.
  const visual=new THREE.Group();visual.name='character-visual';visual.rotation.y=Math.PI;visual.add(model);root.add(visual);
  model.traverse(o=>{if(o.isBone){bones[o.name]=o;bindPose[o.name]={position:o.position.clone(),quaternion:o.quaternion.clone()};}if(o.isSkinnedMesh){mesh=o;o.castShadow=true;o.receiveShadow=true;o.userData.semantic=4;}});
  const bounds=new THREE.Box3().setFromObject(model,true),height=bounds.max.y-bounds.min.y;visual.scale.setScalar(1.85/height);visual.position.y=-bounds.min.y*visual.scale.x;
  mixer=new THREE.AnimationMixer(model);headBone=bones.Head;
  for(const track of template.clips.get(CLIPS.aim)?.tracks??[]){const split=track.name.lastIndexOf('.'),name=track.name.slice(0,split),property=track.name.slice(split+1);if(/^(Shoulder|UpperArm|LowerArm|Wrist|Index|Middle|Ring|Pinky|Thumb)/.test(name)&&bones[name]&&(property==='quaternion'||property==='position'))(aimPose[name]??={})[property]=Array.from(track.values.slice(0,track.getValueSize()));}
  placeholderMeshes.forEach(o=>{o.visible=false;o.userData.characterPlaceholder=true;});
  // Hide old hair/cap decorations added by switchCharacter while loading.
  for(const child of root.children)if(child.isMesh&&child!==headProxy)child.visible=false;
  root.userData.characterAssetState='ready';root.userData.characterDrawCalls=1;root.userData.characterBones=mesh.skeleton.bones.length;
  select(forced??'idle');mixer.update(0);for(const [name,bone] of Object.entries(bones))bindPose[name]={position:bone.position.clone(),quaternion:bone.quaternion.clone()};root.updateMatrixWorld(true);restFeet=actor.getFootSamples({posed:true}).map(p=>p.clone());updateHead();
  root.dispatchEvent({type:'characterready',assetId:id});return actor;
 }
 actor.animate=(time,speed=1)=>{
  if(!mixer){legacyAnimate(time,speed);return;}
  const t=Number.isFinite(time)?time:0,distance=Number(root.userData.characterDistance??0),interval=distance>120?.2:distance>45?1/15:0;
  root.position.y=0; // Public legacy contract: caller adds ground height.
  if(poseMode){poseMode=false;current=null;}
  const locomotion=speed>1.25?'run':speed>.05?'walk':'idle',state=forced==='aim'&&speed>.05?locomotion:forced??locomotion;
  if(current?.state!==state)select(state,t);
  if(lastTime===null){current.action.time=state==='death'?0:t%current.clip.duration;lastTime=t;}
  if(t-lastSample<interval&&t>=lastSample)return;
  const delta=Math.max(0,Math.min(1,t-lastTime));lastTime=t;lastSample=t;mixer.update(delta);if(forced==='aim'&&speed>.05)for(const [name,pose] of Object.entries(aimPose))for(const [property,values] of Object.entries(pose))bones[name][property].fromArray(values);root.userData.characterAnimationSamples=(root.userData.characterAnimationSamples??0)+1;
  mesh.castShadow=distance<42;
  root.updateMatrixWorld(true);updateHead();
 };
 actor.disposeCharacter=()=>{disposed=true;root.userData.characterAssetState='disposed';mixer?.stopAllAction();if(model)mixer?.uncacheRoot(model);};
 actor.retryCharacterAsset=()=>disposed||root.userData.characterAssetState==='ready'?Promise.resolve(actor):loadCharacterAsset(id).then(install).catch(error=>{if(!disposed){root.userData.characterAssetState='error';root.userData.characterAssetError=String(error.message??error);}return actor;});
 if(templates.has(id)){install(templates.get(id));actor.assetReady=Promise.resolve(actor);}
 else if(autoLoad&&typeof window!=='undefined')actor.assetReady=actor.retryCharacterAsset();
 else actor.assetReady=Promise.resolve(actor);
 return actor;
}
