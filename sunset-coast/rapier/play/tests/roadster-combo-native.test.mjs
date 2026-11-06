import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
const data=mkdtempSync(join(tmpdir(),'roadster-combo-native-'));
const env={...process.env,XDG_CONFIG_HOME:data,XDG_DATA_HOME:data,XDG_CACHE_HOME:data};
const available=spawnSync('godot',['--version'],{encoding:'utf8',env});
const native={skip:available.error?'Godot not installed; native verification is still required':false,timeout:90000};
const pack=join(root,'physics/neon-physics.pck');
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
function run(command,args){const r=spawnSync(command,args,{encoding:'utf8',env,timeout:60000,maxBuffer:10*1024*1024});assert.equal(r.status,0,r.stdout+'\n'+r.stderr);assert.doesNotMatch(r.stdout+r.stderr,/SCRIPT ERROR|Parse Error|ERROR:/);return r.stdout;}
function physics(pck,legacy=false){const out=run('godot',['--headless','--fixed-fps','60','--main-pack',pck,'--script',join(root,'tests/fixtures/roadster-combo-native.gd'),...(legacy?['--','legacy']:[])]);return JSON.parse(out.split('\n').find(l=>l.startsWith('COMBO_NATIVE_RESULTS ')).slice('COMBO_NATIVE_RESULTS '.length));}
test('combined maneuver really rolls during crossing, then settles and lands; unsafe/interrupted paths remain native',native,()=>{
 const before=hash(pack),rows=physics(pack),get=name=>rows.find(r=>r.name===name);
 for(const name of ['combo','max_height','repeated']){const r=get(name);assert.equal(r.terminal.status,'complete',JSON.stringify(r));assert.equal(r.final.mode,'road');assert.equal(r.final.grounded,true);assert.ok(Math.abs(r.final.pos[2]+14)<.1);assert.ok(Math.abs(r.final.pos[1]-.72)<.02);assert.ok(r.rollTravel>5,'roll must accompany forward travel');assert.ok(r.minUp<-.99,'body must really invert');assert.ok(r.landAngle>2*Math.PI&&r.landAngle<2*Math.PI+.2);assert.ok(r.landingUp>.995,'never descend inverted');assert.deepEqual(r.contactIds,[]);assert.ok(r.phases.includes('cross')&&r.phases.includes('settle')&&r.phases.includes('land'));}
 for(const[name,code]of [['no_obstacle','NO_OBSTACLE'],['low_clearance','VAULT_SPIN_CLEARANCE'],['no_landing_pad','NO_LANDING_PAD']]){const r=get(name);assert.equal(r.terminal.status,'rejected');assert.equal(r.terminal.code,code);assert.equal(r.final.pos[2],0);assert.equal(r.final.grounded,true);}
 assert.equal(get('low_clearance_vault').terminal.status,'complete','existing upright vault still fits a corridor too narrow for a moving roll');
 for(const[name,code]of [['cancel','CANCELLED'],['manual','MANUAL_OVERRIDE'],['intruder','VAULT_SPIN_BLOCKED'],['landing_changed','CANCELLED']]){const r=get(name);assert.equal(r.terminal.status,'cancelled');assert.equal(r.terminal.code,code);assert.equal(r.final.mode,'air');assert.ok(r.final.pos[1]>5);assert.deepEqual(r.contactIds,[]);assert.ok(Math.abs(r.final.q[3])>.999,'cancelled maneuver must regain level attitude');}
 assert.equal(get('no_power').terminal.code,'NO_POWER');assert.equal(get('no_power').terminal.status,'cancelled');assert.ok(get('no_power').contactIds.includes('no_power_obstacle'),'power loss retains real gravity/collision, not a fake safe teleport');
 for(const r of rows)assert.ok(r.maxStep<.2,'unphysical position jump: '+r.name);
 assert.equal(get('vault').terminal.status,'complete');assert.equal(get('spin').terminal.status,'complete');assert.equal(get('spin').final.mode,'air');assert.equal(hash(pack),before);
 console.log('Native combo:',JSON.stringify({rollTravel:get('combo').rollTravel,angle:get('combo').landAngle,minLandingUp:get('combo').landingUp,final:get('combo').final.pos,scenarios:rows.length}));
});
test('old vault and spin remain trajectory-identical to recovered shipped source; repeat packing is deterministic',native,()=>{
 const baseline=join(data,'baseline.pck'),repeat=join(data,'repeat.pck');
 run('python',[join(root,'tools/rebuild-roadster-pack.py'),'--source',join(root,'tests/fixtures/roadster-maneuver-baseline.gd'),'--output',baseline]);
 run('python',[join(root,'tools/rebuild-roadster-pack.py'),'--output',repeat]);
 assert.equal(hash(repeat),hash(pack));
 const old=physics(baseline,true),current=physics(pack,true);
 assert.deepEqual(current,old,'legacy traces include pose, quaternion, linear/angular velocity, mode and maneuver state');
});
test('production controller never writes pose or velocities, and manifest tracks actual rebuilt pack',()=>{
 const source=readFileSync(join(root,'physics/source/roadster_maneuver.gd'),'utf8');
 assert.doesNotMatch(source,/state\s*\.\s*(?:transform|linear_velocity|angular_velocity)\s*=/);
 const manifest=JSON.parse(readFileSync(join(root,'physics/manifest.json'),'utf8'));
 assert.equal(manifest.files['neon-physics.pck'].sha256,hash(pack));assert.equal(manifest.fileSizes['./physics/neon-physics.pck'],readFileSync(pack).length);
 assert.equal(manifest.projectSources['roadster_maneuver.gd'],hash(join(root,'physics/source/roadster_maneuver.gd')));
});
