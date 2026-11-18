extends RefCounted
## Collision queries for streamed geometry. Triangle descriptors are closed meshes
## in world coordinates and come from the same geometry used by the renderer.

const TIRE_HALF_TREAD := 0.16
const EPSILON := 0.0001
const BODY_VOLUMES: Array[AABB] = [
	AABB(Vector3(-.88, .78, -1.75), Vector3(1.76, 1.34, 2.28)),
	AABB(Vector3(-.91, .26, -1.98), Vector3(1.82, .60, 3.88)),
	AABB(Vector3(-1.10, .24, -.81), Vector3(2.20, .19, 1.67)),
	AABB(Vector3(-1.01, .22, 1.89), Vector3(2.02, .34, .28)),
	AABB(Vector3(-1.01, .22, -2.15), Vector3(2.02, .30, .28)),
	AABB(Vector3(-.39, -.165, -.06), Vector3(.78, .16, .82)),
	AABB(Vector3(-.205, -.205, 1.14), Vector3(.41, .41, .32)),
	AABB(Vector3(-.205, -.205, -1.46), Vector3(.41, .41, .32)),
]

# Body coordinates are measured from the wheel centres. The undertray and
# bumper volumes preserve the lower van's ground clearance at each overhang.
const MPV_VOLUMES: Array[AABB] = [
	AABB(Vector3(-0.94, 0.48, -2.72), Vector3(1.88, 1.19, 4.18)),
	AABB(Vector3(-0.96, 0.28, 1.34), Vector3(1.92, 0.49, 1.34)),
	AABB(Vector3(-0.99, 0.03, -2.70), Vector3(1.98, 0.49, 5.30)),
	AABB(Vector3(-0.87, -0.19, -1.44), Vector3(1.74, 0.27, 2.96)),
	AABB(Vector3(-1.00, 0.01, 2.58), Vector3(2.0, 0.43, 0.22)),
	AABB(Vector3(-1.00, 0.02, -2.85), Vector3(2.0, 0.42, 0.23)),
	AABB(Vector3(-1.17, 0.89, 0.97), Vector3(0.18, 0.15, 0.22)),
	AABB(Vector3(0.99, 0.89, 0.97), Vector3(0.18, 0.15, 0.22)),
]

static func faces(obstacle: Dictionary) -> PackedVector3Array:
	var vertices: Variant = obstacle.get("top")
	if vertices is PackedVector3Array:
		return vertices
	return PackedVector3Array()

static func wheel_floor(position: Vector2, forward: Vector2, radius: float, rocks: Array) -> float:
	var floor_y := -INF
	var side := Vector2(forward.y, -forward.x)
	for rock: Dictionary in rocks:
		var offset := Vector2(float(rock.x), float(rock.z)) - position
		var reach := float(rock.r) + radius + TIRE_HALF_TREAD
		if offset.length_squared() > reach * reach:
			continue
		var triangles := faces(rock)
		for track: float in [-TIRE_HALF_TREAD, 0.0, TIRE_HALF_TREAD]:
			var origin: Vector2 = position + side * track
			for start: int in range(0, triangles.size() - 2, 3):
				floor_y = maxf(floor_y, _triangle_tire_floor(triangles, start, origin, forward, side, radius))
	return floor_y

static func _triangle_tire_floor(points: PackedVector3Array, start: int, origin: Vector2, forward: Vector2, side: Vector2, radius: float) -> float:
	# Cut the triangle at the tire's longitudinal plane. The rolling circle
	# rests above every point of the resulting line segment.
	var lo := Vector2(INF, -INF)
	var hi := Vector2(-INF, -INF)
	for edge: int in range(3):
		var a := points[start + edge]
		var b := points[start + (edge + 1) % 3]
		var a_planar := Vector2(a.x, a.z) - origin
		var b_planar := Vector2(b.x, b.z) - origin
		var da := a_planar.dot(side)
		var db := b_planar.dot(side)
		if da * db > 0.0:
			continue
		var t := clampf(da / (da - db), 0.0, 1.0) if absf(da - db) > EPSILON else 0.0
		var along := a_planar.lerp(b_planar, t).dot(forward)
		var height := lerpf(a.y, b.y, t)
		if along < lo.x or (is_equal_approx(along, lo.x) and height > lo.y):
			lo = Vector2(along, height)
		if along > hi.x or (is_equal_approx(along, hi.x) and height > hi.y):
			hi = Vector2(along, height)
	if lo.x > radius or hi.x < -radius:
		return -INF
	if hi.x - lo.x < EPSILON:
		return maxf(lo.y, hi.y) + sqrt(maxf(0.0, radius * radius - lo.x * lo.x))
	var slope := (hi.y - lo.y) / (hi.x - lo.x)
	var tangent := radius * slope / sqrt(1.0 + slope * slope)
	var contact := clampf(tangent, maxf(lo.x, -radius), minf(hi.x, radius))
	return lo.y + (contact - lo.x) * slope + sqrt(maxf(0.0, radius * radius - contact * contact))

static func body_hits(state: Dictionary, obstacles: Array, include_tires: bool, wheel_offsets: Array[Vector2], radius: float) -> bool:
	if obstacles.is_empty():
		return false
	var van: bool = state.get("vehicleId", "rover") == "yuchuan"
	var volumes: Array[AABB] = MPV_VOLUMES if van else BODY_VOLUMES
	var origin := Vector3(float(state.x), float(state.y), float(state.z))
	var rotation := Basis.from_euler(Vector3(-float(state.pitch), float(state.yaw), float(state.roll)))
	for obstacle: Dictionary in obstacles:
		var planar := Vector2(float(obstacle.x) - origin.x, float(obstacle.z) - origin.z)
		var reach := float(obstacle.r) + (3.20 if van else 2.75)
		if planar.length_squared() > reach * reach:
			continue
		for volume: AABB in volumes:
			var center := origin + rotation * volume.get_center()
			if _intersects(center, rotation, volume.size * 0.5, obstacle):
				return true
		if include_tires:
			var yaw := Basis(Vector3.UP, float(state.yaw))
			for i: int in range(wheel_offsets.size()):
				var local := wheel_offsets[i]
				var center := origin + yaw * Vector3(local.x, 0.0, local.y)
				center.y = float(state.wheelHeights[i])
				var wheel_half := Vector3(0.1225 if van else TIRE_HALF_TREAD, radius, radius * .80)
				if _intersects(center, yaw, wheel_half, obstacle):
					return true
	return false

