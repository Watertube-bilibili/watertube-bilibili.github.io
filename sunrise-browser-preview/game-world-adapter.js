/** Common actual-Game adapter: legacy native protocols retained; no account/storage. */
import * as THREE from './vendor/three.module.js';
import {createSharedMap,getTerrainChunk} from './shared-map-api.js';
import {BOUNDS,CHUNK,nodes,edges,places,structures,groundHeight,nearestRoad,route,surfaceAt,signalPhase} from './map-data.js';
export const COMMON_SPAWN=Object.freeze({vehicle:{x:1290,z:211,yaw:0},player:{x:1293,z:211}});
export const COMMON_PLACES=places.map(p=>({...p,icon:p.id==='quarry'?'mountain':'building'}));
export const commonNormal=(x,z)=>{const dx=(groundHeight(x+1,z)-groundHeight(x-1,z))/2,dz=(groundHeight(x,z+1)-groundHeight(x,z-1))/2,l=Math.hypot(dx,1,dz);return{x:-dx/l,y:1/l,z:-dz/l};};
export function commonRoadInfo(p){const q=nearestRoad(p.x,p.z);return{kind:q.edge.type==='trail'?'mountain':q.edge.type==='highway'?'highway':'street',width:q.edge.width,speedLimit:q.edge.type==='trail'?10:q.edge.type==='highway'?30:18,regionId:'estuary',elevation:groundHeight(p.x,p.z)};}
export function commonNearest(p){const q=nearestRoad(p.x,p.z);return{x:q.x,z:q.z,i:q.edge.id,j:0,node:q.t<.5?q.edge.a:q.edge.b};}
export function commonRoute(from,to){const start=nearestRoad(from.x,from.z),finish=nearestRoad(to.x,to.z);let best=null;for(const a of[start.edge.a,start.edge.b])for(const b of[finish.edge.a,finish.edge.b]){const r=route(a,b);if(!r)continue;const na=nodes[a],nb=nodes[b],cost=r.distance+Math.hypot(from.x-na[0],from.z-na[1])+Math.hypot(to.x-nb[0],to.z-nb[1]);if(!best||cost<best.cost)best={cost,r};}if(!best)return[];const points=[{x:start.x,z:start.z},...best.r.nodes.map(id=>({x:nodes[id][0],z:nodes[id][1]})),{x:finish.x,z:finish.z},{x:to.x,z:to.z}];return points.filter((p,i)=>!i||Math.hypot(p.x-points[i-1].x,p.z-points[i-1].z)>.1);}
const collider=(b,key)=>({x:b.x,z:b.z,w:b.w/2,d:b.d/2,baseY:b.y-b.h/2,height:b.h,yaw:0,chunk:key,id:b.id});
export function createGameWorld(scene,{materialPack=null,radius=1}={}){
 const root=new THREE.Group();root.name='estuary-common-game-world';scene.add(root);const shared=createSharedMap({scene:root,materialPack}),render=shared.renderer,chunks=new Map(),colliders=[],stats={colliderRevision:0,generatedChunks:0,loadedChunks:0,residentBuildings:0,queuedChunks:0},water=new THREE.Object3D();
 const region={id:'estuary',name:'ESTUARY COAST · common map preview',bounds:BOUNDS};
 function update(pos,force=false){const cx=Math.floor(pos.x/CHUNK),cz=Math.floor(pos.z/CHUNK);let dirty=false;for(const[key,c]of chunks)if(Math.abs(c.cx-cx)>radius||Math.abs(c.cz-cz)>radius){render.disposeChunk(key);chunks.delete(key);dirty=true;}
  const missing=[];for(let x=cx-radius;x<=cx+radius;x++)for(let z=cz-radius;z<=cz+radius;z++)if(!chunks.has(`${x},${z}`))missing.push([x,z]);missing.sort((a,b)=>Math.hypot(a[0]-cx,a[1]-cz)-Math.hypot(b[0]-cx,b[1]-cz));
  for(const[x,z]of missing.slice(0,force?missing.length:1)){const key=`${x},${z}`;render.chunk(x,z);const group=render.chunks.get(key);group.children[0].userData.terrain=true;const solid=structures.filter(b=>b.solid&&Math.floor(b.x/CHUNK)===x&&Math.floor(b.z/CHUNK)===z).map(b=>collider(b,key));chunks.set(key,{key,cx:x,cz:z,group,colliders:solid,heightfield:getTerrainChunk(x,z)});stats.generatedChunks++;dirty=true;}
  if(dirty){colliders.length=0;for(const c of chunks.values())colliders.push(...c.colliders);stats.colliderRevision++;stats.loadedChunks=chunks.size;stats.residentBuildings=colliders.length;}stats.queuedChunks=Math.max(0,missing.length-(force?missing.length:1));return dirty;
 }
 return{root,chunks,colliders,stats,water,chunkSize:CHUNK,bounds:BOUNDS,regions:[region],airports:[],signals:[],roads:new THREE.Group(),leafGroup:new THREE.Group(),navigationEdges:edges,navigationNodes:nodes,
 update,updateSignals:render.updateSignals,updateCoreSignals(){},groundHeight,groundNormal:commonNormal,roadInfo:commonRoadInfo,buildTerrainHeightfield:getTerrainChunk,regionAt:()=>region,getRegionTravel:()=>null,airportAt:()=>null,district:p=>{let best=places[0];for(const v of places)if(Math.hypot(v.x-p.x,v.z-p.z)<Math.hypot(best.x-p.x,best.z-p.z))best=v;return best.name;},dispose(){for(const k of[...chunks.keys()])render.disposeChunk(k);chunks.clear();colliders.length=0;scene.remove(root);},surfaceAt,signalPhase};
}
