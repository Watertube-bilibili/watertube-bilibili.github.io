import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {cityPlayURL} from '../../sunset-coast/rapier/play/city-chooser.js';
import {cityHomeURL} from '../../sunset-coast/rapier/play/city-runtime-entry.js';
import {CITY_PREFIX,cityStorageKeys,cityIndexKey,cityBackupKey,createCitySlot,readCitySlot,listCitySlots,createCitySession} from '../../sunset-coast/rapier/play/city-save-store.js';
import {createBetaSlot,betaStorageKeys,ACTIVE_BETA_KEY} from '../../sunset-coast/rapier/play/beta-save-slots.js';
import {validateSave} from '../../sunset-coast/rapier/play/save-validation.js';
const origin='https://watertube-bilibili.github.io';
const locks={request:async(_name,callback)=>callback({name:_name})};
function memory(){const values=new Map(),writes=[];return {values,writes,get length(){return values.size;},key:i=>[...values.keys()][i]??null,getItem:key=>values.get(key)??null,setItem(key,value){writes.push(['set',key,String(value)]);values.set(key,String(value));},removeItem(key){writes.push(['remove',key]);values.delete(key);}};}

test('formal chooser resolves the deployed Rapier play path independent of the document URL',()=>{
 assert.equal(cityPlayURL('s-preserved-42',origin+'/sunset-coast/rapier/play/city-chooser.js?v=cached'),origin+'/sunset-coast/rapier/play/?citySlot=s-preserved-42');
});
test('module-relative URLs also support development copies and return to the same project root',()=>{
 assert.equal(cityPlayURL('s-prior',origin+'/sunset-coast/original-city-candidate/play/city-chooser.js'),origin+'/sunset-coast/original-city-candidate/play/?citySlot=s-prior');
 for(const path of ['rapier','original-city-candidate'])assert.equal(cityHomeURL(origin+'/sunset-coast/'+path+'/play/city-runtime-entry.js?v=x'),origin+'/sunset-coast/');
});
test('slot URL serialization cannot introduce a second query parameter',()=>{
 const target=new URL(cityPlayURL('s-a&citySlot=s-b',origin+'/sunset-coast/rapier/play/city-chooser.js'));
 assert.deepEqual([...target.searchParams],[['citySlot','s-a&citySlot=s-b']]);
});
test('prior Rapier storage identities remain unchanged across the entry relocation',()=>{
 assert.equal(CITY_PREFIX,'sunrise-coast:original-city-rapier:v1');
 assert.equal(cityStorageKeys('s-existing').SAVE_KEY,'sunrise-coast:original-city-rapier:v1:slot-s-existing:save-v1');
 assert.equal(cityIndexKey('s-existing'),'sunrise-coast:original-city-rapier:v1:slot-index:s-existing');
 assert.equal(cityBackupKey('s-existing'),'sunrise-coast:original-city-rapier:v1:slot-index:s-existing:initial-backup');
});
test('formal chooser points at the new runtime and does not import the Godot launcher',()=>{
 const html=readFileSync(new URL('../../sunset-coast/index.html',import.meta.url),'utf8');
 assert.match(html,/src="\.\/rapier\/play\/city-chooser\.js\?v=[a-f0-9]+"/);
 assert.doesNotMatch(html,/<script[^>]+src="[^\"]*(?:sunrise-hub-launcher|beta-launcher)/);
 const map=JSON.parse(html.match(/<script type="importmap">([^<]+)<\/script>/)[1]);
 assert.ok(Object.keys(map.imports).length>100);
 for(const [key,value]of Object.entries(map.imports)){assert.ok(key.startsWith('./rapier/play/'),key);assert.ok(value.startsWith('./rapier/play/'),value);}
 for(const id of ['fresh','import-file','candidates','originals','status','retry-init'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/href="\.\/legacy\.html"/);
});
test('the archived legacy chooser is byte-identical to the current 8dbbf2 formal homepage',()=>{
 const raw=readFileSync(new URL('../../sunset-coast/legacy.html',import.meta.url));
 assert.equal(createHash('sha256').update(raw).digest('hex'),'69de82685513d4228b2ae71eab12673b27fd889307587b98ed011ad35fba53ad');
});
test('an original formal beta slot copies exact raw bytes, keeps all old keys and preserves extensions after a new save',async()=>{
 const storage=memory(),old=await createBetaSlot(storage,{mode:'fresh',validateSave,locks,idFactory:()=> 's-original-formal',now:()=> '2026-11-06T13:44:44.000Z'});
 const original=JSON.parse(old.raw);original.money=4321;original.extension={opaque:['original',{preserved:true}]};original.vehicle.customPart={colour:'original'};
 const raw=JSON.stringify(original,null,2)+'\n';storage.setItem(betaStorageKeys(old.slot).SAVE_KEY,raw);storage.setItem(betaStorageKeys(old.slot).INPUT_MODE_KEY,'touch');
 const protectedValues=new Map(storage.values);storage.writes.length=0;
 const copied=await createCitySlot(storage,{sourceKey:betaStorageKeys(old.slot).SAVE_KEY,validateSave,locks,idFactory:()=> 's-release-copy',now:()=> '2026-11-06T14:00:00.000Z'});
 assert.equal(copied.raw,raw);assert.equal(copied.record.source.key,betaStorageKeys(old.slot).SAVE_KEY);assert.equal(JSON.parse(storage.getItem(cityBackupKey(copied.slot))).raw,raw);
 const indexBefore=storage.getItem(cityIndexKey(copied.slot)),backupBefore=storage.getItem(cityBackupKey(copied.slot));
 const session=createCitySession({storage,entry:copied,validateSave,ownsLock:()=>true});
 const next=structuredClone(original);next.money=4200;delete next.extension;delete next.vehicle.customPart;
 const game={physics:{ready:true,failed:false},physicsTransactions:{failed:false},time:10,snapshot:()=>next,ui:{}};
 session.markReady(game);assert.equal(session.save(game),true);
 const saved=await readCitySlot(storage,copied.slot,validateSave);assert.equal(saved.save.money,4200);assert.deepEqual(saved.save.extension,original.extension);assert.deepEqual(saved.save.vehicle.customPart,original.vehicle.customPart);
 assert.equal(storage.getItem(cityIndexKey(copied.slot)),indexBefore);assert.equal(storage.getItem(cityBackupKey(copied.slot)),backupBefore);
 for(const[key,value]of protectedValues)assert.equal(storage.getItem(key),value,key);
 for(const[,key]of storage.writes)assert.ok(key.startsWith(CITY_PREFIX+':'),key);
 assert.equal(storage.getItem(ACTIVE_BETA_KEY),protectedValues.get(ACTIVE_BETA_KEY));
 assert.equal((await listCitySlots(storage,validateSave)).find(x=>x.slot===copied.slot).raw,saved.raw);
});
test('reading an existing Rapier slot and rejecting a failed physics save do not write old or new progress',async()=>{
 const storage=memory(),entry=await createCitySlot(storage,{fresh:true,validateSave,locks,idFactory:()=> 's-prior-candidate'});
 const before=new Map(storage.values);storage.writes.length=0;
 assert.equal((await readCitySlot(storage,entry.slot,validateSave)).slot,entry.slot);
 const session=createCitySession({storage,entry,validateSave,ownsLock:()=>true});
 const game={physics:{ready:true,failed:false},snapshot:()=>entry.save,resetControls(){},ui:{}};session.markReady(game);
 game.physics.failed=true;assert.equal(session.save(game),false);assert.equal(session.stopped,true);assert.deepEqual(storage.writes,[]);assert.deepEqual(storage.values,before);
});
