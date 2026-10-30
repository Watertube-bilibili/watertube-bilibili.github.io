import {wheelClearance} from './structural-clearance.js';
import * as THREE from './vendor/three.module.js';
import {validateStructuralDamageRecord} from './structural-save.js';
import {createStructure,applyStructuralImpact,nodeWeights,displacement,structureStats} from './structural-core.js';
const states=new WeakMap(),ownerBudgets=new WeakMap();
const budgetFor=owner=>{let budget=ownerBudgets.get(owner);if(!budget){budget=new Set();ownerBudgets.set(owner,budget);}return budget;};
export const FRAGMENT_LIMITS=Object.freeze({maxPerVehicle:3,maxPerGame:12,maxGlobal:12,ttl:8,maxStep:1/60,maxVertices:180000});
function neutralMatrix(v,mesh){const neutral=new Set([v.chassis,...(v.doors??[]).map(d=>d.pivot)]),chain=[];for(let n=mesh;n&&n!==v.root;n=n.parent)chain.push(n);const out=new THREE.Matrix4();for(const n of chain.reverse())out.multiply(new THREE.Matrix4().compose(n.position,neutral.has(n)?new THREE.Quaternion():n.quaternion,n.scale));return out;}
function descendant(n,root){for(;n;n=n.parent)if(n===root)return true;return false;}
function paint(mesh){return mesh.isMesh&&!mesh.isSkinnedMesh&&mesh.geometry?.attributes.position&&[].concat(mesh.material??[]).every(m=>m&&!m.transparent&&!(m.transmission>0)&&(/^(Paint [12]\b|Roadster_Ano_White$)/.test(m.name)||m.name==='Roadster_Rear_Deformable_Carbon'||m.clearcoat>=.9&&m.metalness>=.5&&m.roughness>=.15));}
/** parts is a reviewed allowlist of actual standalone Object3D subassemblies.
 * Doors from the existing vehicle rig qualify automatically. Never auto-select by substring. */
