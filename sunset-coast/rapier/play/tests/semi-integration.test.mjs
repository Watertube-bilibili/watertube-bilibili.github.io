import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:1200,height:760,close(){}}); // Structural loader only; not image/GPU QA.
globalThis.ProgressEvent=class{constructor(type,props){this.type=type;Object.assign(this,props);}};
const {MODELS,createCar}=await import('../world.js');
const {SEMI_MODEL}=await import('../semi-vehicle.js');
const {SEMI_ASSET_SHA256,SEMI_ASSETS,selectSemiAssetQuality,getSemiLoadedQuality,prepareSemiTemplate,instantiateSemiTemplate,semiAssetReady,loadSemiAsset}=await import('../semi-asset.js');
const {requiresVehicleAsset}=await import('../vehicle-asset-registry.js');
const {vehicleSpawnCommand}=await import('../godot-physics.js');
const {attachVehicleInstruments,updateVehicleInstruments,disposeVehicleInstruments}=await import('../vehicle-instruments.js');
const {cockpitProfile}=await import('../cockpit-profiles.js');
const {semiDisplayState}=await import('../semi-displays.js');
const originalFetch=globalThis.fetch;const data=fs.readFileSync(new URL('../assets/semi_detailed.glb',import.meta.url));
globalThis.fetch=async(input,opts)=>{const url=typeof input==='string'?input:input.url;if(url?.includes('/assets/semi_')){const bytes=fs.readFileSync(new URL('../assets/'+new URL(url).pathname.split('/').pop(),import.meta.url));return new Response(bytes,{headers:{'Content-Type':'model/gltf-binary','Content-Length':String(bytes.length)}});}return originalFetch(input,opts);};
let a,b;
test('Semi is selectable catalog entry with lazy asset registration and exact asset digest',async()=>{
 assert.equal(MODELS.filter(m=>m.id==='semi').length,1);assert.equal(MODELS.find(m=>m.id==='semi'),SEMI_MODEL);assert(requiresVehicleAsset('semi'));assert(!semiAssetReady());assert.throws(()=>createCar('semi'),/尚未载入/);
 assert.equal(crypto.createHash('sha256').update(data).digest('hex'),SEMI_ASSET_SHA256);assert(await loadSemiAsset());assert(semiAssetReady());assert.equal(getSemiLoadedQuality(),'medium');
 a=createCar('semi');b=createCar('semi');assert.equal(a.wheels.length,6);assert.notEqual(a.root,b.root);
});
test('center driver view and explicit four-contact truck spawn contract',()=>{
 assert(a.driverCamera.y>2.5);assert.equal(a.driverCamera.x,0);assert.equal(a.wheelBase,4.725);assert.equal(cockpitProfile(SEMI_MODEL).display,'semi');a.pos=a.root.position;a.yaw=0;a.speed=0;
 const command=vehicleSpawnCommand(a,'semi-test');assert.equal(command.mass,11500);assert.equal(command.wheelOffsets.length,4);assert.deepEqual(command.wheelOffsets,a.physicsWheelOffsets);assert.equal(command.wheelOffsets[2][2],2.345);assert(command.size[1]>3);assert(a.root.userData.requiresSixWheelPhysicsValidation);
});
test('physical twin displays use isolated per-car lifecycle and correct active cargo state',()=>{
 const calls=[];const context=()=>new Proxy({},{get:(_,name)=>(...args)=>calls.push([name,...args]),set:()=>true});globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>context()})};
 a.battery=b.battery=80;a.speed=10;b.speed=0;const oldA=a.semiRig.leftDisplay.material;attachVehicleInstruments(a);attachVehicleInstruments(b);
 assert.equal(a.instruments.kind,'semi');assert.notEqual(a.semiRig.leftDisplay.material,b.semiRig.leftDisplay.material);
 const game={vehicle:a,cargoStatus:{active:true,massKg:18000,phase:'运输中',destination:'港口',cargoLabel:'工业物资'}};updateVehicleInstruments(a,1,{autopilot:true,game});assert(calls.some(c=>c[1]==='港口'));assert.equal(semiDisplayState(a,{cargoStatus:game.cargoStatus}).cargo,18);
 disposeVehicleInstruments(a);assert.equal(a.instruments,undefined);assert.equal(a.semiRig.leftDisplay.material,oldA);disposeVehicleInstruments(b);
});

test('quality selects stored choices and low mobile default without startup fetch',()=>{for(const q of ['low','medium','high'])assert.equal(selectSemiAssetQuality({localStorage:{getItem:()=>q},mobile:true}),q);assert.equal(selectSemiAssetQuality({mobile:true}),'low');assert.equal(selectSemiAssetQuality({mobile:false}),'medium');});
test('all actual LOD assets have matching hashes, preserved rigs and decreasing geometry',async()=>{const {GLTFLoader}=await import('../vendor/GLTFLoader.js');let previous=Infinity;for(const quality of ['high','medium','low']){const asset=SEMI_ASSETS[quality],bytes=fs.readFileSync(new URL('../assets/'+asset.file,import.meta.url));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),asset.sha256);const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');const car=instantiateSemiTemplate(prepareSemiTemplate(gltf.scene),SEMI_MODEL);assert.equal(car.wheels.length,6);assert(car.semiRig.leftDisplay&&car.semiRig.rightDisplay);let triangles=0;car.root.traverse(o=>{if(o.isMesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});assert(triangles<previous);previous=triangles;}});
