import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {installCityChooser} from '../../sunset-coast/rapier/play/city-chooser.js';

const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const turn=()=>new Promise(resolve=>setImmediate(resolve));
class Element{
 constructor(tag='div'){this.tag=tag;this.children=[];this.disabled=false;this.hidden=false;this.value='';this.files=[];this.textContent='';}
 append(...nodes){this.children.push(...nodes);}
 prepend(...nodes){this.children.unshift(...nodes);}
 replaceChildren(...nodes){this.children=[...nodes];}
}
const entry=(slot='s-created')=>({slot,save:{money:12500},record:{source:{kind:'fresh',key:null}}});
function fixture(overrides={}){
 const nodes=Object.fromEntries(['status','originals','candidates','fresh','import-file','retry-init'].map(id=>[id,new Element()]));
 const document={documentElement:{dataset:{}},getElementById:id=>nodes[id],createElement:tag=>new Element(tag)};
 const trace={loads:0,gets:0,lists:[],creates:[],navigation:[]},storage=Object.freeze({identity:'read-only fixture'});
 const dependencies={validateSave:()=>{},listCitySlots:async s=>{assert.equal(s,storage);trace.lists.push('candidate');return[];},
  listOriginalSources:async s=>{assert.equal(s,storage);trace.lists.push('original');return[{source:{key:'original-key'},save:{money:42}}];},
  createCitySlot:async(s,options)=>{assert.equal(s,storage);trace.creates.push(options);return entry();},...overrides.dependencies};
 const load=overrides.load??(async()=>dependencies),get=overrides.get??(()=>storage),navigate=overrides.navigate??(()=>{});
 const controller=installCityChooser({document,getStorage:()=>{trace.gets++;return get();},loadDependencies:()=>{trace.loads++;return load();},navigate:async url=>{trace.navigation.push(url);return navigate(url);}});
 return {controller,document,nodes,trace,storage,dependencies,copyButton:()=>nodes.originals.children.flatMap(row=>row.children).find(node=>node.tag==='button')};
}
function click(node){return node.onclick({preventDefault(){this.prevented=true;}});}
function linkAllowed(node){const event={prevented:false,preventDefault(){this.prevented=true;}};node.onclick(event);return !event.prevented;}
function fileSelection(f,text,size=10){f.nodes['import-file'].files=[{size,text}];return f.nodes['import-file'].onchange();}

test('controller binds first, blocks operations during delayed imports, and initial load creates nothing',async()=>{
 const gate=deferred(),f=fixture({load:()=>gate.promise});
 assert.equal(f.controller.phase,'loading');assert.equal(typeof f.nodes.fresh.onclick,'function');assert.equal(typeof f.nodes['import-file'].onchange,'function');
 assert.equal(f.nodes.fresh.disabled,true);assert.equal(f.nodes['import-file'].disabled,true);assert.match(f.nodes.status.textContent,/初始化/);
 assert.equal(await click(f.nodes.fresh),false);assert.equal(await fileSelection(f,async()=> 'bytes'),false);assert.equal(f.trace.gets,0);
 gate.resolve(f.dependencies);assert.equal(await f.controller.initialized,true);assert.equal(f.controller.phase,'ready');assert.equal(f.trace.creates.length,0);assert.deepEqual(f.trace.navigation,[]);
 assert.equal(f.nodes.fresh.disabled,false);assert.equal(f.copyButton().disabled,false);
 const source=readFileSync(new URL('../../sunset-coast/rapier/play/city-chooser.js',import.meta.url),'utf8');
 assert.doesNotMatch(source,/^\s*import\s/m);assert.match(source,/import\('\.\/city-save-store\.js'\)/);assert.match(source,/import\('\.\/save-validation\.js'\)/);
});

test('both read-only lists must finish before readiness or copy controls appear',async()=>{
 const city=deferred(),original=deferred(),f=fixture({dependencies:{listCitySlots:()=>city.promise,listOriginalSources:()=>original.promise}});
 await turn();city.resolve([entry('s-existing')]);await turn();assert.equal(f.controller.phase,'loading');assert.equal(f.nodes.candidates.children.length,0);
 assert.equal(await click(f.nodes.fresh),false);original.resolve([]);await f.controller.initialized;
 assert.equal(f.controller.phase,'ready');assert.equal(f.nodes.candidates.children[0].href,new URL('../../sunset-coast/rapier/play/?citySlot=s-existing',import.meta.url).href);assert.equal(f.trace.creates.length,0);
});

