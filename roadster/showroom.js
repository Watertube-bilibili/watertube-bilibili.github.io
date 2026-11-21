import * as THREE from '../sunset-coast/play/vendor/three.module.js';
import { GLTFLoader } from '../sunset-coast/play/vendor/GLTFLoader.js';
import { MeshoptDecoder } from './vendor/meshopt_decoder.module.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const trims = {
  performance: ['Performance', '公路版 · 双座座舱'],
  thrust: ['Thrust', '推进版 · 后舱横置容器'],
  rocket: ['Rocket', '飞行演示版 · 外置喷口']
};
const dirs = { front: [1.48,.64,1.88], side: [1,.095,.015], rear: [1.35,.58,-1.88],
  top: [.002,1,.02], bottom: [.002,-1,.02], bay:[.25,1,1.12], service:[.02,-1,-.18] };
const $ = id => document.getElementById(id);
const all = selector => [...document.querySelectorAll(selector)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const ray = new THREE.Raycaster();
let model, gfx, request, frame, picked, start, movingCam, trim, layer = 'full', limit = 40, angle = 'front';
let changes = [], filtered = [];
const buttons = (sel,key,value) => all(sel).forEach(b => b.setAttribute('aria-pressed', String(b.dataset[key] === value)));
function panel(name) {
  buttons('[data-panel]','panel',name);
  $('catalog').hidden = name !== 'catalog';
  $('mechanisms').hidden = name !== 'mechanisms';
}
function schedule() { if (gfx && !frame) frame=requestAnimationFrame(draw); }
function status(text,retry=false) {
  $('load-text').textContent=text;
  $('loading').hidden=!text;
  $('retry').hidden=!retry;
}
function shadowPlane() {
  const c=document.createElement('canvas'); c.width=c.height=192;
  const ctx=c.getContext('2d'), g=ctx.createRadialGradient(96,96,12,96,96,95);
  g.addColorStop(0,'rgba(8,11,13,.67)');g.addColorStop(.53,'rgba(8,11,13,.41)');g.addColorStop(1,'rgba(8,11,13,0)');
  ctx.fillStyle=g;ctx.fillRect(0,0,192,192);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));
  m.rotation.x=-Math.PI/2;
  return m;
}
function setup() {
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.96;
  renderer.transmissionResolutionScale=.42;
  const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','互动三维车模，拖动旋转，双指缩放。零件也可以在拆装清单中选择。');
  $('viewport').append(canvas);
  const scene=new THREE.Scene(), room=new RoomEnvironment(), maker=new THREE.PMREMGenerator(renderer);
  room.traverse(o=>{
    if(o.material?.isMeshStandardMaterial)o.material.color.setHex(0x34363b);
    if(o.material?.emissiveIntensity>1 && o.position.y<13)o.material.emissiveIntensity*=.52;
  });
  scene.environment=maker.fromScene(room,.034).texture;
  maker.dispose();room.dispose();scene.environmentIntensity=.55;
  const sky=new THREE.HemisphereLight(0xf2f6ff,0x716658,.58);
  const key=new THREE.DirectionalLight(0xfff2e5,1.85);key.position.set(2,5,4);
  const fill=new THREE.DirectionalLight(0xcde4ff,1.28);fill.position.set(-4,2,-3);
  const lower=new THREE.DirectionalLight(0xd9e9f0,.04);lower.position.set(0,-3,1);
  const shadow=shadowPlane();shadow.visible=false;scene.add(sky,key,fill,lower,shadow);
  const camera=new THREE.PerspectiveCamera(31,1,.045,42);
  const orbit=new OrbitControls(camera,canvas);orbit.enableDamping=!reduce.matches;orbit.dampingFactor=.14;
  orbit.minDistance=.20;orbit.maxDistance=15;orbit.rotateSpeed=.7;orbit.listenToKeyEvents(canvas);
  orbit.addEventListener('start',()=>{movingCam=null;});
  orbit.addEventListener('change',schedule);
  canvas.addEventListener('pointerdown',e=>{
    if(!e.isPrimary || e.button!==0) { start=null;return; }
    start={x:e.clientX,y:e.clientY,id:e.pointerId};
  });
  canvas.addEventListener('pointermove',e=>{
    if(start && Math.hypot(e.clientX-start.x,e.clientY-start.y)>6) {
      start=null; angle='orbit';$('angle').value='orbit';
    }
  });
  canvas.addEventListener('pointercancel',()=>{start=null;});
  canvas.addEventListener('wheel',()=>{movingCam=null;angle='orbit';$('angle').value='orbit';},{passive:true});
  canvas.addEventListener('pointerup',pick);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();status('三维画面已中断。请重新载入模型。',true);});
  canvas.addEventListener('webglcontextrestored',()=>{load(trim);});
  return {renderer,canvas,scene,camera,orbit,shadow,lower};
}
function applySize() {
  const w=$('viewport').clientWidth,h=$('viewport').clientHeight;
  if(!w||!h)return;
  const prev=gfx.camera.aspect;
  gfx.renderer.setSize(w,h,false);gfx.camera.aspect=w/h;gfx.camera.updateProjectionMatrix();
  if(model && angle!=='orbit' && Math.abs(prev-w/h)>.035) setView(angle,true);
  schedule();
}
function dispose(root) {
  const gs=new Set(),ms=new Set(),ts=new Set();
  root.traverse(o=>{if(o.isMesh){gs.add(o.geometry);for(const m of [o.material].flat()){ms.add(m);for(const v of Object.values(m))if(v?.isTexture)ts.add(v);}}});
  gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>{t.dispose();t.source?.data?.close?.();});
}
function readModel(gltf,info) {
  const parts=new Map(info.parts.map(meta=>[meta.id,{...meta,...info.nodes[meta.id],meshes:[],removed:false}]));
  const meshes=[],lookup=new Map(),finishes=new Map();
  // The lower duct sits in the shadow of the bumper. A full-room reflection there
  // lights the intake silver. Keep its native diffuse finish and the lip's soft glint.
  function recessedFinish(mesh,part){
    const duct=/front duct lower ramp|intake flow fence/i.test(part.original);
    const lip=/raised-tip lower splitter/i.test(part.original);
    if(!duct&&!lip)return;
    const original=mesh.material;
    if(!finishes.has(original)){
      const options={color:original.color,side:original.side,map:original.map};
      finishes.set(original,duct ? new THREE.MeshLambertMaterial(options) :
        new THREE.MeshPhongMaterial({...options,specular:0x1e2023,shininess:23}));
    }
    mesh.material=finishes.get(original);
  }
  gltf.scene.traverse(o=>{
    if(!o.isMesh)return;
    let node=o,part;
    while(node && !(part=parts.get(node.userData.part_id || node.name)))node=node.parent;
    if(!part)return;
    // Thin, tinted covers use the studio reflection on touch devices. This avoids a
    // second render of the entire car for transmission through a few small lenses.
    if(matchMedia('(pointer: coarse)').matches && o.material.transmission>0){
      const m=o.material;
      m.opacity*=1-.70*m.transmission;m.transmission=0;m.transparent=true;
      m.depthWrite=false;m.forceSinglePass=true;
    }
    recessedFinish(o,part);
    part.meshes.push(o);lookup.set(o,part);meshes.push(o);
    if(!part.object)part.object=node;
  });
  const acts=new Map();
  for(const clip of gltf.animations){
    const tracks=clip.tracks.map(track=>{
      const binding=THREE.PropertyBinding.parseTrackName(track.name);
      const target=THREE.PropertyBinding.findNode(gltf.scene,binding.nodeName);
      if(!target?.[binding.propertyName]?.fromArray)throw new Error('关节缺少目标 '+track.name);
      return {property:target[binding.propertyName],interpolant:track.createInterpolant()};
    });
    acts.set(clip.name,{tracks,duration:clip.duration,value:0,target:0,label:info.controls[clip.name]?.label||clip.name});
  }
  const real=[...parts.values()].filter(p=>p.meshes.length);
  if(real.length!==info.parts.length)throw new Error('零件索引与网格不一致');
  gltf.scene.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(gltf.scene,true),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
  return {root:gltf.scene,parts:real,lookup,meshes,acts,bounds,center,size,service:real.filter(p=>p.service_access==='rear_drive')};
}
function activateControls() {
  $('angle').disabled=$('reframe').disabled=!model;
  for(const button of [...all('[data-aero]'),...all('[data-layer]')])button.disabled=!model;
  $('search').disabled=$('system').disabled=$('removed-only').disabled=!model;
}
async function load(id,persist=false){
  if(!Object.hasOwn(trims,id))return;
  trim=id;if(persist){const url=new URL(location.href);url.searchParams.set('trim',id);history.replaceState(null,'',url);}
  buttons('[data-trim]','trim',id);$('trim-name').textContent=trims[id][0];$('trim-description').textContent=trims[id][1];
  $('poster').src='./media/'+id+'.webp';$('poster').alt=trims[id][0]+' 模型摄影机画面';$('poster').hidden=false;
  if(!gfx){status('此浏览器暂时无法启动 WebGL，可观看装配动画。',true);return;}
  request?.abort();request=new AbortController();const {signal}=request;
  if(model){highlight(picked,false);gfx.scene.remove(model.root);dispose(model.root);}
  model=null;picked=null;changes=[];layer='full';movingCam=null;gfx.shadow.visible=false;
  $('part-count').textContent='';$('actuators').replaceChildren();$('search').value='';$('removed-only').checked=false;
  $('system').replaceChildren(new Option('全部分组',''));buttons('[data-layer]','layer','full');
  controlsUI();refreshList();selection();status('正在载入 '+trims[id][0]+'…');activateControls();schedule();
  try{
    const base=new URL('./models/'+id,location.href);
    const [binary,info]=await Promise.all(['.glb','.json'].map(async ext=>{
      const res=await fetch(base.href+ext,{signal});if(!res.ok)throw Error('HTTP '+res.status);
      return ext==='.glb'?res.arrayBuffer():res.json();
    }));
    if(signal.aborted)return;
    const gltf=await loader.parseAsync(binary,new URL('./',base).href);
    if(signal.aborted){dispose(gltf.scene);return;}
    model=readModel(gltf,info);
    gfx.scene.add(model.root);gfx.shadow.position.set(model.center.x,model.bounds.min.y-.013,model.center.z);
    gfx.shadow.scale.set(model.size.x*1.7,model.size.z*1.5,1);gfx.shadow.visible=true;
    const names=new Set(model.parts.map(p=>p.assembly||p.group));
    [...names].sort((a,b)=>a.localeCompare(b,'zh-CN')).forEach(n=>$('system').add(new Option(n,n)));
    controlsUI();activateControls();refreshList();selection();setView('front',true);
    $('part-count').textContent=model.parts.length+' 个部件';
  }catch(error){if(signal.aborted)return;console.error(error);status('模型载入失败，请重试。',true);}
}
function setView(view,instant=false) {
  if(!model||!dirs[view])return;
  angle=view;$('angle').value=view;
  const dir=new THREE.Vector3(...dirs[view]).normalize(), center=model.center.clone();
  let box=model.bounds;
  if(view==='bay'||view==='service'){
    const set=view==='service'?model.service:model.parts.filter(p=>p.enclosure_zone==='front_bay');
    if(set.length){
      box=new THREE.Box3();
      set.forEach(p=>p.meshes.forEach(m=>box.expandByObject(m,true)));
      box.getCenter(center);
      box.expandByScalar(view==='service'?.16:.12);
    }
  }
  const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),dir).normalize(),
    up=new THREE.Vector3().crossVectors(dir,right);
  const tan=Math.tan(THREE.MathUtils.degToRad(gfx.camera.fov/2));
  const fy=tan*.78,fx=tan*gfx.camera.aspect*.90;
  let dist=0;
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
    const v=new THREE.Vector3(x,y,z).sub(center);
    dist=Math.max(dist,Math.abs(v.dot(right))/fx+v.dot(dir),Math.abs(v.dot(up))/fy+v.dot(dir));
  }
  if(view==='front'||view==='rear')dist*=.88;
  moveCam(center,dir.multiplyScalar(dist).add(center),instant);
}
function moveCam(center,pos,instant){
  if(instant||reduce.matches){movingCam=null;gfx.orbit.target.copy(center);gfx.camera.position.copy(pos);gfx.orbit.update();}
  else movingCam={at:performance.now(),from:gfx.camera.position.clone(),origin:gfx.orbit.target.clone(),pos,center};
  schedule();
}
function focusPart(){
  if(!picked || !model)return;
  const box=new THREE.Box3();picked.meshes.forEach(o=>box.expandByObject(o,true));
  const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()).length();
  const dir=gfx.camera.position.clone().sub(gfx.orbit.target).normalize();
  angle='orbit';$('angle').value=angle;moveCam(center,center.clone().addScaledVector(dir,Math.max(.35,size*2.1)),false);
}
function setAct(key,value){
  const act=model?.acts.get(key);if(!act)return;
  act.from=act.value;act.target=value;act.at=performance.now();syncActButtons();schedule();
}
function controlsUI(){
  const host=$('actuators');host.replaceChildren();
  const specs=model?[...model.acts.entries()].filter(([k])=>k!=='aero').map(([k,a])=>[k,a.label]):[];
  if(model?.service.length)specs.push(['service','后电驱检修盖']);
  for(const [key,label] of specs){
    const b=document.createElement('button');b.type='button';b.className='actuator';b.dataset.actuator=key;
    b.textContent=key==='hood'?'前舱检视盖':label;
    const dot=document.createElement('i');dot.className='toggle';dot.setAttribute('aria-hidden','true');b.append(dot);host.append(b);
    b.addEventListener('click',()=>{
      if(key==='service'){if(layer!=='full')setLayer('full');const remove=model.service.some(p=>!p.removed);changeParts(model.service,remove);setView('service');}
      else setAct(key,model.acts.get(key).target===0 ? 1 : 0);
    });
  }
  syncActButtons();
}
function syncActButtons(){
  for(const b of all('[data-actuator]')){
    const k=b.dataset.actuator;
    b.setAttribute('aria-pressed',String(k==='service'?model.service.every(p=>p.removed):model.acts.get(k).target>0));
  }
  for(const b of all('[data-aero]'))b.setAttribute('aria-pressed',String(Number(b.dataset.aero)===(model?.acts.get('aero')?.target??0)));
}
function inLayer(part){return layer==='full'||part.layer===layer||(layer==='mechanical'&&part.layer==='rolling');}
function showParts(){for(const p of model.parts)for(const m of p.meshes)m.visible=inLayer(p)&&!p.removed;}
function setLayer(value){
  if(!model)return;layer=value;buttons('[data-layer]','layer',layer);showParts();
  if(picked&&!inLayer(picked))select(null);
  refreshList();schedule();
}
function highlight(part,yes) {
  if(!part)return;
  for(const mesh of part.meshes){
    if(yes&&!mesh.userData.highlight){
      const orig=mesh.material;
      const copies=[orig].flat().map(mat=>{const copy=mat.clone();if(copy.emissive){copy.emissive.setHex(0xbe5933);copy.emissiveIntensity=.72;}else copy.color?.setHex(0xff9472);return copy;});
      mesh.material=Array.isArray(orig)?copies:copies[0];mesh.userData.highlight={orig,copies};
    }else if(!yes&&mesh.userData.highlight){const {orig,copies}=mesh.userData.highlight;mesh.material=orig;copies.forEach(m=>m.dispose());delete mesh.userData.highlight;}
  }
}
function pick(e){
  if(!model||start?.id!==e.pointerId)return;
  const drift=Math.hypot(e.clientX-start.x,e.clientY-start.y);start=null;if(drift>6)return;
  const r=gfx.canvas.getBoundingClientRect();
  ray.setFromCamera({x:(e.clientX-r.left)*2/r.width-1,y:1-(e.clientY-r.top)*2/r.height},gfx.camera);
  const hit=ray.intersectObjects(model.meshes,false).find(h=>h.object.visible);
  if(hit){select(model.lookup.get(hit.object));panel('catalog');}
}
function select(p){highlight(picked,false);picked=p;if(p&&!p.removed)highlight(p,true);refreshList();selection();schedule();}
function changeParts(parts,removed,record=true){
  const changed=parts.filter(p=>p.removed!==removed);
  if(!changed.length)return;
  if(record)changes.push(changed.map(p=>[p,p.removed]));
  for(const p of changed)p.removed=removed;
  if(changed.includes(picked))highlight(picked,!removed);
  showParts();syncActButtons();refreshList();selection();schedule();
}
function undo(){
  const entry=changes.pop();if(!entry)return;
  for(const removed of [true,false])changeParts(entry.filter(([,state])=>state===removed).map(([p])=>p),removed,false);
}
function selection(){
  const host=$('selection');host.replaceChildren();
  const label=document.createElement('p');label.textContent=picked?picked.label_zh+(picked.removed?'（已拆下）':''):'点选模型或下方零件。';host.append(label);
  if(picked){const d=document.createElement('small');const e=picked.evidence||'';
    const evidence=e.includes('schematic')||e.includes('工程示意')?'按结构布局推定':e.includes('photo')?'可见外形参考实拍':'根据实拍重建';
    d.textContent=[picked.assembly||picked.group,evidence].filter(Boolean).join(' · ');host.append(d);}
  $('detach').textContent=picked?.removed?'装回':'拆下';
  $('detach').disabled=!picked;$('focus').disabled=!picked;$('undo').disabled=!changes.length;
  $('restore').disabled=!model?.parts.some(p=>p.removed);
}
function refreshList(){
  const q=$('search').value.trim().toLowerCase(),grp=$('system').value;
  filtered=(model?.parts||[]).filter(p=>inLayer(p)&&(!grp||(p.assembly||p.group)===grp)&&(!$('removed-only').checked||p.removed)&&(!q||[p.label_zh,p.original,p.assembly,p.internal_system].join(' ').toLowerCase().includes(q)));
  const frag=document.createDocumentFragment();
  for(const p of filtered.slice(0,limit)){
    const row=document.createElement('li'),b=document.createElement('button');b.type='button';b.dataset.part=p.id;
    b.setAttribute('aria-pressed',String(p===picked));b.textContent=p.label_zh;b.title=p.original;
    if(p.removed){const s=document.createElement('span');s.textContent='已拆下';b.append(s);}
    b.addEventListener('click',()=>select(p));row.append(b);frag.append(row);
  }
  if(!filtered.length&&model){const li=document.createElement('li');li.className='empty';li.textContent='没有符合条件的零件';frag.append(li);}
  $('parts').replaceChildren(frag);$('list-total').textContent=model?'匹配 '+filtered.length+' 件 · 已拆 '+model.parts.filter(p=>p.removed).length+' 件':'';
  $('more').hidden=filtered.length<=limit;
}
function draw(now){
  frame=0;let moving=false;
  if(movingCam){const t=Math.min(1,(now-movingCam.at)/380),e=1-(1-t)**3;gfx.camera.position.lerpVectors(movingCam.from,movingCam.pos,e);gfx.orbit.target.lerpVectors(movingCam.origin,movingCam.center,e);if(t===1)movingCam=null;else moving=true;}
  if(model)for(const a of model.acts.values()){
    if(a.value===a.target)continue;
    const t=reduce.matches?1:Math.min(1,(now-a.at)/380);a.value=t===1?a.target:THREE.MathUtils.lerp(a.from,a.target,1-(1-t)**3);
    for(const track of a.tracks)track.property.fromArray(track.interpolant.evaluate(a.value*a.duration));
    if(t<1)moving=true;
  }
  if(gfx.orbit.update())moving=true;
  const under=THREE.MathUtils.clamp((gfx.orbit.target.y-gfx.camera.position.y)/.9,0,1);
  gfx.lower.intensity=.06+under*1.3;
  gfx.scene.environmentIntensity=.55+under*.18;
  gfx.shadow.visible=Boolean(model)&&gfx.camera.position.y>model.bounds.min.y+.08&&layer==='full';
  gfx.renderer.render(gfx.scene,gfx.camera);
  if(model&&!model.ready){model.ready=true;$('poster').hidden=true;status('');}
  if(moving)schedule();
}
all('[data-panel]').forEach(b=>b.addEventListener('click',()=>panel(b.dataset.panel)));
all('[data-trim]').forEach(b=>b.addEventListener('click',()=>{if(trim!==b.dataset.trim||!model)load(b.dataset.trim,true);}));
all('[data-aero]').forEach(b=>b.addEventListener('click',()=>setAct('aero',Number(b.dataset.aero))));
all('[data-layer]').forEach(b=>b.addEventListener('click',()=>setLayer(b.dataset.layer)));
$('angle').addEventListener('change',e=>setView(e.target.value));$('reframe').addEventListener('click',()=>setView('front'));
$('detach').addEventListener('click',()=>picked&&changeParts([picked],!picked.removed));
$('undo').addEventListener('click',undo);$('restore').addEventListener('click',()=>changeParts(model.parts,false));
for(const k of ['search','system','removed-only'])$(k).addEventListener(k==='search'?'input':'change',()=>{limit=40;refreshList();});
$('more').addEventListener('click',()=>{limit+=60;refreshList();});
$('retry').addEventListener('click',()=>{if(!gfx||gfx.renderer.getContext().isContextLost())location.reload();else load(trim);});
function expand(){const on=!$('stage').classList.contains('expanded');$('stage').classList.toggle('expanded',on);document.body.classList.toggle('expanded',on);$('fullscreen').setAttribute('aria-pressed',String(on));$('fullscreen').setAttribute('aria-label',on?'退出模型全屏':'展开模型视窗');}
$('fullscreen').addEventListener('click',expand);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('stage').classList.contains('expanded'))expand();if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&changes.length&&!e.target.matches('input,textarea')){e.preventDefault();undo();}});
const initial=new URL(location.href).searchParams.get('trim');
try{gfx=setup();new ResizeObserver(applySize).observe($('viewport'));applySize();}
catch(e){console.error('WebGL 初始化失败',e);}
load(Object.hasOwn(trims,initial)?initial:'thrust');
