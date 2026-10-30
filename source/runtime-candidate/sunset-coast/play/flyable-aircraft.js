import * as THREE from './vendor/three.module.js';
import {AIRPORTS,airportAt,groundHeight,inWorld} from './regions.js';
import {captureVehiclePose,resetVehiclePose} from './render-motion.js';
import {impactDamage} from './impact-damage.js';

// This module has no flight integrator. All position, orientation, velocity,
// ground contact and stall telemetry come from the Godot rigid body.
const finite=(value,fallback=0)=>Number.isFinite(value)?value:fallback;
const clamp=(value,low,high)=>Math.max(low,Math.min(high,finite(value,low)));
const vector=value=>Array.isArray(value)&&value.length===3&&value.every(Number.isFinite);
const quaternion=value=>Array.isArray(value)&&value.length===4&&value.every(Number.isFinite)&&Math.hypot(...value)>1e-8;
const point=value=>({x:value.x,y:value.y,z:value.z});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const airportFor=value=>AIRPORTS.find(a=>a.id===(typeof value==='string'?value:value?.id));
const UP=new THREE.Vector3(0,1,0),DATUM=new THREE.Vector3(0,1.16,0);
const STOP_SPEED=.65,STOP_ROTATION=.35;
const DAMAGE_REGIONS=['nose','tail','leftWing','rightWing'];
const damageRegions=(value,condition=100)=>Object.fromEntries(DAMAGE_REGIONS.map(region=>[region,clamp(finite(value?.[region],!value&&region==='nose'?(100-condition)/100:0),0,1)]));

export const TRAINER=Object.freeze({
 id:'nc11',name:'潮翼 SC-11',brand:'SUNRISE AERO',type:'轻型电动教练机',
 mass:1300,size:Object.freeze([2.2,1.3,8]),wingSpan:11,wingArea:18,thrust:5.6,rideHeight:1.16
});

/** UI owns listeners and pointer capture. These controls are aircraft-only. */
export const AIRCRAFT_CONTROLS=Object.freeze([
 {id:'pitchUp',label:'抬头',keys:['KeyS','ArrowDown'],hint:'S / ↓',axis:'pitch',value:1},
 {id:'pitchDown',label:'低头',keys:['KeyW','ArrowUp'],hint:'W / ↑',axis:'pitch',value:-1},
 {id:'rollLeft',label:'左滚',keys:['KeyA','ArrowLeft'],hint:'A / ←',axis:'roll',value:-1},
 {id:'rollRight',label:'右滚',keys:['KeyD','ArrowRight'],hint:'D / →',axis:'roll',value:1},
 {id:'yawLeft',label:'左舵',keys:['KeyQ'],hint:'Q',axis:'yaw',value:1},
 {id:'yawRight',label:'右舵',keys:['KeyE'],hint:'E',axis:'yaw',value:-1},
 {id:'throttleUp',label:'油门 +',keys:['ShiftLeft','ShiftRight'],hint:'Shift',axis:'throttle',value:1},
 {id:'throttleDown',label:'油门 −',keys:['ControlLeft','ControlRight'],hint:'Ctrl',axis:'throttle',value:-1},
 {id:'brake',label:'轮刹',keys:['Space'],hint:'Space',axis:'brake',value:1},
 {id:'flapsDown',label:'放襟翼',keys:['BracketRight'],hint:']',axis:'flaps',value:1},
 {id:'flapsUp',label:'收襟翼',keys:['BracketLeft'],hint:'[',axis:'flaps',value:-1}
].map(control=>Object.freeze({...control,keys:Object.freeze(control.keys)})));

export function clampAircraftControls(input={}){
 return{throttle:clamp(input.throttle,0,1),pitch:clamp(finite(input.pitch),-1,1),roll:clamp(finite(input.roll),-1,1),yaw:clamp(finite(input.yaw),-1,1),brake:clamp(input.brake,0,1),flaps:clamp(input.flaps,0,1)};
}

/** Absolute controls; releasing a surface centres it. Throttle/flaps latch. */
export function aircraftInput(keys={},touch={},previous={},dt=1/60){
 const amount={pitch:0,roll:0,yaw:0,throttle:0,brake:0,flaps:0};
 for(const c of AIRCRAFT_CONTROLS)if(touch[c.id]===true||c.keys.some(key=>keys[key]===true))amount[c.axis]+=c.value;
 const time=clamp(dt,0,.1),before=clampAircraftControls(previous);
 return clampAircraftControls({...amount,throttle:before.throttle+amount.throttle*time*.42,flaps:before.flaps+amount.flaps*time*.65});
}

