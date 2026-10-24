import * as THREE from './vendor/three.module.js';
import {LANDMARKS,createLanternTower,createBaySpiralTower} from './landmark-models.js';
export const WORLD_LANDMARKS=Object.freeze([
 {id:'lantern',x:-200,z:-40,name:'云灯电视塔',baseY:.05},
 {id:'spiral',x:40,z:-40,name:'海湾之弦塔',baseY:.05}
]);
export const LANDMARK_PLACES=WORLD_LANDMARKS.map(p=>({id:'landmark-'+p.id,name:p.name,x:p.x,z:p.z+24,icon:'building'}));
export function worldLandmark(id){return WORLD_LANDMARKS.find(p=>p.id===id);}
export function landmarkColliderContains(b,p,r=.3){const y=p.y??0;if(y+1.8<b.baseY||y+.08>b.baseY+b.height)return false;const dx=p.x-b.x,dz=p.z-b.z,c=Math.cos(b.yaw||0),s=Math.sin(b.yaw||0);return Math.abs(dx*c-dz*s)<b.w+r&&Math.abs(dx*s+dz*c)<b.d+r;}
export function landmarkColliders(site){const m=LANDMARKS[site.id],out=[];
 const add=(x,z,w,d,base,height,yaw=0,kind='landmark-wall')=>out.push({x:site.x+x,z:site.z+z,w:w/2,d:d/2,baseY:site.baseY+base,height,yaw,kind,landmarkId:site.id});
 // Transparent façade has an actual collision shell, but its +Z main door is open.
 for(let i=0;i<48;i++){const a=i/48*Math.PI*2;if(Math.cos(a)>.92)continue;add(Math.sin(a)*m.lobbyRadius,Math.cos(a)*m.lobbyRadius,2*Math.PI*m.lobbyRadius/48+.08,.18,.81,4.1,a);}
 // Upper floors must never be represented as infinite-height ground obstacles.
 for(let i=0;i<48;i++){const a=i/48*Math.PI*2;add(Math.sin(a)*(m.observationRadius-.35),Math.cos(a)*(m.observationRadius-.35),2*Math.PI*m.observationRadius/48+.1,.18,m.observationY,4.0,a,'landmark-deck-rail');}
 add(0,0,6.8,6.8,.81,4.1,0,'landmark-core');add(0,0,6.8,6.8,m.observationY,4.1,0,'landmark-core');
 // Fixed furniture remains separate from the enterable shell.
 add(-7,5.25,5.1,3,.81,1.2,0,'landmark-counter');for(let i=0;i<3;i++)add(7,-3+i*3,3.1,1.0,.81,1.2,0,'landmark-bench');
 add(0,0,2*(m.lobbyRadius+1),2*(m.lobbyRadius+1),4.8,.55,0,'landmark-roof');add(0,0,2*m.observationRadius,2*m.observationRadius,m.observationY+4.0,.35,0,'landmark-deck-roof');
 if(site.id==='lantern')add(0,0,7.3,7.3,9,97.8,0,'landmark-shaft');else{add(0,0,5.6,5.6,5,151,0,'landmark-shaft');for(let i=0;i<24;i++){const a=(i+.5)/24*Math.PI*2;add(18*Math.sin(a)*1.03,14.2*Math.cos(a)*1.03,.8,.8,.24,7.2,0,'landmark-footing');}}
 return out;
}
// Load-bearing faces come from the approved batched model, not a second ramp
// approximation. Decorative inlays/furniture are deliberately not drive surfaces.
export function landmarkSurfaceMesh(root,site){
 root.updateWorldMatrix(true,true);const vertices=[],indices=[],lookup=new Map(),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),m=LANDMARKS[site.id];
 const put=v=>{const values=[v.x,v.y,v.z].map(n=>Math.round(n*1e6)/1e6),key=values.join(',');let id=lookup.get(key);if(id===undefined){id=vertices.length/3;lookup.set(key,id);vertices.push(...values);}return id;};
 root.traverse(o=>{if(!o.isMesh||o.material?.transparent)return;const p=o.geometry?.attributes?.position,index=o.geometry?.index;if(!p)return;for(let i=0,n=index?.count??p.count;i<n;i+=3){a.fromBufferAttribute(p,index?index.getX(i):i).applyMatrix4(o.matrixWorld);b.fromBufferAttribute(p,index?index.getX(i+1):i+1).applyMatrix4(o.matrixWorld);c.fromBufferAttribute(p,index?index.getX(i+2):i+2).applyMatrix4(o.matrixWorld);const den=(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);if(den>=-1e-7)continue;const vs=[a,b,c],ys=vs.map(v=>v.y-site.baseY),flat=[.24,.605,.79,.805,m.observationY].some(y=>ys.every(h=>Math.abs(h-y)<.0001));const ramp=vs.every((v,j)=>Math.abs(Math.abs(v.x-site.x)-2.6)<.0001&&(Math.abs(ys[j]-.81)<.0001&&Math.abs(v.z-site.z-(m.lobbyRadius-.4))<.0001||Math.abs(ys[j]-.24)<.0001&&Math.abs(v.z-site.z-23.4)<.0001));if(flat||ramp)indices.push(put(a),put(b),put(c));}});
 return{vertices,indices};
}
export function landmarkSurfaceIndex(mesh){const ground=[],deck=[];for(let i=0;i<mesh.indices.length;i+=3){const p=mesh.indices.slice(i,i+3).map(id=>mesh.vertices.slice(id*3,id*3+3)),[a,b,c]=p,bx=b[0]-a[0],bz=b[2]-a[2],cx=c[0]-a[0],cz=c[2]-a[2],den=bx*cz-bz*cx;const t={a,bx,bz,cx,cz,den,syx:((b[1]-a[1])*cz-(c[1]-a[1])*bz)/den,syz:((c[1]-a[1])*bx-(b[1]-a[1])*cx)/den};(a[1]>10?deck:ground).push(t);}return(x,z,upper=false)=>{let y=-Infinity;for(const t of upper?deck:ground){const dx=x-t.a[0],dz=z-t.a[2],u=(dx*t.cz-dz*t.cx)/t.den,v=(dz*t.bx-dx*t.bz)/t.den;if(u>=-1e-6&&v>=-1e-6&&u+v<=1+1e-6)y=Math.max(y,t.a[1]+t.syx*dx+t.syz*dz);}return Number.isFinite(y)?y:null;};}
export function createLandmarkWorld(game){const roots=new Map(),colliders=[],surfaces=new Map();for(const site of WORLD_LANDMARKS){const root=site.id==='lantern'?createLanternTower():createBaySpiralTower();root.position.set(site.x,site.baseY,site.z);root.name='production-landmark-'+site.id;root.userData.nativeSurfaceOwned=true;root.traverse(o=>{if(o.isMesh)o.userData.semantic=5;});game.scene.add(root);roots.set(site.id,root);colliders.push(...landmarkColliders(site));const mesh=landmarkSurfaceMesh(root,site);surfaces.set(site.id,{mesh,heightAt:landmarkSurfaceIndex(mesh)});game.physics?.queueCommand({type:'staticChunk',id:'landmark-surfaces:'+site.id,surfaceMesh:mesh});}
 if(game.world.coreColliders&&game.world.coreColliders!==game.world.colliders)game.world.coreColliders.push(...colliders);game.world.colliders.push(...colliders);if(game.world.stats)game.world.stats.colliderRevision++;const cabin=new THREE.Group();cabin.name='landmark-moving-elevator-cabin';cabin.userData.nativeSurfaceOwned=true;cabin.visible=false;const metal=new THREE.MeshStandardMaterial({color:0xb4c0bb,roughness:.4,metalness:.45});for(const[w,h,d,x,y,z]of[[2.8,.12,2.7,0,0,0],[2.8,.12,2.7,0,3.1,0],[.12,3.1,2.7,-1.4,1.55,0],[.12,3.1,2.7,1.4,1.55,0],[2.8,3.1,.12,0,1.55,-1.35]]){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),metal);mesh.position.set(x,y,z);cabin.add(mesh);}const lamp=new THREE.PointLight(0xffe8c0,8,7);lamp.position.y=2.9;cabin.add(lamp);game.scene.add(cabin);
 const pos=new THREE.Vector3();return{roots,colliders,cabin,surfaces,floorHeight(x,z,id=null,upper=false){if(id)return surfaces.get(id)?.heightAt(x,z,upper)??null;for(const [id,surface]of surfaces){const site=worldLandmark(id);if(Math.abs(x-site.x)>24.1||Math.abs(z-site.z)>24.1)continue;const y=surface.heightAt(x,z,false);if(y!==null)return y;}return null;},update(){for(const root of roots.values())root.traverse(o=>{if(o.userData.interiorLight){o.getWorldPosition(pos);o.visible=pos.distanceTo(game.camera.position)<28;}});},dispose(){for(const site of WORLD_LANDMARKS)game.physics?.queueCommand({type:'staticChunk',id:'landmark-surfaces:'+site.id,remove:true});for(const root of roots.values()){game.scene.remove(root);root.traverse(o=>{if(o.isMesh)o.geometry.dispose();});}game.scene.remove(cabin);for(const list of new Set([game.world.colliders,game.world.coreColliders].filter(Boolean)))for(let i=list.length-1;i>=0;i--)if(list[i].landmarkId)list.splice(i,1);if(game.world.stats)game.world.stats.colliderRevision++;}};
}
