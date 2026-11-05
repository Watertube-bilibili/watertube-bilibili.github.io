extends SceneTree
## Startup bootstrap, cached safety terrain and stabilized left-hand-drive camera.
const MainScene = preload("res://main.tscn")
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
	var game = MainScene.instantiate()
	game.bootstrap_options = {"region": "snow", "snowTires": true, "progress": 2}
	root.add_child(game)
	game.set_process(false)
	var first: Dictionary = game.get_snapshot()
	check(first.region == "snow" and first.checkpoint == 2 and first.snowTires, "first published state honors saved snow region checkpoint and tires")
	check(first.startup.worldBuilds == 1, "cold startup constructs exactly one world")
	check(game.terrain_safety_meshes.size() == 1 and game.terrain_safety_meshes.has("snow"), "snow startup never constructs an unused forest world")
	check(first.streaming.chunkSize == 16 and first.streaming.chunks >= 1 and first.streaming.chunks <= 4 and first.streaming.chunks == first.streaming.startupChunks and first.streaming.groundReady, "initial snapshot builds only the 16m chunks supporting the vehicle footprint")
	check(first.streaming.propsChunks == 0 and game.chunks.get_obstacles().is_empty(), "startup publishes safe ground before deferred scenery collision")
	check(first.z > 145.0 and game.chunks.is_ready_at(first.x, first.z), "saved checkpoint has fine terrain beneath the actual spawn")
	var timing: Dictionary = first.startup
	check(timing.initializationMs > 0.0 and timing.worldBuildMs > 0.0 and timing.chunksMs > 0.0 and timing.sceneryMs > 0.0, "startup diagnostics expose measured initialization and build phases")
	check(timing.initializationMs + 0.03 >= timing.worldBuildMs and timing.worldBuildMs + 0.03 >= timing.chunksMs + timing.sceneryMs, "reported nested phase timings are consistent")
	check(first.coarseTriangles == 3922, "resident safety mesh retains all 3922 horizon triangles")
	var safety_mesh: ArrayMesh = game.terrain_safety.mesh
	var mesh_arrays: Array = safety_mesh.surface_get_arrays(0)
	var vertices: PackedVector3Array = mesh_arrays[Mesh.ARRAY_VERTEX]
	var normals: PackedVector3Array = mesh_arrays[Mesh.ARRAY_NORMAL]
	var cross_product: Vector3 = (vertices[1] - vertices[0]).cross(vertices[2] - vertices[0])
	check(normals[0].y > 0.0 and cross_product.dot(normals[0]) < 0.0, "cached safety mesh preserves clockwise top-face visibility")
	var old_scenery_id: int = game.scenery.get_instance_id()
	game._command({"type": "reset", "region": "snow", "snowTires": true, "progress": 2, "playing": false})
	var reset: Dictionary = game.get_snapshot()
	check(reset.startup.worldBuilds == 2, "explicit reset still constructs a fresh gameplay world")
	check(game.scenery.get_instance_id() != old_scenery_id, "reset rebuilds scenery nodes rather than reusing stale scene state")
	check(game.terrain_safety.mesh == safety_mesh, "same-region reset reuses the immutable coarse terrain mesh")
	check(reset.streaming.chunks >= 1 and reset.streaming.chunks <= 4 and reset.streaming.chunks == reset.streaming.startupChunks and reset.streaming.groundReady and reset.coarseTriangles == 3922, "cached reset preserves initial ground and horizon coverage")
	var invalid_progress_ok: bool = true
	for invalid: Variant in [-1, 4, 50, "2", NAN, INF, {}, false]:
		invalid_progress_ok = invalid_progress_ok and game._normalize_bootstrap({"progress": invalid}).progress == 0
	check(invalid_progress_ok, "completed and malformed checkpoint values normalize to a fresh trip")
	game.playing = true
	game.camera_mode = 2
	game.state.yaw = 0.0
	for pitch: float in [-1.0, 1.0]:
		for roll: float in [-1.0, 1.0]:
			game.state.pitch = pitch
			game.state.roll = roll
			game._update_vehicle(1.0 / 60.0)
			for frame: int in range(180):
				game._update_camera(1.0 / 60.0)
			var offset: Vector3 = game.camera.position - game.vehicle.position
			var view: Vector3 = -game.camera.global_basis.z
			var up: Vector3 = game.camera.global_basis.y
			var label: String = " pitch=%s roll=%s" % [pitch, roll]
			check(absf(offset.x - 0.47) < 0.002 and absf(offset.y - 1.58) < 0.002 and absf(offset.z + 0.45) < 0.002, "left-hand-drive eye stays anchored without body-tilt orbit" + label)
			check(absf(asin(clampf(view.y, -1.0, 1.0))) < 0.32 and absf(asin(clampf(up.x, -1.0, 1.0))) < 0.085 and view.z > 0.93, "cockpit pitch and roll remain bounded under extreme suspension tilt" + label)
	game.queue_free()
	await process_frame
	var fallback = MainScene.instantiate()
	fallback.bootstrap_options = {"region": "unknown-region", "snowTires": "true", "progress": 4}
	root.add_child(fallback)
	fallback.set_process(false)
	var fallback_state: Dictionary = fallback.get_snapshot()
	check(fallback_state.region == "forest" and fallback_state.checkpoint == 0 and not fallback_state.snowTires, "invalid region completed trip and nonboolean tire value receive safe startup defaults")
	check(fallback_state.startup.worldBuilds == 1 and fallback_state.streaming.groundReady, "normalized startup still builds only one fully supported world")
	fallback.queue_free()
	await process_frame
	print("STARTUP_CHECKS ", checks, " FAILURES ", failures)
	quit(failures)
