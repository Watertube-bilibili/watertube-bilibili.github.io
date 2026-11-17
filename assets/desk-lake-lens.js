// Only this button-sized alpha canvas reaches the page. The photograph is read
// from a small, detached crop; neither it nor a filter surface can paint the DOM.
function makeLens(control, density) {
  const canvas = document.createElement('canvas');
  canvas.className = 'lake-rim';
  canvas.setAttribute('aria-hidden', 'true');
  const width = canvas.width = Math.round(control.clientWidth * density);
  const height = canvas.height = Math.round(control.clientHeight * density);
  const ctx = canvas.getContext('2d');
  if (!ctx || !width || !height) return null;
  const output = ctx.createImageData(width, height);
  const radius = height / 2;
  const bevel = Math.min(15 * density, radius * .68);
  const margin = Math.ceil(68 * density); // biased rays plus the drag allowance
  const tileWidth = width + margin * 2;
  const tileHeight = height + margin * 2;
  const dest = [], src = [], shine = [];
  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const x = px + .5 - width / 2;
      const y = py + .5 - radius;
      const capX = Math.sign(x) * Math.max(0, Math.abs(x) - (width / 2 - radius));
      const distance = Math.hypot(capX, y);
      const depth = radius - distance;
      // The center and *every* pixel outside the stadium retain zero alpha.
      if (depth <= 0 || depth >= bevel) continue;
      const nx = capX / distance, ny = y / distance;
      const t = 1 - depth / bevel;
      const curve = t * t * (3 - 2 * t);
      const bend = 23 * density * curve;
      const index = (py * width + px) * 4;
      const sourceX = margin + px + Math.round(nx * bend);
      const sourceY = margin + py + Math.round(ny * bend);
      dest.push(index);
      src.push(4 * (sourceY * tileWidth + sourceX));
      // A slim directional caustic follows the curvature at the lens rim.
      const lit = .55 - .25 * nx - .3 * ny;
      shine.push(46 * lit * Math.exp(-Math.pow((depth / density - 2) / 2.2, 2)));
      output.data[index + 3] = Math.round(230 * Math.min(depth, 1) * Math.min((bevel - depth) / (2 * density), 1));
    }
  }
  control.prepend(canvas);
  return { control, canvas, ctx, output, density, margin, tileWidth, tileHeight,
    dest: Int32Array.from(dest), src: Int32Array.from(src), shine: Uint8Array.from(shine),
    tile: null, baseX: 0, baseY: 0, dx: NaN, dy: NaN };
}

function layerAnchor(value, fallback) {
  const lastLayer = value?.split(',').pop()?.trim();
  return lastLayer?.endsWith('%') ? parseFloat(lastLayer) / 100 : fallback;
}

function readScene(hero) {
  const style = getComputedStyle(hero, '::before');
  const left = parseFloat(style.left), top = parseFloat(style.top);
  const backdrop = style.backgroundImage;
  const url = /url\(["']?([^"')]+)["']?\)/.exec(backdrop)?.[1];
  const ramp = /^linear-gradient\(([.\d-]+)deg,/.exec(backdrop);
  const stops = [...backdrop.matchAll(/(rgba?\([^)]*\)|transparent)\s+([\d.]+)%/g)];
  return { url, left: hero.clientLeft + left, top: hero.clientTop + top,
    width: hero.clientWidth - left - parseFloat(style.right),
    height: hero.clientHeight - top - parseFloat(style.bottom),
    anchorX: layerAnchor(style.backgroundPositionX, .5),
    anchorY: layerAnchor(style.backgroundPositionY, .5),
    angle: ramp ? Number(ramp[1]) * Math.PI / 180 : 0, stops };
}

function sampleTile(lens, image, scene, originX, originY) {
  const { density, margin, tileWidth, tileHeight } = lens;
  const scratch = document.createElement('canvas');
  scratch.width = tileWidth;
  scratch.height = tileHeight;
  const ctx = scratch.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const scale = Math.max(scene.width / sourceWidth, scene.height / sourceHeight);
  const width = sourceWidth * scale, height = sourceHeight * scale;
  ctx.setTransform(density, 0, 0, density, margin - originX * density, margin - originY * density);
  ctx.drawImage(image, (scene.width - width) * scene.anchorX, (scene.height - height) * scene.anchorY, width, height);
  if (scene.stops.length) {
    const ux = Math.sin(scene.angle), uy = -Math.cos(scene.angle);
    const span = (Math.abs(scene.width * ux) + Math.abs(scene.height * uy)) / 2;
    const cx = scene.width / 2, cy = scene.height / 2;
    const gradient = ctx.createLinearGradient(cx - ux * span, cy - uy * span, cx + ux * span, cy + uy * span);
    for (const [, color, percent] of scene.stops) gradient.addColorStop(Number(percent) / 100, color);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, scene.width, scene.height);
  }
  return ctx.getImageData(0, 0, tileWidth, tileHeight).data;
}