/** Clear runway centreline, 115 m in from the south threshold, facing -Z. */
export function airportRunwayPose(airportOrId){
 const airport=airportFor(airportOrId);if(!airport)return null;
 const runway=airport.runway,x=runway.x,z=runway.z+runway.length/2-115,y=groundHeight(x,z);
 return{airportId:airport.id,position:{x,y,z},pos:[x,y+TRAINER.rideHeight,z],quat:[0,0,0,1],linear:[0,0,0],angular:[0,0,0],yaw:0};
}

/** Original low-wing, two-seat electric trainer, with no external assets. */
export function createLightTrainer(){
 const root=new THREE.Group();root.name='SUNSET AERO SC-11 original flyable trainer';
 root.userData.originalProceduralAsset=true;root.userData.aircraftType='electric light trainer';root.userData.physicsKind='aircraft';
 const paint=new THREE.MeshStandardMaterial({color:0xe2e9db,roughness:.53,metalness:.18});
 const teal=new THREE.MeshStandardMaterial({color:0x187d86,roughness:.48,metalness:.22});
 const orange=new THREE.MeshStandardMaterial({color:0xe6a054,roughness:.58});
 const dark=new THREE.MeshStandardMaterial({color:0x1e3038,roughness:.82});
 const metal=new THREE.MeshStandardMaterial({color:0x809397,roughness:.35,metalness:.72});
 const glass=new THREE.MeshStandardMaterial({color:0x7fcbd4,roughness:.18,metalness:.2,transparent:true,opacity:.24,depthWrite:false,side:THREE.DoubleSide});
 const red=new THREE.MeshBasicMaterial({color:0xf56d58}),green=new THREE.MeshBasicMaterial({color:0x76e5ab});
 const add=(name,geometry,material,position=[0,0,0],parent=root)=>{const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.position.set(...position);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.semantic=5;parent.add(mesh);return mesh;};
 const box=(name,size,material,position,parent=root)=>add(name,new THREE.BoxGeometry(...size),material,position,parent);
 const cylinder=(name,radius,length,material,position,axis='z',parent=root)=>{const mesh=add(name,new THREE.CylinderGeometry(radius,radius,length,12),material,position,parent);mesh.rotation[axis==='x'?'z':'x']=Math.PI/2;return mesh;};
 const pivot=(name,position)=>{const group=new THREE.Group();group.name=name;group.position.set(...position);root.add(group);return group;};
 // Lathe Y becomes longitudinal Z: negative profile coordinates are the nose.
 const profile=[[-3.85,.14],[-3.58,.46],[-2.45,.64],[-.9,.76],[.75,.72],[2.1,.48],[3.6,.13],[3.96,.03]].map(([z,r])=>new THREE.Vector2(r,z));
 const fuselage=add('fuselage',new THREE.LatheGeometry(profile,16),paint,[0,1.16,0]);fuselage.rotation.x=Math.PI/2;fuselage.scale.set(1,.99,.85);
 for(const side of [-1,1]){
  const stripe=box(side<0?'port livery':'starboard livery',[.035,.16,4.9],teal,[side*.694,1.21,-.52]);stripe.rotation.y=side*.018;
  // Actual collision wing centre is datum + 1.26 m with 1.8 m chord.
  box(side<0?'left wing':'right wing',[4.75,.16,1.8],paint,[side*3.125,1.26,0]);
  box('painted wing tip',[.38,.18,1.78],teal,[side*5.31,1.27,0]);
  add('navigation light',new THREE.SphereGeometry(.055,6,4),side<0?red:green,[side*5.51,1.28,-.42]);
  box('wing walk',[.48,.016,1.4],dark,[side*1.02,1.348,.06]);
 }
 const aileronLeft=pivot('left aileron hinge',[-3.95,1.27,.69]),aileronRight=pivot('right aileron hinge',[3.95,1.27,.69]);
 for(const hinge of [aileronLeft,aileronRight])box('aileron',[2.42,.1,.38],teal,[0,0,.18],hinge);
 const flapLeft=pivot('left flap hinge',[-1.88,1.26,.69]),flapRight=pivot('right flap hinge',[1.88,1.26,.69]);
 for(const hinge of [flapLeft,flapRight])box('flap',[1.45,.1,.38],paint,[0,0,.18],hinge);
 box('tailplane',[3.6,.12,.85],paint,[0,1.56,3.13]);
 const elevator=pivot('elevator hinge',[0,1.56,3.52]);box('elevator',[3.6,.09,.34],teal,[0,0,.15],elevator);
 const finShape=new THREE.Shape();finShape.moveTo(0,0);finShape.lineTo(1.1,0);finShape.lineTo(.68,1.52);finShape.lineTo(.15,1.56);finShape.closePath();
 const fin=add('vertical tail',new THREE.ExtrudeGeometry(finShape,{depth:.14,bevelEnabled:false}),teal,[-.07,1.45,2.62]);fin.rotation.y=-Math.PI/2;
 const rudder=pivot('rudder hinge',[0,2.08,3.72]);box('rudder',[.12,1.15,.33],orange,[0,0,.14],rudder);
 const canopy=add('transparent canopy',new THREE.SphereGeometry(.9,16,8,0,Math.PI*2,0,Math.PI/2),glass,[0,1.58,-.6]);canopy.scale.set(.8,.83,1.56);canopy.castShadow=false;
 box('canopy rim',[1.46,.055,2.68],teal,[0,1.6,-.58]);
 // Two visible seats, instrument binnacle and twin control sticks ground the
 // cockpit view in real geometry rather than a detached camera in empty air.
 for(const side of [-1,1]){box('seat cushion',[.47,.13,.66],dark,[side*.34,1.4,-.4]);const back=box('seat back',[.48,.57,.14],dark,[side*.34,1.68,-.01]);back.rotation.x=-.13;cylinder('control stick',.025,.35,metal,[side*.34,1.52,-.95]);}
 box('instrument panel',[1.19,.33,.17],dark,[0,1.66,-1.57]);
 for(const x of [-.37,0,.37]){cylinder('instrument bezel',.113,.022,metal,[x,1.69,-1.47]);cylinder('instrument face',.092,.027,teal,[x,1.69,-1.45]);box('gauge needle',[.012,.092,.006],orange,[x,1.72,-1.431]);}
 const propeller=pivot('propeller',[0,1.16,-4.05]);
 box('propeller blade',[.17,2.06,.065],dark,[0,0,0],propeller);
 for(const side of [-1,1])box('propeller visibility tip',[.175,.17,.07],orange,[0,side*.91,0],propeller);
 const spinner=add('spinner',new THREE.ConeGeometry(.235,.42,12),teal,[0,1.16,-4.23]);spinner.rotation.x=-Math.PI/2;
 // Gear positions match the three Godot raycast suspension hardpoints.
 for(const [x,z] of [[0,-2.3],[-1.2,1.8],[1.2,1.8]]){
  box('landing gear strut',[.075,.7,.075],metal,[x,.67,z]);cylinder('rubber tyre',.27,.18,dark,[x,.27,z],'x');cylinder('wheel hub',.105,.185,metal,[x,.27,z],'x');
 }
 const anchors={};
 for(const[name,position]of Object.entries({cockpit:[-.32,1.96,-.71],cockpitLook:[-.32,1.85,-25],chase:[0,5.8,14],chaseLook:[0,1.35,-7.5],overhead:[0,42,12]}))anchors[name]=pivot(name+' camera anchor',position);
 const damageParts=['fuselage','left wing','right wing','tailplane','vertical tail'].map(name=>{const mesh=root.getObjectByName(name);mesh.updateMatrix();return{mesh,rest:new Float32Array(mesh.geometry.attributes.position.array),toRoot:mesh.matrix.clone(),fromRoot:mesh.matrix.clone().invert()};});
 return{root,propeller,aileronLeft,aileronRight,flapLeft,flapRight,elevator,rudder,canopy,anchors,damageParts,model:TRAINER};
}

