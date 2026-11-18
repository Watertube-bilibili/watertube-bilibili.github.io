class_name ChunkTerrain
extends Node3D
## Bounded, adaptive terrain streaming. Rendered ground is authoritative for entry:
## the vehicle controller must reject movement when is_ready_at() returns false.
## Continuous TerrainMath remains authoritative for wheel/contact heights.

signal streaming_ready

const Terrain = preload("res://terrain_math.gd")
const CHUNK_SIZE: float = 16.0
const BUILD_BUDGET_US: int = 3000
const SUPPORT_MARGIN: float = 2.6
const MAX_RADIUS: int = 5
const SKIRT_DEPTH: float = 5.0
var _region: String = "forest"
var _chunks: Dictionary = {}
var _queue: Array[Vector2i] = []
var _queued: Dictionary = {}
var _props_queue: Array[Vector2i] = []
var _props_queued: Dictionary = {}
var _props_built_count: int = 0
var _obstacles: Array = []
var _obstacles_dirty: bool = true
var _center: Vector2i = Vector2i(999999, 999999)
var _player: Vector3 = Vector3.ZERO
var _velocity: Vector3 = Vector3.ZERO
var _radius: int = 2
var _segments: int = 8
var _avg_ms: float = 16.7
var _build_ms: float = 0.0
var _budget_overruns: int = 0
var _adapt_time: float = 0.0
var _refresh_time: float = 0.0
var _mobile: bool = false
var _initialized: bool = false
var _built_count: int = 0
var _startup_chunks: int = 0
var _terrain_material: StandardMaterial3D
var _trunk_material: StandardMaterial3D
var _foliage_material: StandardMaterial3D
var _rock_material: StandardMaterial3D
var _trunk_mesh: CylinderMesh
var _foliage_mesh: CylinderMesh
var _rock_mesh: SphereMesh


# Distance layers only affect the picture. Readiness always comes from the 16m tiles.
const VISUAL_SIZES: Array[float] = [128.0, 512.0]
const VISUAL_RADII: Array[int] = [2, 3]
const VISUAL_SEGMENTS: Array[int] = [8, 8]
const VISUAL_CLEARANCE: Array[float] = [0.8, 10.0]
const FINE_MASK_SIZE: int = 32
const FINE_MASK_SHADER_CODE: String = """
shader_type spatial;
varying vec2 terrain_xz;
uniform sampler2D fine_tiles : filter_nearest, repeat_disable;
uniform vec2 mask_origin;
uniform vec2 mid_origin;
uniform bool far_layer = false;
void vertex() {
	terrain_xz = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xz;
}
void fragment() {
	vec2 tile = floor(terrain_xz / 16.0) - mask_origin;
	if (all(greaterThanEqual(tile, vec2(0.0))) && all(lessThan(tile, vec2(32.0)))) {
		if (texture(fine_tiles, (tile + vec2(0.5)) / 32.0).r > 0.5) {
			discard;
		}
	}
	if (far_layer) {
		vec2 mid_tile = floor(terrain_xz / 128.0) - mid_origin;
		if (all(greaterThanEqual(mid_tile, vec2(0.0))) && all(lessThan(mid_tile, vec2(32.0)))) {
			if (texture(fine_tiles, (mid_tile + vec2(0.5)) / 32.0).g > 0.5) {
				discard;
			}
		}
	}
	ALBEDO = COLOR.rgb;
	ROUGHNESS = 1.0;
	SPECULAR = 0.0;
}
"""
var _visual_tiles: Dictionary = {}
var _visual_queue: Array[Vector3i] = []
var _visual_centers: Array[Vector2i] = []
var _visual_root: Node3D
var _visual_startup_count: int = 0
var _visual_delay: int = 0
var _visual_far_radius: int = 0
var _visual_materials: Array[ShaderMaterial] = []
var _fine_mask: Image
var _fine_mask_texture: ImageTexture
var _fine_mask_dirty: bool = false

