import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import * as THREE from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {prepareVoltSFactory} from '../s-factory.js';
import {attachVehicleInstruments,updateVehicleInstruments,disposeVehicleInstruments} from '../vehicle-instruments.js';
import {attachBlenderSDisplaySurfaces} from '../blender-s-displays.js';
import * as core from '../structural-vehicle.js';
import {createBlenderSPreview} from '../blender-s-preview.js';
import {MODELS} from '../vehicle-catalog.js';
import {createDesignedCar} from '../vehicle-design.js';
const context=()=>new Proxy({calls:[]},{get(o,k){if(k in o)return o[k];return(...args)=>o.calls.push([k,...args]);},set(o,k,v){o[k]=v;return true;}});
globalThis.document={createElement(){return{getContext:()=>context()};}};
globalThis.localStorage={getItem(){throw Error('No personal save read');},setItem(){throw Error('No personal save write');}};
const bytes=fs.readFileSync(new URL('../assets/volt-s-blender-v2.glb',import.meta.url));
const factory=await prepareVoltSFactory(bytes),model=MODELS.find(m=>m.id==='s');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const geometryHash=g=>JSON.stringify({attributes:Object.fromEntries(Object.entries(g.attributes).map(([n,a])=>[n,hash(new Uint8Array(a.array.buffer,a.array.byteOffset,a.array.byteLength))])),index:g.index&&hash(new Uint8Array(g.index.array.buffer,g.index.array.byteOffset,g.index.array.byteLength)),groups:g.groups});
const instantiate=()=>{const car=factory.createCar(model);Object.assign(car,{speed:0,battery:98,condition:100});return car;};

test('real reviewed GLB has two merged, untextured screens; both get original existing UI without source mutation',()=>{
 const car=instantiate(),source=car.root.getObjectByName('DisplaySurface'),original={geometry:source.geometry,bytes:geometryHash(source.geometry),material:source.material,parent:source.parent,position:source.position.toArray(),visible:source.visible};
 assert.equal(source.material.map,null);assert.equal(source.geometry.attributes.position.count,224);assert.equal(car.infotainmentMesh,undefined);
 const panel=attachVehicleInstruments(car);assert.equal(panel.surface,car.instrumentMesh);assert.equal(panel.group,null);assert.equal(car.root.getObjectByName('live-instrument-cluster'),undefined);
 assert.equal(car.infotainment.surface,car.infotainmentMesh);assert.equal(car.infotainment.material.map,car.infotainment.texture);assert.ok(car.infotainment.signature.includes('VOLT S'));assert.ok(car.infotainment.context.calls.some(([op,text])=>op==='fillText'&&text==='VOLT S'));
 assert.equal(source.geometry,original.geometry);assert.equal(geometryHash(source.geometry),original.bytes);assert.equal(source.material,original.material);assert.equal(source.parent,original.parent);assert.deepEqual(source.position.toArray(),original.position);assert.equal(source.visible,original.visible);
 for(const mesh of [car.instrumentMesh,car.infotainmentMesh]){assert.equal(mesh.parent,source);assert.equal(mesh.geometry.attributes.position.count,6);assert.equal(mesh.material.polygonOffset,true);assert.equal(mesh.material.polygonOffsetFactor,-1);assert.equal(mesh.material.polygonOffsetUnits,-1);assert.equal(mesh.material.map.flipY,false);}
 factory.attach(car);assert.ok(factory.ready(car));assert.equal(factory.diagnostics(car).adapterVertices,6428);disposeVehicleInstruments(car);factory.release(car);
});

test('authored front faces are exactly reused with upright, non-mirrored full-screen UVs and driver-facing normals',()=>{
 const car=instantiate();attachVehicleInstruments(car);car.root.updateMatrixWorld(true);
 const source=car.blenderSDisplays.source,p=source.geometry.attributes.position;
 for(const mesh of [car.instrumentMesh,car.infotainmentMesh]){
  const g=mesh.geometry,pos=g.attributes.position,uv=g.attributes.uv;g.computeBoundingBox();const b=g.boundingBox;
  for(let i=0;i<pos.count;i++){
   assert.ok(Array.from({length:p.count},(_,j)=>j).some(j=>p.getX(j)===pos.getX(i)&&p.getY(j)===pos.getY(i)&&p.getZ(j)===pos.getZ(i)));
   assert.equal(uv.getX(i),pos.getX(i)===b.min.x?0:1);assert.equal(uv.getY(i),pos.getY(i)===b.max.y?0:1);assert.equal(g.attributes.normal.getZ(i),1);
  }
  const target=b.getCenter(new THREE.Vector3()).applyMatrix4(mesh.matrixWorld),eye=car.driverCamera.clone(),ray=new THREE.Raycaster(eye,target.clone().sub(eye).normalize());assert.ok(ray.intersectObject(mesh).length>0);
 }
 disposeVehicleInstruments(car);factory.release(car);
});

