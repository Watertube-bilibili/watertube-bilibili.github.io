// Original-city static collision. Every streamed height sample and NE/SW cell
// diagonal is shared with the renderer and the original groundHeight query.
import {Vector3 as V} from './vendor/three.module.js';
import {physicsSurfaceMesh} from './physics-surfaces.js';
import {WORLD_MIN_X,WORLD_LIMIT} from './regions.js';

export function rapierTerrainMesh(field){
 const {width,depth,heights,spacingX,spacingZ,origin,minX,minZ}=field??{};
 if(!Number.isInteger(width)||width<2||!Number.isInteger(depth)||depth<2||!Array.isArray(heights)||heights.length!==width*depth||!heights.every(Number.isFinite)||![spacingX,spacingZ].every(n=>Number.isFinite(n)&&n>0))throw Error('Invalid authored city terrain');
 const x0=Number.isFinite(minX)?minX:origin?.[0]-(width-1)*spacingX/2,z0=Number.isFinite(minZ)?minZ:origin?.[2]-(depth-1)*spacingZ/2;
 if(![x0,z0].every(Number.isFinite))throw Error('Invalid authored city terrain origin');
 const vertices=new Float32Array(width*depth*3),indices=new Uint32Array((width-1)*(depth-1)*6);
 for(let z=0;z<depth;z++)for(let x=0;x<width;x++){const i=z*width+x;vertices.set([x0+x*spacingX,heights[i],z0+z*spacingZ],i*3);}
 let i=0;for(let z=0;z<depth-1;z++)for(let x=0;x<width-1;x++){const a=z*width+x,b=a+1,c=a+width,d=c+1;indices.set([a,c,b,b,c,d],i);i+=6;}
 return{vertices,indices};
}

export class RapierWorldGeometry{
 constructor(R,world,source,{scene=null}={}){this.R=R;this.world=world;this.source=source;this.scene=scene;this.chunks=new Map();this.airports=new Map();this.extras=[];this.surfaceStats=new Map();this.extraRevision=undefined;this.extrasLoaded=false;}
 mesh(mesh){
  if(!mesh.vertices.every(Number.isFinite)||mesh.indices.length%3)throw Error('Invalid authored city surface');
  return mesh.indices.length?this.world.createCollider(this.R.ColliderDesc.trimesh(new Float32Array(mesh.vertices),new Uint32Array(mesh.indices)).setFriction(.7)):null;
 }
 box(b){
  const {x,z,w,d,baseY,height}=b,yaw=b.yaw??0;
  if(![x,z,w,d,baseY,height,yaw].every(Number.isFinite)||Math.min(w,d,height)<=0)throw Error('Invalid city collider');
  return this.world.createCollider(this.R.ColliderDesc.cuboid(w,height/2,d).setTranslation(x,baseY+height/2,z).setRotation({x:0,y:Math.sin(yaw/2),z:0,w:Math.cos(yaw/2)}).setFriction(.6));
 }
 remove(colliders){for(const collider of colliders)if(collider?.isValid())this.world.removeCollider(collider,true);}
 sync(){
  const source=this.source,height=source.groundHeight??(()=>0);
  if(!this.coreLoaded){
   const mesh=physicsSurfaceMesh(this.scene,height,{exclude:source.root});this.core=this.mesh(mesh);this.surfaceStats.set('core',mesh.indices.length/3);this.coreLoaded=true;
   // Match the original authoritative boundary positions and vertical extent.
   const west=WORLD_MIN_X-2,east=WORLD_LIMIT-2,north=-WORLD_LIMIT+2,south=WORLD_LIMIT-2,mid=(west+east)/2;
   this.boundaries=[{x:west,z:0,w:2,d:WORLD_LIMIT},{x:east,z:0,w:2,d:WORLD_LIMIT},{x:mid,z:north,w:(east-west)/2,d:2},{x:mid,z:south,w:(east-west)/2,d:2}].map(b=>this.box({...b,baseY:-1000,height:6000}));
  }
  const desired=new Set();
  for(const [key,chunk]of source.chunks??[]){
   desired.add(key);if(this.chunks.get(key)?.chunk===chunk)continue;
   const field=chunk.heightfield??source.buildTerrainHeightfield?.(chunk.cx,chunk.cz);
   if(!field)throw Error('Original city chunk is missing its terrain samples');
   const colliders=[];
   try{
    colliders.push(this.mesh(rapierTerrainMesh(field)));
    for(const b of chunk.colliders??[])colliders.push(this.box(b));
    const mesh=physicsSurfaceMesh(chunk.group,height);colliders.push(this.mesh(mesh));this.surfaceStats.set(key,mesh.indices.length/3);
   }catch(error){this.remove(colliders);throw error;}
   this.remove(this.chunks.get(key)?.colliders??[]);this.chunks.set(key,{chunk,colliders});
  }
  for(const [key,entry]of this.chunks)if(!desired.has(key)){this.remove(entry.colliders);this.chunks.delete(key);this.surfaceStats.delete(key);}
  // The original streamer owns a stable colliders array and revisions it when
  // chunks or airport visibility change. Do not rescan all city boxes per tick.
  const revision=source.stats?.colliderRevision;
  if(!this.extrasLoaded||revision===undefined||revision!==this.extraRevision){
   const boxes=(source.colliders??[]).filter(b=>!b.chunk),signature=boxes.map(b=>[b.x,b.z,b.w,b.d,b.baseY,b.height,b.yaw??0].join(',')).join(';');
   if(!this.extrasLoaded||signature!==this.extraSignature){const next=[];
    try{for(const b of boxes)next.push(this.box(b));}catch(error){this.remove(next);throw error;}
    this.remove(this.extras);this.extras=next;this.extraSignature=signature;
   }
   this.extraRevision=revision;this.extrasLoaded=true;
   const roots=new Set((source.root?.children??[]).filter(root=>root.userData?.airport&&root.visible));
   for(const root of roots)if(!this.airports.has(root)){const mesh=physicsSurfaceMesh(root,height);this.airports.set(root,this.mesh(mesh));this.surfaceStats.set('airport:'+root.userData.airport,mesh.indices.length/3);}
   for(const [root,collider]of this.airports)if(!roots.has(root)){this.remove([collider]);this.airports.delete(root);this.surfaceStats.delete('airport:'+root.userData.airport);}
  }
 }
 surface(excludedBody){return{raycast:(origin,direction,maxDistance)=>{
  const hit=this.world.castRayAndGetNormal(new this.R.Ray(origin,direction),maxDistance,false,undefined,undefined,undefined,excludedBody);
  if(!hit)return null;const normal=new V(hit.normal.x,hit.normal.y,hit.normal.z);if(normal.dot(direction)>=-1e-7)return null;
  return{position:origin.clone().addScaledVector(direction,hit.timeOfImpact),normal,distance:hit.timeOfImpact};
 }};}
 get colliderCount(){return this.world.colliders.len();}
 clear(){this.chunks.clear();this.airports.clear();this.extras=[];this.surfaceStats.clear();this.boundaries=null;this.core=null;}
}
