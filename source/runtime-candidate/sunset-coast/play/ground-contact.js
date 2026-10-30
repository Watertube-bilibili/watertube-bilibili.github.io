import * as THREE from './vendor/three.module.js';
import {getVehicleCollider,pedestrianVehicleContact} from './vehicle-dynamics.js';
import {WORLD_MIN_X,WORLD_LIMIT} from './regions.js';

// Walking contact is a floor query, not an impassable road-sized wall. The
// render meshes are the source of truth: they include asphalt, crossings,
// shoulders, curbs and the triangulated grades of the streamed highway.
const TILE=16,EPS=1e-6,CLEARANCE=.012;
const actorFeet=new WeakMap();
const neutralFootVertices=new WeakMap();
const footGeometryVertices=new WeakMap(),footQueryState=new WeakMap();
const finite=(n,f=0)=>Number.isFinite(n)?n:f;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const key=(x,z)=>`${Math.floor(x/TILE)},${Math.floor(z/TILE)}`;
const offsets=radius=>radius>0?[[0,0],[radius,0],[-radius,0],[0,radius],[0,-radius],
 [radius*.707,radius*.707],[-radius*.707,radius*.707],[radius*.707,-radius*.707],[-radius*.707,-radius*.707]]:[[0,0]];

/** Exact shoe/paw vertex minimum relative to the avatar root. Neutral contact
 * is cached; posed:true measures the animated limbs for a no-penetration gait
 * correction. Neither form modifies a visible pose or its matrices. */
export function getActorFootOffset(person,{posed=false}={}){
 if(!person?.root)return 0;
 if(!posed&&actorFeet.has(person.root))return actorFeet.get(person.root);
 const limbs=person.tail?[...(person.arms??[]),...(person.legs??[])]:person.legs??[];
 const neutral=new Set(limbs),identity=new THREE.Quaternion(),matrix=new THREE.Matrix4(),part=new THREE.Matrix4(),vertex=new THREE.Vector3();let minimum=Infinity;
 for(const limb of limbs){const foot=limb.children?.[1];if(!foot)continue;
  foot.traverse(object=>{const positions=object.geometry?.attributes?.position;if(!positions)return;
   matrix.identity();let node=object;
   while(node&&node!==person.root){part.compose(node.position,!posed&&neutral.has(node)?identity:node.quaternion,node.scale);matrix.premultiply(part);node=node.parent;}
   for(let i=0;i<positions.count;i++){vertex.fromBufferAttribute(positions,i).applyMatrix4(matrix);minimum=Math.min(minimum,vertex.y);}
  });
 }
 const result=Number.isFinite(minimum)?minimum:0;if(!posed)actorFeet.set(person.root,result);return result;
}

/** Root height supported by the actual animated shoe/paw footprint. This
 * handles a swinging foot reaching a crosswalk/curb beyond the body's radius
 * without making the whole character hover on a large circular floor probe. */
