import test from 'node:test';
import assert from 'node:assert/strict';
import {authoredPhysicsWheelOffsets,vehicleSpawnCommand} from '../godot-physics.js';
import {createDesignedCar} from '../vehicle-design.js';
import * as THREE from '../vendor/three.module.js';
test('authored physics layout permits exactly four finite independent contacts',()=>{
 const offsets=[[-1.04,.1,-2.38,.56,.57],[1.04,.1,-2.38,.56,.57],[-1.04,.1,2.345,.56,.57],[1.04,.1,2.345,.56,.57]];
 const copy=authoredPhysicsWheelOffsets({physicsWheelOffsets:offsets});assert.deepEqual(copy,offsets);copy[0][0]=9;assert.notEqual(copy[0][0],offsets[0][0]);
 for(const invalid of [[],offsets.concat(offsets.slice(0,2)),[[NaN,.1,0,.5,0],...offsets.slice(1)]])assert.throws(()=>authoredPhysicsWheelOffsets({physicsWheelOffsets:invalid}));
 assert.equal(authoredPhysicsWheelOffsets({}),null);
});
test('existing designed car uses unchanged front and rear suspension selection',()=>{
 const car=createDesignedCar('s',true);car.pos=new THREE.Vector3();car.yaw=0;
 const expected=[true,false].flatMap(front=>[-1,1].map(side=>{const w=car.wheels.find(w=>w.front===front&&w.side===side);return[w.pivot.position.x,.1,w.pivot.position.z,w.radius,w.suspensionRestY??w.pivot.position.y];}));
 assert.deepEqual(vehicleSpawnCommand(car,'old').wheelOffsets,expected);
});
