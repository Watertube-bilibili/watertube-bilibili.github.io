import {applySurfaceMaterial} from './surface-materials.js';
import {registerFacadeNightMask,configureNightWindows,createStreetBulbMaterial} from './night-lighting.js';
import {signalState,signalLensColor} from './intersection-signals.js';
import {applyRoadSurface,applyFacadeScale,addBuildingContactShadows} from './realistic-visuals.js';
import {MOUNTAIN_BARRIER_SEGMENTS} from './mountain-barriers.js';
import * as THREE from './vendor/three.module.js';

import {GRID,WORLD_LIMIT,WORLD_MIN_X,HIGHWAY,AIRPORTS,REGIONS,MOUNTAIN,MOUNTAIN_ROADS,TERRAIN_SPACING,mountainAt,mountainRoadAt,snapMountainRoad,mountainRoadSpans,groundHeight,groundNormal,regionAt,getRegionTravel,airportAt,airportAirside,roadInfo,roadEdgeAllowed,highwayAt,highwayExit,highwayLength} from './regions.js';
import {createAirportScene} from './region-scenery.js';
import {SHOULDER_TOP,CORE_SHOULDERS,SURFACE_DEPTH_BIAS,removeCoplanarSurfaceOverlaps} from './surface-layout.js';
export {GRID,WORLD_LIMIT,WORLD_MIN_X,HIGHWAY,AIRPORTS,REGIONS,MOUNTAIN,MOUNTAIN_ROADS,TERRAIN_SPACING,mountainAt,mountainRoadAt,snapMountainRoad,mountainRoadSpans,groundHeight,groundNormal,regionAt,getRegionTravel,airportAt,roadInfo,roadEdgeAllowed,highwayLength} from './regions.js';
export const CHUNK_SIZE=320;
/** Godot HeightMapShape3D origin is the CENTRE of this square, Y is absolute.
 * Adjacent chunks duplicate their shared sample edge exactly. */
