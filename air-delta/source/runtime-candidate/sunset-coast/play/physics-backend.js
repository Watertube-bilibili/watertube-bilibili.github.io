// Explicit isolated experiment; default adapter remains recoverable.
import {browserWorldRequest} from './browser-world-policy.js';
const worldRequest=browserWorldRequest();
export const browserPhysicsRequested =!!worldRequest|| new URLSearchParams(globalThis.location?.search??'').get('physics')==='browser';
export async function loadPhysicsBackend(){
 if(worldRequest){const {BrowserPhysicsSystem}=await import('./browser-physics.js');return {PhysicsSystem:BrowserPhysicsSystem,preloadPhysics:async()=>{}};}
 if(browserPhysicsRequested){
  const q=new URLSearchParams(location.search);
  if([...q.keys()].some(k=>!['physics','preview','map','delivery','asphalt','pbr','air','moto'].includes(k)))throw Error('浏览器实验不支持结构损坏、原生诊断或额外参数');
  if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname)||q.get('preview')!=='1'||!['estuary','crescent'].includes(q.get('map'))||q.has('world')||q.has('slot')||q.has('collisionQA'))throw Error('浏览器物理仅限本机隔离预览，禁止正式存档或原生 QA');
  for(const key of ['air','moto'])if(q.has(key)&&(q.getAll(key).length!==1||q.get(key)!=='1'))throw Error('浏览器实验选项必须唯一且为 1');
  const {BrowserPhysicsSystem}=await import('./browser-physics.js');
  if(q.get('air')==='1'||q.get('moto')==='1')return {PhysicsSystem:class extends BrowserPhysicsSystem{constructor(game){super(game,{roadsters:q.get('air')==='1',motorcycles:q.get('moto')==='1'});this.backend='Browser local rigid-body experiment';}},preloadPhysics:async()=>{}};
  return {PhysicsSystem:BrowserPhysicsSystem,preloadPhysics:async()=>{}};
 }
 const {GodotPhysicsSystem,prepareGodotEngine,shouldPreloadEngine}=await import('./godot-physics.js');
 return {PhysicsSystem:GodotPhysicsSystem,preloadPhysics:()=>prepareGodotEngine({downloadEngine:shouldPreloadEngine()})};
}
