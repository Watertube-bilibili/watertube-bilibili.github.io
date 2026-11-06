// Closed, rounded 3D solids for convex jelly fragments. No renderer dependency.
// X/Y use the input polygon's coordinates; Z spans the requested full depth.
// UVs remain in the original jelly's material space, including after a cut.

const EPSILON = 1e-8;

function preparePolygon(vertices) {
  if (!Array.isArray(vertices) || vertices.length < 3) {
    throw new RangeError('A jelly solid needs at least three polygon vertices.');
  }
  const points = [];
  for (const vertex of vertices) {
    if (![vertex.x, vertex.y, vertex.u, vertex.v].every(Number.isFinite)) {
      throw new TypeError('Jelly positions and material coordinates must be finite.');
    }
    const previous = points[points.length - 1];
    if (!previous || Math.hypot(vertex.x - previous.x, vertex.y - previous.y) > EPSILON) {
      points.push({ x: vertex.x, y: vertex.y, u: vertex.u, v: vertex.v });
    }
  }
  if (points.length > 1 && Math.hypot(points[0].x - points.at(-1).x, points[0].y - points.at(-1).y) <= EPSILON) {
    points.pop();
  }
  let twiceArea = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    twiceArea += a.x * b.y - b.x * a.y;
  }
  if (points.length < 3 || Math.abs(twiceArea) <= EPSILON) {
    throw new RangeError('The jelly polygon must have a nonzero area.');
  }
  if (twiceArea < 0) points.reverse();

  // Triangular barycentric weights also preserve an affine UV field whose
  // origin differs from the geometry origin (as it does for sliced pieces).
  const first = points[0];
  const center = { x: 0, y: 0, u: 0, v: 0 };
  let weightSum = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    const weight = (a.x - first.x) * (b.y - first.y) - (b.x - first.x) * (a.y - first.y);
    weightSum += weight;
    for (const key of ['x', 'y', 'u', 'v']) center[key] += (first[key] + a[key] + b[key]) * weight / 3;
  }
  for (const key of ['x', 'y', 'u', 'v']) center[key] /= weightSum;
  return { points, center };
}

/**
 * Build an indexed, watertight jelly volume with smooth surface normals.
 *
 * The outer equator matches the source polygon exactly. Front and back rings
 * curve inward to broad rounded faces, so even a thin cut fragment remains an
 * actual solid rather than a translucent flat card. `roundness` ranges 0–1:
 * lower values make broader faces, higher values make an ellipsoid profile.
 * `segments` is an even latitude count, clamped to 6–24 (default 12).
 */
export function buildJellySolid(vertices, { depth, roundness = 0.65, segments = 12 } = {}) {
  const { points, center } = preparePolygon(vertices);
  const count = points.length;
  const width = Math.max(...points.map(point => point.x)) - Math.min(...points.map(point => point.x));
  const height = Math.max(...points.map(point => point.y)) - Math.min(...points.map(point => point.y));
  const fullDepth = depth === undefined ? Math.min(width, height) * 0.72 : depth;
  if (!Number.isFinite(fullDepth) || fullDepth <= 0) throw new RangeError('Jelly depth must be positive.');
  if (!Number.isFinite(roundness) || !Number.isFinite(segments)) throw new TypeError('Jelly shape options must be finite.');
  const latitudeCount = Math.max(6, Math.min(24, Math.round(segments / 2) * 2));
  const ringCount = latitudeCount - 1;
  const exponent = 0.45 + Math.max(0, Math.min(1, roundness)) * 0.55;
  const halfDepth = fullDepth / 2;
  const vertexCount = count * ringCount + 2;
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const indices = new Uint32Array(count * (ringCount - 1) * 6 + count * 6);

  const setVertex = (index, x, y, z, u, v) => {
    positions.set([x, y, z], index * 3);
    uvs.set([u, v], index * 2);
  };
  setVertex(0, center.x, center.y, -halfDepth, center.u, center.v);
  for (let ring = 0; ring < ringCount; ring++) {
    const theta = -Math.PI / 2 + (ring + 1) / latitudeCount * Math.PI;
    const scale = Math.cos(theta) ** exponent;
    const z = Math.sin(theta) * halfDepth;
    for (let i = 0; i < count; i++) {
      const point = points[i];
      setVertex(1 + ring * count + i,
        center.x + (point.x - center.x) * scale,
        center.y + (point.y - center.y) * scale,
        z,
        center.u + (point.u - center.u) * scale,
        center.v + (point.v - center.v) * scale);
    }
  }
  const frontPole = vertexCount - 1;
  setVertex(frontPole, center.x, center.y, halfDepth, center.u, center.v);

  let cursor = 0;
  const triangle = (a, b, c) => {
    indices.set([a, b, c], cursor); cursor += 3;
    const ax = positions[b * 3] - positions[a * 3];
    const ay = positions[b * 3 + 1] - positions[a * 3 + 1];
    const az = positions[b * 3 + 2] - positions[a * 3 + 2];
    const bx = positions[c * 3] - positions[a * 3];
    const by = positions[c * 3 + 1] - positions[a * 3 + 1];
    const bz = positions[c * 3 + 2] - positions[a * 3 + 2];
    const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
    for (const index of [a, b, c]) {
      normals[index * 3] += nx;
      normals[index * 3 + 1] += ny;
      normals[index * 3 + 2] += nz;
    }
  };
  for (let i = 0; i < count; i++) {
    const next = (i + 1) % count;
    triangle(0, 1 + next, 1 + i);
    for (let ring = 0; ring < ringCount - 1; ring++) {
      const a = 1 + ring * count + i, b = 1 + ring * count + next;
      const c = a + count, d = b + count;
      triangle(a, b, c); triangle(b, d, c);
    }
    const lastRing = 1 + (ringCount - 1) * count;
    triangle(lastRing + i, lastRing + next, frontPole);
  }
  for (let i = 0; i < vertexCount; i++) {
    const offset = i * 3;
    const magnitude = Math.hypot(normals[offset], normals[offset + 1], normals[offset + 2]);
    normals[offset] /= magnitude;
    normals[offset + 1] /= magnitude;
    normals[offset + 2] /= magnitude;
  }
  return { positions, normals, uvs, indices };
}