export function buildTerrainHeightfield(cx,cz,spacing=TERRAIN_SPACING){
 if(spacing!==TERRAIN_SPACING)throw new RangeError('Terrain uses the shared 10 m sampling lattice');
 const width=CHUNK_SIZE/spacing+1,depth=width,minX=cx*CHUNK_SIZE,minZ=cz*CHUNK_SIZE,heights=[];
 for(let z=0;z<depth;z++)for(let x=0;x<width;x++)heights.push(groundHeight(minX+x*spacing,minZ+z*spacing));
 return{width,depth,heights,spacingX:spacing,spacingZ:spacing,origin:[minX+CHUNK_SIZE/2,0,minZ+CHUNK_SIZE/2],originConvention:'center',minX,minZ};
}
const MIN_ROAD_I=-3,MAX_ROAD_I=WORLD_LIMIT/GRID;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export const roadCoord=value=>Math.round(value/GRID)*GRID;
export function nearestRoad(pos){if(mountainAt(pos))pos=mountainRoadAt(pos);const i=clamp(Math.round(pos.x/GRID),MIN_ROAD_I,MAX_ROAD_I),j=clamp(Math.round(pos.z/GRID),-MAX_ROAD_I,MAX_ROAD_I);return{x:i*GRID,z:j*GRID,i,j};}
export function isRoadIntersection(pos,margin=14){const p=nearestRoad(pos);if(mountainAt(pos))return MOUNTAIN.points.some(q=>Math.abs(q.x-pos.x)<margin&&Math.abs(q.z-pos.z)<margin);if(airportAirside(pos))return false;if(highwayAt(pos,8)&&!highwayExit(pos.z,margin))return false;return Math.abs(pos.x-p.x)<margin&&Math.abs(pos.z-p.z)<margin;}
/** Keep trunks and their crowns outside driving lanes and junction approaches. */
export function safeTreePosition(pos,canopy=4.5){if(mountainAt(pos))return mountainRoadAt(pos).distance>18+canopy;const road=nearestRoad(pos),margin=11+canopy+2.5;return !highwayAt(pos,13+canopy)&&!airportAirside(pos,canopy)&&Math.abs(pos.x-road.x)>=margin&&Math.abs(pos.z-road.z)>=margin&&Math.abs(pos.x+262)>=16+canopy+1.5;}
export function district(pos){if(mountainAt(pos))return MOUNTAIN.name+' · '+Math.round(groundHeight(pos.x,pos.z))+' m';if(airportAt(pos,280))return airportAt(pos,280).name;if(highwayAt(pos,22))return HIGHWAY.name+' · '+((HIGHWAY.zMax-pos.z)/1000).toFixed(1)+' km';if(regionAt(pos).id==='plateau')return '云岭高原 · 北境第二地区';if(pos.x>3600&&pos.x<6500&&pos.z<-8000)return '北境 · 低地盆地';if(Math.abs(pos.z)<325&&pos.x<325)return '日出海滨 · 中央城区';if(pos.z<-1800)return '北岸 · 山麓新区';if(pos.z>1800)return '南湾 · 滨海新城';if(pos.x>2800)return '远东 · 工业科技带';if(pos.x>1280)return '东城 · 城际枢纽';if(pos.x>560)return '星河 · 科技新城';return '海岸 · 拓展街区';}
function hash(x,z){let h=Math.imul(x^0x5bd1e995,0x27d4eb2d)^Math.imul(z^34,0x165667b1);h=Math.imul(h^(h>>>15),0x85ebca6b);return(h^(h>>>13))>>>0;}
function seeded(x,z){let s=hash(x,z);return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
function facadeTexture(){
 const w=128,h=256,data=new Uint8Array(w*h*4),emission=new Uint8Array(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const xx=x%32,yy=y%32,window=xx>8&&xx<24&&yy>6&&yy<24,lit=hash(x>>5,y>>5)%7===0;
  const frame=xx>=7&&xx<=25&&yy>=5&&yy<=25,sill=xx>=6&&xx<=26&&yy===26;
  const n=(y*w+x)*4,grain=(hash(x,y)%9)-4;
  let color=window?(lit?[129,145,142]:[56+(24-yy),78+(24-yy),89+(24-yy)]):frame?[47,61,66]:sill?[225,224,210]:[202+grain,204+grain,198+grain];
  if(!window&&!frame&&!sill&&yy===31)color=[180,183,178];
  data.set([...color,255],n);emission.set([window&&lit?255:0,window&&lit?255:0,window&&lit?255:0,255],n);
 }
 const texture=new THREE.DataTexture(data,w,h),mask=new THREE.DataTexture(emission,w,h);texture.colorSpace=THREE.SRGBColorSpace;
 for(const t of [texture,mask]){t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;}
 return registerFacadeNightMask(texture,mask);
}
function withoutCore(start,end){const segments=[];if(start<-325)segments.push([start,Math.min(end,-325)]);if(end>325)segments.push([Math.max(start,325),end]);return segments.filter(([a,b])=>b>a);}

export function roadSpans(spans,line,vertical){
 const cuts=[];
 for(const a of AIRPORTS){const b=a.bounds;if(vertical&&line>b.minX+14&&line<b.maxX-14)cuts.push([b.minZ+11,b.maxZ-11]);if(!vertical&&line>b.minZ+14&&line<b.maxZ-14)cuts.push([b.minX+11,b.maxX-11]);}
 if(!vertical&&line>HIGHWAY.zMin&&line<HIGHWAY.zMax&&!highwayExit(line,1))cuts.push([3120+11,3280-11]);
 for(const [lo,hi]of cuts){const next=[];for(const [s,e]of spans){if(lo>s)next.push([s,Math.min(e,lo)]);if(hi<e)next.push([Math.max(s,hi),e]);}spans=next.filter(([s,e])=>e>s)}
 return mountainRoadSpans(spans,line,vertical);
}
function roadPointAllowed(x,z,vertical){return roadSpans([[vertical?z-.01:x-.01,vertical?z+.01:x+.01]],vertical?x:z,vertical).length>0}

/** Deterministic scenery streamed around the player. Shared GPU assets stay alive;
 * evicted chunks release their instance buffers. No generated object changes a road. */
export function createStreamingWorld(scene,coreColliders){
 const root=new THREE.Group();root.name='streamed-districts';scene.add(root);
 const chunks=new Map(),colliders=[...coreColliders],pending=[];
 const geo={box:new THREE.BoxGeometry(1,1,1),trunk:new THREE.CylinderGeometry(.23,.34,1,5),leaf:new THREE.IcosahedronGeometry(1,0)};
 const surfaceGeometries=new Map();
 const texture=facadeTexture(),materials={plain:new THREE.MeshStandardMaterial({color:0xffffff,roughness:.9}),shoulder:new THREE.MeshStandardMaterial({color:0xffffff,roughness:.9,...SURFACE_DEPTH_BIAS.shoulder}),building:new THREE.MeshStandardMaterial({color:0xffffff,map:texture,roughness:.87}),road:new THREE.MeshStandardMaterial({color:0xffffff,roughness:.97,...SURFACE_DEPTH_BIAS.road}),mark:new THREE.MeshStandardMaterial({color:0xffffff,roughness:.92,...SURFACE_DEPTH_BIAS.paint}),signal:new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false})};
 materials.streetBulb=createStreetBulbMaterial();
 materials.terrain=applySurfaceMaterial(new THREE.MeshStandardMaterial({color:0xffffff,roughness:.96}),'terrain');
 materials.rock=applySurfaceMaterial(new THREE.MeshStandardMaterial({color:0xffffff,roughness:.94}),'rock');
 applySurfaceMaterial(materials.shoulder,'concrete');
 applyRoadSurface(materials.road);applyFacadeScale(materials.building);configureNightWindows(materials.building);
 const stats={colliderRevision:0,loadedChunks:0,queuedChunks:0,generatedChunks:0,residentBuildings:0,seed:34,extentKm:32,highwayKm:highwayLength()/1000,regions:REGIONS.length};
 for(const material of Object.values(materials))material.vertexColors=true;
 const airportScenery=AIRPORTS.map(a=>createAirportScene(root,a));
 const dummy=new THREE.Object3D(),color=new THREE.Color();let lastKey='',disposed=false,signalPhase=0;
 function build(cx,cz){
  const key=cx+','+cz;if(chunks.has(key))return;
  const group=new THREE.Group();group.name='district-'+key;const boxes=[],walls=[],asphalt=[],marks=[],trunks=[],leaves=[],rocks=[],lamps=[],lampGrid=[],streetBulbs=[],nightLamps=[],solid=[];
  const x0=Math.max(-298,cx*CHUNK_SIZE),x1=Math.min(WORLD_LIMIT,(cx+1)*CHUNK_SIZE),z0=Math.max(-WORLD_LIMIT,cz*CHUNK_SIZE),z1=Math.min(WORLD_LIMIT,(cz+1)*CHUNK_SIZE);
  const add=(list,x,y,z,w,h,d,tint,rotation=0)=>{if(w>0&&h>0&&d>0)list.push([x,y,z,w,h,d,tint,rotation]);};
  const terrain=buildTerrainHeightfield(cx,cz),groundPositions=[],groundColors=[];
  const terrainColor=new THREE.Color(),rockColor=new THREE.Color(0x818882),snowColor=new THREE.Color(0xc5d0cc);
  const surfaceColor=(x,z,y)=>{terrainColor.setHex(0x74846b);if(mountainAt({x,z})){terrainColor.setHex(0x62755a);terrainColor.lerp(rockColor,clamp((y-240)/700,0,1));if(y>1020)terrainColor.lerp(snowColor,clamp((y-1020)/280,0,.85));}return[terrainColor.r,terrainColor.g,terrainColor.b]};
  for(let iz=0;iz<terrain.depth-1;iz++)for(let ix=cx===-1?2:0;ix<terrain.width-1;ix++){
   const p=(x,z)=>[terrain.minX+x*TERRAIN_SPACING,terrain.heights[z*terrain.width+x],terrain.minZ+z*TERRAIN_SPACING];
   const a=p(ix,iz),b=p(ix+1,iz),c=p(ix,iz+1),d=p(ix+1,iz+1);
   for(const v of [a,c,b,b,c,d]){groundPositions.push(...v);groundColors.push(...surfaceColor(v[0],v[2],v[1]));}
  }
  const terrainGeometry=new THREE.BufferGeometry();terrainGeometry.setAttribute('position',new THREE.Float32BufferAttribute(groundPositions,3));terrainGeometry.setAttribute('color',new THREE.Float32BufferAttribute(groundColors,3));const visualNormals=[];for(let i=0;i<groundPositions.length;i+=3){const n=groundNormal(groundPositions[i],groundPositions[i+2]);visualNormals.push(n.x,n.y,n.z);}terrainGeometry.setAttribute('normal',new THREE.Float32BufferAttribute(visualNormals,3));terrainGeometry.computeBoundingSphere();
  const terrainMesh=new THREE.Mesh(terrainGeometry,materials.terrain);terrainMesh.userData.semantic=5;terrainMesh.userData.chunkOwnedGeometry=true;terrainMesh.userData.terrain=true;terrainMesh.receiveShadow=true;group.add(terrainMesh);
  // Every road band is clipped to the chunk; old roads are cut out of new bands.
  for(let i=Math.max(MIN_ROAD_I,Math.ceil((x0-14)/GRID));i<=Math.floor((x1+14)/GRID);i++){
   const x=i*GRID,express=x===HIGHWAY.x&&z1>HIGHWAY.zMin&&z0<HIGHWAY.zMax,half=express?17:11,shoulder=express?21:14,a=Math.max(x0,x-shoulder),b=Math.min(x1,x+shoulder),ra=Math.max(x0,x-half),rb=Math.min(x1,x+half);
   const spans=i>=-3&&i<=3?withoutCore(z0,z1):[[z0,z1]];
   for(const [s,e]of roadSpans(spans,x,true)){add(boxes,(a+b)/2,SHOULDER_TOP-.1,(s+e)/2,b-a,.2,e-s,0xa9aaa2);add(asphalt,(ra+rb)/2,0,(s+e)/2,rb-ra,.13,e-s,0x383d40);}
  }
  for(let j=Math.ceil((z0-14)/GRID);j<=Math.floor((z1+14)/GRID);j++){
   const z=j*GRID,a=Math.max(z0,z-14),b=Math.min(z1,z+14),ra=Math.max(z0,z-11),rb=Math.min(z1,z+11);
   const spans=j>=-3&&j<=3?withoutCore(x0,x1):[[Math.max(x0,WORLD_MIN_X),x1]];
   for(const [s,e]of roadSpans(spans,z,false)){add(boxes,(s+e)/2,SHOULDER_TOP-.1,(a+b)/2,e-s,.2,b-a,0xaaa9a1);add(asphalt,(s+e)/2,.02,(ra+rb)/2,e-s,.13,rb-ra,0x383d40);}
  }
  const coreAt=(x,z)=>Math.abs(x)<=325&&Math.abs(z)<=325;
  for(let i=Math.max(MIN_ROAD_I,Math.ceil(x0/GRID));i*GRID<x1;i++)for(let z=Math.ceil(z0/10)*10;z<z1;z+=10){const x=i*GRID;if(!roadPointAllowed(x,z,true)||(Math.abs(z-roadCoord(z))<18&&!highwayAt({x,z}))||(i<=3&&coreAt(x,z)))continue;add(marks,x,.056,z,.17,.02,4.2,0xe2c575);const express=highwayAt({x,z});for(const side of [-1,1]){add(marks,x+side*(express?16:10),.056,z,.12,.02,9.8,0xf0ece0);add(marks,x+side*(express?9:5.5),.056,z,.18,.02,4.2,0xf0ece0);}}
  for(let j=Math.ceil(z0/GRID);j*GRID<z1;j++)for(let x=Math.ceil(Math.max(x0,WORLD_MIN_X)/10)*10;x<x1;x+=10){const z=j*GRID;if(!roadPointAllowed(x,z,false)||Math.abs(x-roadCoord(x))<18||(Math.abs(j)<=3&&coreAt(x,z)))continue;add(marks,x,.076,z,4.2,.02,.17,0xe2c575);for(const side of [-1,1]){add(marks,x,.076,z+side*10,9.8,.02,.16,0xf0ece0);add(marks,x,.076,z+side*5.5,4.2,.02,.18,0xf0ece0);}}
  // Junction crossings, generated only once by the chunk containing the centre.
  for(let i=Math.max(MIN_ROAD_I,Math.ceil(x0/GRID));i*GRID<x1;i++)for(let j=Math.ceil(z0/GRID);j*GRID<z1;j++){const x=i*GRID,z=j*GRID;if((i<=3&&Math.abs(j)<=3)||mountainAt({x,z})||!isRoadIntersection({x,z})||highwayAt({x,z},18))continue;for(let d=-8;d<=8;d+=2.1){add(marks,x+d,.056,z-15,1.1,.02,5,0xf0ece0);add(marks,x+d,.056,z+15,1.1,.02,5,0xf0ece0);add(marks,x-15,.076,z+d,5,.02,1.1,0xf0ece0);add(marks,x+15,.076,z+d,5,.02,1.1,0xf0ece0);}
   add(marks,x+5.5,.056,z+19,9,.02,.4,0xf0ece0);add(marks,x-5.5,.056,z-19,9,.02,.4,0xf0ece0);add(marks,x-19,.076,z+5.5,.4,.02,9,0xf0ece0);add(marks,x+19,.076,z-5.5,.4,.02,9,0xf0ece0);
   add(boxes,x+13,2.5,z+13,.14,5,.14,0x536567);add(boxes,x+13,4.7,z+13,.65,1.65,.65,0x172127);
   for(const [dx,dz] of [[0,1],[0,-1],[1,0],[-1,0]])for(const [lens,y] of [['red',5.2],['amber',4.7],['green',4.2]]){
    add(lamps,x+13+dx*.34,y,z+13+dz*.34,dx?.06:.32,.32,dz?.06:.32,signalLensColor(signalState(signalPhase,i,j,dx?'ew':'ns'),lens));lampGrid.push({i,j,lens,axis:dx?'ew':'ns'});
   }
  }
  if(x0<=HIGHWAY.x+24&&x1>=HIGHWAY.x-24){
   for(let z=Math.ceil(Math.max(z0,HIGHWAY.zMin)/20)*20;z<Math.min(z1,HIGHWAY.zMax);z+=20){
    if(highwayExit(z,45))continue;
    for(const side of [-1,1]){const x=HIGHWAY.x+side*21;if(x<x0||x>=x1)continue;add(boxes,x,.78,z,.32,.55,19.8,0xb3c0ba);add(boxes,x,.4,z,.18,.8,.2,0x8b9997);solid.push({x,z,w:.24,d:9.9,baseY:groundHeight(x,z),height:1.06,yaw:0,chunk:key,kind:'highway-barrier'})}
   }
   for(const z of HIGHWAY.exits){if(z<z0||z>=z1)continue;const x=HIGHWAY.x+24;if(x<x0||x>=x1)continue;add(boxes,x,4.5,z,.35,9,.35,0xb5bfba);add(boxes,x-5,8.6,z,11,2.4,.24,0x285b4d);add(boxes,x-5,8.6,z-.14,7,.15,.025,0xe8f0d8);}
  }
  const tree=(x,z,h=6)=>{if(!safeTreePosition({x,z}))return;add(trunks,x,h/2,z,1,h,1,0x8f8069);add(leaves,x,h+.7,z,2.5,2.3,2.5,0x527448);add(leaves,x+.9,h+.2,z-.6,1.8,1.7,1.8,0x6d884e);};
  for(let i=Math.max(-3,Math.floor(x0/GRID));i<Math.ceil(x1/GRID);i++)for(let j=Math.floor(z0/GRID);j<Math.ceil(z1/GRID);j++){
   if(i>=-3&&i<3&&j>=-3&&j<3)continue;const blockCenter={x:(i+.5)*GRID,z:(j+.5)*GRID};if(airportAirside(blockCenter,20)||highwayAt(blockCenter,42))continue;
   if(mountainAt(blockCenter)){
    const random=seeded(i,j),elevation=groundHeight(blockCenter.x,blockCenter.z);
    if(mountainRoadAt(blockCenter).distance>34&&random()<.55){const w=3+random()*7,h=2+random()*4,d=3+random()*6,yaw=random()*Math.PI;add(rocks,blockCenter.x,h/2,blockCenter.z,w,h,d,0x727e78,yaw);solid.push({x:blockCenter.x,z:blockCenter.z,w:w/2,d:d/2,baseY:elevation,height:h,yaw,kind:'mountain-rock',chunk:key});}
    if(elevation<1000&&random()<.8){for(let t=0;t<3;t++)tree(blockCenter.x+(random()-.5)*55,blockCenter.z+(random()-.5)*55,5+random()*5);}
    continue;
   }
   const random=seeded(i,j),cx=(i+.5)*GRID,cz=(j+.5)*GRID,kind=hash(Math.floor(i/6),Math.floor(j/6))%5;
   if(kind===3&&random()<.24){add(boxes,cx,.04,cz,50,.22,50,0x789566);add(boxes,cx,.17,cz,4,.04,51,0xc3ba9f);add(boxes,cx,.17,cz,51,.04,4,0xc3ba9f);for(let t=0;t<7;t++)tree(cx+(random()-.5)*40,cz+(random()-.5)*40,4+random()*4);continue;}
   for(let a=0;a<2;a++)for(let b=0;b<2;b++){
    const x=cx+(a-.5)*29,z=cz+(b-.5)*29,w=18+random()*7,d=18+random()*7,h=kind===0?8+random()*13:kind===1?25+random()*48:kind===2?7+random()*11:12+random()*26;
    if(Math.hypot(cx,cz)>2400&&kind!==1&&random()<.7){if(a===0&&b===0)tree(x,z,6+random()*4);continue;}
    const palettes=[0xb9b5a4,0x9cadb2,0xa8afa6,0xbbb0a1,0x899da5,0xc1bbac];const tint=palettes[Math.floor(random()*palettes.length)];
    add(walls,x,h/2,z,w,h,d,tint);add(boxes,x,h+.23,z,w+.7,.45,d+.7,0x4f6265);add(boxes,x,.28,z,w+1.1,.45,d+1.1,0xc1c1ae);
    if(h>23)add(boxes,x+w*.2,h+1,z+d*.2,w*.27,1.3,d*.22,0x738182);
    if(h<18){add(boxes,x,3.1,z+d/2+.85,w+.5,.17,1.9,[0x3f6966,0x798665,0xa27056][Math.floor(random()*3)]);add(boxes,x,2.75,z+d/2+.07,w*.58,.7,.1,0xd6ddd0);}
    solid.push({x,z,w:w/2+.6,d:d/2+.6,baseY:groundHeight(x,z),height:h+(h>23?1.65:.455),yaw:0,chunk:key,kind:'building'});
   }
   if((i+j)%2===0){tree(i*GRID+20,j*GRID+20,5+random()*3);tree(i*GRID+20,j*GRID+60,5+random()*2);}
   add(boxes,i*GRID+14.5,3.7,j*GRID+44,.15,7.4,.15,0x546767);add(boxes,i*GRID+13.4,7.35,j*GRID+44,2.3,.15,.2,0x546767);add(streetBulbs,i*GRID+12.5,7.29,j*GRID+44,.7,.09,.4,0xdadfc4);nightLamps.push({x:i*GRID+12.5,y:7.29+groundHeight(i*GRID+12.5,j*GRID+44),z:j*GRID+44});
  }
  // Outside-bend rails meet at the offset road corner. Real junctions retain
  // their exits. Adjacent visible/collision spans overlap by 2 cm, not a gap.
  for(const rail of MOUNTAIN_BARRIER_SEGMENTS){const {a,b,vertical}=rail,start=Math.min(vertical?a.z:a.x,vertical?b.z:b.x),end=Math.max(vertical?a.z:a.x,vertical?b.z:b.x);
   const low=vertical?z0:x0,high=vertical?z1:x1;
   for(let q=start+5;q<end+5;q+=10){const lo=q-5,hi=Math.min(q+5,end),mid=(lo+hi)/2;if(mid<low||mid>=high||hi<=lo)continue;
    const x=vertical?a.x:mid,z=vertical?mid:a.z,length=hi-lo+.02;if(x<x0||x>=x1||z<z0||z>=z1)continue;
    add(boxes,x,.72,z,vertical?.22:length,.5,vertical?length:.22,0xb2bcb2);
    add(boxes,x,.44,z,.2,.88,.2,0x788986);
    solid.push({x,z,w:vertical?.13:length/2,d:vertical?length/2:.13,baseY:groundHeight(x,z),height:.97,yaw:0,kind:'mountain-barrier',chunk:key});
   }
  }
  // Continuous western shoreline, beyond the original promenade.
  if(cx===-1){for(const [s,e]of withoutCore(z0,z1).map(([s,e])=>[s<0?s:Math.max(s,350),e>0?e:Math.min(e,-350)]).filter(([s,e])=>e>s)){
   add(boxes,-287,0,(s+e)/2,25,.2,e-s,0xccbea0);add(boxes,-311.5,-.18,(s+e)/2,27,.16,e-s,0xdfcfac);add(asphalt,-262,.01,(s+e)/2,32,.13,e-s,0x383d40);
   for(let z=Math.ceil(s/32)*32;z<e;z+=32){tree(-294,z,7);tree(-221,z+8,6);}
  }}
  function batch(items,geometry,material,semantic){if(!items.length)return;const mesh=new THREE.InstancedMesh(geometry,material,items.length);mesh.userData.semantic=semantic;mesh.receiveShadow=semantic!==2;mesh.castShadow=material===materials.building;items.forEach((item,index)=>{dummy.position.set(item[0],item[1]+groundHeight(item[0],item[2]),item[2]);dummy.scale.set(item[3],item[4],item[5]);dummy.rotation.set(0,item[7],0);dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix);mesh.setColorAt(index,color.setHex(item[6]));});mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();group.add(mesh);return mesh;}
  // Keep ground and road triangles below 20 m so the low front camera
  // preserves their real depth order above the underlying terrain. Other
  // boxes (buildings, lamps and trim) retain the original simple geometry.
  function batchSurfaces(items,material,semantic){
   const solids=[],positions=[],colors=[],surfaceRanges=[],normalColors=new THREE.Color();
   for(const item of items){
    if(item[4]>1||item[1]>.25){solids.push(item);continue;}
    const [x,y,z,w,h,d,tint]=item;normalColors.setHex(tint);
    const left=x-w/2,right=x+w/2,top=z-d/2,bottom=z+d/2,first=positions.length/3;
    // Clip each decal to the exact terrain triangle. Even shoulders and lane
    // stripes share Godot's 10 m diagonal instead of bridging steep edges.
    const clip=(poly,axis,value,positive)=>{const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ina=positive?a[axis]>=value:a[axis]<=value,inb=positive?b[axis]>=value:b[axis]<=value;if(ina)out.push(a);if(ina!==inb){const t=(value-a[axis])/(b[axis]-a[axis]);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}return out;};
    for(let px=Math.floor(left/TERRAIN_SPACING)*TERRAIN_SPACING;px<right;px+=TERRAIN_SPACING)for(let pz=Math.floor(top/TERRAIN_SPACING)*TERRAIN_SPACING;pz<bottom;pz+=TERRAIN_SPACING){
     const a=[px,pz],b=[px+TERRAIN_SPACING,pz],c=[px,pz+TERRAIN_SPACING],d=[px+TERRAIN_SPACING,pz+TERRAIN_SPACING];
     for(let poly of [[a,c,b],[b,c,d]]){poly=clip(clip(clip(clip(poly,0,left,true),0,right,false),1,top,true),1,bottom,false);for(let j=1;j<poly.length-1;j++)for(const v of [poly[0],poly[j],poly[j+1]]){positions.push(v[0],groundHeight(v[0],v[1])+y+h/2,v[1]);colors.push(normalColors.r,normalColors.g,normalColors.b);}}
    }
    if(semantic!==2){
     // The low-camera mesh keeps its fine tessellation. Native collision can
     // use two faces when every authored vertex lies on the same plane.
     const quad=[[left,top],[left,bottom],[right,top],[right,bottom]].map(([px,pz])=>[px,groundHeight(px,pz)+y+h/2,pz]);
     const sx=(quad[2][1]-quad[0][1])/w,sz=(quad[1][1]-quad[0][1])/d;
     let planar=true;for(let i=first*3;i<positions.length;i+=3)if(Math.abs(positions[i+1]-(quad[0][1]+(positions[i]-left)*sx+(positions[i+2]-top)*sz))>.00002){planar=false;break;}
     surfaceRanges.push(planar?{quad,offset:y+h/2}:{start:first,count:positions.length/3-first,offset:y+h/2});
    }
   }
   if(solids.length)batch(solids,geo.box,material,semantic);
   if(positions.length){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();geometry.computeBoundingSphere();const mesh=new THREE.Mesh(geometry,material);mesh.userData.semantic=semantic;mesh.userData.chunkOwnedGeometry=true;if(semantic!==2)mesh.userData.physicsSurfaceRanges=surfaceRanges;mesh.receiveShadow=true;group.add(mesh)}
  }
  const shoulders=[],otherBoxes=[];
  for(const item of boxes)(Math.abs(item[1]+item[4]/2-SHOULDER_TOP)<1e-9?shoulders:otherBoxes).push(item);
  batchSurfaces(removeCoplanarSurfaceOverlaps(shoulders,CORE_SHOULDERS),materials.shoulder,5);
  batchSurfaces(removeCoplanarSurfaceOverlaps(otherBoxes),materials.plain,5);batch(walls,geo.box,materials.building,5);batchSurfaces(asphalt,materials.road,1);batchSurfaces(marks,materials.mark,2);batch(rocks,geo.box,materials.rock,5);batch(trunks,geo.trunk,materials.plain,5);batch(leaves,geo.leaf,materials.plain,5);batch(streetBulbs,geo.box,materials.streetBulb,5);const signalMesh=batch(lamps,geo.box,materials.signal,5);
  chunks.set(key,{key,group,colliders:solid,cx,cz,terrain,heightfield:terrain,signalMesh,lampGrid,nightLamps});root.add(group);stats.generatedChunks++;return true;
 }
 function refreshColliders(){stats.colliderRevision++;colliders.length=0;colliders.push(...coreColliders);for(const a of airportScenery)if(a.root.visible)colliders.push(...a.colliders);let total=0;for(const chunk of chunks.values()){colliders.push(...chunk.colliders);total+=chunk.colliders.length;}stats.residentBuildings=total;stats.loadedChunks=chunks.size;stats.queuedChunks=pending.length;}
 function evict(key){const chunk=chunks.get(key);root.remove(chunk.group);chunk.group.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.userData.chunkOwnedGeometry)o.geometry.dispose();});chunks.delete(key);}
 function update(pos,force=false){
  if(disposed)return stats;let changed=false;for(const scenery of airportScenery){const visible=Math.hypot(pos.x-scenery.airport.x,pos.z-scenery.airport.z)<2400;if(visible!==scenery.root.visible)changed=true;scenery.root.visible=visible;}const cx=clamp(Math.floor(pos.x/CHUNK_SIZE),-1,49),cz=clamp(Math.floor(pos.z/CHUNK_SIZE),-50,49),key=cx+','+cz;
  if(key!==lastKey||force){lastKey=key;const desired=[];for(let x=Math.max(-1,cx-2);x<=Math.min(49,cx+2);x++)for(let z=Math.max(-50,cz-2);z<=Math.min(49,cz+2);z++)desired.push({x,z,key:x+','+z,priority:Math.max(Math.abs(x-cx),Math.abs(z-cz))*100+Math.hypot((x+.5)*CHUNK_SIZE-pos.x,(z+.5)*CHUNK_SIZE-pos.z)});const keep=new Set(desired.map(c=>c.key));for(const old of chunks.keys())if(!keep.has(old)){evict(old);changed=true;}pending.length=0;desired.sort((a,b)=>a.priority-b.priority);for(const next of desired){if(chunks.has(next.key))continue;if(Math.max(Math.abs(next.x-cx),Math.abs(next.z-cz))<=1||force){build(next.x,next.z);changed=true;}else pending.push(next);}}
  if(pending.length){const next=pending.shift();build(next.x,next.z);changed=true;}
  if(changed)refreshColliders();else stats.queuedChunks=pending.length;return stats;
 }
 function updateSignals(time){const phase=Math.floor(time);if(phase===signalPhase)return;signalPhase=phase;for(const chunk of chunks.values()){if(!chunk.signalMesh)continue;chunk.lampGrid.forEach(({i,j,lens,axis},index)=>chunk.signalMesh.setColorAt(index,color.setHex(signalLensColor(signalState(time,i,j,axis),lens))));chunk.signalMesh.instanceColor.needsUpdate=true;}}
 function dispose(){if(disposed)return;disposed=true;for(const key of chunks.keys())evict(key);airportScenery.forEach(a=>a.dispose());Object.values(geo).forEach(g=>g.dispose());surfaceGeometries.forEach(g=>g.dispose());surfaceGeometries.clear();Object.values(materials).forEach(m=>m.dispose());texture.dispose();scene.remove(root);colliders.length=0;pending.length=0;refreshColliders();colliders.length=0;stats.residentBuildings=0;}
 return{root,chunks,colliders,stats,nightMaterials:[materials.building,materials.streetBulb],update,updateSignals,district,dispose,groundHeight,groundNormal,buildTerrainHeightfield,roadInfo,regionAt,getRegionTravel,airportAt,regions:REGIONS,airports:AIRPORTS,highway:HIGHWAY};
}

