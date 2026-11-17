import { env, InferenceSession, Tensor } from './ort.wasm.min.mjs';

env.wasm.numThreads = 1;
env.wasm.wasmPaths = {
  mjs: new URL('./ort-wasm-simd-threaded.mjs', import.meta.url).href,
  wasm: new URL('./ort-wasm-simd-threaded.wasm', import.meta.url).href
};
let session;
let queue = Promise.resolve();

async function classify(rgba) {
  if (!session) {
    session = await InferenceSession.create(new URL('./safety-xs.onnx', import.meta.url).href, {
      executionProviders: ['wasm']
    });
  }
  // The ONNX graph takes planar RGB in [0,255] and includes normalization and softmax.
  const plane = 224 * 224;
  const rgb = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    rgb[i] = rgba[4 * i];
    rgb[i + plane] = rgba[4 * i + 1];
    rgb[i + 2 * plane] = rgba[4 * i + 2];
  }
  const input = new Tensor('float32', rgb, [1, 3, 224, 224]);
  try {
    const outputs = await session.run({ [session.inputNames[0]]: input });
    const result = outputs[session.outputNames[0]];
    try {
      const scores = result.data;
      const [gore, sexual, safe] = scores;
      return scores.length === 3 &&
        scores.every(value => Number.isFinite(value) && value >= 0 && value <= 1) &&
        gore < 0.1 && sexual < 0.1 && safe >= 0.9;
    } finally {
      result.dispose();
    }
  } finally {
    input.dispose();
  }
}

self.onmessage = ({ data: { id, pixels } }) => {
  queue = queue.then(async () => {
    try {
      const allowed = await classify(pixels);
      self.postMessage({ id, allowed });
    } catch {
      self.postMessage({ id, allowed: false, unavailable: true });
    }
  });
};
