/* Session-scoped layout, accessibility and motion for the optical control sheet. */
(() => {
  "use strict";
  const connections = [
    ["wifi", "无线局域网"],
    ["bluetooth", "蓝牙"],
    ["airplane", "飞行模式"],
    ["signal", "蜂窝连接"],
  ];
  const shortcuts = [
    [
      "计时器",
      'data-open="clock"',
      '<circle cx="12" cy="13" r="8"/><path d="M12 8v5l3 2M9 2h6"/>',
    ],
    [
      "备忘录",
      'data-open="notes"',
      '<path d="M5 3h14v18H5zM8 8h8M8 12h8M8 16h5"/>',
    ],
    [
      "锁屏",
      'data-act="lock"',
      '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/>',
    ],
    [
      "玻璃工坊",
      'data-open="glass"',
      '<rect x="4" y="4" width="16" height="16" rx="5"/><path d="M8 11V8h3m5 5v3h-3"/>',
    ],
  ];
  const svg = (path) =>
    '<svg viewBox="0 0 24 24" aria-hidden="true">' + path + "</svg>";
  const speaker = svg(
    '<path d="m4 9 5 0 5-5v16l-5-5H4zM17 8q4 4 0 8M20 5q6 7 0 14"/>',
  );
  const sun = svg(
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  );
  function slider(id, fillId, name, value, min, glyph) {
    return `<label class="cc-slider cc-piece" data-refract>
      <span class="cc-fill" id="${fillId}" style="height:${value}%"></span>
      <input type="range" class="vertical-range" id="${id}" aria-label="${name}" aria-orientation="vertical" min="${min}" max="100" value="${value}">
      ${glyph}<small>${name}</small></label>`;
  }
  function markup(state) {
    const connectionButtons = connections
      .map(([key, name]) => {
        const on = state.connections[key];
        return `<button class="cc-connect ${on ? "on" : ""}" data-connect="${key}" data-refract aria-label="${name}" aria-pressed="${on}">${uiIcon(key)}<span>${name}</span></button>`;
      })
      .join("");
    const shortcutsRow = shortcuts
      .map(
        ([name, action, shape]) =>
          `<button class="cc-shortcut cc-piece" data-refract ${action} aria-label="${name}">${svg(shape)}<small>${name}</small></button>`,
      )
      .join("");
    return `<section class="control-center" aria-label="控制中心">
      <canvas class="control-optics" id="controlOptics" aria-hidden="true"></canvas>
      <div class="cc-content">
        <div class="control-heading cc-grab"><h2>控制中心</h2><button data-act="overlay-close" aria-label="收起控制中心">${svg('<path d="m5 15 7-7 7 7"/>')}</button></div>
        <div class="cc-grid">
          <div class="cc-connectivity cc-piece" data-refract>${connectionButtons}</div>
          <div class="cc-music cc-piece" data-refract>
            <button class="cc-album" data-open="music" aria-label="打开留声机"><span class="cc-cover"></span><span class="cc-metadata"><small>留声机</small><b id="ccTrackTitle" data-control-track></b></span></button>
            <div class="cc-music-buttons"><button data-act="music-prev" aria-label="上一首">${uiIcon("prev")}</button><button data-control-play aria-label="播放或暂停">${uiIcon(state.playing ? "pause" : "play")}</button><button data-act="music-next" aria-label="下一首">${uiIcon("next")}</button></div>
          </div>
          ${slider("brightness", "brightnessFill", "亮度", state.brightness, 20, sun)}
          ${slider("controlVolume", "volumeFill", "音量", state.volume, 0, speaker)}
          <button class="cc-wide cc-piece" data-refract data-act="night">${uiIcon("moon")}<span>深色外观<small id="ccNightLabel">${state.night ? "已开启" : "已关闭"}</small></span></button>
          <button class="cc-wide cc-piece" data-refract data-act="mute">${speaker}<span>提示声音<small id="ccSoundLabel">${state.sound ? "已开启" : "已静音"}</small></span></button>
          ${shortcutsRow}
        </div>
        <button class="cc-grab cc-bottom" data-act="overlay-close" aria-label="上滑收起控制中心"><span></span></button>
      </div>
    </section>`;
  }

  class ControlSheet {
    constructor(mount, state, backdrop) {
      mount.innerHTML = markup(state);
      this.node = mount.querySelector(".control-center");
      this.progress = 0;
      this.velocity = 0;
      this.animation = null;
      this.node.querySelector("#ccTrackTitle").textContent = state.title;
      this.canvas = this.node.querySelector("#controlOptics");
      this.lenses = Array.from(this.node.querySelectorAll("[data-refract]"));
      this.tiles = Array.from(this.node.querySelectorAll(".cc-piece"));
      this.heading = this.node.querySelector(".control-heading");
      this.handle = this.node.querySelector(".cc-bottom");
      this.glass = createOptics(
        this.canvas,
        backdrop,
        (bounds) => this.measure(bounds),
        {
          scene: 1,
          focus: 0,
          strength: state.refraction / 100,
          depth: state.depth / 100,
          liquid: state.material === "liquid" ? 1 : 0,
          highlight: state.highlight ? 1 : 0,
        },
      );
      this.node.addEventListener("pointermove", (event) => {
        if (!state.highlight) return;
        const bounds = this.canvas.getBoundingClientRect();
        this.glass.update({
          light: [event.clientX - bounds.left, event.clientY - bounds.top],
        });
      });
      this.node.addEventListener("pointerdown", (event) => {
        if (event.target.closest("button,label")) this.glass.impulse(0.48);
      });
      this.paint(0, 0);
    }
    measure(bounds) {
      const ratio = bounds.width / (this.canvas.clientWidth || 354);
      return this.lenses.map((element) => {
        const rect = element.getBoundingClientRect();
        const radius =
          parseFloat(getComputedStyle(element).borderRadius) * ratio ||
          18 * ratio;
        return {
          x: rect.left - bounds.left + rect.width / 2,
          y: rect.top - bounds.top + rect.height / 2,
          w: rect.width,
          h: rect.height,
          r: Math.min(radius, rect.width / 2, rect.height / 2),
        };
      });
    }
    paint(value, velocity = 0) {
      this.progress = value;
      this.velocity = velocity;
      const progress = LiquidMotion.clamp(value);
      this.node.style.pointerEvents = progress > 0.01 ? "auto" : "none";
      this.canvas.style.opacity = LiquidMotion.smooth(0, 0.25, progress);
      this.heading.style.opacity = LiquidMotion.smooth(0.02, 0.52, progress);
      this.heading.style.transform =
        "translateY(" + (1 - progress) * -25 + "px)";
      this.handle.style.opacity = LiquidMotion.smooth(0.55, 1, progress);
      this.tiles.forEach((tile, index) => {
        const lag = Math.min(0.18, index * 0.02);
        const local = LiquidMotion.clamp((progress - lag) / (1 - lag));
        const offset = (1 - local) * (1 - local);
        const overshoot = Math.max(0, value - 1);
        tile.style.transform = `translateY(${-offset * (65 + index * 8)}px) scale(${1 - 0.09 * offset + overshoot * 0.08},${1 - 0.14 * offset - overshoot * 0.05})`;
        tile.style.opacity = LiquidMotion.smooth(0.01, 0.55, local);
      });
      this.glass.update({ focus: progress });
    }
    settle(open, velocity, speed, onComplete) {
      this.animation?.cancel();
      if (open)
        this.glass.impulse(Math.min(1.4, 0.42 + Math.abs(velocity) * 0.22));
      const animation = LiquidMotion.spring({
        from: [this.progress],
        to: [open ? 1 : 0],
        velocity: [velocity],
        stiffness: open ? 238 : 310,
        damping: open ? 24 : 31,
        speed,
        update: ([progress], [v]) => this.paint(progress, v),
      });
      this.animation = animation;
      animation.finished
        .then(() => {
          if (this.animation === animation) onComplete();
        })
        .catch(() => {});
    }
    destroy() {
      this.animation?.cancel();
      this.glass.destroy();
      this.node.remove();
    }
  }
  window.ControlSheet = ControlSheet;
})();
