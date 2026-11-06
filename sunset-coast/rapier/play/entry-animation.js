import {motorcycleRiderPose} from './motorcycle-rider.js';
/**
 * Deterministic, renderer-independent entry/exit choreography.
 * Positions are plain {x,y,z}; angles are radians. No game state is mutated.
 * The same cabin motion is sampled backwards on exit, so a closed-door seated
 * pose is identical on both sides of every cycle. Avatar scale never shrinks.
 */
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const finite=(v,f=0)=>Number.isFinite(v)?v:f;
const smooth=v=>{const t=clamp(v);return clamp(t*t*t*(t*(t*6-15)+10));};
const lerp=(a,b,t)=>t<=0?a:t>=1?b:a+(b-a)*t;
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const angle=(a,b,t)=>a+wrap(b-a)*t;
const point=(p={},fallback={})=>({x:finite(p.x,finite(fallback.x)),y:finite(p.y,finite(fallback.y)),z:finite(p.z,finite(fallback.z))});
const mix=(a,b,t)=>({x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t),z:lerp(a.z,b.z,t)});
const zero=()=>({x:0,y:0,z:0});
const unit=()=>({x:1,y:1,z:1});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const rotate=(p,yaw)=>({x:p.x*Math.cos(yaw)+p.z*Math.sin(yaw),y:p.y,z:-p.x*Math.sin(yaw)+p.z*Math.cos(yaw)});
const world=(p,plan)=>{const v=rotate(p,plan.vehicleYaw);return{x:v.x+plan.vehiclePosition.x,y:v.y+plan.vehiclePosition.y,z:v.z+plan.vehiclePosition.z};};
const local=(p,origin,yaw)=>rotate({x:p.x-origin.x,y:p.y-origin.y,z:p.z-origin.z},-yaw);
const rotation=(x=0,y=0,z=0)=>({x,y,z});

// A tiny visibility graph routes passenger-side approaches around the vehicle,
// rather than pulling the avatar through the bonnet or across the roof.
function crossesBody(a,b,w,l){
 let lower=0,upper=1;
 for(const [key,bound]of [['x',w],['z',l]]){
  const delta=b[key]-a[key];
  if(Math.abs(delta)<1e-10){if(Math.abs(a[key])>=bound-1e-8)return false;continue;}
  const u=(-bound-a[key])/delta,v=(bound-a[key])/delta;
  lower=Math.max(lower,Math.min(u,v));upper=Math.min(upper,Math.max(u,v));
 }
 return upper-lower>1e-8&&upper>1e-8&&lower<1-1e-8;
}
function approachRoute(start,end,w,l){
 const result=[start],p=point(start);
 // Old saves can start just inside our conservative envelope. First move to
 // its nearest edge. This preserves the actual starting position.
 if(Math.abs(p.x)<w&&Math.abs(p.z)<l){
  if(w-Math.abs(p.x)<l-Math.abs(p.z))p.x=(p.x<=0?-1:1)*(w+.02);
  else p.z=(p.z<=0?-1:1)*(l+.02);
  result.push(point(p));
 }
 const margin=.06,nodes=[p,end,{x:-w-margin,y:0,z:-l-margin},{x:w+margin,y:0,z:-l-margin},{x:w+margin,y:0,z:l+margin},{x:-w-margin,y:0,z:l+margin}];
 const costs=nodes.map(()=>Infinity),previous=nodes.map(()=>-1),visited=new Set();costs[0]=0;
 for(let i=0;i<nodes.length;i++){
  let current=-1;for(let j=0;j<nodes.length;j++)if(!visited.has(j)&&(current<0||costs[j]<costs[current]))current=j;
  if(current<0||!Number.isFinite(costs[current]))break;
  if(current===1)break;visited.add(current);
  for(let next=0;next<nodes.length;next++)if(!visited.has(next)&&!crossesBody(nodes[current],nodes[next],w,l)){
   const cost=costs[current]+distance(nodes[current],nodes[next]);
   if(cost<costs[next]){costs[next]=cost;previous[next]=current;}
  }
 }
 const path=[];for(let i=1;i>0&&i!==-1;i=previous[i])path.unshift(nodes[i]);
 if(previous[1]===-1)path.splice(0,path.length,end);
 result.push(...path);
 return result.filter((p,i)=>i===0||distance(p,result[i-1])>1e-8);
}
function capturePose(p={}){
 return{pitch:finite(p.pitch),scale:point(p.scale,unit()),arms:[0,1].map(i=>point(p.arms?.[i])),legs:[0,1].map(i=>point(p.legs?.[i]))};
}