func setup(region: String, initial_position: Vector3 = Vector3.ZERO) -> void:
	_initialized = false
	_region = "snow" if region == "snow" else "forest"
	for entry: Dictionary in _chunks.values():
		var old_node: Node3D = entry.node
		old_node.hide()
		old_node.queue_free()
	_chunks.clear()
	_queue.clear()
	_queued.clear()
	_props_queue.clear()
	_props_queued.clear()
	_props_built_count = 0
	_obstacles.clear()
	_obstacles_dirty = true
	_mobile = OS.has_feature("mobile") or OS.has_feature("web_android") or OS.has_feature("web_ios")
	_radius = 2
	_segments = 8
	_avg_ms = 16.7
	_adapt_time = 0.0
	_refresh_time = 0.0
	_build_ms = 0.0
	_budget_overruns = 0
	_built_count = 0
	_startup_chunks = 0
	_player = initial_position if initial_position.is_finite() else Vector3(Terrain.route_x(0.0), 0.0, 0.0)
	_velocity = Vector3.ZERO
	_center = _key_at(_player.x, _player.z)
	_make_resources()
	# Build only the tiles beneath the complete vehicle footprint: one tile in
	# the interior, two at an edge, four at a corner. The rest is queued below.
	# The resident coarse horizon is present while these small neighbors stream.
	var support: Dictionary = {}
	for offset: Vector2 in [Vector2.ZERO, Vector2(-SUPPORT_MARGIN, -SUPPORT_MARGIN), Vector2(SUPPORT_MARGIN, -SUPPORT_MARGIN), Vector2(-SUPPORT_MARGIN, SUPPORT_MARGIN), Vector2(SUPPORT_MARGIN, SUPPORT_MARGIN)]:
		support[_key_at(_player.x + offset.x, _player.z + offset.y)] = true
	for key: Vector2i in support.keys():
		_build_chunk(key)
	_startup_chunks = _chunks.size()
	_reset_visual_tiles()
	_initialized = true
	_refresh_queue()
	streaming_ready.emit()

func update_stream(position: Vector3, velocity: Vector3, dt: float) -> void:
	if not _initialized or not position.is_finite() or not velocity.is_finite():
		return
	_player = position
	_velocity = velocity
	# Ignore background-tab suspension instead of classifying it as a slow GPU.
	if dt > 0.0 and dt < 0.15:
		_avg_ms = lerpf(_avg_ms, dt * 1000.0, 1.0 - exp(-dt / 1.7))
		_adapt_time += dt
		_refresh_time += dt
		_adapt_quality()
	var next_center: Vector2i = _key_at(position.x, position.z)
	if next_center != _center or _refresh_time > 0.35:
		_fine_mask_dirty = _fine_mask_dirty or _center != next_center
		_center = next_center
		_refresh_time = 0.0
		_refresh_queue()
	var started: int = Time.get_ticks_usec()
	# One driving-layer job per rendered frame. The visual backdrop
	# can consume a small amount of remaining budget after this job.
	if not _queue.is_empty() and Time.get_ticks_usec() - started < BUILD_BUDGET_US:
		var key: Vector2i = _queue.pop_front()
		_queued.erase(key)
		if not _chunks.has(key):
			_build_chunk(key)
			_build_ms = float(Time.get_ticks_usec() - started) / 1000.0
			if _build_ms > float(BUILD_BUDGET_US) / 1000.0:
				_budget_overruns += 1
				_segments = 8
	elif not _props_queue.is_empty():
		# Terrain always wins. Props get their own later frame and become solid
		# only in the same operation that makes their meshes visible.
		var key: Vector2i = _props_queue.pop_front()
		_props_queued.erase(key)
		if _chunks.has(key) and not bool(_chunks[key].propsReady):
			if not _build_props(key):
				_enqueue_props(key)
			_build_ms = float(Time.get_ticks_usec() - started) / 1000.0
			if _build_ms > float(BUILD_BUDGET_US) / 1000.0:
				_budget_overruns += 1
	_unload_distant()
	_update_visual_tiles(started)
	_update_fine_mask()

func is_ready_at(x: float, z: float) -> bool:
	if not _initialized or not is_finite(x) or not is_finite(z):
		return false
	# The full car footprint, not merely its center, must be on built terrain.
	for offset: Vector2 in [Vector2.ZERO, Vector2(-SUPPORT_MARGIN, -SUPPORT_MARGIN), Vector2(SUPPORT_MARGIN, -SUPPORT_MARGIN), Vector2(-SUPPORT_MARGIN, SUPPORT_MARGIN), Vector2(SUPPORT_MARGIN, SUPPORT_MARGIN)]:
		if not _chunks.has(_key_at(x + offset.x, z + offset.y)):
			return false
	return true

