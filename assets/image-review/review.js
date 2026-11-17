let worker;
let nextID = 0;
let idleTimer;
const pending = new Map();

function stopWorker() {
  clearTimeout(idleTimer);
  if (worker) worker.terminate();
  worker = undefined;
  for (const request of pending.values()) {
    clearTimeout(request.timer);
    request.resolve({ allowed: false, unavailable: true });
  }
  pending.clear();
}

function getWorker() {
  clearTimeout(idleTimer);
  if (worker) return worker;
  worker = new Worker(new URL('./review-worker.js', import.meta.url), { type: 'module' });
  worker.onerror = stopWorker;
  worker.onmessageerror = stopWorker;
  worker.onmessage = ({ data }) => {
    const request = pending.get(data.id);
    if (!request) return;
    clearTimeout(request.timer);
    pending.delete(data.id);
    request.resolve({ allowed: data.allowed === true, unavailable: data.unavailable === true });
    if (!pending.size) idleTimer = setTimeout(stopWorker, 60000);
  };
  return worker;
}

export async function reviewImage(canvas) {
  try {
    if (!canvas.width || !canvas.height) return { allowed: false };
    // Snapshot now, before loading the model or yielding to another selection.
    const sample = document.createElement('canvas');
    sample.width = sample.height = 224;
    const context = sample.getContext('2d', { alpha: false });
    context.fillStyle = '#fff';
    context.fillRect(0, 0, 224, 224);
    context.drawImage(canvas, 0, 0, 224, 224);
    const pixels = context.getImageData(0, 0, 224, 224).data;
    const runner = getWorker();
    const id = ++nextID;
    return await new Promise(resolve => {
      const timer = setTimeout(stopWorker, 120000);
      pending.set(id, { resolve, timer });
      runner.postMessage({ id, pixels }, [pixels.buffer]);
    });
  } catch {
    return { allowed: false, unavailable: true };
  }
}
