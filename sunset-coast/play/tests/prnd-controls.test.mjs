import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import {TOUCH_GEARS,SHIFT_SPEED_LIMIT,touchGear,selectTouchGear,touchThrottle,vehicleGear,parkingBrakeControls} from '../touch-transmission.js';
import {godotCarControls,GodotPhysicsSystem} from '../godot-physics.js';
import {stepVehicleMotion} from '../vehicle-physics.js';
import {evaluateDrivingAssist} from '../driving-assist.js';
import {createBrakeFault} from '../brake-fault.js';
import {infotainmentState} from '../vehicle-infotainment.js';
import {roadsterDisplayState} from '../roadster-displays.js';
import {semiDisplayState} from '../semi-displays.js';
import {toggleRoadsterAir,requestRoadsterManeuver} from '../roadster-controls.js';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const method=(start,end,args,values)=>new Function(...args,`return ({${source.slice(source.indexOf(start),source.indexOf(end))}});`)(...values);
const controls=method(' controls(', '\n pilotControls(', ['touchGear','touchThrottle','laneChangeControls'],[touchGear,touchThrottle,(_,input)=>input]).controls;
const toggleAutopilot=method(' toggleAutopilot(', '\n manualTakeover(', ['cancelLaneChange','roadsterFlightLocked'],[()=>{},()=>false]).toggleAutopilot;
const vehicle=(speed=0,id='s')=>({model:{id,power:7,max:60,range:500},speed,lateralSpeed:0,battery:100,condition:100,pos:new THREE.Vector3(4,0,170),yaw:0,steer:0,wheelBase:3,rearAxle:1.5,maxSteer:.6,brakeFault:createBrakeFault(),root:new THREE.Group()});
function fixture(speed=0,id='s'){
 const state={drawer:false,phone:false,modal:false};
 globalThis.document={getElementById:()=>({open:state.modal}),body:{classList:{contains:()=>state.drawer}}};
 const messages=[];
 const g={vehicle:vehicle(speed,id),inCar:true,effectiveInputMode:'touch',time:0,keys:{},touch:{},paused:false,transition:null,autopilot:false,
  ui:{isPhoneOpen:()=>state.phone,toast:m=>messages.push(m),updatePilot(){}},
  pilot:{reset(){},startCruise(){}},
  manualTakeover(){this.takeovers=(this.takeovers??0)+1;this.autopilot=false;},
  resetControls(){this.resets=(this.resets??0)+1;this.keys={};this.touch={};},
  pilotControls(){return {throttle:1,steer:.2,brake:0,handbrake:false,brakeSource:'pilot'};},
 };
 return {g,state,messages};
}

