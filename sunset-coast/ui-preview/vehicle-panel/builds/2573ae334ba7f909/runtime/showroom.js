import {resetVehicleLights,disposeVehicleLights} from './vehicle-lights.js';
import * as THREE from './vendor/three.module.js';
import {MODELS, createCar} from './world.js';
import {attachVehicleInstruments,updateVehicleInstruments,setVehicleInteriorView} from './vehicle-instruments.js';
import {loadCarAsset} from './asset-car.js';
import {loadRoadsterAsset,setVehicleDoorAngle} from './roadster-asset.js';
import {isRoadsterModel} from './roadster-vehicle.js';
import {createVehicleEnvironment} from './vehicle-environment.js';

const $=id=>document.getElementById(id), clamp=THREE.MathUtils.clamp;
const brandOf=m=>String(m.brand||m.name.split(/\s+/)[0]).toUpperCase();
const canvas=$('studio'), cache=new Map(), pointers=new Map();
let renderer,scene,camera,current=null,selection=0,activeId='',lastTime=0,doorAngle=0,doorsOpen=false;
let view='orbit',yaw=.78,pitch=1.12,radius=9,spin=!matchMedia('(prefers-reduced-motion: reduce)').matches;
let modelScale=1,focusHeight=.85,interiorYaw=0,interiorPitch=0,pinchDistance=0;
const lookTarget=new THREE.Vector3(),desiredPosition=new THREE.Vector3(),desiredLook=new THREE.Vector3();
let lastPointer=null,steer=0;

