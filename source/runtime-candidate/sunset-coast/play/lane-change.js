import {roadInfo,HIGHWAY,airportAirside} from './regions.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const wrap=n=>Math.atan2(Math.sin(n),Math.cos(n));
export function laneContext(v,{maneuver=false}={}){
 if(!v?.pos||!Number.isFinite(v.yaw))return null;
 const info=roadInfo(v.pos);if(!['street','highway'].includes(info.kind)||airportAirside(v.pos))return null;
 const vertical=Math.abs(Math.cos(v.yaw))>Math.abs(Math.sin(v.yaw));
 if(info.kind==='highway'&&!vertical)return null;
 const yaw=vertical?(Math.cos(v.yaw)>0?0:Math.PI):(Math.sin(v.yaw)>0?Math.PI/2:-Math.PI/2);
 if(Math.abs(wrap(v.yaw-yaw))>(maneuver?.55:.22))return null;
 const right={x:Math.cos(yaw),z:-Math.sin(yaw)},forward={x:-Math.sin(yaw),z:-Math.cos(yaw)};
 const center=info.kind==='highway'?HIGHWAY.x:Math.round((vertical?v.pos.x:v.pos.z)/80)*80;
 const offset=((vertical?v.pos.x:v.pos.z)-center)*(vertical?right.x:right.z);
 const centers=info.kind==='highway'?[4.5,12.5]:[2.75,8.25];
 const lane=Math.abs(offset-centers[0])<=Math.abs(offset-centers[1])?0:1;
 if(offset<1||offset>(info.kind==='highway'?15:10)||!maneuver&&Math.abs(offset-centers[lane])>2.3)return null;
 const along=vertical?v.pos.z:v.pos.x,junctionDistance=Math.abs(along-Math.round(along/80)*80);
 if(info.kind==='street'&&junctionDistance<18)return null;
 return{kind:info.kind,yaw,right,forward,offset,lane,centers,center,vertical};
}
function occupied(game,state){
 const v=game.vehicle;
 for(const other of [...(game.traffic??[]),...(game.police??[]),game.robotaxi?.taxi]){
  if(!other||other===v||other.populationDormant||other.root?.visible===false||!other.pos)continue;
  const dx=other.pos.x-v.pos.x,dz=other.pos.z-v.pos.z;
  const lateral=dx*state.right.x+dz*state.right.z+state.offset;
  const longitudinal=dx*state.forward.x+dz*state.forward.z;
  if(lateral>Math.min(state.start,state.target)-2.4&&lateral<Math.max(state.start,state.target)+2.4&&Math.abs(longitudinal)<Math.max(12,Math.abs(v.speed)*2.5,Math.abs(other.speed??0)*2.5))return true;
 }
 return false;
}
export function requestLaneChange(game,direction){
 const reject=message=>{game.ui?.toast(message);return false;};
 if(game.effectiveInputMode!=='keyboard')return reject('变道快捷键仅限电脑键盘模式');
 if(!game.inCar||game.paused||game.transition||game.aircraft?.active||game.flight?.active||game.robotaxi?.passenger||game.vehicle?.roadsterState?.mode&&game.vehicle.roadsterState.mode!=='road')return false;
 if(game.laneChange)return reject('正在变道，请等待完成');
 const v=game.vehicle,context=laneContext(v);
 if(!context||v.speed<2||v.speed>32)return reject('请在直线车道内以 8–115 km/h 前进后变道');
 const lane=context.lane+(direction==='left'?-1:1);
 if(lane<0||lane>=context.centers.length)return reject('该方向没有同向车道');
 const state={...context,start:context.offset,target:context.centers[lane],elapsed:0,duration:3,vehicle:v};
 // No lane change may run through an intersection or highway exit.
 const end={x:v.pos.x+context.forward.x*v.speed*3.8,z:v.pos.z+context.forward.z*v.speed*3.8};
 if(context.kind==='street'){
  const along=context.vertical?v.pos.z:v.pos.x,finish=context.vertical?end.z:end.x;
  if(Math.floor(along/80)!==Math.floor(finish/80)||Math.abs(finish-Math.round(finish/80)*80)<18)return reject('距路口过近，请通过路口后再变道');
 }else if(HIGHWAY.exits.some(z=>Math.abs(z-v.pos.z)<Math.abs(v.speed)*4+20))return reject('匝道附近请手动变道');
 if(occupied(game,state))return reject('相邻车道或安全距离内有车辆，暂不变道');
 game.manualTakeover();game.laneChange=state;game.setTurnSignal(direction);game.ui?.toast(direction==='left'?'向左变道 · 手动转向或制动可取消':'向右变道 · 手动转向或制动可取消');return true;
}
export function cancelLaneChange(game){
 const s=game.laneChange;game.laneChange=null;
 if(s&&game.vehicle===s.vehicle&&s.vehicle.lightState?.turnSignal===(s.target<s.start?'left':'right'))game.setTurnSignal(s.target<s.start?'left':'right');
}
export function laneChangeControls(game,input,dt){
 const s=game.laneChange;if(!s)return input;
 const cancel=()=>{cancelLaneChange(game);return input;};
 if(game.vehicle!==s.vehicle||!game.inCar||game.paused||game.transition||input.steer||input.brake||input.handbrake||game.vehicle.speed<1||occupied(game,s))return cancel();
 const current=laneContext(game.vehicle,{maneuver:true});if(!current||current.kind!==s.kind)return cancel();
 s.elapsed+=Math.max(0,dt);
 const t=clamp((s.elapsed+.45)/s.duration,0,1),blend=t*t*t*(10+t*(-15+6*t));
 const lateral=s.start+(s.target-s.start)*blend-current.offset;
 const lookahead=Math.max(5,game.vehicle.speed*.8);
 const desired=s.yaw-Math.atan2(lateral,lookahead);
 const steer=clamp(wrap(desired-game.vehicle.yaw)*1.4,-.32,.32);
 if(s.elapsed>=s.duration&&Math.abs(current.offset-s.target)<.35&&Math.abs(wrap(game.vehicle.yaw-s.yaw))<.05)return cancel();
 if(s.elapsed>7){game.ui?.toast('变道已取消，请手动接管');return cancel();}
 return{...input,steer};
}
