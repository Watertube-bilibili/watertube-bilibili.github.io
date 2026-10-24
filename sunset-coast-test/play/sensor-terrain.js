// Camera engine labels, not a terrain-height oracle. The existing scene already
// identifies its heightfield mesh; a hill must not share a wall's semantic ID.
export const TERRAIN_CLASS = 6;
export function cameraSemanticClass(object) {
  return object.userData?.terrain ? TERRAIN_CLASS : (object.userData?.semantic ?? 0);
}

// A local normal from *visible depth pixels*. This is only obstacle perception,
// not a climbing guarantee: tire forces, grade, clearance and gravity still
// decide whether a particular vehicle can climb the observed surface.
export function observedTerrainNormal(center, horizontal, vertical) {
  if (!center || !horizontal || !vertical) return null;
  const delta = p => [p.worldX-center.worldX,p.height-center.height,p.worldZ-center.worldZ];
  const a=delta(horizontal),b=delta(vertical),limit=Math.max(.5,center.distance*.15);
  if (Math.hypot(...a)>limit || Math.hypot(...b)>limit) return null;
  const n=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],length=Math.hypot(...n);
  return length>1e-7 ? Math.abs(n[1])/length : null;
}

// Slopes through 45 degrees are ground, not a stationary car-height wall.
// Steeper observed terrain still enters the ordinary obstacle/AEB pipeline.
// Missing depth does not invent an obstacle behind a crest or an image edge.
export function terrainBlocksCamera(normalY) {
  return normalY !== null && normalY < Math.SQRT1_2;
}
