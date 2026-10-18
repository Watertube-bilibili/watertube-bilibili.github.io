/** One game unit is one metre. Terrain and road geometry share this heightfield. */
export const GRID=80;
export const WORLD_LIMIT=16000;
export const WORLD_MIN_X=-276;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t)};
export const HIGHWAY=Object.freeze({id:'coastal-express',name:'H1 海岸纵贯高速',x:3200,zMin:-14400,zMax:14400,width:34,exitSpacing:1600,approachLength:400,elevation:9,speedLimit:120/3.6,exits:Object.freeze(Array.from({length:19},(_,i)=>(i-9)*1600))});
export const AIRPORTS=Object.freeze([
 {id:'coast-airport',regionId:'coast',name:'sunset coast国际机场',code:'NCI',x:6484.5,z:1600,yaw:0,arrival:{x:6484.5,z:1600,yaw:0},terminal:{x:6530,z:1560},runway:{x:6880,z:1600,length:1760,width:46},bounds:{minX:6480,maxX:7280,minZ:640,maxZ:2560},altitude:12},
 {id:'plateau-airport',regionId:'plateau',name:'云岭高原机场',code:'YLP',x:11684.5,z:-9600,yaw:0,arrival:{x:11684.5,z:-9600,yaw:0},terminal:{x:11730,z:-9640},runway:{x:12080,z:-9600,length:1760,width:46},bounds:{minX:11680,maxX:12480,minZ:-10560,maxZ:-8640},altitude:205}
]);
/** The mountain preserve uses the existing 80 m graph, with a single graded
 * access road and a summit turnaround. All older places/region IDs are stable. */
export const MOUNTAIN=Object.freeze({id:'sky-ridge',name:'天脊山脉',bounds:Object.freeze({minX:8640,maxX:15680,minZ:4000,maxZ:12800}),width:22,maxGrade:.12,speedLimit:50/3.6,
 points:Object.freeze([
  {x:8640,z:8000,y:null},{x:9280,z:8000,y:85},{x:9280,z:5600,y:200},
  {x:14400,z:5600,y:445},{x:14400,z:7200,y:535},{x:10080,z:7200,y:775},
  {x:10080,z:9600,y:930},{x:14400,z:9600,y:1150},
  {x:14560,z:9600,y:1150},{x:14560,z:9760,y:1150},{x:14400,z:9760,y:1150},{x:14400,z:9600,y:1150}
 ].map(Object.freeze))});
