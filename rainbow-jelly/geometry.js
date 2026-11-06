// Geometry is kept in material space: cutting interpolates the original UVs.
const EPSILON = 1e-7;
const MIN_CUT_LENGTH = 8;

const cross = (a, b) => a.x * b.y - a.y * b.x;
const subtract = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
const distanceSquared = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

function signedDoubleArea(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    sum += cross(points[i], points[(i + 1) % points.length]);
  }
  return sum;
}

export function polygonArea(points) {
  return Math.abs(signedDoubleArea(points)) / 2;
}

export function centroid(points) {
  if (!points.length) return { x: 0, y: 0 };
  const twiceArea = signedDoubleArea(points);
  if (Math.abs(twiceArea) < EPSILON) {
    return {
      x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
      y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
    };
  }
  let x = 0;
  let y = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const weight = cross(a, b);
    x += (a.x + b.x) * weight;
    y += (a.y + b.y) * weight;
  }
  return { x: x / (3 * twiceArea), y: y / (3 * twiceArea) };
}

// Boundary points belong to the polygon, which makes pin hit-testing stable.
export function pointInPolygon(point, points) {
  if (points.length < 3) return false;
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[j];
    const b = points[i];
    const edge = subtract(b, a);
    const relative = subtract(point, a);
    const length = Math.hypot(edge.x, edge.y);
    if (length > EPSILON && Math.abs(cross(edge, relative)) / length <= EPSILON) {
      const dot = relative.x * edge.x + relative.y * edge.y;
      if (dot >= -EPSILON && dot <= length * length + EPSILON) return true;
    }
    if ((a.y > point.y) !== (b.y > point.y)
      && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

function interpolate(a, b, t) {
  const point = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  for (const key of ['u', 'v']) {
    if (Number.isFinite(a[key]) && Number.isFinite(b[key])) {
      point[key] = a[key] + (b[key] - a[key]) * t;
    }
  }
  return point;
}

function removeDuplicateVertices(points) {
  const result = [];
  for (const point of points) {
    if (!result.length || distanceSquared(point, result[result.length - 1]) > EPSILON ** 2) {
      result.push(point);
    }
  }
  if (result.length > 1 && distanceSquared(result[0], result[result.length - 1]) <= EPSILON ** 2) {
    result.pop();
  }
  return result;
}

function clipHalfPlane(points, signedDistance, side) {
  const clipped = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const da = signedDistance(a) * side;
    const db = signedDistance(b) * side;
    const aInside = da >= -EPSILON;
    const bInside = db >= -EPSILON;
    if (aInside) clipped.push({ ...a });
    if (aInside !== bInside) {
      clipped.push(interpolate(a, b, Math.max(0, Math.min(1, da / (da - db)))));
    }
  }
  return removeDuplicateVertices(clipped);
}

/**
 * Split a convex polygon only when the actual gesture crosses its boundary twice.
 * The returned polygons retain winding and original material coordinates.
 * Lines shorter than eight coordinate units and fragments below minArea are ignored.
 */
export function splitPolygon(points, start, end, minArea = 120) {
  if (points.length < 3 || !Number.isFinite(minArea)) return null;
  const direction = subtract(end, start);
  const length = Math.hypot(direction.x, direction.y);
  if (!Number.isFinite(length) || length < MIN_CUT_LENGTH) return null;
  const signedDistance = (point) => cross(direction, subtract(point, start)) / length;
  const intersections = [];

  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const da = signedDistance(a);
    const db = signedDistance(b);
    // A cut along an existing edge is a graze, even if its endpoints are crossed.
    if (Math.abs(da) <= EPSILON && Math.abs(db) <= EPSILON) return null;
    if ((da > EPSILON && db > EPSILON) || (da < -EPSILON && db < -EPSILON)) continue;
    const denominator = da - db;
    if (Math.abs(denominator) <= EPSILON) continue;
    const intersection = interpolate(a, b, Math.max(0, Math.min(1, da / denominator)));
    const relative = subtract(intersection, start);
    const along = (relative.x * direction.x + relative.y * direction.y) / length;
    if (along < -EPSILON || along > length + EPSILON) continue;
    // A vertex belongs to two edges but represents only one boundary crossing.
    if (!intersections.some((existing) => distanceSquared(existing, intersection) <= EPSILON ** 2)) {
      intersections.push(intersection);
    }
  }

  if (intersections.length !== 2 || distanceSquared(intersections[0], intersections[1]) <= EPSILON ** 2) return null;
  const positive = clipHalfPlane(points, signedDistance, 1);
  const negative = clipHalfPlane(points, signedDistance, -1);
  const threshold = Math.max(EPSILON, minArea);
  if (positive.length < 3 || negative.length < 3
    || polygonArea(positive) < threshold || polygonArea(negative) < threshold) return null;
  return [positive, negative];
}
