import * as THREE from './vendor/three.module.js';
import {cameraContext, cameraBudget, reverseGuidePoint, VehicleCameraState} from './vehicle-camera-state.js';

// A real, second view of game.scene. No sensor-semantic picture, road diagram,
// synthetic stitched feed, readPixels loop or additional WebGL context.
export class VehicleCameraViews {
  constructor(game, document = globalThis.document) {
    this.g = game; this.document = document; this.state = new VehicleCameraState();
    this.lastCapture = -Infinity; this.captureCount = 0; this.orbit = false; this.angle = 0;
    this.rearCamera = new THREE.PerspectiveCamera(92, 16 / 9, .08, 170);
    this.aroundCamera = new THREE.PerspectiveCamera(58, 16 / 9, .1, 200);
    this.topCamera = new THREE.OrthographicCamera(-12, 12, 7, -7, .1, 160);
    const panel = this.panel = document.createElement('section');
    panel.id = 'vehicle-camera-panel'; panel.hidden = true;
    panel.setAttribute('aria-label', '车辆真实场景摄像头');
    panel.innerHTML = `<header class="vehicle-camera-header"><button type="button" id="vehicle-camera-rear" aria-pressed="false">倒车</button><button type="button" id="vehicle-camera-surround" aria-pressed="false">360</button><button type="button" id="vehicle-camera-expand" aria-label="展开摄像头小窗" aria-expanded="false">展开</button><button type="button" id="vehicle-camera-close" aria-label="关闭摄像头，本次倒车不再自动弹出" title="本次 R 挡保持关闭，重新挂 R 后恢复">×</button></header><div class="vehicle-camera-stage"><canvas id="vehicle-camera-canvas" aria-label="游戏场景实时摄像头画面"></canvas><span id="vehicle-camera-label"></span><div class="vehicle-camera-orbit" id="vehicle-camera-orbit"><button type="button" id="vehicle-camera-left" aria-label="环视向左转45度">↶</button><button type="button" id="vehicle-camera-angle">绕车</button><button type="button" id="vehicle-camera-right" aria-label="环视向右转45度">↷</button></div></div><div id="vehicle-camera-note"></div>`;
    document.body.append(panel);
    const node = id => panel.querySelector('#vehicle-camera-' + id);
    this.canvas = node('canvas'); this.ctx = this.canvas.getContext('2d', {alpha: false});
    this.nodes = Object.fromEntries(['rear','surround','expand','close','label','orbit','left','angle','right','note'].map(id => [id,node(id)]));
    this.nodes.rear.onclick = () => this.select('rear');
    this.nodes.surround.onclick = () => this.select('surround');
    this.nodes.close.onclick = () => this.close();
    this.nodes.expand.onclick = () => { this.state.expanded = !this.state.expanded; this.lastCapture = -Infinity; this.sync(); };
    this.nodes.angle.onclick = () => { this.orbit = !this.orbit; this.lastCapture = -Infinity; this.sync(); };
    this.nodes.left.onclick = () => this.rotate(-1);
    this.nodes.right.onclick = () => this.rotate(1);
    // Keep Space/Enter on our buttons from driving, but never consume keyup:
    // releasing an earlier driving key must still clear the game's key latch.
    panel.addEventListener('keydown', event => { if (['Space','Enter'].includes(event.code)) event.stopPropagation(); });
    const toggle = this.toggleButton = document.createElement('button');
    toggle.id = 'vehicle-camera-toggle'; toggle.className = 'tool-button'; toggle.type = 'button'; toggle.hidden = true;
    toggle.setAttribute('aria-label', '开启或关闭360场景环视'); toggle.setAttribute('aria-pressed', 'false');
    toggle.innerHTML = '<span aria-hidden="true">360</span><span>环视</span>';
    toggle.onclick = () => this.toggleSurround();
    toggle.addEventListener('keydown', event => { if (['Space','Enter'].includes(event.code)) event.stopPropagation(); });
    document.querySelector('.right-tools')?.append(toggle);
    // Observe accepted shifts synchronously: D→R can occur between slow GPU
    // frames, and must still re-arm an explicitly dismissed reversing view.
    if (typeof game.selectTouchGear === 'function') {
      const selectGear = game.selectTouchGear.bind(game);
      game.selectTouchGear = gear => { const accepted = selectGear(gear); if (accepted) this.sync(); return accepted; };
    }
  }
  select(view) {
    const context = cameraContext(this.g, this.document); this.state.update(context);
    if (!context.driving || context.suspended) { this.g.ui?.toast('请先进入地面车辆，再开启环视'); return false; }
    this.state.select(view); this.lastCapture = -Infinity; this.sync(); return true;
  }
  toggleSurround() {
    this.sync();
    if (this.state.view === 'surround') this.close(); else this.select('surround');
  }
  close() {
    this.state.close(); this.panel.hidden = true; this.sync();
    if (this.panel.contains?.(this.document.activeElement)) {
      const mobile = this.document.getElementById('mobile-tools-toggle');
      const target = this.g.effectiveInputMode === 'touch' ? mobile : this.toggleButton;
      target?.focus?.({preventScroll: true});
    }
  }
  suspend() { this.panel.hidden = true; this.lastCapture = -Infinity; }
  rotate(direction) { this.angle += direction * Math.PI / 4; this.orbit = true; this.lastCapture = -Infinity; this.sync(); }
  sync() {
    const context = cameraContext(this.g, this.document), old = this.state.view, view = this.state.update(context);
    if (old !== view) this.lastCapture = -Infinity;
    this.toggleButton.hidden = !context.driving || context.suspended;
    const mobile = this.document.getElementById('mobile-surround-camera');
    if (mobile) { mobile.hidden = !context.driving; mobile.setAttribute('aria-pressed', String(view === 'surround')); }
    this.toggleButton.setAttribute('aria-pressed', String(view === 'surround'));
    this.panel.hidden = !view; this.panel.dataset.view = view || ''; this.panel.dataset.expanded = String(this.state.expanded);
    this.nodes.rear.setAttribute('aria-pressed', String(view === 'rear'));
    this.nodes.surround.setAttribute('aria-pressed', String(view === 'surround'));
    this.nodes.expand.setAttribute('aria-expanded', String(this.state.expanded));
    this.nodes.expand.setAttribute('aria-label', this.state.expanded ? '收起为摄像头小窗' : '展开摄像头小窗');
    this.nodes.expand.textContent = this.state.expanded ? '收起' : '展开';
    this.nodes.orbit.hidden = view !== 'surround';
    this.nodes.left.hidden = this.nodes.right.hidden = !this.orbit;
    this.nodes.angle.textContent = this.orbit ? '俯视' : '绕车';
    this.nodes.label.textContent = view === 'rear' ? (this.g.vehicle?.trailer ? '挂车尾摄像头 · 镜像' : '倒车摄像头 · 镜像') : '360 · ' + (this.orbit ? '绕车视角' : '俯视环视');
    this.nodes.note.textContent = view === 'rear' ? (this.g.vehicle?.trailer ? '真实场景 · 挂车不显示轨迹预测' : '真实场景 · 轨迹仅估算，请观察周围') : '真实场景视角 · 非多镜头拼接';
    return view;
  }
  setCamera(view, aspect) {
    const car = this.g.vehicle, root = car.root;
    root.updateWorldMatrix(true, true);
    if (view === 'rear') {
      const trailer = car.trailer, mountRoot = trailer?.root || root;
      mountRoot.updateWorldMatrix(true, true);
      const mount = trailer?.rearCameraMount || [0, Math.max(.65, Math.min(1.5, (car.height || 1.5) * .65)), (car.dimensions?.length ?? (car.wheelBase || 2.7) + 1.7) / 2 + .12];
      const eye = mountRoot.localToWorld(new THREE.Vector3(...mount));
      const target = mountRoot.localToWorld(new THREE.Vector3(mount[0], mount[1] - 2.5, mount[2] + 7));
      const camera = this.rearCamera; camera.aspect = aspect; camera.position.copy(eye);
      camera.up.set(0,1,0).transformDirection(mountRoot.matrixWorld); camera.lookAt(target); camera.updateProjectionMatrix(); camera.updateMatrixWorld(true); return camera;
    }
    // Fit real authored car/trailer bounds, never replace the vehicle with an icon.
    const halfLength = (car.dimensions?.length ?? (car.wheelBase || 2.7) + 1.7) / 2;
    const bounds = new THREE.Box3(new THREE.Vector3(-(car.halfWidth || 1),0,-halfLength), new THREE.Vector3(car.halfWidth || 1,car.height || 1.7,halfLength));
    const trailer = car.trailer;
    if (trailer?.root && trailer.cameraBounds) {
      trailer.root.updateWorldMatrix(true,true);
      const b = trailer.cameraBounds;
      for (const x of [b.minX,b.maxX]) for (const y of [b.minY,b.maxY]) for (const z of [b.minZ,b.maxZ]) bounds.expandByPoint(root.worldToLocal(trailer.root.localToWorld(new THREE.Vector3(x,y,z))));
    }
    const center = bounds.getCenter(new THREE.Vector3()); center.y = .5;
    const target = root.localToWorld(center), length = bounds.max.z - bounds.min.z;
    const heading = new THREE.Vector3(0,0,-1).transformDirection(root.matrixWorld); heading.y = 0; if (heading.lengthSq() < .0001) heading.set(-Math.sin(car.yaw || 0),0,-Math.cos(car.yaw || 0)); else heading.normalize();
    let camera;
    if (this.orbit) {
      camera = this.aroundCamera; camera.aspect = aspect;
      const distance = Math.max(9, length * 1.15), yaw = Math.atan2(-heading.x, -heading.z) + this.angle;
      camera.position.copy(target).add(new THREE.Vector3(Math.sin(yaw) * distance, distance * .65, Math.cos(yaw) * distance)); camera.up.set(0,1,0);
    } else {
      camera = this.topCamera; const halfHeight = Math.max(6.3, (length + 7) / 2, (bounds.max.x - bounds.min.x + 7) / (2 * aspect));
      camera.left = -halfHeight * aspect; camera.right = halfHeight * aspect; camera.top = halfHeight; camera.bottom = -halfHeight;
      camera.position.copy(target).add(new THREE.Vector3(0, Math.max(20, length + 12), 0)); camera.up.copy(heading);
    }
    camera.lookAt(target); camera.updateProjectionMatrix(); camera.updateMatrixWorld(true); return camera;
  }
  render(now = performance.now()) {
    const view = this.sync(); if (!view || !this.ctx) return;
    const budget = cameraBudget(this.g.performanceProfile, this.state.expanded);
    if (now - this.lastCapture < budget.interval) return;
    const rect = this.canvas.getBoundingClientRect(), r = this.g.renderer, worldRect = r.domElement.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2 || rect.left < worldRect.left || rect.top < worldRect.top || rect.right > worldRect.right + 1 || rect.bottom > worldRect.bottom + 1) return;
    // Capture only a bounded rectangle UNDER our opaque display canvas. The
    // result is copied synchronously; on other frames the main scene is normal.
    // drawImage avoids a JS pixel readback and retains the last feed between ticks.
    const size = r.getDrawingBufferSize(new THREE.Vector2()), pixelRatio = r.getPixelRatio();
    const scaleX = size.x / worldRect.width, scaleY = size.y / worldRect.height;
    const width = Math.max(2, Math.min(budget.maxWidth, Math.floor(rect.width * scaleX)));
    const height = Math.max(2, Math.round(width * rect.height / rect.width));
    const x = Math.round((rect.left - worldRect.left) * scaleX), top = Math.round((rect.top - worldRect.top) * scaleY), y = size.y - top - height;
    const camera = this.setCamera(view, width / height), scene = this.g.scene;
    const saved = {toneMapping:r.toneMapping, exposure:r.toneMappingExposure, clearColor:r.getClearColor(new THREE.Color()), clearAlpha:r.getClearAlpha(), target:r.getRenderTarget(), face:r.getActiveCubeFace(), mip:r.getActiveMipmapLevel(), viewport:r.getViewport(new THREE.Vector4()), scissor:r.getScissor(new THREE.Vector4()), scissorTest:r.getScissorTest(), autoClear:r.autoClear, shadowUpdate:r.shadowMap.autoUpdate, shadowNeedsUpdate:r.shadowMap.needsUpdate, xr:r.xr.enabled};
    const hidden = [this.g.person?.root,this.g.routeLine,this.g.marker,this.g.pickupBeacon?.root,this.g.taxiDestinationBeacon?.root].filter(Boolean).map(object => [object,object.visible]);
    const materials = view === 'surround' && this.g.vehicle.interiorView ? (this.g.vehicle.cabinGlass?.meshes || []).map(([mesh,original]) => [mesh,mesh.material,original]) : [];
    try {
      hidden.forEach(([object]) => object.visible = false); materials.forEach(([mesh,,original]) => mesh.material = original);
      r.xr.enabled = false; r.shadowMap.autoUpdate = false; r.shadowMap.needsUpdate = false; r.autoClear = false;
      r.setRenderTarget(null); r.setViewport(x / pixelRatio,y / pixelRatio,width / pixelRatio,height / pixelRatio); r.setScissor(x / pixelRatio,y / pixelRatio,width / pixelRatio,height / pixelRatio); r.setScissorTest(true);
      r.clear(true,true,false); r.render(scene,camera);
      if (this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height; }
      this.ctx.save();
      try {
        if (view === 'rear') { this.ctx.translate(width,0); this.ctx.scale(-1,1); }
        this.ctx.drawImage(r.domElement,x,top,width,height,0,0,width,height);
      } finally { this.ctx.restore(); }
      if (view === 'rear' && !this.g.vehicle.trailer) this.drawGuides(camera,width,height);
      this.lastCapture = now; this.captureCount++; this.panel.dataset.frames = String(this.captureCount); this.panel.dataset.captureWidth = String(width);
    } catch (error) {
      // A failed camera view must not stop the simulation or leave a stale
      // image labelled live. Close this engagement and permit a manual retry.
      console.warn('Vehicle camera capture failed',error); this.state.close(); this.panel.hidden = true;
      this.g.ui?.toast('摄像头暂不可用，可从360环视重试');
    } finally {
      hidden.forEach(([object,visible]) => object.visible = visible); materials.forEach(([mesh,material]) => mesh.material = material);
      r.toneMapping = saved.toneMapping; r.toneMappingExposure = saved.exposure; r.setClearColor(saved.clearColor,saved.clearAlpha);
      r.autoClear = saved.autoClear; r.shadowMap.autoUpdate = saved.shadowUpdate; r.shadowMap.needsUpdate = saved.shadowNeedsUpdate; r.xr.enabled = saved.xr;
      r.setRenderTarget(saved.target,saved.face,saved.mip); r.setViewport(saved.viewport); r.setScissor(saved.scissor); r.setScissorTest(saved.scissorTest);
    }
  }
  drawGuides(camera,width,height) {
    const car = this.g.vehicle, ctx = this.ctx;
    const project = (distance,side) => {
      const p = reverseGuidePoint(car,distance,side), world = car.root.localToWorld(new THREE.Vector3(p.x,0,p.z));
      world.y = (this.g.groundContact?.heightAt(world.x,world.z) ?? this.g.world?.groundHeight?.(world.x,world.z) ?? car.root.position.y) + .07;
      world.project(camera); if (world.z < -1 || world.z > 1) return null;
      return {x:(1-world.x)*width/2,y:(1-world.y)*height/2}; // same mirror as feed
    };
    ctx.save(); ctx.lineWidth = Math.max(1.5,width / 180); ctx.lineJoin = 'round';
    try {
      for (const [start,end,color] of [[.3,1,'#ff7366'],[1,2.5,'#ffe17e'],[2.5,5,'#a8e9a6']]) {
        ctx.strokeStyle = color;
        for (const side of [-1,1]) { ctx.beginPath(); let started = false; for (let d=start;d<=end+.001;d+=.1) { const p=project(d,side); if (!p) { started=false;continue; } if (started) ctx.lineTo(p.x,p.y); else {ctx.moveTo(p.x,p.y);started=true;} } ctx.stroke(); }
        const a=project(end,-1),b=project(end,1); if (a&&b) {ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
      }
    } finally { ctx.restore(); }
  }
}

export function installVehicleCameras(game) { return game.vehicleCameras ||= new VehicleCameraViews(game); }
