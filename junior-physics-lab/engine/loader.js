/* Loads the real, single-thread Godot physics runtime used by the experiment. */
(() => {
  'use strict';
  const base = new URL('./', document.currentScript.src);
  let startPhysics = null, resetPhysics = null, evaluatePhysics = null;
  let evaluationSequence = 0, evaluationQueue = Promise.resolve();
  const pendingEvaluations = new Map();
  const dispatch = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));
  const lab = window.GodotLab = {
    ready: false,
    start(params) {
      if (!lab.ready) throw new Error('Physics runtime is not ready.');
      startPhysics(JSON.stringify(params));
    },
    reset() { if (lab.ready) resetPhysics(); },
    evaluate(model, params = {}) {
      const request = () => new Promise((resolve, reject) => {
        if (!lab.ready || !evaluatePhysics) { reject(new Error('Physics runtime is not ready.')); return; }
        const id = ++evaluationSequence;
        const timeout = setTimeout(() => { pendingEvaluations.delete(id); reject(new Error('Physics evaluation timed out.')); }, 30000);
        pendingEvaluations.set(id, { resolve, reject, timeout });
        evaluatePhysics(JSON.stringify({ id, model, params }));
      });
      const current = evaluationQueue.then(request, request);
      evaluationQueue = current.catch(() => {});
      return current;
    }
  };
  window.__godotLabEvaluation = data => {
    const message = JSON.parse(data);
    const pending = pendingEvaluations.get(message.id);
    if (!pending) return;
    clearTimeout(pending.timeout);
    pendingEvaluations.delete(message.id);
    if (message.result.error) pending.reject(new Error(message.result.error));
    else pending.resolve(message.result);
  };
  window.__registerGodotLab = (start, reset, evaluate) => {
    startPhysics = start;
    resetPhysics = reset;
    evaluatePhysics = evaluate;
    lab.ready = true;
    dispatch('godot-ready', { version: '4.6.3' });
  };
  window.__godotLabSample = data => dispatch('godot-sample', JSON.parse(data));
  async function loadRuntime() {
    let canvas = document.getElementById('physicsCanvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'physicsCanvas';
      canvas.width = canvas.height = 16;
      canvas.tabIndex = -1;
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.cssText = 'position:fixed;left:-32px;top:0;width:16px;height:16px;pointer-events:none';
      document.body.append(canvas);
    }
    const binary = fetch(new URL('lab.wasm.bin', base)).then(async response => {
      if (!response.ok) throw new Error('Physics runtime download failed.');
      const total = Number(response.headers.get('content-length')) || 9400000;
      const reader = response.body.getReader();
      const chunks = [];
      let loaded = 0;
      while (true) {
        const result = await reader.read();
        if (result.done) break;
        chunks.push(result.value);
        loaded += result.value.length;
        dispatch('godot-loading', { loaded, total });
      }
      const raw = new Blob(chunks).stream().pipeThrough(new DecompressionStream('gzip'));
      return new Response(raw, { headers: { 'Content-Type': 'application/wasm' } });
    });
    window.__godotWasmResponse = binary;
    // Prevent an unhandled rejection before the engine script has finished loading.
    binary.catch(error => dispatch('godot-error', { message: error.message }));
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL('lab.js', base);
      script.onload = resolve;
      script.onerror = () => reject(new Error('Physics runtime script failed to load.'));
      document.head.append(script);
    });
    const engine = new Engine({
      executable: new URL('lab', base).href,
      canvas,
      canvasResizePolicy: 0,
      focusCanvas: false,
      ensureCrossOriginIsolationHeaders: false,
      persistentPaths: [],
      args: ['--audio-driver', 'Dummy'],
      onPrint: () => {},
      onPrintError: (...args) => console.warn('[Physics]', ...args),
      onExit: code => { if (code) dispatch('godot-error', { message: 'Physics runtime stopped.' }); }
    });
    lab.engine = engine;
    await engine.startGame();
    // Keyboard events remain attached to the offscreen canvas, never the page.
    canvas.tabIndex = -1;
  }
  loadRuntime().catch(error => dispatch('godot-error', { message: error.message }));
})();
