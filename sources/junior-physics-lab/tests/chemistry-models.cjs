/* Domain regressions for original chemistry models. AGPL-3.0-only. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');global.window=global;
require(root+'/dist/catalog/chemistry.js');require(root+'/dist/catalog/sources-chemistry.js');require(root+'/dist/modules/chemistry.js');
const mod=LAB_MODULES.chemistry,find=id=>LAB_CATALOG.find(e=>e.id==='chem-'+id),sim=(id,p={},u=1)=>mod.simulate(find(id),p,u),near=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
(async()=>{
let scenarios=0,svgCount=0;
for(const e of LAB_CATALOG){
 assert.ok(e.steps.length&&e.apparatus.length&&e.observations.length&&e.questions.length,e.id);assert.ok(e.workedExample.steps.length>=3,e.id);for(const id of e.sourceIds)assert.ok(LAB_SOURCES.some(s=>s.id===id),e.id+' source '+id);
 for(const c of e.controls){assert.ok(!c.options||c.options.length>1,e.id+' single-choice control');if(!c.options)assert.ok(c.value>=c.min&&c.value<=c.max,e.id+' range');}
 if(e.requiresPhysics)continue; // Real-engine cases run in chemistry-engine-browser.py.
 const inputs=[{},...e.controls.flatMap(c=>(c.options?c.options.map(o=>o.value):[c.min,c.max]).map(v=>({[c.key]:v})))];
 for(const p of inputs){scenarios++;for(const u of [0,.5,1]){const r=mod.simulate(e,p,u);assert.ok(r.conclusion&&r.process.length&&r.readings.length,e.id+' output');for(const reading of r.readings)if(typeof reading.value==='number')assert.ok(Number.isFinite(reading.value),e.id+' finite');if(r.balanceError!==undefined)near(r.balanceError,0,1e-10);if(r.productMasses){assert.ok(r.aLeft>=0&&r.bLeft>=0);for(const v of r.productMasses)assert.ok(v.mass>=0);}const svg=mod.render(e,p,r,u);assert.ok(svg.includes('<text'),e.id+' svg');assert.ok(!/NaN|undefined|Infinity/.test(svg),e.id+' bad svg');svgCount++;}}
}
near(sim('oxygen').gasMass,.32);near(sim('co2',{m1:1,m2:.73}).gasMass,.44);
near(sim('oxygen',{catalyst:'yes'}).maxOxygen,sim('oxygen',{catalyst:'no'}).maxOxygen);
near(sim('water-electrolysis',{water:.18}).hydrogen,.02);near(sim('water-electrolysis',{water:.18}).oxygen,.16);near(sim('water-electrolysis',{power:'no'}).hydrogen,0);
near(sim('permanganate',{mass:3.16}).gasMass,.32);near(sim('permanganate',{heated:'no'}).gasMass,0);
assert.equal(sim('metal-acid',{metal:'Cu'}).gasMass,0);
near(mod.pHstrong(.002,.002,.04),7);assert.ok(mod.pHstrong(.002,0,.02)<7&&mod.pHstrong(.002,.004,.06)>7);
near(sim('co2',{},0).gasMass,sim('co2',{},1).gasMass); // app prepares before play; both must be final results.
near(sim('limewater',{lime:.074,co2:.044}).solidMass,.1);near(sim('limewater',{lime:.074,co2:.088}).solidMass,0);
const carbonate=sim('co2-naoh',{base:.08,co2:.044});near(carbonate.carbonate,.001);near(carbonate.bicarbonate,0);
const bicarbonate=sim('co2-naoh',{base:.08,co2:.088});near(bicarbonate.carbonate,0);near(bicarbonate.bicarbonate,.002);
near(mod.solubility('KNO3',20),31.6);near(mod.solubility('KNO3',60),110);near(mod.solubility('NaCl',40),36.6);
near(sim('crystallization',{solute:'KNO3',hot:60,cold:20,water:100}).solidMass,78.4);
near(sim('dilution',{mass:50,percent:10,water:50}).w,5);
assert.ok(sim('methane',{m1:1,m2:0}).invalid);assert.ok(sim('dissolve',{solute:'permanganate',solvent:'ethanol'}).invalid);
const closed=sim('conservation',{vessel:'closed'}),open=sim('conservation',{vessel:'open'});near(closed.before,closed.after);near(open.before-open.after,open.gasMass);
assert.equal(sim('air-oxygen',{sealed:'no'}).valid,false);
const mg=sim('magnesium-mass',{m1:.48,m2:.32});near(mg.productMasses[0].mass,.8);near(mg.aLeft+mg.bLeft,0);
near(sim('hydrogen-burn',{m1:.04,m2:.32}).productMasses[0].mass,.36);
const co2svg=mod.render(find('co2'),{},sim('co2'),1),kmnsvg=mod.render(find('permanganate'),{},sim('permanganate'),1);assert.ok(co2svg.includes('向上排空气法'));assert.ok(kmnsvg.includes('管口略低于管底'));
const coverage=JSON.parse(fs.readFileSync(root+'/research/chemistry-coverage.json'));assert.equal(coverage.baseline.items.length,35);for(const item of coverage.baseline.items){assert.ok(item.implementationIds.length);for(const id of item.implementationIds)assert.ok(LAB_CATALOG.some(e=>e.id===id));}assert.equal(coverage.pepActivities.length,8);assert.equal(coverage.pepCrossDisciplinary.length,10);
for(const e of LAB_CATALOG.filter(e=>e.requiresPhysics))await assert.rejects(()=>mod.simulate(e,{},0),/Godot物理引擎尚未就绪/);
const output={physicsDelegated:LAB_CATALOG.filter(e=>e.requiresPhysics).map(e=>e.id),status:'passed',experiments:LAB_CATALOG.length,scenarios,svgStates:svgCount,baselineMapped:35,namedActivities:8,crossDisciplinarySupport:10,checked:'2026-10-31'};
fs.writeFileSync(root+'/research/chemistry-test-results.json',JSON.stringify(output,null,2)+'\n');console.log(output);

})().catch(error=>{console.error(error);process.exitCode=1});
