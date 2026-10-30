import * as THREE from './vendor/three.module.js';

// The reviewed GLB joins both blue screens into DisplaySurface. Its box UVs
// overlap and are rotated, so neither screen can use that material's map as-is.
// Reuse only the exact four authored front triangles as per-instance display
// views. Do not edit/hide the audited mesh, its UVs, its housing or its material.
const faces=[
 {key:'instrumentMesh',name:'BlenderS-live-instrument',indices:[169,186,126,169,126,109],bounds:[-.5625,-.2875000238418579,-.10750000178813934,-.012500002980232239,-.004499959759414196]},
 {key:'infotainmentMesh',name:'BlenderS-live-infotainment',indices:[62,77,20,62,20,4],bounds:[-.16100001335144043,.16100001335144043,-.09099999815225601,.09099999815225601,.004000000189989805]}
];

export function attachBlenderSDisplaySurfaces(car){
 if(!car?.blenderSRig)return null;
 if(car.blenderSDisplays)return car.blenderSDisplays;
 const source=car.root.getObjectByName('DisplaySurface'),g=source?.geometry,p=g?.attributes.position,n=g?.attributes.normal;
 if(!source?.isMesh||Array.isArray(source.material)||source.material.name!=='Display blue'||p?.count!==224||g.index?.count!==504||!n)throw Error('Blender S display surface contract mismatch');
 if(car.instrumentMesh||car.infotainmentMesh)throw Error('Blender S display surfaces already owned');
 const triangles=new Set();for(let i=0;i<g.index.count;i+=3)triangles.add([0,1,2].map(k=>g.index.getX(i+k)).join(','));
 for(const face of faces){
  const [x0,x1,y0,y1,z]=face.bounds;
  for(let i=0;i<face.indices.length;i+=3)if(!triangles.has(face.indices.slice(i,i+3).join(',')))throw Error('Blender S display face topology mismatch');
  for(const i of face.indices)if(Math.abs(p.getZ(i)-z)>1e-7||Math.min(Math.abs(p.getX(i)-x0),Math.abs(p.getX(i)-x1))>1e-7||Math.min(Math.abs(p.getY(i)-y0),Math.abs(p.getY(i)-y1))>1e-7||n.getZ(i)<.999)throw Error('Blender S display face geometry mismatch');
 }
 const views=[];
 try{
  for(const face of faces){
   const geometry=new THREE.BufferGeometry(),positions=[],uv=[],[x0,x1,y0,y1]=face.bounds;
   for(const i of face.indices){positions.push(p.getX(i),p.getY(i),p.getZ(i));uv.push((p.getX(i)-x0)/(x1-x0),1-(p.getY(i)-y0)/(y1-y0));}
   geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();
   const mesh=new THREE.Mesh(geometry,source.material);mesh.name=face.name;mesh.userData={semantic:3,blenderSDisplayFace:true,displayTextureFlipY:false};
   views.push({key:face.key,mesh});
  }
 }catch(error){for(const {mesh}of views)mesh.geometry.dispose();throw error;}
 for(const {key,mesh}of views){source.add(mesh);car[key]=mesh;}
 return car.blenderSDisplays={source,views};
}

export function disposeBlenderSDisplaySurfaces(car){
 const displays=car?.blenderSDisplays;if(!displays)return;
 for(const {key,mesh}of displays.views){mesh.removeFromParent();mesh.geometry.dispose();if(car[key]===mesh)delete car[key];}
 delete car.blenderSDisplays;
}
