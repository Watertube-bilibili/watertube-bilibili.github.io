/** Optional SUNRISE map provider. No global selector, storage, wallet or account mutation. */
import * as THREE from './vendor/three.module.js';
import {createUltraWorld} from './crescent/src/ultra-map-world.js';
import {MAP_ID as SOURCE_MAP_ID,MAP_NAME,BOUNDS,CHUNK_SIZE,SPAWN,PLACES,ROADS,TRAILS,groundHeight,nearestRoute,planRoute,terrainKind} from './crescent/src/ultra-map-layout.js';
export const CRESCENT_ID='sunrise-crescent-v1';
export const CRESCENT_SAVE_KEY='sunrise-coast:crescent:v1';
export const CRESCENT_SPAWN=Object.freeze({vehicle:Object.freeze({...SPAWN}),player:Object.freeze({x:SPAWN.x+3,z:SPAWN.z})});
export const CRESCENT_CAPABILITIES=Object.freeze({terrainHeightfield:true,planarVehicleColliders:true,walkableEntitySurfaces:true,vehicleSurfaceMesh:false,vehicleRoofRamp:false,persistentAmusement:false,delivery:false,traffic:false,pilot:false});
export const crescentNormal=(x,z)=>{const dx=(groundHeight(x+1,z)-groundHeight(x-1,z))/2,dz=(groundHeight(x,z+1)-groundHeight(x,z-1))/2,l=Math.hypot(dx,1,dz);return{x:-dx/l,y:1/l,z:-dz/l};};
export function crescentRoadInfo(p){const q=nearestRoute(p.x,p.z);return{kind:q.route.kind==='dirt'?'mountain':'street',width:q.route.width,speedLimit:q.route.kind==='dirt'?10:18,regionId:CRESCENT_ID,elevation:groundHeight(p.x,p.z)};}
export function crescentNearest(p){const q=nearestRoute(p.x,p.z,ROADS);return{x:q.x,z:q.z,i:q.route.id,j:q.segment,node:null};}
export function crescentRoute(from,to,options){const r=planRoute(from,to,options);return r.ok?r.points:[];}
export function validateCrescentSnapshot(snapshot){if(!snapshot||snapshot.mapId!==CRESCENT_ID||snapshot.schema!==1)throw Error('CRESCENT map/schema mismatch; never import another map slot');return snapshot;}
function atlas(){const navigationNodes=[],navigationEdges=[];for(const r of [...ROADS,...TRAILS]){const start=navigationNodes.length;for(const p of r.points)navigationNodes.push([p.x,p.z]);for(let i=1;i<r.points.length;i++)navigationEdges.push({id:r.id+':'+i,a:start+i-1,b:start+i,width:r.width,type:r.kind==='dirt'?'trail':'street'});}return{navigationNodes,navigationEdges};}
export function createCrescentGameWorld(scene,options={}){
 const source=createUltraWorld(scene,options),region={id:CRESCENT_ID,name:MAP_NAME,bounds:BOUNDS};
 const stats={colliderRevision:0,generatedChunks:0,loadedChunks:0,residentBuildings:0,queuedChunks:0};let lastSignature='',disposed=false;
 function update(pos,force=false){if(disposed)return false;source.update(pos,force);const signature=[...source.chunks].map(([k,v])=>k+':'+v.lod).join('|')+';'+[...source.entities].map(([k,v])=>k+':'+v.lod).join('|');const dirty=signature!==lastSignature;if(dirty){stats.colliderRevision++;stats.generatedChunks+=Math.max(0,source.chunks.size-stats.loadedChunks);lastSignature=signature;}stats.loadedChunks=source.chunks.size;stats.residentBuildings=source.colliders.length;return dirty;}
 return{...source,...atlas(),mapId:CRESCENT_ID,sourceMapId:SOURCE_MAP_ID,saveKey:CRESCENT_SAVE_KEY,capabilities:CRESCENT_CAPABILITIES,stats,inspectStats:source.stats,chunkSize:CHUNK_SIZE,regions:[region],airports:[],signals:[],roads:new THREE.Group(),leafGroup:new THREE.Group(),places:PLACES,spawn:CRESCENT_SPAWN,update,groundNormal:crescentNormal,roadInfo:crescentRoadInfo,planRoute:crescentRoute,routeResult:planRoute,regionAt:()=>region,getRegionTravel:()=>null,airportAt:()=>null,updateSignals(){},updateCoreSignals(){},surfaceAt:(x,z)=>terrainKind(x,z),district:p=>PLACES.reduce((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)<Math.hypot(b.x-p.x,b.z-p.z)?a:b).name,dispose(){if(disposed)return;disposed=true;source.dispose();scene.remove(source.root);stats.loadedChunks=0;stats.residentBuildings=0;stats.colliderRevision++;}};
}
export const crescentProvider=Object.freeze({id:CRESCENT_ID,sourceMapId:SOURCE_MAP_ID,name:MAP_NAME,saveKey:CRESCENT_SAVE_KEY,spawn:CRESCENT_SPAWN,places:PLACES,bounds:BOUNDS,capabilities:CRESCENT_CAPABILITIES,groundHeight,groundNormal:crescentNormal,roadInfo:crescentRoadInfo,nearest:crescentNearest,route:crescentRoute,createWorld:createCrescentGameWorld,validateSnapshot:validateCrescentSnapshot});
