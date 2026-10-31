/* SPDX-License-Identifier: AGPL-3.0-only */
/* A real manual stopwatch. It does not run an experiment model on each tick. */
(() => {
  'use strict';
  let active = null;
  const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-${name}"/></svg>`;
  const hundredths = seconds => Math.floor(Math.max(0, seconds) * 100) / 100;
  const display = seconds => {
    const total = Math.floor(Math.max(0, seconds) * 100);
    const minutes = Math.floor(total / 6000);
    const rest = total % 6000;
    return `${String(minutes).padStart(2, '0')}:${String(Math.floor(rest / 100)).padStart(2, '0')}.${String(rest % 100).padStart(2, '0')}`;
  };

  function mount(container, {onTick, onStop, onReset} = {}) {
    active?.dispose();
    let phase = 'idle';
    let accumulated = 0;
    let startedAt = 0;
    let lastTick = -Infinity;
    let interval = null;
    let disposed = false;
    const listeners = new AbortController();
    container.innerHTML = `<style>
      .manual-timer{padding:16px 18px;background:linear-gradient(#e5e9e9,#c3d0d5);border-top:1px solid #9aaeb9;border-bottom:1px solid #fff;color:#28485f}
      .manual-timer-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;font-size:13px}
      .manual-timer-display{display:block;padding:7px 12px;border:2px inset #8da18c;background:#d3e2c5;color:#243b2c;text-align:center;font:36px/1.3 "Courier New",monospace;letter-spacing:2px;font-variant-numeric:tabular-nums}
      .manual-timer-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:12px}
      .manual-timer-note{margin:8px 0 0;text-align:center;font-size:12px;color:#4a6372}
    </style><section class="manual-timer" aria-label="手动秒表">
      <div class="manual-timer-heading"><strong>手动秒表</strong><span data-timer-status>等待开始</span></div>
      <output class="manual-timer-display" data-timer-display aria-label="累计计时时间">00:00.00</output>
      <div class="manual-timer-actions">
        <button type="button" data-timer-action="start">${icon('play')}开始</button>
        <button type="button" data-timer-action="pause" disabled>${icon('pause')}暂停</button>
        <button type="button" data-timer-action="record" disabled>${icon('note')}记录并停止</button>
        <button type="button" data-timer-action="reset">${icon('reset')}清零</button>
      </div>
      <p class="manual-timer-note">显示格式：分:秒.百分秒；按实际观察手动记录。</p>
    </section>`;
    const output = container.querySelector('[data-timer-display]');
    const status = container.querySelector('[data-timer-status]');
    const buttons = Object.fromEntries([...container.querySelectorAll('[data-timer-action]')].map(button => [button.dataset.timerAction, button]));
    const seconds = () => (accumulated + (phase === 'running' ? performance.now() - startedAt : 0)) / 1000;

    function update() {
      const value = seconds();
      output.textContent = display(value);
      const now = performance.now();
      if (now - lastTick >= 100) {
        lastTick = now;
        onTick?.(hundredths(value));
      }
    }
    function controls() {
      const running = phase === 'running';
      const paused = phase === 'paused';
      buttons.start.disabled = running || paused;
      buttons.start.innerHTML = icon('play') + (phase === 'recorded' ? '重新计时' : '开始');
      buttons.pause.disabled = !running && !paused;
      buttons.pause.innerHTML = icon(paused ? 'play' : 'pause') + (paused ? '继续' : '暂停');
      buttons.record.disabled = !running && !paused;
      status.textContent = {idle:'等待开始', running:'正在计时', paused:'已暂停', recorded:'已记录'}[phase];
    }
    function stopInterval() {
      clearInterval(interval);
      interval = null;
    }
    function begin() {
      startedAt = performance.now();
      phase = 'running';
      controls();
      update();
      interval = setInterval(update, 100);
    }
    function hold() {
      if (phase === 'running') accumulated += performance.now() - startedAt;
      stopInterval();
    }
    function reset() {
      stopInterval();
      phase = 'idle';
      accumulated = 0;
      output.textContent = display(0);
      controls();
      onReset?.();
    }
    buttons.start.addEventListener('click', () => {
      if (phase === 'recorded') {
        accumulated = 0;
        onReset?.();
      }
      begin();
    }, {signal:listeners.signal});
    buttons.pause.addEventListener('click', () => {
      if (phase === 'running') {
        hold();
        phase = 'paused';
        update();
        controls();
      } else if (phase === 'paused') begin();
    }, {signal:listeners.signal});
    buttons.record.addEventListener('click', () => {
      hold();
      phase = 'recorded';
      update();
      controls();
      onStop?.(hundredths(seconds()));
    }, {signal:listeners.signal});
    buttons.reset.addEventListener('click', reset, {signal:listeners.signal});
    const controller = {
      get state() { return {phase, seconds:hundredths(seconds()), disposed}; },
      dispose() {
        if (disposed) return;
        hold();
        phase = 'idle';
        disposed = true;
        listeners.abort();
        container.replaceChildren();
        if (active === controller) active = null;
      }
    };
    active = controller;
    controls();
    return controller;
  }
  window.LabManualTimer = {mount, dispose() {active?.dispose();}};
})();
