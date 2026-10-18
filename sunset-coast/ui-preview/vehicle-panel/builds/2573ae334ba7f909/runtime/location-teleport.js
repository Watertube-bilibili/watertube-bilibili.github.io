import {GRID,WORLD_LIMIT,WORLD_MIN_X,HIGHWAY,AIRPORTS,regionAt,inWorld,airportAirside} from './regions.js';
import {roadSpans} from './streaming-world.js';
import {createGroundContact} from './ground-contact.js';
import {getVehicleCollider,boxContact,pedestrianVehicleContact} from './vehicle-dynamics.js';
import {resetVehicleDynamics} from './vehicle-physics.js';
import {resetVehiclePose} from './render-motion.js';

const CLEARANCE=.025,SEARCH_RADIUS=180;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const box=(x,z,yaw,w,d)=>{const c=Math.cos(yaw),s=Math.sin(yaw);return{x,z,yaw,halfWidth:w,halfLength:d,right:{x:c,z:-s},back:{x:s,z:c},radius:Math.hypot(w,d)};};
const padded=(b,pad)=>({...b,halfWidth:b.halfWidth+pad,halfLength:b.halfLength+pad,radius:Math.hypot(b.halfWidth+pad,b.halfLength+pad)});
const pointOnRoad=(x,z)=>{
 if(!inWorld({x,z})||airportAirside({x,z}))return false;
 if(Math.abs(x+262)<13)return true;
 if(Math.abs(x-HIGHWAY.x)<HIGHWAY.width/2-1&&z>=HIGHWAY.zMin&&z<=HIGHWAY.zMax)return true;
 for(const vertical of [true,false]){const across=vertical?x:z,line=Math.round(across/GRID)*GRID,along=vertical?z:x;
  if(vertical&&line<-240||Math.abs(across-line)>10.7)continue;
  if(roadSpans([[along-.05,along+.05]],line,vertical).length)return true;
 }
 return false;
};

/** Tire-bottom support against the actual loaded asphalt triangles. The car
 * remains upright, like ordinary driving, so the highest supporting tire wins.
 * Diagnostic only: gameplay retains the established heightfield + .02 datum
 * used by Game.integrate, preventing a first-frame drop after fast travel. */
export function teleportGroundHeight(game,vehicle,pose=vehicle.pos,yaw=vehicle.yaw){
 const ground=game.groundContact??=createGroundContact(game.world,game.scene),c=Math.cos(yaw),s=Math.sin(yaw);
 const samples=[];
 for(const wheel of vehicle.wheels??[]){const p=wheel.pivot.position;
  for(const dx of [-.12,0,.12])samples.push({x:pose.x+(p.x+dx)*c+p.z*s,z:pose.z-(p.x+dx)*s+p.z*c,bottom:p.y-wheel.radius});
 }
 if(!samples.length)samples.push({x:pose.x,z:pose.z,bottom:0});
 const heights=ground.heightsAt?ground.heightsAt(samples):samples.map(p=>ground.heightAt(p.x,p.z));
 return Math.max(...heights.map((h,i)=>h-samples[i].bottom))+CLEARANCE;
}

function arrivalCandidates(target){
 const anchor={...target},airport=AIRPORTS.find(a=>target.x>=a.bounds.minX&&target.x<=a.bounds.maxX&&target.z>=a.bounds.minZ&&target.z<=a.bounds.maxZ);
 // Airport selections consistently arrive on the public terminal road, never
 // inside a hangar, behind a fence or on a runway.
 if(airport){anchor.x=airport.x;anchor.z=airport.z;}
 const candidates=[],seen=new Set(),wantedRegion=regionAt(target).id;
 const add=(x,z,yaw)=>{if(!inWorld({x,z})||regionAt({x,z}).id!==wantedRegion||distance({x,z},anchor)>SEARCH_RADIUS)return;const key=x.toFixed(3)+','+z.toFixed(3)+','+yaw;if(seen.has(key))return;seen.add(key);candidates.push({x,z,yaw});};
 const i=Math.round(anchor.x/GRID),j=Math.round(anchor.z/GRID);
 for(let ring=-2;ring<=2;ring++)for(const side of [1,-1]){
  const x=(i+ring)*GRID+side*4.5,z=(j+ring)*GRID+side*4.5;
  for(const delta of [0,-12,12,-24,24,-40,40,-64,64,-96,96,-144,144]){
   if(x>-241)add(x,anchor.z+delta,side>0?0:Math.PI);
   add(anchor.x+delta,z,side>0?-Math.PI/2:Math.PI/2);
  }
 }
 if(anchor.x<-240)for(const delta of [0,-12,12,-24,24,-48,48,-96,96])add(-262,anchor.z+delta,0);
 // Favor a nearby mid-block over the exact centre of a busy intersection.
 const score=p=>distance(p,anchor)+(Math.abs(p.x/GRID-Math.round(p.x/GRID))<.22&&Math.abs(p.z/GRID-Math.round(p.z/GRID))<.22?18:0);
 return candidates.sort((a,b)=>score(a)-score(b));
}

/** Preflight only: stream destination geometry, validate the actual vehicle
 * envelope and a reachable on-foot exit. No vehicle/person/service state is
 * changed until the complete plan is known. A failed search restores scenery. */
