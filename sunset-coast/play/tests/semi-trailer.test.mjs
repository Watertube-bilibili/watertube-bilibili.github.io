import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import {SEMI_TRAILER_SPEC,followSemiTrailer,semiTrailerLoadState,createSemiTrailer,alignSemiTrailer,semiTrailerChasePose,installSemiCargoTrailers} from '../semi-trailer.js';
const wrap=n=>Math.atan2(Math.sin(n),Math.cos(n));
const near=(a,b,tolerance=1e-6)=>assert(Math.abs(a-b)<=tolerance,`${a} != ${b}`);
function fixture(){const scene=new THREE.Scene(),root=new THREE.Group(),hitch=new THREE.Group();hitch.name='TrailerHitch';hitch.position.set(0,1.2,2.05);root.add(hitch);scene.add(root);const car={model:{id:'semi'},root,semiRig:{hitch},speed:0,mass:11500,collisionBounds:{minX:-1.25,maxX:1.25},physicsWheelOffsets:[1,2,3,4]};const g={scene,vehicle:car,job:null,traffic:[],world:{groundHeight:()=>0},updateVehicleLighting(){},removeVehicle(c){c.root.removeFromParent();}};return{g,car,scene};}

test('render-only shell includes closed box, chassis, tandem dual wheels, supports and real internal cargo',()=>{
 const t=createSemiTrailer();for(const name of ['LoadFloor','CargoFrontWall','CargoRoof','CargoSideWall','TrailerFrame','LandingLeg','TrailerKingpin','TandemAxles','TrailerDualTires','RearDoor','FreightCrates','FreightPallets'])assert(t.root.getObjectByName(name),name);
 assert.equal(t.tires.count,8);assert.equal(t.doors.length,2);assert.equal(t.visualOnly,true);assert.equal(t.hasCollision,false);assert.equal(t.cargo.visible,false);
 assert(t.cameraBounds.maxZ>SEMI_TRAILER_SPEC.rear);assert(t.rearCameraMount[1]>2.84);
 let calls=0,triangles=0;t.root.traverse(o=>{if(o.isMesh){calls++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);}});assert(calls<70,`${calls} draw calls`);assert(triangles<7000,`${triangles} triangles`);t.dispose();
});

test('actual mission phase drives empty, light, standard, overload and cleared cargo; other vehicles stay empty',()=>{
 const {g,car}=fixture();assert.equal(semiTrailerLoadState(car,g).payloadKg,0);
 for(const [type,massKg,count]of [['freight-light',8000,4],['freight-standard',18000,10],['freight-overload',26000,14]]){
  g.job={type,massKg,cargoLabel:'真实货单',stage:0,hold:0};assert.equal(semiTrailerLoadState(car,g).loaded,false);
  g.job.hold=1;assert.equal(semiTrailerLoadState(car,g).doorsOpen,true);g.job.stage=1;
  const state=semiTrailerLoadState(car,g);assert.equal(state.payloadKg,massKg);assert.equal(state.crateCount,count);assert.equal(state.overloaded,massKg>18000);
  const t=createSemiTrailer();t.updateLoad(state);assert(t.cargo.visible);assert.equal(t.crateMesh.count,count);assert.equal(t.palletMesh.count,count);t.dispose();
  assert.equal(semiTrailerLoadState({...car},g).payloadKg,0);
 }
 g.job=null;assert.equal(semiTrailerLoadState(car,g).loaded,false);car.speed=2;assert.equal(semiTrailerLoadState(car,g).doorsOpen,false);
});

test('straight driving and reversing preserve orientation, hitch and exact bogie distance',()=>{
 let state=null;for(const direction of [-1,1])for(let i=0;i<600;i++){state=followSemiTrailer(state,{x:0,z:direction*i*.1},0);near(state.yaw,0);near(Math.hypot(Math.sin(state.yaw)*9.45,Math.cos(state.yaw)*9.45),9.45);}
});

