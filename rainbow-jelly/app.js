import { polygonArea, centroid, pointInPolygon, splitPolygon } from './geometry.js';
import { JellyRenderer } from './renderer.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const canvas = $('#jelly-canvas');
const renderer = new JellyRenderer(canvas, { onError(message) {
  const error = $('#render-error'); error.hidden = false; $('#render-error-message').textContent = message;
} });
const area = $('#canvas-area');
const palettes = {
  rainbow: ['#f18fae', '#f3ad8b', '#f1d586', '#acd599', '#80c9c7', '#9cafe1', '#b296dd'],
  berry: ['#ed9fc4', '#e7a2da', '#ca9de0', '#a997db'],
  ocean: ['#b1e6c6', '#91dacb', '#83c8da', '#8caee0'],
  peach: ['#f4d593', '#f5bd92', '#f1a298', '#ee9bb5']
};
const paletteNames = { rainbow: '彩虹糖', berry: '莓果梦', ocean: '海盐汽水', peach: '蜜桃乌龙' };
const hints = { grab: '按住果冻，拖动试试', cut: '划过整块果冻，松手切开', pin: '点击钉住，再点钉子松开', fire: '在果冻上长按，让烦恼融化', view: '拖动转动视角，空格恢复正面' };
const icons = { grab: 'hand', cut: 'cut', pin: 'pin', fire: 'fire', view: 'view' };
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let width = 0, height = 0, floor = 0, size = 150, tool = 'grab', shape = 'blob', palette = 'rainbow';
let bodies = [], puddles = [], pins = [], cuts = [], bodyId = 0;
let elasticity = .75, gravity = true, sound = false, audioContext, toastTimer, last = 0, time = 0, started = false;
let pointer = { x: 0, y: 0, down: false, inside: false, id: null }, gesture = null, drag = null, viewDrag = null;
let keyboardFire = false, lastSound = 0;

function notify(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function tone(kind = 'pop') {
  if (!sound) return;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    oscillator.type = kind === 'fire' ? 'triangle' : 'sine';
    const frequency = { pop: 430, cut: 760, pin: 1000, fire: 150 }[kind];
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * .3, now + .16);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(.07, now + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, now + .2);
    oscillator.connect(gain); gain.connect(audioContext.destination);
    oscillator.start(); oscillator.stop(now + .21);
  } catch { sound = false; updateSound(); }
}

function updateSound() {
  $('#sound').setAttribute('aria-pressed', String(sound));
  $('#sound').innerHTML = `<svg><use href="#i-${sound ? 'sound' : 'mute'}"/></svg><span>音效${sound ? '开启' : '关闭'}</span>`;
}

function makeBody(points, options = {}) {
  const center = centroid(points);
  const body = {
    id: ++bodyId, x: center.x, y: center.y, vx: 0, vy: 0, angle: 0, av: 0,
    vertices: points.map(p => ({ x: p.x - center.x, y: p.y - center.y, u: p.u, v: p.v })),
    wobble: .02, wobbleV: 0, heat: 0, melt: 0, phase: Math.random() * 6.28,
    sx: 1, sy: 1, ...options
  };
  body.area = polygonArea(body.vertices);
  body.depth ??= Math.max(30, Math.min(155, Math.sqrt(body.area) * .54));
  return body;
}

function reset(message = true) {
  pointer.down = false; keyboardFire = false; gesture = drag = null;
  pins = []; puddles = []; cuts = [];
  viewDrag = null; renderer.resetView();
  const x = width < 550 ? width * .52 : width * .56;
  const y = floor - size * .82 - 9;
  const points = [];
  for (let i = 0; i < 80; i++) {
    const a = i / 80 * Math.PI * 2;
    const cos = Math.cos(a), sin = Math.sin(a);
    const exponent = shape === 'square' ? .42 : shape === 'round' ? 1 : .76;
    const rx = size * (shape === 'round' ? .94 : 1.09);
    const ry = size * (shape === 'square' ? .83 : shape === 'round' ? .94 : .86);
    const localX = Math.sign(cos) * Math.abs(cos) ** exponent * rx;
    const localY = Math.sign(sin) * Math.abs(sin) ** exponent * ry;
    points.push({ x: x + localX, y: y + localY, u: localX / size, v: localY / size });
  }
  bodies = [makeBody(points, { vy: -20, wobble: .045, depth: size * (shape === 'round' ? 1.88 : shape === 'square' ? 1.65 : 1.3), roundness: shape === 'round' ? 1 : .28 })];
  updateCount();
  if (message) { notify('新鲜出炉，快乐继续。'); tone(); }
}