function paintLens(lens, image, scene, heroBox) {
  const box = lens.control.getBoundingClientRect();
  const x = box.left + lens.control.clientLeft - heroBox.left - scene.left;
  const y = box.top + lens.control.clientTop - heroBox.top - scene.top;
  if (!lens.tile || Math.abs(x - lens.baseX) > 40 || Math.abs(y - lens.baseY) > 40) {
    lens.tile = sampleTile(lens, image, scene, x, y);
    lens.baseX = x;
    lens.baseY = y;
    lens.dx = NaN;
    if (!lens.tile) return;
  }
  const dx = Math.round((x - lens.baseX) * lens.density);
  const dy = Math.round((y - lens.baseY) * lens.density);
  if (dx === lens.dx && dy === lens.dy) return;
  lens.dx = dx;
  lens.dy = dy;
  const offset = (dy * lens.tileWidth + dx) * 4;
  const pixels = lens.output.data;
  for (let i = 0; i < lens.dest.length; i++) {
    const out = lens.dest[i], source = lens.src[i] + offset;
    const shine = lens.shine[i];
    pixels[out] = lens.tile[source] * 1.08 + shine;
    pixels[out + 1] = lens.tile[source + 1] * 1.08 + shine;
    pixels[out + 2] = lens.tile[source + 2] * 1.08 + shine;
  }
  lens.ctx.putImageData(lens.output, 0, 0);
}

export function mountLakeLenses(hero) {
  if (!hero || !window.ResizeObserver) return;
  const controls = [...hero.querySelectorAll('.hero-actions .glass-control')];
  if (!controls.length) return;
  const preferences = matchMedia('(prefers-reduced-transparency: reduce), (forced-colors: active)');
  const image = new Image();
  let lenses = [], scene, wallpaper = null, frame = 0, until = 0;
  const enabled = () => document.documentElement.dataset.glassTier === 'full' && !preferences.matches;

  function draw(time) {
    frame = 0;
    if (!enabled() || !scene || (!wallpaper && (!image.complete || !image.naturalWidth))) return;
    const box = hero.getBoundingClientRect();
    for (const lens of lenses) paintLens(lens, wallpaper || image, scene, box);
    if (time < until) frame = requestAnimationFrame(draw);
  }
  function schedule() {
    if (!frame && enabled()) frame = requestAnimationFrame(draw);
  }
  function rebuild() {
    if (!enabled()) return;
    scene = readScene(hero);
    if (!wallpaper && !scene.url) return;
    if (!wallpaper && image.src !== scene.url) image.src = scene.url;
    const density = Math.min(window.devicePixelRatio || 1, 1.5);
    for (const lens of lenses) lens.canvas.remove();
    lenses = controls.map(control => makeLens(control, density)).filter(Boolean);
    schedule();
  }
  const resize = new ResizeObserver(rebuild);
  // Pointer handlers belong to the controls. Follow their actual rendered
  // coordinates, including the CSS return transition, without handling input.
  const position = new MutationObserver(records => {
    if (records.some(r => !r.target.hasAttribute('data-glass-held') && r.attributeName === 'data-glass-held')) {
      until = performance.now() + 380;
    }
    schedule();
  });
  function applyTier() {
    resize.disconnect();
    position.disconnect();
    cancelAnimationFrame(frame);
    frame = until = 0;
    for (const lens of lenses) lens.canvas.remove();
    lenses = [];
    if (!enabled()) return;
    resize.observe(hero);
    for (const control of controls) {
      resize.observe(control);
      position.observe(control, { attributes: true, attributeFilter: ['style', 'data-glass-held'] });
    }
  }
  hero.addEventListener('wallpaperchange', event => {
    wallpaper = event.detail?.source || null;
    rebuild();
  });
  image.addEventListener('load', schedule);
  new MutationObserver(applyTier).observe(document.documentElement, { attributes: true, attributeFilter: ['data-glass-tier'] });
  preferences.addEventListener?.('change', applyTier);
  applyTier();
}
