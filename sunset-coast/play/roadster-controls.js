// Roadster controls are fictional gameplay balancing, not real vehicle capability.
// Godot alone owns pose, forces and collision/landing damage.
import {sanitizeRoadsterJets,updateRoadsterJets,clearRoadsterJets} from './roadster-jets.js';
import {updateRoadsterAero} from './roadster-aero.js';
const finite=(value,fallback=0)=>Number.isFinite(value)?value:fallback;
const clamp=(value,lo,hi)=>Math.max(lo,Math.min(hi,finite(value,0)));
const TRIMS={roadster:'performance',roadster_thrust:'thrust',roadster_rocket:'rocket'};
export const ROADSTER_WING_MODES=Object.freeze(['auto','raised','stowed']);
export function roadsterTrim(v){return TRIMS[v?.model?.id]??null;}
export function roadsterFlightLocked(v){return roadsterTrim(v)==='rocket'&&(v.roadsterRequest?.pending===true||v.roadsterState?.maneuver?.status==='active'||v.roadsterRequest?.air===true||['air','landing','recover','unpowered'].includes(v.roadsterState?.mode)||v.grounded===false&&(finite(v.roadsterState?.altitude)>.3||Math.abs(finite(v.roadsterState?.verticalSpeed))>.8));}
export function roadsterRequest(v){return v.roadsterRequest??={air:false,wingMode:'auto'};}
export function resetRoadsterControls(v){if(!roadsterTrim(v))return;Object.assign(roadsterRequest(v),{air:false,pending:false,inputLatch:null,action:'',actionSerial:(roadsterRequest(v).actionSerial??0)+1});v.roadsterState={...v.roadsterState,mode:'road',boost:0,lift:0,jets:sanitizeRoadsterJets(null),autoStabilizing:false,automaticAirborne:false,landingCushion:0,rollRate:0,maneuver:{status:'idle'}};clearRoadsterJets(v);}
// Legacy save compatibility only; this field never limits propulsion.
export function refillRoadster(v){if(!roadsterTrim(v))return;v.roadsterRefillSerial=(v.roadsterRefillSerial??0)+1;v.roadsterCharge=100;}
export function roadsterSpawnConfig(v){const trim=roadsterTrim(v);return trim?{roadsterTrim:trim,roadsterCharge:clamp(v.roadsterCharge??100,0,100),roadsterRefillSerial:v.roadsterRefillSerial??0}:{};}
export function clampRoadsterControls(v,input={}){
 const trim=roadsterTrim(v);if(!trim)return{};
 return{roadsterAction:trim==='rocket'&&['vault','vault_spin','spin','cancel'].includes(input.roadsterAction)?input.roadsterAction:'',roadsterActionSerial:Math.floor(clamp(input.roadsterActionSerial??0,0,1e9)),roadsterCancelLanding:input.roadsterCancelLanding===true,roadsterManualOverride:input.roadsterManualOverride===true,roadsterAir:trim==='rocket'&&input.roadsterAir===true,roadsterBoost:trim!=='performance'&&input.roadsterBoost===true,
  roadsterRecover:trim==='rocket'&&input.roadsterRecover===true,roadsterStabilize:input.roadsterStabilize!==false,
  roadsterPitch:clamp(input.roadsterPitch??0,-1,1),roadsterRoll:clamp(input.roadsterRoll??0,-1,1),
  roadsterYaw:clamp(input.roadsterYaw??0,-1,1),roadsterVertical:clamp(input.roadsterVertical??0,-1,1),
  roadsterForward:clamp(input.roadsterForward??0,-1,1),roadsterLateral:clamp(input.roadsterLateral??0,-1,1),
  roadsterAirBrake:input.roadsterAirBrake===true,roadsterWingMode:ROADSTER_WING_MODES.includes(input.roadsterWingMode)?input.roadsterWingMode:'auto',
  roadsterRefillSerial:Math.max(0,Math.floor(finite(v.roadsterRefillSerial)))};
}
export function requestRoadsterManeuver(game,action){
 const v=game.vehicle;if(roadsterTrim(v)!=='rocket')return{ok:false,reason:'智能空中特技仅限 Rocket（游戏设定）'};
 if(!['vault','vault_spin','spin','cancel'].includes(action))return{ok:false,reason:'未知动作'};
 if(v.parkingBrakeEngaged&&action!=='cancel')return{ok:false,reason:'P 驻车中，请先挂 N / R / D 再执行特技'};
 if(!game.inCar||game.transition||game.paused||game.aircraft?.active||game.flight?.active||game.autonomyTest?.active||game.ui?.isPhoneOpen?.()||globalThis.document?.body?.classList.contains('mobile-drawer-open'))return{ok:false,reason:'请先结束当前操作并进入 Rocket'};
 if(!game.physics?.ready||game.physics.failed)return{ok:false,reason:'智能特技需要 Godot 物理引擎'};
 const request=roadsterRequest(v);
 if(action!=='cancel'&&(v.condition<=0||v.battery<=0))return{ok:false,reason:'动力损坏或车辆电量耗尽'};
 if(action!=='cancel'&&(request.pending||v.roadsterState?.maneuver?.status==='active'))return{ok:false,reason:'动作正在执行；可取消或直接手动接管'};
 if(action!=='cancel')request.inputLatch={keys:{...game.keys},touch:{...game.touch},air:{...game.roadsterTouch}};
 request.action=action;request.actionSerial=(request.actionSerial??0)+1;request.cancelLanding=false;request.pending=action!=='cancel';
 game.manualTakeover?.();game.autopilot=false;game.pilot?.reset();
 return{ok:true,reason:action==='cancel'?'已请求取消，正在交还控制':action==='vault_spin'?'正在检查越障航线、整车转圈空间和落地区域':action==='vault'?'正在评估刹停空间，随后检查前方障碍和落地':'正在评估刹停与转圈空间'};
}
export function toggleRoadsterAir(game){
 const v=game.vehicle;if(roadsterTrim(v)!=='rocket')return{ok:false,reason:'空中模式仅限 Rocket 配置（游戏设定）'};
 if(v.parkingBrakeEngaged)return{ok:false,reason:'P 驻车中，请先挂 N / R / D 再起飞'};
 if(!game.inCar||game.transition||game.paused||game.aircraft?.active||game.flight?.active||game.autonomyTest?.active)return{ok:false,reason:'请先结束当前操作并进入 Rocket'};
 if(!game.physics?.ready||game.physics.failed)return{ok:false,reason:'空中模式需要 Godot 物理引擎，空中功能不可用'};
 const request=roadsterRequest(v);
 if(request.pending||v.roadsterState?.maneuver?.status==='active'){const result=requestRoadsterManeuver(game,'cancel');request.cancelLanding=true;request.air=false;return result;}
 if(request.air){request.air=false;return{ok:true,reason:'正在缓降；落地后恢复地面模式'};}
 if(v.condition<=0||v.battery<=0)return{ok:false,reason:'动力不足，请先维修并充电'};
 if(Math.abs(v.speed)>25)return{ok:false,reason:'请减速至 90 km/h 以下再起飞'};
 if(['landing','recover','unpowered'].includes(v.roadsterState?.mode))return{ok:false,reason:'请先完成落地或车身回正'};
 request.air=true;game.manualTakeover?.();game.autopilot=false;game.pilot?.reset();
 return{ok:true,reason:'Rocket 空中模式 · 松开升降键悬停，T 缓降（游戏设定）'};
}
export function cycleRoadsterWing(v){if(!roadsterTrim(v))return null;const request=roadsterRequest(v);request.wingMode=ROADSTER_WING_MODES[(ROADSTER_WING_MODES.indexOf(request.wingMode)+1)%3];return request.wingMode;}
export function roadsterPlayerInput(game,input={}){
 const v=game.vehicle,trim=roadsterTrim(v);if(!trim)return input;
 const request=roadsterRequest(v),blocked=game.paused||game.transition||game.ui?.isPhoneOpen?.()||globalThis.document?.body?.classList.contains('mobile-drawer-open');
 const rawKeys=blocked?{}:game.keys??{},rawTouch=blocked?{}:game.touch??{},rawAir=blocked?{}:game.roadsterTouch??{};
 // The action button explicitly takes over controls that were already held.
 // Each source re-arms on release; any fresh key/pedal still cancels immediately.
 const filter=(raw,latch)=>Object.fromEntries(Object.entries(raw).map(([key,value])=>{if(latch?.[key]&&!value)delete latch[key];return[key,latch?.[key]?false:value];}));
 const latch=request.inputLatch,k=filter(rawKeys,latch?.keys),t=filter(rawAir,latch?.air),touch=filter(rawTouch,latch?.touch);
 for(const [raw,held]of [[rawKeys,latch?.keys],[rawTouch,latch?.touch],[rawAir,latch?.air]])if(held)for(const key of Object.keys(held))if(!raw[key])delete held[key];
 const mask=(field,keys,touches)=>{const held=keys.some(key=>rawKeys[key]&&latch?.keys?.[key])||touches.some(key=>rawTouch[key]&&latch?.touch?.[key]);const fresh=keys.some(key=>k[key])||touches.some(key=>touch[key]);if(held&&!fresh)input={...input,[field]:field==='handbrake'?false:0};};
 mask('throttle',['KeyW','KeyS','ArrowUp','ArrowDown'],['go','reverse']);mask('steer',['KeyA','KeyD','ArrowLeft','ArrowRight'],['left','right']);mask('brake',['KeyB'],['brake','gentle']);mask('handbrake',['Space'],['handbrake']);
 if(!game.physics?.ready||game.physics.failed){request.air=false;if(!game.physics)resetRoadsterControls(v);return{...input,...clampRoadsterControls(v,{roadsterWingMode:request.wingMode})};}
 const active=roadsterFlightLocked(v),pressed=(name,...codes)=>t[name]===true||codes.some(code=>k[code]===true),axis=(positive,negative)=>Number(positive)-Number(negative);
 const controls={roadsterAction:request.action,roadsterActionSerial:request.actionSerial,roadsterCancelLanding:request.cancelLanding,roadsterManualOverride:!blocked&&(Math.abs(input.throttle??0)>.02||Math.abs(input.steer??0)>.02||input.brake===true||Number(input.brake)>.02||input.handbrake===true),roadsterAir:request.air,roadsterWingMode:request.wingMode,roadsterBoost:pressed('boost','ShiftLeft','ShiftRight')&&!active,
  roadsterRecover:pressed('stabilize','KeyX'),roadsterStabilize:true,
  roadsterPitch:axis(pressed('pitchUp','ArrowDown'),pressed('pitchDown','ArrowUp')),
  roadsterRoll:axis(pressed('rollRight','ArrowRight'),pressed('rollLeft','ArrowLeft')),
  roadsterYaw:axis(pressed('yawLeft','KeyA'),pressed('yawRight','KeyD')),
  roadsterVertical:axis(pressed('up','ShiftLeft','ShiftRight'),pressed('down','KeyB')),
  roadsterForward:axis(pressed('forward','KeyW'),pressed('back','KeyS')),
  roadsterLateral:axis(pressed('right','KeyE'),pressed('left','KeyQ')),roadsterAirBrake:pressed('airBrake','Space')};
 if(controls.roadsterRecover){controls.roadsterPitch=0;controls.roadsterRoll=0;controls.roadsterYaw=0;controls.roadsterForward=0;controls.roadsterLateral=0;}
 return{...input,...(active?{throttle:0,steer:0,brake:0,handbrake:false,electronicBrake:0}:{}),...clampRoadsterControls(v,controls)};
}
export function applyRoadsterSnapshot(v,state){
 if(!roadsterTrim(v)||!state?.roadster)return;
 const previousMode=v.roadsterState?.mode,previousManeuver=v.roadsterState?.maneuver;const s=state.roadster,m=s.maneuver??{},maneuver={kind:['vault','vault_spin','spin'].includes(m.kind)?m.kind:'',phase:typeof m.phase==='string'?m.phase:'',status:['idle','active','complete','cancelled','rejected'].includes(m.status)?m.status:'idle',reason:typeof m.reason==='string'?m.reason:'',code:typeof m.code==='string'?m.code:'',progress:clamp(m.progress,0,1),serial:Math.floor(clamp(m.serial,0,1e9)),angle:clamp(m.angle,-100,100)};v.roadsterState={mode:['road','air','landing','recover','unpowered'].includes(s.mode)?s.mode:'road',charge:clamp(s.charge,0,100),heat:clamp(s.heat,0,1),boost:clamp(s.boost,0,1),lift:clamp(s.lift,0,1),wing:clamp(s.wing,0,1),wingPitch:clamp(s.wingPitch,0,.65),altitude:clamp(s.altitude,0,10000),verticalSpeed:clamp(s.verticalSpeed,-300,300),grounded:!!state.grounded,warning:typeof s.warning==='string'?s.warning:'',jets:sanitizeRoadsterJets(s.jets),autoStabilizing:s.autoStabilizing===true,automaticAirborne:s.automaticAirborne===true,landingCushion:clamp(s.landingCushion,0,1),rollRate:clamp(s.rollRate,-100,100),maneuver};
 v.roadsterCharge=v.roadsterState.charge;
 const request=roadsterRequest(v);if(maneuver.serial>=(request.actionSerial??0)){request.pending=false;if((previousManeuver?.status!==maneuver.status||previousManeuver?.serial!==maneuver.serial||previousMode!==s.mode)&&(['active','complete','cancelled'].includes(maneuver.status)&&s.mode==='air'))request.air=true;}
 if(s.mode==='road'&&maneuver.status==='complete'&&(previousManeuver?.status!==maneuver.status||previousManeuver?.serial!==maneuver.serial))request.air=false;
 if(['unpowered','landing'].includes(s.mode)||s.warning==='起飞条件未满足')roadsterRequest(v).air=false;
}
/** Render-only rig updates, including late-loaded Blender nodes. Never edit root pose. */
export function updateRoadsterVisuals(v,dt=1/60){
 if(!roadsterTrim(v))return;
 const aeroApplied=updateRoadsterAero(v,dt);
 const s=v.roadsterState??{},request=roadsterRequest(v),auto=Math.abs(finite(v.speed))>20||finite(v.brakeAmount)>.15;
 const target=finite(s.wing,request.wingMode==='raised'?1:request.wingMode==='stowed'?0:auto?1:0),alpha=1-Math.exp(-7*clamp(dt,0,.1));
 if(!aeroApplied)v.roadsterWingVisual=finite(v.roadsterWingVisual)+(target-finite(v.roadsterWingVisual))*alpha;
 const rig=v.roadsterRig;if(!rig)return;const wing=v.roadsterWingVisual;
 for(const node of [rig.wingLift,rig.wingPitch,rig.frontAero,...(rig.wingSupports??[])])if(node){node.userData??={};node.userData.roadsterRest??={y:node.position.y,z:node.position.z,xRotation:node.rotation.x,scaleY:node.scale.y};}
 if(!aeroApplied&&rig.wingLift)rig.wingLift.position.y=rig.wingLift.userData.roadsterRest.y+wing*.40;
 // Rear is +Z; negative local X raises the trailing edge.
 if(!aeroApplied&&rig.wingPitch)rig.wingPitch.rotation.x=rig.wingPitch.userData.roadsterRest.xRotation-clamp(s.wingPitch??wing*.35,0,.65);
 if(!aeroApplied&&rig.frontAero)rig.frontAero.position.z=rig.frontAero.userData.roadsterRest.z-wing*.07;
 if(!aeroApplied)for(const node of rig.wingSupports??[]){const rest=node.userData.roadsterRest,height=Math.max(.04,(rig.wingLift?.userData.roadsterRest.y??rest.y+.08)-rest.y);node.scale.y=rest.scaleY*(1+wing*.40/height);}
 for(const [nodes,value]of [[rig.rearThrusters,s.boost??0],[rig.attitudeThrusters,s.lift??0]])for(const node of Array.isArray(nodes)?nodes:nodes?[nodes]:[]){node.userData.thrust=clamp(value,0,1);node.traverse?.(mesh=>{if(mesh.userData?.thrusterGlow&&mesh.material){mesh.visible=value>.001;mesh.material.opacity=clamp(value,0,1);}});}
 updateRoadsterJets(v,dt);
}
