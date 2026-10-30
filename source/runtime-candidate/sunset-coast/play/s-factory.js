import profile from './s-profile.js';
import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {createBlenderSPreview} from './blender-s-preview.js';
import * as core from './structural-vehicle.js';
import {createVoltSStructuralAdapter,EXPECTED_ASSET_SHA256} from './s-audit-adapter.js';
const sessions=new WeakMap();
const same=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
const bytesOf=a=>new Uint8Array(a.buffer,a.byteOffset,a.byteLength).slice();
const isDetached=part=>!!(part?.structuralDetached||part?.pivot?.userData?.structuralDetached||part?.userData?.structuralDetached);
// Remap EVERY attribute and index: excluded vertices must not remain in position
// because the existing structural core walks every vertex, not only triangles.
function splitGeometry(T,source,mask){
 if(!source.index||source.groups.length||Object.keys(source.morphAttributes).length)throw Error('Unreviewed topology/groups/morphs');
 const count=source.attributes.position.count,selected=new Set(mask);
 if(selected.size!==mask.length||mask.some(i=>!Number.isInteger(i)||i<0||i>=count))throw Error('Invalid component mask');
 const body=[],mirror=[];for(let i=0;i<source.index.count;i+=3){const tri=[0,1,2].map(k=>source.index.getX(i+k)),flags=tri.map(v=>selected.has(v));if(flags.some(Boolean)&&!flags.every(Boolean))throw Error('Mask crosses triangle; refuse partial panel');(flags[0]?mirror:body).push(...tri);}
 if(!body.length||!mirror.length)throw Error('Empty split component');
 const build=indices=>{const ids=[...new Set(indices)],remap=new Map(ids.map((id,i)=>[id,i])),g=new T.BufferGeometry();
  try{for(const [name,a]of Object.entries(source.attributes)){if(a.isInterleavedBufferAttribute||a.count!==count||a.isInstancedBufferAttribute)throw Error('Unsupported attribute layout');const data=new a.array.constructor(ids.length*a.itemSize);for(let i=0;i<ids.length;i++)for(let k=0;k<a.itemSize;k++)data[i*a.itemSize+k]=a.array[ids[i]*a.itemSize+k];g.setAttribute(name,new T.BufferAttribute(data,a.itemSize,a.normalized));}g.setIndex(indices.map(i=>remap.get(i)));g.computeBoundingBox();g.computeBoundingSphere();return g;}catch(e){g.dispose();throw e;}
 };let a;try{a=build(body);return[a,build(mirror)];}catch(e){a?.dispose();throw e;}
}

