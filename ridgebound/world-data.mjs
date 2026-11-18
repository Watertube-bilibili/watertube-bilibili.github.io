// Metres and route definitions mirror Godot's terrain_math.gd. +Z points north.
export const worldBounds = {minX:-8000,maxX:8000,minZ:-2000,maxZ:22000};
export const finishZ = 20600;

export function routeX(z) {
  const t = Math.max(0, Math.min(1, (z - 850) / (2600 - 850)));
  const blend = t * t * (3 - 2 * t);
  const valley = 105 * Math.sin(z / 240) + 150 * Math.sin(z / 630);
  const expedition = 2050 * Math.sin(z / 2550) + 1100 * Math.sin(z / 4750);
  return valley + (expedition - valley) * blend;
}

export const checkpoints = [700,6200,13200,finishZ].map((z,i) => ({
  x:routeX(z), z, name:['松林营地','云杉山口','风息草甸','山顶观景台'][i],
}));
export const branches = [
  {start:320,end:2050,offset:-1250,name:'湖畔环线'},
  {start:2950,end:6700,offset:4200,name:'红岩高原'},
  {start:6500,end:10500,offset:-5200,name:'苔原湿地'},
  {start:10500,end:14300,offset:-5200,name:'风蚀台地'},
  {start:10700,end:14300,offset:6500,name:'云岭横道'},
  {start:14500,end:17800,offset:6500,name:'峡谷环线'},
  {start:17700,end:21500,offset:-6300,name:'冰川北线'},
];
export function branchX(index,z) {
  const branch = branches[index];
  if (!branch || z < branch.start || z > branch.end) return routeX(z);
  const t = (z - branch.start) / (branch.end - branch.start);
  return routeX(z) + branch.offset * Math.sin(Math.PI * t) ** 2;
}
export const repairStations = [
  ...checkpoints.map(({x,z},i) => ({x:x+10,z,name:['松林维修站','山口维修站','河谷维修站','山巅维修站'][i]})),
  ...branches.map(({start,end,name},i) => {
    const z = (start + end) / 2;
    return {x:branchX(i,z)+10,z,name:name+'小屋'};
  }),
  ...[3000,8800,16200].map((z,i) => ({
    x:routeX(z)+10,z,name:['岔口补给站','湿地补给站','峡口补给站'][i],
  })),
];
export const lakes = [
  {x:-1700,z:1700,radius:395,name:'镜湖'},
  {x:-5450,z:8800,radius:530,name:'芦苇湖'},
  {x:5700,z:12900,radius:420,name:'云镜湖'},
];
export const riverX = z => routeX(z) - 900 - 260 * Math.sin(z / 480);

const areaBounds = [700,3300,7200,11200,15400,18300,Infinity];
const forestAreas = ['松风林地','镜湖谷','红岩高原','苔原湿地','云岭台地','断层峡谷','山巅雪线'];
const snowAreas = ['冰川前哨','冰镜湖','冻岩山口','冻土湿地','白岭台地','冰谷','珠峰雪线'];
export function areaNameAt(z,region='forest') {
  return (region === 'snow' ? snowAreas : forestAreas)[areaBounds.findIndex(end => z < end)];
}

export function formatDistance(meters){const value=Math.max(0,Number(meters)||0);return value>=1000?`${(value/1000).toFixed(1)} km`:`${Math.round(value)} m`;}
export function emptyState(region='forest',snowTires=false){return{x:0,y:3.05,z:0,yaw:Math.atan(105/240+150/630),speed:0,pitch:0,roll:0,region,snowTires,checkpoint:0,completed:false,time:0,distance:0,lowGear:false,awd:true,winch:null,surface:region==='snow'?'snow':'trail',slip:0,stuck:0,steering:0,damage:{body:100,tires:100,suspension:100},repairAvailable:false,anchors:[],streaming:{},cameraMode:0,areaName:areaNameAt(0,region)};}
