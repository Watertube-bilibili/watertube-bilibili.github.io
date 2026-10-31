import {GRID,roadEdgeAllowed} from './regions.js';
import {planRoute,nearestRoad} from './streaming-world.js';

// Closure discovery consumes camera coordinates only. The grid is the public
// road map; this module never queries world colliders, traffic or pedestrians.
const edgeKey=(a,b)=>[`${a.i},${a.j}`,`${b.i},${b.j}`].sort().join('|');
export function observedRoadEdge(point,tangent){
 if(![point.x,point.z,tangent.x,tangent.z].every(Number.isFinite))return null;
 const vertical=Math.abs(tangent.z)>=Math.abs(tangent.x),node=nearestRoad(point);
 if(Math.abs(vertical?point.x-node.x:point.z-node.z)>11)return null;
 const index=Math.floor((vertical?point.z:point.x)/GRID);
 const a=vertical?{i:node.i,j:index}:{i:index,j:node.j},b=vertical?{i:node.i,j:index+1}:{i:index+1,j:node.j};
 if(!roadEdgeAllowed({x:a.i*GRID,z:a.j*GRID},{x:b.i*GRID,z:b.j*GRID}))return null;
 return edgeKey(a,b);
}
export function routeObstacleDistance(origin,route,point){
 let previous=origin,best=Infinity;
 for(const next of route){const dx=next.x-previous.x,dz=next.z-previous.z,l2=dx*dx+dz*dz,t=l2?Math.max(0,Math.min(1,((point.x-previous.x)*dx+(point.z-previous.z)*dz)/l2)):0;best=Math.min(best,Math.hypot(point.x-previous.x-dx*t,point.z-previous.z-dz*t));previous=next;}
 return best;
}
export function planObservedDetour({position,goal,yaw,blocked=[],observations=[],halfWidth=1}){
 const route=planRoute(position,goal,blocked,yaw);
 if(!route.length)return{route:[],reason:'no-connected-route'};
 // A* deliberately starts at the next reachable junction. Its initial and
 // terminal connectors are not graph edges: inspect both, or a nominal
 // reroute can still drive through the obstruction on the way to that node.
 for(const obstacle of observations){
  const clearance=halfWidth+Math.min(8,Math.max(.3,obstacle.width??.6))/2+.5;
  if(routeObstacleDistance(position,route,obstacle.point)<clearance)return{route:[],reason:'blocked-approach'};
 }
 // Reject malformed or diagonal connectors rather than driving across land.
 let previous=position,length=0;
 for(const point of route){
  const segment=Math.hypot(point.x-previous.x,point.z-previous.z);length+=segment;
  for(let k=0,steps=Math.max(1,Math.ceil(segment/4));k<=steps;k++){
   const p={x:previous.x+(point.x-previous.x)*k/steps,z:previous.z+(point.z-previous.z)*k/steps},road=nearestRoad(p);
   const dx=Math.abs(p.x-road.x),dz=Math.abs(p.z-road.z);
   if(Math.min(dx,dz)>10.5)return{route:[],reason:'invalid-road-connector'};
   if(Math.max(dx,dz)>11){const vertical=dx<dz,index=Math.floor((vertical?p.z:p.x)/GRID),a=vertical?{x:road.x,z:index*GRID}:{x:index*GRID,z:road.z},b=vertical?{x:road.x,z:(index+1)*GRID}:{x:(index+1)*GRID,z:road.z};if(!roadEdgeAllowed(a,b))return{route:[],reason:'disconnected-road'};}
  }
  previous=point;
 }
 const direct=Math.abs(goal.x-position.x)+Math.abs(goal.z-position.z);
 if(length>direct+7200)return{route:[],reason:'detour-too-long'};
 return{route,reason:'connected-detour',length};
}