function resize() {
  const rect = area.getBoundingClientRect();
  const oldWidth = width, oldFloor = floor;
  width = rect.width; height = rect.height;
  floor = width < 550 ? height - 125 : height - 88;
  size = Math.min(153, width * (width < 550 ? .29 : .205), height * .29);
  renderer.resize(width, height, floor);
  if (!oldWidth || !bodies.length) reset(false);
  else {
    const scale = Math.min(1, width / oldWidth);
    bodies.forEach(b => {
      b.x *= width / oldWidth; b.y += floor - oldFloor;
      if (scale < 1) { b.vertices.forEach(p => { p.x *= scale; p.y *= scale; }); b.depth *= scale; b.area = polygonArea(b.vertices); }
    });
    pins.forEach(p => { p.x *= width / oldWidth; p.y += floor - oldFloor; p.local.x *= scale; p.local.y *= scale; });
    puddles.forEach(p => { p.x *= width / oldWidth; p.y += floor - oldFloor; });
  }
}

function worldPoint(body, point) {
  const x = point.x * body.sx, y = point.y * body.sy;
  const c = Math.cos(body.angle), s = Math.sin(body.angle);
  return { x: body.x + x * c - y * s, y: body.y + x * s + y * c, u: point.u, v: point.v };
}
function localPoint(body, point) {
  const x = point.x - body.x, y = point.y - body.y;
  const c = Math.cos(body.angle), s = Math.sin(body.angle);
  return { x: (x * c + y * s) / body.sx, y: (-x * s + y * c) / body.sy };
}
function worldVertices(body) { return body.vertices.map(p => worldPoint(body, p)); }
function hitTest(point) { return [...bodies].reverse().find(body => pointInPolygon(localPoint(body, point), body.vertices)); }
function updateCount() { $('#piece-count').textContent = bodies.length; }

