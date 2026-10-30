import test from 'node:test';
import assert from 'node:assert/strict';
import {installBrowserWorldChooser} from '../browser-world-chooser.js';

const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
const turn=()=>new Promise(resolve=>setImmediate(resolve));
function element(tag){return{tag,children:[],textContent:'',disabled:false,append(...items){this.children.push(...items);},replaceChildren(...items){this.children=[...items];}};}
function fixture(overrides={}){
 const root=element('main'),status=element('div'),window=new EventTarget(),navigation=[],slots={estuary:[],crescent:[]};
 const document={getElementById:id=>id==='worlds'?root:status,createElement:element};
 const createSlot=async(_storage,map)=>{const entry={id:'b-new-'+map,save:{money:12500}};slots[map].push(entry);return entry;};
 const chooser=installBrowserWorldChooser({document,window,storage:{},location:{assign:url=>navigation.push(url)},validate:s=>s,createSlot,listSlots:async(_storage,map)=>slots[map],...overrides});
 const emit=(type,persisted=true)=>{const event=new Event(type);Object.defineProperty(event,'persisted',{value:persisted});window.dispatchEvent(event);};
 return{chooser,root,status,window,navigation,slots,emit,button:()=>root.children[0].children.find(x=>x.tag==='button')};
}

test('BFCache Back rereads a newly created slot and restores an enabled create button',async()=>{
 const f=fixture();try{await f.chooser.ready;const old=f.button();assert.equal(await old.onclick(),true);assert.equal(old.disabled,true);assert.equal(f.navigation.length,1);
  f.emit('pagehide');f.emit('pageshow');await turn();const current=f.button();assert.notEqual(current,old);assert.equal(current.disabled,false);assert.equal(f.root.children.length,2);const link=f.root.children[0].children.find(x=>x.tag==='a');assert.ok(link);assert.match(link.textContent,/12,500/);assert.match(link.href,/browserSlot=b-new-estuary/);
 }finally{f.chooser.dispose();}
});

test('overlapping renders ignore a stale list response rather than appending an old slot',async()=>{
 const gate=deferred();let calls=0;const f=fixture({listSlots:async(_storage,map)=>map==='estuary'&&++calls===1?gate.promise:[]});
 try{const oldSection=f.root.children[0];await f.chooser.render();gate.resolve([{id:'b-stale',save:{money:1}}]);await f.chooser.ready;assert.equal(f.root.children.length,2);assert.equal(f.root.children.some(s=>s.children.some(x=>x.tag==='a')),false);assert.equal(oldSection.children.some(x=>x.tag==='a'),false);
 }finally{f.chooser.dispose();}
});

test('late create completion after departure cannot redirect the restored hub',async()=>{
 const gate=deferred(),f=fixture({createSlot:()=>gate.promise});try{await f.chooser.ready;const pending=f.button().onclick();f.emit('pagehide');f.emit('pageshow');await turn();gate.resolve({id:'b-late',save:{money:12500}});assert.equal(await pending,false);assert.deepEqual(f.navigation,[]);assert.equal(f.button().disabled,false);
 }finally{f.chooser.dispose();}
});

test('late list or create errors cannot overwrite a newer UI status',async()=>{
 const listGate=deferred(),createGate=deferred();let first=true;const f=fixture({listSlots:async()=>{if(first){first=false;return listGate.promise;}return[];},createSlot:()=>createGate.promise});
 try{await f.chooser.render();const pending=f.button().onclick();await f.chooser.render();f.status.textContent='current-status';listGate.reject(Error('old-list-error'));createGate.reject(Error('old-create-error'));await f.chooser.ready;await pending;assert.equal(f.status.textContent,'current-status');assert.equal(f.button().disabled,false);
 }finally{f.chooser.dispose();}
});

test('current create failure restores the button; repeated clicks do not duplicate requests',async()=>{
 const gate=deferred();let creates=0;const f=fixture({createSlot:()=>{creates++;return gate.promise;}});try{await f.chooser.ready;const button=f.button(),pending=button.onclick();assert.equal(await button.onclick(),false);assert.equal(creates,1);gate.reject(Error('safe lock unavailable'));assert.equal(await pending,false);assert.equal(button.disabled,false);assert.equal(f.status.textContent,'safe lock unavailable');
 }finally{f.chooser.dispose();}
});
