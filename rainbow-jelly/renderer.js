import * as THREE from './vendor/three.module.min.js';
import { buildJellySolid } from './solid-geometry.js';

const clamp = THREE.MathUtils.clamp;
const white = new THREE.Color('#ffffff');

// Physical transmission renders the backdrop through a closed volume. No fog,
// particle systems, sprite clouds, noise textures, or internal bubbles are used.
export class JellyRenderer {
  constructor(canvas, { onError = () => {} } = {}) {
    this.canvas = canvas;
    this.onError = onError;
    this.meshes = new Map();
    this.pinMeshes = [];
    this.poolMeshes = [];
    this.width = this.height = 1;
    this.floor = 0;
    this.yaw = .2;
    this.pitch = .18;
    this.available = false;
    this.raycaster = new THREE.Raycaster();
    this.workPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    this.point = new THREE.Vector3();
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.12;
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color('#f2f0f7');
      this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 4000);
      this.setupEnvironment();
      this.setupStage();
      this.setupFlame();
      const overlay = document.querySelector('#jelly-overlay');
      this.overlay = overlay;
      this.overlayContext = overlay.getContext('2d');
      canvas.addEventListener('webglcontextlost', event => {
        event.preventDefault();
        this.available = false;
        onError('3D 画面暂时中断了，点击重试恢复。');
      });
      this.available = true;
    } catch (error) {
      onError('当前浏览器未能启动 3D。请开启硬件加速，或换用支持 WebGL 的浏览器。');
      console.error('Jelly Lab 3D initialization failed:', error);
    }
  }

  setupEnvironment() {
    const room = new THREE.Scene();
    room.background = new THREE.Color('#c6c6d3');
    const box = new THREE.Mesh(new THREE.BoxGeometry(1000, 1000, 1000), new THREE.MeshBasicMaterial({ color: '#9d9cab', side: THREE.BackSide }));
    room.add(box);
    const panel = (w, h, x, y, z, brightness) => {
      const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1).multiplyScalar(brightness), side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
      mesh.position.set(x, y, z); mesh.lookAt(0, 0, 0); room.add(mesh);
    };
    panel(180, 400, -330, 150, 230, 4.5);
    panel(80, 360, 340, 40, 200, 3);
    panel(260, 100, 20, 380, -100, 3.5);
    panel(200, 230, 0, 40, -450, 1.4);
    const generator = new THREE.PMREMGenerator(this.renderer);
    this.environment = generator.fromScene(room, .035);
    this.scene.environment = this.environment.texture;
    generator.dispose();
    room.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); });
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#d1c5de', 1.4));
    const key = new THREE.DirectionalLight('#ffffff', 2.8); key.position.set(-300, 600, 700); this.scene.add(key);
    const fill = new THREE.DirectionalLight('#dbe9ff', 1.1); fill.position.set(500, 100, 300); this.scene.add(fill);
  }

  setupStage() {
    const tile = document.createElement('canvas'); tile.width = tile.height = 128;
    const c = tile.getContext('2d');
    c.fillStyle = '#f1eff6'; c.fillRect(0, 0, 128, 128);
    c.strokeStyle = '#e4dfec'; c.lineWidth = 1;
    for (let p = 0; p < 128; p += 32) {
      c.beginPath(); c.moveTo(p + .5, 0); c.lineTo(p + .5, 128); c.stroke();
      c.beginPath(); c.moveTo(0, p + .5); c.lineTo(128, p + .5); c.stroke();
    }
    const texture = new THREE.CanvasTexture(tile);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(12, 12);
    this.gridTexture = texture;
    this.backdrop = new THREE.Mesh(new THREE.PlaneGeometry(2200, 1600), new THREE.MeshBasicMaterial({ map: texture, color: '#ffffff' }));
    this.backdrop.position.z = -155;
    this.scene.add(this.backdrop);
    const floorTexture = texture.clone(); floorTexture.needsUpdate = true;
    this.floorTexture = floorTexture;
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, 2000), new THREE.MeshBasicMaterial({ map: floorTexture, color: '#eeebf3', side: THREE.DoubleSide }));
    this.ground.rotation.x = -Math.PI / 2;
    this.scene.add(this.ground);
    const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 128;
    const shadowContext = shadowCanvas.getContext('2d');
    const shadow = shadowContext.createRadialGradient(64, 64, 5, 64, 64, 64);
    shadow.addColorStop(0, 'rgba(100,77,137,.26)'); shadow.addColorStop(.5, 'rgba(118,94,149,.1)'); shadow.addColorStop(1, 'rgba(118,94,149,0)');
    shadowContext.fillStyle = shadow; shadowContext.fillRect(0, 0, 128, 128);
    this.shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  }

  setupFlame() {
    // One continuous flame surface, with no emitted or suspended particles.
    const geometry = new THREE.SphereGeometry(1, 20, 16);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i), taper = .7 - y * .35;
      positions.setXYZ(i, positions.getX(i) * taper, y, positions.getZ(i) * taper);
    }
    geometry.computeVertexNormals();
    this.flame = new THREE.Group();
    this.flameOuter = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: '#ffaf4b', transparent: true, opacity: .88, depthWrite: false }));
    this.flameOuter.scale.set(13, 27, 10); this.flameOuter.position.y = 22;
    this.flameInner = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: '#fff0aa', depthWrite: false }));
    this.flameInner.scale.set(6, 16, 5); this.flameInner.position.set(0, 11, 8);
    this.flame.add(this.flameOuter, this.flameInner);
    this.flame.visible = false; this.scene.add(this.flame);
    this.flameLight = new THREE.PointLight('#ffac4b', 0, 250, 1.6); this.scene.add(this.flameLight);
  }

  resize(width, height, floor) {
    this.width = width; this.height = height; this.floor = floor;
    if (!this.available) return;
    this.renderer.setSize(width, height, false);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.overlay.width = width * dpr; this.overlay.height = height * dpr;
    this.overlayContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.camera.left = -width / 2; this.camera.right = width / 2;
    this.camera.top = height / 2; this.camera.bottom = -height / 2;
    this.camera.updateProjectionMatrix();
    this.backdrop.position.set(width / 2, height / 2, -155);
    this.ground.position.set(width / 2, height - floor - 2, 250);
    this.updateCamera();
  }

  updateCamera() {
    const cx = this.width * .53, cy = this.height * .5;
    const distance = 1200;
    this.camera.position.set(cx + Math.sin(this.yaw) * Math.cos(this.pitch) * distance, cy + Math.sin(this.pitch) * distance, Math.cos(this.yaw) * Math.cos(this.pitch) * distance);
    this.camera.lookAt(cx, cy, 0);
    this.camera.updateMatrixWorld();
  }

  rotateView(dx, dy) {
    if (!this.available) return;
    this.yaw = clamp(this.yaw + dx * .006, -.9, .9);
    this.pitch = clamp(this.pitch + dy * .005, .03, .55);
    this.updateCamera();
  }

  resetView() {
    this.yaw = .2; this.pitch = .18;
    if (this.available) this.updateCamera();
  }

  screenToWorld({ x, y }) {
    if (!this.available) return { x, y };
    this.raycaster.setFromCamera(new THREE.Vector2(x / this.width * 2 - 1, 1 - y / this.height * 2), this.camera);
    const hit = this.raycaster.ray.intersectPlane(this.workPlane, this.point);
    return hit ? { x: hit.x, y: this.height - hit.y } : { x, y };
  }

  worldToScreen({ x, y }, depth = 0) {
    const p = new THREE.Vector3(x, this.height - y, depth).project(this.camera);
    return { x: (p.x + 1) * this.width / 2, y: (1 - p.y) * this.height / 2 };
  }

  pointAtDepth({ x, y }, depth) {
    const direction = this.camera.getWorldDirection(new THREE.Vector3());
    return new THREE.Vector3(x, this.height - y, 0).addScaledVector(direction, depth / direction.z);
  }

  makeMaterial(depth) {
    return new THREE.MeshPhysicalMaterial({
      color: '#ffffff', vertexColors: true, metalness: 0, roughness: .065,
      transmission: 1, thickness: depth * .6, ior: 1.33,
      attenuationColor: '#f8f4ff', attenuationDistance: 620,
      clearcoat: 1, clearcoatRoughness: .045, envMapIntensity: 1.1,
      transparent: false, opacity: 1, side: THREE.FrontSide,
      emissive: '#ff8936', emissiveIntensity: 0
    });
  }

  buildMesh(body, colors) {
    const depth = body.depth || clamp(Math.sqrt(body.area) * .54, 30, 155);
    const data = buildJellySolid(body.vertices, { depth, roundness: body.roundness ?? .28 });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(data.normals, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(data.uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));
    // Reflect canvas Y into world Y and reverse winding to preserve outward faces.
    const positions = geometry.attributes.position, normals = geometry.attributes.normal;
    for (let i = 0; i < positions.count; i++) { positions.setY(i, -positions.getY(i)); normals.setY(i, -normals.getY(i)); }
    const index = geometry.index.array;
    for (let i = 0; i < index.length; i += 3) { const temp = index[i + 1]; index[i + 1] = index[i + 2]; index[i + 2] = temp; }
    geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(geometry, this.makeMaterial(depth));
    mesh.userData.bodyId = body.id;
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.shadowTexture, transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    this.scene.add(mesh, shadow);
    const entry = { mesh, shadow, depth, vertices: body.vertices, shapeSize: this.shapeSize(body), palette: null };
    this.meshes.set(body.id, entry);
    this.colorMesh(entry, colors);
    return entry;
  }

  shapeSize(body) {
    return body.vertices.reduce((sum, p) => sum + Math.abs(p.x) + Math.abs(p.y), 0);
  }

  colorMesh(entry, colors) {
    const uv = entry.mesh.geometry.attributes.uv;
    const stops = colors.map(color => new THREE.Color(color));
    const attribute = new Float32Array(uv.count * 3);
    for (let i = 0; i < uv.count; i++) {
      const t = clamp((uv.getX(i) * .79 + uv.getY(i) * .43 + 1.08) / 2.16, 0, 1) * (stops.length - 1);
      const n = Math.min(stops.length - 2, Math.floor(t));
      const tint = stops[n].clone().lerp(stops[n + 1], t - n).lerp(white, .53);
      tint.toArray(attribute, i * 3);
    }
    entry.mesh.geometry.setAttribute('color', new THREE.BufferAttribute(attribute, 3));
    entry.palette = colors;
  }

  removeMesh(id) {
    const entry = this.meshes.get(id);
    this.scene.remove(entry.mesh, entry.shadow);
    entry.mesh.geometry.dispose(); entry.mesh.material.dispose();
    entry.shadow.geometry.dispose(); entry.shadow.material.dispose();
    this.meshes.delete(id);
  }

  updatePins(pins) {
    while (this.pinMeshes.length > pins.length) {
      const object = this.pinMeshes.pop(); this.scene.remove(object);
      object.traverse(p => { p.geometry?.dispose(); p.material?.dispose(); });
    }
    while (this.pinMeshes.length < pins.length) {
      const object = new THREE.Group();
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.2, 21, 8), new THREE.MeshStandardMaterial({ color: '#c0bccb', metalness: .75, roughness: .23 }));
      shaft.rotation.x = Math.PI / 2; shaft.position.z = 8;
      const head = new THREE.Mesh(new THREE.SphereGeometry(6.5, 20, 12), new THREE.MeshPhysicalMaterial({ color: '#ab84cf', metalness: .12, roughness: .18, clearcoat: 1 }));
      head.scale.set(1, 1, .62); head.position.z = 20;
      object.add(shaft, head); this.pinMeshes.push(object); this.scene.add(object);
    }
    pins.forEach((pin, i) => {
      const bodyEntry = this.meshes.get(pin.bodyId);
      const z = (bodyEntry?.depth || 80) * .48;
      const headPosition = this.pointAtDepth(pin, z + 20);
      this.pinMeshes[i].position.copy(headPosition); this.pinMeshes[i].position.z -= 20;
    });
  }

  updatePools(puddles) {
    while (this.poolMeshes.length > puddles.length) {
      const mesh = this.poolMeshes.pop(); this.scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose();
    }
    while (this.poolMeshes.length < puddles.length) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 12), new THREE.MeshPhysicalMaterial({ color: '#e4c9f3', roughness: .07, transmission: 1, thickness: 4, ior: 1.33, clearcoat: 1 }));
      this.poolMeshes.push(mesh); this.scene.add(mesh);
    }
    puddles.forEach((pool, i) => {
      const mesh = this.poolMeshes[i]; mesh.position.set(pool.x, this.height - this.floor + 1, 0);
      mesh.scale.set(pool.r, 3.2, pool.r * .65);
      mesh.material.color.set(pool.color).lerp(white, .6);
    });
  }

  drawOverlay(state) {
    const c = this.overlayContext;
    c.clearRect(0, 0, this.width, this.height);
    const line = (a, b, color, dashed = false) => {
      a = this.worldToScreen(a); b = this.worldToScreen(b);
      c.save(); c.setLineDash(dashed ? [5, 6] : []); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.strokeStyle = color; c.lineWidth = 1.6; c.stroke(); c.restore();
    };
    if (state.gesture) line(state.gesture.start, state.gesture.end, '#9c7bb9', true);
    state.cuts.forEach(cut => line(cut.start, cut.end, `rgba(255,255,255,${cut.life * 2})`));
    if (state.pointer.inside && state.tool === 'fire') {
      const p = this.worldToScreen(state.pointer, 0); c.beginPath(); c.arc(p.x, p.y, 17, 0, Math.PI * 2);
      c.strokeStyle = '#dca17899'; c.lineWidth = 1; c.stroke();
    }
  }

  render(state) {
    if (!this.available) return;
    const alive = new Set(state.bodies.map(b => b.id));
    for (const id of this.meshes.keys()) if (!alive.has(id)) this.removeMesh(id);
    for (const body of state.bodies) {
      let entry = this.meshes.get(body.id);
      if (entry && Math.abs(entry.shapeSize - this.shapeSize(body)) > .1) { this.removeMesh(body.id); entry = null; }
      entry ||= this.buildMesh(body, state.palettes[state.palette]);
      if (entry.palette !== state.palettes[state.palette]) this.colorMesh(entry, state.palettes[state.palette]);
      entry.mesh.position.set(body.x, this.height - body.y, 0);
      entry.mesh.rotation.z = -body.angle;
      entry.mesh.scale.set(body.sx, body.sy, Math.max(.16, 1 - body.melt * .65 + body.wobble * .2));
      entry.mesh.material.emissiveIntensity = body.heat * .045;
      entry.mesh.material.roughness = .065 + body.heat * .025;
      const radius = Math.sqrt(body.area) * .65;
      entry.shadow.position.set(body.x, this.height - this.floor + .3, 0);
      entry.shadow.scale.set(radius * 2.6, entry.depth * 2, 1);
      const bottom = Math.max(...body.vertices.map(p => p.y)) * body.sy;
      entry.shadow.material.opacity = clamp(1 - (this.floor - body.y - bottom) / 500, .18, 1);
    }
    this.updatePins(state.pins); this.updatePools(state.puddles);
    this.flame.visible = state.burning;
    if (state.burning) {
      const phase = Math.sin(state.time * 12) * .06;
      this.flame.position.copy(this.pointAtDepth(state.pointer, 110)); this.flame.position.y -= 15;
      this.flame.scale.set(1 - phase, 1 + phase, 1);
      this.flameLight.position.copy(this.flame.position); this.flameLight.intensity = 35;
    } else this.flameLight.intensity = 0;
    this.renderer.render(this.scene, this.camera);
    this.drawOverlay(state);
  }
}
