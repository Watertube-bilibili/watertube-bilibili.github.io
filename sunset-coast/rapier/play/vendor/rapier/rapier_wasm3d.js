// Browser ESM adapter for the official @dimforge/rapier3d 0.21.0 separated WASM.
// Upstream wasm-bindgen glue is unchanged; only its bundler-specific entry is replaced.
import * as glue from './rapier_wasm3d_bg.js';
export * from './rapier_wasm3d_bg.js';
let pending;
export function initRapierWasm(source = new URL('./rapier_wasm3d_bg.wasm', import.meta.url)) {
 if (!pending) pending = (async () => {
  const bytes = source instanceof ArrayBuffer || ArrayBuffer.isView(source) ? source : await (async () => {
   const response = await fetch(source);
   if (!response.ok) throw Error('Rapier WASM HTTP ' + response.status);
   return response.arrayBuffer();
  })();
  const {instance} = await WebAssembly.instantiate(bytes, {'./rapier_wasm3d_bg.js': glue});
  glue.__wbg_set_wasm(instance.exports);
  instance.exports.__wbindgen_start?.();
 })().catch(error => { pending = undefined; throw error; });
 return pending;
}
