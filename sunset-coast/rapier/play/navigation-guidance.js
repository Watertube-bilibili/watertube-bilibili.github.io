import {activeRouteView} from './route-view.js';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.z);
const trackers=new WeakMap();

export function formatNavigationDistance(value){
 const n=Math.max(0,Number.isFinite(value)?value:0);
 return n>=1000?`${(n/1000).toFixed(n>=10000?0:1)} km`:`${Math.round(n)} m`;
}

// Manual navigation has its own progress. It never reads or changes Pilot's
// steering state, and cannot replace the private route owned by a taxi ride.
export function updateManualNavigation(game,dt=1/60){
 if(!game.destination||!game.route?.length||game.autopilot||game.robotaxi?.active||game.flight?.active||game.aircraft?.active||game.transition||game.autonomyTest?.active){game.navigationRecalculating=false;return;}
 let state=trackers.get(game);
 if(!state||state.route!==game.route){
  const origin=game.navigationOrigin??game.position;
  state={route:game.route,origin:{x:origin.x,z:origin.z},segment:Math.max(0,game.routeIndex??0),offTime:0};
  trackers.set(game,state);
 }
 if(Number.isFinite(game.routeIndex)&&game.routeIndex!==state.segment)state.segment=clamp(game.routeIndex,0,game.route.length-1);
 const points=state.route,pos=game.position;
 let best=null;
 // Bounded search avoids skipping a whole loop where a later road crosses
 // this one. Replanning handles a large departure instead of snapping ahead.
 for(let i=Math.max(0,state.segment-2);i<Math.min(points.length,state.segment+6);i++){
  const a=i?points[i-1]:state.origin,b=points[i];if(!finite(a)||!finite(b))continue;
  const dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz;
  const t=clamp(((pos.x-a.x)*dx+(pos.z-a.z)*dz)/Math.max(l2,1e-8),0,1);
  const d=Math.hypot(pos.x-a.x-dx*t,pos.z-a.z-dz*t);
  // At shared endpoints prefer the outgoing segment, not the one just passed.
  if(!best||d<best.distance-.01||(Math.abs(d-best.distance)<.01&&i===state.segment+1))best={distance:d,index:i,t};
 }
 if(!best)return;
 if(best.distance<=18){
  state.segment=best.index;game.routeIndex=best.index;
  if(best.t>.995&&best.index<points.length-1&&distance(pos,points[best.index])<3){state.segment++;game.routeIndex=state.segment;}
  state.offTime=0;game.navigationRecalculating=false;
 }else{
  state.offTime+=Math.max(0,Math.min(dt,.1));game.navigationRecalculating=true;
  if(state.offTime>=1.2&&(game.time-(game.replanClock??-100))>=3){game.replan();game.navigationRecalculating=false;}
 }
}

export function navigationGuidance(game){
 const view=activeRouteView(game),destination=view.destination;
 if(!finite(destination)||!finite(view.origin))return{active:false,view};
 const points=view.points??[],index=clamp(view.index??0,0,points.length),path=[view.origin];
 // Remove duplicates without discarding curved taxi geometry.
 for(let i=index;i<points.length;i++)if(finite(points[i])&&distance(path.at(-1),points[i])>.05)path.push(points[i]);
 if(path.length===1||distance(path.at(-1),destination)>.5)path.push(destination);
 const cumulative=[0];for(let i=1;i<path.length;i++)cumulative.push(cumulative.at(-1)+distance(path[i-1],path[i]));
 const total=cumulative.at(-1),remaining=Number.isFinite(view.remaining)?Math.max(0,view.remaining):total;
 const destinationDistance=distance(view.origin,destination),taxi=view.kind==='taxi',pickup=taxi&&!game.robotaxi?.passenger;
 let maneuver='straight',instruction='沿路线直行',turnDistance=remaining;
 // Evaluate headings over a road-sized window. Tiny points in the taxi's
 // smooth curve must not turn a 90-degree junction into endless "straight".
 for(let i=1;i<path.length-1;i++){
  let before=i-1,after=i+1;
  while(before>0&&cumulative[i]-cumulative[before]<8)before--;
  while(after<path.length-1&&cumulative[after]-cumulative[i]<8)after++;
  const a=path[before],b=path[i],c=path[after];
  if(distance(a,b)<2||distance(b,c)<2)continue;
  const ux=b.x-a.x,uz=b.z-a.z,vx=c.x-b.x,vz=c.z-b.z;
  const angle=Math.atan2(ux*vz-uz*vx,ux*vx+uz*vz);
  if(Math.abs(angle)<.58)continue;
  maneuver=Math.abs(angle)>2.45?'uturn':angle>0?'right':'left';
  instruction=maneuver==='uturn'?'前方掉头':maneuver==='left'?'前方左转':'前方右转';turnDistance=cumulative[i];break;
 }
 const speed=Math.abs((taxi?game.robotaxi?.taxi:game.vehicle)?.speed??0);
 if(destinationDistance<6&&remaining<12){maneuver='arrive';instruction=pickup?'接送车辆已到达':speed<.8?'已到达目的地':'到达目的地 · 请停车';turnDistance=destinationDistance;}
 else if(maneuver==='straight'&&remaining<60){maneuver='arrive';instruction=pickup?'车辆正在接近':'前方到达目的地';}
 if(game.navigationRecalculating&&!taxi){maneuver='replan';instruction='正在重新规划';turnDistance=null;}
 if(!points.length&&destinationDistance>=6){maneuver='replan';instruction='路线暂不可用';turnDistance=null;}
 const mode=pickup?'Robo Taxi · 接车':taxi?'Robo Taxi · 乘坐中':game.job?'职业路线':game.autopilot?'VOLT Pilot 辅助驾驶':game.inCar?'驾车导航':'步行导航';
 return{active:true,view,destination,remaining,remainingText:formatNavigationDistance(remaining),maneuver,instruction,turnDistance,
  turnText:turnDistance===null?'偏离路线':formatNavigationDistance(turnDistance),mode,color:view.color,
  // Route lengths are real. An ETA would need signal/traffic predictions,
  // so do not present straight-line or constant-speed guesses as an arrival time.
  detail:`${destination.name??'目的地'} · 剩余 ${formatNavigationDistance(remaining)}`};
}

const arrows={straight:'M12 21V3m-6 6 6-6 6 6',left:'M17 21v-8a5 5 0 0 0-5-5H4m5-5L4 8l5 5',right:'M7 21v-8a5 5 0 0 1 5-5h8m-5-5 5 5-5 5',uturn:'M18 21V9a6 6 0 0 0-12 0v7m-4-4 4 4 4-4',arrive:'M5 22V3m0 1h13l-2 4 2 4H5',replan:'M20 8a8 8 0 0 0-14-2L3 9m0-6v6h6m-5 7a8 8 0 0 0 14 2l3-3m0 6v-6h-6'};
export function navigationArrow(maneuver='straight'){
 return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${arrows[maneuver]??arrows.straight}"/></svg>`;
}