/**
 * options: entering, vehiclePosition, vehicleYaw, driverPosition, exitPosition,
 * halfWidth, halfLength, height, startPosition, startYaw, kind ('human'/'cat'),
 * startPose ({pitch,scale,arms:[rotation,...],legs:[rotation,...]}),
 * exactExitPosition (a collision-checked vehicle-local endpoint), groundHeight
 * (optional world-space walking root height, including the contact clearance).
 * startPosition/startYaw must be the visible avatar transform when entering.
 */
export function createEntryAnimation(options={}){
 const plan={motorcycle:options.motorcycle===true,entering:options.entering!==false,kind:options.kind==='cat'?'cat':'human',vehiclePosition:point(options.vehiclePosition),vehicleYaw:finite(options.vehicleYaw),halfWidth:clamp(finite(options.halfWidth,1),.6,2),halfLength:clamp(finite(options.halfLength,2.7),1.4,5),height:clamp(finite(options.height,1.5),1,3),startPose:capturePose(options.startPose)};
 plan.seatLocal=point(options.driverPosition,{x:-.42,y:.26,z:.1});
 plan.outsideLocal=point(options.exitPosition,{x:-plan.halfWidth-.95,y:0,z:.1});
 if(!options.exactExitPosition)plan.outsideLocal.x=Math.min(plan.outsideLocal.x,-plan.halfWidth-.95);
 plan.side=plan.outsideLocal.x>0?1:-1;
 plan.footOffset=finite(options.footOffset,plan.kind==='cat'?.045:.085);
 plan.groundHeight=typeof options.groundHeight==='function'?options.groundHeight:null;
 plan.outside=world(plan.outsideLocal,plan);plan.seat=world(plan.seatLocal,plan);
 if(plan.groundHeight){plan.outside.y=finite(plan.groundHeight(plan.outside.x,plan.outside.z,plan.vehicleYaw+plan.side*Math.PI/2),plan.outside.y);plan.outsideLocal.y=plan.outside.y-plan.vehiclePosition.y;}
 plan.startPosition=point(options.startPosition,plan.outside);
 plan.startYaw=finite(options.startYaw,plan.vehicleYaw-Math.PI/2);
 plan.doorYaw=plan.vehicleYaw+plan.side*Math.PI/2;
 const start=local(plan.startPosition,plan.vehiclePosition,plan.vehicleYaw);
 plan.route=approachRoute(start,plan.outsideLocal,plan.halfWidth+.34,plan.halfLength+.32);
 plan.segments=[];let elapsed=0;
 for(let i=1;i<plan.route.length;i++){
  const a=plan.route[i-1],b=plan.route[i],length=distance(a,b),duration=.12+length/2;
  plan.segments.push({a,b,length,start:elapsed,duration,heading:plan.vehicleYaw+Math.atan2(-(b.x-a.x),-(b.z-a.z))});elapsed+=duration;
 }
 // Even an avatar already at the door gets a short continuous turn/settle.
 plan.approachDuration=plan.entering?Math.max(.22,elapsed):0;
 plan.coreDuration=1.72;plan.duration=plan.approachDuration+plan.coreDuration;
 // The original human rig has rigid legs, not knee joints. Keep its full size
 // and lean the torso to fit low roofs; the hip stays on the actual seat.
 plan.seatHip=plan.seatLocal.y+.18;
 plan.seatTilt=.12;
 while(plan.seatTilt<1.12&&plan.seatHip+1.015*Math.cos(plan.seatTilt)+.16*Math.sin(plan.seatTilt)>plan.height-.055)plan.seatTilt+=.01;
 return plan;
}
function standing(plan,position=plan.outside){return{position:point(position),yaw:plan.doorYaw,pitch:0,scale:unit(),arms:[zero(),zero()],legs:[zero(),zero()]};}
function approach(plan,time){
 let pose=standing(plan,plan.startPosition),segment=plan.segments.at(-1),index=plan.segments.length-1;
 for(let i=0;i<plan.segments.length;i++)if(time<=plan.segments[i].start+plan.segments[i].duration){segment=plan.segments[i];index=i;break;}
 let walk=0;
 if(segment){
  const u=clamp((time-segment.start)/segment.duration),p=smooth(u);
  pose.position=world(mix(segment.a,segment.b,p),plan);
  const previous=index?segment.heading:plan.startYaw;
  const next=index===plan.segments.length-1?plan.doorYaw:plan.segments[index+1].heading;
  pose.yaw=u<.5?angle(previous,segment.heading,smooth(u/.5)):angle(segment.heading,next,smooth((u-.5)/.5));
  walk=Math.sin(u*Math.PI)**2*Math.sin(segment.length*p*8)*.44;
  if(time>=plan.approachDuration)pose=standing(plan);
 }else{pose.position=mix(plan.startPosition,plan.outside,smooth(time/plan.approachDuration));pose.yaw=angle(plan.startYaw,plan.doorYaw,smooth(time/plan.approachDuration));}
 if(plan.groundHeight)pose.position.y=finite(plan.groundHeight(pose.position.x,pose.position.z,pose.yaw),pose.position.y);
 const settling=1-smooth(time/Math.min(.22,plan.approachDuration));
 pose.pitch=plan.startPose.pitch*settling;
 pose.scale=mix(unit(),plan.startPose.scale,settling);
 const cat=plan.kind==='cat';
 pose.arms=[rotation(walk),rotation(-walk)];pose.legs=[rotation(-walk),rotation(walk)];
 if(cat){pose.arms[1].x=-walk;pose.legs[0].x=-walk;pose.legs[1].x=walk;}
 for(const group of ['arms','legs'])pose[group]=pose[group].map((r,i)=>mix(r,plan.startPose[group][i],settling));
 // Preserve a jump/walk bob at t=0, then place the feet gently on the ground.
 if(time<.22)pose.position.y=lerp(plan.startPosition.y,pose.position.y,smooth(time/.22));
 return pose;
}
function humanFrame(plan,t){
 const outside=plan.outsideLocal,seat=plan.seatLocal,tilt=plan.seatTilt,side=plan.side;
 // frame: time, hip x/y/z, yaw delta, torso pitch, total leg pitch, reach.
 const frames=[
  [0,outside.x,outside.y+.8,outside.z,side*Math.PI/2,0,0,0],
  [.30,outside.x,outside.y+.8,outside.z,side*Math.PI/2,0,0,.72],
  [.51,outside.x,outside.y+.8,outside.z,side*Math.PI/2,-.32,.12,.92],
  [1.04,side*(plan.halfWidth-.12),plan.seatHip+.025,seat.z+.09,side*.40,-Math.max(.76,tilt),1.55,.64],
  [1.40,seat.x,plan.seatHip,seat.z,0,-tilt,1.55,.62],
  [1.72,seat.x,plan.seatHip,seat.z,0,-tilt,1.55,.62]
 ];
 let i=0;while(i<frames.length-2&&t>frames[i+1][0])i++;
 const a=frames[i],b=frames[i+1],u=smooth((t-a[0])/(b[0]-a[0]));
 const values=a.map((v,j)=>j?lerp(v,b[j],u):t);
 const [,x,hip,z,yaw,pitch,legPitch,reach]=values;
 const floor=lerp(outside.y+plan.footOffset,seat.y+.025,smooth((-side*x+plan.halfWidth+.32)/.54));
 // Analytical bounds of the original foot mesh. Compensate at the hips rather
 // than dragging feet through the road or the raised vehicle floor.
 const footMinimum=Math.min(...[-.715,-.605].flatMap(y=>[-.19,.10].map(z=>y*Math.cos(legPitch)-z*Math.sin(legPitch))));
 const hipY=Math.max(hip,floor-footMinimum);
 const offset=rotate({x:0,y:.8*Math.cos(pitch),z:.8*Math.sin(pitch)},yaw);
 const localRoot={x:x-offset.x,y:hipY-offset.y,z:z-offset.z};
 return{position:world(localRoot,plan),yaw:plan.vehicleYaw+yaw,pitch,scale:unit(),arms:[rotation(reach*.77,0,-.055*reach),rotation(reach,0,.08*reach)],legs:[rotation(legPitch-pitch),rotation(legPitch-pitch)],hipLocal:{x,y:hipY,z},floor:floor+plan.vehiclePosition.y};
}
function catFrame(plan,t){
 const outside=plan.outsideLocal,seat=plan.seatLocal,move=smooth((t-.46)/.9),hop=Math.sin(Math.PI*move)**2;
 const p=mix(outside,{x:seat.x,y:seat.y+.18,z:seat.z},move);p.y+=hop*.12;
 const pitch=-.14*hop,fold=.20*hop;
 return{position:world(p,plan),yaw:angle(plan.doorYaw,plan.vehicleYaw,move),pitch,scale:unit(),arms:[rotation(fold),rotation(-fold*.7)],legs:[rotation(-fold),rotation(fold*.7)],floor:plan.vehiclePosition.y+outside.y+plan.footOffset};
}