func props_ready_at(x: float, z: float) -> bool:
	if not _initialized or not is_finite(x) or not is_finite(z):
		return false
	var key: Vector2i = _key_at(x, z)
	return _chunks.has(key) and bool(_chunks[key].propsReady)

func _enqueue_props(key: Vector2i) -> void:
	if not _props_queued.has(key):
		_props_queue.append(key)
		_props_queued[key] = true

func _build_props(key: Vector2i) -> bool:
	var entry: Dictionary = _chunks[key]
	var details: Dictionary = _scatter_details(entry.node, key, float(key.x) * CHUNK_SIZE, float(key.y) * CHUNK_SIZE)
	if bool(details.get("deferred", false)):
		return false
	entry.obstacles = details.obstacles
	entry.objects = int(details.count) + 1
	entry.propsReady = true
	_props_built_count += 1
	_obstacles_dirty = true
	return true

func get_obstacles() -> Array:
	if _obstacles_dirty:
		_obstacles.clear()
		for entry: Dictionary in _chunks.values():
			_obstacles.append_array(entry.obstacles)
		_obstacles_dirty = false
	return _obstacles

func get_stats() -> Dictionary:
	var objects: int = 0
	var props_chunks: int = 0
	for entry: Dictionary in _chunks.values():
		objects += int(entry.objects)
		if bool(entry.propsReady):
			props_chunks += 1
	return {
		"chunks": _chunks.size(), "activeChunks": _chunks.size(),
		"chunkSize": CHUNK_SIZE, "startupChunks": _startup_chunks, "buildBudgetMs": float(BUILD_BUDGET_US) / 1000.0,
		"queued": _queue.size() + _props_queue.size(), "objects": objects, "activeObjects": objects,
		"groundChunks": _chunks.size(), "groundQueued": _queue.size(),
		"visualTiles": _visual_tiles.size(), "visualQueued": _visual_queue.size(),
		"visualStartupTiles": _visual_startup_count,
		"propsChunks": props_chunks, "propsQueued": _props_queue.size(), "propsBuiltTotal": _props_built_count,
		"radius": _radius, "avgMs": snappedf(_avg_ms, 0.1),
		"fps": int(round(1000.0 / maxf(1.0, _avg_ms))),
		"segments": _segments, "buildMs": snappedf(_build_ms, 0.1),
		"budgetOverruns": _budget_overruns, "builtTotal": _built_count,
		"groundReady": is_ready_at(_player.x, _player.z), "region": _region
	}

func _key_at(x: float, z: float) -> Vector2i:
	return Vector2i(int(floor(x / CHUNK_SIZE)), int(floor(z / CHUNK_SIZE)))

func _adapt_quality() -> void:
	var previous_radius: int = _radius
	# Hysteresis prevents quality/range oscillation around a frame-time boundary.
	if _avg_ms > 45.0 and _adapt_time > 1.0:
		_radius = maxi(1, _radius - 1)
		_segments = 8
		_adapt_time = 0.0
	elif _avg_ms > 26.0 and _adapt_time > 1.0:
		_radius = maxi(2, _radius - 1)
		_segments = 8
		_adapt_time = 0.0
	elif _avg_ms < 19.0 and _adapt_time > 5.0:
		var ceiling: int = 3 if _mobile else MAX_RADIUS
		_radius = mini(ceiling, _radius + 1)
		_segments = 12 if not _mobile and _avg_ms < 14.0 and _build_ms < 1.5 else 8
		_adapt_time = 0.0
	elif _avg_ms > 21.0:
		_segments = 8
	if previous_radius != _radius:
		_refresh_queue()

func _refresh_queue() -> void:
	_queue.clear()
	_queued.clear()
	for dz: int in range(-_radius, _radius + 1):
		for dx: int in range(-_radius, _radius + 1):
			_enqueue(_center + Vector2i(dx, dz))
	var planar: Vector2 = Vector2(_velocity.x, _velocity.z)
	if planar.length_squared() < 0.1:
		planar = Vector2(Terrain.route_x(_player.z + 3.0) - Terrain.route_x(_player.z), 3.0)
	var ahead_count: int = 3 if planar.length() > 4.0 else 2
	planar = planar.normalized()
	# Preload two or three small chunks along travel, with side shoulders.
	for distance: int in range(1, ahead_count + 1):
		var point: Vector2 = (Vector2(_center) + Vector2(0.5, 0.5)) * CHUNK_SIZE + planar * CHUNK_SIZE * float(distance)
		var ahead: Vector2i = _key_at(point.x, point.y)
		_enqueue(ahead)
		var side: Vector2i = Vector2i(1, 0) if absf(planar.y) > absf(planar.x) else Vector2i(0, 1)
		_enqueue(ahead + side)
		_enqueue(ahead - side)
	_queue.sort_custom(func(a: Vector2i, b: Vector2i) -> bool:
		return _priority(a, planar) < _priority(b, planar)
	)