/** Small, deterministic shell dents, starting from unmodified owned vertices. */
export function updateAircraftDamage(aircraft){
 if(!aircraft)return;const regions=damageRegions(aircraft.damageRegions,aircraft.condition),healthy=DAMAGE_REGIONS.every(region=>regions[region]===0),p=new THREE.Vector3(),shift=new THREE.Vector3(),v=new THREE.Vector3();
 const fields=[{key:'nose',centre:[0,1.16,-3.35],radius:[1.15,1.1,1.65],shift:[0,-.065,.16]},{key:'tail',centre:[0,1.75,3.35],radius:[2,1.5,1.25],shift:[0,-.09,-.14]},{key:'leftWing',centre:[-4.55,1.26,0],radius:[1.8,.9,1.55],shift:[.12,-.15,0]},{key:'rightWing',centre:[4.55,1.26,0],radius:[1.8,.9,1.55],shift:[-.12,-.15,0]}];
 for(const part of aircraft.damageParts){const attribute=part.mesh.geometry.attributes.position;
  if(healthy)attribute.array.set(part.rest);
  else for(let i=0;i<attribute.count;i++){
   p.fromArray(part.rest,i*3).applyMatrix4(part.toRoot);shift.set(0,0,0);
   for(const field of fields){const d=field.centre,r=field.radius,weight=Math.exp(-(((p.x-d[0])/r[0])**2+((p.y-d[1])/r[1])**2+((p.z-d[2])/r[2])**2))*regions[field.key];shift.addScaledVector(v.fromArray(field.shift),weight);}
   if(shift.lengthSq()>.22*.22)shift.setLength(.22);p.add(shift).applyMatrix4(part.fromRoot);attribute.setXYZ(i,p.x,p.y,p.z);
  }
  attribute.needsUpdate=true;part.mesh.geometry.computeVertexNormals();part.mesh.geometry.computeBoundingBox();part.mesh.geometry.computeBoundingSphere();
 }
}

