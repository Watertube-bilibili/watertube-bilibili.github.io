import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from '../source/runtime-candidate/sunset-coast/play/vendor/three.module.js';
import {cameraSegmentHitFraction,constrainWalkingCamera} from '../source/runtime-candidate/sunset-coast/play/walking-camera.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const wall={x:0,z:4,w:4,d:.3,height:8};
test('wall shortens ordinary camera without mutating desired/look',()=>{const a=V(0,1,0),b=V(0,4.1,8),out=constrainWalkingCamera([wall],a,b);assert.ok(out.z<3.56);assert.deepEqual(b.toArray(),[0,4.1,8]);assert.deepEqual(a.toArray(),[0,1,0]);});
test('ceiling and finite-height obstacles use authored baseY',()=>{assert.notEqual(cameraSegmentHitFraction(V(0,1,0),V(0,5,0),{x:0,z:0,w:3,d:3,baseY:3,height:.2}),null);assert.equal(cameraSegmentHitFraction(V(0,9,0),V(0,9,8),wall),null);});
test('rotated, malformed, penetrating anchors and no blockers',()=>{assert.notEqual(cameraSegmentHitFraction(V(0,1,0),V(0,1,8),{...wall,yaw:Math.PI/4}),null);assert.equal(cameraSegmentHitFraction(V(),V(0,1,8),{...wall,w:NaN}),null);assert.equal(cameraSegmentHitFraction(V(0,1,4),V(0,1,8),wall),null);const b=V(0,1,8);assert.equal(constrainWalkingCamera([],V(),b),b);});
const source=readFileSync(new URL('../source/runtime-candidate/sunset-coast/play/game.js',import.meta.url),'utf8');
const update=new Function('THREE','constrainWalkingCamera','setVehicleInteriorView','sampleVehiclePose','clamp','wrap','innerWidth','innerHeight',`return ({${source.slice(source.indexOf(' updateCamera('),source.indexOf('\n updateWorld('))}}).updateCamera`)(THREE,constrainWalkingCamera,()=>{},v=>({position:v.pos,yaw:0}),THREE.MathUtils.clamp,x=>x,1280,720);
function fixture(){const root=new THREE.Group();return {vehicle:{root,pos:V()},position:V(),playerYaw:0,cameraYaw:0,cameraMode:0,inCar:false,world:{colliders:[wall]},camera:new THREE.PerspectiveCamera(58),sun:{position:V(),target:new THREE.Object3D()},sunDisc:{position:V()},updateCamera:update};}
test('actual SUNRISE Game camera clips wall, clears on repeat, never moves actor',()=>{const g=fixture();g.updateCamera(.016);assert.ok(g.camera.position.z<3.56);assert.deepEqual(g.position.toArray(),[0,0,0]);g.world.colliders=[];g.updateCamera(.016);assert.equal(g.camera.position.z,8);g.world.colliders=[wall];g.updateCamera(.016);assert.ok(g.camera.position.z<3.56);});
for(const mode of [0,1,2])test(`actual SUNRISE driving camera ${mode} unchanged`,()=>{const a=fixture(),b=fixture();a.inCar=b.inCar=true;a.cameraMode=b.cameraMode=mode;b.world.colliders=[];a.updateCamera(.016);b.updateCamera(.016);assert.deepEqual(a.camera.position.toArray(),b.camera.position.toArray());});
for(const state of ['aircraft','photoMode'])test(`actual SUNRISE ${state} camera exempt`,()=>{const g=fixture();g[state]={active:true};g.updateCamera(.016);assert.equal(g.camera.position.z,8);});
test('actual SUNRISE flight camera exempt',()=>{const g=fixture();g.flight={active:true,plane:{position:V()}};g.updateCamera(.016);assert.deepEqual(g.camera.position.toArray(),[52,23,78]);});
test('entry transition retains authored camera and does not clip',()=>{const g=fixture();g.transition={entering:true,cameraWalkStart:V(),cameraWalkOrigin:V(),pose:{carBlend:.5,position:V()},time:0,cameraStart:{position:V(0,4,8),look:V(0,1,0)}};g.updateCamera(.016);assert.deepEqual(g.camera.position.toArray(),[0,4,8]);});
