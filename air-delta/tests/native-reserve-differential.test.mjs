import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {AirReserve} from '../source/runtime-candidate/sunset-coast/play/browser-roadster-air.js';
const evidence=readFileSync(new URL('../evidence/native-reserve-reference.txt',import.meta.url),'utf8');assert.match(evidence,/Godot Engine v4\.6\.3\.stable\.official/);
const cases=JSON.parse(evidence.split('\n').find(l=>l.startsWith('AIR_REFERENCE_JSON=')).slice('AIR_REFERENCE_JSON='.length));
test('24 original Godot air reserve outputs match browser analytical port',()=>{assert.equal(cases.length,24);for(const c of cases){const r=new AirReserve(c.initial),scale=r.consume(c.demand,1/60);for(const [name,value]of Object.entries({units:r.units,pressure:r.pressure(),scale}))assert.ok(Math.abs(value-c[name])<1e-8,JSON.stringify({case:c,name,value}));}});
