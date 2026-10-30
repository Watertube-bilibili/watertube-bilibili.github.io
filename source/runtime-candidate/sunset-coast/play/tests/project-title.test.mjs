import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
test('one title owner converges after repeated engine startup and title replacement',()=>{
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),bridge=fs.readFileSync(new URL('../godot-physics.js',import.meta.url),'utf8');
 const code=html.match(/<script id="project-title-guard">([\s\S]*?)<\/script>/)[1];
 let callback,observers=0,writes=0,current='NEON COAST',removed=0;
 const document={head:{},get title(){return current},set title(v){writes++;current=v},getElementById(){return{remove(){removed++}}}};
 class MutationObserver{constructor(fn){observers++;callback=fn;}observe(node,opts){assert.equal(node,document.head);assert.equal(opts.subtree,true);}}
 const context=vm.createContext({document,MutationObserver,URLSearchParams,location:{search:''}});vm.runInContext(code,context);
 assert.equal(document.title,'SUNRISE COAST · ESTUARY 1.0 Beta');
 const engineTitle=bridge.match(/if\(typeof globalThis\.__sunriseRestoreTitle[\s\S]*?else\{const title=[^\n]+/)[0];
 for(let i=0;i<3;i++){document.title='NEON COAST';vm.runInContext(engineTitle,context);callback();}
 assert.equal(observers,1);assert.equal(document.title,'SUNRISE COAST · ESTUARY 1.0 Beta');
 const settled=writes;callback();callback();assert.equal(writes,settled);assert.ok(removed>0);
 assert.ok(html.indexOf('project-title-guard')<html.indexOf('type="module"'));
 assert.doesNotMatch(bridge,/new MutationObserver/);
});
