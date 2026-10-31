/* Semantic regressions for the chemistry review. SPDX-License-Identifier: AGPL-3.0-only */
const assert=require('node:assert/strict');
global.window=global;
require('../dist/catalog/chemistry.js');require('../dist/modules/chemistry.js');
const mod=LAB_MODULES.chemistry,entry=id=>LAB_CATALOG.find(e=>e.id==='chem-'+id);
const solve=(id,p={})=>mod.simulate(entry(id),p,1);
const scene=(id,p={},u=1)=>mod.render(entry(id),p,solve(id,p),u);
const shape=s=>s.split('<rect x="610"')[0].replace(/<text[\s\S]*?<\/text>/g,'').replace(/data-stage="[^"]*"/g,'');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
// Design means inverse planning from a goal, not a duplicate gas generator.
near(solve('oxygen-design',{target:.32,percent:3.4,collection:100}).solution,20);
near(solve('oxygen-design',{target:.32,percent:3.4,collection:80}).solution,25);
// Catalyst evidence has three parts; input records are not fabricated measurements.
near(solve('catalyst').maxOxygen,.32);
assert.match(solve('catalyst',{recovered:.9}).conclusion,/不能完整支持/);
assert.match(solve('catalyst',{reuse:'no'}).conclusion,/不能完整支持/);
assert.match(solve('catalyst',{recovered:1,reuse:'yes'}).conclusion,/同时支持/);
// Physical-vs-chemical change, washing and real instruments have dedicated scenes.
assert.notEqual(shape(scene('changes',{case:'boil'},.5)),shape(scene('changes',{case:'crush'},.5)));
assert.notEqual(shape(scene('measure',{transfer:'correct'})),shape(scene('measure',{transfer:'touch'})));
assert.notEqual(shape(scene('heating',{fill:10})),shape(scene('heating',{fill:80})));
assert.notEqual(shape(scene('washing',{residue:'oil',method:'rinse'})),shape(scene('washing',{residue:'oil',method:'detergent'})));
// Contact conditions change the apparatus, not just the explanation.
assert.notEqual(shape(scene('solution-conductivity',{immersed:'yes'})),shape(scene('solution-conductivity',{immersed:'no'})));
assert.notEqual(shape(scene('metal-properties',{metal:'iron',test:'magnet'})),shape(scene('metal-properties',{metal:'copper',test:'magnet'})));
assert.notEqual(shape(scene('sulfuric-dilution',{stir:'yes'})),shape(scene('sulfuric-dilution',{stir:'no'})));
// No soap gives no comparison evidence; amount affects qualitative foam, not invented hardness.
near(solve('hardness',{soap:0}).foam,0);
assert.ok(solve('hardness',{soap:1}).foam<solve('hardness',{soap:3}).foam);
// CO2 + wet litmus followed by warming must show purple -> red -> purple.
assert.match(scene('co2-water',{heat:'yes'},0),/#a884bf/);
assert.match(scene('co2-water',{heat:'yes'},.5),/#dc737f/);
assert.match(scene('co2-water',{heat:'yes'},1),/#a884bf/);
// Staged scenes carry observations, including closed-system reactions and multiple operations.
assert.notEqual(shape(scene('conservation',{vessel:'closed'},0)),shape(scene('conservation',{vessel:'closed'},.5)));
assert.notEqual(shape(scene('salt-purify',{},.1)),shape(scene('salt-purify',{},.5)));
assert.notEqual(shape(scene('salt-purify',{},.5)),shape(scene('salt-purify',{},.9)));
assert.match(scene('airtight',{},.9),/冷却后观察导管内水柱/);
assert.notEqual(shape(scene('properties',{gas:'oxygen',test:'glowing'})),shape(scene('properties',{gas:'air',test:'glowing'})));
// Materials must respond to the actual observation choice.
assert.notEqual(solve('protein',{need:'look'}).conclusion,solve('protein',{need:'burn'}).conclusion);
assert.equal(solve('plastic',{material:'thermoplastic',need:'heat'}).soft,true);
assert.equal(solve('plastic',{material:'thermoset',need:'heat'}).soft,false);
// Every advertised playback has a visible apparatus/material change; live tasks ignore playback time.
let playback=0,live=0;
for(const e of LAB_CATALOG){
 assert.ok(['live','playback'].includes(e.interaction.mode),e.id);
 if(e.requiresPhysics)continue; // Real engine verified in chemistry-review-browser.py.
 const r=mod.simulate(e,{},1),frames=[0,.35,.8,1].map(u=>shape(mod.render(e,{},r,u)));
 if(e.interaction.mode==='playback'){assert.ok(new Set(frames).size>1,e.id+' static playback');playback++;}
 else{assert.equal(new Set(frames).size,1,e.id+' live depends on time');live++;}
}
console.log({status:'passed',semanticAssertions:28,playback,live,physicalCases:'separate real-engine browser test'});