test('dependency rejection is visible and explicit retry only reinitializes',async()=>{
 let calls=0;const f=fixture({load:async()=>{if(++calls===1)throw Error('dependency unavailable');return f.dependencies;}});
 assert.equal(await f.controller.initialized,false);assert.equal(f.controller.phase,'init-error');assert.match(f.nodes.status.textContent,/dependency unavailable/);
 assert.equal(f.nodes['retry-init'].hidden,false);assert.equal(await click(f.nodes.fresh),false);assert.equal(await click(f.nodes['retry-init']),true);
 assert.equal(f.controller.phase,'ready');assert.equal(f.trace.loads,2);assert.equal(f.trace.creates.length,0);assert.deepEqual(f.trace.navigation,[]);
});

test('localStorage SecurityError during initialization is visible and invokes no storage operation',async()=>{
 const f=fixture({get:()=>{throw new DOMException('storage denied','SecurityError');}});
 assert.equal(await f.controller.initialized,false);assert.match(f.nodes.status.textContent,/storage denied/);assert.equal(f.controller.phase,'init-error');
 assert.deepEqual(f.trace.lists,[]);assert.deepEqual(f.trace.creates,[]);assert.deepEqual(f.trace.navigation,[]);
});

test('late completion of an obsolete failed listing cannot overwrite an active operation',async()=>{
 const obsolete=deferred(),creation=deferred();let rounds=0;
 const f=fixture({dependencies:{listCitySlots:async()=>{if(++rounds===1)throw Error('first list denied');return[];},
  listOriginalSources:()=>rounds===1?obsolete.promise:Promise.resolve([]),createCitySlot:()=>creation.promise}});
 await f.controller.initialized;assert.equal(f.controller.phase,'init-error');await click(f.nodes['retry-init']);assert.equal(f.controller.phase,'ready');
 const operation=click(f.nodes.fresh);await turn();const status=f.nodes.status.textContent;
 obsolete.reject(Error('late original-list failure'));await turn();assert.equal(f.controller.phase,'busy');assert.equal(f.nodes.status.textContent,status);
 creation.resolve(entry());await operation;assert.equal(f.controller.phase,'navigating');
});

test('fresh, copy, file and existing-link actions cannot compete with a pending create',async()=>{
 const gate=deferred();let creates=0;const f=fixture({dependencies:{listCitySlots:async()=>[entry('s-existing')],createCitySlot:()=>{creates++;return gate.promise;}}});
 await f.controller.initialized;const active=click(f.nodes.fresh);await turn();assert.equal(creates,1);
 assert.equal(await click(f.nodes.fresh),false);assert.equal(await click(f.copyButton()),false);assert.equal(await fileSelection(f,async()=> 'other'),false);
 assert.equal(linkAllowed(f.nodes.candidates.children[0]),false);assert.equal(f.copyButton().disabled,true);
 gate.resolve(entry());await active;assert.equal(creates,1);assert.deepEqual(f.trace.navigation,[new URL('../../sunset-coast/rapier/play/?citySlot=s-created',import.meta.url).href]);
});

test('file.text holds the same operation lock before creation starts',async()=>{
 const read=deferred(),f=fixture();await f.controller.initialized;
 const operation=fileSelection(f,()=>read.promise);assert.equal(f.controller.phase,'busy');assert.equal(f.trace.creates.length,0);
 assert.equal(await click(f.nodes.fresh),false);assert.equal(await click(f.copyButton()),false);assert.equal(await fileSelection(f,async()=> 'competing'),false);
 read.resolve('exact original file bytes');await operation;assert.equal(f.trace.creates.length,1);assert.equal(f.trace.creates[0].fileRaw,'exact original file bytes');
 assert.equal(f.nodes['import-file'].value,'');assert.equal(f.trace.navigation.length,1);
});

test('oversize and failed file reads restore readiness without invoking creation',async()=>{
 const f=fixture();await f.controller.initialized;
 await fileSelection(f,()=>{throw Error('must not read oversized file');},512*1024+1);assert.equal(f.controller.phase,'ready');assert.match(f.nodes.status.textContent,/512 KiB/);
 await fileSelection(f,async()=>{throw Error('file unreadable');});assert.equal(f.controller.phase,'ready');assert.match(f.nodes.status.textContent,/file unreadable/);assert.equal(f.trace.creates.length,0);
});