export function getActorGroundHeight(person,ground,position=person?.root?.position,{posed=false,clearance=CLEARANCE,yaw=person?.root?.rotation?.y??0}={}){
 if(!person?.root)return ground.heightAt(position.x,position.z)+clearance;
 let state=footQueryState.get(person.root);if(!state){state={posed:[],samples:[],heights:[],matrix:new THREE.Matrix4(),part:new THREE.Matrix4(),identity:new THREE.Quaternion()};footQueryState.set(person.root,state);}
 let points=!posed?neutralFootVertices.get(person.root):null;
 if(!points){
  points=posed?state.posed:[];let cursor=0;const limbs=person.tail?[...(person.arms??[]),...(person.legs??[])]:person.legs??[],neutral=new Set(limbs),{identity,matrix,part}=state;
  for(const limb of limbs)limb.children?.[1]?.traverse(object=>{
   const positions=object.geometry?.attributes?.position;if(!positions)return;
   let vertices=footGeometryVertices.get(object.geometry);if(!vertices){vertices=[];const seen=new Set();for(let i=0;i<positions.count;i++){const v=new THREE.Vector3().fromBufferAttribute(positions,i),id=`${v.x.toFixed(6)},${v.y.toFixed(6)},${v.z.toFixed(6)}`;if(!seen.has(id)){seen.add(id);vertices.push(v);}}footGeometryVertices.set(object.geometry,vertices);}
   matrix.identity();let node=object;
   while(node&&node!==person.root){part.compose(node.position,!posed&&neutral.has(node)?identity:node.quaternion,node.scale);matrix.premultiply(part);node=node.parent;}
   for(const vertex of vertices){points[cursor]??=new THREE.Vector3();points[cursor++].copy(vertex).applyMatrix4(matrix);}
  });
  points.length=cursor;
  if(!posed)neutralFootVertices.set(person.root,points);
 }
 if(!points.length)return ground.heightAt(position.x,position.z)+clearance;
 const c=Math.cos(yaw),s=Math.sin(yaw),scale=person.root.scale,samples=state.samples; samples.length=points.length;
 for(let i=0;i<points.length;i++){const p=points[i],sample=samples[i]??=( {} );sample.x=position.x+p.x*scale.x*c+p.z*scale.z*s;sample.z=position.z-p.x*scale.x*s+p.z*scale.z*c;sample.y=p.y*scale.y;}
 const heights=ground.heightsAt?ground.heightsAt(samples,state.heights):samples.map(p=>ground.heightAt(p.x,p.z));let height=-Infinity;
 for(let i=0;i<samples.length;i++)height=Math.max(height,heights[i]-samples[i].y);
 return height+clearance;
}

function createSurfaceIndex(objects,terrain){
 const tiles=new Map(),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
 const instance=new THREE.Matrix4(),matrix=new THREE.Matrix4();let triangles=0;
 function add(mesh,transform){
  const geometry=mesh.geometry,p=geometry?.attributes?.position,index=geometry?.index;
  if(!p)return;
  const count=index?.count??p.count;
  for(let i=0;i<count;i+=3){
   a.fromBufferAttribute(p,index?index.getX(i):i).applyMatrix4(transform);
   b.fromBufferAttribute(p,index?index.getX(i+1):i+1).applyMatrix4(transform);
   c.fromBufferAttribute(p,index?index.getX(i+2):i+2).applyMatrix4(transform);
   const bx=b.x-a.x,bz=b.z-a.z,cx=c.x-a.x,cz=c.z-a.z,den=bx*cz-bz*cx;
   // Only upward faces. Side walls, undersides and virtually vertical faces
   // cannot become a floor. All existing terrain uses upward front faces.
   if(den>=-EPS)continue;
   const minX=Math.min(a.x,b.x,c.x),maxX=Math.max(a.x,b.x,c.x),minZ=Math.min(a.z,b.z,c.z),maxZ=Math.max(a.z,b.z,c.z);
   if(maxX-minX>85||maxZ-minZ>85)continue;
   const by=b.y-a.y,cy=c.y-a.y,slopeX=(by*cz-cy*bz)/den,slopeZ=(cy*bx-by*cx)/den;
   if(Math.hypot(slopeX,slopeZ)>.7)continue;
   // Exclude roofs, vehicle bodies, furniture and elevated scenery. Surface
   // offsets are evaluated at every vertex, rather than at a sloped box's
   // centre, so a ramp does not accidentally lose its uphill triangles.
   if([a,b,c].some(v=>{const h=v.y-terrain(v.x,v.z);return h<-.8||h>.65;}))continue;
   const triangle={x:a.x,y:a.y,z:a.z,bx,bz,cx,cz,den,slopeX,slopeZ};triangles++;
   for(let ix=Math.floor(minX/TILE);ix<=Math.floor(maxX/TILE);ix++)for(let iz=Math.floor(minZ/TILE);iz<=Math.floor(maxZ/TILE);iz++){
    const id=`${ix},${iz}`;if(!tiles.has(id))tiles.set(id,[]);tiles.get(id).push(triangle);
   }
  }
 }
 for(const mesh of objects){
  if(!mesh.isMesh||!mesh.geometry||![undefined,0,1,2,5].includes(mesh.userData.semantic))continue;
  if(mesh.material?.transparent&&mesh.userData.semantic!==2)continue;
  if(mesh.isInstancedMesh){for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,instance);matrix.multiplyMatrices(mesh.matrixWorld,instance);add(mesh,matrix);}}
  else add(mesh,mesh.matrixWorld);
 }
 return{tiles,triangles,height(x,z){let top=-Infinity;for(const t of tiles.get(key(x,z))??[]){
  const dx=x-t.x,dz=z-t.z,u=(dx*t.cz-dz*t.cx)/t.den,v=(dz*t.bx-dx*t.bz)/t.den;
  if(u>=-EPS&&v>=-EPS&&u+v<=1+EPS)top=Math.max(top,t.y+t.slopeX*dx+t.slopeZ*dz);
 }return top;}};
}

