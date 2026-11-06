import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const available=spawnSync('godot',['--version'],{encoding:'utf8'});
test('shipped Godot PCK applies speed-squared aero braking for all three trims', {skip:available.error?'Godot not installed; native integration must be run separately':false,timeout:40000},()=>{
 const pack=fileURLToPath(new URL('../physics/neon-physics.pck',import.meta.url));
 const before=createHash('sha256').update(readFileSync(pack)).digest('hex');
 const data=mkdtempSync(join(tmpdir(),'sunset-aero-native-'));
 const result=spawnSync('godot',['--headless','--fixed-fps','60','--main-pack',pack,'--script',fileURLToPath(new URL('./fixtures/roadster-aero-native.gd',import.meta.url))],{encoding:'utf8',timeout:35000,env:{...process.env,XDG_DATA_HOME:data,XDG_CACHE_HOME:data}});
 assert.equal(result.status,0,result.stdout+'\n'+result.stderr);assert.doesNotMatch(result.stdout+result.stderr,/SCRIPT ERROR|Parse Error|ERROR:/);
 const read=prefix=>JSON.parse(result.stdout.split('\n').find(line=>line.startsWith(prefix)).slice(prefix.length));
 const contract=read('AERO_NATIVE_CONTRACT '),results=read('AERO_NATIVE_RESULTS ');
 for(const speed of [0,10,30,60]){assert.equal(contract[speed].manual,contract[speed].electronic);assert.ok(Math.abs(contract[speed].manual-.0008*speed*speed)<1e-9);}
 assert.equal(contract[0].manual,0);assert.equal(contract[60].manual/contract[30].manual,4);assert.equal(contract.handbrake,contract[60].coast);assert.equal(contract.hoverInput,contract[60].coast);
 for(const mode of ['air','landing','recover','inverted'])assert.equal(contract[mode],0);
 assert.equal(results.length,12);
 for(const trim of ['performance','thrust','rocket'])for(const brake of ['manualBrake','electronicBrake']){
  const pair=results.filter(row=>row.trim===trim&&row.brake===brake),on=pair.find(row=>!row.aeroDisabled),off=pair.find(row=>row.aeroDisabled);
  assert.ok(on.stopSeconds>0&&off.stopSeconds>0);assert.ok(on.distance<off.distance-10,JSON.stringify(pair));assert.ok(on.stopSeconds<off.stopSeconds);assert.equal(on.wing,1);assert.equal(on.pitch,.6);assert.equal(on.grounded,true);
 }
 assert.equal(createHash('sha256').update(readFileSync(pack)).digest('hex'),before,'Tests must not modify the runtime pack');
 console.log('Native 60 m/s stops:',JSON.stringify(results));
});
