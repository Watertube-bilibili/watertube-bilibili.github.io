extends Control
## North-up route map. Low-cost, clipped local view and full regional overview.

const Terrain = preload("res://terrain_math.gd")
const BORDER := Color("718379")
const GRID := Color("3b514a")
const ROAD := Color("f7ca81")
const BRANCH := Color("94b1a0")
const STATION := Color("b2d9bb")
const CHECKPOINT := Color("e69464")

var snapshot: Dictionary = {}
var overview := false
var routes: Array = Terrain.branch_routes()
var stations: Array = Terrain.repair_sites()
var checkpoints: Array = Terrain.checkpoints()
var lakes: Array = Terrain.water_bodies()
var _center := Vector2.ZERO
var _scale := 1.0

func set_view(state: Dictionary, show_overview: bool) -> void:
	snapshot = state
	overview = show_overview
	queue_redraw()

func _loc(x: float, z: float) -> Vector2:
	# In the game world +X is west and +Z is north.
	return size * 0.5 - (Vector2(x, z) - _center) * _scale

func _draw() -> void:
	draw_rect(Rect2(Vector2.ZERO, size), Color("19302b"))
	if snapshot.is_empty() or size.x < 20 or size.y < 20:
		return
	var player := Vector2(float(snapshot.x), float(snapshot.z))
	var world := Rect2(
		Vector2(Terrain.MIN_X, Terrain.MIN_Z),
		Vector2(Terrain.MAX_X - Terrain.MIN_X, Terrain.MAX_Z - Terrain.MIN_Z)
	)
	_center = world.get_center() if overview else player
	_scale = minf((size.x - 20) / world.size.x, (size.y - 20) / world.size.y) if overview else minf(size.x, size.y) / 720.0
	var low := _center - size / (2.0 * _scale)
	var high := _center + size / (2.0 * _scale)
	var grid := 4000 if overview else 100
	for x in range(int(ceil(low.x / grid)) * grid, int(high.x) + 1, grid):
		draw_line(_loc(x, low.y), _loc(x, high.y), GRID)
	for z in range(int(ceil(low.y / grid)) * grid, int(high.y) + 1, grid):
		draw_line(_loc(low.x, z), _loc(high.x, z), GRID)
	if overview:
		draw_rect(Rect2(_loc(world.end.x, world.end.y), world.size * _scale), BORDER, false)
	for lake in lakes:
		var radius := float(lake.radius)
		if Rect2(low, high - low).grow(radius).has_point(Vector2(lake.x, lake.z)):
			draw_circle(_loc(lake.x, lake.z), radius * _scale, Color("487c8c"))
	for index in range(routes.size()):
		var branch: Dictionary = routes[index]
		_draw_road(index, maxf(low.y, branch.start), minf(high.y, branch.end), BRANCH, 1.6)
	_draw_road(-1, maxf(low.y, Terrain.MIN_Z), minf(high.y, Terrain.MAX_Z), ROAD, 2.2)
	for station in stations:
		var p := _loc(station.x, station.z)
		if Rect2(Vector2.ZERO, size).grow(-5).has_point(p):
			draw_rect(Rect2(p - Vector2(3, 3), Vector2(6, 6)), STATION)
	for index in range(checkpoints.size()):
		var cp: Dictionary = checkpoints[index]
		var p := _loc(cp.x, cp.z)
		if Rect2(Vector2.ZERO, size).grow(-5).has_point(p):
			draw_circle(p, 4.0, CHECKPOINT if index >= int(snapshot.checkpoint) else BORDER)
	var vehicle := _loc(player.x, player.y)
	var yaw := float(snapshot.yaw)
	var forward := Vector2(-sin(yaw), -cos(yaw))
	var cross := forward.orthogonal()
	draw_colored_polygon(PackedVector2Array([
		vehicle + forward * 9,
		vehicle - forward * 5 - cross * 5,
		vehicle - forward * 5 + cross * 5
	]), Color("fff5df"))
	if not overview and not bool(snapshot.completed):
		var marker: Dictionary = checkpoints[clampi(int(snapshot.checkpoint), 0, checkpoints.size() - 1)]
		var target := _loc(marker.x, marker.z) - vehicle
		var max_delta := size * 0.5 - Vector2(15, 15)
		var ratio := maxf(absf(target.x) / max_delta.x, absf(target.y) / max_delta.y)
		if ratio > 1.0:
			var p := vehicle + target / ratio
			var direction := target.normalized()
			draw_colored_polygon(PackedVector2Array([
				p + direction * 6,
				p - direction * 5 + direction.orthogonal() * 5,
				p - direction * 5 - direction.orthogonal() * 5
			]), CHECKPOINT)
	var ruler := (5000.0 if overview else 100.0) * _scale
	var ruler_start := Vector2(12, size.y - 12)
	draw_line(ruler_start, ruler_start + Vector2(ruler, 0), Color("eef3db"), 2.0)

func _draw_road(index: int, from: float, to: float, tint: Color, width: float) -> void:
	if from >= to:
		return
	var points := PackedVector2Array()
	var z := from
	var step := 90.0 if overview else 12.0
	while z < to:
		points.append(_road_point(index, z))
		z += step
	points.append(_road_point(index, to))
	draw_polyline(points, tint, width, true)

func _road_point(index: int, z: float) -> Vector2:
	var x := Terrain.route_x(z) if index < 0 else Terrain.branch_x(index, z)
	return _loc(x, z)
