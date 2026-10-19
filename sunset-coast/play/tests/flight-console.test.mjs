import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {installRoadsterUI,renderRoadsterConsole,ROADSTER_BUTTONS,FLIGHT_CONTROL_GROUPS} from '../roadster-ui.js';

class Events{
 constructor(){this.listeners=new Map();}
 addEventListener(type,fn){this.listeners.set(type,[...(this.listeners.get(type)??[]),fn]);}
 removeEventListener(type,fn){this.listeners.set(type,(this.listeners.get(type)??[]).filter(f=>f!==fn));}
 emit(type,extra={}){const e={target:this,pointerId:1,button:0,clientX:100,clientY:100,cancelable:true,preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;},...extra};for(const fn of this.listeners.get(type)??[])fn(e);return e;}
}
class Node extends Events{
 constructor(tag,doc){super();this.tagName=tag.toUpperCase();this.ownerDocument=doc;this.children=[];this.attrs=new Map();this.dataset={};this.captures=new Set();this.values=new Map();this.classes=new Set();this.hidden=false;this.inert=false;
 this.style={getPropertyValue:n=>this.values.get(n)?.[0]??'',getPropertyPriority:n=>this.values.get(n)?.[1]??'',setProperty:(n,v,p='')=>this.values.set(n,[v,p]),removeProperty:n=>this.values.delete(n)};
 this.classList={contains:n=>this.classes.has(n),add:n=>this.classes.add(n),remove:n=>this.classes.delete(n),toggle:(n,force)=>{const yes=force??!this.classes.has(n);yes?this.classes.add(n):this.classes.delete(n);return yes;}};}
 set className(v){this.classes=new Set(v.split(/\s+/));}get className(){return [...this.classes].join(' ');}
 setAttribute(n,v){this.attrs.set(n,String(v));if(n==='class')this.className=v;if(n==='id')this.id=v;if(n==='hidden')this.hidden=true;if(n.startsWith('data-'))this.dataset[n.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;}
 getAttribute(n){return this.attrs.get(n)??null;}
 append(child){this.children.push(child);child.parentElement=this;}
 matches(s){if(s.startsWith('.'))return this.classes.has(s.slice(1));if(s.startsWith('#'))return this.id===s.slice(1);if(s==='[hidden]')return this.hidden;if(s==='[inert]')return this.inert;const a=s.match(/^\[([^=\]]+)(?:="?([^"\]]+)"?)?\]$/);return a?(a[2]===undefined?this.attrs.has(a[1]):this.attrs.get(a[1])===a[2]):this.tagName===s.toUpperCase();}
 closest(selector){for(let n=this;n;n=n.parentElement)if(selector.split(',').some(s=>n.matches(s)))return n;return null;}
 querySelectorAll(selector){const out=[];const visit=n=>{for(const c of n.children){if(selector.split(',').some(s=>c.matches(s)))out.push(c);visit(c);}};visit(this);return out;}
 querySelector(selector){return this.querySelectorAll(selector)[0]??null;}
 set innerHTML(html){this.children=[];const stack=[this];for(const match of html.matchAll(/<\/?([\w-]+)([^>]*)>/g)){if(match[0].startsWith('</')){stack.pop();continue;}const n=new Node(match[1],this.ownerDocument);for(const a of match[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g))n.setAttribute(a[1],a[2]??'');stack.at(-1).append(n);if(!['input','br','hr','img'].includes(match[1]))stack.push(n);}}
 setPointerCapture(id){this.captures.add(id);}hasPointerCapture(id){return this.captures.has(id);}releasePointerCapture(id){this.captures.delete(id);}
 getBoundingClientRect(){return {left:parseFloat(this.values.get('left')?.[0]??12),top:parseFloat(this.values.get('top')?.[0]??500),width:this.width??300,height:this.height??180};}
}
function fixture(){
 const view=new Events(),doc=new Events();Object.assign(view,{innerWidth:390,innerHeight:844,getComputedStyle:()=>({paddingLeft:'12px',paddingRight:'12px',paddingTop:'20px',paddingBottom:'34px'})});doc.defaultView=view;doc.body=new Node('body',doc);doc.createElement=t=>new Node(t,doc);doc.getElementById=id=>doc.body.querySelector('#'+id);
 globalThis.window=view;globalThis.document=doc;
 const game={inCar:true,physics:{ready:true},cameraMode:0,keys:{},touch:{},ui:{isPhoneOpen:()=>false,toast:message=>game.messages.push(message)},messages:[],vehicle:{model:{id:'roadster_rocket'},speed:0,battery:100,condition:100,grounded:false,roadsterRequest:{air:true},roadsterState:{mode:'air',altitude:5}},manualTakeover(){this.takeovers=(this.takeovers??0)+1;},pilot:{reset(){}}};
 const ui=installRoadsterUI(game),$=id=>doc.getElementById(id);return{game,ui,view,doc,$};
}
const source=readFileSync(new URL('../roadster-ui.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../flight-console.css',import.meta.url),'utf8');
const baseCss=readFileSync(new URL('../beta-interface.css',import.meta.url),'utf8');

test('all 15 held actions and meaningful labels survive source replacement',()=>{const html=renderRoadsterConsole();for(const[id,label]of ROADSTER_BUTTONS){assert.ok(html.includes(`data-roadster-control="${id}"`),id);assert.ok(html.includes('按住'+label),label);}assert.equal(FLIGHT_CONTROL_GROUPS.motion.length+FLIGHT_CONTROL_GROUPS.lift.length,9);assert.equal(FLIGHT_CONTROL_GROUPS.attitude.length,5);});
test('old three-column generators and their CSS are removed, not hidden',()=>{for(const text of [source,baseCss,css])assert.doesNotMatch(text,/roadster-flight-left|roadster-flight-right|class="roadster-attitude"|\.roadster-attitude\b|\.roadster-status\b/);assert.doesNotMatch(source,/installPanelLayout|vehicle-panel-dragbar/);assert.match(css,/flight-motion-row\{grid-template-columns:repeat\(4,minmax\(44px,1fr\)\)/);assert.match(css,/flight-lift-row,\.flight-attitude-row\{grid-template-columns:repeat\(5,minmax\(44px,1fr\)\)/);});
test('two dedicated handles exist; no size handle and no bottom three-column layout',()=>{const h=fixture();assert.equal(h.ui.root.querySelectorAll('[data-flight-drag]').length,2);assert.equal(h.ui.root.querySelector('.flight-console').hidden,false);assert.equal(h.$('flight-attitude').hidden,true);assert.equal(h.$('flight-command-deck').hidden,false);assert.ok(h.$('roadster-details-toggle').classList.contains('flight-launcher'));assert.doesNotMatch(css,/resize:|nwse-resize|top:45%/);});
test('hold/release semantics, different fingers and cancellation remain production handlers',()=>{const h=fixture(),forward=h.ui.root.querySelector('[data-roadster-control="forward"]'),up=h.ui.root.querySelector('[data-roadster-control="up"]');forward.emit('pointerdown');up.emit('pointerdown',{pointerId:2});assert.equal(h.game.roadsterTouch.forward,true);assert.equal(h.game.roadsterTouch.up,true);forward.emit('pointerup');assert.equal(h.game.roadsterTouch.forward,false);assert.equal(h.game.roadsterTouch.up,true);up.emit('pointercancel',{pointerId:2});assert.equal(h.game.roadsterTouch.up,false);});
test('attitude and options can open/close; folding clears held commands',()=>{const h=fixture();h.$('roadster-attitude-toggle').onclick();assert.equal(h.$('flight-attitude').hidden,false);h.$('flight-attitude-close').onclick();assert.equal(h.$('flight-attitude').hidden,true);h.$('roadster-details-toggle').onclick();assert.equal(h.$('flight-console-options').hidden,false);h.$('flight-options-close').onclick();assert.equal(h.$('flight-console-options').hidden,true);h.ui.root.querySelector('[data-roadster-control="forward"]').emit('pointerdown');h.$('flight-console-fold').onclick();assert.equal(h.$('flight-command-deck').hidden,true);assert.equal(h.game.roadsterTouch.forward,false);h.$('flight-console-fold').onclick();assert.equal(h.$('flight-command-deck').hidden,false);});
test('P parking lock still rejects takeoff and maneuvers through actual UI buttons',()=>{const h=fixture();h.game.vehicle.parkingBrakeEngaged=true;h.game.vehicle.roadsterRequest.air=false;h.game.vehicle.roadsterState.mode='road';h.game.vehicle.grounded=true;h.ui.update();h.$('roadster-air-toggle').onclick();h.$('roadster-vault').onclick();assert.equal(h.game.vehicle.roadsterRequest.air,false);assert.notEqual(h.game.vehicle.roadsterRequest.pending,true);assert.equal(h.game.messages.length,2);assert.ok(h.game.messages.every(m=>m.includes('P 驻车中')));});
test('drag moves only its panel, clamps to safe area, and never writes size or storage',()=>{const h=fixture(),panel=h.ui.root.querySelector('.flight-console'),handle=h.ui.root.querySelector('[data-flight-drag="console"]');globalThis.localStorage={getItem(){throw Error('storage read');},setItem(){throw Error('storage write');}};handle.emit('pointerdown');handle.emit('pointermove',{clientX:9999,clientY:9999});assert.equal(panel.values.get('left')[0],'78px');assert.equal(panel.values.get('top')[0],'630px');assert.equal(h.$('flight-attitude').values.size,0);assert.ok(![...panel.values.keys()].some(k=>/width|height/.test(k)));handle.emit('pointercancel');assert.equal(handle.captures.size,0);h.view.innerWidth=320;h.view.innerHeight=568;h.view.emit('resize');assert.equal(panel.values.get('left')[0],'12px');assert.equal(panel.values.get('top')[0],'354px');delete globalThis.localStorage;});
test('drag ignores other finger/button, releases on hiding and blur; Home restores CSS dock',()=>{const h=fixture(),panel=h.ui.root.querySelector('.flight-console'),handle=h.ui.root.querySelector('[data-flight-drag="console"]');handle.emit('pointerdown',{target:h.$('flight-console-fold')});assert.equal(handle.captures.size,0);handle.emit('pointerdown');handle.emit('pointermove',{pointerId:2,clientX:500});assert.equal(panel.values.size,0);handle.emit('pointerup',{pointerId:2});assert.equal(handle.captures.size,1);handle.emit('pointermove',{clientX:150});panel.hidden=true;handle.emit('pointermove',{clientX:250});assert.equal(handle.captures.size,0);panel.hidden=false;handle.emit('pointerdown');h.view.emit('blur');assert.equal(handle.captures.size,0);handle.emit('keydown',{key:'Home'});assert.equal(panel.values.size,0);assert.notEqual(handle.emit('keyup',{key:'ArrowLeft'}).stopped,true);});
test('phone/modal activity and vehicle switching clear active held inputs',()=>{const h=fixture();const b=h.ui.root.querySelector('[data-roadster-control="forward"]');b.emit('pointerdown');h.game.paused=true;h.ui.update();assert.equal(h.game.roadsterTouch.forward,false);assert.equal(h.ui.root.inert,true);h.game.paused=false;h.game.vehicle={model:{id:'s'},speed:0};h.ui.update();assert.equal(h.ui.root.hidden,true);assert.equal(h.$('flight-attitude').hidden,true);});
test('CSS targets stay >=44px and reserve iOS safe-area edges',()=>{assert.match(css,/min-width:44px;min-height:44px/);assert.match(css,/min-height:52px/);for(const edge of ['left','right','bottom','top'])assert.ok(css.includes(`env(safe-area-inset-${edge})`));assert.match(css,/width:min\(420px,calc\(100vw - var\(--flight-left\) - var\(--flight-right\)\)\)/);});

for(const[width,height]of [[568,320],[667,375]])test(`short landscape ${width}x${height} switches between movement and attitude without stacked overflow`,()=>{const h=fixture();h.view.innerWidth=width;h.view.innerHeight=height;h.$('roadster-attitude-toggle').onclick();assert.equal(h.$('flight-attitude').hidden,false);assert.equal(h.$('flight-command-deck').hidden,true);h.$('flight-console-fold').onclick();assert.equal(h.$('flight-command-deck').hidden,false);assert.equal(h.$('flight-attitude').hidden,true);assert.match(css,/bottom:calc\(var\(--flight-bottom\) \+ 64px\)/);});

test('ground aero-brake feedback follows native wing output in every Roadster trim',()=>{
 const h=fixture();
 for(const id of ['roadster','roadster_thrust','roadster_rocket']){
  Object.assign(h.game.vehicle,{model:{id},speed:60,grounded:true,roadsterRequest:{air:false,aeroMode:'lowDrag'},roadsterState:{mode:'road',wing:1,wingPitch:.6}});h.ui.update();
  assert.equal(h.$('flight-launcher-label').textContent,'气动制动 · 工作中');assert.equal(h.$('roadster-wing-toggle').textContent,'气动制动 · 自动');assert.equal(h.game.vehicle.roadsterRequest.aeroMode,'lowDrag');assert.equal(h.$('flight-command-deck').hidden,true);
  h.game.vehicle.roadsterState.wingPitch=.35;h.ui.update();assert.equal(h.$('flight-launcher-label').textContent,'车辆选项');assert.equal(h.$('roadster-wing-toggle').textContent,'低风阻模式 · Y');
 }
});
test('P, flight and unavailable physics never announce active ground aero braking',()=>{
 for(const change of [{parkingBrakeEngaged:true},{grounded:false},{roadsterState:{mode:'air',wing:1,wingPitch:.6}}]){
  const h=fixture();Object.assign(h.game.vehicle,{speed:60,grounded:true,roadsterRequest:{air:false},roadsterState:{mode:'road',wing:1,wingPitch:.6}},change);h.ui.update();assert.notEqual(h.$('flight-launcher-label').textContent,'气动制动 · 工作中');
 }
 const h=fixture();Object.assign(h.game.vehicle,{speed:60,grounded:true,roadsterRequest:{air:false},roadsterState:{mode:'road',wing:1,wingPitch:.6}});h.game.physics.ready=false;h.ui.update();assert.notEqual(h.$('flight-launcher-label').textContent,'气动制动 · 工作中');
});
