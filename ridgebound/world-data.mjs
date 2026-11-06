// Coordinates mirror sources/ridgebound/godot/terrain_math.gd. +Z is north; +X is west on the HUD map.
export const worldBounds={minX:-1000,maxX:1000,minZ:-200,maxZ:3800};
export const routeX=z=>105*Math.sin(z/240)+150*Math.sin(z/630);
export const checkpoints=[700,1500,2400,3300].map((z,i)=>({x:routeX(z),z,name:['松林营地','云杉山口','风息草甸','山顶观景台'][i]}));
export const branches=[
 {start:450,end:1100,offset:-260,name:'湖畔支线'},
 {start:1350,end:2100,offset:330,name:'岩脊支线'},
 {start:2350,end:3050,offset:-350,name:'高山支线'},
];
export function branchX(index,z){const branch=branches[index];if(!branch)return routeX(z);const t=Math.max(0,Math.min(1,(z-branch.start)/(branch.end-branch.start)));return routeX(z)+branch.offset*Math.sin(Math.PI*t)**2;}
export const repairStations=[
 ...checkpoints.map((point,i)=>({x:point.x+10,z:point.z,name:['松林维修站','山口维修站','河谷维修站','山巅维修站'][i]})),
 ...branches.map((branch,i)=>{const z=(branch.start+branch.end)/2;return{x:branchX(i,z)+10,z,name:branch.name+'小屋'};}),
];
export const lake={x:-330,z:900,radius:105};
export const riverX=z=>routeX(z)-125-50*Math.sin(z/280);
export function areaNameAt(z){return z<450?'松林起点':z<1100?'湖畔湿地':z<1700?'云杉山口':z<2300?'河谷':z<3050?'高山草甸':'山巅';}
export function formatDistance(meters){const value=Math.max(0,Number(meters)||0);return value>=1000?`${(value/1000).toFixed(1)} km`:`${Math.round(value)} m`;}
export function emptyState(region='forest',snowTires=false){return{x:0,y:3.05,z:0,yaw:Math.atan(105/240+150/630),speed:0,pitch:0,roll:0,region,snowTires,checkpoint:0,completed:false,time:0,distance:0,lowGear:false,awd:true,winch:null,surface:region==='snow'?'snow':'trail',slip:0,stuck:0,steering:0,damage:{body:100,tires:100,suspension:100},repairAvailable:false,anchors:[],streaming:{},cameraMode:0,areaName:'松林起点'};}
