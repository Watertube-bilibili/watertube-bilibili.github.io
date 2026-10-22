import {vehicleGear} from './touch-transmission.js';
import {semiDisplayState,paintSemiDisplay} from './semi-displays.js';
import {infotainmentState,paintVehicleInfotainment} from './vehicle-infotainment.js';
import {cockpitProfile} from './cockpit-profiles.js';
import {g9NavigationState,paintG9Navigation} from './g9-navigation.js';
import {roadsterDisplayState} from './roadster-displays.js';
import {COCKPIT_OPEN_KEY} from './storage-keys.js';
import {installPanelDrag} from './panel-drag.js';
import {sensorFresh,cameraDetections,cameraRoad,cameraRoadPaint,syncCockpitEgo} from './cockpit-perception.js';
import {activeRouteView} from './route-view.js';
import {updateAssistStatus} from './assist-status.js';
import {FOLLOW_GAP_PRESETS} from './assist-settings.js';
import * as THREE from './vendor/three.module.js';
import {createVehicleEnvironment} from './vehicle-environment.js';
import {createCar} from './world.js';

const clamp = THREE.MathUtils.clamp;
const svg = (body) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const ICON = {
  wheel: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.2"/><path d="m4 8 6 3m10-3-6 3m-2 3v7"/>'),
  screen: svg('<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4m-4-8 4-2 4 2"/>'),
  camera: svg('<rect x="3" y="6" width="14" height="13" rx="2"/><path d="m17 10 4-3v11l-4-3M7 3h6"/>'),
  nav: svg('<path d="m12 3 8 18-8-5-8 5 8-18Z"/>'),
  close: svg('<path d="m6 6 12 12M6 18 18 6"/>'),
  battery: svg('<rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 10v4M5 10v4m4-4v4m4-4v4m4-4v4"/>'),
};