function loading(text,error=false){const el=$('loading-state');el.hidden=!text;el.classList.toggle('error',error);$('loading-text').textContent=text||'';$('retry-load').hidden=!error;}
function setSpin(value){spin=!!value&&view!=='interior';$('spin-toggle').setAttribute('aria-pressed',String(spin));}
function setDoors(value){doorsOpen=!!value;$('door-toggle').setAttribute('aria-pressed',String(doorsOpen));$('door-toggle').textContent=doorsOpen?'关闭车门':'打开车门';}
function baseRadius(){return 9*modelScale/Math.min(1,innerWidth/innerHeight*1.45);}
function setView(next){
  if(next==='interior'&&!current?.driverCamera)return;
  view=next;
  if(next==='interior'){interiorYaw=0;interiorPitch=current.driverViewPitch??.14;setSpin(false);}
  else{if(next==='front')yaw=0;if(next==='rear')yaw=Math.PI;if(next==='orbit')yaw=.78;pitch=next==='orbit'?1.12:1.28;radius=baseRadius();if(next!=='orbit')setSpin(false);}
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));resize();
}
function populateModels(brand=''){
  const select=$('model-select');select.replaceChildren();
  const brands=[...new Set(MODELS.filter(m=>!brand||brandOf(m)===brand).map(brandOf))];
  for(const name of brands){const group=document.createElement('optgroup');group.label=name;for(const m of MODELS.filter(m=>brandOf(m)===name)){const option=new Option(m.name,m.id);group.append(option);}select.append(group);}
  if([...select.options].some(o=>o.value===activeId))select.value=activeId;
}
async function selectModel(id){
  const model=MODELS.find(m=>m.id===id)||MODELS.find(m=>m.id==='vision')||MODELS[0];
  if(!model)return;
  const token=++selection;activeId=model.id;$('model-select').value=model.id;
  const url=new URL(location.href);url.searchParams.set('model',model.id);history.replaceState(null,'',url);
  $('model-brand').textContent=brandOf(model);$('model-name').textContent=model.name;
  $('model-description').textContent=model.desc;$('asset-credit').hidden=model.id!=='vision';$('model-speed').textContent=Math.round(model.max*3.6);
  $('model-range').textContent=model.range;$('model-trim').textContent=model.trim;
  if(current){resetVehicleLights(current);setVehicleInteriorView(current,false);current.root.visible=false;}current=null;setDoors(false);doorAngle=0;
  $('door-toggle').disabled=true;$('interior-view').hidden=true;
  if(isRoadsterModel(model)&&!cache.has(model.id)){
    loading('正在加载 Blender Roadster 模型…');
    const ready=await loadRoadsterAsset(event=>{if(token===selection&&event.total>0)loading('正在加载 Roadster · '+Math.round(event.loaded/event.total*100)+'%');});
    if(token!==selection)return;
    if(!ready){loading('Roadster 模型加载失败。可以重试，或选择其他车型。',true);return;}
  }
  if(model.id==='vision'&&!cache.has(model.id)){
    loading('正在加载精细概念车…');
    const ready=await loadCarAsset(event=>{if(token===selection&&event.total>0)loading('正在加载精细概念车 · '+Math.round(event.loaded/event.total*100)+'%');});
    if(token!==selection)return;
    if(!ready){loading('概念车资源加载失败。可以重试，或选择其他车型。',true);return;}
  }
  try{
    if(!cache.has(model.id)){const car=createCar(model.id,false);car.root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(car.root);cache.set(model.id,car);}
    current=cache.get(model.id);current.root.visible=true;attachVehicleInstruments(current);
    current.doors.forEach(d=>setVehicleDoorAngle(d,0));steer=0;$('steering-input').value='0';$('steering-value').textContent='0°';
    current.root.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(current.root),size=bounds.getSize(new THREE.Vector3());
    modelScale=Math.max(size.z/5.2,size.x/2.5,1);focusHeight=clamp(size.y*.52,.62,1.2);
    $('door-toggle').disabled=!current.doors.length;$('interior-view').hidden=!current.driverCamera;
    $('model-caption').textContent=isRoadsterModel(model)?'Blender 自建 Roadster · 游戏性能设定':model.id==='vision'?'LUCENT VISION · 概念车设计':'sunset coast · 原创车系';
    setView('orbit');loading('');resize();
  }catch(error){console.error(error);loading('这款展品暂时无法显示，请重试或切换车型。',true);}
}
function resize(){
  if(!renderer)return;
  renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.fov=view==='interior'?(current?.driverFov??58):42;
  const offsetX=view==='interior'?0:innerWidth>900?-Math.round(innerWidth*.115):innerWidth>600?-Math.round(innerWidth*.14):0;
  const offsetY=view==='interior'?0:innerWidth<=600?-Math.round(innerHeight*.115):0;
  camera.setViewOffset(innerWidth,innerHeight,offsetX,offsetY,innerWidth,innerHeight);
  camera.updateProjectionMatrix();radius=clamp(radius,baseRadius()*.52,baseRadius()*1.8);
}
function orbit(dx,dy){
  setSpin(false);
  if(view==='interior'){interiorYaw=clamp(interiorYaw-dx*.006,current?.model.id==='c800'?-Math.PI:-1.65,current?.model.id==='c800'?Math.PI:1.65);interiorPitch=clamp(interiorPitch+dy*.004,-.45,.55);return;}
  view='orbit';document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view==='orbit')));
  yaw-=dx*.006;pitch=clamp(pitch+dy*.004,.25,1.5);
}
function zoom(scale){if(view==='interior')return;radius=clamp(radius*scale,3.2*modelScale,baseRadius()*2);setSpin(false);}
function handlePointers(){const points=[...pointers.values()];if(points.length>=2){const d=Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);if(pinchDistance>0&&d>0)zoom(pinchDistance/d);pinchDistance=d;lastPointer=null;}else{pinchDistance=0;if(points[0]){if(lastPointer)orbit(points[0].x-lastPointer.x,points[0].y-lastPointer.y);lastPointer={...points[0]};}else lastPointer=null;}}
function animate(now){
  const dt=Math.min(lastTime?(now-lastTime)/1000:1/60,.05);lastTime=now;
  if(spin&&!pointers.size)yaw+=dt*.17;
  if(current){
    setVehicleInteriorView(current,view==='interior');updateVehicleInstruments(current,now/1000);
    doorAngle=THREE.MathUtils.damp(doorAngle,doorsOpen?1.13:0,7,dt);
    current.doors.forEach(d=>setVehicleDoorAngle(d,(d.side??-1)*doorAngle));
    const steeringSign=Math.sign(steer),turnRadius=Math.abs(steer)>.0001?current.wheelBase/Math.abs(Math.tan(steer)):Infinity;
    for(const wheel of current.wheels)wheel.pivot.rotation.y=wheel.front&&Number.isFinite(turnRadius)?steeringSign*Math.atan2(current.wheelBase,turnRadius+wheel.side*steeringSign*current.track/2):0;
    if(current.steeringWheel)current.steeringWheel.rotation.z=steer*7;
    if(view==='interior'){
      desiredPosition.copy(current.driverCamera);
      desiredLook.set(desiredPosition.x+Math.sin(interiorYaw)*6,desiredPosition.y-Math.sin(interiorPitch)*6,desiredPosition.z-Math.cos(interiorYaw)*6);
    }else{
      desiredPosition.set(Math.sin(yaw)*Math.sin(pitch)*radius,Math.cos(pitch)*radius+focusHeight,Math.cos(yaw)*Math.sin(pitch)*radius*-1);
      desiredLook.set(0,focusHeight,0);
    }
    camera.position.lerp(desiredPosition,1-Math.exp(-dt*10));lookTarget.lerp(desiredLook,1-Math.exp(-dt*10));camera.lookAt(lookTarget);
  }
  renderer.render(scene,camera);requestAnimationFrame(animate);
}
try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  scene=new THREE.Scene();scene.background=new THREE.Color(0x151d24);scene.fog=new THREE.Fog(0x151d24,23,70);
  scene.environment=createVehicleEnvironment(renderer);scene.environmentIntensity=.9;
  camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.035,100);camera.position.set(6,4.7,-7);lookTarget.set(0,.8,0);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(180,180),new THREE.MeshStandardMaterial({color:0x0b1117,roughness:.94,metalness:0,envMapIntensity:.08}));ground.rotation.x=-Math.PI/2;ground.position.y=-.018;ground.receiveShadow=true;scene.add(ground);
  scene.add(new THREE.HemisphereLight(0xdce7ed,0x39403e,1.7));
  const key=new THREE.DirectionalLight(0xffeed9,3.1);key.position.set(-5,8,-5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:.5,far:30});key.shadow.bias=-.0002;key.shadow.normalBias=.015;key.shadow.radius=3;scene.add(key);
  const fill=new THREE.DirectionalLight(0xbfdaee,1.6);fill.position.set(6,3,2);scene.add(fill);
  const rim=new THREE.DirectionalLight(0xffffff,2);rim.position.set(-3,4,7);scene.add(rim);
  const brands=[...new Set(MODELS.map(brandOf))];$('brand-select').append(new Option('全部品牌',''));brands.forEach(b=>$('brand-select').append(new Option(b,b)));$('catalog-count').textContent=`${brands.length} 个品牌 · ${MODELS.length} 款车型`;
  populateModels();$('brand-select').onchange=()=>{populateModels($('brand-select').value);selectModel($('model-select').value);};$('model-select').onchange=()=>selectModel($('model-select').value);
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));$('steering-input').oninput=e=>{steer=Number(e.target.value);$('steering-value').textContent=Math.round(steer*180/Math.PI)+'°';};$('spin-toggle').onclick=()=>setSpin(!spin);$('door-toggle').onclick=()=>setDoors(!doorsOpen);$('retry-load').onclick=()=>selectModel(activeId);setSpin(spin);
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});handlePointers();});
  canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});handlePointers();});
  const release=e=>{pointers.delete(e.pointerId);pinchDistance=0;lastPointer=null;};for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,release);
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(clamp(e.deltaY,-120,120)*.0015));},{passive:false});
  canvas.addEventListener('keydown',e=>{const dirs={ArrowLeft:[-18,0],ArrowRight:[18,0],ArrowUp:[0,-18],ArrowDown:[0,18]};if(dirs[e.key]){e.preventDefault();orbit(...dirs[e.key]);}else if(['+','=','-','_'].includes(e.key)){e.preventDefault();zoom(e.key==='-'||e.key==='_'?1.1:1/1.1);}});
  window.addEventListener('blur',()=>{pointers.clear();lastPointer=null;pinchDistance=0;});window.addEventListener('resize',resize);
  document.addEventListener('visibilitychange',()=>{lastTime=0;});resize();
  selectModel(new URLSearchParams(location.search).get('model')||'vision');requestAnimationFrame(animate);
  // Useful for inspecting the display without importing or starting the game.
  window.showroom={get car(){return current;},get view(){return view;},get renderer(){return renderer;},get camera(){return camera;},selectModel,setView};
}catch(error){console.error(error);loading('展厅需要支持 WebGL 的浏览器。请重新打开，或返回游戏。',true);$('retry-load').onclick=()=>location.reload();}

window.addEventListener('pagehide',event=>{if(event.persisted)return;for(const car of cache.values())disposeVehicleLights(car);});
