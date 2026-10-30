import {buildMall} from './mall-detail.js';
// Metres, Y up. Authored topology, never the legacy 80 m grid.
export const BOUNDS={minX:-2000,maxX:38000,minZ:-24000,maxZ:24000};
export const CHUNK=400;
export const nodes={
 promenade:[0,600,4],market:[600,600,4],junction:[1200,600,4],marina:[0,1800,4],southTown:[2400,4000,12],
 southApproach:[1200,1100,4],mall:[1200,0,4],northTown:[2400,-3200,16],ringWest:[600,-800,4],ringEast:[2200,-800,4],
 interchange:[4000,600,20],northGate:[8000,-10000,80],northCape:[12000,-22000,100],
 southGate:[7000,12000,45],southCape:[14000,22000,10],eastTown:[20000,2000,55],farTown:[35000,-18000,160],
 quarryGate:[5200,-2600,45],quarryLow:[6500,-3400,65],quarryBend:[7400,-2600,110],quarryTop:[8000,-4200,170],
 ridgeA:[9000,-5000,210],ridgeB:[10800,-3200,245],ridgeC:[13000,-5800,330],ridgeExit:[15000,-8500,250]
};
const e=(a,b,type='avenue')=>({a,b,type,width:type==='highway'?38:type==='trail'?9:30});
export const edges=[e('promenade','market'),e('market','junction'),e('promenade','marina'),e('marina','southTown'),e('southTown','southApproach'),e('southApproach','junction'),e('junction','mall'),e('mall','ringWest'),e('ringWest','market'),e('mall','ringEast'),e('ringEast','interchange'),e('ringEast','northTown'),e('northTown','northGate'),e('junction','interchange'),e('interchange','northGate','highway'),e('northGate','northCape','highway'),e('interchange','southGate','highway'),e('southGate','southCape','highway'),e('interchange','eastTown','highway'),e('eastTown','farTown','highway'),e('farTown','northCape','highway'),e('southCape','eastTown','highway'),e('northTown','quarryGate'),e('quarryGate','quarryLow','trail'),e('quarryLow','quarryBend','trail'),e('quarryBend','quarryTop','trail'),e('quarryTop','ridgeA','trail'),e('ridgeA','ridgeB','trail'),e('ridgeB','ridgeC','trail'),e('ridgeC','ridgeExit','trail'),e('ridgeExit','northGate','trail')].map((v,i)=>({...v,id:i}));
export const places=[{id:'mall',name:'TIDELINE / Estuary Galleria',x:1200,z:125},{id:'junction',name:'Grand Estuary Junction',x:1200,z:600},{id:'harbor',name:'Old Ferry & Lighthouse',x:0,z:1800},{id:'quarry',name:'Red Quarry Trailhead',x:5200,z:-2600},{id:'ridge',name:'Windbreak Ridge',x:10800,z:-3200},{id:'north',name:'North Cape',x:12000,z:-22000},{id:'east',name:'East Orchard Town',x:20000,z:2000}];
export function project(x,z,e){const a=nodes[e.a],b=nodes[e.b],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));return{x:a[0]+t*dx,z:a[1]+t*dz,y:a[2]+t*(b[2]-a[2]),distance:Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz),t,edge:e};}
export function nearestRoad(x,z){let best;for(const e of edges){const p=project(x,z,e);if(!best||p.distance-e.width/2<best.distance-best.edge.width/2)best=p;}return best;}
function rawHeight(x,z){if(x<-110)return -2;if(x>1220&&x<1360&&z>80&&z<260)return 4;if(x>490&&x<750&&z>440&&z<710)return 4;const p=nearestRoad(x,z),base=4+Math.min(1,Math.max(0,x-2200)/2500)*(25*(1+Math.sin(x/1700)*Math.cos(z/2100))+Math.max(0,x-5000)*.004);const d=p.distance-p.edge.width/2;if(d<4)return p.y;const t=Math.min(1,d/130),s=t*t*(3-2*t);return p.y*(1-s)+base*s;}
// The rendered terrain uses this exact 10 m, two-triangle lattice.
export function groundHeight(x,z){const step=10,x0=Math.floor(x/step)*step,z0=Math.floor(z/step)*step,u=(x-x0)/step,v=(z-z0)/step,a=rawHeight(x0,z0),b=rawHeight(x0+step,z0),c=rawHeight(x0,z0+step),d=rawHeight(x0+step,z0+step);return u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);}
export function surfaceAt(x,z){const p=nearestRoad(x,z);return p.distance<p.edge.width/2?p.edge.type==='trail'?'gravel':'asphalt':x<-110?'water':'earth';}
// ESTUARY closures use numeric authored edge IDs only, never legacy grid keys.
// Invalid closure input fails closed instead of silently routing through it.
export function blockedEdgeIds(blocked=[]){
 if(!Array.isArray(blocked)&&!(blocked instanceof Set))return null;
 const ids=new Set();
 for(const id of blocked){if(!Number.isInteger(id)||!edges.some(e=>e.id===id))return null;ids.add(id);}
 return ids;
}
export function route(from,to,blocked=[]){
 const closed=blockedEdgeIds(blocked);
 if(!closed||typeof from!=='string'||typeof to!=='string'||!Object.hasOwn(nodes,from)||!Object.hasOwn(nodes,to))return null;
 const q=[[0,from,[],[]]],seen=new Set();
 while(q.length){
  q.sort((a,b)=>a[0]-b[0]);const [cost,n,path,usedEdges]=q.shift();
  if(seen.has(n))continue;
  if(n===to)return{distance:cost,nodes:[...path,n],edges:usedEdges};
  seen.add(n);
  for(const e of edges){
   if(closed.has(e.id))continue;
   const m=e.a===n?e.b:e.b===n?e.a:null;
   if(m&&!seen.has(m)){const a=nodes[n],b=nodes[m];q.push([cost+Math.hypot(a[0]-b[0],a[1]-b[1]),m,[...path,n],[...usedEdges,e.id]]);}
  }
 }
 return null;
}
export const structures=[];
function box(id,x,y,z,w,h,d,color,solid=true){structures.push({id,x,y,z,w,h,d,color,solid});}
export function shell(id,x,z,w,d,h,color){const y=groundHeight(x,z);box(id+'-floor',x,y+.08,z,w,.16,d,0xd9cdb7,false);box(id+'-back',x,y+h/2,z-d/2,w,h,1,color);box(id+'-left',x-w/2,y+h/2,z,1,h,d,color);box(id+'-right',x+w/2,y+h/2,z,1,h,d,color);for(const s of [-1,1])box(id+'-front',x+s*(w/4+3),y+h/2,z+d/2,w/2-6,h,1,color);box(id+'-lintel',x,y+h-1.5,z+d/2,12,3,1,color);return y;}
const my=4;buildMall(box,my);
// Parking is a real surface, contiguous foot access; 36 spaces, no road overlap.
box('parking',1290,my+.06,211,110,.12,66,0x58626b,false);box('parking-driveway',1225,4.07,211,25,.14,12,0x58626b,false);
for(let r=0;r<2;r++)for(let c=0;c<18;c++)box('parking-line',1240+c*5.8,my+.14,193+r*34,.12,.02,10,0xefe9d7,false);
for(const x of [1244,1336])box('entry-bollard',x,my+.65,162,.6,1.3,.6,0xa87640);
for(const [i,x,z] of [[0,550,680],[1,690,680],[2,530,470],[3,700,470]])shell('market-'+i,x,z,40,36,9,0xdbab80);
for(let i=0;i<12;i++){const x=2430+(i%4)*75,z=-3220+Math.floor(i/4)*65;shell('suburb-'+i,x,z,24,24,7,0xc3cbb5);}
const ly=groundHeight(50,1820);for(let i=0;i<8;i++)box('lighthouse',50,ly+3+i*5,1820,10-i*.7,5,10-i*.7,i%2?0xd4d6cf:0xa75a45);box('lighthouse-lantern',50,ly+44,1820,7,5,7,0xf0b455,false);
// Quarry boulders are collision-backed rather than decorative drive-through props.
for(let i=0;i<34;i++){const x=6500+Math.sin(i*3)*900,z=-3300+Math.cos(i*4)*500;if(nearestRoad(x,z).distance>30)box('quarry-rock',x,groundHeight(x,z)+4,z,12,8,10,0xa26648);}
for(let k=0;k<4;k++){const a=k*Math.PI/2;box('junction-median',1200+Math.sin(a)*68,4.46,600+Math.cos(a)*68,k%2?50:1,.45,k%2?1:50,0xb9b9a6);}
// Authored pocket parks and avenue planting; no trunks in roadway clearance.
for(let i=0;i<40;i++){const x=820+(i%8)*38,z=160+Math.floor(i/8)*64;const p=nearestRoad(x,z);if(p.distance>p.edge.width/2+12){const h=groundHeight(x,z);box('tree-trunk',x,h+2,z,.7,4,.7,0x68533c);box('tree-crown',x,h+6,z,5,6,5,0x567d5e,false);}}
export function collides(x,z,r=.55){const y=groundHeight(x,z);return structures.some(b=>b.solid&&b.y-b.h/2<y+1.8&&b.y+b.h/2>y+.15&&x>b.x-b.w/2-r&&x<b.x+b.w/2+r&&z>b.z-b.d/2-r&&z<b.z+b.d/2+r);}
export function signalPhase(seconds){const t=((seconds%28)+28)%28;return t<11?'NS_GREEN':t<14?'ALL_RED':t<25?'EW_GREEN':'ALL_RED';}
export function move(p,dx,dz,r=.55){const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.4));let x=p.x,z=p.z;for(let i=0;i<steps;i++){const nx=x+dx/steps,nz=z+dz/steps;if(nx<BOUNDS.minX||nx>BOUNDS.maxX||nz<BOUNDS.minZ||nz>BOUNDS.maxZ||surfaceAt(nx,nz)==='water')break;if(!collides(nx,z,r))x=nx;if(!collides(x,nz,r))z=nz;}return{x,z};}
