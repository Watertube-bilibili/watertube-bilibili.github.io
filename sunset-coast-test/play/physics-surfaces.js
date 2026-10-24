import * as THREE from './vendor/three.module.js';

/** Native collision for the authored load-bearing surfaces above the heightmap.
 * Paint remains a depth-biased decal. Raw terrain, vehicles, people, roofs and
 * scenery are excluded. This runs once per chunk, not on physics/render ticks.
 * Indexed coordinates keep the bridge packet small; the engine owns all queries.
 */
export function physicsSurfaceMesh(root,terrain,{exclude=null}={}){
 const vertices=[],indices=[],lookup=new Map(),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),matrix=new THREE.Matrix4(),instance=new THREE.Matrix4();
 root?.updateWorldMatrix?.(true,true);
 const vertex=v=>{const x=Math.round(v.x*10000)/10000,y=Math.round(v.y*10000)/10000,z=Math.round(v.z*10000)/10000,key=x+','+y+','+z;let i=lookup.get(key);if(i===undefined){i=vertices.length/3;lookup.set(key,i);vertices.push(x,y,z);}return i;};
 function triangle(terrainOffset=null){
  const bx=b.x-a.x,bz=b.z-a.z,cx=c.x-a.x,cz=c.z-a.z,den=bx*cz-bz*cx;if(den>=-1e-7)return;
  const by=b.y-a.y,cy=c.y-a.y;if(Math.hypot((by*cz-cy*bz)/den,(cy*bx-by*cx)/den)>3)return;
  if(terrainOffset===null){const offsets=[a,b,c].map(v=>v.y-terrain(v.x,v.z));if(offsets.some(y=>y<-.03||y>.66)||Math.max(...offsets)<.005)return;}else if(terrainOffset<.005||terrainOffset>.66)return;
  const ids=[vertex(a),vertex(b),vertex(c)];if(new Set(ids).size===3)indices.push(...ids);
 }
 function mesh(o,m){
  const p=o.geometry?.attributes?.position,index=o.geometry?.index;if(!p)return;
  if(o.userData.physicsSurfaceRanges){
   for(const range of o.userData.physicsSurfaceRanges){
    if(range.quad){for(const ids of [[0,1,2],[2,1,3]]){a.fromArray(range.quad[ids[0]]).applyMatrix4(m);b.fromArray(range.quad[ids[1]]).applyMatrix4(m);c.fromArray(range.quad[ids[2]]).applyMatrix4(m);triangle(range.offset);}}
    else for(let i=range.start;i<range.start+range.count;i+=3){a.fromBufferAttribute(p,i).applyMatrix4(m);b.fromBufferAttribute(p,i+1).applyMatrix4(m);c.fromBufferAttribute(p,i+2).applyMatrix4(m);triangle(range.offset);}
   }return;
  }
  // Broad flat slabs need two top triangles, regardless of render tessellation.
  if(o.geometry.type==='BoxGeometry'){
   const {width=1,height=1,depth=1}=o.geometry.parameters;
   const corners=[[-width/2,height/2,-depth/2],[-width/2,height/2,depth/2],[width/2,height/2,-depth/2],[width/2,height/2,depth/2]].map(p=>new THREE.Vector3(...p).applyMatrix4(m));
   for(const ids of [[0,1,2],[2,1,3]]){a.copy(corners[ids[0]]);b.copy(corners[ids[1]]);c.copy(corners[ids[2]]);triangle();}return;
  }
  const count=index?.count??p.count;
  for(let i=0;i<count;i+=3){a.fromBufferAttribute(p,index?index.getX(i):i).applyMatrix4(m);b.fromBufferAttribute(p,index?index.getX(i+1):i+1).applyMatrix4(m);c.fromBufferAttribute(p,index?index.getX(i+2):i+2).applyMatrix4(m);triangle();}
 }
 function visit(o){
  if(o===exclude||o.userData?.nativeSurfaceOwned||o.userData?.guidance||o.userData?.dynamicFurniture||o.userData?.model||o.userData?.character||o.userData?.aircraftType||o.userData?.terrain)return;
  if(o.isMesh&&[undefined,0,1,5].includes(o.userData.semantic)&&!o.material?.transparent){
   if(o.isInstancedMesh){for(let i=0;i<o.count;i++){o.getMatrixAt(i,instance);matrix.multiplyMatrices(o.matrixWorld,instance);mesh(o,matrix);}}else mesh(o,o.matrixWorld);
  }
  for(const child of o.children??[])visit(child);
 }
 if(root)visit(root);return{vertices,indices};
}
