import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from './vendor/three.module.js';
import {policeTargetCount,raiseWanted,resetPolice,updatePolice,updateWantedHeat,policeRoadTarget} from './police-response.js';
import {populationRoadCandidates,populationSpawnClear} from './population-stream.js';
import {trafficControls} from './traffic-controller.js';
import {roadEdgeAllowed} from './streaming-world.js';
import {readFileSync} from 'node:fs';
const d=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function fixture(quality='medium'){
 const game={wanted:0,heat:0,time:0,quality,position:new THREE.Vector3(4.5,0,174),traffic:[],police:[],pedestrians:[],world:{colliders:[]},inCar:true,blockedRoads:[],ui:{updateWanted(){},toast(){}},signalGreen:()=>true};
 game.makeVehicle=(id,x,z,yaw)=>{const root=new THREE.Group();root.position.set(x,0,z);return{root,pos:root.position,yaw,speed:0,steer:0,condition:100,halfWidth:1,rearAxle:1.4,wheelBase:2.8,maxSteer:.55,model:{power:11}};};
 game.vehicle=game.makeVehicle('s',4.5,174,0);
 game.removeVehicle=v=>{game.police=game.police.filter(c=>c!==v);};
 game.integrate=(car,input)=>{assert(Object.values(input).filter(v=>typeof v==='number').every(Number.isFinite));car.lastInput=input;};
 game.respawn=()=>{game.arrested=true;game.wanted=0;resetPolice(game);};return game;
}
function run(g,seconds,dt=.1){for(let t=0;t<seconds;t+=dt){g.time+=dt;updatePolice(g,dt);}}
test('budgets scale to five stars and stay bounded on mobile and ultra-low',()=>{
 for(const quality of ['medium','high','low','ultralow','ultra-low']){const g=fixture(quality);let previous=0;for(let stars=0;stars<=5;stars++){g.wanted=stars;assert(policeTargetCount(g)>=previous);previous=policeTargetCount(g);}assert(previous<=10);}
 assert.equal(policeTargetCount({wanted:5,quality:'low'}),6);assert.equal(policeTargetCount({wanted:5,quality:'ultralow'}),4);
});
test('ambient officers actually spawn on clear road loops, then full five-star force dispatches gradually',()=>{
 const g=fixture();run(g,7);assert.equal(g.police.length,2);assert(g.police.every(c=>c.isPolice&&c.path.length===4&&d(c.pos,g.position)>=70));
 raiseWanted(g,5);updatePolice(g,.1);assert(g.police.length<=3);run(g,22);assert.equal(g.police.length,10);assert(g.police.every(c=>c.policeMode==='pursuit'&&c.finiteTrafficRoute));
 const positions=g.police.map(c=>c.pos.clone());run(g,8);assert.equal(g.police.length,10);g.police.forEach((c,i)=>assert(c.pos.equals(positions[i])));
});
test('low and ultra-low actual spawned actor counts respect budgets',()=>{for(const q of ['low','ultralow']){const g=fixture(q);raiseWanted(g,5);run(g,30);assert.equal(g.police.length,policeTargetCount(g));}});
test('spawns reject player, pedestrians, vehicles and building bounds',()=>{
 const g=fixture(),slot=populationRoadCandidates(g.position,0).find(p=>d(p,g.position)>70);assert(populationSpawnClear(g,slot,null,70));
 assert(!populationSpawnClear(g,g.position,null,70));g.world.colliders=[{x:slot.x,z:slot.z,w:5,d:6}];assert(!populationSpawnClear(g,slot,null,70));g.world.colliders=[];
 g.traffic=[g.makeVehicle('s',slot.x,slot.z,0)];assert(!populationSpawnClear(g,slot,null,70));g.traffic=[];g.pedestrians=[{root:{position:slot}}];assert(!populationSpawnClear(g,slot,null,70));
});
test('all patrol candidates use valid four-edge public-road loops',()=>{
 for(const pos of [{x:0,z:0},{x:2500,z:5000},{x:9000,z:8000}])for(const slot of populationRoadCandidates(pos,3)){
  const xs=slot.path.map(p=>p.x),zs=slot.path.map(p=>p.z),x=Math.min(...xs)-4.5,z=Math.min(...zs)-4.5;
  const nodes=[{x,z},{x:x+80,z},{x:x+80,z:z+80},{x,z:z+80}];assert(nodes.every((n,i)=>roadEdgeAllowed(n,nodes[(i+1)%4])));
 }
});
test('off-road player target projects onto a valid road lane',()=>{
 const p={x:39,z:37},target=policeRoadTarget(p);assert(target);assert(d(p,target)>20);const lane=n=>Math.min(Math.abs(n%80-4.5),Math.abs(n%80+4.5));assert(lane(target.x)<.01||lane(target.z)<.01);
});
test('heat de-escalates one star at a time; no global officer delete on clearing',()=>{
 const g=fixture();raiseWanted(g,5);assert.equal(g.heat,120);g.heat=.1;updateWantedHeat(g,.2);assert.equal(g.wanted,4);assert.equal(g.heat,20);
 g.wanted=1;g.heat=.1;run(g,4);const cars=g.police.slice();updateWantedHeat(g,.2);assert.equal(g.wanted,0);assert.equal(g.heat,0);assert(cars.every(c=>g.police.includes(c)));run(g,2);assert(g.police.every(c=>c.policeMode!=='pursuit'));
});
test('arrest timer counts seconds, not officer count, and resets when escaping',()=>{
 const g=fixture();raiseWanted(g,5);run(g,20);g.police.forEach((c,i)=>{c.pos.set(g.position.x+2+i*.1,0,g.position.z);});run(g,1);assert(g.arrestTimer<1.2);assert(!g.arrested);
 g.position.x+=40;run(g,.2);assert.equal(g.arrestTimer,0);g.position.x-=40;run(g,5.2);assert(g.arrested);
});
test('finite pursuit routes stop at their endpoint rather than wrapping to their start',()=>{
 const g=fixture(),v=g.makeVehicle('s',4.5,120,0);Object.assign(v,{path:[{x:4.5,z:100}],index:0,finiteTrafficRoute:true,isPolice:true,cruise:15});
 trafficControls(g,v,.1);assert.equal(v.trafficRoute.geometry.path.at(-1).z,100);v.pos.z=103;const result=trafficControls(g,v,.1);assert.equal(result.throttle,0);assert(result.brake>0);
});
test('wanted save loading resets stale patrol state and restores heat without changing save schema',()=>{
 const source=readFileSync(new URL('./game.js',import.meta.url),'utf8');assert(source.includes('this.wanted=clamp(s.wanted??0,0,5);this.heat=this.wanted?45+this.wanted*15:0;resetPolice(this);'));assert(source.includes('wanted:this.wanted'));
 const g=fixture();raiseWanted(g,5);run(g,5);resetPolice(g);assert.equal(g.police.length,0);assert.equal(g.arrestTimer,0);run(g,20);assert.equal(g.police.length,10);
});
test('real bounded bicycle physics moves patrols and brings responding officers toward the player',async()=>{
 const {stepVehicleMotion}=await import('./vehicle-physics.js');const g=fixture('low'),orig=g.makeVehicle;
 g.makeVehicle=(...args)=>{const v=orig(...args);Object.assign(v,{battery:100,model:{id:'s',power:11,max:47}});return v;};
 g.integrate=(v,input,dt)=>{stepVehicleMotion(v,input,dt);assert(Number.isFinite(v.pos.x)&&Number.isFinite(v.pos.z));const dx=Math.abs(v.pos.x-Math.round(v.pos.x/80)*80),dz=Math.abs(v.pos.z-Math.round(v.pos.z/80)*80);assert(Math.min(dx,dz)<13,'officer must stay in public road corridor');};
 run(g,1,1/60);const first=g.police[0],origin=first.pos.clone();run(g,12,1/60);assert(d(origin,first.pos)>20);
 raiseWanted(g,5);run(g,65,1/60);assert(g.police.some(c=>d(c.pos,g.position)<35),'response must physically approach the player');
});
