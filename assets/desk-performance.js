(function () {
  'use strict';

  var root = document.documentElement;
  var css = window.CSS;
  if (!css || !css.supports ||
      !(css.supports('backdrop-filter', 'blur(1px)') || css.supports('-webkit-backdrop-filter', 'blur(1px)')) ||
      !window.requestAnimationFrame || !window.cancelAnimationFrame || !window.matchMedia) {
    root.setAttribute('data-glass-tier', 'lite');
    return;
  }

  var tiers = ['lite', 'balanced', 'full'];
  var lessTransparency = window.matchMedia('(prefers-reduced-transparency: reduce)');
  var forcedColors = window.matchMedia('(forced-colors: active)');
  var lessMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var lessData = window.matchMedia('(prefers-reduced-data: reduce)');
  var connection = navigator.connection;
  var cores = navigator.hardwareConcurrency;
  var memory = navigator.deviceMemory;
  var ua = navigator.userAgent || '';
  var android = /Android\s+(\d+)/i.exec(ua);
  var mobile = navigator.userAgentData ? navigator.userAgentData.mobile : /Mobile/i.test(ua);
  var measuredTier = 1;
  var samples = 0;
  var startTimer = 0;
  var endTimer = 0;
  var frame = 0;

  function deviceLimit() {
    if (lessTransparency.matches || forcedColors.matches ||
        (cores > 0 && cores <= 2) || (memory > 0 && memory <= 2)) return 0;
    // A sparse or frozen UA is normal. Only explicit legacy signals cap the ceiling.
    if ((mobile && android && Number(android[1]) < 8) || /KaiOS|Opera Mini|Android Go Edition/i.test(ua) ||
        (cores > 0 && cores <= 4 && memory > 0 && memory <= 4) ||
        lessMotion.matches || lessData.matches || (connection && connection.saveData)) return 1;
    return 2;
  }

  function applyTier() {
    root.setAttribute('data-glass-tier', tiers[Math.min(deviceLimit(), measuredTier)]);
  }

  function stopSample() {
    window.clearTimeout(startTimer);
    window.clearTimeout(endTimer);
    window.cancelAnimationFrame(frame);
    startTimer = endTimer = frame = 0;
  }

  function measure() {
    startTimer = 0;
    if (document.hidden || deviceLimit() === 0) return;

    var intervals = [];
    var previous = null;
    function finish() {
      stopSample();
      if (document.hidden) return;
      samples++;
      if (intervals.length >= 6) {
        var sorted = intervals.sort(function (a, b) { return a - b; });
        var cadence = sorted[Math.floor(sorted.length / 2)];
        // Relative misses distinguish an uneven renderer from a steady 30 Hz display.
        var late = sorted.filter(function (ms) { return ms > Math.max(26, cadence * 1.6); }).length;
        var misses = late / sorted.length;
        if (misses >= 0.27) measuredTier = 0;
        else if (cadence > 25 || misses >= 0.12) measuredTier = 1;
        else measuredTier = 2;
      } else {
        measuredTier = 1;
      }
      applyTier();
      if (samples >= 2) document.removeEventListener(pressEvent, onPress, true);
    }
    function tick(time) {
      if (document.hidden) { stopSample(); return; }
      if (previous !== null && time > previous) intervals.push(time - previous);
      previous = time;
      if (intervals.length === 42) finish();
      else frame = window.requestAnimationFrame(tick);
    }
    endTimer = window.setTimeout(finish, 1450);
    frame = window.requestAnimationFrame(tick);
  }

  function schedule(delay) {
    if (samples >= 2 || document.readyState !== 'complete' || document.hidden ||
        deviceLimit() === 0 || startTimer || endTimer) return;
    startTimer = window.setTimeout(measure, delay);
  }

  function refresh() {
    if (document.hidden || deviceLimit() === 0) stopSample();
    applyTier();
    if (!samples) schedule(240);
  }

  // First observe the loaded page, then take one more reading during a real interaction.
  var pressEvent = 'PointerEvent' in window ? 'pointerdown' : 'mousedown';
  function onPress() {
    if (samples === 1) schedule(0);
  }
  document.addEventListener(pressEvent, onPress, true);
  document.addEventListener('visibilitychange', refresh);
  window.addEventListener('load', refresh);
  [lessTransparency, forcedColors, lessMotion, lessData].forEach(function (query) {
    if (query.addEventListener) query.addEventListener('change', refresh);
    else if (query.addListener) query.addListener(refresh);
  });
  if (connection && connection.addEventListener) connection.addEventListener('change', refresh);
  refresh();
}());
