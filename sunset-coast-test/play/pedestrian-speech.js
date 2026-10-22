import * as THREE from './vendor/three.module.js';

export const SPEECH_LIMITS=Object.freeze({blockedDelay:1.3,duration:2.8,actorCooldown:9,globalCooldown:.85,maxVisible:3,maxDistance:48});
export const PEDESTRIAN_LINES=Object.freeze({
 blocked:Object.freeze(['让一让啊！','这儿还要走人呢！','借过，别堵路啊！','路又不是你家的！','挪一挪，挡着了！','堵这儿干什么呢！']),
 vehicleImpact:Object.freeze(['会不会开车啊！','看着点，撞到人了！','你把马路当赛道啊！','靠，刹车不会踩啊！','开车倒是看路啊！','悠着点，我又不是路桩！']),
 footImpact:Object.freeze(['走路看着点啊！','挤什么，路这么宽！','哎哟，撞着我了！','赶路也别撞人啊！'])
});
const STYLE_ID='pedestrian-speech-style';
const CSS=`
.pedestrian-speech-layer{position:fixed;inset:0;overflow:hidden;pointer-events:none!important;user-select:none;z-index:7;contain:layout style paint}
.pedestrian-speech{position:absolute;left:0;top:0;max-width:220px;padding:8px 12px;border:1px solid rgba(27,36,39,.78);border-radius:12px 12px 12px 3px;background:rgba(255,250,232,.97);color:#253037;box-shadow:0 3px 12px #07101745;font:600 14px/1.4 system-ui,'Noto Sans SC',sans-serif;white-space:nowrap;pointer-events:none!important;will-change:transform,opacity}
.pedestrian-speech::after{content:'';position:absolute;left:calc(50% - 4px);bottom:-5px;width:8px;height:8px;transform:rotate(45deg);background:#fff9e8;border-right:1px solid #253037aa;border-bottom:1px solid #253037aa}
.pedestrian-speech[data-kind='vehicleImpact'],.pedestrian-speech[data-kind='footImpact']{background:#ffe5ce;border-color:#a65d3b;color:#6c301b}
.pedestrian-speech[data-kind='vehicleImpact']::after,.pedestrian-speech[data-kind='footImpact']::after{background:#ffe5ce}
@media(max-width:600px){.pedestrian-speech{font-size:13px;padding:7px 10px;max-width:190px}}
`;
const actorGone=p=>!p?.root||p.root.visible===false||p.dead===true||p.removed===true||(Number.isFinite(p.health)&&p.health<=0);

