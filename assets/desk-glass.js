import { createGlassBridge } from './desk-bridge.js';

(() => {
  "use strict";

  const controls = [...document.querySelectorAll(".glass-control")];
  if (!controls.length) return;
  const bridge = createGlassBridge(document.querySelector('.hero-actions'));

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const reducedTransparency = matchMedia("(prefers-reduced-transparency: reduce)");
  const enhancedLight = () => document.documentElement.dataset.glassTier !== "lite" && !reducedTransparency.matches;
  let held = null;
  let ignoreClickOn = null;

  function placeLight(control, x, y, rect) {
    if (!enhancedLight()) return;
    const xPercent = Math.min(100, Math.max(0, 100 * (x - rect.left) / rect.width));
    const yPercent = Math.min(100, Math.max(0, 100 * (y - rect.top) / rect.height));
    const angle = Math.atan2(yPercent - 50, xPercent - 50) * 180 / Math.PI + 90;
    control.style.setProperty("--glass-angle", angle + "deg");
    control.style.setProperty("--glass-light-x", xPercent + "%");
    control.style.setProperty("--glass-light-y", yPercent + "%");
  }

  function begin(event) {
    if (!event.isPrimary || event.button !== 0 || held) return;
    const control = event.currentTarget;
    ignoreClickOn = null;
    const rect = control.getBoundingClientRect();
    // A second grab can interrupt a release without jumping to its endpoint.
    const transform = getComputedStyle(control).transform;
    const matrix = transform === "none" ? null : new DOMMatrixReadOnly(transform);
    const x = matrix?.m41 || 0;
    const y = matrix?.m42 || 0;
    control.style.setProperty("--glass-x", x + "px");
    control.style.setProperty("--glass-y", y + "px");
    control.dataset.glassHeld = "";
    held = { control, id: event.pointerId, startX: event.clientX, startY: event.clientY, rect, x, y, dragged: false };
    bridge?.begin(control, rect, x, y);
    placeLight(control, event.clientX, event.clientY, rect);
    control.setPointerCapture(event.pointerId);
  }

  function move(event) {
    const control = event.currentTarget;
    if (!held) {
      if (event.pointerType === "mouse" && enhancedLight()) {
        placeLight(control, event.clientX, event.clientY, control.getBoundingClientRect());
      }
      return;
    }
    if (event.pointerId !== held.id || control !== held.control) return;
    const dx = event.clientX - held.startX;
    const dy = event.clientY - held.startY;
    const distance = Math.hypot(dx, dy);
    placeLight(control, event.clientX, event.clientY, held.rect);
    if (!held.dragged && distance < 7) return;
    held.dragged = true;
    control.dataset.glassDrag = "";
    if (reducedMotion.matches) return;

    // Increasing resistance limits the total travel in every direction.
    const resistance = 38 * (1 - Math.exp(-distance / 67)) / (distance || 1);
    let x = held.x + dx * resistance, y = held.y + dy * resistance;
    if (bridge) [x, y] = bridge.move(x, y);
    control.style.setProperty("--glass-x", x + "px");
    control.style.setProperty("--glass-y", y + "px");
  }

  function end(event) {
    if (!held || (event.type !== "blur" && event.pointerId !== held.id)) return;
    const { control, dragged, startX, startY } = held;
    const missedMove = event.type === "pointerup" && Math.hypot(event.clientX - startX, event.clientY - startY) >= 7;
    if (dragged || missedMove || event.type !== "pointerup") ignoreClickOn = control;
    bridge?.end(event.type !== "pointerup");
    held = null;
    delete control.dataset.glassHeld;
    delete control.dataset.glassDrag;
    control.style.removeProperty("--glass-x");
    control.style.removeProperty("--glass-y");
  }

  // Native activation still handles taps, keyboard, modifier keys and new tabs.
  document.addEventListener("click", event => {
    if (event.detail && ignoreClickOn?.contains(event.target)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      ignoreClickOn = null;
    }
  }, true);

  for (const control of controls) {
    control.addEventListener("pointerdown", begin);
    control.addEventListener("pointermove", move);
    control.addEventListener("pointerup", end);
    control.addEventListener("pointercancel", end);
    control.addEventListener("lostpointercapture", end);
    control.addEventListener("dragstart", event => event.preventDefault());
  }
  window.addEventListener("blur", end);

  if (!window.ResizeObserver || !CSS.supports("filter", "url(#lens)")) return;
  const hero = document.querySelector(".hero");
  const lakeControls = controls.filter(control => control.closest(".hero-actions"));
  const nativeBackdropLens = CSS.supports("backdrop-filter", "url(#lens)");
  const svgNS = "http://www.w3.org/2000/svg";
  const filters = document.createElementNS(svgNS, "svg");
  filters.setAttribute("width", "0");
  filters.setAttribute("height", "0");
  filters.setAttribute("aria-hidden", "true");
  filters.style.cssText = "position:absolute;pointer-events:none;overflow:hidden";
  const defs = filters.appendChild(document.createElementNS(svgNS, "defs"));
  const lenses = new Map();

  // Give the lake lens pixels outside its silhouette, so the bevel can bend
  // nearby shorelines into view. A flat backdrop filter can only sample its box.
  const lakeMargin = 30;
  function lensMap(width, height, radius, isLake) {
    const canvas = document.createElement("canvas");
    const fieldWidth = width + (isLake ? 2 * lakeMargin : 0);
    const fieldHeight = height + (isLake ? 2 * lakeMargin : 0);
    canvas.width = Math.min(340, fieldWidth);
    canvas.height = Math.min(120, fieldHeight);
    const ctx = canvas.getContext("2d");
    const map = ctx.createImageData(canvas.width, canvas.height);
    const rim = isLake ? Math.min(17, height * .36) : Math.min(9, height * .2);
    const scale = isLake ? 58 : 20;
    for (let row = 0; row < canvas.height; row++) {
      for (let col = 0; col < canvas.width; col++) {
        const x = (col + .5) * fieldWidth / canvas.width - fieldWidth / 2;
        const y = (row + .5) * fieldHeight / canvas.height - fieldHeight / 2;
        const qx = Math.abs(x) - width / 2 + radius;
        const qy = Math.abs(y) - height / 2 + radius;
        const corner = Math.hypot(Math.max(0, qx), Math.max(0, qy));
        const depth = radius - corner - Math.min(Math.max(qx, qy), 0);
        const t = Math.max(0, 1 - Math.max(depth, 0) / rim);
        const bend = isLake ? -25 * t * t * (3 - 2 * t) : 9 * t * t;
        // The gently curved center magnifies the lake; the bevel turns rays
        // more steeply near the perimeter. Both meet without a visible seam.
        const magnification = isLake ? .12 * (1 - t) : 0;
        const nx = corner ? Math.max(0, qx) / corner : Number(qx > qy);
        const ny = corner ? Math.max(0, qy) / corner : Number(qy >= qx);
        const i = 4 * (row * canvas.width + col);
        map.data[i] = 128 - 255 / scale * (bend * Math.sign(x) * nx + x * magnification);
        map.data[i + 1] = 128 - 255 / scale * (bend * Math.sign(y) * ny + y * magnification);
        map.data[i + 2] = 128;
        if (isLake) {
          const light = -.6 * Math.sign(x) * nx - .8 * Math.sign(y) * ny;
          const caustic = (.18 + .14 * light) * Math.exp(-Math.pow((depth - 2.7) / 2.4, 2));
          const shade = .07 * Math.exp(-Math.pow((depth - 7.5) / 3, 2));
          map.data[i + 2] += 255 * (caustic - shade);
        }
        map.data[i + 3] = 255;
      }
    }
    ctx.putImageData(map, 0, 0);
    return canvas.toDataURL();
  }

  // Ordinary SVG filters also work on WebKit, where filtering a backdrop
  // through an SVG URL is unreliable. Sample the same, already-cached hero
  // artwork at its real size and offset, including its responsive gradient.
  function mountLakeSample(control, filterId) {
    const clip = document.createElement("span");
    clip.className = "glass-scene";
    clip.setAttribute("aria-hidden", "true");
    const field = clip.appendChild(document.createElement("span"));
    field.className = "glass-scene-field";
    field.style.inset = -lakeMargin + "px";
    field.style.filter = 'url("#' + filterId + '")';
    const sample = field.appendChild(document.createElement("span"));
    sample.className = "glass-scene-sample";
    control.prepend(clip);
    return sample;
  }

  function alignLakeSamples() {
    if (!hero) return;
    const scene = getComputedStyle(hero, "::before");
    const heroBox = hero.getBoundingClientRect();
    const left = parseFloat(scene.left);
    const top = parseFloat(scene.top);
    const width = hero.clientWidth - left - parseFloat(scene.right);
    const height = hero.clientHeight - top - parseFloat(scene.bottom);
    for (const control of lakeControls) {
      const sample = lenses.get(control)?.sample;
      if (!sample) continue;
      const box = control.getBoundingClientRect();
      const transform = getComputedStyle(control).transform;
      const matrix = transform === "none" ? null : new DOMMatrixReadOnly(transform);
      sample.style.left = (heroBox.left + hero.clientLeft + left - box.left - control.clientLeft + lakeMargin + (matrix?.m41 || 0)) + "px";
      sample.style.top = (heroBox.top + hero.clientTop + top - box.top - control.clientTop + lakeMargin + (matrix?.m42 || 0)) + "px";
      sample.style.width = width + "px";
      sample.style.height = height + "px";
      sample.style.backgroundImage = scene.backgroundImage;
      sample.style.backgroundSize = scene.backgroundSize;
      sample.style.backgroundPosition = scene.backgroundPosition;
      sample.style.backgroundRepeat = scene.backgroundRepeat;
      sample.style.backgroundColor = scene.backgroundColor;
    }
  }

  function updateLens(control) {
    const isLake = lakeControls.includes(control);
    if (!isLake && !nativeBackdropLens) return;
    const width = control.offsetWidth, height = control.offsetHeight;
    if (!width || !height) return;
    const radius = Math.min(width / 2, height / 2, parseFloat(getComputedStyle(control).borderTopLeftRadius));
    const size = [width, height, radius].join("-");
    let lens = lenses.get(control);
    if (lens?.size === size) return;
    if (!lens) {
      const filter = defs.appendChild(document.createElementNS(svgNS, "filter"));
      filter.id = "desk-rim-" + lenses.size;
      filter.setAttribute("x", "0");
      filter.setAttribute("y", "0");
      filter.setAttribute("width", "100%");
      filter.setAttribute("height", "100%");
      filter.setAttribute("color-interpolation-filters", "sRGB");
      const image = filter.appendChild(document.createElementNS(svgNS, "feImage"));
      image.setAttribute("preserveAspectRatio", "none");
      image.setAttribute("result", "normal");
      const displace = filter.appendChild(document.createElementNS(svgNS, "feDisplacementMap"));
      displace.setAttribute("in", "SourceGraphic");
      displace.setAttribute("in2", "normal");
      displace.setAttribute("xChannelSelector", "R");
      displace.setAttribute("yChannelSelector", "G");
      displace.setAttribute("scale", isLake ? "58" : "20");
      if (isLake) {
        displace.setAttribute("result", "refracted");
        const light = filter.appendChild(document.createElementNS(svgNS, "feColorMatrix"));
        light.setAttribute("in", "normal");
        light.setAttribute("values", "0 0 1 0 0  0 0 1 0 0  0 0 1 0 0  0 0 0 0 1");
        light.setAttribute("result", "rimLight");
        const finish = filter.appendChild(document.createElementNS(svgNS, "feComposite"));
        finish.setAttribute("operator", "arithmetic");
        finish.setAttribute("in", "refracted");
        finish.setAttribute("in2", "rimLight");
        finish.setAttribute("k2", "1.13");
        finish.setAttribute("k3", "1");
        finish.setAttribute("k4", "-.50");
      }
      lens = { image, id: filter.id };
      if (isLake) lens.sample = mountLakeSample(control, filter.id);
      lenses.set(control, lens);
    }
    lens.size = size;
    lens.image.setAttribute("href", lensMap(width, height, radius, isLake));
    if (!isLake) control.style.setProperty("--glass-lens", 'url("#' + lens.id + '") blur(.5px)');
  }

  const resize = new ResizeObserver(entries => {
    for (const entry of entries) {
      if (entry.target !== hero) updateLens(entry.target);
    }
    alignLakeSamples();
  });
  function applyTier() {
    resize.disconnect();
    if (document.documentElement.dataset.glassTier !== "full" || reducedTransparency.matches) return;
    if (!filters.isConnected) document.body.append(filters);
    if (hero) resize.observe(hero);
    for (const control of controls) resize.observe(control);
  }
  new MutationObserver(applyTier).observe(document.documentElement, {
    attributes: true, attributeFilter: ["data-glass-tier"]
  });
  reducedTransparency.addEventListener?.("change", applyTier);
  applyTier();
})();
