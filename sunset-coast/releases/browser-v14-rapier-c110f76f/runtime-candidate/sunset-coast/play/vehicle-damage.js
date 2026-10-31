import {DAMAGE_REGIONS,sanitizeDamageRegions} from './damage-state.js';
export {DAMAGE_REGIONS,sanitizeDamageRegions,validateDamageRegions} from './damage-state.js';
import * as THREE from './vendor/three.module.js';

// Real, compact dents in the painted shell. Every changed mesh owns its geometry;
// cached catalog/GLB geometry, materials, wheels and cabin furnishings stay intact.
// Door-local backing follows the shell so it cannot protrude through a dent.
// Each update starts from immutable rest vertices, never last frame's damage.
export const DAMAGE_LIMITS=Object.freeze({maxDisplacement:.28,primaryDepth:.23,hoodDepth:.15,triangleEdge:.25,maxSubdivision:8});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const finite=(n,f)=>Number.isFinite(n)?n:f;
const conditionOf=v=>clamp(finite(v?.condition,100),0,100);
const emptyRegions=()=>Object.fromEntries(DAMAGE_REGIONS.map(k=>[k,0]));
const readComponent=(a,i,c)=>c===0?a.getX(i):c===1?a.getY(i):c===2?a.getZ(i):a.getW(i);



function regionOf(impact,v) {
  const explicit=typeof impact==='string'?impact:impact?.region;
  if(DAMAGE_REGIONS.includes(explicit))return explicit;
  const p=impact?.localPoint;
  if(Number.isFinite(p?.x)&&Number.isFinite(p?.z)){
    return Math.abs(p.x)/Math.max(.5,finite(v.halfWidth,1))>Math.abs(p.z)/Math.max(1.5,finite(v.wheelBase,2.8)*.82)
      ?p.x<0?'left':'right':p.z<0?'front':'rear';
  }
  return null;
}

function isExteriorPaint(mesh,v) {
  if(!mesh.isMesh||mesh.isSkinnedMesh||mesh.userData.vehicleDamage||!mesh.geometry?.attributes?.position)return false;
  // Imported names positively select body paint; glass may have opacity 1, so
  // opacity alone is never a safe test for the GLB's transmissive windows.
  for(let node=mesh;node;node=node.parent)if(/interior|steering|instrument|pedal|wheel|tyre|tire|brake|mirror/i.test(node.name))return false;
  return [].concat(mesh.material??[]).every(m=>m?.visible!==false&&!m?.transparent&&
    (/^(?:Paint [12]\b|Roadster_Ano_White$)/.test(m?.name??'')||
      // Only this explicitly authored rear body panel is deformable carbon.
      ['roadster','roadster_thrust','roadster_rocket'].includes(v?.model?.id)&&m?.name==='Roadster_Rear_Deformable_Carbon'||m?.clearcoat>=.9&&m?.metalness>=.5&&m?.roughness>=.15));
}

function isDoorBacking(v,mesh) {
  if(!mesh.isMesh||mesh.isSkinnedMesh||!mesh.geometry?.attributes?.position)return false;
  let door=false;
  for(let n=mesh;n&&n!==v.root;n=n.parent){
    if(/steering|instrument|pedal|wheel|mirror/i.test(n.name))return false;
    if((v.doors??[]).some(d=>d.pivot===n))door=true;
  }
  return door&&[].concat(mesh.material??[]).every(m=>m?.visible!==false&&!m?.transparent&&!(m?.transmission>0));
}

