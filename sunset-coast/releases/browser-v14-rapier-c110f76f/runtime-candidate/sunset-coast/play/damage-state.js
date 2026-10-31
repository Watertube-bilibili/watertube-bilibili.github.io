// Pure save-data contract. Loading or validating a slot must not load the renderer.
export const DAMAGE_REGIONS=Object.freeze(['front','rear','left','right']);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const finite=(n,f)=>Number.isFinite(n)?n:f;

/** Returns a fresh bounded map, or null for absent/invalid legacy data. */
export function sanitizeDamageRegions(value) {
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  if(!DAMAGE_REGIONS.some(k=>Number.isFinite(value[k])))return null;
  return Object.fromEntries(DAMAGE_REGIONS.map(k=>[k,clamp(finite(value[k],0),0,1)]));
}
export const validateDamageRegions=sanitizeDamageRegions;
