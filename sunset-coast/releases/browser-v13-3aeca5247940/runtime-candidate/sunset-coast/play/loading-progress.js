// FileLoader reports decoded bytes, while Content-Length may describe gzip.
// Keep this decoded size tied to the shipped GLB in loading-progress.mjs.
export const LUCENT_VISION_BYTES=11758564;
export function decodedModelProgress(event){
 const loaded=Number.isFinite(event.loaded)&&event.loaded>=0?event.loaded:0;
 // A mismatched asset must fall back to byte counts, never a fabricated percent.
 const total=loaded<=LUCENT_VISION_BYTES?LUCENT_VISION_BYTES:0;
 return {loaded,total,lengthComputable:total>0};
}