// Bind coordinates are independent of current door animation and body roll.
// The original imported normalization and every mesh-local transform remain.
function restMatrix(v,mesh) {
  const neutral=new Set([v.chassis,...(v.doors??[]).map(d=>d.pivot)]),chain=[];
  for(let node=mesh;node&&node!==v.root;node=node.parent)chain.push(node);
  const result=new THREE.Matrix4(),local=new THREE.Matrix4(),identity=new THREE.Quaternion();
  for(let i=chain.length-1;i>=0;i--){const node=chain[i];local.compose(node.position,neutral.has(node)?identity:node.quaternion,node.scale);result.multiply(local);}
  return result;
}
// Merged procedural paint includes tiny disconnected mirror shells, badges and
// spare-wheel covers. Preserve those rigid details instead of bending their
// paper-thin bevel triangles. Connectivity is reconstructed without source edits.
function* componentMaskSteps(geometry,points,backing=false) {
  const count=points.length/3,parent=new Int32Array(count),keys=new Map();
  for(let i=0;i<count;i++){parent[i]=i;if(i%1024===0)yield;}
  const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
  const unite=(a,b)=>{a=find(a);b=find(b);if(a!==b)parent[b]=a;};
  for(let i=0;i<count;i++){if(i%512===0)yield;const j=i*3,key=Math.round(points[j]*1e5)+':'+Math.round(points[j+1]*1e5)+':'+Math.round(points[j+2]*1e5);if(keys.has(key))unite(i,keys.get(key));else keys.set(key,i);}
  const index=geometry.index,n=index?.count??count;
  for(let i=0;i+2<n;i+=3){if(i%1536===0)yield;const a=index?index.getX(i):i;unite(a,index?index.getX(i+1):i+1);unite(a,index?index.getX(i+2):i+2);}
  const boxes=new Map();for(let i=0;i<count;i++){if(i%512===0)yield;const root=find(i),j=i*3;if(!boxes.has(root))boxes.set(root,[Infinity,Infinity,Infinity,-Infinity,-Infinity,-Infinity]);const b=boxes.get(root);for(let k=0;k<3;k++){b[k]=Math.min(b[k],points[j+k]);b[k+3]=Math.max(b[k+3],points[j+k]);}}
  const eligible=new Uint8Array(count),rigid=new Uint8Array(count),centers=new Float64Array(count*3);
  for(let i=0;i<count;i++){if(i%512===0)yield;const b=boxes.get(find(i)),small=Math.max(b[3]-b[0],b[4]-b[1],b[5]-b[2])<.4;eligible[i]=backing||!small?1:0;rigid[i]=backing&&small?1:0;if(rigid[i])for(let k=0;k<3;k++)centers[i*3+k]=(b[k]+b[k+3])*.5;}return{eligible,rigid,centers};
}
// The same generators are consumed synchronously for a real impact and in
// bounded slices while a healthy vehicle is idle. No warmup mutates a mesh.
const drain=steps=>{let result;do{result=steps.next();}while(!result.done);return result.value;};
const sourceInfoCache=new WeakMap();
function* collectPanelsSteps(v) {
  const panels=[],candidates=[];
  (v.chassis??v.root).traverse(mesh=>{const exterior=isExteriorPaint(mesh,v);if(exterior||isDoorBacking(v,mesh))candidates.push({mesh,exterior});});
  yield;
  for(const {mesh,exterior} of candidates){
    const toRoot=restMatrix(v,mesh),original=mesh.geometry,position=original.attributes.position;
    const key=toRoot.elements.join(':')+':'+exterior;
    let cache=sourceInfoCache.get(original);if(!cache){cache=new Map();sourceInfoCache.set(original,cache);}
    let info=cache.get(key);
    if(!info){
      const rest=new Float64Array(position.count*3),p=new THREE.Vector3(),bounds=new THREE.Box3();
      for(let i=0;i<position.count;i++){if(i%512===0)yield;p.fromBufferAttribute(position,i).applyMatrix4(toRoot);const j=i*3;rest[j]=p.x;rest[j+1]=p.y;rest[j+2]=p.z;bounds.expandByPoint(p);}
      info={surface:rest,sourceMask:yield* componentMaskSteps(original,rest,!exterior),bounds};cache.set(key,info);
    }
    panels.push({mesh,original,exterior,toRoot,fromRoot:toRoot.clone().invert(),...info,geometry:null});
    yield;
  }
  return panels;
}
const collectPanels=v=>drain(collectPanelsSteps(v));