static func _intersects(center: Vector3, rotation: Basis, half: Vector3, obstacle: Dictionary) -> bool:
	var other_center := Vector3(float(obstacle.x), float(obstacle.get("y", 0.0)), float(obstacle.z))
	var reach := float(obstacle.r) + half.length()
	if Vector2(other_center.x - center.x, other_center.z - center.z).length_squared() > reach * reach:
		return false
	match String(obstacle.get("kind", "")):
		"box":
			var basis: Basis = obstacle.get("basis", Basis(Vector3.UP, float(obstacle.get("yaw", 0.0))))
			return _boxes_overlap(center, rotation, half, other_center, basis, obstacle.half)
		"trunk":
			# Vertical trunk. Its near round outline avoids an invisible square corner.
			var inverse := rotation.transposed()
			var trunk_base := inverse * (other_center - center)
			var trunk_tip := inverse * (other_center + Vector3.UP * float(obstacle.height) - center)
			var r := float(obstacle.r)
			for t: float in [0.0, 0.25, 0.5, 0.75, 1.0]:
				var p := trunk_base.lerp(trunk_tip, t)
				var nearest := p.clamp(-half, half)
				if p.distance_squared_to(nearest) < r * r:
					return true
			return false
		_:
			var triangles := faces(obstacle)
			if triangles.is_empty():
				return false
			return _mesh_overlaps(center, rotation.transposed(), half, triangles)

static func _box_radius(axis: Vector3, basis: Basis, half: Vector3) -> float:
	return absf(axis.dot(basis.x)) * half.x + absf(axis.dot(basis.y)) * half.y + absf(axis.dot(basis.z)) * half.z

static func _separated_boxes(axis: Vector3, distance: Vector3, a: Basis, ah: Vector3, b: Basis, bh: Vector3) -> bool:
	var length := axis.length()
	if length < EPSILON:
		return false
	return absf(distance.dot(axis)) >= _box_radius(axis, a, ah) + _box_radius(axis, b, bh) - EPSILON * length

static func _boxes_overlap(center_a: Vector3, a: Basis, ah: Vector3, center_b: Vector3, b: Basis, bh: Vector3) -> bool:
	var distance := center_b - center_a
	for i: int in range(3):
		if _separated_boxes(a[i], distance, a, ah, b, bh) or _separated_boxes(b[i], distance, a, ah, b, bh):
			return false
		for j: int in range(3):
			if _separated_boxes(a[i].cross(b[j]), distance, a, ah, b, bh):
				return false
	return true

static func _mesh_overlaps(center: Vector3, inverse: Basis, half: Vector3, triangles: PackedVector3Array) -> bool:
	var above := INF
	var below := -INF
	for i: int in range(0, triangles.size() - 2, 3):
		var a := inverse * (triangles[i] - center)
		var b := inverse * (triangles[i + 1] - center)
		var c := inverse * (triangles[i + 2] - center)
		# Keep the ray intersections to cover full containment (no face touches).
		var area := Vector2(b.x - a.x, b.z - a.z).cross(Vector2(c.x - a.x, c.z - a.z))
		if absf(area) > EPSILON:
			var u := Vector2(-a.x, -a.z).cross(Vector2(c.x - a.x, c.z - a.z)) / area
			var v := Vector2(b.x - a.x, b.z - a.z).cross(Vector2(-a.x, -a.z)) / area
			if u >= 0.0 and v >= 0.0 and u + v <= 1.0:
				var y := a.y + (b.y - a.y) * u + (c.y - a.y) * v
				above = minf(above, y) if y >= 0.0 else above
				below = maxf(below, y) if y <= 0.0 else below
		if _triangle_overlaps(a, b, c, half):
			return true
	return is_finite(above) and is_finite(below)

static func _triangle_overlaps(a: Vector3, b: Vector3, c: Vector3, half: Vector3) -> bool:
	# Triangle/AABB separating axes in body-local coordinates.
	for i: int in range(3):
		if minf(a[i], minf(b[i], c[i])) >= half[i] - EPSILON or maxf(a[i], maxf(b[i], c[i])) <= -half[i] + EPSILON:
			return false
	var first := b - a
	var second := c - b
	var third := a - c
	if _triangle_separated(first.cross(second), a, b, c, half):
		return false
	for edge: Vector3 in [first, second, third]:
		if _triangle_separated(edge.cross(Vector3.RIGHT), a, b, c, half) or _triangle_separated(edge.cross(Vector3.UP), a, b, c, half) or _triangle_separated(edge.cross(Vector3.BACK), a, b, c, half):
			return false
	return true

static func _triangle_separated(axis: Vector3, a: Vector3, b: Vector3, c: Vector3, half: Vector3) -> bool:
	if axis.length_squared() < EPSILON * EPSILON:
		return false
	var pa := a.dot(axis)
	var pb := b.dot(axis)
	var pc := c.dot(axis)
	var extent := half.dot(axis.abs())
	return minf(pa, minf(pb, pc)) > extent or maxf(pa, maxf(pb, pc)) < -extent
