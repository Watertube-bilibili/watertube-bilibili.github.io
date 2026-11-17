/* One pointer owns the current interaction. Coordinates and speed stay in the
   simulator's coordinate system regardless of CSS scale or input device. */
(() => {
  "use strict";
  const clamp = (n, low, high) => Math.max(low, Math.min(high, n));

  function bind({
    screen,
    width,
    height,
    readState,
    begin,
    drag,
    release,
    tap,
  }) {
    let active = null;
    const canEdit =
      "input, textarea, select, [contenteditable=true], #labLens, .task-card";

    function hitTest(target, x, y, state) {
      if (target.closest(canEdit)) return null;
      if (state.control) {
        if (
          target.closest(".cc-grab") ||
          (target.closest(".control-center") && !target.closest("button,label"))
        )
          return "control";
        return null;
      }
      if (y >= height - 30) return "home";
      if (state.locked) return "unlock";
      if (y < 58 && x > width - 106 && !state.overlay) return "control";
      if (x < 23 && state.app && !state.tasks && !state.overlay) return "edge";
      return null;
    }

    function onDown(event) {
      if (active || event.button !== 0 || event.isPrimary === false) return;
      const state = readState();
      const rect = screen.getBoundingClientRect();
      const scale = rect.width / width || 1;
      const x = (event.clientX - rect.left) / scale;
      const y = (event.clientY - rect.top) / scale;
      const type = hitTest(event.target, x, y, state);
      if (!type) return;
      const now = performance.now();
      active = {
        type,
        pointer: event.pointerId,
        time: now,
        lastTime: now,
        started: false,
        scale,
        clientX: event.clientX,
        clientY: event.clientY,
        dx: 0,
        dy: 0,
        vx: 0,
        vy: 0,
        samples: [[now, 0, 0]],
        previous: null,
        startProgress: state.control?.progress || 0,
        startRect: state.pose?.slice(),
      };
    }

    function sample(gesture, event, now) {
      gesture.dx = (event.clientX - gesture.clientX) / gesture.scale;
      gesture.dy = (event.clientY - gesture.clientY) / gesture.scale;
      const samples = gesture.samples;
      while (samples.length > 1 && now - samples[0][0] > 80) samples.shift();
      samples.push([now, gesture.dx, gesture.dy]);
      const [time, x, y] = samples[0];
      const dt = Math.max(10, now - time);
      gesture.vx = clamp((gesture.dx - x) / dt, -3.5, 3.5);
      gesture.vy = clamp((gesture.dy - y) / dt, -3.5, 3.5);
      gesture.lastTime = now;
    }

    function onMove(event) {
      const gesture = active;
      if (!gesture || event.pointerId !== gesture.pointer) return;
      const now = performance.now();
      sample(gesture, event, now);
      if (!gesture.started) {
        if (Math.hypot(gesture.dx, gesture.dy) <= 5) return;
        if (
          gesture.type === "edge" &&
          (gesture.dx < 0 || Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.4)
        ) {
          active = null;
          return;
        }
        gesture.started = true;
        screen.setPointerCapture(event.pointerId);
        window.suppressClickUntil = now + 400;
        begin(gesture);
      }
      event.preventDefault();
      drag(gesture);
    }

    function finish(event, cancelled) {
      const gesture = active;
      if (
        !gesture ||
        (event.pointerId != null && event.pointerId !== gesture.pointer)
      )
        return;
      active = null;
      if (screen.hasPointerCapture(gesture.pointer))
        screen.releasePointerCapture(gesture.pointer);
      if (!gesture.started) {
        if (!cancelled) tap(gesture);
        return;
      }
      window.suppressClickUntil = performance.now() + 300;
      if (performance.now() - gesture.lastTime > 115) {
        gesture.vx = 0;
        gesture.vy = 0;
      }
      release(gesture, cancelled);
    }

    screen.addEventListener("pointerdown", onDown, true);
    screen.addEventListener("pointermove", onMove, { passive: false });
    screen.addEventListener("pointerup", (e) => finish(e, false));
    screen.addEventListener("pointercancel", (e) => finish(e, true));
    screen.addEventListener("lostpointercapture", (e) => finish(e, true));
    window.addEventListener("blur", (e) => finish(e, true));
  }

  function homeFrame(dx, dy, startingPose) {
    const up = Math.max(0, -dy);
    const compression = 1 - Math.exp(-up / 390);
    const [x, y, w, h, radius] = startingPose;
    const size = 1 - compression * 0.43;
    return [
      x + (w * (1 - size)) / 2 + dx * 0.4,
      y - up * 0.37 + h * (1 - size) * 0.2,
      w * size,
      h * size,
      Math.max(radius, Math.min(38, compression * 70)),
    ];
  }

  function frameVelocity(g) {
    const next = homeFrame(g.dx + g.vx, g.dy + g.vy, g.startRect);
    const current = homeFrame(g.dx, g.dy, g.startRect);
    return next.map((v, i) => (v - current[i]) * 1000);
  }

  function homeDestination(g, cancelled) {
    if (cancelled) return "app";
    const up = -g.dy;
    if (up > 65 && performance.now() - g.time > 320 && Math.abs(g.vy) < 0.3)
      return "tasks";
    if (up > 110 || (up > 24 && g.vy < -0.5)) return "home";
    return "app";
  }

  function bindTaskCard({ card, track, screen, open, close, getSpeed }) {
    const nativeScroll = "pan-x";
    const logicalScale = () => screen.getBoundingClientRect().width / 354 || 1;
    let drag = null;
    let dismissFlight = null;
    let clickBlockedUntil = 0;
    let currentY = 0;

    function paint(y) {
      currentY = y;
      const lift = clamp(-y / 480, 0, 1);
      card.style.transform = `translate3d(0,${y}px,0) scale(${1 - 0.045 * lift})`;
      card.style.opacity = String(1 - lift * 0.66);
    }

    function settle(y, velocity) {
      dismissFlight?.cancel();
      const flight = LiquidMotion.spring({
        from: [currentY],
        to: [y],
        velocity: [velocity],
        stiffness: 245,
        damping: 30,
        speed: getSpeed(),
        update: ([next]) => paint(next),
      });
      dismissFlight = flight;
      flight.finished
        .then(() => {
          if (flight !== dismissFlight || !track.contains(card)) return;
          dismissFlight = null;
          if (y < 0) close();
          else {
            card.style.transform = "";
            card.style.opacity = "";
          }
        })
        .catch(() => {});
    }

    function snapScroll(velocity) {
      const width =
        card.offsetWidth + (parseFloat(getComputedStyle(track).columnGap) || 0);
      if (!width) return;
      const maximum = Math.max(0, track.scrollWidth - track.clientWidth);
      const projected = clamp(track.scrollLeft - velocity * 150, 0, maximum);
      const target = clamp(Math.round(projected / width) * width, 0, maximum);
      track.scrollTo({ left: target, behavior: "smooth" });
      track.style.scrollSnapType = "";
    }

    card.style.touchAction = nativeScroll;
    card.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || drag) return;
      dismissFlight?.cancel();
      const scale = logicalScale();
      drag = {
        id: event.pointerId,
        x: event.clientX / scale,
        y: event.clientY / scale,
        time: performance.now(),
        scroll: track.scrollLeft,
        initialY: currentY,
        dx: 0,
        dy: 0,
        vx: 0,
        vy: 0,
        axis: null,
        scale,
      };
      card.setPointerCapture(event.pointerId);
    });
    card.addEventListener("pointermove", (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      const now = performance.now();
      const dx = event.clientX / drag.scale - drag.x;
      const dy = event.clientY / drag.scale - drag.y;
      const dt = Math.max(8, now - drag.time);
      drag.vx = 0.3 * drag.vx + (0.7 * (dx - drag.dx)) / dt;
      drag.vy = 0.3 * drag.vy + (0.7 * (dy - drag.dy)) / dt;
      Object.assign(drag, { dx, dy, time: now });
      if (!drag.axis && Math.hypot(dx, dy) > 7)
        drag.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (drag.axis === "y")
        paint(drag.initialY + (dy > 0 ? Math.sqrt(dy) * 3 : dy));
      if (drag.axis === "x" && event.pointerType !== "touch") {
        track.style.scrollSnapType = "none";
        track.scrollLeft = drag.scroll - dx;
      }
    });
    card.addEventListener("pointerup", (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      const last = drag;
      drag = null;
      if (!last.axis) return;
      clickBlockedUntil = performance.now() + 350;
      const velocity = performance.now() - last.time > 120 ? 0 : last.vy;
      if (last.axis === "y") {
        const dismiss = currentY < -82 || (currentY < -22 && velocity < -0.7);
        settle(dismiss ? -700 : 0, velocity * 1000);
      } else if (event.pointerType !== "touch") snapScroll(last.vx);
    });
    card.addEventListener("pointercancel", () => {
      drag = null;
      track.style.scrollSnapType = "";
      if (currentY !== 0) settle(0, 0);
    });
    card.addEventListener("click", () => {
      if (performance.now() >= clickBlockedUntil) open();
    });
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      open();
    });
  }

  window.LiquidGestures = Object.freeze({
    bind,
    bindTaskCard,
    homeFrame,
    frameVelocity,
    homeDestination,
  });
})();