func _enqueue(key: Vector2i) -> void:
	if not _chunks.has(key) and not _queued.has(key):
		_queue.append(key)
		_queued[key] = true

func _priority(key: Vector2i, direction: Vector2) -> float:
	var center_offset: Vector2 = Vector2(float(key.x) + 0.5, float(key.y) + 0.5) * CHUNK_SIZE - Vector2(_player.x, _player.z)
	var distance: float = center_offset.length()
	# The footprint always wins, then near neighbors, then the forward corridor.
	var nearest: Vector2 = center_offset.abs() - Vector2.ONE * (CHUNK_SIZE * 0.5)
	if nearest.x <= SUPPORT_MARGIN and nearest.y <= SUPPORT_MARGIN:
		return distance - 10000.0
	if absi(key.x - _center.x) <= 1 and absi(key.y - _center.y) <= 1:
		return distance - 1000.0 - center_offset.normalized().dot(direction) * CHUNK_SIZE * 0.35
	return distance - center_offset.normalized().dot(direction) * CHUNK_SIZE * 0.75

func _unload_distant() -> void:
	# A recovery teleport may queue a new neighborhood. Keep the old world until
	# the replacement support ring is fully built, then retire it atomically.
	for dz: int in range(-1, 2):
		for dx: int in range(-1, 2):
			if not _chunks.has(_center + Vector2i(dx, dz)):
				return
	# Retain two rings beyond the wanted radius. This hysteresis prevents a turn
	# from deleting a still-visible neighbor while its replacement is queued.
	var retain: int = _radius + 2
	for key: Vector2i in _chunks.keys():
		if maxi(absi(key.x - _center.x), absi(key.y - _center.y)) <= retain:
			continue
		if _queued.has(key):
			continue
		var entry: Dictionary = _chunks[key]
		var node: Node3D = entry.node
		node.hide()
		node.queue_free()
		_chunks.erase(key)
		_fine_mask_dirty = true
		_props_queued.erase(key)
		_props_queue.erase(key)
		_obstacles_dirty = true

func _make_resources() -> void:
	_terrain_material = StandardMaterial3D.new()
	_terrain_material.vertex_color_use_as_albedo = true
	_terrain_material.vertex_color_is_srgb = true
	_terrain_material.metallic_specular = 0.0
	_terrain_material.roughness = 1.0
	_trunk_material = StandardMaterial3D.new()
	_trunk_material.albedo_color = Color("655a49") if _region == "forest" else Color("596266")
	_trunk_material.roughness = 1.0
	_foliage_material = StandardMaterial3D.new()
	_foliage_material.vertex_color_use_as_albedo = true
	_foliage_material.albedo_color = Color("47624b") if _region == "forest" else Color("a8c5c5")
	_foliage_material.roughness = 1.0
	_foliage_material.metallic_specular = 0.0
	_rock_material = StandardMaterial3D.new()
	_rock_material.vertex_color_use_as_albedo = true
	_rock_material.albedo_color = Color("8c9384") if _region == "forest" else Color("b7c9d0")
	_rock_material.roughness = 1.0
	_rock_material.metallic_specular = 0.0
	_trunk_mesh = CylinderMesh.new()
	_trunk_mesh.top_radius = 0.13
	_trunk_mesh.bottom_radius = 0.2
	_trunk_mesh.height = 1.0
	_trunk_mesh.radial_segments = 5
	_trunk_mesh.rings = 1
	_trunk_mesh.material = _trunk_material
	_foliage_mesh = CylinderMesh.new()
	_foliage_mesh.top_radius = 0.0
	_foliage_mesh.bottom_radius = 1.0
	_foliage_mesh.height = 1.0
	_foliage_mesh.radial_segments = 6
	_foliage_mesh.rings = 1
	_foliage_mesh.material = _foliage_material
	_rock_mesh = SphereMesh.new()
	_rock_mesh.radius = 1.0
	_rock_mesh.height = 2.0
	_rock_mesh.radial_segments = 6
	_rock_mesh.rings = 2
	_rock_mesh.material = _rock_material