function selectTool(value) {
  if (!hints[value]) return;
  pointer.down = false; drag = gesture = viewDrag = null; keyboardFire = false;
  tool = value; canvas.dataset.tool = value;
  $$('.tool').forEach(b => { const active = b.dataset.tool === tool; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
  $('#canvas-hint').innerHTML = `<svg><use href="#i-${icons[tool]}"/></svg>${hints[tool]}`;
}

function cutBodies(start, end) {
  if (bodies.length >= 30) { notify('快乐已经很多啦，来块新果冻吧。'); return; }
  const length = Math.hypot(end.x - start.x, end.y - start.y);
  if (length < 12) return;
  const nx = -(end.y - start.y) / length, ny = (end.x - start.x) / length;
  let sliced = 0;
  bodies = bodies.flatMap(body => {
    if (body.area < 800 || bodies.length + sliced >= 30) return [body];
    const result = splitPolygon(worldVertices(body), start, end, 170);
    if (!result) return [body];
    sliced++;
    const children = result.map((points, i) => makeBody(points, {
      vx: body.vx + nx * (i ? -1 : 1) * 75,
      vy: body.vy + ny * (i ? -1 : 1) * 60 - 28,
      av: (i ? -.17 : .17), wobble: .055, heat: body.heat, melt: body.melt, depth: body.depth, roundness: body.roundness
    }));
    pins.filter(pin => pin.bodyId === body.id).forEach(pin => {
      const child = children.find(b => pointInPolygon({ x: pin.x - b.x, y: pin.y - b.y }, b.vertices));
      if (child) { pin.bodyId = child.id; pin.local = { x: pin.x - child.x, y: pin.y - child.y }; }
      else pin.remove = true;
    });
    return children;
  });
  pins = pins.filter(p => !p.remove);
  if (sliced) {
    cuts.push({ start, end, life: .4 });
    tone('cut'); updateCount(); notify(['快乐，分你一半。', '咔嚓！又多了一份快乐。', '每一小块，都很 Q 弹。'][Math.floor(Math.random() * 3)]);
  } else notify('从果冻的一侧划到另一侧，就能切开。');
}

function pinAt(point) {
  const existing = pins.find(p => Math.hypot(p.x - point.x, p.y - point.y) < 20);
  if (existing) { pins = pins.filter(p => p !== existing); tone('pin'); notify('松开啦，让快乐自由落体。'); return; }
  const body = hitTest(point);
  if (!body) return;
  if (pins.filter(p => p.bodyId === body.id).length >= 2) { notify('已经牢牢钉住啦，点击钉子可以松开。'); return; }
  pins.push({ x: point.x, y: point.y, bodyId: body.id, local: localPoint(body, point) });
  body.wobbleV += .5; tone('pin'); notify('钉住这一刻。再点钉子，就能松开。');
}

function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  return renderer.screenToWorld({ x: event.clientX - rect.left, y: event.clientY - rect.top });
}
function engage() { started = true; $('#canvas-note').style.opacity = '0'; }
canvas.addEventListener('pointerdown', event => {
  if (pointer.down || event.button > 0) return;
  event.preventDefault(); canvas.focus({ preventScroll: true }); canvas.setPointerCapture(event.pointerId);
  Object.assign(pointer, pointerPosition(event), { down: true, inside: true, id: event.pointerId });
  engage();
  if (tool === 'view') {
    viewDrag = { x: event.clientX, y: event.clientY };
    canvas.style.cursor = 'grabbing';
  } else if (tool === 'grab') {
    const body = hitTest(pointer);
    if (body) { drag = { id: body.id, local: localPoint(body, pointer) }; body.wobbleV += .8; tone(); canvas.style.cursor = 'grabbing'; }
  } else if (tool === 'cut') gesture = { start: { x: pointer.x, y: pointer.y }, end: { x: pointer.x, y: pointer.y } };
  else if (tool === 'pin') pinAt(pointer);
});
canvas.addEventListener('pointermove', event => {
  if (pointer.down && event.pointerId !== pointer.id) return;
  if (viewDrag && pointer.down && tool === 'view') {
    renderer.rotateView(event.clientX - viewDrag.x, event.clientY - viewDrag.y);
    viewDrag = { x: event.clientX, y: event.clientY };
  }
  Object.assign(pointer, pointerPosition(event), { inside: true });
  if (gesture) gesture.end = { x: pointer.x, y: pointer.y };
});
function endPointer(event, cancel = false) {
  if (event.pointerId !== pointer.id) return;
  if (!cancel && gesture) cutBodies(gesture.start, pointerPosition(event));
  if (drag) tone();
  pointer.down = false; gesture = null; drag = viewDrag = null; pointer.id = null; canvas.style.cursor = '';
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
}
canvas.addEventListener('pointerup', event => endPointer(event));
canvas.addEventListener('pointercancel', event => endPointer(event, true));
canvas.addEventListener('lostpointercapture', () => { pointer.down = false; gesture = drag = viewDrag = null; canvas.style.cursor = ''; });
canvas.addEventListener('pointerleave', () => { if (!pointer.down) pointer.inside = false; });
window.addEventListener('blur', () => { pointer.down = false; keyboardFire = false; gesture = drag = viewDrag = null; canvas.style.cursor = ''; });

function heatAt(point, dt) {
  const body = hitTest(point) || [...bodies].reverse().find(candidate => {
    const points = worldVertices(candidate);
    return points.some((a, i) => {
      const b = points[(i + 1) % points.length], dx = b.x - a.x, dy = b.y - a.y;
      const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / Math.max(.001, dx * dx + dy * dy)));
      return Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy) < 22;
    });
  });
  if (!body) return;
  body.heat = Math.min(1, body.heat + dt * .55);
  body.melt = Math.min(.95, body.melt + dt * (.035 + body.heat * .085));
  body.wobbleV += (Math.random() - .5) * dt * 2;
  if (time - lastSound > .22) { tone('fire'); lastSound = time; }
}