// Find the painted exterior at a requested silhouette cross-section. This is
// triangle/ray arithmetic on the actual model, not a box approximating the car.
function* sampleSurfaceSteps(panels,target,axis,sign) {
  const a=(axis+1)%3,b=(axis+2)%3,x=target[a],y=target[b];let best=-Infinity,hit=null;
  for(const panel of panels){
    if(!panel.exterior)continue;
    const g=panel.original,p=panel.surface,indices=g.index,count=indices?.count??p.length/3;
    if(x<panel.bounds.min.getComponent(a)||x>panel.bounds.max.getComponent(a)||y<panel.bounds.min.getComponent(b)||y>panel.bounds.max.getComponent(b))continue;
    for(let j=0;j+2<count;j+=3){
      if(j%1536===0)yield;
      const i0=(indices?indices.getX(j):j)*3,i1=(indices?indices.getX(j+1):j+1)*3,i2=(indices?indices.getX(j+2):j+2)*3;
      if(!panel.sourceMask.eligible[i0/3])continue;
      const x0=p[i0+a],y0=p[i0+b],x1=p[i1+a],y1=p[i1+b],x2=p[i2+a],y2=p[i2+b];
      const denominator=(y1-y2)*(x0-x2)+(x2-x1)*(y0-y2);if(Math.abs(denominator)<1e-12)continue;
      const u=((y1-y2)*(x-x2)+(x2-x1)*(y-y2))/denominator,w=((y2-y0)*(x-x2)+(x0-x2)*(y-y2))/denominator;
      if(u<-.00001||w<-.00001||u+w>1.00001)continue;
      const z=u*p[i0+axis]+w*p[i1+axis]+(1-u-w)*p[i2+axis];
      if(z*sign>best){best=z*sign;hit=[...target];hit[axis]=z;}
    }
  }
  return hit;
}
const fieldCache=new WeakMap();
function* makeFieldsSteps(v,panels) {
  const anchor=panels.find(p=>p.exterior)?.original;if(!anchor)return [];
  let cache=fieldCache.get(anchor);if(!cache){cache=new Map();fieldCache.set(anchor,cache);}
  const key=[v.halfWidth,v.height,...panels.filter(p=>p.exterior).flatMap(p=>[p.original.uuid,...p.toRoot.elements])].join(':');
  if(cache.has(key))return cache.get(key);
  const bounds=new THREE.Box3();for(const p of panels)if(p.exterior)bounds.union(p.bounds);
  if(bounds.isEmpty())return [];
  const width=clamp(finite(v.halfWidth,1),.5,1.8),height=clamp(finite(v.height,1.5),.8,3),fields=[];
  const y=clamp(height*.43,.48,1.02);
  const add=function*(region,point,axis,sign,radii,depth){
    let center=yield* sampleSurfaceSteps(panels,point,axis,sign);
    const correctHalf=p=>p&&(axis!==2||p[2]*sign>0);
    // A very low wedge nose can sit below the usual bumper-height ray. Never
    // accept the rear body as a front anchor just because the ray misses it.
    if(!correctHalf(center))for(const dy of [.14,-.14,-.28,.28]){const retry=[...point];retry[1]+=dy;center=yield* sampleSurfaceSteps(panels,retry,axis,sign);if(correctHalf(center))break;}
    if(correctHalf(center))fields.push({region,center,radii,axis,sign,depth});
  };
  for(const [region,sign]of [['left',-1],['right',1]]){
    const door=v.doors?.find(d=>d.side===sign)?.pivot,doorBounds=new THREE.Box3();
    if(door)for(const p of panels){if(!p.exterior)continue;let n=p.mesh;while(n&&n!==door)n=n.parent;if(n===door)doorBounds.union(p.bounds);}
    const z=doorBounds.isEmpty()?-.25:(doorBounds.min.z+doorBounds.max.z)/2;
    yield* add(region,[sign*width,y,z],0,sign,[.7,.53,.87],DAMAGE_LIMITS.primaryDepth);
  }
  for(const [region,sign]of [['front',-1],['rear',1]]){
    const z=sign<0?bounds.min.z:bounds.max.z;
    yield* add(region,[-width*.24,y,z],2,sign,[.9,.57,.72],DAMAGE_LIMITS.primaryDepth);
    // A second, downward hood/deck indentation is visible from the chase view.
    yield* add(region,[width*.19,height,z-sign*.40],1,1,[.66,.65,.70],DAMAGE_LIMITS.hoodDepth);
  }
  for(const f of fields){Object.freeze(f.center);Object.freeze(f.radii);Object.freeze(f);}Object.freeze(fields);cache.set(key,fields);return fields;
}

const makeFields=(v,panels)=>drain(makeFieldsSteps(v,panels));

function fieldWeight(field,x,y,z) {
  const dx=(x-field.center[0])/field.radii[0],dy=(y-field.center[1])/field.radii[1],dz=(z-field.center[2])/field.radii[2];
  if(Math.abs(dx)>=1||Math.abs(dy)>=1||Math.abs(dz)>=1)return 0;
  const q=Math.sqrt(dx*dx+dy*dy+dz*dz);
  if(q>=1)return 0;
  // Compact C2 Wendland kernel: flat centre and zero value/slope at the edge.
  // Smooth bounded fields move neighboring vertices together, avoiding spikes.
  const a=1-q;return a*a*a*a*(1+4*q);
}
function displaced(fields,regions,x,y,z,out,multiplier=1) {
  let dx=0,dy=0,dz=0;
  for(const f of fields){const severity=regions[f.region];if(!severity)continue;const d=-f.sign*f.depth*multiplier*Math.sqrt(severity)*fieldWeight(f,x,y,z);if(f.axis===0)dx+=d;else if(f.axis===1)dy+=d;else dz+=d;}
  const length=Math.hypot(dx,dy,dz),scale=length>DAMAGE_LIMITS.maxDisplacement?DAMAGE_LIMITS.maxDisplacement/length:1;
  out.set(x+dx*scale,y+dy*scale,z+dz*scale);return out;
}