export function attachStructuralVehicle(v,{parts=[],isDeformable=paint}={}){
 const old=states.get(v);if(old?.root===v.root&&old.chassis===v.chassis)return old;
 if(old)disposeStructuralVehicle(v);
 if(!v.root?.isObject3D)throw Error('Vehicle root required');
 const panels=[],bounds=new THREE.Box3();let count=0;
 (v.chassis??v.root).traverse(mesh=>{if(!isDeformable(mesh))return;for(let n=mesh;n&&n!==v.root;n=n.parent)if(/wheel|tyre|tire|steering|pedal|instrument/i.test(n.name))return;
  const toRoot=neutralMatrix(v,mesh),source=mesh.geometry,p=source.attributes.position,rest=[];
  count+=p.count;for(let i=0;i<p.count;i++){const point=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(toRoot);rest.push(point);bounds.expandByPoint(point);}
  panels.push({mesh,source,toRoot,fromRoot:toRoot.clone().invert(),rest,owned:null});
 });
 if(count>FRAGMENT_LIMITS.maxVertices)throw Error(`Vertex budget exceeded (${count}); author lower-LOD damage mesh first`);
 if(bounds.isEmpty())throw Error('No explicit deformable shell');
 for(const axis of ['x','y','z'])if(bounds.max[axis]-bounds.min[axis]<.1)bounds.max[axis]=bounds.min[axis]+.1;
 const structure=createStructure({min:bounds.min.toArray(),max:bounds.max.toArray(),mass:v.mass??v.model?.mass??1500});
 for(const panel of panels)panel.weights=panel.rest.map(p=>nodeWeights(structure,p.toArray()));
 const candidates=[...(v.doors??[]).map((d,i)=>({id:'door:'+(d.id||d.pivot?.name||String(d.side??i)),object:d.pivot,kind:'door',breakImpulse:16000})),...parts],seen=new Set(),joints=[];
 for(const spec of candidates){if(joints.length>=32)break;const object=spec.object;if(!object||object===v.root||object===v.chassis||!descendant(object,v.root)||!['door','hood','bumper'].includes(spec.kind)||seen.has(object))continue;
  if(candidates.some(other=>other.object!==object&&other.object&&other.object!==v.root&&other.object!==v.chassis&&descendant(object,other.object)))continue;
  // Reject giant assemblies; whole body cannot masquerade as a detachable part.
  let meshes=0;const box=new THREE.Box3();object.traverse(m=>{if(!m.isMesh)return;meshes++;const pos=m.geometry?.attributes.position;if(!pos)return;const matrix=neutralMatrix(v,m);for(let i=0;i<pos.count;i++)box.expandByPoint(new THREE.Vector3().fromBufferAttribute(pos,i).applyMatrix4(matrix));});
  const size=box.getSize(new THREE.Vector3()),carSize=bounds.getSize(new THREE.Vector3());
  if(!meshes||box.isEmpty()||size.x>carSize.x*.9&&size.z>carSize.z*.8)continue;
  const id=spec.id??(spec.kind+':'+object.name);if(typeof id!=='string'||id.length>96||joints.some(j=>j.id===id))continue;seen.add(object);const center=box.getCenter(new THREE.Vector3());joints.push({id,object,kind:spec.kind,parent:object.parent,position:object.position.clone(),quaternion:object.quaternion.clone(),scale:object.scale.clone(),visible:object.visible,center,weights:nodeWeights(structure,center.toArray()),breakImpulse:spec.breakImpulse??18000,stress:0,detached:false,radius:Math.min(.45,Math.max(.12,size.length()*.18))});
 }
 const wheelVolumes=(v.wheels??[]).map(w=>({center:new THREE.Vector3().applyMatrix4(neutralMatrix(v,w.pivot)).toArray(),radii:[.21,(w.radius??.389)+.025,(w.radius??.389)+.025]}));
 const state={envelope:bounds.clone(),wheelVolumes,root:v.root,chassis:v.chassis,panels,structure,joints,fragments:[],owner:null,budget:null,disposed:false};state.model=String(v.model?.id??'unknown');state.binding=bindingSignature(state);states.set(v,state);return state;
}
function updateMeshes(state){const out=new THREE.Vector3();for(const panel of state.panels){if(state.joints.some(j=>j.detached&&descendant(panel.mesh,j.object)))continue;if(!panel.owned){panel.owned=panel.source.clone();panel.mesh.geometry=panel.owned;}const pos=panel.owned.attributes.position;for(let i=0;i<pos.count;i++){out.copy(panel.rest[i]).add(new THREE.Vector3(...displacement(state.structure,panel.weights[i])));out.clamp(state.envelope.min,state.envelope.max);out.fromArray(wheelClearance(panel.rest[i].toArray(),out.toArray(),state.wheelVolumes)).applyMatrix4(panel.fromRoot);pos.setXYZ(i,out.x,out.y,out.z);}pos.needsUpdate=true;panel.owned.computeVertexNormals();if(panel.owned.attributes.tangent){if(panel.owned.index&&panel.owned.attributes.uv)panel.owned.computeTangents();else panel.owned.deleteAttribute('tangent');}panel.owned.computeBoundingBox();panel.owned.computeBoundingSphere();}}
/** direction is LOCAL force into struck car, not its outward collision normal.
 * Caller must provide real normal speed, impulse, stable contact eventId and world velocity. */
