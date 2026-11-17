// Sample an analytic damped spring on the display clock. Changing refresh rate does
// not change the release path. All active surfaces share a single frame callback.
(() => {
  "use strict";

  const activeSprings = new Set();
  let frameId = 0;

  function tick(now) {
    frameId = 0;
    for (const advance of [...activeSprings]) advance(now);
    if (activeSprings.size && !frameId) frameId = requestAnimationFrame(tick);
  }

  function trajectory(time, omega, drag) {
    const discriminant = omega * omega - drag * drag;
    if (Math.abs(discriminant) < 0.0001) {
      const decay = Math.exp(-drag * time);
      return [decay, time * decay];
    }
    if (discriminant > 0) {
      const frequency = Math.sqrt(discriminant);
      const decay = Math.exp(-drag * time);
      return [
        decay * Math.cos(frequency * time),
        (decay * Math.sin(frequency * time)) / frequency,
      ];
    }
    const rate = Math.sqrt(-discriminant);
    const slow = Math.exp((-drag + rate) * time);
    const fast = Math.exp((-drag - rate) * time);
    return [(slow + fast) / 2, (slow - fast) / (2 * rate)];
  }

  function spring({
    from,
    to,
    velocity = [],
    stiffness = 340,
    damping = 30,
    mass = 1,
    speed = 1,
    update,
  }) {
    const origin = [...from],
      target = [...to],
      initialVelocity = [...(velocity || [])];
    const omega = Math.sqrt(stiffness / mass),
      drag = damping / (2 * mass);
    const started = performance.now(),
      pace = Math.max(0.05, speed);
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let position = [...origin],
      speeds = origin.map((_, i) => initialVelocity[i] || 0);
    let resolve, reject;
    const finished = new Promise((yes, no) => {
      resolve = yes;
      reject = no;
    });
    finished.catch(() => {});

    function advance(now) {
      const seconds = Math.max(0, (now - started) / (1000 * pace));
      const [cosine, sine] = trajectory(seconds, omega, drag);
      let settled = true;
      for (let i = 0; i < target.length; i++) {
        const offset = origin[i] - target[i],
          v = initialVelocity[i] || 0;
        position[i] = target[i] + offset * cosine + (v + drag * offset) * sine;
        speeds[i] = v * cosine - (omega * omega * offset + drag * v) * sine;
        const tolerance = Math.abs(offset) <= 2 ? 0.0008 : 0.06;
        if (
          Math.abs(position[i] - target[i]) > tolerance ||
          Math.abs(speeds[i]) > tolerance * 12
        )
          settled = false;
      }
      if (settled || reduced || seconds >= 2) {
        activeSprings.delete(advance);
        position = [...target];
        speeds.fill(0);
        update(position, speeds);
        resolve();
        return;
      }
      update(position, speeds);
    }

    update(position, speeds);
    activeSprings.add(advance);
    if (!frameId) frameId = requestAnimationFrame(tick);
    return {
      finished,
      get position() {
        return [...position];
      },
      get velocity() {
        return [...speeds];
      },
      cancel() {
        if (!activeSprings.delete(advance)) return;
        reject(new DOMException("Motion interrupted", "AbortError"));
      },
    };
  }

  function clamp(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  }
  function smooth(min, max, value) {
    const t = clamp((value - min) / (max - min));
    return t * t * (3 - 2 * t);
  }
  window.LiquidMotion = Object.freeze({ spring, clamp, smooth });
})();
