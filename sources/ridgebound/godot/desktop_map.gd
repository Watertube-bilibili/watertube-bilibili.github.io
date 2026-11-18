extends Control
## North-up route guide in world metres. The compact and full views share data.

const Terrain = preload("res://terrain_math.gd")
const FIELD := Color("202b26")
const PAPER := Color("f5ead6")
const GRAPH := Color("46544b")
const TRACK := Color("e9bf80")
const PISTE := Color("a1b1a3")
const WATER := Color("426c78")
const TARGET := Color("ffad82")

var world_state: Dictionary = {}
var zoomed_out := false
var focus := Vector2.ZERO
var scale_metres := 1.0
var routes: Array = Terrain.branch_routes()
var stations: Array = Terrain.repair_sites()
var checkpoints: Array = Terrain.checkpoints()
var lakes: Array = Terrain.water_bodies()

func set_view(state: Dictionary, overview: bool) -> void:
	world_state = state
	zoomed_out = overview
	queue_redraw()

func _draw() -> void:
	var paper := Rect2(Vector2.ZERO, size)
	draw_rect(paper, FIELD)
	if world_state.is_empty() or size.x < 28.0 or size.y < 28.0:
		return
	var custom := String(world_state.get("region", "")) == "custom"
	var position_at := Vector2(float(world_state.x), float(world_state.z))
	var map_bounds := _bounds(custom)
	focus = map_bounds.get_center() if zoomed_out else position_at
	if zoomed_out:
		scale_metres = minf((size.x - 28.0) / map_bounds.size.x, (size.y - 28.0) / map_bounds.size.y)
	else:
		scale_metres = minf(size.x, size.y) / 620.0
	var visible := Rect2(focus - size / (2.0 * scale_metres), size / scale_metres)
	var step := 4000 if zoomed_out else 100
	if custom and zoomed_out:
		step = maxi(5, roundi(maxf(map_bounds.size.x, map_bounds.size.y) / 50.0) * 5)
	_grid(visible, step)
	if zoomed_out:
		draw_rect(Rect2(_pixel(map_bounds.end), map_bounds.size * scale_metres), PISTE.darkened(0.35), false)
	if not custom:
		_guide(visible, map_bounds)
	_vehicle(position_at)
	if not custom and not zoomed_out and not bool(world_state.completed) and not checkpoints.is_empty():
		var marker: Dictionary = checkpoints[clampi(int(world_state.checkpoint), 0, checkpoints.size() - 1)]
		_offscreen_target(_pixel(Vector2(marker.x, marker.z)) - size * 0.5)
	var bar := float(step) if custom and zoomed_out else (5000.0 if zoomed_out else 100.0)
	_legend(bar)

func _bounds(custom: bool) -> Rect2:
	if custom:
		var b: Dictionary = world_state.get("mapBounds", {})
		if b.is_empty():
			var summary: Dictionary = world_state.get("customMap", {})
			b = summary.get("bounds", {})
		if not b.is_empty():
			var lower := Vector2(float(b.get("minX", -100)), float(b.get("minZ", -100)))
			var higher := Vector2(float(b.get("maxX", 100)), float(b.get("maxZ", 100)))
			if higher.x > lower.x and higher.y > lower.y:
				return Rect2(lower, higher - lower)
	return Rect2(
		Vector2(Terrain.MIN_X, Terrain.MIN_Z),
		Vector2(Terrain.MAX_X - Terrain.MIN_X, Terrain.MAX_Z - Terrain.MIN_Z)
	)

func _pixel(point: Vector2) -> Vector2:
	# +X points west and +Z north in Ridgebound.
	return size * 0.5 - (point - focus) * scale_metres

