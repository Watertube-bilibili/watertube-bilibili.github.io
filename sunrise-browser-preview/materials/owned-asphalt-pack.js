// Loaded before Game construction. Reuses the delivered Codex r180 adapter verbatim.
import {installAsphaltPBR} from './asphalt-pbr.mjs';

export async function createOwnedAsphaltPack(THREE, {
  fallback = null, size = 512, loader = new THREE.TextureLoader(),
  baseURL = new URL('./assets/asphalt_01/', import.meta.url),
} = {}) {
  if (![512, 1024].includes(size)) throw new Error('Unsupported Asphalt 01 texture size');
  const maps = {}, owned = new Set(), materials = new Set();
  let disposed = false;
  const results = await Promise.allSettled(['color', 'arm'].map(async kind => {
    const texture = await loader.loadAsync(new URL(`asphalt_01_${kind}_${size}.webp`, baseURL).href);
    owned.add(texture); texture.name = `polyhaven-asphalt01-${kind}-${size}`; maps[kind] = texture;
  }));
  const failed = results.find(result => result.status === 'rejected');
  if (failed) { owned.forEach(texture => texture.dispose()); throw failed.reason; }
  return {
    source: 'Poly Haven Asphalt 01 / CC0', size,
    surface(kind) {
      if (disposed) throw new Error('Asphalt pack disposed');
      if (kind !== 'asphalt') return fallback?.surface(kind) ?? null;
      const material = new THREE.MeshStandardMaterial({side: THREE.DoubleSide});
      installAsphaltPBR(THREE, material, maps);
      material.name = 'photographic-asphalt01'; materials.add(material);
      return material;
    },
    slopeFallback() {
      if (disposed) throw new Error('Asphalt pack disposed');
      const material = fallback?.surface('asphalt') ?? new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:1});
      material.name = 'original-asphalt-steep-slope'; if (!fallback) materials.add(material); return material;
    },
    glass(options) { return fallback?.glass(options) ?? null; },
    configureRenderer(renderer) {
      if (!renderer?.capabilities) return; // Preserve the original startup error if WebGL is unavailable.
      const anisotropy = Math.max(1, Math.min(4, renderer.capabilities.getMaxAnisotropy()));
      owned.forEach(texture => { texture.anisotropy = anisotropy; texture.needsUpdate = true; });
    },
    dispose() {
      if (disposed) return; disposed = true;
      materials.forEach(material => material.dispose()); owned.forEach(texture => texture.dispose());
      fallback?.dispose();
    },
    get textureCount() { return owned.size + (fallback?.textureCount ?? 0); },
  };
}