export function impactStructuralVehicle(v,impact,{scene,worldVelocity=new THREE.Vector3()}={}){
 const state=states.get(v)??attachStructuralVehicle(v);const owner=v.damageOwner??scene??v;if(!owner||!['object','function'].includes(typeof owner))return{accepted:false,reason:'Invalid damage owner'};if(state.owner&&state.owner!==owner)return{accepted:false,reason:'Damage owner changed; dispose before transfer'};state.owner=owner;state.budget=budgetFor(owner);const result=applyStructuralImpact(state.structure,impact);if(!result.accepted)return result;
 updateMeshes(state);
 for(const joint of state.joints){if(joint.detached)continue;const localDistance=joint.center.distanceTo(new THREE.Vector3(...impact.point));joint.stress+=Math.sqrt(2*state.structure.mass*result.energy)*Math.exp(-(localDistance**2)/(2*.8**2));
  const strain=new THREE.Vector3(...displacement(state.structure,joint.weights)).length();
  if(joint.stress<joint.breakImpulse||strain<.11||!scene?.isObject3D||state.fragments.length>=FRAGMENT_LIMITS.maxPerVehicle||state.budget.size>=FRAGMENT_LIMITS.maxPerGame)continue;
  joint.detached=true;joint.object.userData.structuralDetached=true;scene.updateMatrixWorld(true);v.root.updateMatrixWorld(true);scene.attach(joint.object);
  const q=v.root.getWorldQuaternion(new THREE.Quaternion()),force=new THREE.Vector3(...impact.direction).normalize().applyQuaternion(q),velocity=worldVelocity.clone().addScaledVector(force,Math.min(9,impact.normalImpulse/state.structure.mass)*.45);
  const fragment={joint,velocity,angular:new THREE.Vector3(force.z,force.x*.5,-force.x),age:0};state.fragments.push(fragment);state.budget.add(fragment);
 }
 return{...result,...structureStats(state.structure),detached:state.joints.filter(j=>j.detached).map(j=>j.kind),detachedPartIds:state.joints.filter(j=>j.detached).map(j=>j.id)};
}
/** Ground-only sphere approximation. Optional sweep(from,to,radius) resolves scenery.
 * No full vehicle/fragments collision solver. scene must have identity world transform. */
export function stepStructuralDebris(v,dt,{groundHeight=()=>0,sweep}={}){
 const state=states.get(v);if(!state||!Number.isFinite(dt)||dt<=0)return;
 const elapsed=dt;dt=Math.min(dt,.1);
 for(const f of [...state.fragments]){f.age+=elapsed;if(f.age>=FRAGMENT_LIMITS.ttl){f.joint.object.removeFromParent();state.budget?.delete(f);state.fragments.splice(state.fragments.indexOf(f),1);continue;}
  let remaining=dt;while(remaining>1e-8){const step=Math.min(remaining,FRAGMENT_LIMITS.maxStep);remaining-=step;const object=f.joint.object,from=object.position.clone();f.velocity.y-=9.81*step;const to=from.clone().addScaledVector(f.velocity,step),hit=sweep?.(from,to,f.joint.radius);
   if(hit?.point&&hit?.normal){to.copy(hit.point);const n=hit.normal.clone().normalize(),vn=f.velocity.dot(n);if(vn<0)f.velocity.addScaledVector(n,-1.2*vn);}
   const floor=groundHeight(to.x,to.z)+f.joint.radius;if(to.y<floor){to.y=floor;if(f.velocity.y<0)f.velocity.y*=-.2;f.velocity.x*=.86;f.velocity.z*=.86;f.angular.multiplyScalar(.9);}
   object.position.copy(to);object.rotateX(f.angular.x*step);object.rotateY(f.angular.y*step);object.rotateZ(f.angular.z*step);
  }
 }
}
export function structuralVehicleStats(v){const s=states.get(v);return s?{...structureStats(s.structure),panels:s.panels.length,eligibleParts:s.joints.map(j=>j.kind),partIds:s.joints.map(j=>j.id),fragments:s.fragments.length,detached:s.joints.filter(j=>j.detached).length,detachedPartIds:s.joints.filter(j=>j.detached).map(j=>j.id)}:null;}
export function disposeStructuralVehicle(v){const s=states.get(v);if(!s)return;for(const j of s.joints){delete j.object.userData.structuralDetached;j.parent.add(j.object);j.object.position.copy(j.position);j.object.quaternion.copy(j.quaternion);j.object.scale.copy(j.scale);j.object.visible=j.visible;}for(const p of s.panels)if(p.owned){if(p.mesh.geometry===p.owned)p.mesh.geometry=p.source;p.owned.dispose();}for(const f of s.fragments)s.budget?.delete(f);s.fragments.length=0;s.disposed=true;states.delete(v);}

