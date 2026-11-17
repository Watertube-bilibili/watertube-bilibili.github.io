import { createGlassBridge } from './desk-bridge.js?v=meniscus2';
import { mountLakeLenses } from './desk-lake-lens.js';

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

  mountLakeLenses(document.querySelector('.hero'));
})();
