import * as THREE from './vendor/three.module.js';
import {sampleVehiclePose,applyVehiclePose} from './render-motion.js';
import {setVehicleInteriorView} from './vehicle-instruments.js';

const clamp=THREE.MathUtils.clamp;
const finite=(value,fallback)=>Number.isFinite(value)?value:fallback;
const Y=new THREE.Vector3(0,1,0);
const HISTORY_KEY='sunsetCoastPhoto';

// Photo quality is a renderer-only, bounded override. Never call setQuality,
// change game.quality/performanceProfile, increase population, or write storage.
export function photoRenderBudget({width,height,mobile=false,maxTextureSize=4096}={}){
 width=Math.max(1,finite(width,1));height=Math.max(1,finite(height,1));
 const pixels=mobile?2600000:6000000,edge=Math.min(mobile?2560:4096,Math.max(1,finite(maxTextureSize,4096)));
 // Explicit photography supersamples even on DPR-1 displays. The total pixel
 // and maximum-edge caps take priority over the 2x target on every device.
 const pixelRatio=Math.min(2,Math.sqrt(pixels/(width*height)),edge/Math.max(width,height));
 return {pixelRatio,shadowMapSize:Math.min(mobile?1536:2048,maxTextureSize),anisotropy:4};
}

export class PhotoMode{
 constructor(game,{document=globalThis.document,window=globalThis.window,view=null}={}){
  this.game=game;this.document=document;this.window=window;this.view=view;this.active=false;
  this.quality='standard';this.exposure=0;this.gesture='orbit';this.dirty=true;this.lastDraw=-Infinity;
  this.pointers=new Map();this.textureSettings=new Map();this.historyPending=false;
 }
 get renderQuality(){return this.active&&this.quality==='high'?'high':this.game.quality;}
 get target(){return this.active?this.focus:null;}
 viewport(){return {width:Math.max(1,this.window.innerWidth),height:Math.max(1,this.window.innerHeight)};}
 enter(){
  const g=this.game;if(this.active||this.historyPending)return false;
  if(g.transition||g.physics?.failed||g.physics&&g.physics.ready===false){g.ui?.toast('请等待上下车或场景载入完成后再拍照');return false;}
  const r=g.renderer,s=g.sun?.shadow,modal=this.document.getElementById('modal');
  this.saved={paused:g.paused,hiddenPause:g.hiddenPause,focus:this.document.activeElement,modalOpen:!!modal?.open,
   pixelRatio:r.getPixelRatio(),shadows:r.shadowMap.enabled,castShadow:g.sun?.castShadow,exposure:r.toneMappingExposure,
   shadowSize:s?.mapSize.clone(),shadowCamera:s?{left:s.camera.left,right:s.camera.right,top:s.camera.top,bottom:s.camera.bottom,near:s.camera.near,far:s.camera.far}:null,
   shadowBias:s?.bias,normalBias:s?.normalBias,interior:g.vehicle?.interiorView,
   aircraftControls:g.aircraft?.active?{...g.aircraft.controls}:null};
  this.camera=g.camera.clone();this.camera.clearViewOffset();this.camera.up.copy(Y);
  this.origin=(g.aircraft?.active?g.aircraft.aircraft.pos:g.position).clone();
  this.origin.y+=g.inCar?1:.9;
  this.startPosition=g.camera.position.clone();
  if(this.startPosition.distanceTo(this.origin)<3)this.startPosition.copy(this.origin).add(new THREE.Vector3(8,4,10));
  const vehicles=g.allVehicles?.()??[g.vehicle];const alpha=g.physics?.interpolationAlpha?.()??1;
  this.frozenVehicles=vehicles.filter(v=>v?.root).map(vehicle=>({vehicle,pose:sampleVehiclePose(vehicle,alpha)}));
  this.active=true;this.quality='standard';this.exposure=0;this.gesture='orbit';
  g.paused=true;g.resetControls?.();setVehicleInteriorView(g.vehicle,false);
  if(modal?.open)modal.close();
  this.inertElements=[...this.document.body.children].filter(el=>el.id!=='world'&&el.id!=='photo-mode'&&el.id!=='loading'&&!['SCRIPT','STYLE','LINK'].includes(el.tagName)).map(el=>[el,el.inert]);
  for(const [el]of this.inertElements)el.inert=true;
  this.document.body.classList.add('photo-mode-active');this.view?.open?.();
  this.resetFraming();this.resize();
  try{this.historyToken=String(Date.now())+'-'+Math.random().toString(36).slice(2);this.previousHistory=this.window.history.state;this.window.history.pushState({...this.previousHistory,[HISTORY_KEY]:this.historyToken},'');this.historyOwned=true;}catch{this.historyOwned=false;}
  this.view?.sync?.();this.view?.focus?.();return true;
 }
 resetFraming(){
  if(!this.active)return;this.focus=this.origin.clone();const offset=this.startPosition.clone().sub(this.focus);
  this.distance=clamp(offset.length(),2,70);this.yaw=Math.atan2(offset.x,offset.z);this.pitch=clamp(Math.asin(offset.y/Math.max(.001,offset.length())),-1.25,1.4);
  this.camera.fov=50;this.exposure=0;this.invalidate();
 }
 invalidate(){this.dirty=true;this.view?.sync?.();}
 orbit(dx,dy){this.yaw-=dx*.005;this.pitch=clamp(this.pitch+dy*.004,-1.25,1.4);this.invalidate();}
 pan(dx,dy){
  this.updateCamera();const scale=this.distance*Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2))*2/this.viewport().height;
  const right=new THREE.Vector3(1,0,0).applyQuaternion(this.camera.quaternion),up=new THREE.Vector3(0,1,0).applyQuaternion(this.camera.quaternion);
  this.focus.addScaledVector(right,-dx*scale).addScaledVector(up,dy*scale);
  const offset=this.focus.clone().sub(this.origin);if(offset.length()>60)this.focus.copy(this.origin).add(offset.setLength(60));
  this.invalidate();
 }
 zoom(factor){this.distance=clamp(this.distance*factor,1.5,75);this.invalidate();}
 setFov(value){this.camera.fov=clamp(finite(Number(value),50),25,85);this.invalidate();}
 setExposure(value){this.exposure=clamp(finite(Number(value),0),-1,1);this.invalidate();}
 updateCamera(){
  const {width,height}=this.viewport();this.camera.aspect=width/height;
  this.camera.position.set(Math.sin(this.yaw)*Math.cos(this.pitch),Math.sin(this.pitch),Math.cos(this.yaw)*Math.cos(this.pitch)).multiplyScalar(this.distance).add(this.focus);
  const ground=this.game.world.groundHeight?.(this.camera.position.x,this.camera.position.z);
  if(Number.isFinite(ground))this.camera.position.y=Math.max(ground+.3,this.camera.position.y);
  this.camera.lookAt(this.focus);this.camera.updateProjectionMatrix();
 }
 resize(){if(!this.active)return;this.applyQuality();this.invalidate();}
 setQuality(value){if(!this.active)return;this.quality=value==='high'?'high':'standard';this.applyQuality();this.invalidate();}
 resizeShadow(size){
  const s=this.game.sun?.shadow;if(!s||s.mapSize.x===size&&s.mapSize.y===size)return;
  s.map?.dispose();s.map=null;s.mapPass?.dispose();s.mapPass=null;s.mapSize.set(size,size);s.needsUpdate=true;
 }
 restoreTextures(){for(const [texture,value]of this.textureSettings){texture.anisotropy=value;texture.needsUpdate=true;}this.textureSettings.clear();}
 applyQuality(){
  const g=this.game,r=g.renderer,s=g.sun?.shadow,{width,height}=this.viewport(),high=this.quality==='high';
  const budget=photoRenderBudget({width,height,mobile:g.performanceProfile?.mobile,maxTextureSize:r.capabilities.maxTextureSize});
  const ratio=high?budget.pixelRatio:this.saved.pixelRatio;
  if(r.getPixelRatio()!==ratio)r.setPixelRatio(ratio);r.setSize(width,height);
  r.shadowMap.enabled=high||this.saved.shadows;if(g.sun)g.sun.castShadow=high||this.saved.castShadow;
  if(s){this.resizeShadow(high?budget.shadowMapSize:this.saved.shadowSize.x);Object.assign(s.camera,this.saved.shadowCamera);s.bias=high?-.0002:this.saved.shadowBias;s.normalBias=high?.06:this.saved.normalBias;s.camera.updateProjectionMatrix();}
  this.restoreTextures();
  if(high){const amount=Math.min(budget.anisotropy,r.capabilities.getMaxAnisotropy?.()??1);g.scene.traverse(object=>{for(const material of Array.isArray(object.material)?object.material:[object.material])if(material)for(const key of ['map','normalMap','roughnessMap','metalnessMap']){const texture=material[key];if(texture?.isTexture&&!texture.isRenderTargetTexture&&!texture.isCubeTexture&&!this.textureSettings.has(texture)&&texture.anisotropy<amount){this.textureSettings.set(texture,texture.anisotropy);texture.anisotropy=amount;texture.needsUpdate=true;}}});}
  r.shadowMap.needsUpdate=true;
 }
 render(now=0,{force=false}={}){
  if(!this.active||this.document.hidden)return false;
  if(this.game.physics?.failed){this.close();return false;}
  // Frozen scenes redraw only after a camera/quality change, at most 30 Hz while
  // dragging. The native frame callback can keep running without extra GPU work.
  if(!force&&(!this.dirty||now-this.lastDraw<1000/30))return false;
  const g=this.game,r=g.renderer,originalCamera=g.camera,exposure=r.toneMappingExposure,restores=[];
  const hidden=[g.routeLine,g.marker,g.pickupBeacon?.root,g.taxiDestinationBeacon?.root].filter(Boolean).map(object=>[object,object.visible]);
  try{
   this.updateCamera();for(const {vehicle,pose}of this.frozenVehicles)restores.push(applyVehiclePose(vehicle,pose));
   for(const [object]of hidden)object.visible=false;
   g.camera=this.camera;g.skyCycle?.update();g.nightLighting?.update(0);g.updateVehicleLighting?.(0);
   if(this.quality==='high'&&g.sun?.shadow){const radius=clamp(this.distance*1.8,24,110);Object.assign(g.sun.shadow.camera,{left:-radius,right:radius,top:radius,bottom:-radius});g.sun.shadow.camera.updateProjectionMatrix();}
   r.toneMappingExposure=(g.skyCycle?.state?.exposure??this.saved.exposure)*2**this.exposure;
   r.render(g.scene,this.camera);this.dirty=false;this.lastDraw=now;return true;
  }finally{g.camera=originalCamera;r.toneMappingExposure=exposure;for(const restore of restores)restore();for(const [object,visible]of hidden)object.visible=visible;}
 }
 async capture(){
  if(!this.active||this.capturing)return false;const token=this.historyToken;this.capturing=true;this.view?.status?.('正在生成无界面照片…');this.view?.busy?.(true);
  try{
   // Render and read the same canvas in the same task. No permanent
   // preserveDrawingBuffer and no cross-origin images or uploads are needed.
   this.render(this.window.performance?.now?.()??0,{force:true});
   const blob=await new Promise((resolve,reject)=>{try{this.game.renderer.domElement.toBlob(value=>value?resolve(value):reject(Error('照片生成失败')),'image/png');}catch(error){reject(error);}});
   if(!this.active||this.historyToken!==token)return false;
   this.view?.photo?.(blob);this.view?.status?.('照片已生成。点“下载 PNG”；iPhone 也可长按预览图存储。');return true;
  }catch(error){if(this.active)this.view?.status?.(error?.name==='SecurityError'?'浏览器阻止读取画布。可隐藏面板后使用系统截图。':'未能生成照片，请改用标准画质或系统截图。');return false;}
  finally{this.capturing=false;this.view?.busy?.(false);}
 }
 onVisibilityChange(){if(!this.active)return;this.game.paused=true;this.releasePointers();this.invalidate();}
 releasePointers(){for(const id of this.pointers.keys()){try{if(this.game.renderer.domElement.hasPointerCapture?.(id))this.game.renderer.domElement.releasePointerCapture(id);}catch{}}this.pointers.clear();}
 onPopState(){this.historyPending=false;if(this.active)this.close({history:false});}
 close({history=true}={}){
  if(!this.active)return false;const g=this.game,r=g.renderer,s=g.sun?.shadow,old=this.saved;
  this.active=false;this.releasePointers();this.restoreTextures();
  r.setPixelRatio(old.pixelRatio);const {width,height}=this.viewport();r.setSize(width,height);r.shadowMap.enabled=old.shadows;r.shadowMap.needsUpdate=true;r.toneMappingExposure=old.exposure;
  if(g.sun)g.sun.castShadow=old.castShadow;
  if(s){this.resizeShadow(old.shadowSize.x);Object.assign(s.camera,old.shadowCamera);s.bias=old.shadowBias;s.normalBias=old.normalBias;s.camera.updateProjectionMatrix();}
  setVehicleInteriorView(g.vehicle,old.interior);
  for(const [el,inert]of this.inertElements)el.inert=inert;
  this.document.body.classList.remove('photo-mode-active');this.view?.close?.();
  const modal=this.document.getElementById('modal');if(old.modalOpen&&!modal?.open)modal?.showModal();
  g.resetControls?.();if(old.aircraftControls)g.aircraft?.setControls?.(old.aircraftControls);
  g.paused=!!old.paused||this.document.hidden||!!g.physics?.failed;
  g.hiddenPause=this.document.hidden?!!old.paused:old.hiddenPause;
  // A separate photo camera means original view offsets, follow anchors, FOV,
  // clock and camera mode never needed to be modified or reconstructed.
  g.lastFrame=null;g.accumulator=0;
  this.frozenVehicles=[];this.camera=null;
  if(history&&this.historyOwned&&this.window.history.state?.[HISTORY_KEY]===this.historyToken){this.historyPending=true;try{this.window.history.back();}catch{this.historyPending=false;this.window.history.replaceState(this.previousHistory,'');}}
  this.historyOwned=false;old.focus?.focus?.({preventScroll:true});return true;
 }
}

