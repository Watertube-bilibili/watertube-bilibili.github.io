import test from 'node:test';import assert from 'node:assert/strict';
import {prepareDeliveryRestore} from '../delivery-runtime.js';
import {freshSave} from '../beta-save-slots.js';import {validateSave} from '../save-validation.js';
import {DELIVERY_SAVE_SCHEMA} from '../delivery-store.js';
for(const model of ['mica_scooter','ember_street','ridge_dual','roadster','roadster_thrust','roadster_rocket'])test('cold restore awaits active '+model+' asset without storage writes',async()=>{
 const s=JSON.parse(freshSave());s.vehicle.model=model;s.owned.push(model);s.deliveryHost=structuredClone(DELIVERY_SAVE_SCHEMA);s.saveRevision=7;
 let resolve,loaded=false,calls=[];const storage={getItem:()=>JSON.stringify(s),setItem:()=>assert.fail('read only')};
 const promise=prepareDeliveryRestore({validateSave},{storage,ensureAsset:id=>{calls.push(id);return new Promise(r=>resolve=r);}}).then(()=>loaded=true);
 await Promise.resolve();assert.equal(loaded,false);assert.deepEqual(calls,[model]);resolve(true);await promise;assert.equal(loaded,true);
});
test('asset failure never substitutes defaults or overwrites durable data',async()=>{const s=JSON.parse(freshSave());s.deliveryHost=structuredClone(DELIVERY_SAVE_SCHEMA);s.saveRevision=1;const raw=JSON.stringify(s);await assert.rejects(prepareDeliveryRestore({validateSave},{storage:{getItem:()=>raw,setItem:()=>assert.fail('write')},ensureAsset:async()=>false}),/原存档保留/);});