test('tight turns and reverse never flip or sweep the front of the box into the cab',()=>{
 let p={x:0,z:0},yaw=0,state=followSemiTrailer(null,p,yaw);for(const direction of [1,-1,1,-1])for(let i=0;i<600;i++){
  yaw+=.012*direction;p.x-=Math.sin(yaw)*.08*direction;p.z-=Math.cos(yaw)*.08*direction;
  const next=followSemiTrailer(state,p,yaw),articulation=wrap(next.yaw-yaw);assert(Math.abs(articulation)<=SEMI_TRAILER_SPEC.maxArticulation+1e-8);assert(Math.abs(wrap(next.yaw-state.yaw))<.06);
  // Cab rear sits forward of z=.85; box front including exterior rail stays behind it.
  const frontMinimum=2.05+SEMI_TRAILER_SPEC.front*Math.cos(articulation)-1.33*Math.abs(Math.sin(articulation));assert(frontMinimum>.84,frontMinimum);state=next;
 }
});

test('teleports and discontinuous resets align immediately; stationary updates do not drift',()=>{
 let state=followSemiTrailer(null,{x:0,z:0},0);state=followSemiTrailer(state,{x:600,z:-800},1);assert(state.reset);near(state.yaw,1);for(let i=0;i<100;i++){state=followSemiTrailer(state,{x:600,z:-800},1);near(state.yaw,1);}state=followSemiTrailer(state,{x:600,z:-800},-1);assert(state.reset);near(state.yaw,-1);
});

test('trailer kingpin stays at rendered hitch and bogie wheels contact flat/sloped road',()=>{
 const t=createSemiTrailer(),matrix=new THREE.Matrix4(),position=new THREE.Vector3();for(const slope of [0,.1,-.1])for(const yaw of [0,Math.PI/2,-Math.PI+.01]){
  const hitch=new THREE.Vector3(40,1.2,-20),s=Math.sin(yaw),c=Math.cos(yaw),terrain=(x,z)=>((x-40)*s+(z+20)*c)*slope;
  alignSemiTrailer(t,hitch,yaw,terrain);near(t.root.position.distanceTo(hitch),0);t.root.updateMatrixWorld(true);
  for(let i=0;i<t.tires.count;i++){t.tires.getMatrixAt(i,matrix);position.setFromMatrixPosition(matrix);t.root.localToWorld(position);near(position.y-SEMI_TRAILER_SPEC.wheelRadius,terrain(position.x,position.z)+.018,.017);}
 }t.dispose();
});

test('lifecycle is idempotent, restores from existing job, clears after cancel and disposes on car replacement',()=>{
 const {g,car,scene}=fixture(),before=JSON.stringify({mass:car.mass,bounds:car.collisionBounds,contacts:car.physicsWheelOffsets});const service=installSemiCargoTrailers(g);assert.equal(installSemiCargoTrailers(g),service);
 g.job={type:'freight-standard',massKg:18000,stage:1,cargoLabel:'工业物资',hold:0};g.updateVehicleLighting(.1);assert(car.trailer);assert.equal(car.trailer.payloadKg,18000);assert.equal(car.trailer.root.parent,scene);assert.equal(car.trailer.root.position.z,2.05);
 car.root.position.set(20,0,30);car.root.rotation.y=.4;g.updateVehicleLighting(.1);const actual=new THREE.Vector3();car.semiRig.hitch.getWorldPosition(actual);near(car.trailer.root.position.distanceTo(actual),0);
 g.job=null;g.updateVehicleLighting(.2);assert.equal(car.trailer.payloadKg,0);assert.equal(car.trailer.cargo.visible,false);assert.equal(JSON.stringify({mass:car.mass,bounds:car.collisionBounds,contacts:car.physicsWheelOffsets}),before);
 const root=car.trailer.root;g.removeVehicle(car);assert.equal(root.parent,null);assert.equal(car.trailer,undefined);assert.equal(service.trailers.size,0);
});

test('dormant vehicles hide trailers and parked owned Semi remains visible, without changing cargo jobs',()=>{
 const {g,car}=fixture();installSemiCargoTrailers(g);g.updateVehicleLighting(1/60);const empty=car.trailer;car.populationDormant=true;g.updateVehicleLighting(.1);assert.equal(empty.root.visible,false);car.populationDormant=false;g.personalVehicle=car;g.vehicle={model:{id:'s'}};g.updateVehicleLighting(.1);assert.equal(empty.root.visible,true);assert.equal(empty.payloadKg,0);
});