// Split long edges consistently at their midpoints. Matching seam positions
// evaluate the same continuous deformation, even across separate meshes/UV seams.
// All source attributes and material groups are interpolated and retained.
function* tessellateSteps(panel,fields) {
  const source=panel.original,index=source.index,surface=panel.surface,triangleCount=index?.count??surface.length/3;
  const boxes=fields.map(f=>new THREE.Box3(new THREE.Vector3(...f.center).sub(new THREE.Vector3(...f.radii)).addScalar(-.3),new THREE.Vector3(...f.center).add(new THREE.Vector3(...f.radii)).addScalar(.3)));
  const threshold=(panel.exterior?DAMAGE_LIMITS.triangleEdge:.12)**2;
  const candidates=[];
  for(let j=0;j+2<triangleCount;j+=3){
    if(j%768===0)yield;
    const a=(index?index.getX(j):j),b=(index?index.getX(j+1):j+1),c=(index?index.getX(j+2):j+2);
    if(!panel.sourceMask.eligible[a]||panel.sourceMask.rigid[a])continue;
    const edge=(a,b)=>{a*=3;b*=3;return(surface[a]-surface[b])**2+(surface[a+1]-surface[b+1])**2+(surface[a+2]-surface[b+2])**2;};
    if(Math.max(edge(a,b),edge(b,c),edge(c,a))<=threshold)continue;
    const triangleBounds=new THREE.Box3().setFromPoints([a,b,c].map(i=>new THREE.Vector3().fromArray(surface,i*3)));
    if(boxes.some(box=>box.intersectsBox(triangleBounds)))candidates.push(j);
  }
  if(!candidates.length){
    const geometry=source.clone();
    geometry.setAttribute('_dentEligible',new THREE.Float32BufferAttribute(panel.sourceMask.eligible,1));
    geometry.setAttribute('_dentRigid',new THREE.Float32BufferAttribute(panel.sourceMask.rigid,1));
    geometry.setAttribute('_dentCenter',new THREE.Float32BufferAttribute(panel.sourceMask.centers,3));
    if(!geometry.attributes.normal)geometry.computeVertexNormals();
    geometry.userData={...source.userData,vehicleDamageOwned:true};return geometry;
  }
  const attributes=[...Object.entries(source.attributes).filter(([,a])=>a.itemSize<=4),['_dentEligible',{itemSize:1,getX:i=>panel.sourceMask.eligible[i]}],['_dentRigid',{itemSize:1,getX:i=>panel.sourceMask.rigid[i]}],['_dentCenter',{itemSize:3,getX:i=>panel.sourceMask.centers[i*3],getY:i=>panel.sourceMask.centers[i*3+1],getZ:i=>panel.sourceMask.centers[i*3+2]}]];
  const offsets={},size=attributes.reduce((n,[name,a])=>{offsets[name]=n;return n+a.itemSize;},0),pOffset=offsets.position;
  const output=Object.fromEntries(attributes.map(([name])=>[name,[]])),indices=source.index,count=indices?.count??source.attributes.position.count;
  const groups=source.groups.length?source.groups:[{start:0,count,materialIndex:0}],nextGroups=[];
  const get=i=>{const vertex=new Float64Array(size);for(const[name,a]of attributes)for(let c=0;c<a.itemSize;c++)vertex[offsets[name]+c]=readComponent(a,i,c);return vertex;};
  const point=v=>new THREE.Vector3(v[pOffset],v[pOffset+1],v[pOffset+2]).applyMatrix4(panel.toRoot);
  const emit=(a,b,c)=>{for(const vertex of[a,b,c])for(const[name,attr]of attributes)for(let i=0;i<attr.itemSize;i++)output[name].push(vertex[offsets[name]+i]);};
  const split=(a,b,c,pa,pb,pc,depth)=>{
    const lengths=[pa.distanceToSquared(pb),pb.distanceToSquared(pc),pc.distanceToSquared(pa)],longest=Math.max(...lengths);
    if(!a[offsets._dentEligible]||a[offsets._dentRigid]||longest<=(panel.exterior?DAMAGE_LIMITS.triangleEdge:.12)**2||depth>=(panel.exterior?DAMAGE_LIMITS.maxSubdivision:12)){emit(a,b,c);return;}
    // Tessellate only the neighborhood of a possible dent, with a full-edge
    // margin so adjacent triangles agree along the active field boundary.
    const triBounds=new THREE.Box3().setFromPoints([pa,pb,pc]);
    if(!boxes.some(b=>b.intersectsBox(triBounds))){emit(a,b,c);return;}
    const edge=lengths.indexOf(longest),vertices=[a,b,c],points=[pa,pb,pc],u=vertices[edge],v=vertices[(edge+1)%3],w=vertices[(edge+2)%3],pu=points[edge],pv=points[(edge+1)%3],pw=points[(edge+2)%3];
    const midpoint=new Float64Array(size);for(let i=0;i<size;i++)midpoint[i]=(u[i]+v[i])*.5;
    const pm=pu.clone().add(pv).multiplyScalar(.5);
    split(u,midpoint,w,pu,pm,pw,depth+1);split(midpoint,v,w,pm,pv,pw,depth+1);
  };
  // Catalog shells are already dense, non-indexed surfaces. Usually only a
  // handful of long trim triangles need splitting: bulk-copy the other tens
  // of thousands of vertices instead of rebuilding them through JS arrays.
  if(!source.index&&Object.values(source.attributes).every(a=>!a.isInterleavedBufferAttribute)){
    const replacements=[];let extra=0;
    for(const j of candidates){yield;const start=output.position.length/3,a=get(j),b=get(j+1),c=get(j+2);split(a,b,c,point(a),point(b),point(c),0);const length=output.position.length/3-start;replacements.push({at:j,start,count:length});extra+=length-3;}
    const sourceArrays={...Object.fromEntries(Object.entries(source.attributes).map(([name,a])=>[name,a.array])),_dentEligible:panel.sourceMask.eligible,_dentRigid:panel.sourceMask.rigid,_dentCenter:panel.sourceMask.centers};
    const geometry=new THREE.BufferGeometry();
    for(const[name,attr]of attributes){const size=attr.itemSize,array=new Float32Array((count+extra)*size),original=sourceArrays[name];let old=0,next=0;for(const replacement of replacements){array.set(original.subarray(old*size,replacement.at*size),next*size);next+=replacement.at-old;array.set(output[name].slice(replacement.start*size,(replacement.start+replacement.count)*size),next*size);next+=replacement.count;old=replacement.at+3;}array.set(original.subarray(old*size),next*size);geometry.setAttribute(name,new THREE.BufferAttribute(array,size));}
    for(const group of groups){const before=replacements.filter(r=>r.at<group.start).reduce((n,r)=>n+r.count-3,0),inside=replacements.filter(r=>r.at>=group.start&&r.at<group.start+group.count).reduce((n,r)=>n+r.count-3,0);geometry.addGroup(group.start+before,group.count+inside,group.materialIndex);}
    if(!geometry.attributes.normal)geometry.computeVertexNormals();geometry.userData={...source.userData,vehicleDamageOwned:true};return geometry;
  }
  for(const group of groups){const start=output.position.length/3,end=Math.min(count,group.start+group.count);for(let j=group.start;j+2<end;j+=3){if((j-group.start)%192===0)yield;const a=get(indices?indices.getX(j):j),b=get(indices?indices.getX(j+1):j+1),c=get(indices?indices.getX(j+2):j+2);split(a,b,c,point(a),point(b),point(c),0);}nextGroups.push({start,count:output.position.length/3-start,materialIndex:group.materialIndex});}
  const geometry=new THREE.BufferGeometry();
  for(const[name,a]of attributes)geometry.setAttribute(name,new THREE.Float32BufferAttribute(output[name],a.itemSize));
  if(!geometry.attributes.normal)geometry.computeVertexNormals();
  geometry.groups=nextGroups;geometry.userData={...source.userData,vehicleDamageOwned:true};
  return geometry;
}
// Bound immutable prepared data independently of the number of cars/impacts.
// Render geometry is cloned per damaged mesh; cached arrays are never written.
export const DAMAGE_PREPARATION_BUDGET=16*1024*1024;
const preparedCache=new Map(),warmups=new WeakMap();
let preparedBytes=0,preparedHits=0,preparedMisses=0,preparedEvictions=0;
const preparationKey=(panel,fields)=>[panel.original.uuid,panel.exterior,...panel.toRoot.elements,...fields.flatMap(f=>[f.region,...f.center,...f.radii,f.axis,f.sign,f.depth])].join(':');
function rememberPreparation(key,template){
  const arrays=new Set([...Object.values(template.geometry.attributes).map(a=>a.array),template.geometry.index?.array,...Object.values(template).filter(ArrayBuffer.isView)].filter(Boolean));
  const bytes=[...arrays].reduce((n,a)=>n+a.byteLength,0);
  if(bytes>DAMAGE_PREPARATION_BUDGET)return;
  while(preparedBytes+bytes>DAMAGE_PREPARATION_BUDGET&&preparedCache.size){const [oldKey,old]=preparedCache.entries().next().value;preparedBytes-=old.bytes;preparedCache.delete(oldKey);old.template.geometry.dispose();preparedEvictions++;}
  preparedCache.set(key,{template,bytes});preparedBytes+=bytes;
}
function* preparationSteps(panel,fields){
  const key=preparationKey(panel,fields),cached=preparedCache.get(key);
  if(cached){preparedCache.delete(key);preparedCache.set(key,cached);preparedHits++;return cached.template;}
  preparedMisses++;
  const geometry=yield* tessellateSteps(panel,fields),position=geometry.attributes.position,normal=geometry.attributes.normal;
  const normalToRoot=new THREE.Matrix3().getNormalMatrix(panel.toRoot),normalToLocal=new THREE.Matrix3().setFromMatrix4(panel.toRoot).transpose();
  const template={geometry,eligible:geometry.attributes._dentEligible.array,rigid:geometry.attributes._dentRigid.array,rigidCenter:geometry.attributes._dentCenter.array,
    restPosition:position.array,restNormal:normal.array,normalToLocal,rootPosition:new Float64Array(position.count*3),rootNormal:new Float64Array(position.count*3)};
  for(const name of['_dentEligible','_dentRigid','_dentCenter'])geometry.deleteAttribute(name);
  const p=new THREE.Vector3(),n=new THREE.Vector3();
  for(let i=0;i<position.count;i++){if(i%512===0)yield;p.fromBufferAttribute(position,i).applyMatrix4(panel.toRoot);n.fromBufferAttribute(normal,i).applyMatrix3(normalToRoot).normalize();const j=i*3;template.rootPosition[j]=p.x;template.rootPosition[j+1]=p.y;template.rootPosition[j+2]=p.z;template.rootNormal[j]=n.x;template.rootNormal[j+1]=n.y;template.rootNormal[j+2]=n.z;}
  if(geometry.attributes.tangent)template.restTangent=geometry.attributes.tangent.array;
  // An intervening real collision may have populated this key during warmup.
  const existing=preparedCache.get(key);if(existing){geometry.dispose();return existing.template;}
  rememberPreparation(key,template);return template;
}
function prepareGeometry(panel,fields) {
  const template=drain(preparationSteps(panel,fields));
  Object.assign(panel,template,{geometry:template.geometry.clone()});
  panel.mesh.geometry=panel.geometry;
}
const panelRelevant=(panel,fields)=>fields.some(f=>new THREE.Box3(new THREE.Vector3(...f.center).sub(new THREE.Vector3(...f.radii)),new THREE.Vector3(...f.center).add(new THREE.Vector3(...f.radii))).intersectsBox(panel.bounds));
function* warmupSteps(v,region){
  const panels=yield* collectPanelsSteps(v),fields=(yield* makeFieldsSteps(v,panels)).filter(f=>f.region===region);
  for(const panel of panels)if(panelRelevant(panel,fields)){yield* preparationSteps(panel,fields);yield;}
}
/** Optional idle-only, cooperative preparation of a healthy current car's front.
 * The time limit is soft: one small vertex/triangle batch is never preempted.
 * maxSteps bounds work even under a coarse/nonadvancing performance clock.
 * Call once per rendered frame, never in the fixed-step physics loop. */
