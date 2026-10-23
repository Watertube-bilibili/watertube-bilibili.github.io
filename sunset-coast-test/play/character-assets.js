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
 let headBone=null,restFeet=null,pendingPose=null,entryStart=null;const entryRig={};const footPoints=Array.from({length:8},()=>new THREE.Vector3()),v=new THREE.Vector3();
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
 // Entry curves were authored for rigid proxy limbs. Their Euler angles are
 // actor-space intent, NOT local rotations of the Quaternius bones. In this
 // rig FootL/R are independent children of Root, so rotating a thigh alone
 // leaves the shoes behind. Retarget in world space and solve both leg links.
 const clamp01=n=>Math.max(0,Math.min(1,n));
 const smooth01=n=>{const t=clamp01(n);return t*t*(3-2*t);};
 const worldPoint=bone=>bone.getWorldPosition(new THREE.Vector3());
 function worldRotation(bone,q){const parentQ=bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert();bone.quaternion.copy(parentQ.multiply(q));bone.updateMatrixWorld(true);}
 function rotateLink(bone,from,to){
  if(from.lengthSq()<1e-12||to.lengthSq()<1e-12)return;
  const delta=new THREE.Quaternion().setFromUnitVectors(from.normalize(),to.normalize());
  worldRotation(bone,delta.multiply(bone.getWorldQuaternion(new THREE.Quaternion())));
 }
 function solveLeg(side,target,forward,footRotation){
  const rig=entryRig[side],upper=bones['UpperLeg'+side],lower=bones['LowerLeg'+side],foot=bones['Foot'+side];
  const hip=worldPoint(upper),ray=target.clone().sub(hip),distance=ray.length();
  const d=Math.max(1e-5,Math.min(rig.thigh+rig.shin-1e-5,Math.max(Math.abs(rig.thigh-rig.shin)+1e-5,distance)));
  // On high cabs the old path can lift the pelvis before the floor rises.
  // Lift the foot as a step instead of stretching/detaching the shin.
  const axis=ray.normalize();if(Math.abs(distance-d)>1e-8)target.copy(hip).addScaledVector(axis,d);
  const pole=forward.clone().addScaledVector(axis,-forward.dot(axis)).normalize();
  if(pole.lengthSq()<1e-8)pole.set(0,1,0);
  const along=(rig.thigh*rig.thigh-rig.shin*rig.shin+d*d)/(2*d);
  const knee=hip.clone().addScaledVector(axis,along).addScaledVector(pole,Math.sqrt(Math.max(0,rig.thigh*rig.thigh-along*along)));
  rotateLink(upper,worldPoint(lower).sub(hip),knee.clone().sub(hip));
  const lowerQ=lower.getWorldQuaternion(new THREE.Quaternion());
  rotateLink(lower,rig.lowerAxis.clone().applyQuaternion(lowerQ),target.clone().sub(worldPoint(lower)));
  foot.position.copy(foot.parent.worldToLocal(target.clone()));worldRotation(foot,footRotation);
 }
 function initializeEntryRig(){
  // Snapshot in the actor's neutral frame. The skinned vertex candidates
  // include blended ankle weights and are deduplicated once, not every frame.
  mesh.skeleton.update();const positions=mesh.geometry.attributes.position,weights=mesh.geometry.attributes.skinWeight,indices=mesh.geometry.attributes.skinIndex;
  const localVertices=[];for(let i=0;i<positions.count;i++){const p=new THREE.Vector3().fromBufferAttribute(positions,i);mesh.applyBoneTransform(i,p);p.applyMatrix4(mesh.matrixWorld);root.worldToLocal(p);localVertices.push(p);}
  entryRig.sole=Math.min(...localVertices.map(p=>p.y));
  for(const side of ['L','R']){
   const upper=bones['UpperLeg'+side],lower=bones['LowerLeg'+side],foot=bones['Foot'+side];if(!upper||!lower||!foot)continue;
   const hip=worldPoint(upper),knee=worldPoint(lower),ankle=worldPoint(foot),localFoot=root.worldToLocal(ankle.clone()),soleVertices=[],seen=new Set();
   for(let i=0;i<positions.count;i++){
    if(localVertices[i].y>localFoot.y+.18)continue;
    if(![0,1,2,3].some(j=>weights.array[i*4+j]>.01&&mesh.skeleton.bones[indices.array[i*4+j]]===foot))continue;
    const key=[...localVertices[i].toArray(),...indices.array.slice(i*4,i*4+4),...weights.array.slice(i*4,i*4+4)].join(',');if(!seen.has(key)){seen.add(key);soleVertices.push(i);}
   }
   const armUpper=bones['UpperArm'+side],armLower=bones['LowerArm'+side],wrist=bones['Wrist'+side];
   entryRig[side]={thigh:hip.distanceTo(knee),shin:knee.distanceTo(ankle),foot:localFoot,clearance:localFoot.y-entryRig.sole,soleVertices,
    lowerAxis:ankle.clone().sub(knee).applyQuaternion(lower.getWorldQuaternion(new THREE.Quaternion()).invert()),
    footQuaternion:root.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(foot.getWorldQuaternion(new THREE.Quaternion())),
    arm:armUpper&&armLower&&wrist?{upper:worldPoint(armUpper).distanceTo(worldPoint(armLower)),lower:worldPoint(armLower).distanceTo(worldPoint(wrist)),wrist:root.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(wrist.getWorldQuaternion(new THREE.Quaternion()))}:null};
  }
 }
 actor.applyPose=pose=>{
  pendingPose=pose;
  if(!mixer||disposed)return false;
  if(!pose){poseMode=false;entryStart=null;current=null;lastSample=-Infinity;return true;}
  if(!poseMode){
   entryStart=pose.entering!==false&&pose.phase==='approach'?Object.fromEntries(Object.entries(bones).map(([name,bone])=>[name,{position:bone.position.clone(),quaternion:bone.quaternion.clone()}])):null;
  }
  poseMode=true;mixer.stopAllAction();
  for(const [name,bone] of Object.entries(bones)){bone.position.copy(bindPose[name].position);bone.quaternion.copy(bindPose[name].quaternion);}
  root.updateMatrixWorld(true);
  if(!entryRig.L)initializeEntryRig();
  const actorQ=root.getWorldQuaternion(new THREE.Quaternion()),yawQ=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),pose.yaw??root.rotation.y);
  const totalLegPitch=Math.max(0,(pose.legs?.[0]?.x??0)+(pose.pitch??0));
  const seated=smooth01(totalLegPitch/1.55),forward=new THREE.Vector3(0,0,-1).applyQuaternion(yawQ);
  // Keep the choreography's hip anchor, blending out the old .8 m proxy
  // offset as the real pelvis lowers. Neither the public root nor scale moves.
  const hipAnchor=new THREE.Vector3(0,.8,0).applyMatrix4(root.matrixWorld);
  if(bones.Body&&bones.Hips){
   const shift=hipAnchor.clone().sub(worldPoint(bones.Hips)).multiplyScalar(seated);
   const bodyTarget=worldPoint(bones.Body).add(shift);
   bones.Body.position.copy(bones.Body.parent.worldToLocal(bodyTarget));root.updateMatrixWorld(true);
  }
  for(const [side,i] of [['L',0],['R',1]]){
   const upperArm=bones['UpperArm'+side],angles=pose.arms?.[i];
   if(upperArm&&angles){
    const delta=new THREE.Quaternion().setFromEuler(new THREE.Euler(angles.x??0,angles.y??0,angles.z??0));
    delta.premultiply(actorQ).multiply(actorQ.clone().invert());
    worldRotation(upperArm,delta.multiply(upperArm.getWorldQuaternion(new THREE.Quaternion())));
   }
   const rig=entryRig[side];if(!rig)continue;
   if(seated>0&&rig.arm){
    const lower=bones['LowerArm'+side],wrist=bones['Wrist'+side],shoulder=worldPoint(upperArm);
    const target=shoulder.clone().addScaledVector(forward,.31).add(new THREE.Vector3(0,-.12,0));
    target.lerpVectors(worldPoint(wrist),target,seated);
    const ray=target.clone().sub(shoulder),d=Math.min(ray.length(),rig.arm.upper+rig.arm.lower-1e-5),axis=ray.normalize();
    const down=new THREE.Vector3(0,-1,0),pole=down.addScaledVector(axis,-down.dot(axis)).normalize();
    const along=(rig.arm.upper**2-rig.arm.lower**2+d*d)/(2*d);
    const elbow=shoulder.clone().addScaledVector(axis,along).addScaledVector(pole,Math.sqrt(Math.max(0,rig.arm.upper**2-along*along)));
    rotateLink(upperArm,worldPoint(lower).sub(shoulder),elbow.sub(shoulder));
    rotateLink(lower,worldPoint(wrist).sub(worldPoint(lower)),target.sub(worldPoint(lower)));
    const handQ=yawQ.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),1.2)).multiply(rig.arm.wrist);
    worldRotation(wrist,wrist.getWorldQuaternion(new THREE.Quaternion()).slerp(handQ,seated));
   }
   const target=rig.foot.clone();target.y=0;target.z=THREE.MathUtils.lerp(target.z,-(rig.thigh+rig.shin)*.83,seated);target.applyQuaternion(yawQ).add(hipAnchor);target.y=(Number.isFinite(pose.floor)?pose.floor:root.position.y+entryRig.sole)+rig.clearance;
   // During the approach keep a modest alternating step, rather than copying
   // a proxy's full straight-leg swing and driving the heel through the floor.
   if(pose.phase==='approach'){const step=pose.legs?.[i]?.x??0;target.addScaledVector(forward,Math.sin(step)*.22);target.y+=Math.max(0,Math.sin(step))*.08;}
   const footRotation=yawQ.clone().multiply(rig.footQuaternion);
   solveLeg(side,target,forward,footRotation);
   // Shoes have mixed Foot/LowerLeg weights. Check actual deformed vertices,
   // not just the controller or eight legacy sole samples, and resolve their
   // small skinning offset while keeping the two leg links attached.
   const floor=Number.isFinite(pose.floor)?pose.floor:root.position.y+entryRig.sole;
   for(let pass=0;pass<4;pass++){
    root.updateMatrixWorld(true);mesh.skeleton.update();let minimum=Infinity;
    for(const index of rig.soleVertices){v.fromBufferAttribute(mesh.geometry.attributes.position,index);mesh.applyBoneTransform(index,v);v.applyMatrix4(mesh.matrixWorld);minimum=Math.min(minimum,v.y);}
    if(minimum>=floor-.001)break;
    target.y+=floor-minimum+.001;solveLeg(side,target,forward,footRotation);
   }
  }
  // The visible Walk/Run skeleton (not stale invisible proxy angles) is the
  // first entry frame. Blend briefly into the door choreography.
  if(entryStart){const blend=smooth01((pose.progress??1)/.10);for(const [name,bone] of Object.entries(bones)){bone.position.lerpVectors(entryStart[name].position,bone.position,blend);bone.quaternion.slerpQuaternions(entryStart[name].quaternion,bone.quaternion,blend);}if(blend>=1)entryStart=null;}
  root.updateMatrixWorld(true);updateHead();return true;
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
  select(forced??'idle');mixer.update(0);for(const [name,bone] of Object.entries(bones))bindPose[name]={position:bone.position.clone(),quaternion:bone.quaternion.clone()};root.updateMatrixWorld(true);restFeet=actor.getFootSamples({posed:true}).map(p=>p.clone());
  updateHead();if(pendingPose)actor.applyPose(pendingPose);
  root.dispatchEvent({type:'characterready',assetId:id});return actor;
 }
 actor.animate=(time,speed=1)=>{
  if(!mixer){legacyAnimate(time,speed);return;}
  const t=Number.isFinite(time)?time:0,distance=Number(root.userData.characterDistance??0),interval=distance>120?.2:distance>45?1/15:0;
  root.position.y=0; // Public legacy contract: caller adds ground height.
  if(poseMode){poseMode=false;entryStart=null;pendingPose=null;current=null;}
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