class MinHeap{constructor(){this.items=[];}push(item){const a=this.items;let i=a.length;a.push(item);while(i){const p=(i-1)>>1;if(a[p].rank<=item.rank)break;a[i]=a[p];i=p;}a[i]=item;}pop(){const a=this.items,first=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1].rank<a[c].rank)c++;if(a[c].rank>=last.rank)break;a[i]=a[c];i=c;}a[i]=last;}return first;}get length(){return this.items.length;}}
/** Grid A* with bounded work and approach direction. The optional heading is the
 * vehicle yaw (-Z forward); routes never begin with an in-place U-turn. */
function planGridRoute(pos,target,blocked=[],heading=null,mountainOnly=false){
 if(!Number.isFinite(pos.x)||!Number.isFinite(pos.z)||!Number.isFinite(target.x)||!Number.isFinite(target.z))return[];
 const key=(i,j)=>i+','+j,edge=(a,b)=>[a,b].sort().join('|'),blockedSet=new Set(['-1,1|0,1',...blocked]);
 const directions=[[1,0],[0,1],[-1,0],[0,-1]],direction=(dx,dz)=>Math.abs(dx)>Math.abs(dz)?(dx>0?0:2):(dz>0?1:3);
 const hasHeading=Number.isFinite(heading),initialDirection=hasHeading?direction(-Math.sin(heading),-Math.cos(heading)):-1;
 const start=nearestRoad(pos),goal=nearestRoad(target),startRoad={...start};let terminalDirection=-1;
 // Mid-block destinations belong to the upstream junction of their own lane.
 // Rounding to the closest junction otherwise runs past the destination, then
 // commands a U-turn. Junction destinations keep their original nearest node.
 const targetDx=target.x-goal.x,targetDz=target.z-goal.z;
 if(Math.abs(targetDx)<=10&&Math.abs(targetDz)>14){terminalDirection=targetDx>=0?3:1;goal.j=clamp(terminalDirection===3?Math.ceil(target.z/GRID):Math.floor(target.z/GRID),-MAX_ROAD_I,MAX_ROAD_I);goal.z=goal.j*GRID;}
 else if(Math.abs(targetDz)<=10&&Math.abs(targetDx)>14){terminalDirection=targetDz>=0?0:2;goal.i=clamp(terminalDirection===0?Math.floor(target.x/GRID):Math.ceil(target.x/GRID),MIN_ROAD_I,MAX_ROAD_I);goal.x=goal.i*GRID;}
 if(hasHeading){
  const [hx,hz]=directions[initialDirection],vertical=hz!==0;
  // A junction a few metres behind is still usable while inside its turning
  // area; once we have exited, continue to the next junction in front.
  if(vertical&&Math.abs(pos.x-start.x)<=14&&(start.z-pos.z)*hz<-10){start.j=clamp(hz<0?Math.floor(pos.z/GRID):Math.ceil(pos.z/GRID),-MAX_ROAD_I,MAX_ROAD_I);start.z=start.j*GRID;}
  if(!vertical&&Math.abs(pos.z-start.z)<=14&&(start.x-pos.x)*hx<-10){start.i=clamp(hx<0?Math.floor(pos.x/GRID):Math.ceil(pos.x/GRID),MIN_ROAD_I,MAX_ROAD_I);start.x=start.i*GRID;}
  const advance=(target.x-pos.x)*hx+(target.z-pos.z)*hz,lateral=Math.abs((target.x-pos.x)*hz-(target.z-pos.z)*hx);
  const onLane=vertical?Math.abs(pos.x-startRoad.x)<=9&&Math.abs(target.x-startRoad.x)<=9:Math.abs(pos.z-startRoad.z)<=9&&Math.abs(target.z-startRoad.z)<=9;
  if(advance>=0&&advance<=GRID&&lateral<=1.8&&onLane&&(terminalDirection<0||terminalDirection===initialDirection)){
   let clear=true;const a=vertical?pos.z:pos.x,b=vertical?target.z:target.x;
   for(let index=Math.floor(Math.min(a,b)/GRID);index<Math.ceil(Math.max(a,b)/GRID);index++){
    const first=vertical?key(startRoad.i,index):key(index,startRoad.j),second=vertical?key(startRoad.i,index+1):key(index+1,startRoad.j);
    if(!roadEdgeAllowed(vertical?{x:startRoad.x,z:index*GRID}:{x:index*GRID,z:startRoad.z},vertical?{x:startRoad.x,z:(index+1)*GRID}:{x:(index+1)*GRID,z:startRoad.z})||blockedSet.has(edge(first,second))){clear=false;break;}
   }
   if(clear)return[{x:clamp(target.x,WORLD_MIN_X+3,WORLD_LIMIT-8),z:clamp(target.z,-WORLD_LIMIT+8,WORLD_LIMIT-8)}];
  }
 }
 const sk=key(start.i,start.j),gk=key(goal.i,goal.j),stateKey=(i,j,d)=>key(i,j)+':'+d,firstState=stateKey(start.i,start.j,initialDirection),closed=new Set(),cost=new Map([[firstState,0]]),prev=new Map(),open=new MinHeap();
 const mb={left:MOUNTAIN.bounds.minX/GRID,right:MOUNTAIN.bounds.maxX/GRID,top:MOUNTAIN.bounds.minZ/GRID,bottom:MOUNTAIN.bounds.maxZ/GRID};
 const opposite=(i,j)=>((i<=mb.left&&goal.i>=mb.right)||(i>=mb.right&&goal.i<=mb.left))&&j>mb.top&&j<mb.bottom&&goal.j>mb.top&&goal.j<mb.bottom;
 const verticalOpposite=(i,j)=>((j<=mb.top&&goal.j>=mb.bottom)||(j>=mb.bottom&&goal.j<=mb.top))&&i>mb.left&&i<mb.right&&goal.i>mb.left&&goal.i<mb.right;
 const aroundMountain=!mountainOnly&&(opposite(start.i,start.j)||verticalOpposite(start.i,start.j));
 const heuristic=(i,j)=>{const dx=Math.abs(i-goal.i),dz=Math.abs(j-goal.j);if(!mountainOnly&&opposite(i,j))return dx+Math.min(j+goal.j-2*mb.top,2*mb.bottom-j-goal.j);if(!mountainOnly&&verticalOpposite(i,j))return dz+Math.min(i+goal.i-2*mb.left,2*mb.right-i-goal.i);return dx+dz};
 const margin=Math.min(40,Math.max(23,blockedSet.size+2));let minI=mountainOnly?MOUNTAIN.bounds.minX/GRID-2:Math.max(MIN_ROAD_I,Math.min(start.i,goal.i)-margin),maxI=mountainOnly?MOUNTAIN.bounds.maxX/GRID+1:Math.min(MAX_ROAD_I,Math.max(start.i,goal.i)+margin),minJ=mountainOnly?MOUNTAIN.bounds.minZ/GRID-1:Math.max(-MAX_ROAD_I,Math.min(start.j,goal.j)-margin),maxJ=mountainOnly?MOUNTAIN.bounds.maxZ/GRID+1:Math.min(MAX_ROAD_I,Math.max(start.j,goal.j)+margin);
 if(aroundMountain){minI=Math.min(minI,mb.left-1);maxI=Math.max(maxI,mb.right+1);minJ=Math.min(minJ,mb.top-1);maxJ=Math.max(maxJ,mb.bottom+1);}
 open.push({i:start.i,j:start.j,d:initialDirection,k:firstState,rank:heuristic(start.i,start.j)*1.001});let iterations=0,found=null;
 while(open.length&&iterations++<30000){
  const {i,j,d,k}=open.pop();if(closed.has(k))continue;
  const initialBacktrack=k===firstState&&hasHeading&&(target.x-pos.x)*directions[initialDirection][0]+(target.z-pos.z)*directions[initialDirection][1]<-2;
  if(key(i,j)===gk&&!initialBacktrack&&(terminalDirection<0||d<0||(d+2)%4!==terminalDirection)){found=k;break;}
  closed.add(k);
  for(let nd=0;nd<4;nd++){
   if(d>=0&&(nd+2)%4===d)continue;
   const [di,dj]=directions[nd],ni=i+di,nj=j+dj;if(ni<minI||ni>maxI||nj<minJ||nj>maxJ||(!mountainOnly&&mountainAt({x:ni*GRID,z:nj*GRID})))continue;
   const n=stateKey(ni,nj,nd);if(closed.has(n)||blockedSet.has(edge(key(i,j),key(ni,nj)))||!roadEdgeAllowed({x:i*GRID,z:j*GRID},{x:ni*GRID,z:nj*GRID}))continue;
   const g=cost.get(k)+1+(d>=0&&nd!==d?.035:0);if(g>=(cost.get(n)??Infinity))continue;
   cost.set(n,g);prev.set(n,k);open.push({i:ni,j:nj,d:nd,k:n,rank:g+heuristic(ni,nj)*1.001});
  }
 }
 if(!found)return[];
 const path=[];let current=found;
 while(current){const [i,j]=current.split(':')[0].split(',').map(Number);path.unshift({x:i*GRID,z:j*GRID});if(current===firstState)break;current=prev.get(current);}
 const laneOffset=(dx,dz)=>Math.abs(dx)>Math.abs(dz)?{x:0,z:dx>0?4.5:-4.5}:{x:dz<0?4.5:-4.5,z:0},points=[];
 for(let i=0;i<path.length;i++){
  const p=path[i],before=path[i-1]??(hasHeading?{x:p.x-directions[initialDirection][0]*GRID,z:p.z-directions[initialDirection][1]*GRID}:pos),after=path[i+1]??target;
  const incoming=laneOffset(p.x-before.x,p.z-before.z),outgoing=laneOffset(after.x-p.x,after.z-p.z),turn=(incoming.x===0)!==(outgoing.x===0),offset=turn?{x:incoming.x+outgoing.x,z:incoming.z+outgoing.z}:outgoing;
  const q={x:clamp(p.x+offset.x,WORLD_MIN_X+3,WORLD_LIMIT-8),z:clamp(p.z+offset.z,-WORLD_LIMIT+8,WORLD_LIMIT-8)};
  if(i===0&&Math.hypot(q.x-pos.x,q.z-pos.z)<7)continue;points.push(q);
 }
 const end={x:clamp(target.x,WORLD_MIN_X+3,WORLD_LIMIT-8),z:clamp(target.z,-WORLD_LIMIT+8,WORLD_LIMIT-8)};
 if(!points.length||Math.hypot(points[points.length-1].x-end.x,points[points.length-1].z-end.z)>.1)points.push(end);
 return points;
}