export function warmVehicleDamage(v,{budgetMs=2,maxSteps=8,now=()=>performance.now(),region='front'}={}){
  if(!v?.root?.isObject3D||conditionOf(v)<100){if(v)warmups.delete(v);return{done:true,steps:0};}
  region=DAMAGE_REGIONS.includes(region)?region:'front';
  let task=warmups.get(v);
  if(!task||task.root!==v.root||task.chassis!==v.chassis||task.region!==region){task={root:v.root,chassis:v.chassis,region,steps:warmupSteps(v,region),done:false};warmups.set(v,task);}
  if(task.done)return{done:true,steps:0};
  const start=now(),budget=clamp(finite(budgetMs,2),.25,4),limit=clamp(Math.floor(finite(maxSteps,8)),1,16);let count=0;
  while(count<limit&&(count===0||now()-start<budget)){const step=task.steps.next();count++;if(step.done){task.done=true;break;}}
  return{done:task.done,steps:count};
}
export function damagePreparationStats(){return{bytes:preparedBytes,budgetBytes:DAMAGE_PREPARATION_BUDGET,entries:preparedCache.size,hits:preparedHits,misses:preparedMisses,evictions:preparedEvictions};}
function restorePanels(state) {
  for(const panel of state.panels){if(!panel.geometry)continue;if(panel.mesh.geometry===panel.geometry)panel.mesh.geometry=panel.original;panel.geometry.dispose();panel.geometry=null;}
}
function applyGeometry(state) {
  const p=new THREE.Vector3(),n=new THREE.Vector3(),u=new THREE.Vector3(),w=new THREE.Vector3(),pu=new THREE.Vector3(),pw=new THREE.Vector3(),local=new THREE.Vector3(),axis=new THREE.Vector3();
  const epsilon=.0005,activeFields=state.fields.filter(f=>state.regions[f.region]>0),activeRegions=DAMAGE_REGIONS.filter(k=>state.regions[k]>0);
  if(state.preparedRegions&&activeRegions.some(k=>!state.preparedRegions.includes(k)))restorePanels(state);
  state.preparedRegions=activeRegions;state.changedVertices=0;state.maxDisplacement=0;
  for(const panel of state.panels){
    if(!panel.geometry){
      const relevant=panelRelevant(panel,activeFields);
      if(!relevant)continue;prepareGeometry(panel,activeFields);
    }
    const position=panel.geometry.attributes.position,normal=panel.geometry.attributes.normal,tangent=panel.geometry.attributes.tangent,dentScale=panel.exterior?1:1.06;
    for(let i=0;i<position.count;i++){
      const j=i*3,x=panel.rootPosition[j],y=panel.rootPosition[j+1],z=panel.rootPosition[j+2];if(panel.rigid[i]){const cx=panel.rigidCenter[j],cy=panel.rigidCenter[j+1],cz=panel.rigidCenter[j+2];displaced(activeFields,state.regions,cx,cy,cz,p,dentScale);p.x+=x-cx;p.y+=y-cy;p.z+=z-cz;}else if(panel.eligible[i])displaced(activeFields,state.regions,x,y,z,p,dentScale);else p.set(x,y,z);
      // A few procedural liners sit less than 1 mm below paint. Give backing
      // a small inward clearance so different triangle densities cannot cross.
      const displacement=Math.hypot(p.x-x,p.y-y,p.z-z);state.maxDisplacement=Math.max(state.maxDisplacement,displacement);
      if(displacement<1e-10){position.setXYZ(i,panel.restPosition[j],panel.restPosition[j+1],panel.restPosition[j+2]);normal.setXYZ(i,panel.restNormal[j],panel.restNormal[j+1],panel.restNormal[j+2]);if(tangent){const k=i*4;tangent.setXYZW(i,panel.restTangent[k],panel.restTangent[k+1],panel.restTangent[k+2],panel.restTangent[k+3]);}continue;}
      state.changedVertices++;local.copy(p).applyMatrix4(panel.fromRoot);position.setXYZ(i,local.x,local.y,local.z);
      if(panel.rigid[i]){normal.setXYZ(i,panel.restNormal[j],panel.restNormal[j+1],panel.restNormal[j+2]);if(tangent){const k=i*4;tangent.setXYZW(i,panel.restTangent[k],panel.restTangent[k+1],panel.restTangent[k+2],panel.restTangent[k+3]);}continue;}
      n.fromArray(panel.rootNormal,j);axis.set(Math.abs(n.y)<.9?0:1,Math.abs(n.y)<.9?1:0,0);u.crossVectors(axis,n).normalize();w.crossVectors(n,u).normalize();
      displaced(activeFields,state.regions,x+epsilon*u.x,y+epsilon*u.y,z+epsilon*u.z,pu,dentScale).sub(p).normalize();
      displaced(activeFields,state.regions,x+epsilon*w.x,y+epsilon*w.y,z+epsilon*w.z,pw,dentScale).sub(p).normalize();
      n.crossVectors(pu,pw).normalize().applyMatrix3(panel.normalToLocal).normalize();normal.setXYZ(i,n.x,n.y,n.z);
      if(tangent){const k=i*4;u.fromArray(panel.restTangent,k).transformDirection(panel.toRoot);displaced(activeFields,state.regions,x+epsilon*u.x,y+epsilon*u.y,z+epsilon*u.z,pu,dentScale).sub(p).transformDirection(panel.fromRoot);pu.addScaledVector(n,-pu.dot(n)).normalize();tangent.setXYZW(i,pu.x,pu.y,pu.z,panel.restTangent[k+3]);}
    }
    position.needsUpdate=true;normal.needsUpdate=true;if(tangent)tangent.needsUpdate=true;panel.geometry.computeBoundingBox();panel.geometry.computeBoundingSphere();
  }
}
function getState(v) {
  if(!v?.root?.isObject3D)return null;
  if(v.damageVisuals?.root===v.root)return v.damageVisuals;
  const previous=v.damageVisuals,regions=previous?{...previous.regions}:null,known=previous?.knownRegions??false;
  if(previous)disposeVehicleDamage(v);
  const state={root:v.root,panels:[],patches:[],fields:[],regions:regions??emptyRegions(),knownRegions:known,condition:conditionOf(v),built:false,disposed:false,signature:null,changedVertices:0,maxDisplacement:0};
  v.damageVisuals=state;return state;
}
function applyDamage(v,state,impact) {
  const condition=conditionOf(v),damage=(100-condition)/100,oldDamage=(100-state.condition)/100,region=regionOf(impact,v);
  if(damage<=.000001){restorePanels(state);state.regions=emptyRegions();state.knownRegions=false;state.changedVertices=0;state.maxDisplacement=0;state.signature=null;state.condition=condition;return state;}
  if(damage<oldDamage&&oldDamage>0)for(const k of DAMAGE_REGIONS)state.regions[k]*=damage/oldDamage;
  if(region){state.knownRegions=true;state.regions[region]=clamp(Math.max(state.regions[region],damage),0,1);}
  else if(!state.knownRegions)for(const k of DAMAGE_REGIONS)state.regions[k]=damage;
  state.condition=condition;
  if(!state.built){state.panels=collectPanels(v);state.fields=makeFields(v,state.panels);state.built=true;}
  const signature=DAMAGE_REGIONS.map(k=>state.regions[k]).join(':');
  if(signature!==state.signature){applyGeometry(state);state.signature=signature;}
  return state;
}