export function disposeLightTrainer(aircraft){
 if(!aircraft?.root)return;const geometries=new Set(),materials=new Set();
 aircraft.root.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material)for(const material of Array.isArray(object.material)?object.material:[object.material])materials.add(material);});
 aircraft.root.removeFromParent();geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());
}

/** Rendering only. Never alters the root pose or advances physical time. */
export function animateLightTrainer(aircraft,controls,dt){
 if(!aircraft)return;const c=clampAircraftControls(controls),time=clamp(dt,0,.1);
 const power=aircraft.condition>0&&aircraft.battery>0?c.throttle:0;
 aircraft.propeller.rotation.z=(aircraft.propeller.rotation.z+time*(power*155+Math.max(0,finite(aircraft.airspeed))*.15))%(Math.PI*2);
 aircraft.aileronLeft.rotation.x=c.roll*.3;aircraft.aileronRight.rotation.x=-c.roll*.3;
 aircraft.elevator.rotation.x=-c.pitch*.35;aircraft.rudder.rotation.y=-c.yaw*.35;
 aircraft.flapLeft.rotation.x=aircraft.flapRight.rotation.x=c.flaps*.6;
}

const PHASE_LABELS=Object.freeze({idle:'机场教练机',spawning:'正在准备飞机',parked:'已停机',piloting:'手动驾驶'});

/**
 * Independent aircraft ownership. `game.vehicle` ALWAYS remains the same car.
 * queueCommand(command), sendControls(control) and isReady() are bridge hooks;
 * alternatively read drainCommands() and physicsControls each physics tick.
 * applySnapshot(body) accepts authoritative Godot snapshots, not a JS solver.
 */
