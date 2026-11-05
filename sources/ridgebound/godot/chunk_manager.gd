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
		_center = next_center
		_refresh_time = 0.0
		_refresh_queue()
	var started: int = Time.get_ticks_usec()
	# One bounded mesh build per rendered frame. Each chunk is deliberately small;
	# the 3ms target never permits a second build in the same rendered frame.
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

func _surface_color(x: float, z: float) -> Color:
	var color: Color
	var surface: String = Terrain.surface_at(x, z, _region)
	if _region == "snow":
		color = Color("d5e2dd") if absf(x - Terrain.route_x(z)) >= 3.5 else Color("acbec0")
		if surface == "ice":
			color = Color("91b6be")
	else:
		match surface:
			"mud": color = Color("756146")
			"water": color = Color("688f89")
			"rock": color = Color("96998a")
			_: color = Color("a5ad76")
		if absf(x - Terrain.route_x(z)) < 3.5 and surface != "mud":
			color = Color("c9b18b")
	var variation: float = sin(x * 0.34 + z * 0.18) * 0.035 + cos(z * 0.27 - x * 0.13) * 0.025
	return color.lightened(variation) if variation >= 0.0 else color.darkened(-variation)

func _point(x: float, z: float) -> Vector3:
	return Vector3(x, Terrain.height_at(x, z, _region), z)

func _add_triangle(tool: SurfaceTool, a: Vector3, b: Vector3, c: Vector3) -> void:
	var normal: Vector3 = (b - a).cross(c - a).normalized()
	# Godot front faces use clockwise winding. Keep the upward normal,
	# reverse vertex submission from the cross-product convention.
	for vertex: Vector3 in [a, c, b]:
		tool.set_normal(normal)
		tool.set_color(_surface_color(vertex.x, vertex.z))
		tool.add_vertex(vertex)

func _build_chunk(key: Vector2i) -> void:
	if _chunks.has(key):
		return
	var group: Node3D = Node3D.new()
	group.name = "Chunk_%d_%d" % [key.x, key.y]
	var x0: float = float(key.x) * CHUNK_SIZE
	var z0: float = float(key.y) * CHUNK_SIZE
	var step_size: float = CHUNK_SIZE / float(_segments)
	var tool: SurfaceTool = SurfaceTool.new()
	tool.begin(Mesh.PRIMITIVE_TRIANGLES)
	for iz: int in range(_segments):
		for ix: int in range(_segments):
			var x: float = x0 + float(ix) * step_size
			var z: float = z0 + float(iz) * step_size
			var a: Vector3 = _point(x, z)
			var b: Vector3 = _point(x + step_size, z)
			var c: Vector3 = _point(x, z + step_size)
			var d: Vector3 = _point(x + step_size, z + step_size)
			_add_triangle(tool, a, c, b)
			_add_triangle(tool, b, c, d)
	# Downward edge skirts hide T-junctions between different adaptive resolutions.
	# They also give the furthest visible tile a solid edge until fog takes over.
	for edge: int in range(4):
		for i: int in range(_segments):
			var a: Vector3
			var b: Vector3
			var t: float = float(i) * step_size
			match edge:
				0:
					a = _point(x0, z0 + t)
					b = _point(x0, z0 + t + step_size)
				1:
					a = _point(x0 + CHUNK_SIZE, z0 + t + step_size)
					b = _point(x0 + CHUNK_SIZE, z0 + t)
				2:
					a = _point(x0 + t + step_size, z0)
					b = _point(x0 + t, z0)
				_:
					a = _point(x0 + t, z0 + CHUNK_SIZE)
					b = _point(x0 + t + step_size, z0 + CHUNK_SIZE)
			_add_triangle(tool, a, a - Vector3.UP * SKIRT_DEPTH, b)
			_add_triangle(tool, b, a - Vector3.UP * SKIRT_DEPTH, b - Vector3.UP * SKIRT_DEPTH)
	tool.set_material(_terrain_material)
	var ground: MeshInstance3D = MeshInstance3D.new()
	ground.mesh = tool.commit()
	ground.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	group.add_child(ground)
	add_child(group)
	_chunks[key] = {"node": group, "obstacles": [], "objects": 1, "segments": _segments, "propsReady": false}
	_enqueue_props(key)
	_obstacles_dirty = true
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
		if absf(x - Terrain.route_x(z)) < 6.0:
			continue
		var surface: String = Terrain.surface_at(x, z, _region)
		if surface == "water" or surface == "ice":
			continue
		var y: float = Terrain.height_at(x, z, _region)
		var rotation: float = rng.randf_range(0.0, TAU)
		if i < 4:
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
