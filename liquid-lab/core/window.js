/* Window coordinates are measured in the phone's logical pixels. The frame, content
   and artwork have independent transforms, so content never changes aspect ratio. */
(() => {
  "use strict";

  function createWindowSurfaces({ screen, width, height, getSpeed }) {
    const full = [0, 0, width, height, 0];
    const frames = new WeakMap();
    const flights = new WeakMap();
    const elements = new WeakMap();
    const { clamp, smooth, spring } = window.LiquidMotion;

    function pose(element) {
      return [...(frames.get(element) || full)];
    }

    function interrupt(element) {
      if (!element) return;
      const flight = flights.get(element);
      if (flight) {
        flights.delete(element);
        flight.cancel();
      }
      return pose(element);
    }

    function draw(element, frame, { morph = false } = {}) {
      const [left, top, w, h, radius] = frame;
      const sx = Math.max(0.025, w / width);
      const sy = Math.max(0.025, h / height);
      frames.set(element, frame.slice());
      const dx = left + (w - width) / 2;
      const dy = top + (h - height) / 2;
      element.style.transform = `translate3d(${dx}px,${dy}px,0) scale(${sx},${sy})`;
      element.style.borderRadius = `${Math.max(0, radius) / sx}px / ${Math.max(0, radius) / sy}px`;

      let layers = elements.get(element);
      if (!layers || !element.contains(layers.content)) {
        layers = {
          content: element.querySelector(".app-content"),
          backdrop: getComputedStyle(element).background,
          artwork: element.querySelector(".app-morph-icon"),
        };
        elements.set(element, layers);
      }
      const progress = clamp((Math.min(w, h) - 60) / (width - 60));
      const contentOpacity = morph ? smooth(0.13, 0.6, progress) : 1;
      const artworkOpacity = morph ? 1 - smooth(0.09, 0.45, progress) : 0;
      if (morph && layers.content && !layers.carriesBackdrop) {
        // Move the material onto the fading content. Empty space around a cutout
        // illustration must already show the wallpaper before the flight ends.
        element.style.setProperty("background", "transparent", "important");
        layers.content.style.background = layers.backdrop;
        layers.carriesBackdrop = true;
      } else if (!morph && layers.carriesBackdrop) {
        element.style.removeProperty("background");
        layers.content.style.removeProperty("background");
        layers.carriesBackdrop = false;
      }
      if (layers.content) {
        layers.content.style.transform = `scaleY(${sx / sy})`;
        layers.content.style.opacity = contentOpacity;
        layers.content.style.filter =
          contentOpacity < 0.995 ? `blur(${(1 - contentOpacity) * 2.1}px)` : "";
      }
      if (layers.artwork) {
        layers.artwork.style.transform = `translateY(-50%) scaleY(${sx / sy})`;
        layers.artwork.style.opacity = artworkOpacity;
      }
      element.style.boxShadow = `0 ${Math.max(0, 12 * (1 - sx))}px ${Math.max(0, 35 * (1 - sx))}px #0003`;
      element.dataset.contentOpacity = contentOpacity.toFixed(3);
      element.dataset.iconOpacity = artworkOpacity.toFixed(3);
    }

    function animate(element, start, destination, options = {}) {
      interrupt(element);
      const flight = spring({
        from: start || pose(element),
        to: destination,
        velocity: options.velocity,
        stiffness: options.stiffness ?? 330,
        damping: options.damping ?? 32,
        speed: getSpeed(),
        update: (next) => draw(element, next, options),
      });
      flights.set(element, flight);
      const cleanup = () => {
        if (flights.get(element) === flight) flights.delete(element);
      };
      flight.finished.then(cleanup, cleanup);
      return flight;
    }

    function reset(element) {
      interrupt(element);
      frames.delete(element);
      elements.delete(element);
      element.style.removeProperty("transform");
      element.style.removeProperty("border-radius");
      element.style.removeProperty("box-shadow");
      element.style.removeProperty("background");
      element.style.removeProperty("visibility");
      element.style.removeProperty("opacity");
      const content = element.querySelector(".app-content");
      for (const property of ["transform", "opacity", "filter", "background"])
        content?.style.removeProperty(property);
      const artwork = element.querySelector(".app-morph-icon");
      if (artwork) artwork.style.opacity = "0";
    }

    function measure(element, radius = 0) {
      const phone = screen.getBoundingClientRect();
      const rect = element.getBoundingClientRect();
      const scale = phone.width / width || 1;
      return [
        (rect.left - phone.left) / scale,
        (rect.top - phone.top) / scale,
        rect.width / scale,
        rect.height / scale,
        radius,
      ];
    }

    return { full, draw, animate, pose, interrupt, reset, measure };
  }

  // Save route stacks separately from DOM snapshots. A captured form stays inert,
  // and resuming an application rebuilds the live screen with its original route.
  function createRecentWindows(initial) {
    const order = [...initial];
    const retained = new Map();
    return {
      list: () => order.slice(),
      focus(id) {
        const index = order.indexOf(id);
        if (index >= 0) order.splice(index, 1);
        order.unshift(id);
      },
      remember(id, routes, element) {
        if (!id || !element) return;
        const snapshot = element.cloneNode(true);
        snapshot.removeAttribute("style");
        snapshot.querySelector(".app-content")?.removeAttribute("style");
        snapshot.querySelector(".app-morph-icon")?.remove();
        // Duplicate IDs in a preview must never win document-level DOM queries.
        snapshot
          .querySelectorAll("[id]")
          .forEach((node) => node.removeAttribute("id"));
        snapshot.inert = true;
        retained.set(id, {
          routes: routes.map((route) => ({ ...route })),
          snapshot,
        });
      },
      preview: (id) => retained.get(id)?.snapshot.cloneNode(true),
      restore: (id) =>
        (retained.get(id)?.routes || [{}]).map((route) => ({ ...route })),
      remove(id) {
        retained.delete(id);
        const index = order.indexOf(id);
        if (index >= 0) order.splice(index, 1);
      },
      clear() {
        order.length = 0;
        retained.clear();
      },
    };
  }
  window.LiquidWindows = Object.freeze({
    createWindowSurfaces,
    createRecentWindows,
  });
})();