func _surface_color(x: float, z: float, sample_span: float = 2.0) -> Color:
	var snowy: bool = _region == "snow"
	var color: Color = Color("a5ad76")
	var biome: String = Terrain.biome_at(x, z, _region)
	match biome:
		"marsh": color = Color("8f9c73")
		"stone": color = Color("a29278")
		"alpine": color = Color("a6a78c")
		"icefield": color = Color("ccdce0")
	if snowy:
		color = Color("d5e2dd") if biome != "icefield" else Color("c2d4dc")
	var surface: String = Terrain.surface_at(x, z, _region)
	match surface:
		"mud": color = Color("756146")
		"water": color = Color("688f89")
		"rock": color = Color("a29e8b")
		"ice": color = Color("91b6be")
	var distance: float = Terrain.road_distance(x, z)
	if surface not in ["mud", "rock", "water", "ice"]:
		# At lower detail the road gets a feathered trace so junctions and
		# the direction of the trail survive sparse vertex sampling.
		var trail: Color = Color("acbec0") if snowy else Color("c9b18b")
		if sample_span <= 2.0:
			if distance < 3.5:
				color = trail
		else:
			var edge: float = maxf(6.0, sample_span * 0.73)
			color = color.lerp(trail, 1.0 - smoothstep(2.0, edge, distance))
	var variation: float = sin(x * 0.34 + z * 0.18) * 0.035 + cos(z * 0.27 - x * 0.13) * 0.025
	return color.lightened(variation) if variation >= 0.0 else color.darkened(-variation)

func _emit_triangle(tool: SurfaceTool, a: Vector3, b: Vector3, c: Vector3, color_a: Color, color_b: Color, color_c: Color) -> void:
	var normal: Vector3 = (b - a).cross(c - a).normalized()
	# Godot front faces use clockwise winding; keep the geometric normal.
	tool.set_normal(normal)
	tool.set_color(color_a)
	tool.add_vertex(a)
	tool.set_color(color_c)
	tool.add_vertex(c)
	tool.set_color(color_b)
	tool.add_vertex(b)

func _emit_grid(tool: SurfaceTool, points: PackedVector3Array, colors: PackedColorArray, segments: int, skirt_depth: float) -> void:
	var stride: int = segments + 1
	for row: int in range(segments):
		for col: int in range(segments):
			var a: int = row * stride + col
			var b: int = a + 1
			var c: int = a + stride
			var d: int = c + 1
			_emit_triangle(tool, points[a], points[c], points[b], colors[a], colors[c], colors[b])
			_emit_triangle(tool, points[b], points[c], points[d], colors[b], colors[c], colors[d])
	# Skirts hide T-junctions between different mesh resolutions.
	var last_row: int = segments * stride
	for edge: int in range(4):
		for i: int in range(segments):
			var a: int
			var b: int
			match edge:
				0:
					a = i * stride
					b = (i + 1) * stride
				1:
					a = (i + 1) * stride + segments
					b = i * stride + segments
				2:
					a = i + 1
					b = i
				_:
					a = last_row + i
					b = last_row + i + 1
			var down: Vector3 = Vector3.UP * skirt_depth
			_emit_triangle(tool, points[a], points[a] - down, points[b], colors[a], colors[a], colors[b])
			_emit_triangle(tool, points[b], points[a] - down, points[b] - down, colors[b], colors[a], colors[b])

