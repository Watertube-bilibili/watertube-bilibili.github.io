extends SceneTree
## Native engine integration smoke test; browser bridge is covered separately.
const MainScene = preload("res://main.tscn")
const Terrain = preload("res://terrain_math.gd")
const Physics = preload("res://physics.gd")
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
	root.add_child(game)
	game.set_process(false)
	check(game.state is Dictionary and game.state.region == "forest", "main scene initializes forest simulation")
	check(game.chunks != null and game.chunks.is_ready_at(game.state.x, game.state.z), "initial vehicle is above fully loaded fine terrain")
	check(game.vehicle != null and game.body != null, "original Blender GLB and sprung body are present")
	var all_wheels: bool = game.wheels.size() == 4
	for wheel in game.wheels:
		all_wheels = all_wheels and wheel != null
	check(all_wheels, "four separate wheel nodes are available for suspension")
	check(game.steering != null and game.speed_needle != null and game.rpm_needle != null, "cockpit steering wheel and both instrument needles exist")
	check(game.anchors.size() > 0 and game.anchors.size() < 80 and game.checkpoints.size() == 4, "nearby anchor pool stays bounded while all four expedition checkpoints exist")
	check(Terrain.repair_sites().size() == 7, "expanded main road and branches expose seven repair sites")
	var initial_anchor_ids: Array = []
	for anchor: Dictionary in game.anchors:
		initial_anchor_ids.append(anchor.id)
	game._refresh_nearby_anchors(true)
	var refreshed_anchor_ids: Array = []
	for anchor: Dictionary in game.anchors:
		refreshed_anchor_ids.append(anchor.id)
	check(initial_anchor_ids == refreshed_anchor_ids, "refreshing a stationary anchor pool preserves stable IDs")
	check(game._anchor_visuals.is_empty() and game.get_snapshot().anchors.is_empty(), "unrendered anchor data is absent from visuals and selection")
	game._command({"type": "attach", "id": game.anchors[0].id})
	check(game.state.winch == null, "winch cannot attach to an anchor whose props layer is not visible")
	check(game.terrain_safety != null and game.terrain_safety.mesh != null and game.coarse_triangles > 0, "resident coarse terrain provides a permanent opaque horizon")
	var coarse_arrays: Array = game.terrain_safety.mesh.surface_get_arrays(0)
	var coarse_vertices: PackedVector3Array = coarse_arrays[Mesh.ARRAY_VERTEX]
	var coarse_normals: PackedVector3Array = coarse_arrays[Mesh.ARRAY_NORMAL]
	var coarse_cross: Vector3 = (coarse_vertices[1] - coarse_vertices[0]).cross(coarse_vertices[2] - coarse_vertices[0])
	check(coarse_normals[0].y > 0.0 and coarse_cross.dot(coarse_normals[0]) < 0.0, "resident terrain top uses Godot clockwise front-face winding")
	var old_position: Vector2 = Vector2(game.state.x, game.state.z)
	for frame: int in range(180):
		game.simulation.step(game.state, {"throttle": 1.0}, 1.0 / 60.0)
	game._update_vehicle(1.0 / 60.0)
	check(Vector2(game.state.x, game.state.z).distance_to(old_position) > 4.0, "physics drives the integrated vehicle forward")
	check(game.vehicle.position.is_equal_approx(Vector3(game.state.x, game.state.y, game.state.z)), "rendered vehicle follows simulated position")
	var old_steering_basis: Basis = game.steering.basis if game.steering != null else Basis.IDENTITY
	var old_speed_basis: Basis = game.speed_needle.basis if game.speed_needle != null else Basis.IDENTITY
	game.state.steering = 0.65
	game.state.speed = 8.0
	game.state.wheelRotation = 2.4
	game.state.wheelHeights[0] += 0.19
	game.state.wheelHeights[1] -= 0.09
	game._update_vehicle(1.0 / 60.0)
	check(game.steering != null and not game.steering.basis.is_equal_approx(old_steering_basis), "steering input rotates the real cockpit wheel")
	check(game.speed_needle != null and not game.speed_needle.basis.is_equal_approx(old_speed_basis), "vehicle speed animates the cockpit speedometer")
	check(all_wheels and absf(game.wheels[0].position.y - game.wheels[1].position.y) > 0.1, "left and right wheel suspension transforms differ")
	game._command({"type": "start"})
	game._command({"type": "camera"})
	game._command({"type": "camera"})
	for frame: int in range(60):
		game._update_camera(1.0 / 60.0)
	var view_direction: Vector3 = -game.camera.global_basis.z
	check(game.camera_mode == 2 and game.camera.position.is_finite(), "cockpit camera selects and remains finite")
	check(game.camera.position.distance_to(game.vehicle.position) < 5.0, "cockpit camera is physically inside the car")
	check(view_direction.dot(game.vehicle.global_basis.z) > 0.7, "cockpit camera looks through the forward windshield")
	game._command({"type": "reset", "region": "forest", "snowTires": false, "progress": 2, "playing": true})
	check(game.state.checkpoint == 2 and absf(game.state.z - float(Terrain.checkpoints()[1].z)) < 8.0, "reset restores the saved checkpoint")
	check(game.chunks.is_ready_at(game.state.x, game.state.z), "saved checkpoint has synchronous ground before the first drive frame")
	var forest_damage: Dictionary = {"body": 24.0, "tires": 35.0, "suspension": 48.0}
	game.state.damage = forest_damage.duplicate()
	game.state.x = -900.0
	game.state.z = -150.0
	game.state.y = Terrain.height_at(game.state.x, game.state.z) + 0.65
	game.state.speed = 0.0
	game.state.repairAvailable = false
	game._command({"type": "repair"})
	check(game.state.damage.body == 24.0, "repair request outside an available hut cannot repair")
	var repair_site: Dictionary = Terrain.repair_sites()[1]
	game.state.x = float(repair_site.x)
	game.state.z = float(repair_site.z)
	game.state.y = Terrain.height_at(game.state.x, game.state.z, "forest") + 0.65
	game.state.speed = 0.0
	game._process(0.0)
	check(game.state.repairAvailable, "stopped vehicle at a hut offers free repair")
	game._command({"type": "repair"})
	check(game.state.damage.body == 100.0 and game.state.damage.tires == 100.0 and game.state.damage.suspension == 100.0, "hut command restores body tires and suspension")
	game._command({"type": "reset", "region": "snow", "snowTires": true, "progress": 3, "playing": true})
	check(game.state.region == "snow" and game.state.snowTires, "map command restores winter tire equipment")
	check(game.chunks.get_stats().region == "snow" and game.chunks.is_ready_at(game.state.x, game.state.z), "snow map and restored position share the same loaded terrain generation")
	game.chunks.setup("snow", Vector3(768.0, 0.0, 2048.0))
	game._command({"type": "recover"})
	check(game.chunks.is_ready_at(game.state.x, game.state.z), "recovery synchronously restores unloaded checkpoint support")
	var snapshot: Dictionary = game.get_snapshot()
	check(snapshot.has("steer") and snapshot.has("damage") and snapshot.has("streaming") and snapshot.has("anchors") and snapshot.has("repairAvailable"), "browser bridge snapshot carries steering feedback damage terrain and rescue state")
	var decoded = JSON.parse_string(JSON.stringify(snapshot))
	check(decoded is Dictionary and decoded.region == "snow" and decoded.streaming.groundReady, "browser snapshot survives JSON transport")
	snapshot.damage.body = 0.0
	check(game.state.damage.body == 100.0, "snapshot consumers cannot mutate live vehicle integrity")
	var physics = Physics.new()
	var gentle: Dictionary = physics.create_state()
	var strong: Dictionary = physics.create_state()
	gentle.speed = 7.0
	strong.speed = 7.0
	for frame: int in range(20):
		physics.step(gentle, {"brakeValue": 0.2}, 1.0 / 60.0)
		physics.step(strong, {"brakeValue": 1.0}, 1.0 / 60.0)
	check(strong.speed + 0.5 < gentle.speed, "analog pedal brake values produce graded braking")
	for branch_index: int in range(Terrain.branch_routes().size()):
		var branch: Dictionary = Terrain.branch_routes()[branch_index]
		game.state.z = (float(branch.start) + float(branch.end)) * 0.5
		game.state.x = Terrain.branch_x(branch_index, game.state.z)
		game._refresh_nearby_anchors(true)
		var local_pool: bool = game.anchors.size() > 0 and game.anchors.size() < 80
		for anchor: Dictionary in game.anchors:
			local_pool = local_pool and Vector2(anchor.x - game.state.x, anchor.z - game.state.z).length() <= 96.01 and Terrain.road_distance(anchor.x, anchor.z) >= 6.0
		check(local_pool, "branch %d anchors remain bounded nearby and outside driving corridors" % branch_index)
	var nearest: Dictionary = {}
	var nearest_distance: float = INF
	for anchor: Dictionary in game.anchors:
		var distance: float = Vector2(anchor.x - game.state.x, anchor.z - game.state.z).length()
		if distance < nearest_distance:
			nearest_distance = distance
			nearest = anchor
	if not nearest.is_empty():
		game.state.winch = {"anchor": nearest.duplicate(), "length": nearest_distance, "tension": 0.0}
		game.state.x += 10.0
		game._refresh_nearby_anchors(true)
		var kept: bool = false
		for anchor: Dictionary in game.anchors:
			kept = kept or anchor.id == nearest.id
		check(kept and game.state.winch.anchor.id == nearest.id, "moving the local anchor window preserves an attached nearby anchor ID")
	else:
		check(false, "moving the local anchor window preserves an attached nearby anchor ID")
	game.queue_free()
	await process_frame
	print("RUNTIME_CHECKS ", checks, " FAILURES ", failures)
	quit(failures)