function resolveCollisions() {
  const anchoredIds = new Set(pins.map(p => p.bodyId));
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i], b = bodies[j];
      const pa = worldVertices(a), pb = worldVertices(b);
      const bounds = points => ({ left: Math.min(...points.map(p => p.x)), right: Math.max(...points.map(p => p.x)), top: Math.min(...points.map(p => p.y)), bottom: Math.max(...points.map(p => p.y)) });
      const ba = bounds(pa), bb = bounds(pb);
      if (ba.right <= bb.left || bb.right <= ba.left || ba.bottom <= bb.top || bb.bottom <= ba.top) continue;
      let depth = Infinity, normal = null, separated = false;
      for (const polygon of [pa, pb]) {
        for (let k = 0; k < polygon.length; k++) {
          const p = polygon[k], q = polygon[(k + 1) % polygon.length];
          const length = Math.hypot(q.x - p.x, q.y - p.y);
          if (length < .001) continue;
          const axis = { x: -(q.y - p.y) / length, y: (q.x - p.x) / length };
          const project = points => points.map(v => v.x * axis.x + v.y * axis.y);
          const aa = project(pa), ab = project(pb);
          const overlap = Math.min(Math.max(...aa), Math.max(...ab)) - Math.max(Math.min(...aa), Math.min(...ab));
          if (overlap <= 0) { separated = true; break; }
          if (overlap < depth) { depth = overlap; normal = axis; }
        }
        if (separated) break;
      }
      if (separated || !normal) continue;
      if ((b.x - a.x) * normal.x + (b.y - a.y) * normal.y < 0) { normal.x *= -1; normal.y *= -1; }
      const massA = anchoredIds.has(a.id) || drag?.id === a.id ? 0 : 1 / a.area;
      const massB = anchoredIds.has(b.id) || drag?.id === b.id ? 0 : 1 / b.area;
      const total = massA + massB;
      if (!total) continue;
      const correction = Math.max(0, depth - .35) * .8;
      a.x -= normal.x * correction * massA / total; a.y -= normal.y * correction * massA / total;
      b.x += normal.x * correction * massB / total; b.y += normal.y * correction * massB / total;
      const approach = (b.vx - a.vx) * normal.x + (b.vy - a.vy) * normal.y;
      if (approach < 0) {
        const impulse = -(1 + elasticity * .25) * approach / total;
        a.vx -= impulse * massA * normal.x; a.vy -= impulse * massA * normal.y;
        b.vx += impulse * massB * normal.x; b.vy += impulse * massB * normal.y;
        if (approach < -55) { a.wobbleV += .35; b.wobbleV += .35; }
      }
    }
  }
}

