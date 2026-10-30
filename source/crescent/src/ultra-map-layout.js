/** ULTRA-only world. No old coordinates, global registry writes or save access. */
export const MAP_ID='ultra-crescent-v1';
export const MAP_NAME='弧湾半岛';
export const CHUNK_SIZE=256, TERRAIN_STEP=8;
export const BOUNDS={minX:-896,maxX:896,minZ:-1024,maxZ:512};
export const PALETTE={sand:0xd9cfb4,grass:0x81977b,rock:0xb5b7aa,asphalt:0x555f61,paint:0xf0e8ce,concrete:0xeee9db,timber:0xb19b76,glass:0x658e99,water:0x4399aa,deepWater:0x4c92a2,metal:0x48616a,leaf:0x688a79,accent:0xc58766};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t)};
export const shoreline=x=>72+140*Math.exp(-(((x+400)/300)**2))+115*Math.exp(-(((x-530)/255)**2))-112*Math.exp(-((x/275)**2));
export const MUSEUM={id:'tide-atlas',name:'潮汐图谱馆',x:-400,z:155,floor:8.31,roof:19.11,door:{x:-400,z:128},exit:{x:-400,z:121},bounds:{minX:-448,maxX:-352,minZ:132,maxZ:184}};
export const FAIR={id:'cape-gardens',name:'海岬游园',x:535,z:112,floor:9,gate:{x:505,z:83},parking:{x:485,z:102}};
export const RIDES={wheel:{id:'wheel',name:'海岬摩天轮',price:40,duration:36,x:569,z:125,radius:13,centerY:14,gate:{x:569,z:108},exit:{x:565,z:106}},carousel:{id:'carousel',name:'木帆旋转台',price:20,duration:20,x:522,z:130,radius:5,gate:{x:522,z:120},exit:{x:516,z:119}}};
function catmull(ps,steps=10){const out=[];for(let i=0;i<ps.length-1;i++){const a=ps[Math.max(0,i-1)],b=ps[i],c=ps[i+1],d=ps[Math.min(ps.length-1,i+2)];for(let j=0;j<steps;j++){const t=j/steps,t2=t*t,t3=t2*t;out.push(['x','y','z'].reduce((o,k)=>(o[k]=.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t2+(-a[k]+3*b[k]-3*c[k]+d[k])*t3),o),{}));}}out.push({...ps.at(-1)});return out;}
const coast=[];for(let x=-760;x<=760;x+=16)coast.push({x,y:8,z:shoreline(x)-105});
const roadPoint=(x,z,y)=>({x,z,y});
const inland=catmull([roadPoint(-760,shoreline(-760)-105,8),roadPoint(-700,-180,15),roadPoint(-560,-405,35),roadPoint(-300,-535,50),roadPoint(0,-560,56),roadPoint(300,-505,43),roadPoint(615,-320,25),roadPoint(760,shoreline(760)-105,8)],12);
export const ROADS=[{id:'bay-ribbon',name:'弧湾滨海公路',width:16,kind:'asphalt',points:coast},{id:'terrace-loop',name:'云台回环路',width:16,kind:'asphalt',points:inland}, {id:'arrival-access',name:'访客停车入口',width:12,kind:'asphalt',points:[roadPoint(-590,shoreline(-590)-105,8),roadPoint(-590,35,8)]},{id:'museum-access',name:'图谱馆入口',width:12,kind:'asphalt',points:[roadPoint(-400,shoreline(-400)-105,8),roadPoint(-400,121,8)]},{id:'garden-access',name:'游园停车入口',width:12,kind:'asphalt',points:[roadPoint(485,shoreline(485)-105,8),roadPoint(485,102,9.1)]}];
// New ridgeline trails, deliberately connected to the inland road rather than 10 km away.
export const TRAILS=[
{id:'green',name:'01 海风缓坡 · 入门',width:11,kind:'dirt',color:0x628977,points:catmull([roadPoint(-300,-535,50),roadPoint(-330,-620,54),roadPoint(-230,-700,65),roadPoint(-100,-740,70),roadPoint(20,-710,65),roadPoint(25,-625,59),roadPoint(0,-560,56)],9)},
{id:'blue',name:'02 连续斜脊 · 中阶',width:10,kind:'dirt',color:0x547c98,points:catmull([roadPoint(-230,-700,65),roadPoint(-210,-815,81),roadPoint(-70,-885,93),roadPoint(80,-820,82),roadPoint(20,-710,65)],9)},
{id:'red',name:'03 岩台高线 · 挑战',width:9,kind:'dirt',color:0xb3775f,points:catmull([roadPoint(20,-710,65),roadPoint(160,-710,71),roadPoint(240,-795,90),roadPoint(220,-860,106),roadPoint(130,-875,95),roadPoint(80,-820,82)],9)}];
export const PLACES=[{id:'arrival',name:'弧湾访客停车场',x:-590,z:15,icon:'car'},{id:MUSEUM.id,name:MUSEUM.name,x:-400,z:121,icon:'building'},{id:'sky-deck',name:'海风屋顶步道',x:-343,z:128,icon:'sun'},{id:'marina',name:'白帆港步道',x:0,z:-87,icon:'boat'},{id:FAIR.id,name:FAIR.name,x:485,z:102,icon:'wheel'},{id:'ridge-trails',name:'云台越野营地',x:-300,z:-535,icon:'mountain'}];
export const SPAWN={x:-590,z:15,yaw:Math.PI/2};
export const REVIEW_VIEWS={overview:{pos:[-980,700,1000],target:[-50,0,-120],fov:43},museum:{pos:[-530,76,264],target:[-400,14,153],fov:48},entry:{pos:[-426,11,-0+118],target:[-397,13,160],fov:68},interior:{pos:[-423,10,147],target:[-371,12,167],fov:68},roof:{pos:[-478,47,211],target:[-390,18,164],fov:55},fair:{pos:[642,74,217],target:[540,13,123],fov:49},ridge:{pos:[-50,250,-440],target:[-50,70,-760],fov:55}};
export function segmentNearest(x,z,a,b){const dx=b.x-a.x,dz=b.z-a.z,t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1)),px=a.x+dx*t,pz=a.z+dz*t;return{distance:Math.hypot(x-px,z-pz),x:px,z:pz,y:a.y+(b.y-a.y)*t,t};}
export function nearestRoute(x,z,routes=[...ROADS,...TRAILS]){let best={distance:Infinity};for(const route of routes)for(let i=1;i<route.points.length;i++){const q=segmentNearest(x,z,route.points[i-1],route.points[i]);if(q.distance<best.distance)best={...q,route,segment:i-1};}return best;}
function rawHeight(x,z){const inland=shoreline(x)-z;if(inland<0)return Math.max(-16,inland*.16);return 2+smooth(0,70,inland)*6+smooth(200,960,inland)*(32+62*Math.exp(-(((x+60)/430)**2)))+Math.sin(x/130)*Math.sin(z/135)*smooth(80,260,inland)*4;}
function rectangleBlend(x,z,x0,x1,z0,z1,feather){return (1-smooth(0,feather,Math.max(x0-x,x-x1,0)))*(1-smooth(0,feather,Math.max(z0-z,z-z1,0)));}
const heightCache=new Map();
export function heightVertex(x,z){const key=x+":"+z;if(heightCache.has(key))return heightCache.get(key);const h=computeHeightVertex(x,z);if(heightCache.size>=65536)heightCache.clear();heightCache.set(key,h);return h;}
function computeHeightVertex(x,z){let h=rawHeight(x,z);for(const p of [[-485,-329,91,207,8], [465,601,63,166,9],[-637,-548,13,73,8],[-40,45,-130,-68,8]]){const w=rectangleBlend(x,z,...p.slice(0,4),24);h=h*(1-w)+p[4]*w;}
 const q=nearestRoute(x,z);if(q.distance<q.route.width/2+40){const w=1-smooth(q.route.width/2+12,q.route.width/2+40,q.distance);h=h*(1-w)+q.y*w;}
 return h;
}
// Exact planar interpolation of the same 8 m diagonal as visible/native terrain.
export function groundHeight(x,z){const s=TERRAIN_STEP,x0=Math.floor(x/s)*s,z0=Math.floor(z/s)*s,u=(x-x0)/s,v=(z-z0)/s,a=heightVertex(x0,z0),b=heightVertex(x0+s,z0),c=heightVertex(x0,z0+s),d=heightVertex(x0+s,z0+s);return u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);}
export function terrainKind(x,z){const q=nearestRoute(x,z);if(q.route.kind==='dirt'&&q.distance<q.route.width/2+1)return'sand';const inland=shoreline(x)-z;return inland<35?'sand':z< -680?'rock':'grass';}
export function routeDistance(route){return route.points.slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-route.points[i].x,p.z-route.points[i].z),0);}
export function routeMaxGrade(route){return route.points.slice(1).reduce((m,p,i)=>Math.max(m,Math.abs(p.y-route.points[i].y)/Math.hypot(p.x-route.points[i].x,p.z-route.points[i].z)),0);}
export function buildHeightfield(cx,cz){const samples=CHUNK_SIZE/TERRAIN_STEP+1,heights=[];for(let iz=0;iz<samples;iz++)for(let ix=0;ix<samples;ix++)heights.push(heightVertex(cx*CHUNK_SIZE+ix*TERRAIN_STEP,cz*CHUNK_SIZE+iz*TERRAIN_STEP));return{width:samples,depth:samples,heights,spacingX:TERRAIN_STEP,spacingZ:TERRAIN_STEP,origin:[cx*CHUNK_SIZE+CHUNK_SIZE/2,0,cz*CHUNK_SIZE+CHUNK_SIZE/2],originConvention:'center',minX:cx*CHUNK_SIZE,minZ:cz*CHUNK_SIZE};}
export function inWorld(x,z){return x>=BOUNDS.minX&&x<=BOUNDS.maxX&&z>=BOUNDS.minZ&&z<=BOUNDS.maxZ;}
// Navigation follows authored curves; no legacy city grid or cross-country straight line.
let navigationGraph;
function graph(){if(navigationGraph)return navigationGraph;const nodes=[],edges=[],routeNodes=new Map();for(const r of [...ROADS,...TRAILS]){const list=[];for(const p of r.points){const id=nodes.length;nodes.push({...p,route:r.id});edges.push([]);list.push(id);}routeNodes.set(r.id,list);for(let i=1;i<list.length;i++){const a=list[i-1],b=list[i],d=Math.hypot(nodes[a].x-nodes[b].x,nodes[a].z-nodes[b].z);edges[a].push([b,d]);edges[b].push([a,d]);}}
 for(let a=0;a<nodes.length;a++)for(let b=a+1;b<nodes.length;b++){if(nodes[a].route===nodes[b].route)continue;const d=Math.hypot(nodes[a].x-nodes[b].x,nodes[a].z-nodes[b].z);if(d<17&&Math.abs(nodes[a].y-nodes[b].y)<1.6){edges[a].push([b,d]);edges[b].push([a,d]);}}return navigationGraph={nodes,edges,routeNodes};}
