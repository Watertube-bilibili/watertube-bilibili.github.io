import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {installHiddenCheatEntry} from '../hidden-cheat-entry.js';

function harness(){
 const listeners=new Map();
 const phone={
  addEventListener:(type,listener,capture)=>listeners.set(type,{listener,capture}),
  removeEventListener:(type,listener,capture)=>{const current=listeners.get(type);if(current?.listener===listener&&current.capture===capture)listeners.delete(type);},
  contains:button=>button.owner===phone,
 };
 const button=(kind='save',data='interfacePage')=>({owner:phone,disabled:false,dataset:{[data]:kind}});
 const click=(button,{nested=false,type='click'}={})=>{
  const event={prevented:false,stopped:false,
   target:{closest:selector=>{
    assert.equal(selector,'button[data-interface-page="save"],button[data-page="save"]');
    return button&&(button.dataset.interfacePage==='save'||button.dataset.page==='save')?button:null;
   }},
   preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;},
  };
  // The target can be a nested SVG path or label, not the matching button itself.
  if(!nested)event.target=Object.assign(button||{},event.target);
  listeners.get(type)?.listener(event);
  return event;
 };
 return{phone,listeners,button,click};
}

test('delegated save category needs ten clicks, reveals once, and preserves the first nine',()=>{
 const h=harness();let reveals=0;
 installHiddenCheatEntry(h.phone,()=>reveals++);
 assert.deepEqual([...h.listeners.keys()],['click']);
 assert.equal(h.listeners.get('click').capture,true);
 for(let i=0;i<9;i++){
  const event=h.click(h.button());
  assert.equal(event.prevented,false);assert.equal(event.stopped,false);assert.equal(reveals,0);
 }
 const tenth=h.click(h.button());
 assert.equal(reveals,1);assert.equal(tenth.prevented,true);assert.equal(tenth.stopped,true);
 for(let i=0;i<20;i++)assert.equal(h.click(h.button()).stopped,false);
 assert.equal(reveals,1);
});

test('recreated save tiles and nested SVG/label clicks share the category counter',()=>{
 const h=harness();let reveals=0;
 installHiddenCheatEntry(h.phone,()=>reveals++);
 for(let i=0;i<9;i++)h.click(h.button('save',i%2?'page':'interfacePage'),{nested:true});
 assert.equal(reveals,0);
 h.click(h.button('save','page'),{nested:true});
 assert.equal(reveals,1);
});

test('non-save navigation, status, save actions, outside or disabled targets do not count',()=>{
 const h=harness();let reveals=0;
 installHiddenCheatEntry(h.phone,()=>reveals++);
 for(let i=0;i<12;i++){
  for(const page of ['home','nav','jobs','garage','cheats'])h.click(h.button(page));
  for(const id of ['phone-time','phone-save-now','phone-load','phone-import','phone-export','save-btn'])h.click({...h.button(''),id});
  h.click({...h.button(),owner:{}});
  h.click({...h.button(),disabled:true});
  h.click(null);
 }
 assert.equal(reveals,0);
 for(let i=0;i<9;i++)h.click(h.button());
 assert.equal(reveals,0);h.click(h.button());assert.equal(reveals,1);
});

test('pointer and touch events do not double count click',()=>{
 const h=harness();let reveals=0;
 installHiddenCheatEntry(h.phone,()=>reveals++);
 for(let i=0;i<9;i++){
  for(const type of ['pointerdown','pointerup','touchstart','touchend'])h.click(h.button(),{type});
  h.click(h.button());
 }
 assert.equal(reveals,0);h.click(h.button());assert.equal(reveals,1);
});

test('new session starts locked and cleanup removes the handler',()=>{
 const h=harness();let reveals=0;
 const remove=installHiddenCheatEntry(h.phone,()=>reveals++);
 for(let i=0;i<10;i++)h.click(h.button());
 assert.equal(reveals,1);remove();assert.equal(h.listeners.size,0);
 installHiddenCheatEntry(h.phone,()=>reveals++);
 for(let i=0;i<9;i++)h.click(h.button());
 assert.equal(reveals,1);h.click(h.button());assert.equal(reveals,2);
 assert.doesNotThrow(()=>installHiddenCheatEntry(null,()=>{})());
});

test('GameUI binds once on phone, opens terminal, and interface category uses no synthetic clicks',()=>{
 const ui=readFileSync(new URL('../ui.js',import.meta.url),'utf8');
 const view=readFileSync(new URL('../interface-view.js',import.meta.url),'utf8');
 assert.match(ui,/installHiddenCheatEntry\(\$\('phone'\),\(\)=>\{this\.cheatsUnlocked=true;this\.renderPhone\('cheats'\)/);
 assert.match(ui,/\$\('phone'\)\.addEventListener\('click',e=>/);
 assert.doesNotMatch(ui,/installHiddenCheatEntry\(document\.querySelector/);
 assert.doesNotMatch(ui,/querySelectorAll\('\[data-page\]'\)\.forEach/);
 assert.doesNotMatch(view,/home\?\.click\(\)/);
 assert.doesNotMatch(view,/\.click\(\)/);
});