function update(dt) {
  if ((pointer.down && tool === 'fire') || keyboardFire) {
    if (keyboardFire && bodies[0]) { pointer.x = bodies[0].x; pointer.y = bodies[0].y; }
    heatAt(pointer, dt);
  }
  for (const body of bodies) {
    const anchored = pins.filter(p => p.bodyId === body.id);
    const heatSquash = body.melt * .62;
    body.wobbleV += (-body.wobble * (90 + elasticity * 150) - body.wobbleV * (12 - elasticity * 7)) * dt;
    body.wobble += body.wobbleV * dt;
    body.wobble = Math.max(-.23, Math.min(.23, body.wobble));
    const breathe = reducedMotion ? 0 : Math.sin(time * 2 + body.phase) * .009;
    body.sx = 1 + body.wobble + heatSquash * .65 + breathe;
    body.sy = Math.max(.12, 1 - body.wobble - heatSquash - breathe);
    if (gravity) body.vy += 590 * dt;
    else if (!reducedMotion) body.vy += Math.sin(time + body.phase) * 7 * dt;
    if (drag && drag.id === body.id) {
      const grabbed = worldPoint(body, drag.local);
      body.vx += (pointer.x - grabbed.x) * 74 * dt;
      body.vy += (pointer.y - grabbed.y) * 74 * dt;
      body.vx *= Math.exp(-10 * dt); body.vy *= Math.exp(-10 * dt);
      body.wobbleV += Math.min(1.1, Math.hypot(body.vx, body.vy) / 500) * dt * 3;
      body.av += Math.max(-.6, Math.min(.6, (pointer.x - body.x) * .003)) * dt;
    }
    body.vx *= Math.exp(-.7 * dt); body.vy *= Math.exp(-.4 * dt);
    body.x += Math.max(-950, Math.min(950, body.vx)) * dt;
    body.y += Math.max(-950, Math.min(950, body.vy)) * dt;
    body.angle += body.av * dt; body.av *= Math.exp(-2 * dt);
    const vertices = worldVertices(body);
    const maxY = Math.max(...vertices.map(p => p.y));
    const minY = Math.min(...vertices.map(p => p.y));
    const minX = Math.min(...vertices.map(p => p.x));
    const maxX = Math.max(...vertices.map(p => p.x));
    if (anchored.length === 0) {
      if (maxY > floor) {
        const velocity = body.vy;
        body.y -= maxY - floor;
        body.vy = -Math.abs(body.vy) * (.1 + elasticity * .37) * (1 - body.melt);
        body.vx *= .96; body.av *= .93;
        if (velocity > 70) { body.wobbleV += Math.min(2.2, velocity / 230); if (velocity > 170) tone(); }
        if (Math.abs(body.vy) < 7) body.vy = 0;
      }
      if (minY < 56) { body.y += 56 - minY; body.vy = Math.abs(body.vy) * .35; }
      if (minX < 18) { body.x += 18 - minX; body.vx = Math.abs(body.vx) * .55; body.wobbleV -= .5; }
      if (maxX > width - 18) { body.x -= maxX - width + 18; body.vx = -Math.abs(body.vx) * .55; body.wobbleV -= .5; }
    } else {
      if (anchored.length > 1) {
        const a = anchored[0], b = anchored[1];
        const localDistance = Math.hypot((b.local.x - a.local.x) * body.sx, (b.local.y - a.local.y) * body.sy);
        const adjustment = Math.hypot(b.x - a.x, b.y - a.y) / Math.max(.001, localDistance);
        body.sx *= adjustment; body.sy *= adjustment;
        body.angle = Math.atan2(b.y - a.y, b.x - a.x) - Math.atan2((b.local.y - a.local.y) * body.sy, (b.local.x - a.local.x) * body.sx);
      } else if (!drag) body.av += Math.sin(body.angle) * -dt * 2;
      const anchor = anchored[0], current = worldPoint(body, anchor.local);
      body.x += anchor.x - current.x; body.y += anchor.y - current.y;
      body.vx = 0; body.vy = 0;
    }
    // Stored heat keeps spreading as the jelly slumps away from the flame.
    if (body.heat > .12) body.melt = Math.min(.95, body.melt + dt * body.heat * .045);
    body.heat = Math.max(0, body.heat - dt * .04);
    if (body.melt > .86) {
      const index = bodies.indexOf(body);
      puddles.push({ x: body.x, y: floor + 4, r: Math.min(130, Math.sqrt(body.area) * .46), color: palettes[palette][2], alpha: .55 });
      bodies.splice(index, 1); pins = pins.filter(p => p.bodyId !== body.id); updateCount();
      if (!bodies.length) notify('烦恼融化了。再来一块新果冻吧。');
    }
  }
  resolveCollisions();
  puddles = puddles.slice(-80);
  cuts.forEach(c => c.life -= dt); cuts = cuts.filter(c => c.life > 0);
}

function draw() {
  renderer.render({ bodies, pins, puddles, cuts, gesture, pointer, tool, palette, palettes, time,
    burning: (pointer.down && tool === 'fire') || keyboardFire });
  $('#empty-note').hidden = bodies.length > 0;
}

function frame(timestamp) {
  const dt = Math.min((timestamp - (last || timestamp)) / 1000, .025); last = timestamp; time += dt;
  update(dt); draw(); requestAnimationFrame(frame);
}

