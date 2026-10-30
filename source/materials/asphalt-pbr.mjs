/**
 * SUNRISE COAST — owned Asphalt 01 color + ARM adapter; no bundled texture is claimed.
 * Inject the game's THREE namespace; shader integration was reviewed on r180.
 * Call at the existing road-material factory BEFORE the procedural surface hook.
 * Does not create a material, geometry, texture, decal, or placeholder.
 */

export const ASPHALT_SOURCE = Object.freeze({
  asset: 'asphalt_01', source: 'https://polyhaven.com/a/asphalt_01',
  license: 'CC0-1.0', tileMetres: 2.1,
  provenance: 'Parent-audited Library originals; bytes not materialized in this executor.',
});

function requireTexture(texture, name) {
  if (!texture?.isTexture || !texture.image ||
      !(texture.image.width > 0 && texture.image.height > 0)) {
    throw new Error(`A fully loaded ${name} texture is required; no fallback is created.`);
  }
}

/** Patch an existing, asphalt-only MeshStandardMaterial using already loaded maps. */
export function installAsphaltPBR(THREE, material, maps, {
  renderer, tileMetres = 2.1, worldUnitsPerMetre = 1, normalStrength = 0.35,
  origin = [0, 0, 0], axisU = [1, 0, 0], axisV = [0, 0, -1],
} = {}) {
  if (String(THREE.REVISION) !== '180') {
    throw new Error('Shader adapter is reviewed for Three r180 only; inspect other revisions first.');
  }
  if (!material?.isMeshStandardMaterial) throw new TypeError('Existing road StandardMaterial required.');
  if (material.userData.sunriseAsphaltPBR) throw new Error('Material already has the asphalt adapter.');
  if (material.userData.coastSurface || material.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile ||
      material.customProgramCacheKey !== THREE.Material.prototype.customProgramCacheKey) {
    throw new Error('Install at the road factory before existing procedural/custom shader hooks.');
  }
  for (const key of ['color', 'arm']) requireTexture(maps?.[key], key);
  if (maps.normalGL != null) requireTexture(maps.normalGL, 'normalGL');
  if (![tileMetres, worldUnitsPerMetre].every(v => Number.isFinite(v) && v > 0) ||
      !Number.isFinite(normalStrength) || normalStrength < 0) throw new TypeError('Invalid metric scale.');
  if ([origin, axisU, axisV].some(a => !Array.isArray(a) || a.length !== 3 || !a.every(Number.isFinite))) {
    throw new TypeError('Projection origin and axes must be finite three-component arrays.');
  }
  const u = new THREE.Vector3(...axisU), v = new THREE.Vector3(...axisV);
  if (Math.abs(u.length() - 1) > 1e-6 || Math.abs(v.length() - 1) > 1e-6 || Math.abs(u.dot(v)) > 1e-6) {
    throw new Error('Projection axes must be orthonormal world-space unit vectors.');
  }
  const anisotropy = Math.max(1, Math.min(4, renderer?.capabilities?.getMaxAnisotropy?.() ?? 1));
  for (const [kind, texture] of Object.entries(maps)) {
    if (!['color', 'normalGL', 'arm'].includes(kind) || texture == null) continue;
    texture.colorSpace = kind === 'color' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = anisotropy;
    texture.channel = 0;
    texture.needsUpdate = true;
  }
  material.map = maps.color;
  material.normalMap = maps.normalGL ?? null; // No normal map is invented from AO or roughness.
  material.normalMapType = THREE.TangentSpaceNormalMap;
  material.normalScale.set(normalStrength, normalStrength); // GL map: do not negate green.
  material.roughnessMap = maps.arm; // Three reads the G channel: ARM = AO / Roughness / Metalness.
  material.roughness = 1; // Preserve the source map's values; re-tune only after visual review.
  material.metalness = 0;
  material.metalnessMap = null;
  material.bumpMap = null;
  material.displacementMap = null;
  material.aoMap = null; // AO R is deliberately unused; never treat AO as a height/bump map.
  material.color.setHex(0xffffff);
  material.vertexColors = false;

  const metric = tileMetres * worldUnitsPerMetre;
  const projection = {
    sunriseAsphaltOrigin: { value: new THREE.Vector3(...origin) },
    sunriseAsphaltU: { value: u.divideScalar(metric) },
    sunriseAsphaltV: { value: v.divideScalar(metric) },
  };
  material.onBeforeCompile = shader => {
    if (!shader.vertexShader.includes('#include <worldpos_vertex>') ||
        !shader.fragmentShader.includes('#include <color_fragment>')) {
      throw new Error('Unexpected Three shader chunks; asphalt adapter was not applied.');
    }
    Object.assign(shader.uniforms, projection);
    shader.vertexShader = `uniform vec3 sunriseAsphaltOrigin;
uniform vec3 sunriseAsphaltU;
uniform vec3 sunriseAsphaltV;
` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
      vec4 sunriseAsphaltPosition = vec4(transformed, 1.0);
      #ifdef USE_BATCHING
        sunriseAsphaltPosition = batchingMatrix * sunriseAsphaltPosition;
      #endif
      #ifdef USE_INSTANCING
        sunriseAsphaltPosition = instanceMatrix * sunriseAsphaltPosition;
      #endif
      vec3 sunriseAsphaltWorld = (modelMatrix * sunriseAsphaltPosition).xyz - sunriseAsphaltOrigin;
      vec2 sunriseAsphaltUV = vec2(dot(sunriseAsphaltWorld, sunriseAsphaltU), dot(sunriseAsphaltWorld, sunriseAsphaltV));
      #ifdef USE_MAP
        vMapUv = sunriseAsphaltUV;
      #endif
      #ifdef USE_NORMALMAP
        vNormalMapUv = sunriseAsphaltUV;
      #endif
      #ifdef USE_ROUGHNESSMAP
        vRoughnessMapUv = sunriseAsphaltUV;
      #endif`);
    // Force derivative TBN to match the world UV, even when geometry has legacy tangents.
    shader.fragmentShader = '#undef USE_TANGENT\n' + shader.fragmentShader;
    // r180 instanceColor applies even when vertexColors=false. Ignore tint only here.
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>',
      '// Asphalt-only material: source albedo replaces the old vertex/instance road tint.');
  };
  material.customProgramCacheKey = () => 'sunrise-asphalt01-arm-pbr-r180-world-projection-v1';
  material.userData.sunriseAsphaltPBR = {
    source: ASPHALT_SOURCE.source, tileMetres, worldUnitsPerMetre,
    projection: 'world-plane', origin: [...origin], axisU: [...axisU], axisV: [...axisV],
    sharedMaps: true, channels: 'R=AO unused; G=roughness; B=metalness ignored',
    hasNormalMap: Boolean(maps.normalGL), normalStrengthProvisional: Boolean(maps.normalGL),
  };
  material.needsUpdate = true;
  return material;
}

/** Pure coordinate reference for seam/metric verification; units match installAsphaltPBR. */
export function projectAsphaltUV(worldPosition, {
  tileMetres = 2.1, worldUnitsPerMetre = 1, origin = [0, 0, 0],
  axisU = [1, 0, 0], axisV = [0, 0, -1],
} = {}) {
  const p = worldPosition.map((n, i) => n - origin[i]);
  const d = tileMetres * worldUnitsPerMetre;
  return [axisU, axisV].map(axis => p.reduce((sum, n, i) => sum + n * axis[i], 0) / d);
}