test('storage getter failure after readiness does not begin a create',async()=>{
 let fail=false;const f=fixture({get:()=>{if(fail)throw new DOMException('later storage denied','SecurityError');return f.storage;}});
 await f.controller.initialized;fail=true;await click(f.nodes.fresh);assert.equal(f.controller.phase,'ready');assert.match(f.nodes.status.textContent,/未开始创建/);assert.equal(f.trace.creates.length,0);
});

test('confirmed cleanup returns ready but never retries creation automatically',async()=>{
 let creates=0;const f=fixture({dependencies:{createCitySlot:async()=>{creates++;throw Object.assign(Error('quota'),{code:'CITY_SLOT_CREATE_FAILED',uncertain:false});}}});
 await f.controller.initialized;await click(f.nodes.fresh);assert.equal(f.controller.phase,'ready');assert.match(f.nodes.status.textContent,/已确认清理/);await turn();assert.equal(creates,1);
 await click(f.copyButton());assert.equal(creates,2);assert.equal(f.trace.navigation.length,0);
});

test('uncertain cleanup permanently blocks writes in this page, including synthetic events',async()=>{
 let creates=0;const f=fixture({dependencies:{createCitySlot:async()=>{creates++;throw Object.assign(Error('cleanup unreadable'),{code:'CITY_SLOT_CREATE_UNCERTAIN',uncertain:true});}}});
 await f.controller.initialized;await click(f.nodes.fresh);assert.equal(f.controller.phase,'blocked');assert.equal(f.nodes.fresh.disabled,true);assert.equal(f.nodes['retry-init'].hidden,true);
 assert.equal(await click(f.nodes.fresh),false);assert.equal(await click(f.copyButton()),false);assert.equal(await fileSelection(f,async()=> 'bytes'),false);assert.equal(await click(f.nodes['retry-init']),false);
 assert.equal(creates,1);assert.equal(f.trace.loads,1);assert.equal(f.trace.navigation.length,0);
});

test('unknown create errors require an explicit read-only recheck without asserting successful cleanup',async()=>{
 let creates=0;const f=fixture({dependencies:{createCitySlot:async()=>{creates++;throw Error('unknown result');}}});
 await f.controller.initialized;await click(f.nodes.fresh);assert.equal(f.controller.phase,'init-error');assert.match(f.nodes.status.textContent,/未确认创建结果/);assert.doesNotMatch(f.nodes.status.textContent,/已确认清理/);
 assert.equal(await click(f.nodes.fresh),false);await click(f.nodes['retry-init']);assert.equal(f.controller.phase,'ready');assert.equal(creates,1);assert.equal(f.trace.loads,2);
});

test('navigation rejection exposes the confirmed slot without allowing a duplicate create',async()=>{
 const f=fixture({navigate:()=>{throw Error('navigation denied');}});await f.controller.initialized;await click(f.nodes.fresh);
 assert.equal(f.controller.phase,'navigation-error');assert.equal(f.nodes.fresh.disabled,true);assert.match(f.nodes.status.textContent,/s-created 已创建/);
 const link=f.nodes.candidates.children[0];assert.equal(link.href,new URL('../../sunset-coast/rapier/play/?citySlot=s-created',import.meta.url).href);assert.equal(linkAllowed(link),true);
 assert.equal(await click(f.nodes.fresh),false);assert.equal(await click(f.nodes['retry-init']),false);assert.equal(f.trace.creates.length,1);assert.equal(f.trace.navigation.length,1);
});

test('per-entry validation errors remain read-only while valid source cards pass the exact source key',async()=>{
 const f=fixture({dependencies:{listCitySlots:async()=>[{slot:'s-bad',error:'backup invalid'}],listOriginalSources:async()=>[
  {source:{key:'invalid-original'},error:'source invalid'},{source:{key:'exact-original-key'},save:{money:5}}]}});
 await f.controller.initialized;assert.equal(f.controller.phase,'ready');assert.equal(f.nodes.candidates.children[0].tag,'p');assert.match(f.nodes.candidates.children[0].textContent,/backup invalid/);
 assert.equal(f.nodes.originals.children.flatMap(row=>row.children).filter(node=>node.tag==='button').length,1);
 await click(f.copyButton());assert.equal(f.trace.creates[0].sourceKey,'exact-original-key');assert.equal(f.trace.creates.length,1);
});