$$('.tool').forEach(button => button.addEventListener('click', () => selectTool(button.dataset.tool)));
$$('.shape-option').forEach(button => button.addEventListener('click', () => {
  shape = button.dataset.shape;
  $$('.shape-option').forEach(b => { const selected = b === button; b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', String(selected)); });
  reset();
}));
$$('.swatch').forEach(button => button.addEventListener('click', () => {
  palette = button.dataset.palette;
  $$('.swatch').forEach(b => { const selected = b === button; b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', String(selected)); });
  $('#palette-name').textContent = paletteNames[palette]; tone();
}));
$('#elasticity').addEventListener('input', event => {
  const value = Number(event.target.value); elasticity = value / 100;
  $('#elasticity-value').textContent = `${value}%`;
  event.target.style.background = `linear-gradient(to right,#b6a0d9 0%,#b6a0d9 ${(value - 10) / .9}%,#eeebf3 ${(value - 10) / .9}%,#eeebf3 100%)`;
  bodies.forEach(b => { b.wobbleV += .18; });
});
$('#gravity').addEventListener('change', event => {
  gravity = event.target.checked;
  if (!gravity) bodies.forEach(b => { b.vy = -65; b.vx += (Math.random() - .5) * 25; });
  notify(gravity ? '落地，也可以软软的。' : '轻飘飘，自由自在。');
});
$('#reset').addEventListener('click', () => reset());
$('#retry-render').addEventListener('click', () => window.location.reload());
$('#new-jelly').addEventListener('click', () => { reset(); $('#canvas-note').style.opacity = started ? '0' : '1'; });
$('#sound').addEventListener('click', () => { sound = !sound; updateSound(); if (sound) tone(); });
const helpDialog = $('#help-dialog');
$('#help').addEventListener('click', () => helpDialog.showModal());
$('#close-help').addEventListener('click', () => helpDialog.close());
$('#start-play').addEventListener('click', () => { helpDialog.close(); canvas.focus(); });
helpDialog.addEventListener('click', event => { if (event.target === helpDialog) { const r = helpDialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) helpDialog.close(); } });
document.addEventListener('keydown', event => {
  if (helpDialog.open || event.ctrlKey || event.metaKey || event.altKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
  if (['1', '2', '3', '4', '5'].includes(event.key)) { event.preventDefault(); selectTool(['grab', 'cut', 'pin', 'fire', 'view'][Number(event.key) - 1]); }
  if (event.key.toLowerCase() === 'r') reset();
  if (event.target !== canvas || !bodies.length) return;
  if (tool === 'view') {
    if (event.key.startsWith('Arrow')) {
      event.preventDefault();
      renderer.rotateView(event.key === 'ArrowLeft' ? -12 : event.key === 'ArrowRight' ? 12 : 0, event.key === 'ArrowUp' ? -12 : event.key === 'ArrowDown' ? 12 : 0);
    }
    if (event.code === 'Space') { event.preventDefault(); renderer.resetView(); }
    return;
  }
  const body = bodies[0];
  if (event.key.startsWith('Arrow')) {
    event.preventDefault(); engage();
    if (event.key === 'ArrowLeft') body.vx -= 95;
    if (event.key === 'ArrowRight') body.vx += 95;
    if (event.key === 'ArrowUp') body.vy -= 160;
    if (event.key === 'ArrowDown') body.vy += 95;
    body.wobbleV += .6;
  }
  if (event.code === 'Space') {
    event.preventDefault(); engage();
    if (event.repeat) return;
    if (tool === 'grab') { body.vy = -230; body.wobbleV += 2; tone(); }
    if (tool === 'cut') cutBodies({ x: 0, y: body.y }, { x: width, y: body.y });
    if (tool === 'pin') { const pin = pins.find(p => p.bodyId === body.id); pinAt(pin || { x: body.x, y: body.y }); }
    if (tool === 'fire') keyboardFire = true;
  }
});
document.addEventListener('keyup', event => { if (event.code === 'Space') keyboardFire = false; });
document.addEventListener('visibilitychange', () => { last = 0; if (document.hidden) { pointer.down = false; keyboardFire = false; drag = gesture = viewDrag = null; } });
new ResizeObserver(resize).observe(area);
resize(); requestAnimationFrame(frame);
