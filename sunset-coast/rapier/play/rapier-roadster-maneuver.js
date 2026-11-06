// Original roadster_maneuver.gd planner. It emits force-controller commands only;
// Rapier integrates every pose. Launch, crossing and landing use the live world.
import {Vector3 as V,Quaternion as Q,Matrix4 as M} from './vendor/three.module.js';
const UP=new V(0,1,0),SIZE=new V(2.9,1.4,5.8),MARGIN=.06,TAU=Math.PI*2;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),limit=(v,m)=>v.length()>m?v.multiplyScalar(m/v.length()):v;
const vector=a=>new V(...a),planar=v=>new V(v.x,0,v.z);
const headingQ=(heading,up=UP)=>new Q().setFromRotationMatrix(new M().lookAt(new V(),heading,up));
export const RAPIER_ROADSTER_ACTIONS=Object.freeze(['spin','vault','vault_spin']);
export function createRoadsterManeuver(){return{kind:'',phase:'',status:'idle',code:'IDLE',reason:'',serial:0,lastSerial:0,elapsed:0,phaseTime:0,scanTime:0,progress:0,angle:0,start:[0,0,0],goal:[0,0,0],heading:[0,0,-1],cruiseY:0,landingY:0,emergencyBrake:false,preparationGrounded:false,preparationLimit:5,spinStartDistance:0,spinStarted:false,spinComplete:false};}
export function roadsterManeuverSnapshot(s){const {kind,phase,status,reason,progress,serial,angle,code}=s;return{kind,phase,status,reason,progress,serial,angle,code};}

/** Query the real collision world, including moving bodies, excluding only self.
 * Expanding cuboid half extents by the native .06 margin is conservative at its
 * corners; the spin sphere likewise includes that margin. Overlap precedes sweep.
 */
