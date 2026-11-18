extends SceneTree

const Game := preload("res://main.tscn")
const Fit := preload("res://screen_fit.gd")
var failures := 0

func check(value: bool, detail: String) -> void:
	if value:
		print("PASS ", detail)
	else:
		failures += 1
		push_error(detail)

func _initialize() -> void:
	run.call_deferred()

func run() -> void:
	var game = Game.instantiate()
	root.add_child(game)
	game.set_process(false)
	game._command({"type": "start"})
	game._update_camera(1.0)
	var baseline: Vector3 = game.camera.position - game.vehicle.position
	game._command({"type":"orbit", "delta": PI * 0.5, "pitchDelta": 0.4})
	for frame: int in range(75):
		game._update_camera(1.0 / 60)
	var side: Vector3 = game.camera.position - game.vehicle.position
	check(side.y > baseline.y + 1.0 and Vector2(side.x, side.z).normalized().dot(Vector2(baseline.x, baseline.z).normalized()) < 0.15, "horizontal and vertical orbit move the actual exterior view")
	game._command({"type":"orbit", "delta": 3.0 * PI, "pitchDelta": 80.0})
	check(absf(game.camera.orbit_yaw) <= PI and game.camera.orbit_pitch < 1.1, "orbit wraps around the car and cannot flip the horizon")
	game._command({"type":"camera"})
	game._command({"type":"camera"})
	game._command({"type":"orbit", "delta": 1.0, "pitchDelta": 1.0})
	check(game.camera.orbit_yaw == 0.0 and game.camera.orbit_pitch == 0.0, "cockpit ignores exterior gestures")
	var before: Vector2 = Vector2(game.state.x, game.state.z)
	game._command({"type":"vehicle", "id":"yuchuan"})
	check(game.state.vehicleId == "yuchuan" and game.steering and game.brake_pedal and game.accelerator_pedal and game.wheels.size() == 4, "garage mounts the drivable production MPV and its independent pedals")
	check(before == Vector2(game.state.x, game.state.z) and game.driver_eye_local.distance_to(Vector3(.49, 1.32, .48)) < .01, "vehicle swap preserves current position and selects left hand MPV eye")
	game._update_camera(1.0)
	var neutral: Basis = game.steering_rest
	var axis_marker := Vector3(.16, 0, 0)
	var wheel: Node3D = game.steering
	var center: Vector2 = game.camera.unproject_position(wheel.global_position)
	var a: Vector2 = game.camera.unproject_position(wheel.to_global(axis_marker)) - center
	for direction: float in [-1.0, 1.0]:
		game.state.roadSteeringAngle = -direction * .06
		game._update_vehicle(0.0)
		var b: Vector2 = game.camera.unproject_position(wheel.to_global(axis_marker)) - center
		check(a.cross(b) * direction > 0.0, "MPV steering as projected in cockpit matches dial and course %s" % direction)
		wheel.basis = neutral
	game._command({"type":"pedal_calibration", "maxForceN": 1800.0})
	game.simulation.step(game.state, {"brakeForceN":1600.0}, 1.0 / 60)
	check(not game.state.brakePedalBroken, "1600 N allowed through integrated MPV")
	game.simulation.step(game.state, {"brakeForceN":1600.1}, 1.0 / 60)
	game._update_vehicle(0.0)
	check(game.state.brakePedalBroken and not game.brake_pedal.basis.is_equal_approx(game.brake_rest), "threshold breaks the physical cockpit pedal node")
	game._command({"type":"vehicle", "id":"rover"})
	check(not game.state.brakePedalBroken, "original vehicle has a separate sound brake")
	game._command({"type":"vehicle", "id":"yuchuan"})
	game._command({"type":"reset", "region":"snow", "snowTires":false, "playing":true})
	game._command({"type":"recover"})
	check(game.state.brakePedalBroken, "switching cars, recovering and entering snow on stock tires preserve broken MPV")
	var second = Game.instantiate()
	second.bootstrap_options = {"vehicleId":"yuchuan", "maxForceN":1800}
	root.add_child(second)
	second.set_process(false)
	check(second.state.brakePedalBroken and second.state.vehicleId == "yuchuan", "broken MPV survives reloading the game and mounting from boot")
	second.state.x = float(second.repair_sites[0].x)
	second.state.z = float(second.repair_sites[0].z)
	second._command({"type":"repair"})
	check(not second.state.brakePedalBroken, "authorized repair at a real map cabin restores brakes")
	var options := Fit.options()
	check(options.size() >= 60, "local offline phone catalogue has at least 60 presets")
	var model := {"id":"sample","top":.14,"bottom":.08}
	var left := Fit.fit(Vector2(844,390), Vector4.ZERO, model, "auto", 1, 0.0)
	var right := Fit.fit(Vector2(844,390), Vector4.ZERO, model, "auto", 3, 0.0)
	var hardware := Fit.fit(Vector2(390,844), Vector4(0,70,0,20), model, "auto", 0, 0.0)
	var inverted := Fit.fit(Vector2(390,844),Vector4.ZERO,model,"auto",2,0.0)
	check(left.x > 50 and right.z == left.x and hardware.y == 70.0 and inverted.w > 50, "portrait, reverse portrait, both landscape edges and system safe area")
	second.queue_free()
	game.queue_free()
	await process_frame
	print("SUMMIT_INTEGRATION_FAILURES ", failures)
	quit(failures)