test('four gears use P R / N D order and square >=44px scoped targets',()=>{
 assert.deepEqual(TOUCH_GEARS,['P','R','N','D']);
 const html=readFileSync(new URL('../mobile-ui.js',import.meta.url),'utf8');
 const ids=[...html.matchAll(/<button id="mobile-gear-([prnd])"/g)].map(m=>m[1]);
 assert.deepEqual(ids,['p','r','n','d']);assert.equal((html.match(/of TOUCH_GEARS/g)||[]).length,2);
 const css=readFileSync(new URL('../prnd-controls.css',import.meta.url),'utf8');
 assert.match(css,/grid-template-columns: repeat\(2, var\(--gear-target\)\)/);
 assert.match(css,/grid-template-rows: repeat\(2, var\(--gear-target\)\)/);
 assert.match(css,/max\(44px, calc\(44px/);assert.doesNotMatch(css.replace(/\/\*[\s\S]*?\*\//g,''),/#minimap|#world|camera/);
});

test('P engages at near rest without changing velocity or position; cancels Pilot and held inputs',()=>{
 const {g}=fixture(.2);g.autopilot=true;g.touch.go=true;g.keys.KeyW=true;const before=g.vehicle.pos.clone();
 assert.equal(selectTouchGear(g,'P'),true);assert.equal(g.vehicle.parkingBrakeEngaged,true);
 assert.equal(g.autopilot,false);assert.equal(g.takeovers,1);assert.equal(g.resets,1);
 assert.deepEqual(g.touch,{});assert.deepEqual(g.keys,{});assert.equal(g.vehicle.speed,.2);assert.deepEqual(g.vehicle.pos,before);
 assert.equal(touchGear(g),'P');assert.equal(vehicleGear(g.vehicle),'P');
});

for(const speed of [SHIFT_SPEED_LIMIT+.001,5,-5,NaN,Infinity])test(`P rejected at unsafe/unknown speed ${speed}`,()=>{
 const {g}=fixture(speed);g.autopilot=true;assert.equal(selectTouchGear(g,'P'),false);
 assert.equal(g.vehicle.parkingBrakeEngaged,undefined);assert.equal(g.autopilot,true);assert.equal(g.resets,undefined);assert.ok(Object.is(g.vehicle.speed,speed));
});
test('sideways sliding also blocks parking',()=>{const {g}=fixture();g.vehicle.lateralSpeed=4;assert.equal(selectTouchGear(g,'P'),false);});

for(const next of ['N','R','D'])test(`deliberate ${next} selection releases P and requires fresh pedal`,()=>{
 const {g}=fixture();selectTouchGear(g,'P');g.touch.go=true;assert.equal(selectTouchGear(g,next),true);
 assert.equal(g.vehicle.parkingBrakeEngaged,false);assert.equal(touchGear(g),next);assert.deepEqual(g.touch,{});
 assert.equal(touchThrottle(g,0),0);g.touch.go=true;
 assert.equal(touchThrottle(g,1),next==='N'?0:next==='R'?-1:1);
 const command=godotCarControls(g.vehicle,{throttle:touchThrottle(g,1),steer:0,brake:0,handbrake:false},1/60);
 assert.equal(command.handbrake,false);assert.equal(command.throttle,next==='N'?0:next==='R'?-1:1);
});

test('D/N/R shift speed rules stay intact, N coasts without applying a parking brake',()=>{
 const {g}=fixture(15);assert.equal(selectTouchGear(g,'R'),false);assert.equal(selectTouchGear(g,'N'),true);
 assert.equal(touchThrottle(g,1),0);assert.equal(g.vehicle.parkingBrakeEngaged,false);assert.equal(g.vehicle.speed,15);
 assert.equal(selectTouchGear(g,'D'),false);assert.equal(selectTouchGear(g,'P'),false);
});

test('P latch survives UI input modes, reset, leaving/re-entering and vehicle swaps',()=>{
 const {g}=fixture();selectTouchGear(g,'P');const first=g.vehicle;
 g.resetControls();g.effectiveInputMode='keyboard';assert.equal(touchGear(g),'P');assert.equal(touchThrottle(g,1),0);
 g.inCar=false;assert.equal(touchGear(g),'P');g.inCar=true;g.vehicle=vehicle();assert.equal(touchGear(g),'D');assert.equal(g.vehicle.parkingBrakeEngaged,undefined);
 assert.equal(parkingBrakeControls(first,{throttle:1}).handbrake,true);g.vehicle=first;assert.equal(touchGear(g),'P');
});

test('non-parking N/R preferences do not leak to another vehicle or keyboard controls',()=>{
 const {g}=fixture();selectTouchGear(g,'R');const first=g.vehicle;g.vehicle=vehicle();assert.equal(touchGear(g),'D');assert.equal(first.touchDriveGear,undefined);
 selectTouchGear(g,'N');g.effectiveInputMode='keyboard';assert.equal(touchGear(g),'D');assert.equal(g.vehicle.touchDriveGear,undefined);assert.equal(touchThrottle(g,1),1);
});

test('production input and Pilot toggle cannot accelerate or silently release P',()=>{
 const {g}=fixture();selectTouchGear(g,'P');g.keys.KeyW=true;g.touch.go=true;g.autopilot=true;
 assert.deepEqual(controls.call(g),{throttle:0,steer:0,brake:0,handbrake:true});assert.equal(g.autopilot,false);
 toggleAutopilot.call(g);assert.equal(g.autopilot,false);assert.equal(touchGear(g),'P');
 selectTouchGear(g,'D');toggleAutopilot.call(g);assert.equal(g.autopilot,true);
});
test('production touch N ignores keyboard and both pedal directions without braking',()=>{
 const {g}=fixture();selectTouchGear(g,'N');g.keys.KeyW=true;g.touch.go=true;g.touch.reverse=true;
 const input=controls.call(g);assert.equal(input.throttle,0);assert.equal(input.handbrake,false);
});

test('native Godot adapter enforces P after Pilot/AEB and broken-pedal inputs',()=>{
 for(const id of ['s','c800','semi','roadster_rocket']){
  const {g}=fixture(.2,id);selectTouchGear(g,'P');g.vehicle.brakeFault=createBrakeFault(true);
  const original={throttle:1,steer:.2,brake:0,handbrake:false,brakeSource:'pilot',electronicBrake:.4};
  const assisted=evaluateDrivingAssist(g,original,1/60);
  const command=godotCarControls(g.vehicle,assisted,1/60);
  assert.equal(command.throttle,0,id);assert.equal(command.handbrake,true,id);assert.equal(original.throttle,1);
  assert.equal(g.vehicle.speed,.2);const physics=new GodotPhysicsSystem(g);physics.submitVehicle(g.vehicle,original,1/60);
  const submitted=physics.controlMap.get(g.vehicle);assert.equal(submitted.throttle,0);assert.equal(submitted.handbrake,true);assert.equal(physics.commands.length,0);
 }
});

test('reference-only motion slows under bounded handbrake force, then remains still despite throttle',()=>{
 const {g}=fixture(.25);selectTouchGear(g,'P');stepVehicleMotion(g.vehicle,{throttle:1,steer:0,brake:0,handbrake:false},.01);
 assert.ok(g.vehicle.speed>0&&g.vehicle.speed<.25,'Not an instantaneous speed reset');
 for(let i=0;i<100;i++)stepVehicleMotion(g.vehicle,{throttle:1,steer:0,brake:0,handbrake:false},.01);
 assert.equal(g.vehicle.speed,0);const pos=g.vehicle.pos.clone();stepVehicleMotion(g.vehicle,{throttle:1,steer:0,brake:0},1/60);assert.deepEqual(g.vehicle.pos,pos);
 selectTouchGear(g,'D');for(let i=0;i<20;i++)stepVehicleMotion(g.vehicle,{throttle:1,steer:0,brake:0,handbrake:false},.01);assert.ok(g.vehicle.speed>0);
});

test('quick selection, HUD gear helper and all vehicle display states agree at zero speed',()=>{
 const {g}=fixture();
 for(const gear of TOUCH_GEARS){selectTouchGear(g,gear);assert.equal(touchGear(g),gear);assert.equal(vehicleGear(g.vehicle),gear);assert.equal(infotainmentState(g.vehicle,g).gear,gear);assert.equal(roadsterDisplayState(g.vehicle).gear,gear);assert.equal(semiDisplayState(g.vehicle).gear,gear);}
 for(const name of ['cockpit.js','vehicle-instruments.js'])assert.match(readFileSync(new URL('../'+name,import.meta.url),'utf8'),/vehicleGear\((v|car)\)/);
 assert.equal(vehicleGear({speed:2}),'D');assert.equal(vehicleGear({speed:-2}),'R');
});

for(const blocker of ['paused','transition','drawer','phone','modal'])test(`${blocker} prevents gear changes`,()=>{
 const {g,state}=fixture();if(blocker in state)state[blocker]=true;else g[blocker]=true;
 assert.equal(selectTouchGear(g,'P'),false);assert.equal(g.vehicle.parkingBrakeEngaged,undefined);
});

test('P is unavailable to walking, flight and taxi passenger contexts',()=>{
 for(const change of [{inCar:false},{aircraft:{active:true}},{flight:{active:true}},{isRoadsterFlying:()=>true},{robotaxi:{passenger:true}}]){
  const {g}=fixture();Object.assign(g,change);assert.equal(selectTouchGear(g,'P'),false);
 }
});

test('Rocket boost, takeoff and maneuver channels cannot bypass P',()=>{
 const {g}=fixture(0,'roadster_rocket');g.physics={ready:true};selectTouchGear(g,'P');
 const command=godotCarControls(g.vehicle,{throttle:1,steer:0,brake:0,roadsterBoost:true,roadsterAir:true,roadsterAction:'vault',roadsterForward:1,roadsterVertical:1},1/60);
 for(const field of ['roadsterBoost','roadsterAir','roadsterRecover'])assert.equal(command[field],false);
 for(const field of ['throttle','roadsterForward','roadsterVertical','roadsterLateral'])assert.equal(command[field],0);
 assert.equal(command.roadsterAction,'');assert.equal(toggleRoadsterAir(g).ok,false);assert.equal(requestRoadsterManeuver(g,'vault').ok,false);assert.equal(requestRoadsterManeuver(g,'vault_spin').ok,false);assert.equal(godotCarControls(g.vehicle,{roadsterAction:'vault_spin'},1/60).roadsterAction,'');
 selectTouchGear(g,'D');assert.equal(toggleRoadsterAir(g).ok,true);
});

test('native fallback still holds parked vehicles when no player controls are submitted',()=>{
 const {g}=fixture();selectTouchGear(g,'P');g.allVehicles=()=>[g.vehicle];g.world={update(){}};g.position=g.vehicle.pos;g.physicsTick=()=>{};
 const physics=new GodotPhysicsSystem(g);physics.vehicles.set(g.vehicle,{id:'parked'});
 physics.syncVehicles=()=>{};physics.applySnapshot=()=>{};physics.syncWorld=()=>{};
 const packet=physics.tick({v:1,tick:1,bodies:[],contacts:[],dt:1/60});
 assert.equal(packet.controls[0].throttle,0);assert.equal(packet.controls[0].handbrake,true);assert.equal(packet.commands.length,0);
});

test('exiting a parked car preserves ordinary walking controls and keeps that car parked',()=>{
 const {g}=fixture();selectTouchGear(g,'P');g.inCar=false;g.keys.KeyW=true;
 const input=controls.call(g);assert.equal(input.throttle,1);assert.equal(input.handbrake,false);
 assert.equal(g.vehicle.parkingBrakeEngaged,true);assert.equal(godotCarControls(g.vehicle,{throttle:1,steer:0,brake:0},1/60).handbrake,true);
 g.keys={};g.touch.y=-1;assert.equal(controls.call(g).throttle,1);
});