test('per-instance canvases, active route reset, repeat attach, disposal and reattach stay isolated',()=>{
 const a=instantiate(),b=instantiate();attachVehicleInstruments(a);attachVehicleInstruments(b);const saved=a.blenderSDisplays,source=saved.source,original=source.material;
 assert.equal(attachVehicleInstruments(a),a.instruments);assert.equal(a.blenderSDisplays,saved);assert.equal(source.children.length,2);
 assert.notEqual(a.infotainment.texture,b.infotainment.texture);assert.notEqual(a.instruments.texture,b.instruments.texture);assert.notEqual(a.infotainmentMesh.geometry,b.infotainmentMesh.geometry);
 const game={vehicle:a,inCar:true,autopilot:true,destination:{name:'Airport'}};updateVehicleInstruments(a,1,{game});assert.ok(a.infotainment.signature.includes('Airport'));assert.ok(!b.infotainment.signature.includes('Airport'));
 game.vehicle=b;updateVehicleInstruments(b,2,{game});assert.ok(!a.infotainment.signature.includes('Airport'));
 const disposed=[];for(const {mesh}of saved.views){mesh.geometry.addEventListener('dispose',()=>disposed.push('geometry'));mesh.material.addEventListener('dispose',()=>disposed.push('material'));mesh.material.map.addEventListener('dispose',()=>disposed.push('texture'));}
 disposeVehicleInstruments(a);assert.equal(source.children.length,0);assert.equal(source.material,original);assert.equal(a.instrumentMesh,undefined);assert.equal(a.infotainmentMesh,undefined);assert.equal(a.blenderSDisplays,undefined);assert.deepEqual(disposed.sort(),['geometry','geometry','material','material','texture','texture']);
 disposeVehicleInstruments(a);attachVehicleInstruments(a);assert.equal(source.children.length,2);assert.notEqual(a.blenderSDisplays,saved);assert.ok(b.infotainment);
 disposeVehicleInstruments(a);disposeVehicleInstruments(b);factory.release(a);factory.release(b);
});


test('actual structural impact and factory repair leave both screens bound and source bytes intact',()=>{
 const car=instantiate();attachVehicleInstruments(car);factory.attach(car);
 const source=car.blenderSDisplays.source,original=geometryHash(source.geometry),views=car.blenderSDisplays.views.map(({mesh})=>[mesh,geometryHash(mesh.geometry),mesh.material]);
 const result=core.impactStructuralVehicle(car,{point:[0,.6,-2.5],direction:[0,0,1],normalSpeed:25,normalImpulse:20000,eventId:'display-regression'});
 assert.equal(result.accepted,true);assert.ok(core.structuralVehicleStats(car).maxDisplacement>0);
 factory.repair(car);assert.equal(core.structuralVehicleStats(car).maxDisplacement,0);assert.ok(factory.ready(car));assert.equal(geometryHash(source.geometry),original);
 for(const [mesh,bytes,material]of views){assert.equal(mesh.parent,source);assert.equal(geometryHash(mesh.geometry),bytes);assert.equal(mesh.material,material);}
 car.speed=12;updateVehicleInstruments(car,3);assert.equal(car.instruments.state.speed,43);assert.ok(car.infotainment.signature.includes('"speed":43'));
 disposeVehicleInstruments(car);factory.release(car);
});

test('screen attachments do not weaken factory geometry validation',()=>{
 const car=instantiate(),source=car.root.getObjectByName('DisplaySurface');attachVehicleInstruments(car);source.geometry.attributes.uv.setX(0,.999);
 assert.throws(()=>factory.attach(car),/Instance attribute mismatch DisplaySurface:uv/);disposeVehicleInstruments(car);factory.release(car);
 const mismatch=instantiate();mismatch.root.getObjectByName('DisplaySurface').geometry.attributes.position.setZ(62,99);assert.throws(()=>attachBlenderSDisplaySurfaces(mismatch),/display face geometry mismatch/);assert.equal(mismatch.blenderSDisplays,undefined);factory.release(mismatch);
});

test('non-composed Blender preview also gets the same physical screen interface',async()=>{
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');const car=createBlenderSPreview(model,gltf.scene);attachVehicleInstruments(car);assert.equal(car.infotainment.surface.parent.name,'DisplaySurface');disposeVehicleInstruments(car);
});

test('all 22 procedural designs keep their existing surfaces, original UI renderer and texture orientation',()=>{
 for(const model of MODELS){const car=createDesignedCar(model.id,true),surface=car.infotainmentMesh,original=surface.material;attachVehicleInstruments(car);assert.equal(car.infotainmentMesh,surface);assert.equal(car.blenderSDisplays,undefined);assert.equal(car.infotainment.texture.flipY,true);assert.equal(car.infotainment.material.polygonOffset,false);disposeVehicleInstruments(car);assert.equal(surface.material,original);}
});

test('G9 and all three accepted Roadsters keep their own real display bindings',async()=>{
 const {loadG9Asset}=await import('../g9-asset.js');const {createG9Car}=await import('../g9-vehicle.js');await loadG9Asset();
 const g9=createG9Car();attachVehicleInstruments(g9);assert.equal(g9.instruments.surface,g9.infotainmentSurfaces.cluster);assert.equal(g9.g9Navigation.surface,g9.infotainmentSurfaces.center);assert.equal(g9.blenderSDisplays,undefined);disposeVehicleInstruments(g9);
 globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1200,height:760,close(){}}); // Loader fixture, not image/GPU QA.
 globalThis.ProgressEvent=class{constructor(type,props){this.type=type;Object.assign(this,props);}};
 const oldFetch=globalThis.fetch;globalThis.fetch=async input=>{const url=new URL(typeof input==='string'?input:input.url);if(url.protocol==='blob:')return oldFetch(input);assert.equal(url.protocol,'file:');const buffer=fs.readFileSync(fileURLToPath(url));return new Response(buffer,{headers:{'Content-Type':'model/gltf-binary','Content-Length':String(buffer.length)}});};
 try{const {loadRoadsterAsset,createRoadsterCar}=await import('../roadster-asset.js');const {ROADSTER_MODELS}=await import('../roadster-vehicle.js');assert.equal(await loadRoadsterAsset(),true);
  for(const m of ROADSTER_MODELS){const car=createRoadsterCar(m);attachVehicleInstruments(car);assert.equal(car.instruments.kind,'roadster');assert.ok(car.instruments.displays.some(p=>p.surface.name==='Center_Display_Surface'));assert.equal(car.blenderSDisplays,undefined);disposeVehicleInstruments(car);}
 }finally{globalThis.fetch=oldFetch;}
});