func _build_chunk(key: Vector2i) -> void:
	if _chunks.has(key):
		return
	var group := Node3D.new()
	group.name = "Chunk_%d_%d" % [key.x, key.y]
	var origin := Vector2(key) * CHUNK_SIZE
	var step_size: float = CHUNK_SIZE / float(_segments)
	var stride: int = _segments + 1
	var points := PackedVector3Array()
	var colors := PackedColorArray()
	points.resize(stride * stride)
	colors.resize(stride * stride)
	# Sample each vertex once, even where two cells or a skirt share it.
	for row: int in range(stride):
		for col: int in range(stride):
			var x: float = origin.x + col * step_size
			var z: float = origin.y + row * step_size
			var idx: int = row * stride + col
			points[idx] = Vector3(x, Terrain.height_at(x, z, _region), z)
			colors[idx] = _surface_color(x, z)
	var tool := SurfaceTool.new()
	tool.begin(Mesh.PRIMITIVE_TRIANGLES)
	_emit_grid(tool, points, colors, _segments, SKIRT_DEPTH)
	tool.set_material(_terrain_material)
	var ground := MeshInstance3D.new()
	ground.mesh = tool.commit()
	ground.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	group.add_child(ground)
	add_child(group)
	_chunks[key] = {"node": group, "obstacles": [], "objects": 1, "segments": _segments, "propsReady": false}
	_enqueue_props(key)
	_obstacles_dirty = true
	_fine_mask_dirty = true
	_built_count += 1

func _scatter_details(group: Node3D, key: Vector2i, x0: float, z0: float) -> Dictionary:
	var rng: RandomNumberGenerator = RandomNumberGenerator.new()
	rng.seed = key.x * 73856093 ^ key.y * 19349663 ^ (8191 if _region == "snow" else 4221)
	var trunks: Array[Transform3D] = []
	var foliage: Array[Transform3D] = []
	var stones: Array[Transform3D] = []
	var obstacles: Array = []
	# Density follows the 256m² tile area; small chunks must not quadruple trees.
	for i: int in range(5):
		var x: float = x0 + rng.randf_range(1.5, CHUNK_SIZE - 1.5)
		var z: float = z0 + rng.randf_range(1.5, CHUNK_SIZE - 1.5)
		if Terrain.road_distance(x, z) < 6.0:
			continue
		var surface: String = Terrain.surface_at(x, z, _region)
		if surface == "water" or surface == "ice":
			continue
		var y: float = Terrain.height_at(x, z, _region)
		var rotation: float = rng.randf_range(0.0, TAU)
		var biome: String = Terrain.biome_at(x, z, _region)
		var tree_count: int = 4 if biome == "pine" else (2 if biome == "marsh" else 1)
		if i < tree_count:
			var height: float = rng.randf_range(3.8, 7.5)
			var width: float = rng.randf_range(1.0, 1.75)
			trunks.append(Transform3D(Basis(Vector3.UP, rotation).scaled(Vector3(1.0, height * 0.7, 1.0)), Vector3(x, y + height * 0.35, z)))
			foliage.append(Transform3D(Basis(Vector3.UP, rotation).scaled(Vector3(width, height * 0.69, width)), Vector3(x, y + height * 0.64, z)))
			foliage.append(Transform3D(Basis(Vector3.UP, rotation + 0.25).scaled(Vector3(width * 0.74, height * 0.52, width * 0.74)), Vector3(x, y + height * 0.83, z)))
			obstacles.append({"x": x, "z": z, "r": 0.45})
		else:
			var scale: Vector3 = Vector3(rng.randf_range(0.6, 1.5), rng.randf_range(0.4, 1.1), rng.randf_range(0.7, 1.6))
			stones.append(Transform3D(Basis(Vector3.UP, rotation).scaled(scale), Vector3(x, y + scale.y * 0.25, z)))
			obstacles.append({"x": x, "z": z, "r": maxf(scale.x, scale.z) * 0.7})
	# Never materialize an obstacle around the car. Keep the whole props layer
	# absent/non-colliding until the driver has left its safe appearance radius.
	for obstacle: Dictionary in obstacles:
		if Vector2(float(obstacle.x) - _player.x, float(obstacle.z) - _player.z).length() < float(obstacle.r) + 3.0:
			return {"deferred": true}
	_add_multimesh(group, _trunk_mesh, trunks, false)
	_add_multimesh(group, _foliage_mesh, foliage, true)
	_add_multimesh(group, _rock_mesh, stones, true)
	return {"obstacles": obstacles, "count": trunks.size() + stones.size()}

func _add_multimesh(group: Node3D, mesh: Mesh, transforms: Array[Transform3D], colored: bool) -> void:
	if transforms.is_empty():
		return
	var instances: MultiMesh = MultiMesh.new()
	instances.transform_format = MultiMesh.TRANSFORM_3D
	instances.use_colors = colored
	instances.mesh = mesh
	instances.instance_count = transforms.size()
	for i: int in range(transforms.size()):
		instances.set_instance_transform(i, transforms[i])
		if colored:
			var tone: float = 0.84 + float(i % 6) * 0.032
			instances.set_instance_color(i, Color(tone, tone, tone, 1.0))
	var node: MultiMeshInstance3D = MultiMeshInstance3D.new()
	node.multimesh = instances
	node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF if _mobile else GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	group.add_child(node)