func _grid(view: Rect2, step: int) -> void:
	for x in range(ceili(view.position.x / step) * step, floori(view.end.x) + 1, step):
		draw_line(_pixel(Vector2(x, view.position.y)), _pixel(Vector2(x, view.end.y)), GRAPH)
	for z in range(ceili(view.position.y / step) * step, floori(view.end.y) + 1, step):
		draw_line(_pixel(Vector2(view.position.x, z)), _pixel(Vector2(view.end.x, z)), GRAPH)

func _guide(view: Rect2, bounds: Rect2) -> void:
	for lake in lakes:
		var center := Vector2(lake.x, lake.z)
		var radius := float(lake.radius)
		if view.grow(radius).has_point(center):
			draw_circle(_pixel(center), radius * scale_metres, WATER, true, -1.0, true)
	for i in range(routes.size()):
		var junction: Dictionary = routes[i]
		_track(i, maxf(view.position.y, junction.start), minf(view.end.y, junction.end), PISTE, 1.4)
	_track(-1, maxf(view.position.y, bounds.position.y), minf(view.end.y, bounds.end.y), TRACK, 2.4)
	var inner := Rect2(Vector2.ZERO, size).grow(-8.0)
	for station in stations:
		var p := _pixel(Vector2(station.x, station.z))
		if inner.has_point(p):
			draw_rect(Rect2(p - Vector2(2.5, 2.5), Vector2(5.0, 5.0)), PAPER)
	for i in range(checkpoints.size()):
		var point: Dictionary = checkpoints[i]
		var mark := _pixel(Vector2(point.x, point.z))
		if inner.has_point(mark):
			draw_circle(mark, 3.6, TARGET if i >= int(world_state.checkpoint) else PISTE, true, -1.0, true)

func _track(branch: int, start: float, finish: float, tint: Color, width: float) -> void:
	if finish <= start:
		return
	var points := PackedVector2Array()
	var spacing := 85.0 if zoomed_out else 10.0
	var z := start
	while z < finish:
		var x := Terrain.route_x(z) if branch < 0 else Terrain.branch_x(branch, z)
		points.append(_pixel(Vector2(x, z)))
		z += spacing
	var final_x := Terrain.route_x(finish) if branch < 0 else Terrain.branch_x(branch, finish)
	points.append(_pixel(Vector2(final_x, finish)))
	draw_polyline(points, tint, width, true)

func _vehicle(position_at: Vector2) -> void:
	var plane := _pixel(position_at)
	var yaw := float(world_state.yaw)
	var travel := Vector2(-sin(yaw), -cos(yaw))
	_triangle(plane, travel, 9.0, PAPER)

func _offscreen_target(offset: Vector2) -> void:
	var region := size * 0.5 - Vector2(15.0, 15.0)
	var ratio := maxf(absf(offset.x) / region.x, absf(offset.y) / region.y)
	if ratio > 1.0:
		_triangle(size * 0.5 + offset / ratio, offset.normalized(), 6.0, TARGET)

func _triangle(point: Vector2, forward: Vector2, length: float, ink: Color) -> void:
	var side := forward.orthogonal() * (length * 0.52)
	draw_colored_polygon(PackedVector2Array([
		point + forward * length, point - forward * length * 0.52 + side,
		point - forward * length * 0.52 - side,
	]), ink)

func _legend(metres: float) -> void:
	var base := Vector2(10.0, size.y - 8.0)
	var bar := metres * scale_metres
	draw_line(base, base + Vector2(bar, 0.0), PAPER, 1.8)
	var unit := "%.1f km" % (metres / 1000.0) if metres >= 1000.0 else "%d m" % metres
	draw_string(get_theme_default_font(), base - Vector2(0, 5), unit, HORIZONTAL_ALIGNMENT_LEFT, -1, 12, PAPER)
	var north := Vector2(size.x - 13.0, 13.0)
	_triangle(north, Vector2.UP, 5.0, PAPER)
	draw_string(get_theme_default_font(), north + Vector2(-4.0, 12.0), "N", HORIZONTAL_ALIGNMENT_LEFT, -1, 10, PAPER)