// Stable rest-geometry/topology fingerprint: edits/re-exports fail closed instead of deforming a different model.
function bindingSignature(s){let a=2166136261,b=2246822519;const put=value=>{const text=String(value)+'|';for(let i=0;i<text.length;i++){a=Math.imul(a^text.charCodeAt(i),16777619)>>>0;b=Math.imul(b^text.charCodeAt(i),3266489917)>>>0;}};
 put(s.model);put(s.structure.mass);for(const p of s.panels){put(p.mesh.name);put(p.rest.length);for(const v of p.rest)for(const n of v.toArray())put(Math.round(n*1e6));const index=p.source.index;put(index?.count??0);if(index)for(let i=0;i<index.count;i++)put(index.getX(i));}for(const j of s.joints){put(j.id);for(const n of j.center.toArray())put(Math.round(n*1e6));}return 's1-'+a.toString(16).padStart(8,'0')+b.toString(16).padStart(8,'0');}
export function serializeStructuralVehicle(v){const s=states.get(v);if(!s)return null;return{version:1,model:s.model,binding:s.binding,offsets:s.structure.nodes.map(n=>n.p.map((x,k)=>x-n.rest[k])),beams:s.structure.beams.map(b=>[b.broken,b.plasticLength]),parts:s.joints.map(j=>({id:j.id,stress:Math.min(1e12,j.stress),detached:j.detached})),energy:Math.min(1e12,s.structure.energy),revision:Math.min(1e9,s.structure.revision)};}
export function restoreStructuralVehicle(v,data){
 if(!validateStructuralDamageRecord(data))return{accepted:false,reason:'Invalid structural save schema'};
 if(data==null){disposeStructuralVehicle(v);return{accepted:true,legacy:true};}
 const s=states.get(v)??attachStructuralVehicle(v);
 if(data.model!==s.model||data.binding!==s.binding||data.parts.length!==s.joints.length||data.parts.some((p,i)=>p.id!==s.joints[i].id)||data.beams.some((b,i)=>b[1]<s.structure.beams[i].rest*.5||b[1]>s.structure.beams[i].rest*1.5))return{accepted:false,reason:'Structural asset binding mismatch'};
 // Complete validation precedes any change to live geometry, detached trees or budget.
 for(const f of s.fragments)s.budget?.delete(f);s.fragments.length=0;
 for(const j of s.joints){delete j.object.userData.structuralDetached;j.parent.add(j.object);j.object.position.copy(j.position);j.object.quaternion.copy(j.quaternion);j.object.scale.copy(j.scale);j.object.visible=j.visible;j.detached=false;}
 for(let i=0;i<s.structure.nodes.length;i++)s.structure.nodes[i].p=s.structure.nodes[i].rest.map((n,k)=>n+data.offsets[i][k]);
 for(let i=0;i<s.structure.beams.length;i++){s.structure.beams[i].broken=data.beams[i][0];s.structure.beams[i].plasticLength=data.beams[i][1];}
 s.structure.energy=data.energy;s.structure.revision=data.revision;s.structure.events.clear();updateMeshes(s);
 for(let i=0;i<s.joints.length;i++){const j=s.joints[i];j.stress=data.parts[i].stress;j.detached=data.parts[i].detached;if(j.detached){j.object.userData.structuralDetached=true;j.object.removeFromParent();}}
 return{accepted:true,restored:true,...structureStats(s.structure)};
}