export function installPhotoMode(game){
 const mode=new PhotoMode(game);game.photoMode=mode;
 const root=document.createElement('section');root.id='photo-mode';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','拍照模式');
 root.innerHTML=`<header class="photo-top"><div class="photo-title"><small>SUNSET COAST</small><strong>拍照模式 <span>世界已暂停</span></strong></div><div class="photo-actions"><button id="photo-clean" type="button">隐藏面板</button><button id="photo-close" type="button" aria-label="退出拍照模式">返回游戏 ×</button></div></header>
 <div id="photo-grid" aria-hidden="true" hidden></div>
 <button id="photo-show" type="button" hidden>显示拍照面板</button>
 <section class="photo-panel" aria-label="拍照调整"><div class="photo-panel-heading"><span>自由构图</span><button id="photo-reset" type="button">重置</button></div>
 <div class="photo-segment" role="group" aria-label="拖动方式"><button id="photo-orbit" type="button" aria-pressed="true">环绕</button><button id="photo-pan" type="button" aria-pressed="false">平移</button><button id="photo-grid-toggle" type="button" aria-pressed="false">网格</button></div>
 <label class="photo-setting"><span>视野 <output id="photo-fov-value">50°</output></span><input id="photo-fov" type="range" min="25" max="85" step="1" value="50"></label>
 <label class="photo-setting"><span>距离 <output id="photo-distance-value"></output></span><input id="photo-distance" type="range" min="1.5" max="75" step=".1" value="12"></label>
 <label class="photo-setting"><span>曝光 <output id="photo-exposure-value">0 EV</output></span><input id="photo-exposure" type="range" min="-1" max="1" step=".1" value="0"></label>
 <label class="photo-setting photo-quality"><span>照片画质</span><select id="photo-quality"><option value="standard">标准 · 沿用游戏画质</option><option value="high">精细 · 最高 2 倍输出 / 精细阴影</option></select></label>
 <p class="photo-help">输出 <output id="photo-resolution-value"></output> · PNG</p>
 <p class="photo-help">单指拖动环绕 / 平移；双指缩放与平移。精细按屏幕尺寸最高 2 倍输出，有像素上限；退出即恢复，不保存为游戏画质。</p>
 <button id="photo-capture" class="photo-shutter" type="button">拍照 · 生成 PNG</button><p id="photo-status" role="status" aria-live="polite">照片不包含界面、网格和导航标记。</p></section>
 <section id="photo-result" hidden aria-label="照片预览"><button id="photo-result-close" type="button">关闭预览 ×</button><img id="photo-preview" alt="刚拍摄的 SUNSET COAST 游戏照片"><a id="photo-download" download="sunset-coast.png">下载 PNG</a><p>iPhone 可长按图片，选择存储到“照片”。</p></section>`;
 document.body.append(root);const $=id=>document.getElementById(id);let photoURL=null;
 const clearPhoto=()=>{if(photoURL)URL.revokeObjectURL(photoURL);photoURL=null;$('photo-preview').removeAttribute('src');$('photo-download').removeAttribute('href');$('photo-result').hidden=true;};
 const clean=value=>{root.classList.toggle('photo-clean',value);$('photo-show').hidden=!value;};
 mode.view={open(){root.hidden=false;clean(false);$('photo-grid').hidden=true;$('photo-grid-toggle').setAttribute('aria-pressed','false');$('photo-status').textContent='照片不包含界面、网格和导航标记。';},close(){root.hidden=true;clearPhoto();},focus(){$('photo-close').focus();},
  sync(){if(!mode.active)return;$('photo-fov').value=mode.camera.fov;$('photo-fov-value').textContent=Math.round(mode.camera.fov)+'°';$('photo-distance').value=mode.distance;$('photo-distance-value').textContent=mode.distance.toFixed(1)+' m';$('photo-exposure').value=mode.exposure;$('photo-exposure-value').textContent=(mode.exposure>0?'+':'')+mode.exposure.toFixed(1)+' EV';$('photo-quality').value=mode.quality;const canvas=game.renderer.domElement,ratio=game.renderer.getPixelRatio();$('photo-resolution-value').textContent=(canvas.width??Math.floor(window.innerWidth*ratio))+' × '+(canvas.height??Math.floor(window.innerHeight*ratio));for(const name of ['orbit','pan'])$('photo-'+name).setAttribute('aria-pressed',String(mode.gesture===name));},
  status(text){$('photo-status').textContent=text;},busy(value){$('photo-capture').disabled=value;},photo(blob){clearPhoto();photoURL=URL.createObjectURL(blob);$('photo-preview').src=photoURL;$('photo-download').href=photoURL;$('photo-download').download='sunset-coast-'+new Date().toISOString().replace(/[:.]/g,'-')+'.png';$('photo-result').hidden=false;$('photo-result-close').focus();}};
 const entry=document.createElement('button');entry.id='photo-mode-btn';entry.className='tool-button';entry.type='button';entry.title='拍照模式 · O';entry.innerHTML='<span class="tool-icon" aria-hidden="true">◎</span><span>拍照</span><kbd>O</kbd>';entry.onclick=()=>mode.enter();document.querySelector('.right-tools')?.append(entry);
 $('photo-close').onclick=()=>mode.close();$('photo-clean').onclick=()=>clean(true);$('photo-show').onclick=()=>clean(false);$('photo-reset').onclick=()=>mode.resetFraming();$('photo-capture').onclick=()=>mode.capture();$('photo-result-close').onclick=clearPhoto;
 for(const name of ['orbit','pan'])$('photo-'+name).onclick=()=>{mode.gesture=name;mode.invalidate();};
 $('photo-grid-toggle').onclick=()=>{$('photo-grid').hidden=!$('photo-grid').hidden;$('photo-grid-toggle').setAttribute('aria-pressed',String(!$('photo-grid').hidden));};
 $('photo-fov').oninput=e=>mode.setFov(e.target.value);$('photo-distance').oninput=e=>{mode.distance=Number(e.target.value);mode.invalidate();};$('photo-exposure').oninput=e=>mode.setExposure(e.target.value);$('photo-quality').onchange=e=>mode.setQuality(e.target.value);
 const canvas=game.renderer.domElement;
 canvas.addEventListener('pointerdown',event=>{if(!mode.active||event.button!==0&&event.button!==2)return;event.preventDefault();mode.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});canvas.setPointerCapture(event.pointerId);});
 canvas.addEventListener('pointermove',event=>{if(!mode.active||!mode.pointers.has(event.pointerId))return;event.preventDefault();const previous=[...mode.pointers.values()].map(p=>({...p})),old=mode.pointers.get(event.pointerId),dx=event.clientX-old.x,dy=event.clientY-old.y;mode.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});const next=[...mode.pointers.values()];if(next.length>=2){const a=previous,b=next,d0=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),d1=Math.hypot(b[0].x-b[1].x,b[0].y-b[1].y);if(d0>4&&d1>4)mode.zoom(d0/d1);mode.pan(dx/2,dy/2);}else if(mode.gesture==='pan'||event.buttons===2||event.shiftKey)mode.pan(dx,dy);else mode.orbit(dx,dy);});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,event=>{mode.pointers.delete(event.pointerId);});
 canvas.addEventListener('wheel',event=>{if(!mode.active)return;event.preventDefault();mode.zoom(Math.exp(clamp(event.deltaY,-200,200)*.002));},{passive:false});
 window.addEventListener('blur',()=>mode.releasePointers());window.addEventListener('popstate',()=>mode.onPopState());
 window.addEventListener('keydown',event=>{
  const editing=['INPUT','SELECT','TEXTAREA'].includes(event.target?.tagName)||event.target?.isContentEditable;
  if(!mode.active){if(event.code==='KeyO'&&!editing&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.repeat){event.preventDefault();mode.enter();}return;}
  if(event.ctrlKey||event.metaKey||event.altKey)return;
  event.stopImmediatePropagation();
  if(event.code==='Escape'){event.preventDefault();if(!$('photo-result').hidden)clearPhoto();else mode.close();return;}
  if(event.code==='Tab'){const focusable=[...root.querySelectorAll('button,input,select,a[href]')].filter(el=>!el.disabled&&el.getClientRects().length);if(focusable.length){const index=focusable.indexOf(document.activeElement),next=(index+(event.shiftKey?-1:1)+focusable.length)%focusable.length;event.preventDefault();focusable[next].focus();}return;}
  if(editing||(['Enter','Space'].includes(event.code)&&event.target?.closest?.('button,a')))return;
  const movement={ArrowLeft:[-24,0],ArrowRight:[24,0],ArrowUp:[0,-24],ArrowDown:[0,24]}[event.code];
  if(movement){event.preventDefault();if(event.shiftKey)mode.pan(...movement);else mode.orbit(...movement);}
  if(event.code==='Equal'||event.code==='NumpadAdd')mode.zoom(.9);if(event.code==='Minus'||event.code==='NumpadSubtract')mode.zoom(1.1);
  if(event.code==='KeyR')mode.resetFraming();if(event.code==='KeyH')clean(!root.classList.contains('photo-clean'));if(event.code==='Enter')mode.capture();
 },true);
 return mode;
}