/** A separate, small WebGL display. Obstacles only come from camera detections. */
export class VehicleCockpit {
  constructor(game) {
    this.g = game;
    this._open = false;
    this.view = 'perception';
    this.slots = [];
    this.models = new Map();
    this.lastSensorFrame = -1;
    this.frameElapsed = 0;
    this.motionElapsed = 0;
    this.hudElapsed = 1;
    this.ownedResources = [];
    this.panel = document.createElement('section');
    this.panel.id = 'vehicle-cockpit';
    this.panel.className = 'vehicle-cockpit';
    this.panel.setAttribute('aria-label', 'VOLT 车机与驾驶可视化');
    this.panel.hidden = true;
    this.panel.innerHTML = `
      <header class="vc-header"><div class="vc-brand" aria-label="移动车机"><span class="vc-volt">Ⅴ</span><strong>VOLT</strong><span class="vc-model">VOLT S</span></div><nav class="vc-views" aria-label="车机视图"><button class="vc-view-perception" type="button" aria-pressed="true">感知</button><button class="vc-view-vehicle" type="button" aria-pressed="false">车辆</button></nav><div class="vc-header-actions"><span class="vc-clock"></span><button class="vc-close" type="button" aria-label="关闭车机" title="收起车机 · U">${ICON.close}</button></div></header>
      <div class="vc-body"><aside class="vc-instruments"><div class="vc-gear">P <span>R N D</span></div><strong class="vc-speed">0</strong><span class="vc-unit">KM/H</span><div class="vc-wheel">${ICON.wheel}</div><div class="vc-energy">${ICON.battery}<span>98%</span></div><span class="vc-range">412 km</span></aside><div class="vc-visual"><div class="vc-navigation"><span class="vc-nav-icon">${ICON.nav}</span><div><strong class="vc-destination">自由驾驶</strong><span class="vc-distance">选择目的地，探索城市</span></div></div><div class="vc-stage"><div class="vc-webgl" aria-label="语义摄像头感知：可见道路、车辆和行人，蓝色为规划路径"></div><span class="vc-offline" hidden>请进入车辆</span></div><div class="vc-telemetry" hidden><span>驱动<strong class="vc-drive-state"></strong></span><span>气动<strong class="vc-aero-state"></strong></span><span>车身<strong class="vc-body-state"></strong></span></div></div></div>
      <div class="vc-warning" hidden></div><div class="vc-scene-label"><span class="vc-perception-dot"></span><span class="vc-scene-state">等待车载摄像头</span><span class="vc-count">0 辆 · 0 人</span></div>
      <footer class="vc-footer"><button class="vc-pilot" type="button" aria-label="切换 VOLT Pilot 辅助驾驶">${ICON.wheel}<span>VOLT Pilot</span><i></i></button><button class="vc-camera" type="button" aria-label="开关车载摄像头画面">${ICON.camera}<span>摄像头</span></button><button class="vc-nav" type="button" aria-label="选择导航目的地">${ICON.nav}<span>导航</span></button><button class="vc-settings" type="button" aria-label="设置巡航速度、跟车距离与 AEB">⚙<span>设置</span></button><span class="vc-signal">路面 <b>—</b></span></footer>`;
    document.body.append(this.panel);
    this.vehicleDisplay = document.createElement('canvas');
    this.vehicleDisplay.className = 'vc-vehicle-display'; this.vehicleDisplay.hidden = true;
    this.panel.querySelector('.vc-stage').append(this.vehicleDisplay);
    this.nodes = Object.fromEntries([...this.panel.querySelectorAll('[class]')].map(el => [el.classList[0], el]));
    this.launcher = document.createElement('button');
    this.launcher.type = 'button';
    this.launcher.id = 'cockpit-btn';
    this.launcher.className = 'tool-button';
    this.launcher.title = 'VOLT 车机 · U';
    this.launcher.setAttribute('aria-controls', 'vehicle-cockpit');
    this.launcher.innerHTML = `<span class="tool-icon">${ICON.screen}</span><span>车机</span><kbd>U</kbd>`;
    (document.querySelector('.right-tools') ?? document.body).append(this.launcher);
    this.launcher.onclick = () => this.toggle();
    this.nodes['vc-close'].onclick = () => this.close();
    this.drag = installPanelDrag(this.panel,{handle:this.nodes['vc-brand']});
    this.nodes['vc-brand'].addEventListener('focus',()=>game.resetControls?.());
    this.nodes['vc-view-perception'].onclick=()=>this.setView('perception');
    this.nodes['vc-view-vehicle'].onclick=()=>this.setView('vehicle');
    this.panel.addEventListener('keydown',event=>{if(['Space','Enter','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.code))event.stopPropagation();});
    this.nodes['vc-pilot'].onclick = () => { game.toggleAutopilot(); this.updateHUD(); };
    this.nodes['vc-nav'].onclick = () => game.ui.openPhone('nav');
    this.nodes['vc-settings'].onclick = () => game.ui.openAssistSettings();
    this.nodes['vc-camera'].onclick = () => {
      const panel = document.getElementById('sensor-panel');
      if (!panel) return;
      game.ui.previewSensor = panel.hidden;
      panel.hidden = !panel.hidden;
      this.updateHUD();
    };
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(this.nodes['vc-webgl']);
    let open = innerWidth >= 1100 && innerHeight >= 600;
    try { const pref = localStorage.getItem(COCKPIT_OPEN_KEY); if (pref !== null) open = pref === 'true'; } catch {}
    this.drivingOpenPreference = open;
    this.wasDriving = !!game.inCar;
    this.setOpen(game.inCar && open, false);
  }
  syncContext() {
    const driving = !!this.g.inCar;
    if (driving === this.wasDriving) return;
    this.wasDriving = driving;
    this.setOpen(driving && this.drivingOpenPreference, false);
  }
  get isOpen() { return this._open; }
  get hasCustomPosition() { return this.drag.hasCustomPosition; }
  resetPosition() { this.drag.reset(); this.resize(); }
  get usesScene() { return this.view==='perception'||this.profile?.display==='roadster'; }
  setView(view) {
    if(!['perception','vehicle'].includes(view))return;
    this.view=view;
    this.updateView();
    if(this._open&&this.usesScene)this.initScene();
    this.lastSensorFrame=-1;this.lastRoadFrame=-1;this.g.sensorClock=1;
    this.updateHUD();this.resize();this.update(1/30);
  }
  updateView() {
    if(!this.profile)return;
    const perception=this.view==='perception',roadster=this.profile.display==='roadster';
    this.panel.dataset.view=this.view;
    this.nodes['vc-view-perception'].setAttribute('aria-pressed',String(perception));
    this.nodes['vc-view-vehicle'].setAttribute('aria-pressed',String(!perception));
    this.nodes['vc-webgl'].hidden=!this.usesScene;
    this.vehicleDisplay.hidden=this.usesScene;
    this.nodes['vc-instruments'].hidden=!perception&&!roadster;
    this.nodes['vc-navigation'].hidden=!perception;
    this.nodes['vc-count'].hidden=!perception;
    this.nodes['vc-telemetry'].hidden=perception||!roadster;
    this.nodes['vc-webgl'].setAttribute('aria-label',perception?'语义摄像头感知：可见道路、车辆和行人，蓝色为规划路径':'当前 Roadster 真实车型资产与车辆状态，非摄像头画面');
    if(this.camera){this.camera.position.set(perception?5.5:6,perception?11.5:3.8,perception?13:6.5);this.camera.lookAt(0,perception?0:.55,perception?-7:0);}
    if(this.roadGrid)this.roadGrid.visible=perception;
    if(!perception){for(const slot of this.slots)slot.group.visible=false;if(this.ribbon)this.ribbon.visible=this.routeEdge.visible=false;}
  }
  toggle() { this.setOpen(!this._open); }
  close() { this.setOpen(false); }
  setOpen(open, save = true) {
    if (save) this.drivingOpenPreference = !!open;
    if (!open) { this.drag?.cancel(); this.frameElapsed = 0; this.motionElapsed = 0; }
    this._open = !!open;
    this.panel.hidden = !this._open;
    document.body.classList.toggle('cockpit-open', this._open);
    this.launcher.classList.toggle('active', this._open);
    this.launcher.setAttribute('aria-expanded', String(this._open));
    if (save) try { localStorage.setItem(COCKPIT_OPEN_KEY, String(this._open)); } catch {}
    if (this._open) {
      this.updateHUD();
      if(this.usesScene)this.initScene();
      this.g.sensorClock = 1;
      this.lastSensorFrame = -1;
      this.updateHUD();
      this.resize();
      this.update(1 / 30);
    }
  }
  own(resource) { this.ownedResources.push(resource); return resource; }
  initScene() {
    if (this.renderer || this.failed) return;
    try {
      this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: false, powerPreference: 'low-power'});
      this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, this.g.performanceProfile?.pixelRatio??1.5));
      this.renderer.setClearColor(0xf1f3f5);
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.35;
      this.nodes['vc-webgl'].append(this.renderer.domElement);
      this.scene = new THREE.Scene();
      this.scene.environment = createVehicleEnvironment(this.renderer);
      this.scene.environmentIntensity = .75;
      this.scene.background = new THREE.Color(0xf1f3f5);
      this.scene.fog = new THREE.Fog(0xf1f3f5, 45, 100);
      this.camera = new THREE.PerspectiveCamera(38, 2, .1, 140);
      this.camera.position.set(5.5, 11.5, 13);
      this.camera.lookAt(0, 0, -7);
      this.scene.add(new THREE.HemisphereLight(0xffffff, 0xa3aab5, 3.1));
      const light = new THREE.DirectionalLight(0xffffff, 3.3);
      light.position.set(-13, 30, 16);
      this.scene.add(light);
      const fill = new THREE.DirectionalLight(0xdce6ff, 1.6);
      fill.position.set(13, 8, -20);
      this.scene.add(fill);
      this.roadGrid = new THREE.Group(); this.scene.add(this.roadGrid);
      this.roadMaterial = this.own(new THREE.MeshBasicMaterial({color:0xdce2e8,side:THREE.DoubleSide,transparent:true,opacity:.7,toneMapped:false}));
      this.roadGeometry = this.own(new THREE.BufferGeometry());
      this.roadGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(16*6),3).setUsage(THREE.DynamicDrawUsage));
      const roadIndices=[];for(let i=0;i<15;i++){const k=i*2;roadIndices.push(k,k+1,k+2,k+1,k+3,k+2);}this.roadGeometry.setIndex(roadIndices);
      this.roadMesh=new THREE.Mesh(this.roadGeometry,this.roadMaterial);this.roadMesh.frustumCulled=false;this.roadGrid.add(this.roadMesh);
      this.paintGeometry=this.own(new THREE.BufferGeometry());this.paintGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(512*3),3).setUsage(THREE.DynamicDrawUsage));
      this.roadPaint=new THREE.Points(this.paintGeometry,this.own(new THREE.PointsMaterial({color:0x778a9a,size:.22,toneMapped:false})));this.roadPaint.frustumCulled=false;this.roadGrid.add(this.roadPaint);
      this.routeMaterial = this.own(new THREE.MeshBasicMaterial({color: 0x3685ff, transparent: true, opacity: .29, side: THREE.DoubleSide, depthWrite: false}));
      this.ribbonGeometry = this.own(new THREE.BufferGeometry());
      this.ribbonGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(49 * 2 * 3), 3).setUsage(THREE.DynamicDrawUsage));
      const indices = [];
      for (let i = 0; i < 48; i++) { const k = i * 2; indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      this.ribbonGeometry.setIndex(indices);
      this.ribbon = new THREE.Mesh(this.ribbonGeometry, this.routeMaterial); this.ribbon.frustumCulled = false; this.scene.add(this.ribbon);
      this.edgeGeometry = this.own(new THREE.BufferGeometry());
      this.edgeGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(49 * 3), 3).setUsage(THREE.DynamicDrawUsage));
      this.routeEdge = new THREE.Line(this.edgeGeometry, this.own(new THREE.LineBasicMaterial({color: 0x247cff, transparent: true, opacity: .8})));
      this.routeEdge.frustumCulled = false; this.scene.add(this.routeEdge);
      const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 128;
      const ctx = shadowCanvas.getContext('2d'), gradient = ctx.createRadialGradient(64, 64, 8, 64, 64, 62);
      gradient.addColorStop(0, '#19253688'); gradient.addColorStop(1, '#19253600'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128);
      this.shadowTexture = this.own(new THREE.CanvasTexture(shadowCanvas));
      this.shadowMaterial = this.own(new THREE.MeshBasicMaterial({map: this.shadowTexture, transparent: true, depthWrite: false}));
      this.shadowGeometry = this.own(new THREE.PlaneGeometry(5, 7));
      const egoShadow = new THREE.Mesh(this.shadowGeometry, this.shadowMaterial); egoShadow.rotation.x = -Math.PI / 2; egoShadow.position.y = .02; this.scene.add(egoShadow);
      this.pedMaterial = this.own(new THREE.MeshStandardMaterial({color: 0xdfa44a, roughness: .65}));
      this.pedHeadGeometry = this.own(new THREE.SphereGeometry(.19, 10, 8));
      this.pedBodyGeometry = this.own(new THREE.CapsuleGeometry(.22, .58, 3, 8));
      this.pedLegGeometry = this.own(new THREE.CapsuleGeometry(.085, .5, 3, 6));
      for (let i = 0; i < 18; i++) this.slots.push(this.makeDetectionSlot());
      this.refreshEgo(); this.updateView();
    } catch (error) {
      console.warn('Vehicle cockpit WebGL unavailable:', error.message);
      this.failed = true;
      this.nodes['vc-webgl'].textContent = '车机 WebGL 暂不可用';
    }
  }
  refreshEgo() {
    const vehicle = this.g.vehicle;
    if (!this.scene || !vehicle || this.ego?.model.id === vehicle.model.id) return;
    if (this.ego) this.ego.root.visible = false;
    if (!this.models.has(vehicle.model.id)) {
      // createCar caches shared materials/box geometry; retain the vehicle models
      // rather than disposing shared resources used by the main world renderer.
      const model = createCar(vehicle.model.id, false, 0x829bad);
      this.models.set(vehicle.model.id, model); this.scene.add(model.root);
    }
    this.ego = this.models.get(vehicle.model.id);
    this.ego.root.visible = true;
  }
  makeDetectionSlot() {
    const group = new THREE.Group(); group.visible = false;
    const car = createCar('s', true, 0xadb6c2); car.root.visible = false; group.add(car.root);
    const person = new THREE.Group(); person.visible = false;
    const head = new THREE.Mesh(this.pedHeadGeometry, this.pedMaterial); head.position.y = 1.62;
    const body = new THREE.Mesh(this.pedBodyGeometry, this.pedMaterial); body.position.y = 1.06;
    person.add(head, body);
    for (const x of [-.12, .12]) { const leg = new THREE.Mesh(this.pedLegGeometry, this.pedMaterial); leg.position.set(x, .4, 0); person.add(leg); }
    group.add(person);
    const shadow = new THREE.Mesh(this.shadowGeometry, this.shadowMaterial); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .025; group.add(shadow);
    this.scene.add(group);
    return {group, car, person, shadow, key: null, cls: null, target: new THREE.Vector3(), lastSeen: -100, seen: false};
  }
  validDetections() { return cameraDetections(this.g.sensor?.data,this.g.time||0,this.g.inCar); }
  updateRoad() {
    const g=this.g,s=g.sensor?.data,fresh=sensorFresh(s,g.time||0,g.inCar);
    if(!fresh){this.roadMesh.visible=this.roadPaint.visible=false;this.lastRoadFrame=-1;return;}
    if(this.lastRoadFrame===s.frames)return;
    this.lastRoadFrame=s.frames;
    const samples=cameraRoad(s,g.time,g.inCar),positions=this.roadGeometry.attributes.position;
    samples.forEach((p,i)=>positions.array.set([p.left,.012,-p.distance,p.right,.012,-p.distance],i*6));
    this.roadGeometry.setDrawRange(0,Math.max(0,samples.length-1)*6);positions.needsUpdate=true;this.roadMesh.visible=samples.length>1;
    const paint=cameraRoadPaint(g.sensor,g.vehicle,g.time,g.inCar),dots=this.paintGeometry.attributes.position;
    paint.forEach((p,i)=>dots.array.set([p.lateral,.03,-p.distance],i*3));this.paintGeometry.setDrawRange(0,paint.length);dots.needsUpdate=true;this.roadPaint.visible=paint.length>0;
  }
  updateDetections() {
    const s = this.g.sensor?.data, now = this.g.time || 0;
    this.detections = this.validDetections();
    if (!s || !this.detections.length) {
      this.slots.forEach(slot => { slot.group.visible = false; slot.key = null; });
      this.lastSensorFrame = s?.frames ?? -1;
      return;
    }
    if (s.frames === this.lastSensorFrame) return;
    this.lastSensorFrame = s.frames;
    this.slots.forEach(slot => slot.seen = false);
    for (const d of this.detections) {
      const key = d.id === undefined ? null : `${d.cls}:${d.id}`;
      let slot = key === null ? null : this.slots.find(v => v.key === key && !v.seen);
      if (!slot) slot = this.slots.filter(v => !v.seen && v.cls === d.cls && now - v.lastSeen < .6)
        .sort((a, b) => a.target.distanceToSquared(new THREE.Vector3(d.lateral, 0, -d.distance)) - b.target.distanceToSquared(new THREE.Vector3(d.lateral, 0, -d.distance)))[0];
      if (slot && Math.hypot(slot.target.x - d.lateral, slot.target.z + d.distance) > 10) slot = null;
      if (!slot) slot = this.slots.find(v => !v.seen && (!v.group.visible || now - v.lastSeen > .25));
      if (!slot) slot = this.slots.find(v => !v.seen);
      if (!slot) continue;
      const fresh = !slot.group.visible || slot.cls !== d.cls || now - slot.lastSeen > .6;
      slot.target.set(d.lateral, 0, -d.distance);
      if (fresh) slot.group.position.copy(slot.target);
      slot.group.visible = true; slot.key = key; slot.cls = d.cls; slot.seen = true; slot.lastSeen = now;
      slot.car.root.visible = d.cls === 3; slot.person.visible = d.cls === 4;
      slot.shadow.scale.set(d.cls === 4 ? .32 : .9, d.cls === 4 ? .32 : .9, 1);
      slot.car.root.scale.set(clamp((d.width || 1.9) / 1.9, .85, 1.4), 1, clamp((d.length || 4.8) / 4.8, .8, 1.5));
    }
    // Missed/occluded targets disappear after a brief grace period, never inferred
    // from world entities. Every visible target started as real camera pixels.
    this.slots.forEach(slot => { if (!slot.seen && now - slot.lastSeen > .3) { slot.group.visible = false; slot.key = null; } });
  }
  updateRoute() {
    const g = this.g, v = g.vehicle;
    if (!this.ribbon || !v) return;
    const nodes = [new THREE.Vector3(0, .06, 1.2)];
    let distance = 0;
    let last = v.pos;
    const routeView=activeRouteView(g);
    const telemetry=routeView.kind!=='taxi'&&g.autopilot&&g.pilotTelemetry?.path?.length;
    const plannedPath=telemetry?g.pilotTelemetry.path:routeView.points,start=telemetry?0:routeView.index;
    if ((routeView.destination || g.autopilot) && plannedPath.length) for (let i=start;i<plannedPath.length;i++) {
      const p=plannedPath[i];
      const segment = Math.hypot(p.x - last.x, p.z - last.z);
      const t = Math.min(1, Math.max(0, 78 - distance) / Math.max(segment, .001));
      const dx = last.x + (p.x - last.x) * t - v.pos.x, dz = last.z + (p.z - last.z) * t - v.pos.z;
      nodes.push(new THREE.Vector3(dx * Math.cos(v.yaw) - dz * Math.sin(v.yaw), .06, dx * Math.sin(v.yaw) + dz * Math.cos(v.yaw)));
      distance += segment; last = p;
      if (distance >= 78) break;
    }
    const planned = nodes.length > 1;
    this.ribbon.visible = this.routeEdge.visible = planned && g.inCar;
    if (!planned) return;
    const curve = new THREE.CatmullRomCurve3(nodes, false, 'centripetal');
    const positions = this.ribbonGeometry.attributes.position.array, edge = this.edgeGeometry.attributes.position.array;
    for (let i = 0; i <= 48; i++) {
      const p = curve.getPoint(i / 48), tangent = curve.getTangent(i / 48);
      const n = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(1.35);
      positions.set([p.x + n.x, p.y, p.z + n.z, p.x - n.x, p.y, p.z - n.z], i * 6);
      edge.set([p.x, p.y + .005, p.z], i * 3);
    }
    this.ribbonGeometry.attributes.position.needsUpdate = true;
    this.edgeGeometry.attributes.position.needsUpdate = true;
    this.routeMaterial.opacity = g.autopilot ? .34 : .16;
  }
  applyProfile(vehicle) {
    const profile=cockpitProfile(vehicle.model);
    if(this.profile?.id===profile.id)return;
    this.profile=profile;this.panel.dataset.vehicle=profile.id;this.panel.dataset.layout=profile.layout;
    this.panel.style.setProperty('--vehicle-accent',profile.accent);
    this.panel.setAttribute('aria-label',profile.name);
    this.launcher.title=profile.name+' · U';
    this.nodes['vc-brand'].querySelector('strong').textContent=profile.name;
    this.nodes['vc-volt'].textContent=profile.emblem;
    this.nodes['vc-pilot'].querySelector('span').textContent=profile.pilot;
    this.nodes['vc-pilot'].setAttribute('aria-label','切换'+profile.pilot);
    this.updateView();
    this.vehicleDisplay.width=profile.display==='semi'?2400:profile.display==='roadster'?512:768;
    this.vehicleDisplay.height=profile.display==='semi'?760:profile.display==='g9'?320:profile.display==='roadster'?352:400;
    this.vehicleDisplay.setAttribute('aria-label',profile.display==='g9'?'G9 实时独立导航':profile.display==='roadster'?'Roadster 实时车辆状态':profile.name+'实时车辆状态');
  }
  updateHUD() {
    const g = this.g, v = g.vehicle, n = this.nodes, s = g.sensor?.data;
    if (!v) return;
    this.applyProfile(v);
    n['vc-model'].textContent = v.model.trim || v.model.name;
    n['vc-clock'].textContent = g.clockString?.() || '';
    n['vc-speed'].textContent = String(g.inCar ? Math.round(Math.abs(v.speed) * 3.6) : 0);
    const gear = vehicleGear(v);
    if (gear !== this.displayGear) {
      n['vc-gear'].innerHTML = ['P', 'R', 'N', 'D'].map(k => `<span${k === gear ? ' class="selected"' : ''}>${k}</span>`).join('');
      this.displayGear = gear;
    }
    n['vc-energy'].querySelector('span').textContent = `${Math.round(v.battery)}%`;
    n['vc-range'].textContent = `${Math.round(v.model.range * v.battery / 100)} km`;
    n['vc-wheel'].classList.toggle('engaged', !!g.autopilot);
    n['vc-wheel'].style.transform = `rotate(${-v.steer * 105}deg)`;
    n['vc-pilot'].classList.toggle('engaged', !!g.autopilot);
    n['vc-pilot'].setAttribute('aria-pressed', String(!!g.autopilot));
    const sensorPanel=document.getElementById('sensor-panel'),cameraOpen=!!sensorPanel&&!sensorPanel.hidden;
    n['vc-camera'].classList.toggle('selected',cameraOpen);
    n['vc-camera'].setAttribute('aria-pressed',String(cameraOpen));
    const stale = !sensorFresh(s,g.time||0,g.inCar);
    const detections = this.validDetections();
    const vehicles = detections.filter(d => d.cls === 3).length, people = detections.filter(d => d.cls === 4).length;
    n['vc-count'].textContent = `${vehicles} 辆 · ${people} 人`;
    n['vc-scene-state'].textContent = stale ? (g.inCar ? '等待车载摄像头' : '车辆已停放') : g.paused ? '驾驶画面已暂停' : g.autopilot ? 'Pilot · ' + (g.pilotStatus || '视觉导航') : '语义摄像头 · 实时感知';
    n['vc-perception-dot'].classList.toggle('live', !stale && !g.paused);
    n['vc-signal'].querySelector('b').textContent = stale ? '—' : `${Math.round(clamp(s.confidence||0, 0, 1) * 100)}%`;
    const routeView=activeRouteView(g);
    n['vc-destination'].textContent = routeView.kind==='taxi'?routeView.label:g.destination?.name || (g.autopilot?'沿路巡航':'自由驾驶');
    if(routeView.kind==='taxi'){const length=routeView.remaining;n['vc-distance'].textContent=`${length>999?(length/1000).toFixed(1)+' km':Math.round(length)+' m'} · ${g.robotaxi.driver?.reason??'接送路线'}`;}else if (g.destination) {
      let length = 0, p = v.pos;
      for (const point of (g.route || []).slice(g.routeIndex || 0)) { length += Math.hypot(point.x - p.x, point.z - p.z); p = point; }
      if (!length) length = Math.hypot(g.destination.x - v.pos.x, g.destination.z - v.pos.z);
      n['vc-distance'].textContent = `${length > 999 ? (length / 1000).toFixed(1) + ' km' : Math.round(length) + ' m'} · ${g.autopilot && Number.isFinite(g.pilotTelemetry?.targetSpeed) ? '目标 ' + Math.round(g.pilotTelemetry.targetSpeed * 3.6) + ' km/h' : g.autopilot ? '辅助驾驶中' : '路线已规划'}`;
    } else n['vc-distance'].textContent = g.autopilot?'目标 '+Math.round((g.pilotTelemetry?.targetSpeed??0)*3.6)+' / 上限 '+(g.assistSettings?.maxSpeedKmh??100)+' km/h · 跟车 '+(FOLLOW_GAP_PRESETS[g.assistSettings?.followGap]?.label??'中'):'无需导航也可启动巡航';
    updateAssistStatus(n['vc-warning'],g,{cockpit:true});
    n['vc-offline'].hidden = g.inCar;
    this.panel.classList.toggle('vc-parked', !g.inCar);
    const context=this.view==='vehicle'&&!this.usesScene?this.vehicleDisplay.getContext('2d'):null;
    if(context&&this.profile.display==='semi'){const state=semiDisplayState(v,{autopilot:g.inCar&&g.autopilot,cargoStatus:g.cargoStatus});context.save();paintSemiDisplay(context,'left',state);context.translate(1200,0);paintSemiDisplay(context,'right',state);context.restore();}
    if(context&&this.profile.display==='vehicle')paintVehicleInfotainment(context,infotainmentState(v,g));
    if(context&&this.profile.display==='g9')paintG9Navigation(context,g9NavigationState(v,g));
    if(this.view==='vehicle'){
      n['vc-scene-state'].textContent=this.profile.display==='g9'?'G9 实时导航 · 地图数据':this.profile.display==='roadster'?'真实车型资产 · 车辆遥测':'车辆实时数据 · 原创车机';
      n['vc-perception-dot'].classList.remove('live');
      if(this.profile.display==='roadster'){
        const state=roadsterDisplayState(v,{autopilot:g.inCar&&g.autopilot});
        n['vc-drive-state'].textContent=state.autopilot?'辅助驾驶':state.air?'飞行':'手动';
        n['vc-aero-state'].textContent=state.airBrake?'气动制动':({road:'道路',highDownforce:'高下压力',lowDrag:'低风阻'}[state.aeroMode]??'道路');
        n['vc-body-state'].textContent=state.condition+'%';
      }
    }
    if(this.failed&&this.usesScene)n['vc-scene-state'].textContent='三维显示不可用 · 可打开真实摄像头';

  }
  update(dt = 1 / 60) {
    if (!this._open) return;
    const step = clamp(dt, 0, .1), interval = 1 / 30;
    this.frameElapsed += step; this.motionElapsed += step; this.hudElapsed += step;
    if (this.hudElapsed >= .12) { this.updateHUD(); this.hudElapsed %= .12; }
    if (!this.usesScene || !this.renderer || this.failed || this.frameElapsed + .0001 < interval) return;
    // Keep the display cadence across 60/90/120 Hz and rounded RAF timestamps.
    // Animation uses only time since the actual last render, never phase debt.
    const elapsed = this.motionElapsed; this.motionElapsed = 0;
    this.frameElapsed -= interval * Math.max(1, Math.floor((this.frameElapsed + .0001) / interval));
    this.refreshEgo(); if(this.view==='perception'){this.updateDetections();this.updateRoad();this.updateRoute();}
    const v = this.g.vehicle;
    if (this.ego && v) {
      syncCockpitEgo(this.ego,v);
    }
    this.slots.forEach(slot => { if (slot.group.visible) slot.group.position.lerp(slot.target, 1 - Math.exp(-elapsed * 14)); });
    this.renderer.render(this.scene, this.camera);
  }
  resize() {
    this.drag?.reflow();
    if (!this.renderer || !this._open) return;
    const rect = this.nodes['vc-webgl'].getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, this.g.performanceProfile?.pixelRatio??1.5));
    this.renderer.setSize(Math.round(rect.width), Math.round(rect.height), false);
    this.camera.aspect = rect.width / rect.height;
    this.camera.fov = this.camera.aspect < 1.05 ? 50 : 38;
    this.camera.updateProjectionMatrix();
    this.frameElapsed = 1 / 30;
  }
}