/** Route through the preserve's public gate before following its sparse graph.
 * This keeps A* bounded without allowing shortcuts across a mountainside. */
export function planRoute(pos,target,blocked=[],heading=null){
 const onMountainRoad=p=>mountainAt(p)||(p.x>=MOUNTAIN.bounds.minX&&mountainRoadAt(p).distance<=16),fromMountain=onMountainRoad(pos),toMountain=onMountainRoad(target);
 if(!fromMountain&&!toMountain)return planGridRoute(pos,target,blocked,heading);
 if(toMountain&&mountainRoadAt(target).distance>12)target=snapMountainRoad(target);
 if(fromMountain&&toMountain)return planGridRoute(pos,target,blocked,heading,true);
 const gate={x:MOUNTAIN.bounds.minX-GRID,z:8000+(toMountain?4.5:-4.5)};
 const first=planGridRoute(pos,gate,blocked,heading,fromMountain);if(!first.length)return[];
 const before=first.at(-2)??pos,last=first.at(-1),nextHeading=Math.atan2(-(last.x-before.x),-(last.z-before.z));
 const second=planGridRoute(gate,target,blocked,nextHeading,toMountain);if(!second.length)return[];
 return first.concat(second.filter((p,i)=>i||Math.hypot(p.x-last.x,p.z-last.z)>.1));
}