// View-only overlay: never enters scene meshes, physics, perception, or input.
export class PedestrianSpeech {
 constructor({document:documentRef=globalThis.document,limits={}}={}){
  this.document=documentRef;this.limits={...SPEECH_LIMITS,...limits};this.states=new WeakMap();this.active=new Map();this.lastSpoke=-Infinity;this.lineSerial=0;this.anchor=new THREE.Vector3();this.ndc=new THREE.Vector3();
 }
 state(actor){let s=this.states.get(actor);if(!s){s={blockedFor:0,lastSpoke:-Infinity,origin:actor.origin,lastX:actor.root.position.x,lastZ:actor.root.position.z};this.states.set(actor,s);}return s;}
 sync(actor){const s=this.state(actor),p=actor.root.position;
  if(actorGone(actor)||s.origin!==actor.origin||Math.hypot(p.x-s.lastX,p.z-s.lastZ)>8){this.clear(actor);this.states.delete(actor);}
  const current=this.state(actor);current.lastX=p.x;current.lastZ=p.z;return current;
 }
 blocked(actor,dt,blocked,time){const s=this.state(actor);s.blockedFor=blocked?s.blockedFor+Math.max(0,dt):0;
  if(s.blockedFor>=this.limits.blockedDelay)this.say(actor,'blocked',time);
 }
 say(actor,kind,time){
  if(actorGone(actor)||!PEDESTRIAN_LINES[kind]||!Number.isFinite(time))return false;
  const s=this.state(actor),existing=this.active.get(actor);
  // Upgrade an existing complaint in place if an actual impact follows it.
  // This is still one bubble, never a second shout or an impact-spam bypass.
  if(existing?.kind==='blocked'&&kind!=='blocked'){
   existing.kind=kind;existing.text=PEDESTRIAN_LINES[kind][this.lineSerial++%PEDESTRIAN_LINES[kind].length];existing.expires=time+this.limits.duration;s.lastSpoke=time;this.lastSpoke=time;
   if(existing.element){existing.element.dataset.kind=kind;existing.element.textContent=existing.text;}return true;
  }
  // No delayed queue: a missed moment must not produce a stale complaint.
  if(this.active.has(actor)||time-s.lastSpoke<this.limits.actorCooldown||time-this.lastSpoke<this.limits.globalCooldown||this.active.size>=this.limits.maxVisible)return false;
  const lines=PEDESTRIAN_LINES[kind],text=lines[this.lineSerial++%lines.length];
  this.active.set(actor,{kind,text,started:time,expires:time+this.limits.duration,element:null});s.lastSpoke=time;s.blockedFor=0;this.lastSpoke=time;return true;
 }
 clear(actor){const entry=this.active.get(actor);entry?.element?.remove();this.active.delete(actor);}
 prune(actors,time){const alive=new Set(actors);for(const [actor,entry] of this.active){
  // A collision knockdown is temporary, not death. Its own impact bubble may finish;
  // an old blockage bubble must disappear as soon as the actor falls.
  if(!alive.has(actor)||actorGone(actor)||time>=entry.expires||(actor.knocked>0&&entry.kind==='blocked'))this.clear(actor);
 }}
 layer(){if(this.root||!this.document?.body)return this.root;
  if(!this.document.getElementById(STYLE_ID)){const style=this.document.createElement('style');style.id=STYLE_ID;style.textContent=CSS;this.document.head.append(style);}
  this.root=this.document.createElement('div');this.root.className='pedestrian-speech-layer';this.root.setAttribute('aria-hidden','true');this.document.body.append(this.root);return this.root;
 }
 render(game){
  this.prune(game.pedestrians??[],game.time);
  if(!this.active.size)return;
  const canvas=game.renderer?.domElement,rect=canvas?.getBoundingClientRect?.()??{left:0,top:0,width:globalThis.innerWidth??1,height:globalThis.innerHeight??1};
  const camera=game.camera;if(!camera||rect.width<=0||rect.height<=0){for(const p of this.active.keys())this.clear(p);return;}
  camera.updateMatrixWorld();
  for(const [actor,entry] of this.active){
   if(actor.root.parent===null){this.clear(actor);continue;}
   actor.root.updateWorldMatrix(true,true);
   if(actor.head?.getWorldPosition)actor.head.getWorldPosition(this.anchor);else actor.root.getWorldPosition(this.anchor).add(new THREE.Vector3(0,1.7,0));
   this.anchor.y+=.35;this.ndc.copy(this.anchor).project(camera);
   if(camera.position.distanceToSquared(this.anchor)>this.limits.maxDistance**2||this.ndc.z< -1||this.ndc.z>1||Math.abs(this.ndc.x)>.96||Math.abs(this.ndc.y)>.94){this.clear(actor);continue;}
   if(!entry.element){const root=this.layer();if(!root)continue;entry.element=this.document.createElement('div');entry.element.className='pedestrian-speech';entry.element.dataset.kind=entry.kind;entry.element.textContent=entry.text;root.append(entry.element);}
   const x=rect.left+(this.ndc.x*.5+.5)*rect.width,y=rect.top+(-this.ndc.y*.5+.5)*rect.height;
   entry.element.style.transform=`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-100%)`;
   entry.element.style.opacity=String(Math.min(1,Math.max(0,(entry.expires-game.time)/.35)));
  }
 }
 dispose(){for(const actor of this.active.keys())this.clear(actor);this.root?.remove();this.root=null;this.states=new WeakMap();}
}
