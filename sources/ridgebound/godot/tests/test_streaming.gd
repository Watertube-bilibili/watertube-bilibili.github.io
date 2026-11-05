extends SceneTree
## Native deterministic streaming tests. Run with --headless --script tests/test_streaming.gd.
const Chunk = preload("res://chunk_manager.gd")
const Terrain = preload("res://terrain_math.gd")
var failures: int = 0
var checks: int = 0

class StalledChunks extends "res://chunk_manager.gd":
	# Model a device whose queued mesh generation has not finished this frame.
	func update_stream(_position: Vector3, _velocity: Vector3, _dt: float) -> void:
		pass

class UnsafeStepPhysics extends "res://physics.gd":
	# Inject step side effects to verify atomic rejection, not just XYZ rollback.
	func step(state: Dictionary, input: Dictionary, dt: float, obstacles: Array = []) -> void:
		super.step(state, input, dt, obstacles)
		state.x += 5.0
		state.checkpoint = 4
		state.completed = true
		state.damage.body -= 17.0
		state.winch.length -= 2.0
		state.contactHeights[0] += 5.0
		state.wheelHeights[0] -= 3.0

func check(condition: bool, label: String) -> void:
	checks += 1
	if condition:
		print("PASS ", label)
	else:
		push_error("FAIL " + label)
		failures += 1

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var manager = Chunk.new()
	root.add_child(manager)
	manager.setup("forest")
	check(manager.get_stats().chunkSize == 16 and manager.get_stats().buildBudgetMs == 3.0 and manager.get_stats().chunks == 4 and manager.get_stats().startupChunks == 4, "origin builds only four footprint-supporting 16m chunks")
	# Godot front faces are clockwise. A CCW mesh can pass all simulation tests
	# while disappearing completely from a camera above the ground.
	var ground: MeshInstance3D = manager.get_child(0).get_child(0)
	var ground_arrays: Array = ground.mesh.surface_get_arrays(0)
	var ground_vertices: PackedVector3Array = ground_arrays[Mesh.ARRAY_VERTEX]
	var ground_normals: PackedVector3Array = ground_arrays[Mesh.ARRAY_NORMAL]
	var ground_cross: Vector3 = (ground_vertices[1] - ground_vertices[0]).cross(ground_vertices[2] - ground_vertices[0])
	check(ground_normals[0].y > 0.0 and ground_cross.dot(ground_normals[0]) < 0.0, "fine terrain top is lit upward and clockwise-visible from above")
	check(manager.is_ready_at(0.0, 0.0), "spawn at a four-chunk junction has full vehicle support")
	check(manager.get_obstacles().is_empty() and manager.get_stats().propsChunks == 0 and not manager.props_ready_at(0.0, 0.0), "startup ground is safe before props exist and invisible props cannot collide")
	check(not manager.is_ready_at(15.0, 0.0), "center inside terrain cannot enter with unsupported outer wheels")
	check(not manager.is_ready_at(400.0, 400.0), "unloaded terrain is rejected")
	check(not manager.is_ready_at(NAN, 0.0), "non-finite positions are rejected")
	check(manager.get_stats().queued > 0, "forward chunks are queued before driving")
	for sample: Dictionary in [
		{"position": Vector3(8.0, 0.0, 8.0), "count": 1, "label": "inside one chunk"},
		{"position": Vector3(16.0, 0.0, 8.0), "count": 2, "label": "across one chunk edge"},
		{"position": Vector3(16.0, 0.0, 16.0), "count": 4, "label": "across a four-chunk corner"},
	]:
		manager.setup("forest", sample.position)
		var stats: Dictionary = manager.get_stats()
		check(stats.chunks == sample.count and stats.startupChunks == sample.count and manager.is_ready_at(sample.position.x, sample.position.z), "startup builds exactly the supported footprint " + sample.label)
		check(stats.queued > 0, "surrounding terrain remains queued instead of blocking startup " + sample.label)
	manager.setup("forest")
	var priority_ok: bool = true
	var one_layer_per_frame: bool = true
	for frame: int in range(90):
		var before_layers: Dictionary = manager.get_stats()
		manager.update_stream(Vector3.ZERO, Vector3.ZERO, 1.0 / 60.0)
		var after_layers: Dictionary = manager.get_stats()
		var ground_delta: int = int(after_layers.builtTotal) - int(before_layers.builtTotal)
		var props_delta: int = int(after_layers.propsBuiltTotal) - int(before_layers.propsBuiltTotal)
		priority_ok = priority_ok and (before_layers.groundQueued == 0 or props_delta == 0)
		one_layer_per_frame = one_layer_per_frame and ground_delta + props_delta <= 1
	check(priority_ok and one_layer_per_frame, "ground queue wins and a rendered frame never builds ground and props together")
	check(manager.get_stats().propsChunks > 0 and manager.get_obstacles().size() > 0, "background props become visible and collidable after the ground phase")
	var original_obstacles: String = JSON.stringify(manager.get_obstacles())
	var overlap_obstacle: Dictionary = manager.get_obstacles()[0].duplicate()
	manager.setup("forest")
	for frame: int in range(90):
		manager.update_stream(Vector3.ZERO, Vector3.ZERO, 1.0 / 60.0)
	check(JSON.stringify(manager.get_obstacles()) == original_obstacles, "reloading the same region preserves deterministic background obstacles")
	var overlap_position: Vector3 = Vector3(overlap_obstacle.x, 0.0, overlap_obstacle.z)
	manager.setup("forest", overlap_position)
	for frame: int in range(100):
		manager.update_stream(overlap_position, Vector3.ZERO, 1.0 / 60.0)
	var overlap_key: Vector2i = Vector2i(int(floor(overlap_position.x / 16.0)), int(floor(overlap_position.z / 16.0)))
	var overlap_entry: Dictionary = manager._chunks[overlap_key]
	check(manager.is_ready_at(overlap_position.x, overlap_position.z) and not manager.props_ready_at(overlap_position.x, overlap_position.z), "car overlapping a future prop keeps its ground ready but defers the whole props layer")
	check(overlap_entry.obstacles.is_empty() and overlap_entry.node.get_child_count() == 1, "deferred props add neither visual meshes nor invisible collisions")
	var clear_position: Vector3 = Vector3((float(overlap_key.x) + 0.5) * 16.0 + 32.0, 0.0, (float(overlap_key.y) + 0.5) * 16.0)
	for frame: int in range(100):
		manager.update_stream(clear_position, Vector3.ZERO, 1.0 / 60.0)
	overlap_entry = manager._chunks[overlap_key]
	check(manager.props_ready_at(overlap_position.x, overlap_position.z) and not overlap_entry.obstacles.is_empty() and overlap_entry.node.get_child_count() > 1, "leaving the safe appearance radius activates visuals and collision together")
	manager.setup("forest")
	check(not manager.is_ready_at(10.0, 35.0), "rapid movement target is unavailable before neighboring chunks are built")
	var previous_total: int = manager.get_stats().builtTotal
	var max_built_per_frame: int = 0
	for frame: int in range(50):
		manager.update_stream(Vector3(10.0, 0.0, 35.0), Vector3(0.0, 0.0, 8.0), 1.0 / 60.0)
		var built: int = manager.get_stats().builtTotal
		max_built_per_frame = maxi(max_built_per_frame, built - previous_total)
		previous_total = built
	check(max_built_per_frame == 1, "runtime builds at most one chunk per frame")
	check(manager.is_ready_at(10.0, 35.0), "crossed chunk boundary becomes fully supported")
	for frame: int in range(1000):
		manager.update_stream(Vector3(10.0, 0.0, 35.0), Vector3(0.0, 0.0, 8.0), 1.0 / 60.0)
	check(manager.get_stats().radius == 5, "stable desktop frame timing expands visibility to the bounded five-chunk radius")
	for frame: int in range(220):
		manager.update_stream(Vector3(10.0, 0.0, 35.0), Vector3.ZERO, 0.035)
	check(manager.get_stats().radius == 2, "moderately slow measured frames retain a two-chunk visibility radius")
	for frame: int in range(220):
		manager.update_stream(Vector3(10.0, 0.0, 35.0), Vector3.ZERO, 0.060)
	check(manager.get_stats().radius == 1, "slow measured frames reduce streaming radius")
	check(manager.get_stats().segments == 8, "slow measured frames reduce future terrain mesh subdivisions")
	var time_before: float = manager.get_stats().avgMs
	manager.update_stream(Vector3(10.0, 0.0, 35.0), Vector3.ZERO, 2.0)
	check(is_equal_approx(manager.get_stats().avgMs, time_before), "background-tab suspension does not pollute performance average")
	var before_invalid: int = manager.get_stats().builtTotal
	manager.update_stream(Vector3(NAN, 0.0, 0.0), Vector3.ZERO, 1.0 / 60.0)
	check(manager.get_stats().builtTotal == before_invalid, "invalid streaming request cannot mutate world")
	var old_count: int = manager.get_stats().chunks
	var destination: Vector3 = Vector3(1024.0, 0.0, 1024.0)
	manager.update_stream(destination, Vector3.ZERO, 1.0 / 60.0)
	check(manager.get_stats().chunks >= old_count, "old ring remains resident while teleport destination is building")
	check(manager.is_ready_at(10.0, 35.0), "old vehicle footprint remains supported before replacement is ready")
	check(not manager.is_ready_at(destination.x, destination.z), "one newly loaded tile is insufficient at a four-chunk junction")
	for frame: int in range(45):
		manager.update_stream(destination, Vector3.ZERO, 1.0 / 60.0)
	check(manager.is_ready_at(destination.x, destination.z), "destination becomes driveable only after support tiles load")
	check(not manager.is_ready_at(10.0, 35.0), "distant old ring is retired after replacement support exists")
	check(manager.get_stats().chunks < 25, "retained chunk count stays bounded after a long jump")
	var saved_spawn: Vector3 = Vector3(Terrain.route_x(240.0), 15.0, 240.0)
	manager.setup("snow", saved_spawn)
	check(manager.get_stats().chunks >= 1 and manager.get_stats().chunks <= 4 and manager.get_stats().chunks == manager.get_stats().startupChunks and manager.get_stats().region == "snow", "map switch builds only the new spawn footprint without old-generation leakage")
	check(manager.is_ready_at(saved_spawn.x, saved_spawn.z), "saved checkpoint gets synchronous ground at its actual position")
	check(not manager.is_ready_at(0.0, 0.0), "saved checkpoint setup does not waste initial ring at origin")
	check(manager.get_stats().objects >= manager.get_stats().chunks and manager.get_stats().groundReady, "diagnostics count loaded surfaces and supported player")
	manager.queue_free()
	await process_frame
	# Exercise the production position-acceptance guard while generation stalls.
	var main_scene: PackedScene = load("res://main.tscn")
	var game = main_scene.instantiate()
	root.add_child(game)
	game.set_process(false)
	game.chunks.queue_free()
	var stalled: StalledChunks = StalledChunks.new()
	game.add_child(stalled)
	game.chunks = stalled
	stalled.setup("forest")
	game.state.x = 13.2
	game.state.z = 0.0
	game.state.y = Terrain.height_at(13.2, 0.0) + 0.65
	game.state.yaw = PI * 0.5
	game.state.speed = 10.0
	game.simulation = UnsafeStepPhysics.new()
	game.state.checkpoint = 3
	game.state.completed = false
	game.state.winch = {"anchor": {"x": 25.0, "y": 5.0, "z": 0.0}, "length": 12.0, "tension": 0.0}
	var protected_state: Dictionary = game.state.duplicate(true)
	var safe_position: Vector3 = Vector3(game.state.x, game.state.y, game.state.z)
	check(stalled.is_ready_at(safe_position.x, safe_position.z), "edge-stop scenario begins on fully supported ground")
	game._process(0.1)
	check(game.streaming_waiting, "approaching an unbuilt footprint starts protective braking")
	check(game.blocked and is_equal_approx(game.state.x, safe_position.x) and is_equal_approx(game.state.z, safe_position.z) and is_zero_approx(game.state.speed) and stalled.is_ready_at(game.state.x, game.state.z), "stalled loader makes production guard roll back unsafe movement onto opaque supported ground")
	check(game.state.checkpoint == protected_state.checkpoint and game.state.completed == protected_state.completed, "unsafe step cannot leak checkpoint completion or rewards")
	check(game.state.damage == protected_state.damage and game.state.winch.length == protected_state.winch.length, "unsafe step rolls back nested damage and winch length")
	check(game.state.contactHeights == protected_state.contactHeights and game.state.wheelHeights == protected_state.wheelHeights, "unsafe step restores contact and wheel samples as one state snapshot")
	game.queue_free()
	await process_frame
	print("STREAMING_CHECKS ", checks, " FAILURES ", failures)
	quit(failures)