/** Healthy vehicles stay allocation-free; attaching twice is idempotent. */
export function attachVehicleDamage(v){const state=getState(v);return state?applyDamage(v,state):null;}
/** impact accepts a region string, {region}, or {localPoint:{x,z}}. */
export function updateVehicleDamage(v,{impact}={}){const state=getState(v);return state?applyDamage(v,state,impact):null;}
/** JSON-ready, instance-specific save data. No live geometry references. */
export function serializeVehicleDamage(v){const condition=conditionOf(v);if(condition===100)return emptyRegions();const state=v?.damageVisuals;if(!state?.knownRegions)return Object.fromEntries(DAMAGE_REGIONS.map(k=>[k,(100-condition)/100]));return sanitizeDamageRegions(state.regions);}
/** Call after restoring condition. Missing old-save data uses condition fallback. */
export function restoreVehicleDamage(v,data){const state=getState(v);if(!state)return null;const regions=sanitizeDamageRegions(data);state.regions=regions??emptyRegions();state.knownRegions=!!regions&&DAMAGE_REGIONS.some(k=>regions[k]>0);state.condition=conditionOf(v);state.signature=null;return applyDamage(v,state);}
/** Condition must be set by the caller; this never grants a free repair. */
export function repairVehicleDamage(v){const prior=v?.damageVisuals,regions=prior?.knownRegions?sanitizeDamageRegions(prior.regions):null,oldCondition=prior?.condition;disposeVehicleDamage(v);const state=getState(v);if(!state)return null;if(regions&&conditionOf(v)<100){state.regions=regions;state.knownRegions=true;state.condition=finite(oldCondition,conditionOf(v));}return applyDamage(v,state);}
/** Reinstates exact source geometry and frees only this vehicle's owned clones. */
export function disposeVehicleDamage(v){if(v)warmups.delete(v);const state=v?.damageVisuals;if(!state)return;restorePanels(state);state.disposed=true;state.panels.length=0;state.fields=[];delete v.damageVisuals;}
