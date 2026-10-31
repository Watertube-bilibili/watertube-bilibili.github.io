// SPDX-License-Identifier: AGPL-3.0-only
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),context={window:{}};vm.createContext(context);for(const file of ['catalog/biology.js','catalog/sources-biology.js','modules/biology.js'])vm.runInContext(fs.readFileSync(path.join(root,'dist',file),'utf8'),context,{filename:file});
const {LAB_CATALOG:all,LAB_SOURCES:sources,LAB_MODULES:{biology:m}}=context.window;
const byId=Object.fromEntries(all.map(e=>[e.id,e])),params=e=>Object.fromEntries(e.controls.map(c=>[c.key,c.value]));
let renderChecks=0;const unchanged=[],exceptions=[];
for(const e of all){for(const k of ['objective','apparatus','steps','observations','conclusion','examPoints','pitfalls','questions','safety','modelNote','workedExample'])assert(e[k]&&e[k].length!==0,`${e.id} missing ${k}`);assert(e.sourceIds.every(id=>sources.some(s=>s.id===id)),e.id+' missing source');if(e.requiresPhysics)continue;const p=params(e);let initial;try{initial=m.simulate(e,p,1);assert(!initial.then,e.id+' unexpected promise');assert.equal(JSON.stringify(initial),JSON.stringify(m.simulate(e,p,0)),e.id+' result must not depend on presentation playhead');const svg=m.render(e,p,initial,.7);assert(svg.length>500,e.id+' short rendering');assert(!/NaN|undefined|Infinity/.test(svg),e.id+' invalid svg');renderChecks++;}catch(err){exceptions.push(e.id+': '+err.message);continue;}
 for(const control of e.controls){const vals=control.options?control.options.map(o=>o.value):[control.min,control.max];const states=[JSON.stringify(initial.readings)+JSON.stringify(initial.process)+JSON.stringify(initial.table)+JSON.stringify(initial.graph)+m.render(e,p,initial,.7)];for(const val of vals){const next={...p,[control.key]:val};try{const r=m.simulate(e,next,1),svg=m.render(e,next,r,.7);assert(!/NaN|undefined|Infinity/.test(svg),e.id+' invalid '+control.key);assert(r.readings.length>0);states.push(JSON.stringify(r.readings)+JSON.stringify(r.process)+JSON.stringify(r.table)+JSON.stringify(r.graph)+svg);renderChecks++;}catch(err){exceptions.push(e.id+'/'+control.key+'/'+val+': '+err.message);}}if(new Set(states).size<2&&vals.length>1)unchanged.push(e.id+': '+control.key);}
}
function run(id,p){const e=byId['bio-'+id];return m.simulate(e,{...params(e),...p},1)}
assert.equal(run('germination-rate',{total:100,sprouted:92}).rate,92);assert.equal(run('germination-rate',{total:20,sprouted:30}).invalid,true);
assert.equal(run('germination',{moisture:'damp',temperature:'suitable',viable:'yes'}).canGrow,true);
for(const p of [{moisture:'dry'},{moisture:'submerged'},{temperature:'cold'},{temperature:'hot'},{viable:'no'},{viable:'dormant'}])assert.equal(run('germination',p).canGrow,false,JSON.stringify(p));
assert.equal(run('dominance',{parent1:'Aa',parent2:'Aa'}).counts.aa,1);assert.equal(run('dominance',{parent1:'AA',parent2:'aa'}).counts.Aa,4);
assert.equal(run('digestion',{saliva:'yes',temperature:'suitable',crush:'yes'}).complete,true);assert.equal(run('digestion',{temperature:'boiled'}).complete,false);
assert.equal(run('daphnia',{beats:30,seconds:10}).rate,180);
assert.equal(run('selection',{background:'dark',generations:1,initial:50}).series[1],.8/(.8+.3));
assert.equal(run('yeast-compare',{a1:12,a2:13,a3:11,b1:8,b2:9,b3:7,samecondition:'yes'}).meanA,12);
console.log(JSON.stringify({records:all.length,physicsDelegated:all.filter(e=>e.requiresPhysics).map(e=>e.id),renderChecks,exceptions,unchanged},null,2));
assert.equal(exceptions.length,0,exceptions.join('\n'));
assert.equal(unchanged.length,0,unchanged.join('\n'));
assert.equal(run('sex-ratio-data',{female:0}).ratio,null);
assert.equal(run('sex-ratio-data',{male:1050,female:1000}).ratio,105);
assert.equal(run('karyotype',{combination:'XX',cell:'gamete',gamete:'Y'}).valid,false);
assert.equal(run('traits',{pair:'different'}).valid,false);
