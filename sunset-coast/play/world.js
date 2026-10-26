import {SEMI_MODEL} from './semi-vehicle.js';
import {createSemiCar} from './semi-asset.js';
import {signalState,signalLensColor} from './intersection-signals.js';
import {applyRoadSurface,addBuildingContactShadows} from './realistic-visuals.js';
import * as THREE from './vendor/three.module.js';
import {MODELS as DESIGNED_MODELS} from './vehicle-catalog.js';
import {createDesignedCar} from './vehicle-design.js';
import {attachVehicleLights} from './vehicle-lights.js';
import {ASSET_MODEL,createAssetCar} from './asset-car.js';
import {G9_MODEL,createG9Car} from './g9-vehicle.js';
import {ROADSTER_MODELS,isRoadsterModel} from './roadster-vehicle.js';
import {createRoadsterCar} from './roadster-asset.js';
import {createStreamingWorld,safeTreePosition} from './streaming-world.js';
import {REGION_PLACES} from './regions.js';
import {CORE_ROAD_LINES,CORE_SHOULDERS,SURFACE_DEPTH_BIAS,removeCoplanarSurfaceOverlaps} from './surface-layout.js';
export {groundHeight,groundNormal,roadInfo,roadEdgeAllowed,REGIONS,AIRPORTS,HIGHWAY,MOUNTAIN,MOUNTAIN_ROADS,mountainAt,mountainRoadAt,snapMountainRoad,regionAt,getRegionTravel,airportAt,clampWorldPosition,inWorld,highwayLength} from './regions.js';
export {GRID,WORLD_LIMIT,WORLD_MIN_X,CHUNK_SIZE,buildTerrainHeightfield,roadCoord,roadSpans,nearestRoad,isRoadIntersection,planRoute,safeTreePosition} from './streaming-world.js';
export const ROAD = CORE_ROAD_LINES;
export const PLACES = [{id:'coast',name:'日出海滨',x:4,z:170,icon:'sun'},{id:'downtown',name:'中央广场',x:84,z:0,icon:'building'},{id:'garage',name:'VOLT 体验中心',x:4,z:80,icon:'car'},{id:'port',name:'南港货运站',x:164,z:240,icon:'box'},{id:'park',name:'棕榈公园',x:-156,z:-80,icon:'tree'},{id:'hills',name:'北城观景台',x:84,z:-240,icon:'mountain'},{id:'tech',name:'星河科技城 · 0.8 km',x:804,z:-320,icon:'building'},{id:'station',name:'东城城际枢纽 · 1.8 km',x:1604,z:960,icon:'building'},{id:'east',name:'远东工业港 · 3.6 km',x:3204,z:-1600,icon:'box'},{id:'north',name:'北岸山麓新区 · 2.4 km',x:164,z:-2400,icon:'mountain'},{id:'south',name:'南湾滨海新城 · 2.5 km',x:804,z:2400,icon:'sun'},...REGION_PLACES];
export const MODELS=[...DESIGNED_MODELS,ASSET_MODEL,G9_MODEL,...ROADSTER_MODELS,SEMI_MODEL];
let seed=34;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const mats=new Map();
export function mat(color, opts={}){let key=color+JSON.stringify(opts);if(!mats.has(key))mats.set(key,new THREE.MeshStandardMaterial({color,roughness:.75,...opts}));return mats.get(key)}
const boxGeo=new THREE.BoxGeometry(1,1,1),surfaceGeometries=new Map();
// Very long, thin boxes lose raster depth precision when the bumper camera
// clips their huge triangles. Subdivide only broad ground/road slabs while
// keeping the same surface positions, materials and collision dimensions.
function surfaceGeometry(w,h,d){
 if(h>1||Math.max(w,d)<80)return boxGeo;
 const sx=Math.min(64,Math.ceil(w/20)),sz=Math.min(64,Math.ceil(d/20)),key=sx+':'+sz;
 if(!surfaceGeometries.has(key)){const geometry=new THREE.BoxGeometry(1,1,1,sx,1,sz);geometry.userData.surfaceSlab=true;surfaceGeometries.set(key,geometry)}
 return surfaceGeometries.get(key);
}
export function box(parent,w,h,d,color,x=0,y=0,z=0,opts={}){const m=new THREE.Mesh(surfaceGeometry(w,h,d),typeof color==='object'?color:mat(color,opts));m.scale.set(w,h,d);m.position.set(x,y,z);parent.add(m);return m}
export function semantic(group,id){group.traverse(o=>{if(o.isMesh)o.userData.semantic=id});return group}
export function labelTexture(text,bg='#172a31',fg='#d4eeaa',w=512,h=128){const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`600 ${Math.floor(h*.5)}px sans-serif`;ctx.fillText(text,w/2,h/2,w*.92);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
function facade(color){const c=document.createElement('canvas');c.width=128;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,128,256);for(let x=9;x<128;x+=25)for(let y=12;y<256;y+=27){ctx.fillStyle=rand()>.55?'#4f646a':rand()>.4?'#b5a481':'#293e48';ctx.fillRect(x,y,13,18);ctx.fillStyle='#9fb1ae44';ctx.fillRect(x,y,2,18)}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
function instanced(parent,geo,material,items,sem=0){const m=new THREE.InstancedMesh(geo,material,items.length),dummy=new THREE.Object3D();items.forEach((q,i)=>{dummy.position.set(q[0],q[1],q[2]);dummy.scale.set(q[3]??1,q[4]??1,q[5]??1);dummy.rotation.set(0,q[6]??0,0);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix)});m.userData.semantic=sem;parent.add(m);return m}
let leafGeo;function palmLeafGeometry(){if(leafGeo)return leafGeo;const vertices=[],indices=[];for(let i=0;i<=9;i++){const t=i/9,d=t*4.5,w=Math.sin(t*Math.PI)*.42,y=Math.sin(t*Math.PI)*.7-t*t*1.8;vertices.push(-w,y,d,0,y+.13*Math.sin(t*Math.PI),d,w,y,d)}for(let i=0;i<9;i++){let a=i*3,b=a+3;indices.push(a,b,a+1,a+1,b,b+1,a+1,b+1,a+2,a+2,b+1,b+2)}leafGeo=new THREE.BufferGeometry();leafGeo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));leafGeo.setIndex(indices);leafGeo.computeVertexNormals();return leafGeo;}
export function createWorld(scene){const colliders=[],roads=new THREE.Group();scene.add(roads);const ground=box(scene,620,1,650,0x707e61,15,-.6,0,SURFACE_DEPTH_BIAS.underlay);ground.userData.semantic=5;ground.receiveShadow=true;
const asphalt=applyRoadSurface(mat(0x383d40,{roughness:.97,...SURFACE_DEPTH_BIAS.road}));
for(const x of ROAD)box(roads,22,.13,650,asphalt,x,0,0).userData.semantic=1;
for(const z of ROAD)box(roads,650,.13,22,asphalt,0,.02,z).userData.semantic=1;
// The streamed terrain also covers the original city. Old sidewalk tops at
// Y=0 fought that terrain and each other at every corner of an intersection.
for(const [x,y,z,w,h,d,tint] of removeCoplanarSurfaceOverlaps(CORE_SHOULDERS)){const curb=box(roads,w,h,d,tint,x,y,z,SURFACE_DEPTH_BIAS.shoulder);curb.userData.shoulder=true;}
const dashes=[],edge=[],cross=[],lanes=[];for(const v of ROAD)for(let i=-316;i<320;i+=10){if(ROAD.some(q=>Math.abs(i-q)<17))continue;for(const side of [-1,1])lanes.push([v+side*5.5,.056,i,.18,.02,4.2],[i,.076,v+side*5.5,4.2,.02,.18]);dashes.push([v,.056,i,.22,.02,4.2]);dashes.push([i,.076,v,4.2,.02,.17]);edge.push([v-10,.056,i,.12,.02,10],[v+10,.056,i,.12,.02,10],[i,.076,v-10,10,.02,.12],[i,.076,v+10,10,.02,.12])}
instanced(roads,boxGeo,mat(0xf0ece0,{...SURFACE_DEPTH_BIAS.paint}),lanes,2);
instanced(roads,boxGeo,mat(0xe2c575,SURFACE_DEPTH_BIAS.paint),dashes,2);instanced(roads,boxGeo,mat(0xf0ece0,SURFACE_DEPTH_BIAS.paint),edge,2);
for(const x of ROAD)for(const z of ROAD)for(let a=-8;a<=8;a+=2.1){cross.push([x+a,.056,z-15,1.1,.02,5],[x+a,.056,z+15,1.1,.02,5],[x-15,.076,z+a,5,.02,1.1],[x+15,.076,z+a,5,.02,1.1])}instanced(roads,boxGeo,mat(0xf0ece0,SURFACE_DEPTH_BIAS.paint),cross,2);
// Stop bars sit before the crossing, on the approaching half-road only.
const stops=[];for(const x of ROAD)for(const z of ROAD)stops.push([x+5.5,.056,z+19,9,.02,.4],[x-5.5,.056,z-19,9,.02,.4],[x-19,.076,z+5.5,.4,.02,9],[x+19,.076,z-5.5,.4,.02,9]);
instanced(roads,boxGeo,mat(0xf0ece0,{...SURFACE_DEPTH_BIAS.paint}),stops,2);
roads.traverse(o=>{if(o.isMesh)o.receiveShadow=o.userData.semantic!==2;});
const buildings=new THREE.Group();scene.add(buildings);const colors=['#b3a798','#b6b7aa','#8a9e9d','#8995a1','#c3b6a0','#7b8b96','#9f968b'];const bm=colors.map(c=>mat(0xffffff,{map:facade(c)}));const walls=new Map();
for(let ix=0;ix<ROAD.length-1;ix++)for(let iz=0;iz<ROAD.length-1;iz++){const cx=(ROAD[ix]+ROAD[ix+1])/2,cz=(ROAD[iz]+ROAD[iz+1])/2;if((ix===0&&iz===2)||(ix===3&&iz===2)){box(scene,53,.25,53,0x82936c,cx,.15,cz);continue}for(let a=0;a<2;a++)for(let b=0;b<2;b++){const x=cx+(a-.5)*29,z=cz+(b-.5)*29,w=18+rand()*8,d=18+rand()*8,h=9+rand()*(ix<3&&iz>=4?15:39)+(ix>2?rand()*24:0);const mi=Math.floor(rand()*bm.length),level=Math.max(1,Math.round(h/18)),wk=mi+":"+level;if(!walls.has(wk)){const tex=bm[mi].map.clone();tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(1.3,level);tex.needsUpdate=true;walls.set(wk,new THREE.MeshStandardMaterial({map:tex,roughness:.85}))}const wallMat=walls.get(wk);const body=box(buildings,w,h,d,wallMat,x,h/2,z);body.castShadow=true;body.receiveShadow=true;body.userData.semantic=5;box(buildings,w+1,.5,d+1,0x3e5157,x,h+.2,z).userData.semantic=5;box(buildings,w+1.3,.5,d+1.3,0xd0c8b6,x,.55,z).userData.semantic=5;colliders.push({x,z,w:w/2+.7,d:d/2+.7,baseY:0,height:h+.45,yaw:0,kind:'building'});if(h<24){const sign=box(buildings,w*.75,1.2,.12,mat(0xffffff,{map:labelTexture(['COAST COFFEE','MOTEL 24','PACIFIC CLUB','VOLT','SUNRISE MARKET'][Math.floor(rand()*5)])}),x,3,z+d/2+.1);sign.userData.semantic=5;box(buildings,w+1,.18,2.8,0x395d59,x,3.8,z+d/2+.9).userData.semantic=5}}}
// Coastal promenade, a horizon of water, and distant hills.
box(scene,25,.2,700,0xccbea0,-287,0,0).userData.semantic=5;box(scene,32,.13,700,asphalt,-262,.01,0).userData.semantic=1;box(scene,25,.16,700,0xdfcfac,-307,-.18,0);box(scene,20000,.2,32400,0x397c85,-10335,-.5,0);
const waterGeo=new THREE.PlaneGeometry(20000,32400,48,70);waterGeo.rotateX(-Math.PI/2);const water=new THREE.Mesh(waterGeo,new THREE.MeshStandardMaterial({color:0x599da3,roughness:.25,metalness:.55,transparent:true,opacity:.87}));water.position.set(-10335,-.3,0);scene.add(water);water.userData.semantic=0;
const palmTrunks=[],leaves=[];for(let v=-310;v<=320;v+=23){addPalm(-294,v,7+rand()*2);addPalm(-221,v+6,6+rand()*3);if(Math.abs(v%80)>16){addPalm(-20,v,6);addPalm(20,v+9,6)}}for(let i=0;i<35;i++){const x=-205+rand()*45,z=-110+rand()*50;addPalm(x,z,5+rand()*3)}
function addPalm(x,z,h){if(!safeTreePosition({x,z}))return;palmTrunks.push([x,h/2,z,.35,h,.35]);for(let j=0;j<7;j++){const ang=j*Math.PI*2/7;const leaf=new THREE.Mesh(palmLeafGeometry(),mat(j%2?0x637b44:0x456743,{side:THREE.DoubleSide}));leaf.position.set(x,h-.2,z);leaf.rotation.y=ang;leaf.userData.semantic=5;leaves.push(leaf)}}instanced(scene,new THREE.CylinderGeometry(.2,.32,1,6),mat(0x9b8870),palmTrunks,5);const leafGroup=new THREE.Group();scene.add(leafGroup);instanced(leafGroup,palmLeafGeometry(),mat(0x527845,{side:THREE.DoubleSide}),leaves.map(l=>[l.position.x,l.position.y,l.position.z,1,1,1,l.rotation.y]),5);
const lamps=[];for(const x of [-16,16,-247])for(let z=-290;z<320;z+=45){lamps.push([x,3.9,z,.12,7.8,.12]);lamps.push([x+Math.sign(-x)*.9,7.8,z,2,.12,.12]);lamps.push([x+Math.sign(-x)*1.6,7.7,z,.6,.1,.5])}instanced(scene,boxGeo,mat(0x536365),lamps,5);
// Roadside details.
for(let z=-280;z<300;z+=60){box(scene,2.3,.18,.65,0x976c4e,-291,.7,z);box(scene,2.3,.68,.12,0x976c4e,-291,1.04,z+.28);box(scene,.1,.7,.6,0x4a5c5a,-291-1,.35,z);box(scene,.1,.7,.6,0x4a5c5a,-291+1,.35,z)}
const showroom=new THREE.Group();scene.add(showroom);box(showroom,44,5.2,22,mat(0x688287,{metalness:.15,roughness:.2}),-40,2.6,80);box(showroom,46,.5,24,0xe2dfd1,-40,5.4,80);box(showroom,33,1.7,.1,mat(0xffffff,{map:labelTexture('V O L T','#293b40','#d7f1b3')}),-40,4,91.1);semantic(showroom,5);colliders.push({x:-40,z:80,w:23,d:12,baseY:0,height:5.65,yaw:0,kind:'showroom'});
const signalPoles=[],signals=[],signalInstances=[];
for(const z of ROAD)for(const x of ROAD){
 signalPoles.push([x+13,2.5,z+13,.14,5,.14]);
 box(scene,.65,1.65,.65,0x172127,x+13,4.7,z+13).userData.semantic=5;
 for(const [dx,dz] of [[0,1],[0,-1],[1,0],[-1,0]])for(const [lens,y] of [['red',5.2],['amber',4.7],['green',4.2]]){
  signalInstances.push([x+13+dx*.34,y,z+13+dz*.34,dx?.06:.32,.32,dz?.06:.32]);signals.push({x,z,lens,axis:dx?'ew':'ns'});
 }
}
instanced(scene,boxGeo,mat(0x536567),signalPoles,5);
const signalMesh=instanced(scene,boxGeo,new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false}),signalInstances,5),signalColor=new THREE.Color();let coreSignalPhase=-1;
function updateCoreSignals(time){const phase=Math.floor(time);if(phase===coreSignalPhase)return;coreSignalPhase=phase;signals.forEach((s,i)=>{const state=signalState(time,Math.round(s.x/80),Math.round(s.z/80),s.axis);signalMesh.setColorAt(i,signalColor.setHex(signalLensColor(state,s.lens)));});signalMesh.instanceColor.needsUpdate=true;}
updateCoreSignals(0);addBuildingContactShadows(scene,colliders);