function instantiate(v,T,verifyGeometry){
 if(!v?.root||v.model?.id!=='s'||!v.blenderSRig)throw Error('Reviewed Blender S rig required');
 if(sessions.has(v.root))throw Error('Adapter already active for root');
 const root=v.root;root.updateMatrixWorld(true);const unique=name=>{const found=[];root.traverse(o=>{if(o.name===name)found.push(o);});if(found.length!==1)throw Error('Missing or duplicate node '+name);return found[0];};
 const panels=[];for(const p of profile.shell.panels){const mesh=unique(p.runtimeMesh),g=mesh.geometry,a=g?.attributes?.position;
  if(!mesh.isMesh||Array.isArray(mesh.material)||mesh.material.name!==p.material||!a||a.count!==p.vertices)throw Error('Panel contract mismatch '+p.runtimeMesh);
  const snapshot=bytesOf(a.array);if(!same(snapshot,bytesOf(a.array)))throw Error('Panel bytes changed '+p.runtimeMesh);
  verifyGeometry(mesh);panels.push({p,mesh,original:g,parent:mesh.parent,snapshot});
 }
 const doors=profile.doors.map(p=>{const d=v.doors?.find(d=>d.pivot===unique(p.pivot));if(!d||isDetached(d)||!same(d.pivot.quaternion.toArray(),p.restQuaternion))throw Error('Doors must be attached in reviewed closed rest pose');return{profile:p,door:d};});
 const wheels=profile.wheels.map(p=>{const w=v.wheels?.find(w=>w.front===p.front&&w.side===p.side);if(!w||w.pivot.name!==p.runtimeMount||w.spin.name!==p.runtimeSpin||isDetached(w)||Math.abs(w.radius-p.renderRadius)>1e-6)throw Error('Wheel rig/radius mismatch '+p.id);const tire=unique(p.tire.runtimeMesh),metal=unique(p.rimBrakeAssembly.runtimeMesh),caliper=unique(p.caliper.runtimeMesh);if(tire.parent!==w.spin||metal.parent!==w.spin||caliper.parent!==w.pivot)throw Error('Wheel parent mismatch '+p.id);return{profile:p,wheel:w,tire,rimBrakeAssembly:metal,caliper,independentRim:null};});
 for(const w of wheels)for(const mesh of [w.tire,w.rimBrakeAssembly,w.caliper])verifyGeometry(mesh);
 if(sessions.has(root)||root!==v.root||panels.some(x=>x.mesh.geometry!==x.original||x.mesh.parent!==x.parent||!same(x.snapshot,bytesOf(x.original.attributes.position.array))))throw Error('Rig changed during verification');
 let bound=null,closed=false;const owned=[],mirrors=[],wheelEdits=[];
 const rollback=()=>{for(const x of panels)x.mesh.geometry=x.original;for(const m of mirrors)m.removeFromParent();for(const x of wheelEdits)x.mesh.geometry=x.original;for(const g of owned)g.dispose();};
 try{for(const x of panels){let body;if(x.p.excludedFromBodyOnlyVertexIndices){const pair=splitGeometry(T,x.original,x.p.excludedFromBodyOnlyVertexIndices);owned.push(...pair);body=pair[0];const m=new T.Mesh(pair[1],x.mesh.material);m.name=x.mesh.name+'__review_mirror';m.position.copy(x.mesh.position);m.quaternion.copy(x.mesh.quaternion);m.scale.copy(x.mesh.scale);m.matrix.copy(x.mesh.matrix);m.matrixAutoUpdate=x.mesh.matrixAutoUpdate;m.layers.mask=x.mesh.layers.mask;m.renderOrder=x.mesh.renderOrder;m.frustumCulled=x.mesh.frustumCulled;m.visible=x.mesh.visible;m.castShadow=x.mesh.castShadow;m.receiveShadow=x.mesh.receiveShadow;m.userData={...x.mesh.userData,voltSComponent:'mirror',structuralDeformationExcluded:true};mirrors.push(m);x.parent.add(m);}else{body=x.original.clone();owned.push(body);}x.mesh.geometry=body;}
 }catch(e){rollback();throw e;}
 const identities=new Set(panels.map(x=>x.mesh));
 const api={profile,vehicle:v,panels:panels.map(x=>x.mesh),mirrors,doors,wheels,
  isDeformable:mesh=>!closed&&identities.has(mesh),
  bind(core){if(closed||bound)throw Error('Adapter closed or bound');if(!core?.attachStructuralVehicle||!core?.disposeStructuralVehicle||!core?.structuralVehicleStats){api.dispose();throw Error('Structural lifecycle contract required');}if(core.structuralVehicleStats(v)){api.dispose();throw Error('Preexisting structural binding; dispose it before adapter creation');}try{const state=core.attachStructuralVehicle(v,{isDeformable:api.isDeformable});bound=core;return state;}catch(e){core.disposeStructuralVehicle(v);api.dispose();throw e;}},
  acquireTireGeometry(id){if(closed)throw Error('Adapter closed');const w=wheels.find(w=>w.profile.id===id);if(!w)throw Error('Unknown wheel');if(isDetached(w.wheel))throw Error('Cannot edit detached wheel');let e=wheelEdits.find(e=>e.mesh===w.tire);if(!e){e={mesh:w.tire,original:w.tire.geometry};const g=e.original.clone();owned.push(g);wheelEdits.push(e);w.tire.geometry=g;}return w.tire.geometry;},
  dispose(){if(closed)return;if(doors.some(d=>isDetached(d.door))||wheels.some(w=>isDetached(w.wheel)))throw Error('Detached parts require the explicit structural repair/removal lifecycle first; adapter will not reattach them');bound?.disposeStructuralVehicle(v);bound=null;rollback();closed=true;sessions.delete(root);},
  get disposed(){return closed;},
 };
 sessions.set(root,api);return api;
}

