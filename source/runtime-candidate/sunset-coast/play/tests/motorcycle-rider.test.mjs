import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {motorcycleRiderPose,updateMotorcycleRider,vehicleEnergyLabel,vehicleRefillLabel} from '../motorcycle-rider.js';
import {createEntryAnimation,sampleEntryAnimation} from '../entry-animation.js';
const motorcycle=(type='electric')=>({kind:'motorcycle',model:{powertrain:type},driverPosition:{x:0,y:.8,z:.18},root:new THREE.Group()});
test('motorcycle rider hip aligns to authored saddle without scaling',()=>{
 const v=motorcycle(),p=motorcycleRiderPose(v),hip=new THREE.Vector3(0,.8,0).applyAxisAngle(new THREE.Vector3(1,0,0),p.pitch).add(new THREE.Vector3(p.position.x,p.position.y,p.position.z));
 assert.ok(hip.distanceTo(new THREE.Vector3(0,.8,.18))<1e-10);assert.ok(p.legs[0].z<0&&p.legs[1].z>0);
});
test('rider follows actual vehicle quaternion and render position; cockpit hides rider',()=>{
 const v=motorcycle();v.root.position.set(4,2,8);v.root.rotation.set(0,.7,.2);
 const root=new THREE.Group(),g={vehicle:v,person:{root,arms:[new THREE.Group(),new THREE.Group()],legs:[new THREE.Group(),new THREE.Group()]},inCar:true,character:'alex',cameraMode:0};
 assert.equal(updateMotorcycleRider(g),true);assert.equal(root.visible,true);assert.deepEqual(root.scale.toArray(),[1,1,1]);const expected=new THREE.Vector3(...Object.values(motorcycleRiderPose(v).position)).applyQuaternion(v.root.quaternion).add(v.root.position);assert.ok(root.position.distanceTo(expected)<1e-9);
 g.cameraMode=1;updateMotorcycleRider(g);assert.equal(root.visible,false);g.inCar=false;assert.equal(updateMotorcycleRider(g),false);
});
test('motorcycle entry and exit share stable endpoints and never open nonexistent door',()=>{
 const opts={motorcycle:true,vehiclePosition:{x:2,y:.5,z:4},vehicleYaw:.2,driverPosition:{x:0,y:.8,z:.18},exitPosition:{x:-1.1,y:0,z:.1},exactExitPosition:true,halfWidth:.4,height:1.3,halfLength:1.1,kind:'human'};
 const entry=createEntryAnimation({...opts,entering:true}),exit=createEntryAnimation({...opts,entering:false});
 const seated=sampleEntryAnimation(entry,entry.duration),startExit=sampleEntryAnimation(exit,0);assert.deepEqual(seated.position,startExit.position);assert.equal(seated.pitch,startExit.pitch);
 for(const plan of [entry,exit])for(let t=0;t<=plan.duration;t+=.013){const p=sampleEntryAnimation(plan,t);assert.equal(p.doorAngle,0);assert.deepEqual(p.scale,{x:1,y:1,z:1});assert.ok(Object.values(p.position).every(Number.isFinite));}
 const outside=sampleEntryAnimation(exit,exit.duration);assert.deepEqual(outside.position,entry.outside);assert.equal(outside.pitch,0);
});
test('energy labels separate ICE motorcycle fuel from EV battery; car legacy unchanged',()=>{
 assert.equal(vehicleEnergyLabel(motorcycle()),'电量');assert.equal(vehicleRefillLabel(motorcycle()),'充电');assert.equal(vehicleEnergyLabel(motorcycle('combustion')),'燃油');assert.equal(vehicleRefillLabel(motorcycle('combustion')),'加油');assert.equal(vehicleEnergyLabel({kind:'car',model:{powertrain:'combustion'}}),'电量');
});
test('non-motorcycle rider updates leave car occupant unchanged',()=>{const root=new THREE.Group();root.visible=false;assert.equal(updateMotorcycleRider({vehicle:{kind:'car'},person:{root},inCar:true}),false);assert.equal(root.visible,false);});