export function rapierRoadsterQueries(R,world,body){
 const overlapAndSweep=(origin,rotation,motion,shape)=>{
  if(world.intersectionWithShape(origin,rotation,shape,undefined,undefined,undefined,body))return false;
  if(motion.lengthSq()<1e-12)return true;
  const hit=world.castShape(origin,rotation,motion,shape,0,1,true,undefined,undefined,undefined,body);
  return !hit||hit.time_of_impact>=.9999;
 };
 return{
  ray(a,b,{fixed=false}={}){const delta=b.clone().sub(a),length=delta.length();if(!length)return null;delta.divideScalar(length);
   const hit=world.castRayAndGetNormal(new R.Ray(a,delta),length,true,fixed?R.QueryFilterFlags.ONLY_FIXED:undefined,undefined,undefined,body);
   return hit?{position:a.clone().addScaledVector(delta,hit.timeOfImpact),normal:new V(hit.normal.x,hit.normal.y,hit.normal.z),dynamic:hit.collider.parent()?.isDynamic()===true}:null;
  },
  clear(a,b,{sphere=false,orientation=new Q(),size=SIZE,offset=.15}={}){
   const origin=a.clone();if(!sphere)origin.addScaledVector(UP.clone().applyQuaternion(orientation),offset);
   const shape=sphere?new R.Ball(3.25+MARGIN):new R.Cuboid(size.x/2+MARGIN,size.y/2+MARGIN,size.z/2+MARGIN);
   return overlapAndSweep(origin,orientation,b.clone().sub(a),shape);
  },
 };
}
// Original 5×5 footprint check: the complete landing footprint must be static,
// nearly level, and close to launch elevation. Dynamic roofs are not landing pads.
function surface(s,center,baseY,query){
 const heading=vector(s.heading),right=heading.clone().cross(UP);let low=Infinity,high=-Infinity;
 for(const x of [-1.4,-.7,0,.7,1.4])for(const z of [-2.8,-1.4,0,1.4,2.8]){
  const p=center.clone().addScaledVector(right,x).addScaledVector(heading,z),hit=query.ray(new V(p.x,baseY+7,p.z),new V(p.x,baseY-3,p.z));
  if(!hit||hit.normal.y<.96||hit.dynamic)return null;
  const y=hit.position.y;if(y<-.2||Math.abs(y-baseY)>.55)return null;
  low=Math.min(low,y);high=Math.max(high,y);
 }
 return high-low>.18?null:{y:high};
}
function refuse(s,reason,code='SPACE_UNSAFE'){Object.assign(s,{status:'rejected',code,phase:'',progress:0,angle:0,reason});return{};}
function stop(s,reason,land=false,braking=true,code='CANCELLED'){Object.assign(s,{status:'cancelled',code,phase:'',reason,emergencyBrake:braking});return{stopped:true,land,braking};}
function manual(c){return c.roadsterManualOverride===true||c.roadsterRecover===true||c.roadsterAirBrake===true||['roadsterForward','roadsterLateral','roadsterVertical','roadsterYaw','roadsterPitch','roadsterRoll'].some(k=>Number.isFinite(c[k])&&Math.abs(c[k])>.02);}
function brakingClear(s,b,onGround,query){
 const v=planar(b.velocity),speed=v.length();if(speed<.6&&Math.abs(b.velocity.y)<.35)return true;
 const distance=speed*speed/12+speed*.25+.5;if(distance>100)return false;
 const heading=vector(s.heading),direction=speed>.1?v.divideScalar(speed):heading,pos=b.position;
 if(!onGround){
  const vy=b.velocity.y,rise=Math.sign(vy)*(vy*vy/12+Math.abs(vy)*.2),q=headingQ(heading),inverse=q.clone().invert(),relative=inverse.multiply(b.orientation);
  const x=new V(1,0,0).applyQuaternion(relative),y=new V(0,1,0).applyQuaternion(relative),z=new V(0,0,1).applyQuaternion(relative);
  const projected=new V(Math.abs(x.x)*SIZE.x+Math.abs(y.x)*SIZE.y+Math.abs(z.x)*SIZE.z,Math.abs(x.y)*SIZE.x+Math.abs(y.y)*SIZE.y+Math.abs(z.y)*SIZE.z,Math.abs(x.z)*SIZE.x+Math.abs(y.z)*SIZE.y+Math.abs(z.z)*SIZE.z);
  const size=new V(Math.max(SIZE.x,projected.x)+.12,Math.max(SIZE.y,projected.y)+Math.abs(rise)+.12,Math.max(SIZE.z,projected.z)+.12),origin=pos.clone().addScaledVector(UP,.15+rise*.5);
  return query.clear(origin,origin.clone().addScaledVector(direction,distance),{orientation:q,size,offset:0});
 }
 let previous=pos.clone(),groundY=pos.y-.72;const count=Math.max(1,Math.ceil(distance/1.25));
 for(let i=0;i<=count;i++){
  const sample=pos.clone().addScaledVector(direction,distance*i/count),hit=query.ray(new V(sample.x,groundY+1.3,sample.z),new V(sample.x,groundY-1.3,sample.z));
  if(!hit||hit.dynamic||hit.normal.y<.96||Math.abs(hit.position.y-groundY)>.4)return false;
  groundY=hit.position.y;sample.y=groundY+.72;const forward=heading.clone().addScaledVector(hit.normal,-heading.dot(hit.normal)).normalize();
  if(!query.clear(previous,sample,{orientation:headingQ(forward,hit.normal)}))return false;previous=sample;
 }
 return true;
}
function prepare(s,b,grounded,mode,query){
 const speed=planar(b.velocity).length(),up=UP.clone().applyQuaternion(b.orientation);
 if(Math.abs(b.velocity.y)>8)return refuse(s,'垂直速度过大，请先稳住升降','VERTICAL_SPEED');
 if(up.y<.85||b.angularVelocity.length()>1.2)return refuse(s,'请先按 X 回正，再启动一键动作','ATTITUDE_UNSTABLE');
 if(['vault','vault_spin'].includes(s.kind)&&(!grounded||mode!=='road'))return refuse(s,'智能越障请从地面开始；空中可直接转圈','VAULT_GROUND_REQUIRED');
 if(!['road','air','landing'].includes(mode))return refuse(s,'请先完成回正','MODE_BUSY');
 s.heading=planar(new V(0,0,-1).applyQuaternion(b.orientation)).normalize().toArray();s.preparationGrounded=grounded&&mode==='road';
 if(!brakingClear(s,b,s.preparationGrounded,query)){s.emergencyBrake=true;return refuse(s,'刹停路径有遮挡、断路或超出 100 米检查范围，正在刹车','BRAKE_CLEARANCE');}
 Object.assign(s,{phase:'prepare',status:'active',code:'PREPARING',reason:'已接管，正在刹稳；松开原有按键后可手动接管',preparationLimit:3.5+speed/6,start:b.position.toArray(),goal:b.position.toArray(),progress:0,angle:0,elapsed:0,phaseTime:0,scanTime:0,emergencyBrake:false});return{started:true};
}
function plan(s,b,grounded,altitude,mode,query){
 const up=UP.clone().applyQuaternion(b.orientation),pos=b.position,vault=s.kind!=='spin';
 if(planar(b.velocity).length()>2||Math.abs(b.velocity.y)>.8)return refuse(s,'尚未刹稳，请松开驾驶输入后重试','NOT_SETTLED');
 if(up.y<.97||b.angularVelocity.length()>.35)return refuse(s,'姿态还未稳定，请按 X 回正后重试','ATTITUDE_UNSTABLE');
 if(vault&&(!grounded||mode!=='road'))return refuse(s,'智能越障请从地面开始','VAULT_GROUND_REQUIRED');
 if(!['road','air'].includes(mode))return refuse(s,'请先完成回正；空中可直接选择转圈','MODE_BUSY');
 const heading=planar(new V(0,0,-1).applyQuaternion(b.orientation)).normalize(),q=headingQ(heading),baseY=pos.y-altitude-.72;
 s.heading=heading.toArray();s.start=pos.toArray();s.landingY=baseY;let goal=pos.clone();
 if(!vault){
  if(altitude>55)return refuse(s,'离地过高或下方地形未载入，请先下降','SPIN_ALTITUDE');
  s.cruiseY=Math.max(pos.y,s.landingY+6);goal.y=s.cruiseY;
  if(s.cruiseY-s.landingY>55)return refuse(s,'高度过高，请先下降','SPIN_ALTITUDE');
  if(!query.clear(pos,goal,{orientation:b.orientation})||!query.clear(goal,goal,{sphere:true}))return refuse(s,'上方或车身周围不足 3.25 米，不能安全转圈','SPIN_CLEARANCE');
 }else{
  const origin=surface(s,pos,baseY,query);if(!origin)return refuse(s,'起飞地面坡度或凹凸过大，请移到平整路面','VAULT_LAUNCH_SUPPORT');
  s.landingY=origin.y;const right=heading.clone().cross(UP);let nearest=Infinity;
  for(const x of [-1.2,-.6,0,.6,1.2])for(const y of [.25,.65,1.1]){
   const a=new V(pos.x,baseY+y,pos.z).addScaledVector(right,x).addScaledVector(heading,2.9),hit=query.ray(a,a.clone().addScaledVector(heading,17.1));
   if(hit)nearest=Math.min(nearest,hit.position.clone().sub(pos).dot(heading));
  }
  if(!Number.isFinite(nearest))return refuse(s,'前方 20 米内未识别到可越过的障碍','NO_OBSTACLE');
  if(nearest<5)return refuse(s,'离障碍太近，请后退留出起飞空间','OBSTACLE_TOO_CLOSE');
  let found=false;
  for(let i=Math.ceil(nearest+5);i<=28;i++){
   const candidate=pos.clone().addScaledVector(heading,i),pad=surface(s,candidate,baseY,query);
   if(pad){goal=candidate;s.landingY=pad.y;found=true;break;}
  }
  if(!found)return refuse(s,'障碍后方没有可用的完整落地区域','NO_LANDING_PAD');
  let highest=baseY;const distance=goal.distanceTo(pos);
  for(let i=0;i<=Math.ceil(distance/.65);i++)for(const x of [-1.4,-.7,0,.7,1.4]){
   const p=pos.clone().addScaledVector(heading,Math.min(distance,i*.65)).addScaledVector(right,x),hit=query.ray(new V(p.x,baseY+80,p.z),new V(p.x,baseY-1,p.z));
   if(!hit)return refuse(s,'航线下方没有连续地面，不能安全越障','CORRIDOR_UNSUPPORTED');
   highest=Math.max(highest,hit.position.y);
  }
  if(highest-baseY>3.5)return refuse(s,'障碍过高或上方有遮挡，无法安全越过','OBSTACLE_TOO_HIGH');
  s.cruiseY=Math.max(baseY+3.8,highest+2.1);
  if(s.kind==='vault_spin'){s.cruiseY=Math.max(s.cruiseY,highest+3.25+.45);s.spinStartDistance=Math.max(0,nearest-3.5);}
  const launch=new V(pos.x,s.cruiseY,pos.z),crossing=new V(goal.x,s.cruiseY,goal.z),touchdown=new V(goal.x,s.landingY+.72,goal.z);
  if(s.kind==='vault_spin'&&!query.clear(launch,crossing,{sphere:true}))return refuse(s,'越障航线没有足够的整车转圈空间','VAULT_SPIN_CLEARANCE');
  if(!query.clear(pos,launch,{orientation:q})||!query.clear(launch,crossing,{orientation:q})||!query.clear(crossing,touchdown,{orientation:q}))return refuse(s,'起飞、越障航线或落地通道被遮挡','PATH_BLOCKED');
 }
 s.goal=goal.toArray();Object.assign(s,{spinStarted:false,spinComplete:false,phase:'lift',status:'active',code:'EXECUTING',reason:vault?'正在抬升并检查航线':'正在抬升至安全转圈高度',elapsed:0,phaseTime:0,scanTime:0,progress:0,angle:0,emergencyBrake:false});return{started:true};
}
export function stepRoadsterManeuver(s,b,c,dt,{grounded,altitude,mode,healthy,trim,query}){
 const incoming=Number.isFinite(c.roadsterActionSerial)?Math.max(0,Math.floor(c.roadsterActionSerial)):0,action=c.roadsterAction;
 if(incoming>s.lastSerial){
  s.lastSerial=incoming;s.serial=incoming;
  if(action==='cancel'){if(s.status==='active')return stop(s,'已取消，驾驶员接管',c.roadsterCancelLanding===true);}
  else if(['spin','vault','vault_spin'].includes(action)){
   if(s.status==='active')return{};s.kind=action;
   if(trim!=='rocket')return refuse(s,'仅 Rocket 配置支持智能空中特技','TRIM_UNSUPPORTED');
   if(!healthy)return refuse(s,'动力损坏或车辆电量耗尽','NO_POWER');
   if(!query)return refuse(s,'实际碰撞空间尚未就绪','QUERY_UNAVAILABLE');
   prepare(s,b,grounded,mode,query);
  }
 }
 if(s.status!=='active'){
  if(s.emergencyBrake&&healthy&&!manual(c)&&planar(b.velocity).length()>.08)return grounded&&mode==='road'?{groundPrepare:true,acceleration:limit(planar(b.velocity).multiplyScalar(-4),8)}:{braking:true};
  s.emergencyBrake=false;return{};
 }
 if(!healthy)return stop(s,'动力中断，特技已取消',false,false,'NO_POWER');
 if(manual(c))return stop(s,'新的手动操作已接管',false,false,'MANUAL_OVERRIDE');
 if(!query)return stop(s,'实际碰撞空间不可用，动作已中止',false,true,'QUERY_UNAVAILABLE');
 s.elapsed+=dt;s.phaseTime+=dt;s.scanTime+=dt;
 if(s.elapsed>30)return stop(s,'动作超时，已转为悬停，请手动接管',false,true,'TIMEOUT');
 const velocity=planar(b.velocity),up=UP.clone().applyQuaternion(b.orientation);
 if(s.phase==='prepare'){
  if(s.phaseTime>s.preparationLimit)return stop(s,'未能刹稳，请先停车或悬停后重试',false,true,'PREPARE_TIMEOUT');
  if(velocity.length()<.6&&Math.abs(b.velocity.y)<.35&&up.y>.97&&b.angularVelocity.length()<.3){plan(s,b,grounded,altitude,mode,query);if(s.status!=='active')return{};}
  else{
   const acceleration=limit(velocity.clone().multiplyScalar(-4),8);s.reason=s.kind==='spin'?'正在自动刹稳，随后检查转圈空间；新输入可接管':'正在自动刹稳，随后检查障碍与落地；新输入可接管';
   if(s.scanTime>.1){s.scanTime=0;if(!brakingClear(s,b,s.preparationGrounded&&grounded,query))return stop(s,'刹停空间出现遮挡，已中止特技并继续刹车，请接管',false,true,'PREPARE_BLOCKED');}
   return s.preparationGrounded&&grounded?{groundPrepare:true,acceleration}:{controlled:true,vertical:0,acceleration,roll:0,level:true,landing:false};
  }
 }
 const start=vector(s.start),goal=vector(s.goal),heading=vector(s.heading),target=s.phase==='lift'?new V(start.x,s.cruiseY,start.z):new V(goal.x,s.cruiseY,goal.z);
 if(s.phase==='land')target.y=s.landingY+.72;
 if(s.scanTime>.1){
  s.scanTime=0;
  if(s.kind==='vault_spin'&&['cross','settle'].includes(s.phase)){
   if(!query.clear(b.position,target,{sphere:true}))return stop(s,'越障转圈航线出现障碍，已停止动作，请接管',false,true,'VAULT_SPIN_BLOCKED');
  }else if(s.kind==='spin'&&['spin','settle'].includes(s.phase)){
   if(!query.clear(b.position,b.position,{sphere:true}))return stop(s,'转圈空间出现障碍，已停止动作，请接管',false,true,'SPIN_BLOCKED');
  }else if(!query.clear(b.position,target,{orientation:s.phase==='lift'?b.orientation:headingQ(heading)}))return stop(s,'航线出现障碍，已悬停，请接管',false,true,s.kind==='spin'?'SPIN_BLOCKED':'CANCELLED');
  if(s.phase==='land'&&!surface(s,goal,s.landingY,query))return stop(s,'落地区域已不安全，已悬停，请接管',false,true,'CANCELLED');
 }
 const delta=target.sub(b.position),desired=limit(planar(delta).multiplyScalar(1.5),3.2),acceleration=limit(desired.sub(velocity).multiplyScalar(2.8),8);let vertical=clamp(delta.y*1.7,-1.5,3),rolling=false,landing=s.phase==='land';
 if(s.phase==='lift'&&Math.abs(delta.y)<.18&&Math.abs(b.velocity.y)<.4&&planar(delta).length()<.2){s.phase=s.kind==='spin'?'spin':'cross';s.phaseTime=0;s.reason=s.kind==='spin'?'正在完成一周翻滚':s.kind==='vault_spin'?'正在越障并完成一周转圈':'正在越过已识别障碍';}
 else if(s.phase==='cross'){
  if(s.kind==='vault_spin'){
   s.spinStarted=s.spinStarted||b.position.clone().sub(start).dot(heading)>=s.spinStartDistance;
   if(s.spinStarted&&!s.spinComplete){s.angle+=b.angularVelocity.dot(new V(0,0,-1).applyQuaternion(b.orientation))*dt;s.spinComplete=s.angle>=TAU+.02;rolling=!s.spinComplete;}
  }
  s.progress=clamp(.2+.6*(1-planar(delta).length()/Math.max(1,goal.distanceTo(start))),.2,.8);
  if(planar(delta).length()<.18&&velocity.length()<.35&&(s.kind!=='vault_spin'||s.spinComplete)){s.phase=s.kind==='vault_spin'?'settle':'land';s.phaseTime=0;s.reason=s.kind==='vault_spin'?'越障转圈完成，正在回正后降落':'落地区域已确认，正在缓降';}
 }else if(s.phase==='spin'){
  s.angle+=b.angularVelocity.dot(new V(0,0,-1).applyQuaternion(b.orientation))*dt;s.progress=clamp(s.angle/TAU,0,1);rolling=s.angle<TAU+.02;
  if(!rolling){s.phase='settle';s.phaseTime=0;s.reason='一周转圈完成，正在回正';}
 }else if(s.phase==='settle'&&s.kind==='vault_spin'){
  if(up.y>.995&&b.angularVelocity.length()<.15&&velocity.length()<.35){s.phase='land';s.phaseTime=0;s.reason='已回正并重新确认落地区域，正在缓降';}
 }else if(s.phase==='settle'&&up.y>.995&&b.angularVelocity.length()<.15){Object.assign(s,{status:'complete',code:'COMPLETE',phase:'',reason:'转圈完成，已回正悬停；T 可缓降',progress:1});return{finished:true};}
 else if(s.phase==='land'){
  vertical=altitude>1.4?-1.3:-.55;
  if(grounded&&up.y>.98&&Math.abs(b.velocity.y)<.8){if(s.phaseTime>.4){Object.assign(s,{status:'complete',code:'COMPLETE',phase:'',reason:s.kind==='vault_spin'?'越障转圈完成，已回正并安全落地':'越障完成，已安全落地',progress:1});return{finished:true,landed:true};}}
  else s.phaseTime=0;
 }
 return{controlled:true,vertical,acceleration,roll:rolling?1:0,level:!rolling,landing};
}