export const MOUNTAIN_ROADS=Object.freeze(MOUNTAIN.points.slice(1).map((b,i)=>Object.freeze({a:MOUNTAIN.points[i],b})));
export function mountainAt(pos,margin=0){const b=MOUNTAIN.bounds;return pos.x>b.minX+14-margin&&pos.x<b.maxX-14+margin&&pos.z>b.minZ+14-margin&&pos.z<b.maxZ-14+margin}
function projectMountainRoad(pos,segment){const {a,b}=segment,dx=b.x-a.x,dz=b.z-a.z,t=clamp(((pos.x-a.x)*dx+(pos.z-a.z)*dz)/(dx*dx+dz*dz),0,1),x=a.x+dx*t,z=a.z+dz*t;return{x,z,t,distance:Math.hypot(pos.x-x,pos.z-z),segment}}
export function mountainRoadAt(pos){let best=null;for(const segment of MOUNTAIN_ROADS){const p=projectMountainRoad(pos,segment);if(!best||p.distance<best.distance)best=p}return best}
export function snapMountainRoad(pos){const p=mountainRoadAt(pos),vertical=p.segment.a.x===p.segment.b.x;return{x:p.x+(vertical?4.5:0),z:p.z+(vertical?0:4.5),name:MOUNTAIN.name+' · 山路标记'}}
export function mountainRoadEdgeAllowed(a,b){const m={x:(a.x+b.x)/2,z:(a.z+b.z)/2};if(!mountainAt(m))return true;return mountainRoadAt(m).distance<.01}
/** Clip the old city grid to the preserve boundary and the real mountain road. */
export function mountainRoadSpans(spans,line,vertical){
 const b=MOUNTAIN.bounds,min=vertical?b.minX:b.minZ,max=vertical?b.maxX:b.maxZ;if(line<=min||line>=max)return spans;
 const low=vertical?b.minZ:b.minX,high=vertical?b.maxZ:b.maxX,allowed=[[-Infinity,low+11],[high-11,Infinity]];
 for(const {a,b}of MOUNTAIN_ROADS){if(vertical?(a.x===line&&b.x===line):(a.z===line&&b.z===line))allowed.push([Math.min(vertical?a.z:a.x,vertical?b.z:b.x)-11,Math.max(vertical?a.z:a.x,vertical?b.z:b.x)+11])}
 const result=[];for(const [s,e]of spans)for(const [a,b]of allowed){const lo=Math.max(s,a),hi=Math.min(e,b);if(hi>lo)result.push([lo,hi])}result.sort((a,b)=>a[0]-b[0]);return result.reduce((merged,span)=>{const last=merged.at(-1);if(last&&span[0]<=last[1])last[1]=Math.max(last[1],span[1]);else merged.push(span);return merged},[]);
}
export const REGIONS=Object.freeze([
 {id:'coast',name:'sunset coast',description:'海港、城市街区与 H1 纵贯高速',airportId:'coast-airport',arrival:AIRPORTS[0].arrival,center:{x:3200,z:0},bounds:{minX:WORLD_MIN_X,maxX:WORLD_LIMIT,minZ:-WORLD_LIMIT,maxZ:WORLD_LIMIT}},
 {id:'plateau',name:'云岭高原',description:'高原机场、起伏山丘与北境盆地',airportId:'plateau-airport',arrival:AIRPORTS[1].arrival,center:{x:11200,z:-9600},bounds:{minX:9600,maxX:WORLD_LIMIT,minZ:-WORLD_LIMIT,maxZ:-4800}}
]);
export const REGION_PLACES=Object.freeze([
 {id:'highway-south',name:'H1 南湾入口 · 纵贯高速起点',x:3204.5,z:14400,icon:'road'},
 {id:'highway-north',name:'H1 北境出口 · 28.8 km 纵贯',x:3204.5,z:-14400,icon:'road'},
 {id:'highway-mid',name:'H1 中央互通 · 400 m 坡道',x:2804.5,z:0,icon:'road'},
 {id:'plateau',name:'云岭高原观景镇',x:11204.5,z:-10400,icon:'mountain'},
 {id:'basin',name:'北境盆地',x:4804.5,z:-11200,icon:'mountain'},
 {id:'mountain-gate',name:'天脊山门 · 盘山公路入口',x:9284.5,z:7920,icon:'mountain'},
 {id:'mountain-pass',name:'天脊垭口 · 900 m 山路',x:10075.5,z:9120,icon:'mountain'},
 {id:'mountain-summit',name:'天脊峰顶 · 1150 m 观景环路',x:14564.5,z:9680,icon:'mountain'},
 ...AIRPORTS.map(a=>({id:a.id,name:a.name+' · '+a.code,x:a.x,z:a.z,icon:'plane',regionId:a.regionId}))
]);
export function regionAt(pos){return pos.x>=9600&&pos.z<=-4800?REGIONS[1]:REGIONS[0]}
export function getRegionTravel(regionId){const region=REGIONS.find(r=>r.id===regionId);if(!region)return null;const airport=AIRPORTS.find(a=>a.id===region.airportId);return{region,airport,position:{...airport.arrival,y:groundHeight(airport.x,airport.z)},yaw:airport.yaw}}
export function airportAt(pos,radius=120){return AIRPORTS.find(a=>Math.hypot(pos.x-a.x,pos.z-a.z)<=radius)??null}
export function inWorld(pos){return Number.isFinite(pos?.x)&&Number.isFinite(pos?.z)&&pos.x>=WORLD_MIN_X&&pos.x<=WORLD_LIMIT-8&&Math.abs(pos.z)<=WORLD_LIMIT-8}
export function clampWorldPosition(pos,fallback={x:4.5,z:80}){return{x:clamp(Number.isFinite(pos?.x)?pos.x:fallback.x,WORLD_MIN_X+3,WORLD_LIMIT-8),z:clamp(Number.isFinite(pos?.z)?pos.z:fallback.z,-WORLD_LIMIT+8,WORLD_LIMIT-8)}}
export function highwayExit(z,margin=14){return HIGHWAY.exits.some(e=>Math.abs(z-e)<=margin)}
export function highwayAt(pos,margin=0){return Math.abs(pos.x-HIGHWAY.x)<=HIGHWAY.width/2+margin&&pos.z>=HIGHWAY.zMin&&pos.z<=HIGHWAY.zMax}
export function airportAirside(pos,margin=0){return AIRPORTS.find(a=>pos.x>a.bounds.minX+14-margin&&pos.x<a.bounds.maxX-14+margin&&pos.z>a.bounds.minZ+14-margin&&pos.z<a.bounds.maxZ-14+margin)??null}
/** Offramps are connected, graded approach roads, not floating scenery. */
export function roadInfo(pos){const dx=Math.abs(pos.x-HIGHWAY.x),within=pos.z>=HIGHWAY.zMin&&pos.z<=HIGHWAY.zMax;const highway=within&&dx<=17,ramp=within&&dx<=HIGHWAY.approachLength&&highwayExit(pos.z,11);const mountain=mountainAt(pos)&&mountainRoadAt(pos).distance<=16;return{kind:highway?'highway':ramp?'ramp':mountain?'mountain':'street',speedLimit:highway?HIGHWAY.speedLimit:ramp?14:mountain?MOUNTAIN.speedLimit:80/3.6,width:highway?HIGHWAY.width:22,regionId:regionAt(pos).id,elevation:groundHeight(pos.x,pos.z),exit:within&&highwayExit(pos.z,14)}}
export function roadEdgeAllowed(a,b){const m={x:(a.x+b.x)/2,z:(a.z+b.z)/2};if(airportAirside(m)||!mountainRoadEdgeAllowed(a,b))return false;if(a.x!==b.x&&m.x>3120&&m.x<3280&&m.z>HIGHWAY.zMin&&m.z<HIGHWAY.zMax&&!highwayExit(m.z,1))return false;return true}
function terrainRaw(x,z){const inland=smooth(325,2100,x),north=smooth(2600,10000,-z);const plateau=210*smooth(7000,10200,x)*smooth(3800,7500,-z);const hills=32*Math.sin(x/1900)*Math.sin(z/2300)+24*Math.sin((x+z)/2600);const basin=65*Math.exp(-(((x-4700)/2400)**2)-((z+11000)/2900)**2);return inland*(26+north*38+hills-basin)+plateau}
function mountainHeight(x,z,base){
 if(!mountainAt({x,z}))return base;
 const b=MOUNTAIN.bounds,envelope=smooth(b.minX,b.minX+500,x)*(1-smooth(b.maxX-500,b.maxX,x))*smooth(b.minZ,b.minZ+500,z)*(1-smooth(b.maxZ-500,b.maxZ,z));
 const peaks=1310*Math.exp(-(((x-12720)/2600)**2)-((z-9280)/2150)**2)+480*Math.exp(-(((x-11920)/2100)**2)-((z-6000)/1600)**2)+125*Math.sin(x/650)*Math.sin(z/580);
 let height=base+Math.max(0,peaks)*envelope;
 const road=mountainRoadAt({x,z});if(road.distance<250){const {a,b}=road.segment,ay=a.y??terrainRaw(a.x,a.z),by=b.y??terrainRaw(b.x,b.z),grade=ay+(by-ay)*smooth(0,1,road.t);
  // 36 m-wide flat road bench; smooth cut/fill joins the natural mountainside.
  height+=(grade-height)*(1-smooth(18,250,road.distance));
 }
 return height;
}
export function terrainHeight(x,z){let y=mountainHeight(x,z,terrainRaw(x,z));for(const a of AIRPORTS){const b=a.bounds,dx=Math.max(b.minX-x,0,x-b.maxX),dz=Math.max(b.minZ-z,0,z-b.maxZ),blend=1-smooth(0,700,Math.hypot(dx,dz));y+=(a.altitude-y)*blend}return y}
function groundSample(x,z){if(!Number.isFinite(x)||!Number.isFinite(z))return 0;const base=terrainHeight(x,z),bank=(1-smooth(22,HIGHWAY.approachLength,Math.abs(x-HIGHWAY.x)))*smooth(HIGHWAY.zMin-400,HIGHWAY.zMin,z)*(1-smooth(HIGHWAY.zMax,HIGHWAY.zMax+400,z));return base+HIGHWAY.elevation*bank}
/** Fixed X-fast 10 m heightmap; Godot and render meshes use these samples.
 * Ground queries use the same NE/SW cell diagonal as HeightMapShape3D. */