export function findTeleportArrival(game,target){
 if(!inWorld(target))return null;
 const own=game.robotaxi?.originalVehicle??game.vehicle;
 if(!own?.pos||!own.root)return null;
 const original={x:game.position.x,z:game.position.z},candidates=arrivalCandidates(target);
 if(!candidates.length)return null;
 const ignored=new Set([own,game.robotaxi?.taxi]);
 const vehicles=[...new Set([game.vehicle,game.personalVehicle,...(game.traffic??[]),...(game.police??[])].filter(v=>v&&!ignored.has(v)&&!v.populationDormant))];
 let success=false;
 try{
  game.world.update(candidates[0],true);
  const ground=game.groundContact??=createGroundContact(game.world,game.scene);
  for(const p of candidates){
   const proxy={...own,pos:p,yaw:p.yaw},body=getVehicleCollider(proxy),clear=padded(body,.35);
   const corners=[[-1,-1],[-1,1],[1,-1],[1,1]].map(([x,z])=>({x:body.x+body.right.x*body.halfWidth*x+body.back.x*body.halfLength*z,z:body.z+body.right.z*body.halfWidth*x+body.back.z*body.halfLength*z}));
   if(!pointOnRoad(body.x,body.z)||corners.some(q=>!inWorld(q)||q.x<WORLD_MIN_X+2||q.x>WORLD_LIMIT-10||Math.abs(q.z)>WORLD_LIMIT-10||!pointOnRoad(q.x,q.z)))continue;
   if((game.world.colliders??[]).some(b=>boxContact(clear,box(b.x,b.z,b.yaw??0,b.w,b.d))))continue;
   if(vehicles.some(v=>boxContact(clear,getVehicleCollider(v))))continue;
   if((game.pedestrians??[]).some(a=>a.root&&pedestrianVehicleContact(a.root.position,.8,proxy)))continue;
   const samples=[p,...corners],heights=ground.heightsAt?ground.heightsAt(samples):samples.map(q=>ground.heightAt(q.x,q.z));
   if(!heights.every(Number.isFinite)||Math.max(...heights)-Math.min(...heights)>.26)continue;
   p.y=(game.world.groundHeight?.(p.x,p.z)??0)+.02;
   const exit=ground.findExit(proxy,{radius:game.character==='mochi'?.24:.3,vehicles});
   if(!exit||distance(exit.worldPosition,p)>=4.95||regionAt(exit.worldPosition).id!==regionAt(target).id)continue;
   if((game.pedestrians??[]).some(a=>a.root&&distance(a.root.position,exit.worldPosition)<1.2))continue;
   success=true;return{vehicle:own,position:{...p},player:{...exit.worldPosition},yaw:p.yaw,region:regionAt(p),name:String(target.name??'地图标记').slice(0,160)};
  }
  return null;
 }finally{if(!success)game.world.update(original,true);}
}

/** Explicit fast travel. Navigation, airport flights and Robo Taxi never call
 * this function. Failures leave the personal car and ongoing services intact. */
export function teleportToLocation(game,target){
 const fail=reason=>({ok:false,reason});
 if(game.teleporting)return fail('正在传送，请稍候');
 if(game.aircraft?.active||game.aircraft?.pendingBoard)return fail('请先着陆下机或取消登机，再使用地点传送');
 if(game.flight?.active)return fail('航程进行中，请抵达后再传送');
 if(game.job)return fail('请先完成或取消当前职业任务，再使用地点传送');
 if(!inWorld(target))return fail('请选择地图范围内的地点');
 game.teleporting=true;
 try{
  const plan=findTeleportArrival(game,target);
  if(!plan)return fail('附近没有可安全停靠的道路，请选择其他地点');
  const wasInCar=game.robotaxi?.passenger?false:game.inCar;
  // Restore the personal identity before touching coordinates. reset() also
  // cancels taxi boarding/exiting and removes the temporary fleet vehicle.
  game.robotaxi?.reset();
  game.cancelEntry();game.inCar=wasInCar;game.autopilot=false;
  const v=game.vehicle;
  v.pos.set(plan.position.x,plan.position.y,plan.position.z);v.yaw=plan.yaw;
  v.root.rotation.set(0,plan.yaw,0);v.root.visible=true;
  for(const key of ['speed','steer','yawRate','travelDistance','bodyRoll','requestedBrakeAmount','manualBrakeAmount','electronicBrakeAmount','brakeAmount','longitudinalTireAcceleration'])v[key]=0;
  v.brake=false;v.handbrake=false;v.chassis.rotation.z=0;
  for(const wheel of v.wheels??[])wheel.pivot.rotation.y=0;
  if(v.steeringWheel)v.steeringWheel.rotation.z=0;
  resetVehicleDynamics(v);resetVehiclePose(v);
  game.playerPos.set(plan.player.x,plan.player.y,plan.player.z);game.playerYaw=plan.yaw;
  game.person.root.rotation.set(0,plan.yaw,0);game.person.root.visible=!wasInCar;
  game.nearestCar=v;game.jump=0;game.accumulator=0;game.lastFrame=null;
  game.sensorClock=0;game.replanClock=0;game.stuckTime=0;game.arrivalShown=false;game._trafficSpatialIndex=null;
  game.resetAfterTravel();
  // The save schema derives region from playerPos, including when driving.
  // Both positions must therefore move together even with a hidden avatar.
  if(wasInCar)game.playerPos.y=game.walkingHeight(game.playerPos.x,game.playerPos.z);
  game.person.root.position.copy(game.playerPos);
  game.cameraAnchor=null;game.cameraRigKey=null;game.followYaw=plan.yaw;
  game.ui?.closePhone?.();game.ui?.closeModal?.();
  if(typeof window!=='undefined')window.neonMobileUI?.closeDrawer?.();
  game.resetControls();game.updateCamera?.(0);
  game.ui?.toast?.('已传送至 '+plan.name+' · '+plan.region.name+(!wasInCar?' · 车辆在身旁':''));
  game.save?.(false);
  return{ok:true,position:{...plan.position},player:{x:game.playerPos.x,y:game.playerPos.y,z:game.playerPos.z},regionId:plan.region.id,name:plan.name};
 }finally{game.teleporting=false;}
}