const staticBoxes=new Map();scene.updateMatrixWorld(true);scene.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&(o.geometry===boxGeo||o.geometry.userData.surfaceSlab)){const key=o.material.uuid+':'+(o.userData.semantic??0)+':'+o.geometry.uuid;if(!staticBoxes.has(key))staticBoxes.set(key,[]);staticBoxes.get(key).push(o)}});for(const meshes of staticBoxes.values()){if(meshes.length<2)continue;const m=new THREE.InstancedMesh(meshes[0].geometry,meshes[0].material,meshes.length);m.userData.semantic=meshes[0].userData.semantic??0;m.castShadow=meshes.some(o=>o.castShadow);m.receiveShadow=meshes.some(o=>o.receiveShadow);meshes.forEach((o,i)=>m.setMatrixAt(i,o.matrixWorld));meshes.forEach(o=>o.parent.remove(o));scene.add(m)}
const streamed=createStreamingWorld(scene,colliders);streamed.update({x:0,z:80});
return{...streamed,water,signals,updateCoreSignals,roads,leafGroup};}
export function createCar(modelId='s',simple=false,colorOverride=null){
 const model=MODELS.find(m=>m.id===modelId)||MODELS[0];
 if(model.id==='semi'){const car=createSemiCar(model,simple,colorOverride);if(car)return attachVehicleLights(car);throw Object.assign(new Error('Semi 模型尚未载入，请先加载车型资源。'),{code:'SEMI_ASSET_NOT_READY',modelId:model.id});}
 if(isRoadsterModel(model)){
  const loaded=createRoadsterCar(model,simple,colorOverride);if(loaded)return attachVehicleLights(loaded);
  throw Object.assign(new Error('Roadster 模型尚未载入，请先加载车型资源。'),{code:'ROADSTER_ASSET_NOT_READY',modelId:model.id});
 }
 if(model.id==='vision'){
  const loaded=createAssetCar(model.id,simple,colorOverride,model);if(loaded)return attachVehicleLights(loaded);
  throw Object.assign(new Error('Lucent 模型尚未载入，请先加载车型资源。'),{code:'LUCENT_ASSET_NOT_READY',modelId:model.id});
 }
 const car=model.id==='g9'?createG9Car(simple,colorOverride,model):createDesignedCar(model.id,simple,colorOverride);
 if(!car&&model.id==='g9')throw new Error('G9_ASSET_NOT_READY: load the G9 model before creating it');
 if(car.driverCamera){car.driverCamera.z+=.14;if(car.steeringWheel)car.driverCamera.y=Math.min(car.driverCamera.y,car.steeringWheel.position.y+.35);}
 car.driverViewPitch=.14;return attachVehicleLights(car);
}
export function createPerson(color=0x486b78){const root=new THREE.Group(),body=box(root,.43,.67,.26,color,0,1.12,0),head=new THREE.Mesh(new THREE.SphereGeometry(.165,8,7),mat(0xc4a388));head.position.y=1.64;root.add(head);const hair=box(root,.28,.07,.25,0x3b3737,0,1.78,0);const arms=[],legs=[];for(let side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.3,1.36,0);root.add(arm);box(arm,.13,.52,.15,color,0,-.23,0);box(arm,.12,.15,.14,0xc4a388,0,-.52,0);arms.push(arm);const leg=new THREE.Group();leg.position.set(side*.12,.8,0);root.add(leg);box(leg,.16,.68,.19,0x334450,0,-.3,0);box(leg,.19,.11,.29,0x28353b,0,-.66,-.045);legs.push(leg)}semantic(root,4);body.castShadow=true;return{root,arms,legs,head,animate(t,speed=1){arms[0].rotation.x=Math.sin(t*8)*.55*speed;arms[1].rotation.x=-arms[0].rotation.x;legs[0].rotation.x=-arms[0].rotation.x;legs[1].rotation.x=arms[0].rotation.x;root.position.y=Math.abs(Math.sin(t*8))*.025*speed}}}
export const CHARACTERS=[{id:'alex',name:'林 Alex',role:'自由车手',color:0xddd6b4,description:'从海岸出发，驾驶探索整座城市。'},{id:'maya',name:'叶 Maya',role:'城市信使',color:0x8a8e9b,description:'熟悉每一条街道，也喜欢新的冒险。'},{id:'nico',name:'周 Nico',role:'夜班司机',color:0x476c74,description:'城市入夜，旅程才刚刚开始。'},{id:'mochi',name:'Mochi',role:'城市猫咪',color:0xdaab79,description:'四只爪子，一座城市。跑、跳、探索，也能搭车。'}];
export function createCat(){const root=new THREE.Group(),fur=mat(0xd4aa7e),cream=mat(0xead8b5),dark=mat(0x463d34),arms=[],legs=[];const body=new THREE.Mesh(new THREE.SphereGeometry(.3,12,9),fur);body.scale.set(.85,.86,1.52);body.position.set(0,.4,.1);root.add(body);const head=new THREE.Mesh(new THREE.SphereGeometry(.23,12,10),fur);head.position.set(0,.64,-.32);root.add(head);const muzzle=new THREE.Mesh(new THREE.SphereGeometry(.135,10,8),cream);muzzle.scale.set(1,.65,.6);muzzle.position.set(0,.55,-.505);root.add(muzzle);for(const side of [-1,1]){const ear=new THREE.Mesh(new THREE.ConeGeometry(.1,.23,3),fur);ear.position.set(side*.145,.87,-.31);ear.rotation.z=-side*.2;root.add(ear);const pink=new THREE.Mesh(new THREE.ConeGeometry(.065,.13,3),mat(0xa57568));pink.position.set(side*.145,.89,-.345);root.add(pink);const eye=new THREE.Mesh(new THREE.SphereGeometry(.04,8,8),mat(0xc2d282));eye.scale.z=.45;eye.position.set(side*.115,.66,-.516);root.add(eye);box(root,.012,.055,.01,dark,side*.115,.665,-.54);for(let i=0;i<2;i++){const stripe=box(root,.075,.012,.014,0x9d724a,side*.18,.54+i*.09,-.484);stripe.rotation.z=side*.2}for(const z of [-.2,.33]){const limb=new THREE.Group();limb.position.set(side*.16,.31,z);root.add(limb);box(limb,.1,.26,.11,fur,0,-.11,0);const paw=new THREE.Mesh(new THREE.SphereGeometry(.075,8,6),cream);paw.position.set(0,-.22,-.03);paw.scale.set(1,.6,1.3);limb.add(paw);(z<0?arms:legs).push(limb)}}const nose=box(root,.055,.035,.025,0xa96f69,0,.57,-.59);const tail=new THREE.Group();tail.position.set(0,.43,.49);root.add(tail);const tailMesh=new THREE.Mesh(new THREE.CylinderGeometry(.045,.065,.64,8),fur);tailMesh.position.set(0,.2,.13);tailMesh.rotation.x=.52;tail.add(tailMesh);tail.rotation.x=.2;semantic(root,4);body.castShadow=true;return{root,head,arms,legs,tail,animate(t,speed=1){arms.forEach((a,i)=>a.rotation.x=Math.sin(t*12+i*Math.PI)*.55*speed);legs.forEach((a,i)=>a.rotation.x=-Math.sin(t*12+i*Math.PI)*.55*speed);tail.rotation.z=Math.sin(t*2)*.23;root.position.y=Math.abs(Math.sin(t*12))*.023*speed}};}