export const TERRAIN_SPACING=10;
const groundSamples=new Map(),MAX_GROUND_SAMPLES=40000;
function cachedGroundSample(x,z){const key=x+','+z;let y=groundSamples.get(key);if(y===undefined){y=Math.fround(groundSample(x,z));if(groundSamples.size>=MAX_GROUND_SAMPLES)groundSamples.delete(groundSamples.keys().next().value);groundSamples.set(key,y)}return y}
export function groundHeight(x,z){
 if(!Number.isFinite(x)||!Number.isFinite(z))return 0;
 const gx=Math.floor(x/TERRAIN_SPACING)*TERRAIN_SPACING,gz=Math.floor(z/TERRAIN_SPACING)*TERRAIN_SPACING,tx=(x-gx)/TERRAIN_SPACING,tz=(z-gz)/TERRAIN_SPACING;
 const b=cachedGroundSample(gx+TERRAIN_SPACING,gz),c=cachedGroundSample(gx,gz+TERRAIN_SPACING);
 if(tx+tz<=1){const a=cachedGroundSample(gx,gz);return a+(b-a)*tx+(c-a)*tz}
 const d=cachedGroundSample(gx+TERRAIN_SPACING,gz+TERRAIN_SPACING);return d+(c-d)*(1-tx)+(b-d)*(1-tz);
}
export function groundNormal(x,z){const dx=(groundHeight(x+1,z)-groundHeight(x-1,z))/2,dz=(groundHeight(x,z+1)-groundHeight(x,z-1))/2,n=Math.hypot(dx,1,dz);return{x:-dx/n,y:1/n,z:-dz/n}}
export function highwayLength(){let distance=0,previous={x:HIGHWAY.x,z:HIGHWAY.zMin,y:groundHeight(HIGHWAY.x,HIGHWAY.zMin)};for(let z=HIGHWAY.zMin+10;z<=HIGHWAY.zMax;z+=10){const p={x:HIGHWAY.x,z,y:groundHeight(HIGHWAY.x,z)};distance+=Math.hypot(p.x-previous.x,p.z-previous.z,p.y-previous.y);previous=p}return distance}