// Step over the saddle without car-door or low-roof choreography. Reversible,
// full-size, with the same collision-checked outside endpoint as other vehicles.
function motorcycleFrame(plan,t){
 const riding=motorcycleRiderPose({driverPosition:plan.seatLocal},{cat:plan.kind==='cat'}),u=smooth(t/plan.coreDuration);
 const p=mix(plan.outsideLocal,riding.position,u);p.y+=Math.sin(Math.PI*u)**2*.22;
 const zeroRotation={x:0,y:0,z:0};
 return{position:world(p,plan),yaw:angle(plan.doorYaw,plan.vehicleYaw,u),pitch:riding.pitch*u,scale:unit(),
  arms:riding.arms.map(a=>mix(zeroRotation,a,u)),legs:riding.legs.map(a=>mix(zeroRotation,a,u)),floor:plan.outside.y};
}

/** Sample without changing the animation or any input. Clamps past the end. */
export function sampleEntryAnimation(plan,elapsedSeconds=0){
 const elapsed=clamp(finite(elapsedSeconds),0,plan.duration),progress=elapsed/plan.duration;
 const atApproach=plan.entering&&elapsed<plan.approachDuration;
 const core=clamp(plan.entering?elapsed-plan.approachDuration:plan.coreDuration-elapsed,0,plan.coreDuration);
 const pose=atApproach?approach(plan,elapsed):(plan.motorcycle?motorcycleFrame(plan,core):plan.kind==='cat'?catFrame(plan,core):humanFrame(plan,core));
 const openness=smooth(core/.30)*(1-smooth((core-1.40)/.32));
 const carBlend=smooth(core/plan.coreDuration);
 let phase=atApproach?'approach':core<.30?'door':core<.51?'bend':core<1.04?'step':core<1.40?'sit':'close';
 if(!plan.entering)phase=core>1.40?'door':core>1.04?'rise':core>.51?'step':core>.30?'stand':'close';
 const result={...pose,doorAngle:atApproach||plan.motorcycle?0:-1.16*openness,carBlend,phase,progress,done:elapsed>=plan.duration,outside:point(plan.outside)};
 // The outside endpoint is a neutral standing pose, shared with updatePlayer.
 if(!atApproach&&core<=0){Object.assign(result,standing(plan));result.doorAngle=0;}
 return result;
}

/** Optional camera interpolation for already-computed walking/driving rigs. */
export function blendEntryCamera(walking,driving,carBlend){
 const t=clamp(finite(carBlend));
 return{position:mix(walking.position,driving.position,t),target:mix(walking.target,driving.target,t),fov:lerp(finite(walking.fov,58),finite(driving.fov,58),t)};
}