func _reset_visual_tiles() -> void:
	if is_instance_valid(_visual_root):
		_visual_root.hide()
		_visual_root.queue_free()
	_visual_root = Node3D.new()
	_visual_root.name = "DistanceTerrain"
	add_child(_visual_root)
	_visual_tiles.clear()
	_visual_queue.clear()
	_visual_centers.clear()
	_visual_delay = 0
	_fine_mask = Image.create_empty(FINE_MASK_SIZE, FINE_MASK_SIZE, false, Image.FORMAT_RGB8)
	_fine_mask_texture = ImageTexture.create_from_image(_fine_mask)
	_visual_materials.clear()
	var shader := Shader.new()
	shader.code = FINE_MASK_SHADER_CODE
	for level: int in range(VISUAL_SIZES.size()):
		var material := ShaderMaterial.new()
		material.shader = shader
		material.set_shader_parameter("fine_tiles", _fine_mask_texture)
		material.set_shader_parameter("far_layer", level == 1)
		_visual_materials.append(material)
	_refresh_visual_queue()
	# Seed medium ground under the camera's immediate surroundings before
	# filling the broad backdrop. This remains independent of world size.
	var minimum := Vector2i(floori((_player.x - 32.0) / VISUAL_SIZES[0]), floori((_player.z - 32.0) / VISUAL_SIZES[0]))
	var maximum := Vector2i(floori((_player.x + 32.0) / VISUAL_SIZES[0]), floori((_player.z + 32.0) / VISUAL_SIZES[0]))
	for z: int in range(minimum.y, maximum.y + 1):
		for x: int in range(minimum.x, maximum.x + 1):
			var key := Vector3i(x, z, 0)
			_build_visual_tile(key)
			_visual_queue.erase(key)
	var far: Vector2i = _visual_centers[1]
	for dz: int in range(-1, 2):
		for dx: int in range(-1, 2):
			var key := Vector3i(far.x + dx, far.y + dz, 1)
			_build_visual_tile(key)
			_visual_queue.erase(key)
	_visual_startup_count = _visual_tiles.size()
	_fine_mask_dirty = true
	_update_fine_mask()

func _update_fine_mask() -> void:
	if not _fine_mask_dirty:
		return
	var half: Vector2i = Vector2i.ONE * int(FINE_MASK_SIZE * 0.5)
	var origin: Vector2i = _center - half
	var mid_origin: Vector2i = _visual_centers[0] - half
	_fine_mask.fill(Color.BLACK)
	for key: Vector2i in _chunks:
		var relative: Vector2i = key - origin
		if relative.x >= 0 and relative.x < FINE_MASK_SIZE and relative.y >= 0 and relative.y < FINE_MASK_SIZE:
			_fine_mask.set_pixelv(relative, Color.RED)
	for key: Vector3i in _visual_tiles:
		if key.z != 0:
			continue
		var relative: Vector2i = Vector2i(key.x, key.y) - mid_origin
		var pixel: Color = _fine_mask.get_pixelv(relative)
		pixel.g = 1.0
		_fine_mask.set_pixelv(relative, pixel)
	_fine_mask_texture.update(_fine_mask)
	for material: ShaderMaterial in _visual_materials:
		material.set_shader_parameter("mask_origin", Vector2(origin))
		material.set_shader_parameter("mid_origin", Vector2(mid_origin))
	_fine_mask_dirty = false

func _wanted_far_radius() -> int:
	return 2 if _mobile or _avg_ms > 34.0 else VISUAL_RADII[1]

func _visual_center(size: float) -> Vector2i:
	return Vector2i(floori(_player.x / size), floori(_player.z / size))

