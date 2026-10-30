import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBrowserWorldLifecycle} from '../browser-world-lifecycle.js';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const constructor=source.slice(source.indexOf(' constructor('),source.indexOf('\n async startPhysics('));
const startPhysics=source.slice(source.indexOf(' async startPhysics('),source.indexOf('\n onPhysicsFailure('));
const noop=()=>{};

for(const browser of [true,false])test('real constructor WebGL failure '+(browser?'propagates in independent browser world':'retains native retry UI'),()=>{
 const error=Error('WebGL unavailable'),events=[],nodes=new Map();
 const $=id=>{if(!nodes.has(id))nodes.set(id,{style:{},classList:{add:()=>events.push('retry-ui')},append:noop});return nodes.get(id);};
 const lifecycle=browser?{fail:e=>events.push(e)}:undefined;
 const deps={lifecycle,BROWSER_WORLD:browser?{map:'estuary'}:null,COMMON_MAP:browser,restoreAssistSettings:()=>({}),localStorage:{},restoreQualityPreference:()=> 'low',getPerformanceProfile:()=>({}),THREE:{WebGLRenderer:class {constructor(){throw error;}}},$,location:{search:browser?'?runtime=browser&world=estuary&browserSlot=b-test':'',reload:noop},document:{createElement:()=>({})},console:{error:e=>events.push(e)}};
 const Game=new Function(...Object.keys(deps),'return class Game { browserWorldLifecycle=lifecycle;'+constructor+'}')( ...Object.values(deps));
 if(browser){assert.throws(()=>new Game(),e=>e===error);assert.deepEqual(events,[error]);assert.equal(nodes.get('load-text'),undefined);}
 else{assert.doesNotThrow(()=>new Game());assert.ok(events.includes('retry-ui'));assert.match(nodes.get('load-text').textContent,/WebGL/);}
});

function fixture(){
 const events=[],window=new EventTarget();window.location={reload:noop};
 const nodes={loading:{style:{},hidden:false}};
 let game;
 const lifecycle=createBrowserWorldLifecycle({window,getGame:()=>game});
 let owned=true;const lease={ownsLock:()=>owned,release:()=>{owned=false;events.push('release');}};
 lifecycle.trackLease(lease);
 const run=new Function('$','setTimeout','installReleaseUI','console','return ({'+startPhysics+'}).startPhysics')(id=>nodes[id],fn=>events.push(fn),()=>events.push('native-ui'),{error:()=>events.push('log')});
 game={browserWorldLifecycle:lifecycle,paused:false,save:()=>events.push('write'),resetControls:noop,physics:{capabilities:{native3D:false},start:async()=>{}}};
 lifecycle.trackGame(game);
 return {game,lifecycle,events,nodes,run:()=>run.call(game)};
}

test('real asynchronous physics start rejection closes writes, pauses game and releases lease',async()=>{
 const f=fixture(),error=Error('physics rejected');f.lifecycle.enableWrites();f.game.physics.start=async()=>{throw error;};
 assert.equal(await f.run(),false);assert.equal(f.lifecycle.stopped,true);assert.equal(f.game.paused,true);assert.equal(f.game.save(),false);assert.deepEqual(f.events,['release']);assert.throws(()=>f.lifecycle.checkpoint(),e=>e===error);
});

test('real browser physics readiness succeeds without native UI and delayed hide obeys departure',async()=>{
 const f=fixture();assert.equal(await f.run(),true);assert.equal(f.lifecycle.stopped,false);assert.equal(f.nodes.loading.style.opacity,'0');assert.equal(f.events.length,1);f.lifecycle.fail(Error('departure'));f.events[0]();assert.equal(f.nodes.loading.hidden,false);
});

test('native physics start rejection keeps existing logging behavior without browser lifecycle',async()=>{
 const events=[];const run=new Function('$','setTimeout','installReleaseUI','console','return ({'+startPhysics+'}).startPhysics')(noop,noop,noop,{error:()=>events.push('native-log')});
 assert.equal(await run.call({physics:{start:async()=>{throw Error('native failure');}}}),false);assert.deepEqual(events,['native-log']);
});
