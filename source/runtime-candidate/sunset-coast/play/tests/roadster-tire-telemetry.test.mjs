import test from 'node:test';
import assert from 'node:assert/strict';
import {applyRoadsterTireSnapshot,nativeRoadsterWheelAngle} from '../roadster-tire-telemetry.js';
const data=()=>({angularSpeeds:[1,2,3,4],angles:[10,20,30,40],slipRatios:[.01,.02,.03,.04],normalLoads:[100,200,300,400],forces:[[1,2],[3,4],[5,6],[7,8]],contacts:[true,true,false,false],tcsActive:[false,true,false,true]});
test('native wheel angles preserve independent wheelspin and axle mapping',()=>{
 const v={godotPhysics:true,speed:5,travelDistance:9};const tires=data();
 applyRoadsterTireSnapshot(v,{roadster:{trim:'rocket'},wheelDynamics:tires});
 assert.equal(nativeRoadsterWheelAngle(v,{front:true,side:-1}),-10);
 assert.equal(nativeRoadsterWheelAngle(v,{front:true,side:1}),-20);
 assert.equal(nativeRoadsterWheelAngle(v,{front:false,side:-1}),-30);
 assert.equal(nativeRoadsterWheelAngle(v,{front:false,side:1}),-40);
 assert.equal(v.speed,5);assert.equal(v.travelDistance,9);
 tires.angles[0]=999;assert.equal(v.roadsterTires.angles[0],10);
});
test('bad native telemetry clears stale state and ordinary vehicles retain old rolling visuals',()=>{
 const v={godotPhysics:true};applyRoadsterTireSnapshot(v,{roadster:{},wheelDynamics:data()});
 const bad=data();bad.angles[0]=NaN;applyRoadsterTireSnapshot(v,{roadster:{},wheelDynamics:bad});assert.equal(v.roadsterTires,null);
 applyRoadsterTireSnapshot(v,{roadster:null,wheelDynamics:data()});assert.equal(v.roadsterTires,null);
 assert.equal(nativeRoadsterWheelAngle(v,{front:true,side:-1}),null);
});
