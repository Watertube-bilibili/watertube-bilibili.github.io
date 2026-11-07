import test from 'node:test';
import assert from 'node:assert/strict';
import {startCityRuntime,showCityStartupFailure,cityHomeURL} from '../../sunset-coast/rapier/play/city-runtime-entry.js';
import {createCitySlot} from '../../sunset-coast/rapier/play/city-save-store.js';

// Exercise the real runtime, slot hashing, session and write guards. The outer
// game-schema validator and DOM are fixtures; this is not a GPU/gameplay test.
const validateSave=value=>value;
function documentFixture(){
 const nodes=new Map();
 function element(tag='div'){
  const node={tag,style:{},children:[],hidden:false,textContent:'',append(...children){this.children.push(...children);}};
  Object.defineProperty(node,'id',{get(){return this._id;},set(value){this._id=value;nodes.set(value,this);}});
  return node;
 }
 for(const id of ['loading','load-text']){const node=element();node.id=id;}
 const document={createElement:element,getElementById:id=>nodes.get(id)??null,documentElement:{dataset:{}},body:element('body')};
 return {document,nodes};
}
function memory(){
 const values=new Map([['sunset-coast-save-v1','untouched legacy bytes']]),writes=[];
 return {values,writes,get length(){return values.size;},key:i=>[...values.keys()][i]??null,getItem:key=>values.get(key)??null,setItem(key,value){writes.push(['set',key]);values.set(key,String(value));},removeItem(key){writes.push(['remove',key]);values.delete(key);}};
}
async function fixture(){
 const {document,nodes}=documentFixture(),storage=memory(),listeners=new Map(),trace={acquired:0,released:0,loads:0,disposed:0,reset:0,replaced:[]};
 const entry=await createCitySlot(storage,{fresh:true,validateSave,locks:{request:async(_name,callback)=>callback({})},idFactory:()=> 's-startup-recovery'});
 const before=new Map(storage.values);storage.writes.length=0;
 const locks={request:async(_name,_options,callback)=>{trace.acquired++;try{return await callback({});}finally{trace.released++;}}};
 const window={localStorage:storage,navigator:{locks},location:{search:'?citySlot='+entry.slot,href:'https://example.test/sunset-coast/rapier/play/?citySlot='+entry.slot,replace:url=>trace.replaced.push(url)},addEventListener:(name,handler)=>listeners.set(name,handler)};
 return {document,nodes,storage,before,window,locks,entry,listeners,trace};
}
const options=f=>({window:f.window,document:f.document,storage:f.storage,locks:f.locks,validateSave});
function unchanged(f){assert.deepEqual(f.storage.values,f.before);assert.deepEqual(f.storage.writes,[]);}

