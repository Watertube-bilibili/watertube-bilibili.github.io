/* SPDX-License-Identifier: AGPL-3.0-only
 * Synthetic data tests only interpolation and dispatch, not the physical solver.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist/modules/physics/rolling-pendulum.js'),'utf8'),{window});
const render=window.LAB_PHYSICS_SCENES.rollingPendulum;
const base={potentialEnergy:0,translationEnergy:.2,rotationEnergy:.8,mechanicalEnergy:1,energyLost:0,tension:2};
const states=[
 {...base,time:0,position:0,velocity:0,angle:0,angularVelocity:0,branch:1,phase:'descending'},
 {...base,time:1,position:.5,velocity:1,angle:10,angularVelocity:2,branch:1,phase:'descending'},
 {...base,time:1,position:.5,velocity:-.8,angle:10,angularVelocity:1.6,branch:-1,phase:'ascending',energyLost:.36},
 {...base,time:2,position:.18,velocity:0,angle:11.6,angularVelocity:0,branch:-1,phase:'turning',energyLost:.36}
];
const result={solver:'Godot test fixture',values:{valid:true,height:.5,initialPotential:1,energyBalanceError:0},rollingStates:states};
const e={id:'phy-rolling-pendulum'},p={scenario:'rollingPendulum'};
const exact=render(e,p,result,.5);
assert.match(exact,/data-position="0.5"/);
assert.match(exact,/data-velocity="-0.8"/,'at an impulse choose the post-event state');
assert.match(exact,/data-angle="10"/,'angle stays continuous');
assert.match(exact,/data-omega="1.6"/,'rotation does not reverse just because translation reverses');
assert.match(exact,/data-branch="-1"/);
assert.match(exact,/data-energy="energyLost" data-energy-value="0.36"/);
const before=render(e,p,result,.5-1e-6),after=render(e,p,result,.5+1e-6);
assert.match(before,/data-branch="1"/);assert.match(before,/data-energy="energyLost" data-energy-value="0"/);
assert.match(after,/data-branch="-1"/);assert.match(after,/data-energy="energyLost" data-energy-value="0.36"/);
assert.match(render(e,p,result,1),/data-phase="turning"/);
assert.match(render(e,p,{values:{valid:false}},.5),/未生成假定的反向轨迹/);
assert.match(render(e,p,{},0),/设置条件后释放滚摆/);
assert.throws(()=>render(e,p,{solver:'Godot',values:{valid:true}},.5),/缺少Godot/);
assert.equal(render({id:'unrelated'},{scenario:'other'},{},0),null);
console.log('PASS rolling renderer: right-continuous impulse sampling, no interpolation across energy/velocity jumps, direction and invalid-domain display');