/** Build once after createWorld. New streamed chunks are indexed lazily only
 * when sampled, and evicted chunk indexes are released. No scene traversal or
 * raycasting is performed for each walking frame. */
export function createGroundContact(world,scene){
 const terrain=(x,z)=>finite(world?.groundHeight?.(x,z));
 const cache=new Map(),coreObjects=[],airports=[];let core=null;
 scene?.updateMatrixWorld?.(true);
 const collect=(root,exclude)=>{const found=[];function visit(o){if(o===exclude||o.userData?.guidance)return;if(o.isMesh)found.push(o);for(const child of o.children??[])visit(child);}if(root)visit(root);return found;};
 if(scene)coreObjects.push(...collect(scene,world?.root));
 for(const root of world?.root?.children??[])if(root.userData?.airport)airports.push(root);
 const stats={indexedChunks:0,indexedTriangles:0,queries:0};
 function indexFor(root){
  if(!cache.has(root)){root.updateWorldMatrix(true,true);cache.set(root,createSurfaceIndex(collect(root),terrain));}
  return cache.get(root);
 }
 function sync(){
  if(!core)core=createSurfaceIndex(coreObjects,terrain);
  const active=new Set([...(world?.chunks?.values?.()??[])].map(c=>c.group));
  for(const root of airports)if(root.visible)active.add(root);
  for(const root of cache.keys())if(!active.has(root))cache.delete(root);
  stats.indexedChunks=cache.size;stats.indexedTriangles=core.triangles+[...cache.values()].reduce((n,i)=>n+i.triangles,0);
 }
 function pointHeight(x,z){
  let height=core.height(x,z);
  // Geometry at a chunk border belongs to either neighbor. A 1 cm nudge is
  // sufficient; queries farther from borders visit only one chunk.
  const chunks=world?.chunks,keys=new Set([`${Math.floor(x/(world.chunkSize||320))},${Math.floor(z/(world.chunkSize||320))}`]);
  for(const dx of [-.01,.01])for(const dz of [-.01,.01])keys.add(`${Math.floor((x+dx)/(world.chunkSize||320))},${Math.floor((z+dz)/(world.chunkSize||320))}`);
  for(const id of keys){const chunk=chunks?.get?.(id);if(chunk)height=Math.max(height,indexFor(chunk.group).height(x,z));}
  for(const root of airports)if(root.visible){const airport=world.airports?.find(a=>a.id===root.userData.airport),bounds=airport?.bounds;if(!bounds||x>=bounds.minX&&x<=bounds.maxX&&z>=bounds.minZ&&z<=bounds.maxZ)height=Math.max(height,indexFor(root).height(x,z));}
  return Number.isFinite(height)?height:terrain(x,z);
 }
 function heightAt(x,z,{radius=0}={}){
  x=finite(x);z=finite(z);sync();stats.queries++;
  return Math.max(...offsets(radius).map(([dx,dz])=>pointHeight(x+dx,z+dz)));
 }
 function heightsAt(points,result=[]){sync();stats.queries+=points.length;result.length=points.length;for(let i=0;i<points.length;i++)result[i]=pointHeight(finite(points[i].x),finite(points[i].z));return result;}
 function snap(position,{radius=.3,clearance=CLEARANCE}={}){position.y=heightAt(position.x,position.z,{radius})+clearance;return position;}
 function clearAt(p,radius,vehicles){
  if(p.x<WORLD_MIN_X+radius+1||p.x>WORLD_LIMIT-8-radius||Math.abs(p.z)>WORLD_LIMIT-8-radius)return false;
  for(const b of world?.colliders??[]){const yaw=b.yaw??0,dx=p.x-b.x,dz=p.z-b.z,x=dx*Math.cos(yaw)-dz*Math.sin(yaw),z=dx*Math.sin(yaw)+dz*Math.cos(yaw);if(Math.abs(x)<b.w+radius+.08&&Math.abs(z)<b.d+radius+.08)return false;}
  return !vehicles.some(v=>v&&!v.populationDormant&&v.root?.visible!==false&&pedestrianVehicleContact(p,radius+.08,v));
 }
 function findExit(vehicle,{radius=.3,vehicles=[],preferredSide=-1}={}){
  if(!vehicle?.pos)return null;
  const collider=getVehicleCollider(vehicle),all=[...new Set([vehicle,...vehicles])],yaw=finite(vehicle.yaw),c=Math.cos(yaw),s=Math.sin(yaw);
  const carLocalZ=finite(vehicle.exitPosition?.z,.1),originLocalZ=(collider.x-vehicle.pos.x)*s+(collider.z-vehicle.pos.z)*c;
  const preferredZ=clamp(carLocalZ-originLocalZ,-collider.halfLength+.35,collider.halfLength-.35);
  const sides=preferredSide<0?[-1,1]:[1,-1];
  // Stay next to the door first; then search both ends and the far side. Never
  // project an avatar from inside a body/building with stale movement history.
  for(const side of sides)for(const gap of [.55,.95,1.45,2.1])for(const z of [preferredZ,preferredZ+.85,preferredZ-.85,collider.halfLength+.6,-collider.halfLength-.6]){
   const x=side*(collider.halfWidth+radius+gap),p={x:collider.x+collider.right.x*x+collider.back.x*z,y:0,z:collider.z+collider.right.z*x+collider.back.z*z};
   if(!clearAt(p,radius,all))continue;
   // Checking only the destination would let a farther candidate jump over a
   // thin wall or an adjacent car. Require a clear path from this side's door
   // face as well; if the doorway is blocked, use the other door or refuse.
   const doorX=side*(collider.halfWidth+radius+.13),door={x:collider.x+collider.right.x*doorX+collider.back.x*preferredZ,z:collider.z+collider.right.z*doorX+collider.back.z*preferredZ};
   const steps=Math.max(1,Math.ceil(Math.hypot(p.x-door.x,p.z-door.z)/.2));let accessible=true;
   for(let i=0;i<=steps;i++){const t=i/steps;if(!clearAt({x:door.x+(p.x-door.x)*t,z:door.z+(p.z-door.z)*t},radius,all)){accessible=false;break;}}
   if(!accessible)continue;
   const floor=heightAt(p.x,p.z,{radius}),samples=offsets(radius+.08).map(([dx,dz])=>heightAt(p.x+dx,p.z+dz));
   if(Math.max(...samples)-Math.min(...samples)>.38)continue;
   p.y=floor+CLEARANCE;
   const dx=p.x-vehicle.pos.x,dz=p.z-vehicle.pos.z;
   return{worldPosition:p,exitPosition:{x:dx*c-dz*s,y:p.y-vehicle.pos.y,z:dx*s+dz*c},side};
  }
  return null;
 }
 return{heightAt,heightsAt,snap,findExit,stats,dispose(){cache.clear();core=null;coreObjects.length=0;airports.length=0;}};
}

export function safeVehicleExit(game,vehicle,options={}){
 if(!game.groundContact)game.groundContact=createGroundContact(game.world,game.scene);
 const vehicles=game.allVehicles?.()??[game.vehicle,...(game.traffic??[]),...(game.police??[])];
 return game.groundContact.findExit(vehicle,{radius:game.character==='mochi'?.24:.3,vehicles,...options});
}
