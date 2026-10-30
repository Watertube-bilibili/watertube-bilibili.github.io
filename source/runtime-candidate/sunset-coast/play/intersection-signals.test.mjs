import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from './vendor/three.module.js';
import {signalState,signalLensColor,approachAxis,crossingOccupied} from './intersection-signals.js';
import {PilotController} from './pilot.js';
import {trafficControls} from './traffic-controller.js';
import {stepVehicleMotion} from './vehicle-physics.js';
import {createStreamingWorld} from './streaming-world.js';
import {readFileSync} from 'node:fs';
test('orthogonal phases never share green or amber, with amber then both red',()=>{
 for(let i=-3;i<8;i++)for(let j=-5;j<6;j++)for(let t=-34;t<68;t+=.125){const a=signalState(t,i,j,'ns'),b=signalState(t,i,j,'ew');assert(a==='red'||b==='red');}
 for(const [t,ns,ew]of [[0,'green','red'],[11.99,'green','red'],[12,'amber','red'],[14.99,'amber','red'],[15,'red','red'],[16.99,'red','red'],[17,'red','green'],[29,'red','amber'],[32,'red','red'],[34,'green','red']]){assert.equal(signalState(t,0,0,'ns'),ns);assert.equal(signalState(t,0,0,'ew'),ew);}
});
test('a three-lens head illuminates exactly one real color including amber',()=>{for(const state of ['green','amber','red']){assert.equal(['red','amber','green'].filter(l=>signalLensColor(state,l)!==0x17232a).length,1);}assert.equal(signalLensColor('amber','amber'),0xffc033);});
test('route crossing axis is incoming direction, not player heading or turn exit',()=>{
 for(const [pos,route,axis]of [[{x:4.5,z:65},[{x:4.5,z:-40}],'ns'],[{x:-65,z:4.5},[{x:4.5,z:4.5},{x:4.5,z:-40}],'ew']]){const p=new PilotController({vehicle:{pos,steer:0}});p.setRoute(route);const e=p.crossings.find(e=>e.x===0&&e.z===0);assert(e);assert.equal(e.axis,axis);assert.equal(approachAxis(e,{yaw:2}),axis);}
});
const car=(x,z,yaw)=>({pos:new THREE.Vector3(x,0,z),root:{visible:true},yaw,speed:0,steer:0,condition:100,battery:100,halfWidth:1,rearAxle:1.4,wheelBase:2.8,maxSteer:.55,model:{id:'s',power:11,max:47},wait:0,index:0,finiteTrafficRoute:true,cruise:8});
test('green NPC approach yields to perpendicular clearing vehicle, never freezes cars inside junction',()=>{
 const a=car(4.5,25,0),b=car(1,4.5,-Math.PI/2),event={x:0,z:0,axis:'ns'},g={vehicle:a,traffic:[b]};assert(crossingOccupied(g,a,event));b.root.visible=false;assert(!crossingOccupied(g,a,event));b.root.visible=true;b.pos.y=10;assert(!crossingOccupied(g,a,event));b.pos.y=0;a.pos.z=12;assert(!crossingOccupied(g,a,event));
});
test('actual bicycle fixtures: EW traffic brakes at red and NS traffic crosses, EW releases on its green',()=>{
 const ns=car(4.5,55,0),ew=car(-55,4.5,-Math.PI/2);ns.path=[{x:4.5,z:-120}];ew.path=[{x:120,z:4.5}];
 const g={vehicle:car(500,500,0),traffic:[ns,ew],police:[],pedestrians:[],time:0,signalGreen(event,v){return signalState(this.time,Math.round(event.x/80),Math.round(event.z/80),approachAxis(event,v))==='green';}};
 let nsCrossed=false,ewCrossed=false,minRedStop=Infinity;
 for(let tick=0;tick<34*60;tick++){g.time=tick/60;for(const v of [ns,ew]){const input=trafficControls(g,v,1/60);stepVehicleMotion(v,input,1/60);assert(Number.isFinite(v.pos.x)&&Number.isFinite(v.pos.z));}
  if(ns.pos.z<-19)nsCrossed=true;if(ew.pos.x>-19)ewCrossed=true;
  if(g.time<17){minRedStop=Math.min(minRedStop,-ew.pos.x);assert(ew.pos.x<=-20,'red traffic center remains before stop bar');}
 }
 assert(nsCrossed);assert(ewCrossed);assert(minRedStop>=20);
});
test('streamed four faces use corresponding axis and exact same lamp clock through amber/all-red',()=>{
 const scene=new THREE.Scene(),world=createStreamingWorld(scene,[]);world.update({x:800,z:800},true);
 for(const time of [0,12,15,17,29,32,34]){world.updateSignals(time);for(const chunk of world.chunks.values())if(chunk.signalMesh){for(let index=0;index<chunk.lampGrid.length;index++){const e=chunk.lampGrid[index],actual=new THREE.Color(),expected=new THREE.Color(signalLensColor(signalState(time,e.i,e.j,e.axis),e.lens));chunk.signalMesh.getColorAt(index,actual);assert(Math.abs(actual.r-expected.r)<1e-6&&Math.abs(actual.g-expected.g)<1e-6);}}}world.dispose();
});
test('all controllers pass actual vehicle; player ADAS does not use omniscient crossing occupancy',()=>{
 for(const name of ['traffic-controller.js','robotaxi.js']){const s=readFileSync(new URL('./'+name,import.meta.url),'utf8');assert(s.includes('crossingOccupied('));assert(/signalGreen\?\.\((crossing|event),v\)/.test(s));}
 const pilot=readFileSync(new URL('./pilot.js',import.meta.url),'utf8');assert(pilot.includes("signal==='amber'&&speed>1"));assert(!pilot.includes('crossingOccupied('));
});
test('amber dilemma zone clears moving NPCs but never grants a new red commitment',()=>{
 for(const [state,speed,z,commit] of [['amber',10,30,true],['amber',10,65,false],['amber',0,22,false],['red',10,30,false]]){
  const v=car(4.5,z,0);v.speed=speed;v.path=[{x:4.5,z:-120}];const g={vehicle:car(500,500,0),traffic:[v],police:[],pedestrians:[],time:12,signalState:()=>state};trafficControls(g,v,1/60);assert.equal(!!v.trafficRoute.geometry.crossingCommit,commit,`${state}/${speed}/${z}`);
 }
});
