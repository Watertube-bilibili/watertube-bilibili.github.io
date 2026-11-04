extends SceneTree
## Native deterministic streaming tests. Run with --headless --script tests/test_streaming.gd.
const Chunk = preload("res://chunk_manager.gd")
const Terrain = preload("res://terrain_math.gd")
var failures: int = 0
var checks: int = 0

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
	check(manager.get_stats().chunks == 9, "initial ring has exactly nine complete chunks")
	# Godot front faces are clockwise. A CCW mesh can pass all simulation tests
	# while disappearing completely from a camera above the ground.
	var ground: MeshInstance3D = manager.get_child(0).get_child(0)
	var ground_arrays: Array = ground.mesh.surface_get_arrays(0)
	var ground_vertices: PackedVector3Array = ground_arrays[Mesh.ARRAY_VERTEX]
	var ground_normals: PackedVector3Array = ground_arrays[Mesh.ARRAY_NORMAL]
	var ground_cross: Vector3 = (ground_vertices[1] - ground_vertices[0]).cross(ground_vertices[2] - ground_vertices[0])
	check(ground_normals[0].y > 0.0 and ground_cross.dot(ground_normals[0]) < 0.0, "fine terrain top is lit upward and clockwise-visible from above")
	check(manager.is_ready_at(0.0, 0.0), "spawn at a four-chunk junction has full vehicle support")
	check(not manager.is_ready_at(63.0, 0.0), "center inside terrain cannot enter with unsupported outer wheels")
	check(not manager.is_ready_at(400.0, 400.0), "unloaded terrain is rejected")
	check(not manager.is_ready_at(NAN, 0.0), "non-finite positions are rejected")
	check(manager.get_stats().queued > 0, "forward chunks are queued before driving")
	var original_obstacles: String = JSON.stringify(manager.get_obstacles())
	check(manager.get_obstacles().size() > 0, "scatter exposes tree and rock collisions")
	manager.setup("forest")
	check(JSON.stringify(manager.get_obstacles()) == original_obstacles, "reloading the same region preserves deterministic obstacles")
	var previous_total: int = manager.get_stats().builtTotal
	var max_built_per_frame: int = 0
	for frame: int in range(50):
		manager.update_stream(Vector3(10.0, 0.0, 35.0), Vector3(0.0, 0.0, 8.0), 1.0 / 60.0)
		var built: int = manager.get_stats().builtTotal
		max_built_per_frame = maxi(max_built_per_frame, built - previous_total)
		previous_total = built
	check(max_built_per_frame == 1, "runtime builds at most one chunk per frame")
	check(manager.is_ready_at(10.0, 35.0), "crossed chunk boundary becomes fully supported")
	for frame: int in range(700):
		manager.update_stream(Vector3(10.0, 0.0, 35.0), Vector3(0.0, 0.0, 8.0), 1.0 / 60.0)
	check(manager.get_stats().radius >= 2 and manager.get_stats().radius <= 3, "stable frame timing expands visibility within bounded radius")
	for frame: int in range(220):
		manager.update_stream(Vector3(10.0, 0.0, 35.0), Vector3.ZERO, 0.045)
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
	check(manager.get_stats().chunks == 9 and manager.get_stats().region == "snow", "map switch resets chunks and region without old-generation leakage")
	check(manager.is_ready_at(saved_spawn.x, saved_spawn.z), "saved checkpoint gets synchronous ground at its actual position")
	check(not manager.is_ready_at(0.0, 0.0), "saved checkpoint setup does not waste initial ring at origin")
	check(manager.get_stats().objects > 9 and manager.get_stats().groundReady, "diagnostics count visible scenery and supported player")
	manager.queue_free()
	await process_frame
	print("STREAMING_CHECKS ", checks, " FAILURES ", failures)
	quit(failures)
