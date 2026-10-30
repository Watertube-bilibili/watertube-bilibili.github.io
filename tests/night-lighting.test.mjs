import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../source/runtime-candidate/sunset-coast/play/vendor/three.module.js';
import {nightLightAmount,nightLightBudget,createNightLighting,nearestNightLamps,registerFacadeNightMask,configureNightWindows,createStreetBulbMaterial} from '../source/runtime-candidate/sunset-coast/play/night-lighting.js';
import {attachVehicleLights,updateVehicleLights,vehicleHeadlampAnchors,setVehicleTurnSignal,setVehicleHazards,disposeVehicleLights} from '../source/runtime-candidate/sunset-coast/play/vehicle-lights.js';
import {solarState} from '../source/runtime-candidate/sunset-coast/play/sky-cycle.js';
const spotLights=system=>system.group.children.filter(o=>o.isSpotLight);
function car(){const root=new THREE.Group();root.name='test-car';for(const [name,z] of [['Vehicle Headlamp',-2],['Vehicle Tail Lamp',2]]){const m=new THREE.MeshStandardMaterial({emissive:0xffffff});m.name=name;const mesh=new THREE.Mesh(new THREE.BoxGeometry(1.7,.12,.1),m);mesh.position.set(0,.7,z);mesh.userData.semantic=3;root.add(mesh);}return attachVehicleLights({root,dimensions:{width:2,length:4.6,height:1.5},speed:5});}
function scene(){const vehicle=car(),scene=new THREE.Scene(),world={nightLamps:[{x:5,y:7.7,z:0},{x:20,y:7.7,z:0}],chunks:new Map(),stats:{colliderRevision:0},nightMaterials:[createStreetBulbMaterial()]};scene.add(vehicle.root);return {scene,vehicle,world,traffic:[],inCar:true,quality:'high',performanceProfile:{mobile:false},weather:'clear',position:new THREE.Vector3(),camera:{position:new THREE.Vector3()},skyCycle:{state:solarState(23*60)}};}
test('night switch is continuous, has full day off and full night on',()=>{
 assert.equal(nightLightAmount(solarState(13*60)),0);assert.equal(nightLightAmount(solarState(1*60)),1);
 assert(Math.abs(nightLightAmount({altitude:0})-.5)<1e-12);
 for(let m=0;m<1440;m+=1)assert(Math.abs(nightLightAmount(solarState(m))-nightLightAmount(solarState(m+.01)))<.002);
});
test('strict bounded light budget and mobile always uses no additional shadows',()=>{
 for(const [q,n] of [['low',3],['medium',6],['high',9]]){const b=nightLightBudget(q);assert.equal(b.player+b.traffic+b.street,n);assert.equal(b.shadows,q==='high');}
 assert.deepEqual(nightLightBudget('high',true),nightLightBudget('low'));
});
test('pool follows world transforms, switches vehicle and exits without leaking lights',()=>{
 const game=scene(),system=createNightLighting(game);system.update(.2);const lights=spotLights(system);assert.equal(lights.length,9);assert.equal(lights.filter(l=>l.castShadow).length,2);assert(lights[0].intensity>0);
 const first=lights[0].position.clone();game.vehicle.root.position.set(100,5,200);game.vehicle.root.rotation.y=Math.PI/2;system.update(.1);assert(lights[0].position.distanceTo(first)>100);assert(lights[0].target.position.x<lights[0].position.x);
 const replacement=car();game.scene.add(replacement.root);game.vehicle=replacement;system.update(.1);assert(lights[0].position.x<0);assert.equal(spotLights(system)[0],lights[0]);
 game.inCar=false;system.update(.1);assert.equal(lights[0].intensity,0);assert.equal(lights[1].intensity,0);
 game.quality='low';system.update(.1);assert.equal(spotLights(system).length,3);assert(spotLights(system).every(l=>!l.castShadow));
 system.dispose();assert.equal(system.group.parent,null);assert.equal(system.group.children.length,0);system.dispose();
});
test('traffic lights are shared pool slots and release parked, hidden and dormant cars',()=>{
 const game=scene();game.inCar=false;game.traffic=Array.from({length:40},()=>car());game.traffic.forEach(v=>{game.scene.add(v.root);updateVehicleLights(v,0,{active:true,night:1});});
 const system=createNightLighting(game);system.update(.3);const lights=spotLights(system),npc=lights.filter(l=>l.name.startsWith('traffic'));assert.equal(npc.length,2);assert(npc.every(l=>l.intensity>0));assert.equal(game.traffic.reduce((n,v)=>n+v.root.children.filter(o=>o.isLight).length,0),0);
 game.traffic.forEach(v=>v.parked=true);system.update(.1);assert(npc.every(l=>l.intensity===0));
 game.traffic[0].parked=false;game.traffic[0].root.visible=false;system.update(.1);assert(npc.every(l=>l.intensity===0));
 game.traffic[0].root.visible=true;game.traffic[0].populationDormant=true;system.update(.1);assert(npc.every(l=>l.intensity===0));assert.equal(spotLights(system).length,9);system.dispose();
});
test('nearby street lights use loaded chunks only and disappear after eviction',()=>{
 const game=scene(),p={x:1,y:15,z:1};game.world.chunks.set('a',{nightLamps:[p]});assert.equal(nearestNightLamps(game.world,game.position,1)[0],p);
 const system=createNightLighting(game);system.update(.2);let street=spotLights(system).filter(l=>l.name.startsWith('street'));assert.equal(street[0].position.y,14.9);
 game.world.chunks.clear();game.world.stats.colliderRevision++;system.update(0);assert(Math.abs(street[0].position.y-7.6)<1e-10);
 game.position.set(1000,0,1000);system.update(.2);assert(street.every(l=>l.intensity===0));system.dispose();
});
test('window emission is masked, shares facade UV scale, disposes its own texture',()=>{
 const t=new THREE.DataTexture(new Uint8Array(16),2,2),mask=new THREE.DataTexture(new Uint8Array([0,0,0,255,255,255,255,255,0,0,0,255,0,0,0,255]),2,2);registerFacadeNightMask(t,mask);
 const map=t.clone();map.repeat.set(2,3);map.wrapS=map.wrapT=THREE.RepeatWrapping;const m=new THREE.MeshStandardMaterial({map});m.onBeforeCompile=s=>s.fragmentShader='varying vec2 coastFacadeUV;\n'+s.fragmentShader;configureNightWindows(m,t);
 assert.notEqual(m.emissiveMap,mask);assert.deepEqual(m.emissiveMap.repeat,map.repeat);assert.equal(m.emissiveIntensity,0);assert.equal(m.emissiveMap.image.data[0],0);assert.equal(m.emissiveMap.image.data[4],255);
 const shader={fragmentShader:'#include <emissivemap_fragment>'};m.onBeforeCompile(shader);assert(shader.fragmentShader.includes('texture2D(emissiveMap,coastFacadeUV)'));
 let disposed=false;m.emissiveMap.addEventListener('dispose',()=>disposed=true);m.dispose();assert(disposed);
});
test('day/night controls bulbs and daytime bad-weather beams without new clocks',()=>{
 const game=scene(),system=createNightLighting(game);system.update();assert(game.world.nightMaterials[0].emissiveIntensity>2);
 game.skyCycle.state=solarState(12*60);system.update();assert.equal(system.amount,0);assert.equal(system.group.visible,false);assert.equal(game.world.nightMaterials[0].emissiveIntensity,0);
 game.weather='rain';system.update();assert.equal(system.group.visible,true);assert(spotLights(system)[0].intensity>0);assert.equal(game.world.nightMaterials[0].emissiveIntensity,0);system.dispose();
});
test('brakes/indicators remain actuator-driven and do not repaint semantic objects',()=>{
 const v=car();updateVehicleLights(v,0,{active:true,night:0});const [head,tail]=v.vehicleLights.bindings;assert.equal(tail.material.emissiveIntensity,.32);assert(head.material.emissiveIntensity>0);
 v.brakeAmount=1;updateVehicleLights(v,.05,{active:true,night:0});assert(tail.material.emissiveIntensity>2);setVehicleTurnSignal(v,'left');assert(v.lightState.leftOn&&!v.lightState.rightOn);setVehicleHazards(v,true);assert(v.lightState.leftOn&&v.lightState.rightOn);
 updateVehicleLights(v,.45,{active:true,night:1});assert(!v.lightState.blinkOn);assert(v.root.children.every(o=>o.userData.semantic===3));assert(v.root.children.every(o=>o.layers.mask===1));
 updateVehicleLights(v,0,{active:false,night:1});assert.equal(v.lightState.active,false);assert.equal(v.lightState.brake,0);assert.equal(tail.material.emissiveIntensity,.32);disposeVehicleLights(v);
});
test('render uses one existing loop and no decorative objects contaminate sensor layer 0',()=>{
 const source=readFileSync(new URL('../source/runtime-candidate/sunset-coast/play/night-lighting.js',import.meta.url),'utf8'),game=readFileSync(new URL('../source/runtime-candidate/sunset-coast/play/game.js',import.meta.url),'utf8'),sensor=readFileSync(new URL('../source/runtime-candidate/sunset-coast/play/sensor.js',import.meta.url),'utf8');
 assert(!/requestAnimationFrame|setInterval|setTimeout|new THREE\.(Mesh|Sprite|PointLight)\(|physics\./.test(source));
 assert(game.includes('this.skyCycle?.update();this.nightLighting?.update(delta);this.updateVehicleLighting(delta);try{this.browserWorldLifecycle?.checkpoint();}catch{return;}this.renderer.render'));
 assert(sensor.includes('MeshBasicMaterial'));const fixture=scene(),system=createNightLighting(fixture);system.update();assert(system.group.children.every(o=>!o.isMesh&&!o.isSprite));system.dispose();
});