export class FlyableAircraftService{
 constructor(game,options={}){
  this.game=game;this.options=options;this.aircraft=null;this.phase='idle';this.pendingBoard=false;this.personalVehicle=null;this.entryContext=null;this.controls=clampAircraftControls({brake:1});this._commands=[];this.savedState=null;this.notice='';this._disposed=false;this.elapsed=0;this.contacts=new Map();
 }
 get active(){return this.phase==='piloting';}
 get plane(){return this.aircraft?.root??null;}
 get physicsId(){return this.aircraft?.physicsId??null;}
 get physicsControls(){return this.aircraft?{id:this.aircraft.physicsId,...this.controls,condition:this.aircraft.condition,battery:this.aircraft.battery}:null;}
 get status(){const a=this.aircraft;return{phase:this.phase,label:PHASE_LABELS[this.phase],detail:this.notice,active:this.active,pendingBoard:this.pendingBoard,airportId:a?.airportId??this.savedState?.airportId??null,name:TRAINER.name,grounded:!!a?.grounded,speed:Math.max(0,finite(a?.airspeed)),altitude:a?Math.max(0,a.pos.y-this.heightAt(a.pos.x,a.pos.z)):0,condition:a?.condition??this.savedState?.condition??100,battery:a?.battery??this.savedState?.battery??100,stalled:!!a?.stalled,throttle:this.controls.throttle,flaps:this.controls.flaps,canBoard:!!a&&!this.active&&this.canUseOnGround()&&!this.pendingBoard,canExit:this.active&&this.canUseOnGround(),canRepair:!!a&&this.canUseOnGround()};}
 result(ok,reason=''){this.notice=reason;return{ok,reason,phase:this.phase};}
 change(phase,notice=''){this.phase=phase;this.notice=notice;this.options.onChange?.(this.status);}
 queue(command){if(this.options.queueCommand)this.options.queueCommand(command);else this._commands.push(command);}
 drainCommands(){return this._commands.splice(0);}
 sendControls(){if(this.physicsControls)this.options.sendControls?.(this.physicsControls);}
 heightAt(x,z){return finite(this.options.heightAt?.(x,z)??this.game.groundContact?.heightAt?.(x,z)??this.game.world?.groundHeight?.(x,z),groundHeight(x,z));}
 stoppedCar(){const car=this.game.vehicle,linear=car?.linear??car?.physicsState?.linear;const speed=Array.isArray(linear)?Math.hypot(...linear):linear?.length?.()??Math.abs(finite(car?.speed));return Number.isFinite(speed)&&speed<=STOP_SPEED;}
 canUseOnGround(){const a=this.aircraft;return!!a?.hasSnapshot&&!this.awaitResetPose&&a.grounded&&a.linear.length()<=STOP_SPEED&&a.angular.length()<=STOP_ROTATION&&UP.clone().applyQuaternion(a.physicsQuaternion).y>.78;}
 spawnClear(pose){
  if(this.options.isSpawnClear?.(pose,TRAINER)===false)return false;
  const p=pose.position;
  for(const b of this.game.world?.colliders??[]){const yaw=finite(b.yaw),w=Math.abs(Math.cos(yaw))*b.w+Math.abs(Math.sin(yaw))*b.d,d=Math.abs(Math.sin(yaw))*b.w+Math.abs(Math.cos(yaw))*b.d;if(Math.abs(p.x-b.x)<w+TRAINER.wingSpan/2+.5&&Math.abs(p.z-b.z)<d+4.5)return false;}
  for(const v of [this.game.vehicle,this.game.personalVehicle,...(this.game.traffic??[]),...(this.game.police??[])])if(v?.pos&&!v.populationDormant&&Math.abs(p.x-v.pos.x)<TRAINER.wingSpan/2+3&&Math.abs(p.z-v.pos.z)<7.5)return false;
  return true;
 }
 blocked(){const g=this.game;if(g.flight?.active)return'请先完成机场航班';if(g.robotaxi?.active||g.transition)return'请先完成当前乘车操作';if(g.autonomyTest?.active)return'请先结束自动驾驶测试';if(g.inCar&&!this.stoppedCar())return'请先停车，再登机';if(this.options.isReady?.()===false)return'物理引擎尚未就绪';return'';}
 start(airportId){
  if(this.active||this.pendingBoard)return this.result(false,'正在驾驶或登机');
  const blocked=this.blocked();if(blocked)return this.result(false,blocked);
  const airport=airportFor(airportId),position=this.game.position??(this.game.inCar?this.game.vehicle?.pos:this.game.playerPos);
  if(!airport||airportAt(position)?.id!==airport.id)return this.result(false,'请先到机场航站楼入口');
  if(this.aircraft)return this.board({fromTerminal:true});
  const spawned=this.spawn(airport.id);if(!spawned.ok)return spawned;this.pendingBoard=true;return this.result(true,'等待飞机在跑道停稳后登机');
 }
 spawn(airportId,{forLoad=false}={}){
  if(this.aircraft)return this.result(false,'已有一架教练机');
  const blocked=this.blocked();if(!forLoad&&blocked)return this.result(false,blocked);
  const airport=airportFor(airportId),pose=airportRunwayPose(airport);if(!pose)return this.result(false,'机场不存在');
  const position=this.game.position??(this.game.inCar?this.game.vehicle?.pos:this.game.playerPos);
  if(!forLoad&&airportAt(position)?.id!==airport.id)return this.result(false,'请先到机场航站楼入口');
  if(!this.spawnClear(pose))return this.result(false,'跑道被占用，请稍后再试');
  const model=createLightTrainer();this.aircraft={...model,kind:'aircraft',physicsId:'plane:trainer',instanceId:'plane:trainer',airportId:airport.id,pos:model.root.position,yaw:0,physicsQuaternion:new THREE.Quaternion(),linear:new THREE.Vector3(),angular:new THREE.Vector3(),speed:0,airspeed:0,grounded:false,hasSnapshot:false,condition:clamp(finite(this.savedState?.condition,100),0,100),battery:clamp(finite(this.savedState?.battery,100),0,100),halfWidth:TRAINER.wingSpan/2,halfLength:4,rideHeight:TRAINER.rideHeight};
  this.aircraft.damageRegions=damageRegions(this.savedState?.damageRegions,this.aircraft.condition);updateAircraftDamage(this.aircraft);this.contacts.clear();
  this.aircraft.pos.set(pose.position.x,pose.position.y,pose.position.z);this.game.scene?.add(this.aircraft.root);this.controls=clampAircraftControls({brake:1});this.awaitResetPose=new THREE.Vector3(...pose.pos);
  this.options.prepareRunway?.(pose,this.aircraft);
  this.queue({type:'spawn',id:this.aircraft.physicsId,kind:'aircraft',pos:[...pose.pos],quat:[...pose.quat],linear:[0,0,0],angular:[0,0,0],mass:TRAINER.mass,size:[...TRAINER.size],wingSpan:TRAINER.wingSpan,wingArea:TRAINER.wingArea,thrust:TRAINER.thrust});
  this.change('spawning');this.sendControls();return this.result(true);
 }
 atHomeRunway(){const a=this.aircraft,airport=airportFor(a?.airportId);if(!a||!airport)return false;return Math.abs(a.pos.x-airport.runway.x)<airport.runway.width/2-TRAINER.wingSpan/2&&Math.abs(a.pos.z-airport.runway.z)<airport.runway.length/2-8;}
 board({fromTerminal=false}={}){
  if(this.active)return this.result(false,'已经在驾驶舱内');const blocked=this.blocked();if(blocked)return this.result(false,blocked);
  if(!this.aircraft||!this.canUseOnGround())return this.result(false,'飞机须着地并停稳后才能登机');
  const g=this.game,a=this.aircraft,p=g.position??(g.inCar?g.vehicle?.pos:g.playerPos),terminal=fromTerminal&&airportAt(p)?.id===a.airportId&&this.atHomeRunway();
  if(!terminal&&distance(p,a.pos)>12)return this.result(false,'请先靠近教练机');
  this.entryContext={vehicle:g.vehicle,inCar:!!g.inCar,playerPosition:g.playerPos?.clone?.()??new THREE.Vector3(),playerYaw:finite(g.playerYaw),personVisible:g.person?.root?.visible};
  this.personalVehicle=g.personalVehicle??g.vehicle;this.pendingBoard=false;g.resetControls?.();g.autopilot=false;g.pilot?.reset?.();g.sensor?.reset?.();g.assistTelemetry=null;g.inCar=false;
  if(g.person?.root)g.person.root.visible=false;g.ui?.closePhone?.();g.ui?.closeModal?.();this.controls=clampAircraftControls({brake:1});this.change('piloting');this.sendControls();this.options.onBoard?.(a,this.entryContext);return this.result(true);
 }
 setControls(input={}){this.controls=clampAircraftControls(this.active?input:{brake:1});this.sendControls();return this.controls;}
 clearControls({cutThrottle=true}={}){this.controls=clampAircraftControls({throttle:cutThrottle?0:this.controls.throttle,flaps:this.controls.flaps,brake:this.aircraft?.grounded?1:0});this.sendControls();}
 applySnapshot(snapshot){
  const a=this.aircraft;if(!a||snapshot?.id!==a.physicsId||!vector(snapshot.pos)||!quaternion(snapshot.quat)||!vector(snapshot.linear)||!vector(snapshot.angular))return false;
  captureVehiclePose(a);const q=new THREE.Quaternion(...snapshot.quat).normalize(),offset=DATUM.clone().applyQuaternion(q);a.physicsQuaternion.copy(q);a.root.quaternion.copy(q);a.pos.set(...snapshot.pos).sub(offset);a.linear.set(...snapshot.linear);a.angular.set(...snapshot.angular);
  const forward=new THREE.Vector3(0,0,-1).applyQuaternion(q);a.yaw=Math.atan2(-forward.x,-forward.z);a.speed=finite(snapshot.speed,a.linear.dot(forward));a.airspeed=Math.max(0,finite(snapshot.airspeed,a.linear.length()));a.grounded=snapshot.grounded===true;a.stalled=snapshot.stalled===true;a.angleOfAttack=finite(snapshot.angleOfAttack);a.stallFactor=clamp(finite(snapshot.stallFactor,1),.12,1);a.hasSnapshot=true;
  if(this.awaitResetPose&&new THREE.Vector3(...snapshot.pos).distanceTo(this.awaitResetPose)<2){this.awaitResetPose=null;resetVehiclePose(a);}
  if(this.phase==='spawning')this.change('parked');
  if(this.pendingBoard&&this.canUseOnGround()){const result=this.board({fromTerminal:true});if(!result.ok){this.pendingBoard=false;this.notice=result.reason;}}
  return true;
 }
 /** Propeller and control surfaces only. No pose integration or terrain snap. */
 update(dt){if(!this.aircraft)return;const snapshot=this.options.getSnapshot?.(this.aircraft.physicsId);if(snapshot)this.applySnapshot(snapshot);const time=this.game.paused?0:clamp(dt,0,.1);this.elapsed+=time;
  if(this.active&&this.aircraft.condition>0)this.aircraft.battery=clamp(this.aircraft.battery-this.controls.throttle*time*.025,0,100);
  animateLightTrainer(this.aircraft,this.controls,time);this.sendControls();}
 cameraPose(mode='chase'){
  const a=this.aircraft;if(!a)return null;a.root.updateWorldMatrix(true,true);const cockpit=mode===1||mode==='cockpit',overhead=mode===2||mode==='overhead';
  return{position:a.anchors[cockpit?'cockpit':overhead?'overhead':'chase'].getWorldPosition(new THREE.Vector3()),look:a.anchors[cockpit?'cockpitLook':'chaseLook'].getWorldPosition(new THREE.Vector3()),up:UP.clone().applyQuaternion(a.root.quaternion),fov:cockpit?66:58};
 }
 exitPoint(){
  const a=this.aircraft;if(!a||!this.canUseOnGround())return null;const g=this.game,c=Math.cos(a.yaw),s=Math.sin(a.yaw),local=(x,z)=>({x:a.pos.x+c*x+s*z,z:a.pos.z-s*x+c*z});
  const clear=p=>{
   if(!inWorld(p))return false;
   if(this.options.isExitClear?.(p,a)===false)return false;
   for(const b of g.world?.colliders??[]){const yaw=finite(b.yaw),dx=p.x-b.x,dz=p.z-b.z;if(Math.abs(dx*Math.cos(yaw)-dz*Math.sin(yaw))<b.w+.45&&Math.abs(dx*Math.sin(yaw)+dz*Math.cos(yaw))<b.d+.45)return false;}
   for(const v of [g.vehicle,g.personalVehicle,...(g.traffic??[]),...(g.police??[])])if(v?.pos&&v!==a&&!v.populationDormant&&distance(p,v.pos)<Math.hypot(v.halfWidth??1.1,v.halfLength??2.6)+.45)return false;
   return true;
  };
  for(const side of [-1,1])for(const z of [-1.8,2.7]){
   // Walk ahead of, or behind, the wing. Never through it or the propeller.
   const from=local(side*1.7,z),to=local(side*6.3,z);let accessible=true;
   for(let i=0;i<=24;i++){const t=i/24;if(!clear({x:from.x+(to.x-from.x)*t,z:from.z+(to.z-from.z)*t})){accessible=false;break;}}
   if(!accessible)continue;const heights=[[-.35,-.35],[.35,-.35],[-.35,.35],[.35,.35],[0,0]].map(([dx,dz])=>this.heightAt(to.x+dx,to.z+dz));
   if(Math.max(...heights)-Math.min(...heights)>.35||Math.abs(Math.max(...heights)-a.pos.y)>1)continue;
   to.y=g.walkingHeight?.(to.x,to.z)??Math.max(...heights)+.012;return to;
  }
  return null;
 }
 exit(){
  if(!this.active)return this.result(false,'当前没有驾驶飞机');
  if(!this.canUseOnGround())return this.result(false,'请先着陆、收油门并停稳后下机');
  const outside=this.exitPoint();if(!outside)return this.result(false,'舱门外没有安全下机空间');
  const g=this.game;this.clearControls();g.inCar=false;g.playerPos?.set(outside.x,outside.y,outside.z);g.playerYaw=this.aircraft.yaw;
  if(g.person?.root){g.person.root.position.copy(g.playerPos);g.person.root.rotation.y=g.playerYaw;g.person.root.visible=true;}
  this.personalVehicle=null;this.entryContext=null;this.pendingBoard=false;this.change('parked');g.resetControls?.();this.options.onExit?.(outside);return this.result(true);
 }
 cancel(){
  if(this.active)return this.exit();
  if(!this.aircraft){this.pendingBoard=false;return this.result(true);}
  // A cancelled pending boarding never moves or changes the player's car.
  this.removeAircraft();return this.result(true);
 }
 resetAtRunway({explicit=false}={}){
  if(!explicit)return this.result(false,'仅可通过“回到跑道”按钮重置飞机');if(!this.aircraft)return this.result(false,'尚未准备飞机');
  const pose=airportRunwayPose(this.aircraft.airportId);if(!this.spawnClear(pose))return this.result(false,'跑道被占用，无法重置');
  this.options.prepareRunway?.(pose,this.aircraft);this.controls=clampAircraftControls({brake:1});this.aircraft.grounded=false;this.aircraft.hasSnapshot=false;this.awaitResetPose=new THREE.Vector3(...pose.pos);
  this.queue({type:'teleport',id:this.aircraft.physicsId,pos:[...pose.pos],quat:[...pose.quat],linear:[0,0,0],angular:[0,0,0]});this.sendControls();return this.result(true,'已请求回到跑道；机况保留');
 }
 damage(amount,localPoint=null){if(!this.aircraft)return 0;const a=this.aircraft,loss=Math.min(a.condition,Math.max(0,finite(amount)));a.condition=clamp(a.condition-loss,0,100);
  if(loss>0){const region=localPoint&&Math.abs(localPoint.x)>2?localPoint.x<0?'leftWing':'rightWing':localPoint?.z>1?'tail':'nose';a.damageRegions[region]=clamp(a.damageRegions[region]+loss/100,0,1);updateAircraftDamage(a);}
  this.sendControls();return a.condition;}
 /** Actual Godot contacts only; strongest manifold record wins per pair/tick. */
 onContact(contact,tick=contact?.tick){
  const a=this.aircraft;if(!a||this.game.paused||![contact?.a,contact?.b].includes(a.physicsId)||!Number.isFinite(contact.impulse)||contact.impulse<TRAINER.mass*.35||!Number.isFinite(contact.relativeNormalSpeed)||contact.relativeNormalSpeed<=2)return 0;
  const other=contact.a===a.physicsId?contact.b:contact.a;if(typeof other!=='string'||other===a.physicsId)return 0;
  const frame=Number.isFinite(tick)?tick:null,now=Number.isFinite(tick)?tick/60:this.elapsed,previous=this.contacts.get(other),sameFrame=previous&&(frame!==null?previous.tick===frame:previous.time===now);
  if(previous&&!sameFrame&&now-previous.time<.4)return 0;
  const amount=impactDamage(contact.relativeNormalSpeed,TRAINER.mass),increment=Math.max(0,amount-(sameFrame?previous.damage:0));if(increment<=0)return 0;
  const local=vector(contact.point)?new THREE.Vector3(...contact.point):null;if(local){a.root.updateWorldMatrix(true,false);a.root.worldToLocal(local);}
  this.contacts.set(other,{tick:frame,time:now,damage:amount});if(this.contacts.size>32)this.contacts.delete(this.contacts.keys().next().value);
  this.damage(increment,local);return increment;
 }
 repair({recharge=false}={}){if(!this.aircraft||!this.canUseOnGround())return this.result(false,'飞机须着地停稳后才能维修');this.aircraft.condition=100;this.aircraft.damageRegions=damageRegions({});updateAircraftDamage(this.aircraft);if(recharge)this.aircraft.battery=100;this.contacts.clear();this.sendControls();return this.result(true,'飞机已维修');}
 /** Flight saves load beside the original airport, with the same personal car. */
 saveContext(){
  const g=this.game,vehicle=this.personalVehicle??g.personalVehicle??g.vehicle;
  if(!this.active)return{vehicle,inCar:g.inCar,player:point(g.playerPos),playerYaw:finite(g.playerYaw)};
  const airport=airportFor(this.aircraft.airportId),x=airport.x-3,z=airport.z,y=g.walkingHeight?.(x,z)??this.heightAt(x,z)+.012;
  return{vehicle,inCar:false,player:{x,y,z},playerYaw:airport.yaw,aircraftResumePolicy:'parked-at-runway'};
 }
 snapshot(){const a=this.aircraft??this.savedState;return a?{version:1,modelId:TRAINER.id,airportId:a.airportId,condition:clamp(finite(a.condition,100),0,100),battery:clamp(finite(a.battery,100),0,100),damageRegions:damageRegions(a.damageRegions,a.condition),resumePolicy:'parked-at-runway'}:null;}
 /** Parent calls only as part of explicit save loading, never every frame. */
 restore(saved){
  if(this.active||this.pendingBoard)return this.result(false,'请先结束当前驾驶或在载入前调用 resetForLoad');
  if(!saved){this.removeAircraft();this.savedState=null;return this.result(true);}
  if(saved.version!==1||!airportFor(saved.airportId)||!Number.isFinite(saved.condition)||!Number.isFinite(saved.battery))return this.result(false,'飞机存档无效');
  this.removeAircraft();this.savedState={airportId:saved.airportId,condition:clamp(saved.condition,0,100),battery:clamp(saved.battery,0,100),damageRegions:damageRegions(saved.damageRegions,saved.condition)};
  const p=this.game.position??this.game.playerPos,runway=airportRunwayPose(saved.airportId).position;
  if(!p||distance(p,runway)>550)return this.result(true,'教练机已保存；到机场后可准备登机');
  const spawned=this.spawn(saved.airportId,{forLoad:true});return spawned.ok?spawned:this.result(true,'飞机状态已保存；跑道暂被占用，稍后可重新准备飞机');
 }
 /** Parked planes cannot remain dynamic outside the streamed collision area. */
 unloadFarAircraft(position){
  if(!this.aircraft||this.active||this.pendingBoard||!Number.isFinite(position?.x)||!Number.isFinite(position?.z)||distance(position,this.aircraft.pos)<=550)return false;
  this.removeAircraft();return true;
 }
 removeAircraft(){
  if(this.aircraft){this.savedState=this.snapshot();this.controls=clampAircraftControls({brake:1});this.sendControls();this.queue({type:'remove',id:this.aircraft.physicsId});disposeLightTrainer(this.aircraft);this.aircraft=null;}
  this.pendingBoard=false;this.awaitResetPose=null;this.change('idle');
 }
 /** Explicit whole-game load/respawn cleanup, separate from pilot cancellation. */
 resetForLoad(){
  const g=this.game,context=this.entryContext;
  if(context){g.vehicle=context.vehicle;g.inCar=context.inCar;g.playerPos?.copy(context.playerPosition);g.playerYaw=context.playerYaw;if(g.person?.root){g.person.root.position.copy(g.playerPos);g.person.root.visible=context.personVisible??!g.inCar;}}
  this.personalVehicle=null;this.entryContext=null;this.removeAircraft();
 }
 dispose(){this.resetForLoad();this._disposed=true;}
}

export {FlyableAircraftService as AircraftService};