// No public unchecked token/constructor. Private template and byte snapshots never escape.
export async function prepareVoltSFactory(assetBytes){
 if(!(assetBytes instanceof Uint8Array))throw Error('Original GLB bytes required');
 const owned=Uint8Array.from(assetBytes);
 const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',owned)),b=>b.toString(16).padStart(2,'0')).join('');
 if(sha!==EXPECTED_ASSET_SHA256)throw Error('Unreviewed GLB bytes');
 const {scene:template}=await new GLTFLoader().parseAsync(owned.buffer,'');
 const probe=createBlenderSPreview({id:'s',mass:2100},template);
 const audit=await createVoltSStructuralAdapter({vehicle:probe,assetBytes:owned,THREE});audit.dispose();
 const expected=new Map();
 template.traverse(m=>{if(!m.isMesh)return;if(expected.has(m.name))throw Error('Ambiguous template mesh');const g=m.geometry;
 expected.set(m.name,{attributes:Object.fromEntries(Object.entries(g.attributes).map(([n,a])=>[n,{itemSize:a.itemSize,count:a.count,normalized:a.normalized,type:a.array.constructor.name,bytes:bytesOf(a.array)}])),index:g.index?bytesOf(g.index.array):null,indexType:g.index?.array.constructor.name??null,groups:JSON.stringify(g.groups),morphs:Object.keys(g.morphAttributes)});});
 function verify(m){const e=expected.get(m.name),g=m.geometry;if(!e||!g||JSON.stringify(g.groups)!==e.groups||!same(Object.keys(g.morphAttributes),e.morphs)||!same(Object.keys(g.attributes).sort(),Object.keys(e.attributes).sort()))throw Error('Instance topology mismatch '+m.name);
 for(const[n,a]of Object.entries(g.attributes)){const b=e.attributes[n];if(a.isInterleavedBufferAttribute||a.itemSize!==b.itemSize||a.count!==b.count||a.normalized!==b.normalized||a.array.constructor.name!==b.type||!same(bytesOf(a.array),b.bytes))throw Error('Instance attribute mismatch '+m.name+':'+n);}
 if((g.index?.array.constructor.name??null)!==e.indexType||(g.index&&!same(bytesOf(g.index.array),e.index)))throw Error('Instance index mismatch '+m.name);
 }
 const issued=new WeakMap();
 const proofFor=v=>{const p=issued.get(v?.root);if(!p||p.vehicle&&p.vehicle!==v)throw Error('Unissued vehicle identity');return p;};
 function revalidate(v,p){const seen=[];v.root.traverse(o=>{if(o!==v.root)seen.push(o);});
  // Wheels, pedals, steering and sprung chassis legitimately move while driving.
  const animated=new Set([v.chassis,v.steeringWheel,...v.wheels.flatMap(w=>[w.pivot,w.spin]),...Object.values(v.blenderSRig.pedals).map(p=>p.node)]);
  for(const n of p.nodes){if(!seen.includes(n.o)||n.o.parent!==n.parent)throw Error('Repair hierarchy mismatch');if(!animated.has(n.o)&&(!same(n.o.position.toArray(),n.position)||!same(n.o.quaternion.toArray(),n.quaternion)||!same(n.o.scale.toArray(),n.scale)))throw Error('Repair rest pose mismatch');if(n.o.isMesh)verify(n.o);}
 }
 function bind(v,p){const a=instantiate(v,THREE,verify);try{a.bind(core);p.adapter=a;p.vehicle=v;p.bound=true;p.phase='ready';return a;}catch(e){if(!a.disposed)a.dispose();throw e;}}

 return Object.freeze({
 // Read only the verified adapter actually bound to this exact instance.
 diagnostics(v){const p=issued.get(v?.root);if(!p||p.vehicle!==v||p.phase!=='ready'||p.adapter?.disposed)return null;const a=p.adapter;return {profile:a.profile.schema,assetSHA256:a.profile.asset.sha256,adapterPanels:a.panels.length,adapterVertices:a.panels.reduce((n,m)=>n+(m.geometry?.attributes.position?.count??0),0),excludedMirrorVertices:a.mirrors.reduce((n,m)=>n+(m.geometry?.attributes.position?.count??0),0)};},
 release(v){const p=proofFor(v);core.disposeStructuralVehicle(v);p.adapter?.dispose();issued.delete(v.root);},
 recognizes(v){return issued.has(v?.root);},
 owns(v){const p=issued.get(v?.root);return !!p&&(!p.vehicle||p.vehicle===v);},
 ready(v){const p=issued.get(v?.root);return !!p&&p.vehicle===v&&p.phase==='ready'&&!p.adapter?.disposed&&!!core.structuralVehicleStats(v);},
 status(v){const p=proofFor(v);return p.phase??'unbound';},
 createCar(model){if(model?.id!=='s')throw Error('Factory supports reviewed S only');const v=createBlenderSPreview(model,template),local=[];v.structuralWheelPreview=true;v.physicsWheelOffsets=v.wheels.map(w=>{w.structuralRestPosition=w.pivot.position.clone();w.structuralRestQuaternion=w.pivot.quaternion.clone();w.suspensionRestY=w.pivot.position.y;return[w.pivot.position.x,.1,w.pivot.position.z,w.radius,w.pivot.position.y];});v.collisionBounds={minX:-.985,maxX:.985,minZ:-2.52,maxZ:2.49,minY:.22,maxY:1.50};
 try{v.root.traverse(m=>{if(m.isMesh){m.geometry=m.geometry.clone();local.push(m.geometry);}});}catch(e){for(const g of local)g.dispose();throw e;}
 // Record every node identity, local pose, parent and geometry; root world placement remains Game-owned.
 const nodes=[];v.root.traverse(o=>{if(o!==v.root)nodes.push({o,parent:o.parent,position:o.position.toArray(),quaternion:o.quaternion.toArray(),scale:o.scale.toArray()});});issued.set(v.root,{nodes,bound:false,phase:'unbound'});return v;},
 attach(v){const proof=issued.get(v?.root);if(!proof||proof.bound)throw Error('Unissued or already bound instance');if(core.structuralVehicleStats(v))throw Error('Preexisting structure');
 const seen=[];v.root.traverse(o=>{if(o!==v.root)seen.push(o);});if(proof.nodes.some(n=>!seen.includes(n.o)||n.o.parent!==n.parent||!same(n.o.position.toArray(),n.position)||!same(n.o.quaternion.toArray(),n.quaternion)||!same(n.o.scale.toArray(),n.scale)))throw Error('Instance hierarchy/rest pose mismatch');
 for(const n of proof.nodes)if(n.o.isMesh)verify(n.o); // Game-owned instrument additions are outside the selected identity set.
 return bind(v,proof);
 },
 repair(v,resetDamageMetadata=()=>{}){const p=proofFor(v);if(typeof resetDamageMetadata!=='function')throw Error('Repair metadata callback required');if(!p.bound||p.vehicle!==v)throw Error('Repair requires previously bound owned vehicle');if(p.phase==='repairing')throw Error('Repair already running');p.phase='repairing';
  try{
   // This is explicit repair authorization, NOT the ordinary attach/update path.
   core.disposeStructuralVehicle(v);
   resetDamageMetadata();
   p.adapter?.dispose();p.adapter=null;
   revalidate(v,p);
   const a=bind(v,p);delete v.structuralDamageStatus;delete v.structuralDamageActive;return a;
  }catch(error){
   core.disposeStructuralVehicle(v);
   if(p.adapter&&!p.adapter.disposed)p.adapter.dispose();p.adapter=null;p.phase='failed';
   v.structuralDamageStatus='S repair blocked: '+error.message;delete v.structuralDamageActive;
   throw error;
  }
 }

 });
}