func _refresh_visual_queue() -> void:
	_fine_mask_dirty = true
	_visual_queue.clear()
	_visual_centers.clear()
	_visual_far_radius = _wanted_far_radius()
	for level: int in range(VISUAL_SIZES.size()):
		var center: Vector2i = _visual_center(VISUAL_SIZES[level])
		_visual_centers.append(center)
		var radius: int = _visual_far_radius if level == 1 else VISUAL_RADII[level]
		for dz: int in range(-radius, radius + 1):
			for dx: int in range(-radius, radius + 1):
				var key := Vector3i(center.x + dx, center.y + dz, level)
				if not _visual_tiles.has(key):
					_visual_queue.append(key)
	_visual_queue.sort_custom(func(a: Vector3i, b: Vector3i) -> bool:
		return _visual_priority(a) < _visual_priority(b)
	)
	for key: Vector3i in _visual_tiles.keys():
		var offset: Vector2i = Vector2i(key.x, key.y) - _visual_centers[key.z]
		var retention: int = (_visual_far_radius if key.z == 1 else VISUAL_RADII[key.z]) + 1
		if maxi(absi(offset.x), absi(offset.y)) > retention:
			var node: MeshInstance3D = _visual_tiles[key]
			node.hide()
			node.queue_free()
			_visual_tiles.erase(key)

func _visual_priority(key: Vector3i) -> float:
	var size: float = VISUAL_SIZES[key.z]
	var center := (Vector2(key.x, key.y) + Vector2(0.5, 0.5)) * size
	return center.distance_squared_to(Vector2(_player.x, _player.z))

func _update_visual_tiles(started: int) -> void:
	if _visual_far_radius != _wanted_far_radius() or _visual_centers[0] != _visual_center(VISUAL_SIZES[0]) or _visual_centers[1] != _visual_center(VISUAL_SIZES[1]):
		_refresh_visual_queue()
	# Low-end devices alternate jobs. Keep the first 16m ring protected even
	# when the backdrop is incomplete. Ground and props share the same budget.
	_visual_delay += 1
	var interval := 3 if _mobile or _avg_ms > 34.0 else 1
	if _visual_delay < interval or _visual_queue.is_empty():
		return
	if Time.get_ticks_usec() - started >= BUILD_BUDGET_US / 2:
		return
	_visual_delay = 0
	_build_visual_tile(_visual_queue.pop_front())

func _build_visual_tile(key: Vector3i) -> void:
	var size: float = VISUAL_SIZES[key.z]
	var segments: int = VISUAL_SEGMENTS[key.z]
	var step_size: float = size / segments
	var stride: int = segments + 1
	var origin := Vector2(key.x, key.y) * size
	var points := PackedVector3Array()
	var colors := PackedColorArray()
	points.resize(stride * stride)
	colors.resize(stride * stride)
	for row: int in range(stride):
		for col: int in range(stride):
			var x: float = origin.x + col * step_size
			var z: float = origin.y + row * step_size
			var idx: int = row * stride + col
			var height: float = Terrain.height_at(x, z, _region)
			points[idx] = Vector3(x, height - VISUAL_CLEARANCE[key.z], z)
			colors[idx] = _surface_color(x, z, step_size)
	# A coarse cell near a road cut should sit below the road even if
	# its vertex samples land outside it. Apply the drop to all four corners.
	var original := points.duplicate()
	for row: int in range(segments):
		for col: int in range(segments):
			var x: float = origin.x + (col + 0.5) * step_size
			var z: float = origin.y + (row + 0.5) * step_size
			var idx: int = row * stride + col
			var height: float = Terrain.height_at(x, z, _region)
			var lowest: float = height - VISUAL_CLEARANCE[key.z]
			for corner: int in [idx, idx + 1, idx + stride, idx + stride + 1]:
				lowest = minf(lowest, original[corner].y)
			# Preserve most relief off road, but prevent distant ground
			# bridging over the fine trail through a steep bank.
			var corridor: bool = Terrain.road_distance(x, z) < step_size * 0.85 + 5.0
			if corridor:
				for corner: int in [idx, idx + 1, idx + stride, idx + stride + 1]:
					points[corner].y = minf(points[corner].y, lowest)
	var tool := SurfaceTool.new()
	tool.begin(Mesh.PRIMITIVE_TRIANGLES)
	_emit_grid(tool, points, colors, segments, 42.0 if key.z == 0 else 96.0)
	tool.set_material(_visual_materials[key.z])
	var node := MeshInstance3D.new()
	node.name = "Distance_%d_%d_%d" % [key.z, key.x, key.y]
	node.mesh = tool.commit()
	node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	_visual_root.add_child(node)
	_visual_tiles[key] = node
	_fine_mask_dirty = _fine_mask_dirty or key.z == 0
