extends SceneTree
## Failure is driven by physical pedal load, independently of the selected input device.
const Physics := preload("res://physics.gd")
const TEST_STEP := 1.0 / 60.0
var failures := 0
var checks := 0

func _initialize() -> void:
	call_deferred("_run")

func _check(condition: bool, label: String) -> void:
	checks += 1
	if condition:
		print("PASS ", label)
	else:
		push_error("FAIL " + label)
		failures += 1

func _run() -> void:
	var physics := Physics.new()
	var mpv := physics.create_state("forest", false, "yuchuan")
	_check(mpv.vehicleId == "yuchuan" and mpv.pedalMaxForceN == 1400.0, "MPV starts with known profile and safe load calibration")
	physics.step(mpv, {"brake": true}, TEST_STEP)
	_check(mpv.pedalForceN == 1400.0 and not mpv.brakePedalBroken, "normal full pedal load keeps the pedal intact")

	mpv.pedalMaxForceN = 1600.0
	physics.step(mpv, {"brakeValue": 1.0}, TEST_STEP)
	_check(mpv.pedalForceN == 1600.0 and not mpv.brakePedalBroken, "exact threshold does not break the pedal")
	physics.step(mpv, {"brakeForceN": 1600.1, "brakeValue": 0.0}, TEST_STEP)
	_check(is_equal_approx(float(mpv.pedalForceN), 1600.1) and mpv.brakePedalBroken, "measured load strictly above threshold breaks the MPV pedal")
	physics.step(mpv, {}, TEST_STEP)
	_check(mpv.pedalForceN == 0.0 and mpv.brakePedalBroken, "release clears the pressure and retains the failure")
	mpv.checkpoint = 2
	physics.recover(mpv)
	mpv.lowGear = not mpv.lowGear
	_check(mpv.brakePedalBroken and mpv.pedalMaxForceN == 1600.0, "checkpoint recovery and gear changes preserve failure and calibration")

	mpv.speed = 4.0
	var coasting := mpv.duplicate(true)
	var broken_reverse := mpv.duplicate(true)
	var healthy := mpv.duplicate(true)
	healthy.brakePedalBroken = false
	for frame: int in range(8):
		physics.step(mpv, {"brakeValue": 1.0}, TEST_STEP)
		physics.step(coasting, {}, TEST_STEP)
		physics.step(broken_reverse, {"reverse": 1.0, "brakeAssist": 1.0}, TEST_STEP)
		physics.step(healthy, {"brakeValue": 1.0}, TEST_STEP)
	_check(is_equal_approx(float(mpv.speed), float(coasting.speed)) and float(mpv.speed) < 4.0, "broken pedal leaves rolling resistance without service braking")
	_check(is_equal_approx(float(broken_reverse.speed), float(coasting.speed)), "reverse and load guard do not secretly apply broken service brakes")
	_check(float(healthy.speed) + 1.0 < float(mpv.speed), "healthy calibrated MPV brakes normally")

	physics.repair(mpv)
	_check(not mpv.brakePedalBroken and mpv.pedalForceN == 0.0 and mpv.pedalMaxForceN == 1600.0, "workshop service restores the pedal without changing calibration")
	mpv.pedalMaxForceN = 1800.0
	physics.step(mpv, {"brakeAssist": 1.0}, TEST_STEP)
	_check(mpv.pedalForceN == 0.0 and not mpv.brakePedalBroken, "world streaming guard supplies no physical pedal load")
	physics.step(mpv, {"brakeValue": 0.9}, TEST_STEP)
	_check(is_equal_approx(float(mpv.pedalForceN), 1620.0) and mpv.brakePedalBroken, "calibrated pedal travel above threshold can also break the pedal")
	physics.repair(mpv)
	mpv.pedalMaxForceN = INF
	physics.step(mpv, {"brakeForceN": NAN, "brakeValue": INF}, TEST_STEP)
	_check(mpv.pedalMaxForceN == 1400.0 and mpv.pedalForceN == 0.0 and not mpv.brakePedalBroken, "non-finite force, travel and calibration leave a safe default")

	var rover := physics.create_state()
	rover.erase("vehicleId")
	rover.erase("pedalMaxForceN")
	rover.erase("brakePedalBroken")
	rover.speed = 4.0
	physics.step(rover, {"brakeForceN": 5000.0}, TEST_STEP)
	_check(not rover.brakePedalBroken and rover.pedalForceN == 5000.0 and float(rover.speed) < 3.8, "older Rover state brakes without the MPV failure rule")

	physics.ground_height_provider = func(x: float, z: float) -> float:
		return x * 0.04 + z * 0.08
	mpv = physics.create_state("forest", false, "yuchuan")
	mpv.yaw = 0.0
	physics._reset_suspension(mpv)
	var geometry := Physics.vehicle_geometry("yuchuan")
	var offsets: Array[Vector2] = geometry.wheelOffsets
	_check(is_equal_approx(float(geometry.wheelbase), 3.42) and is_equal_approx(float(geometry.halfTrack), 0.91), "MPV uses measured wheelbase and track")
	var contact_matches := true
	for i: int in range(offsets.size()):
		var wheel_x := float(mpv.x) + offsets[i].x
		var wheel_z := float(mpv.z) + offsets[i].y
		var expected_height := wheel_x * 0.04 + wheel_z * 0.08 + 0.405
		contact_matches = contact_matches and is_equal_approx(float(mpv.wheelHeights[i]), expected_height)
	_check(contact_matches and is_equal_approx(float(mpv.y), float(mpv.x) * 0.04 + float(mpv.z) * 0.08 + 0.415), "all MPV wheel contacts and sprung ride height use the rendered dimensions")
	physics.ground_height_provider = Callable()
	mpv = physics.create_state("forest", false, "yuchuan")
	rover = physics.create_state()
	mpv.speed = 4.0
	rover.speed = 4.0
	var initial_yaw := float(mpv.yaw)
	physics.step(mpv, {"steer": 0.75}, 0.12)
	physics.step(rover, {"steer": 0.75}, 0.12)
	_check(absf(angle_difference(initial_yaw, float(mpv.yaw))) < absf(angle_difference(initial_yaw, float(rover.yaw))), "MPV wheelbase gives a wider turning circle than the Rover")
	print("MPV_PHYSICS_CHECKS ", checks, " FAILURES ", failures)
	quit(failures)