test('side and rear branding reuses canonical SUNSET COAST logo without reversed UVs',()=>{
 const source=readFileSync(new URL('../semi-trailer.js',import.meta.url),'utf8'),svg=readFileSync(new URL('../neon-2-0-icon.svg',import.meta.url),'utf8');assert(svg.includes('<title>SUNSET COAST</title>'));assert(source.includes("new URL('./neon-2-0-icon.svg'"));assert(source.includes("ctx.fillText('SUNSET COAST'"));assert(source.includes("rearCtx.fillText('SUNSET COAST'"));assert(source.includes("ctx.fillText('日落海岸'"));assert(!source.includes("NEON COAST"));
 const ctx=new Proxy({},{get:(_,key)=>key==='getContext'?undefined:()=>{},set:()=>true});const t=createSemiTrailer({makeCanvas:()=>({getContext:()=>ctx})});const labels=[];t.root.traverse(o=>{if(o.name==='TrailerPayloadLabel'||o.name==='RearSunsetCoastBrand')labels.push(o);});assert.equal(labels.length,4);for(const label of labels){assert(label.scale.x>0);assert(label.scale.y>0);}t.dispose();
});

test('actual Semi GLB cab and air-line vertices clear the trailer box across maximum articulation',async()=>{
 globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1200,height:760,close(){}});
 const {GLTFLoader}=await import('../vendor/GLTFLoader.js'),bytes=readFileSync(new URL('../assets/semi_low.glb',import.meta.url));
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');gltf.scene.updateMatrixWorld(true);
 const point=new THREE.Vector3(),hitch=new THREE.Vector3(0,1.2,2.05),up=new THREE.Vector3(0,1,0);
 for(const angle of [-.6,-.3,0,.3,.6]){
  let nearest=-Infinity;gltf.scene.traverse(o=>{if(!o.isMesh)return;const vertices=o.geometry.attributes.position;for(let i=0;i<vertices.count;i++){
   point.fromBufferAttribute(vertices,i).applyMatrix4(o.matrixWorld).sub(hitch).applyAxisAngle(up,-angle);
   if(point.y>.24&&point.y<2.97&&Math.abs(point.x)<1.31)nearest=Math.max(nearest,point.z);
  }});assert(nearest<SEMI_TRAILER_SPEC.front-.05,`Original cab intrudes at ${angle}: ${nearest}`);
 }
});


test('trailer-aware chase camera clears box roof and frames complete rig in portrait side orbit',()=>{
 const anchor=new THREE.Vector3(),rear=semiTrailerChasePose(anchor,0,0,0,1.7);assert(rear.position.z>24);assert(rear.position.y>10);
 const rearRoofLine=rear.look.y+(rear.position.y-rear.look.y)*(13.3-rear.look.z)/(rear.position.z-rear.look.z);assert(rearRoofLine>4.2);
 for(const aspect of [.46,1,1.7])for(const orbit of [0,Math.PI/2,Math.PI,-Math.PI/2]){
  const pose=semiTrailerChasePose(anchor,0,orbit,0,aspect),camera=new THREE.PerspectiveCamera(58,aspect,.1,100);camera.position.copy(pose.position);camera.lookAt(pose.look);camera.updateMatrixWorld(true);
  for(const x of [-1.35,1.35])for(const z of [-3.92,13.4])for(const y of [0,4.18]){const p=new THREE.Vector3(x,y,z).project(camera);assert(Math.abs(p.x)<1,`horizontal clipping ${aspect}, ${orbit}: ${p.x}`);assert(Math.abs(p.y)<1,`vertical clipping ${aspect}, ${orbit}: ${p.y}`);}
 }
});


test('chase adjustment leaves cockpit/walking views and the exact entry transition start unchanged',()=>{
 const {g,car}=fixture();car.pos=car.root.position;car.yaw=0;g.inCar=true;g.cameraMode=0;g.cameraYaw=0;g.cameraAnchor=new THREE.Vector3();g.camera=new THREE.PerspectiveCamera(58,1.6,.1,100);g.cameraLook=new THREE.Vector3();
 g.updateCamera=()=>{g.camera.position.set(0,5.5,11);g.cameraLook.set(0,1.1,-5);};installSemiCargoTrailers(g);g.updateVehicleLighting(.1);g.updateCamera(.1);assert(g.camera.position.z>24);
 g.cameraMode=1;g.updateCamera(.1);near(g.camera.position.z,11);g.cameraMode=0;g.inCar=false;g.updateCamera(.1);near(g.camera.position.z,11);
 g.inCar=true;g.transition={time:0,cameraStart:{},pose:{carBlend:1}};g.updateCamera(.1);near(g.camera.position.z,11);
});
