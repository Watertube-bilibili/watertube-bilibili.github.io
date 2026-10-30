import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {MOTORCYCLE_MODELS,prepareMotorcycleTemplate,instantiateMotorcycle,updateMotorcycleVisuals} from '../motorcycle-asset.js';
import {vehicleSpawnCommand,authoredPhysicsWheelOffsets,godotCarControls} from '../godot-physics.js';
import {MOTORCYCLE_MANIFESTS} from '../motorcycle-manifests.js';
import {createHash} from 'node:crypto';
for(const model of MOTORCYCLE_MODELS){
 test(model.id+' actual GLB rig, two contacts and instance isolation',async()=>{
  const data=await readFile(new URL('../assets/motorcycle-'+model.assetKey+'.glb',import.meta.url));
  assert.equal(createHash('sha256').update(data).digest('hex'),MOTORCYCLE_MANIFESTS[model.assetKey].sha256);
  const gltf=await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'');
  const template=prepareMotorcycleTemplate(gltf.scene,model.assetKey),v=instantiateMotorcycle(template,model),other=instantiateMotorcycle(template,model);
  Object.assign(v,{pos:new THREE.Vector3(0,.02,0),yaw:0,speed:0,condition:100,battery:100});
  const cmd=vehicleSpawnCommand(v,'test:'+model.id);assert.equal(cmd.kind,'motorcycle');assert.equal(cmd.wheelOffsets.length,2);assert.equal(cmd.mass,model.mass);assert.ok(cmd.size[0]<1);assert.ok(cmd.wheelOffsets.every(w=>w[0]===0));
  assert.ok(cmd.wheelOffsets[0][2]<0&&cmd.wheelOffsets[1][2]>0);assert.ok(v.wheelBase>1.4&&v.wheelBase<1.7);assert.equal(v.doors.length,0);
  assert.equal(v.wheels[0].side,0);assert.equal(v.wheels[1].side,0);
  const original=other.wheels[0].spin.quaternion.clone();v.travelDistance=1;v.steer=.2;v.speed=5;updateMotorcycleVisuals(v,1/60);assert.ok(!v.wheels[0].spin.quaternion.equals(original));assert.ok(other.wheels[0].spin.quaternion.equals(original));
  v.travelDistance=0;v.steer=0;updateMotorcycleVisuals(v,1/60);assert.ok(v.motorcycleRig.steering.quaternion.angleTo(v.motorcycleRig.steeringRest)<1e-7);
  const bad={...v,physicsWheelOffsets:[...v.physicsWheelOffsets,v.physicsWheelOffsets[0],v.physicsWheelOffsets[1]]};assert.throws(()=>authoredPhysicsWheelOffsets(bad));
 });
}
test('powertrain split is explicit, stable IDs are distinct',()=>{assert.equal(new Set(MOTORCYCLE_MODELS.map(x=>x.id)).size,3);assert.deepEqual(MOTORCYCLE_MODELS.map(x=>x.powertrain),['electric','combustion','combustion']);});
