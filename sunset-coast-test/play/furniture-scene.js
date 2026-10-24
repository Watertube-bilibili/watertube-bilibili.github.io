import * as THREE from './vendor/three.module.js';
import {createFurniturePhysics} from './furniture-physics.js';

/** Dynamic pieces remain instanced; only their matrices and matching collision
 * poses change. Static walls/counters never enter these batches. */
export function createFurnitureScene(parent,colliders,{definitions,rooms,mobile,materials}){
 const root=new THREE.Group();root.name='bounded-interactive-furniture';root.userData.dynamicFurniture=true;parent.add(root);
 const physics=createFurniturePhysics(definitions,colliders,{mobile,rooms}),batches=new Map(),bodyRefs=new Map(),groups=new Map(),matrix=new THREE.Matrix4(),pose=new THREE.Matrix4(),q=new THREE.Quaternion(),unit=new THREE.Vector3(1,1,1),yAxis=new THREE.Vector3(0,1,0),color=new THREE.Color();
 const cloneBox=new THREE.Box3(),allBounds=new THREE.Box3();
 for(const body of physics.bodies){
  let group=groups.get(body.roomId);if(!group){group=new THREE.Group();group.name='loose-furniture-'+body.roomId;root.add(group);groups.set(body.roomId,group);}
  allBounds.makeEmpty();const parts=body.definition.parts.map(p=>{const local=new THREE.Matrix4().compose(new THREE.Vector3(p.x,p.y,p.z),new THREE.Quaternion().setFromEuler(new THREE.Euler(p.rx??0,p.yaw??0,p.rz??0)),new THREE.Vector3(p.w,p.h,p.d));p.geometry.computeBoundingBox();cloneBox.copy(p.geometry.boundingBox).applyMatrix4(local);allBounds.union(cloneBox);return{...p,local};});
  const floorOffset=.09-allBounds.min.y;body.height=allBounds.max.y-allBounds.min.y;body.baseY=.09;
  body.collider={x:body.x,z:body.z,w:body.w,d:body.d,baseY:body.baseY,height:body.height,yaw:-body.angle,kind:'dynamic-furniture',architectureId:body.roomId,dynamicFurniture:true,furnitureId:body.id};colliders.push(body.collider);bodyRefs.set(body.id,[]);
  for(const p of parts){p.local.elements[13]+=floorOffset;const key=body.roomId+':'+p.mat+':'+p.geometry.uuid;let batch=batches.get(key);if(!batch){batch={group,geometry:p.geometry,material:materials[p.mat],rows:[]};batches.set(key,batch);}batch.rows.push({body,local:p.local,tint:p.tint});}
 }
 for(const batch of batches.values()){
  const mesh=new THREE.InstancedMesh(batch.geometry,batch.material,batch.rows.length);mesh.name='interactive-furniture-batch';mesh.userData.dynamicFurniture=true;mesh.userData.semantic=5;mesh.castShadow=true;mesh.receiveShadow=true;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  batch.rows.forEach((row,index)=>{if(batch.material.userData.instanceTint)mesh.setColorAt(index,color.setHex(row.tint));bodyRefs.get(row.body.id).push({mesh,index,local:row.local});});batch.group.add(mesh);batch.mesh=mesh;batch.rows.length=0;
 }
 const visualRevision=new Map(),nativeRevision=new Map();let nativeTime=0;
 function sync(force=false){const changed=new Set();for(const b of physics.bodies){if(!force&&visualRevision.get(b.id)===b.revision)continue;visualRevision.set(b.id,b.revision);q.setFromAxisAngle(yAxis,-b.angle);pose.compose(new THREE.Vector3(b.x,0,b.z),q,unit);for(const ref of bodyRefs.get(b.id)){matrix.multiplyMatrices(pose,ref.local);ref.mesh.setMatrixAt(ref.index,matrix);changed.add(ref.mesh);}Object.assign(b.collider,{x:b.x,z:b.z,yaw:-b.angle});}for(const mesh of changed){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();}return changed.size;}
 function updateFocus(position,{allDetailed=false}={}){physics.setFocus(position);for(const [id,g]of groups){const room=rooms.find(r=>r.id===id);g.visible=allDetailed||Math.hypot(position.x-room.x,position.z-room.z)<75;}}
 function nativeCommands(dt=0,{force=false}={}){nativeTime+=Math.max(0,dt);const commands=[];for(const b of physics.bodies){const old=nativeRevision.get(b.id);if(!force&&old?.revision===b.revision)continue;if(!force&&b.awake&&old&&nativeTime-old.time<1/15)continue;const yaw=-b.angle;commands.push({type:'staticChunk',id:'loose-furniture:'+b.id,boxes:[{id:'furniture:'+b.id,pos:[b.x,b.baseY+b.height/2,b.z],size:[b.w*2,b.height,b.d*2],quat:[0,Math.sin(yaw/2),0,Math.cos(yaw/2)]}]});nativeRevision.set(b.id,{revision:b.revision,time:nativeTime});}return commands;}
 sync(true);
 return{root,physics,stats:physics.stats,bodies:physics.bodies,groups,updateFocus,sync,nativeCommands,step(dt,context){const stats=physics.step(dt,context);sync();return stats;},act(...args){return physics.act(...args);},targetFrom(...args){return physics.targetFrom(...args);},snapshot(){return physics.snapshot();},restore(data,options){const result=physics.restore(data,options);sync();return result;},reset(roomId,options){const result=physics.reset(roomId,options);sync();return result;},dispose(){root.traverse(o=>{if(o.isInstancedMesh)o.dispose();});parent.remove(root);return physics.bodies.map(b=>({type:'staticChunk',id:'loose-furniture:'+b.id,remove:true}));}};
}