export function planRoute(from,to,{allowTrails=false}={}){const g=graph(),routes=allowTrails?[...ROADS,...TRAILS]:ROADS,a=nearestRoute(from.x,from.z,routes),b=nearestRoute(to.x,to.z,routes);if(a.distance>90||b.distance>90)return{ok:false,reason:'outside-road-access',points:[]};const nodes=g.nodes.slice(),edges=g.edges.map(v=>v.slice()),attach=q=>{const id=nodes.length;nodes.push({x:q.x,z:q.z,y:q.y});edges.push([]);for(const node of g.routeNodes.get(q.route.id).slice(q.segment,q.segment+2)){const d=Math.hypot(q.x-nodes[node].x,q.z-nodes[node].z);edges[id].push([node,d]);edges[node].push([id,d]);}return id;},start=attach(a),end=attach(b),dist=nodes.map(()=>Infinity),prev=nodes.map(()=>-1),seen=new Set();dist[start]=0;
 for(let k=0;k<nodes.length;k++){let u=-1,best=Infinity;for(let i=0;i<nodes.length;i++)if(!seen.has(i)&&dist[i]<best){u=i;best=dist[i];}if(u<0||u===end)break;seen.add(u);for(const [v,cost]of edges[u]){if(!allowTrails&&TRAILS.some(r=>r.id===nodes[v].route))continue;if(dist[u]+cost<dist[v]){dist[v]=dist[u]+cost;prev[v]=u;}}}
 if(!Number.isFinite(dist[end]))return{ok:false,reason:'disconnected',points:[]};const ids=[];for(let n=end;n!==-1;n=prev[n])ids.push(n);const points=ids.reverse().map(i=>({x:nodes[i].x,z:nodes[i].z,y:nodes[i].y}));return{ok:true,mapId:MAP_ID,distance:dist[end],points,startAccessDistance:a.distance,endAccessDistance:b.distance};}