test('WebGL startup failure explains graphics availability and provides a safe save-manager link',()=>{
 const {document,nodes}=documentFixture();nodes.get('loading').hidden=true;
 showCityStartupFailure(document,Error('Error creating WebGL context.'));
 assert.equal(nodes.get('loading').hidden,false);assert.equal(nodes.get('loading').style.opacity,'1');
 assert.match(nodes.get('load-text').textContent,/无法创建 WebGL 3D 画面/);assert.match(nodes.get('load-text').textContent,/不要清除网站数据/);assert.match(nodes.get('load-text').textContent,/原存档未修改/);
 assert.equal(nodes.get('city-startup-home').href,cityHomeURL());assert.equal(nodes.get('city-startup-home').textContent,'返回存档管理');assert.equal(nodes.get('city-startup-home').tag,'a');
 assert.match(nodes.get('city-startup-home').style.cssText,/background:#142b38;color:#f5f0e6/);
});
test('repeated failures update text without adding duplicate recovery links',()=>{
 const {document,nodes}=documentFixture();showCityStartupFailure(document,Error('first'));showCityStartupFailure(document,Error('second'));
 assert.equal(nodes.get('loading').children.length,1);assert.match(nodes.get('load-text').textContent,/second/);
});
test('generic error details remain plain text and cannot become markup or navigation',()=>{
 const {document,nodes}=documentFixture();showCityStartupFailure(document,Error('<img src=x onerror=alert(1)>'));
 assert.match(nodes.get('load-text').textContent,/<img src=x/);assert.equal(nodes.get('load-text').innerHTML,undefined);assert.equal(nodes.get('city-startup-home').href,cityHomeURL());
});
test('failure rendering tolerates absent loading surfaces',()=>{
 const {document,nodes}=documentFixture();nodes.clear();assert.doesNotThrow(()=>showCityStartupFailure(document,Error('missing surface')));
});
test('invalid slot fails before loading the game or touching any progress',async()=>{
 const f=await fixture();f.window.location.search='?citySlot=bad';const result=await startCityRuntime({...options(f),loadGame:()=>{f.trace.loads++;}});
 assert.equal(result.blocked,true);assert.equal(f.trace.loads,0);assert.equal(f.trace.acquired,0);assert.ok(f.nodes.get('city-startup-home'));unchanged(f);
});
test('unavailable Web Locks stays fail-closed with recovery navigation',async()=>{
 const f=await fixture();const result=await startCityRuntime({...options(f),locks:null,loadGame:()=>{f.trace.loads++;}});
 assert.equal(result.blocked,true);assert.match(f.nodes.get('load-text').textContent,/安全存档锁不可用/);assert.equal(f.trace.loads,0);unchanged(f);
});
test('an occupied play lock never starts a duplicate runtime',async()=>{
 const f=await fixture();const result=await startCityRuntime({...options(f),locks:{request:async(_name,_options,callback)=>callback(null)},loadGame:()=>{f.trace.loads++;}});
 assert.equal(result.blocked,true);assert.equal(f.trace.loads,0);assert.match(f.nodes.get('load-text').textContent,/其他标签页/);unchanged(f);
});
test('actual WebGL boot rejection stops the session, releases the lock and preserves all bytes',async()=>{
 const f=await fixture();const result=await startCityRuntime({...options(f),loadGame:()=>{throw Error('Error creating WebGL context.');}});
 assert.equal(result.blocked,true);assert.equal(f.trace.acquired,1);assert.equal(f.trace.released,1);assert.equal(f.window.__sunriseCitySession.stopped,true);assert.equal(f.window.__sunriseCitySession.canWrite(),false);
 assert.throws(()=>f.window.localStorage.setItem(f.entry.key,'bad'),/完整进度只能/);assert.throws(()=>f.window.localStorage.getItem('sunset-coast-save-v1'),/禁止访问/);unchanged(f);
});
test('failed physics is disposed exactly once even when pagehide follows the failure',async()=>{
 const f=await fixture();const result=await startCityRuntime({...options(f),loadGame:()=>{f.window.game={physics:{ready:false,failed:true,error:Error('physics failed'),dispose(){f.trace.disposed++;}},resetControls(){f.trace.reset++;}};}});
 assert.equal(result.blocked,true);assert.equal(f.window.game.paused,true);assert.equal(f.trace.disposed,1);f.listeners.get('pagehide')();assert.equal(f.trace.disposed,1);assert.equal(f.trace.released,1);unchanged(f);
});
test('normal ready lifecycle remains usable and releases only on pagehide',{timeout:2000},async()=>{
 const f=await fixture();let notifyReady,paused=true;const ready=new Promise(resolve=>notifyReady=resolve);
 const running=startCityRuntime({...options(f),loadGame:()=>{f.window.game={physics:{ready:true,failed:false,dispose(){f.trace.disposed++;}},resetControls(){},get paused(){return paused;},set paused(value){paused=value;if(value===false)notifyReady();}};}});
 await ready;
 assert.equal(f.document.documentElement.dataset.betaUiReady,'2');assert.equal(f.window.game.paused,false);assert.equal(f.window.__sunriseCitySession.canWrite(),true);assert.equal(f.trace.released,0);assert.equal(f.nodes.get('city-startup-home'),undefined);
 f.listeners.get('pagehide')();assert.deepEqual(await running,{released:true});assert.equal(f.trace.released,1);assert.equal(f.trace.disposed,1);unchanged(f);
});
test('top-level storage SecurityError is caught before dependencies load',async()=>{
 const {document,nodes}=documentFixture();globalThis.document=document;globalThis.window={get localStorage(){throw new DOMException('storage access denied','SecurityError');}};
 try{await import('../../sunset-coast/rapier/play/city-runtime-entry.js?storage-denied-test');assert.match(nodes.get('load-text').textContent,/storage access denied/);assert.ok(nodes.get('city-startup-home'));}
 finally{delete globalThis.window;delete globalThis.document;}
});
