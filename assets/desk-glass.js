(() => {
  "use strict";

  const controls = [...document.querySelectorAll(".glass-control")];
  if (!controls.length) return;

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
    control.style.setProperty("--glass-x", (held.x + dx * resistance) + "px");
    control.style.setProperty("--glass-y", (held.y + dy * resistance) + "px");
  }

  function end(event) {
    if (!held || (event.type !== "blur" && event.pointerId !== held.id)) return;
    const { control, dragged, startX, startY } = held;
    const missedMove = event.type === "pointerup" && Math.hypot(event.clientX - startX, event.clientY - startY) >= 7;
    if (dragged || missedMove || event.type !== "pointerup") ignoreClickOn = control;
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

  if (!window.ResizeObserver || !CSS.supports("backdrop-filter", "url(#lens)")) return;
  const svgNS = "http://www.w3.org/2000/svg";
  const filters = document.createElementNS(svgNS, "svg");
  filters.setAttribute("width", "0");
  filters.setAttribute("height", "0");
  filters.setAttribute("aria-hidden", "true");
  filters.style.cssText = "position:absolute;pointer-events:none;overflow:hidden";
  const defs = filters.appendChild(document.createElementNS(svgNS, "defs"));
  const lenses = new Map();

  // Each normal displaces a backdrop sample toward the inside of the beveled
  // rim. Neutral channels in the center preserve the scene behind the glass.
  function lensMap(width, height, radius) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(280, width);
    canvas.height = Math.min(80, height);
    const ctx = canvas.getContext("2d");
    const map = ctx.createImageData(canvas.width, canvas.height);
    const rim = Math.min(9, height * .2);
    for (let row = 0; row < canvas.height; row++) {
      for (let col = 0; col < canvas.width; col++) {
        const x = (col + .5) * width / canvas.width - width / 2;
        const y = (row + .5) * height / canvas.height - height / 2;
        const qx = Math.abs(x) - width / 2 + radius;
        const qy = Math.abs(y) - height / 2 + radius;
        const corner = Math.hypot(Math.max(0, qx), Math.max(0, qy));
        const depth = radius - corner - Math.min(Math.max(qx, qy), 0);
        const bend = 116 * Math.pow(Math.max(0, 1 - Math.max(depth, 0) / rim), 2);
        const nx = corner ? Math.max(0, qx) / corner : Number(qx > qy);
        const ny = corner ? Math.max(0, qy) / corner : Number(qy >= qx);
        const i = 4 * (row * canvas.width + col);
        map.data[i] = 128 - bend * Math.sign(x) * nx;
        map.data[i + 1] = 128 - bend * Math.sign(y) * ny;
        map.data[i + 2] = 128;
        map.data[i + 3] = 255;
      }
    }
    ctx.putImageData(map, 0, 0);
    return canvas.toDataURL();
  }

  function updateLens(control) {
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
      displace.setAttribute("scale", "20");
      lens = { image, id: filter.id };
      lenses.set(control, lens);
    }
    lens.size = size;
    lens.image.setAttribute("href", lensMap(width, height, radius));
    control.style.setProperty("--glass-lens", 'url("#' + lens.id + '") blur(.5px)');
  }

  const resize = new ResizeObserver(entries => {
    for (const entry of entries) updateLens(entry.target);
  });
  function applyTier() {
    resize.disconnect();
    if (document.documentElement.dataset.glassTier !== "full" || reducedTransparency.matches) return;
    if (!filters.isConnected) document.body.append(filters);
    for (const control of controls) resize.observe(control);
  }
  new MutationObserver(applyTier).observe(document.documentElement, {
    attributes: true, attributeFilter: ["data-glass-tier"]
  });
  reducedTransparency.addEventListener?.("change", applyTier);
  applyTier();
})();
