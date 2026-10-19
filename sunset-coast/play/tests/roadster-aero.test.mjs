import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {ROADSTER_AERO_POSES,roadsterAeroBrakeState,roadsterAeroMode,setRoadsterAeroMode,updateRoadsterAero} from '../roadster-aero.js';
import {roadsterDisplayState,paintRoadsterDisplay} from '../roadster-displays.js';
import {roadsterPlayerInput} from '../roadster-controls.js';
import {godotCarControls} from '../godot-physics.js';
const near=(a,b,tolerance=1e-4)=>assert.ok(Math.abs(a-b)<tolerance,`${a} vs ${b}`);
function fixture(id='roadster'){
 const node=()=>new THREE.Group(),wingLift=node(),wingPitch=node();wingLift.position.y=1;wingLift.add(wingPitch);
 const supports=[node(),node()];for(const support of supports)support.position.y=.8;
 return{model:{id},speed:60,lateralSpeed:0,grounded:true,parkingBrakeEngaged:false,battery:100,condition:100,physicsQuaternion:new THREE.Quaternion(),roadsterRequest:{air:false,aeroMode:'road'},roadsterState:{mode:'road',wing:1,wingPitch:.6},roadsterRig:{wingLift,wingPitch,hoodAero:node(),sideAero:[node(),node()],wingSupports:supports}};
}
const animate=(v,seconds=3,hz=60)=>{for(let i=0;i<seconds*hz;i++)updateRoadsterAero(v,1/hz);};
for(const id of ['roadster','roadster_thrust','roadster_rocket'])test(`${id}: native ground-brake snapshot overrides road/track wing and restores the selected mode`,()=>{
 for(const mode of ['road','highDownforce','lowDrag']){
  const v=fixture(id);setRoadsterAeroMode(v,mode);const before=JSON.stringify({speed:v.speed,q:v.physicsQuaternion,request:v.roadsterRequest,state:v.roadsterState});animate(v);
  assert.equal(roadsterAeroBrakeState(v).active,true);near(v.roadsterRig.wingLift.position.y,1.34);near(v.roadsterRig.wingPitch.rotation.x,-.6);assert.equal(roadsterAeroMode(v),mode);
  near(v.roadsterRig.hoodAero.rotation.x,-ROADSTER_AERO_POSES[mode].hood);assert.equal(JSON.stringify({speed:v.speed,q:v.physicsQuaternion,request:v.roadsterRequest,state:v.roadsterState}),before);
  v.roadsterState.wingPitch=.35;animate(v,4);near(v.roadsterAeroVisual.lift,ROADSTER_AERO_POSES[mode].lift);near(v.roadsterAeroVisual.pitch,ROADSTER_AERO_POSES[mode].pitch);assert.equal(roadsterAeroMode(v),mode);
 }
});
test('no hover/handbrake/key-based fake activation; require authoritative brake-wing output',()=>{
 const v=fixture();v.roadsterState.wingPitch=.35;v.handbrake=true;v.roadsterAirBrake=true;v.brakeAmount=1;assert.equal(roadsterAeroBrakeState(v).active,false);animate(v);near(v.roadsterRig.wingPitch.rotation.x,0);
 for(const mode of ['air','landing','recover','unpowered']){v.roadsterState={mode,wing:1,wingPitch:.6};assert.equal(roadsterAeroBrakeState(v).active,false);}
 delete v.roadsterState;assert.equal(roadsterAeroBrakeState(v).active,false);
});
test('parking, stationary, unsupported and inverted vehicles cannot claim ground aero braking',()=>{
 for(const change of [{parkingBrakeEngaged:true},{speed:0},{grounded:false},{model:{id:'s'}},{physicsQuaternion:new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI)}]){
  const v=Object.assign(fixture(),change);assert.equal(roadsterAeroBrakeState(v).active,false);animate(v);near(v.roadsterAeroVisual.lift,0);
 }
});
test('deployment follows native ramp, clears wing tips and is frame-rate stable',()=>{
 const states=[];
 for(const hz of [30,60,120]){
  const v=fixture();v.roadsterState.wing=.2;v.roadsterState.wingPitch=.12;animate(v,.5,hz);assert.equal(roadsterAeroBrakeState(v).active,true);assert.ok(v.roadsterAeroVisual.lift<=.068);near(v.roadsterRig.wingPitch.rotation.x,0);
  v.roadsterState.wing=1;v.roadsterState.wingPitch=.6;animate(v,1,hz);states.push(v.roadsterAeroVisual);
 }
 for(const state of states.slice(1))for(const key of ['lift','rear','pitch'])near(state[key],states[0][key],1e-10);
});
test('center display explicitly identifies aerodynamic braking, not Rocket hover',()=>{
 const v=fixture('roadster_rocket'),s=roadsterDisplayState(v);assert.equal(s.airBrake,true);assert.equal(s.aeroMode,'road');
 const text=[];const ctx=new Proxy({fillText:value=>text.push(String(value))},{get:(target,key)=>target[key]??(()=>{})});paintRoadsterDisplay(ctx,'center',s);assert.ok(text.includes('AERO BRAKING'));
 v.roadsterState.mode='air';assert.equal(roadsterDisplayState(v).airBrake,false);
});
test('manual, electronic and parking control contracts stay distinct from Rocket airBrake',()=>{
 const v=fixture();assert.equal(godotCarControls(v,{throttle:0,steer:0,brake:1},1/60).manualBrake,1);
 assert.equal(godotCarControls(v,{throttle:0,steer:0,brake:1,brakeSource:'pilot'},1/60).electronicBrake,1);
 v.parkingBrakeEngaged=true;const parked=godotCarControls(v,{throttle:1,steer:0,brake:0,roadsterBoost:true,roadsterAir:true},1/60);assert.equal(parked.throttle,0);assert.equal(parked.handbrake,true);assert.equal(parked.roadsterAir,false);
 const rocket=fixture('roadster_rocket');rocket.roadsterState.mode='air';rocket.roadsterRequest.air=true;const input=roadsterPlayerInput({vehicle:rocket,keys:{Space:true},touch:{},roadsterTouch:{},physics:{ready:true}},{throttle:1,steer:0,brake:1,handbrake:true});assert.equal(input.roadsterAirBrake,true);assert.equal(input.brake,0);assert.equal(input.handbrake,false);
});
