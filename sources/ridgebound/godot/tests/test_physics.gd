extends SceneTree
const Physics = preload("res://physics.gd")
const Terrain = preload("res://terrain_math.gd")
var physics = Physics.new()
var failures: int = 0
func check(condition: bool, label: String) -> void:
	if condition:
		print("PASS ", label)
	else:
		push_error("FAIL " + label)
		failures += 1
func advance(state: Dictionary, input: Dictionary, seconds: float) -> void:
	for i: int in range(int(seconds * 60.0)):
		physics.step(state, input, 1.0 / 60.0)
func cruise_metrics(region: String) -> Dictionary:
	# Repeatable main-trail cruise. Heave is measured against the four wheel contacts,
	# separating suspension bounce from the intended rise/fall of the whole hillside.
	var state: Dictionary = physics.create_state(region, true)
	var samples: int = 0
	var heave_squared: float = 0.0
	var acceleration_squared: float = 0.0
	var pitch_squared: float = 0.0
	var roll_squared: float = 0.0
	var previous_velocity: float = state.yVel
	var slow_pitch: float = state.pitch
	var slow_roll: float = state.roll
	var airborne_corners: int = 0
	while state.z < 40.0 and state.time < 45.0:
		var target: float = atan2(Terrain.route_x(state.z + 5.0) - state.x, 5.0)
		var difference: float = angle_difference(state.yaw, target)
		physics.step(state, {"throttle": 1.0, "steer": clampf(-difference * 2.0, -1.0, 1.0)}, 1.0 / 60.0)
		slow_pitch = lerpf(slow_pitch, state.pitch, 1.0 - exp(-2.0 / 60.0))
		slow_roll = lerpf(slow_roll, state.roll, 1.0 - exp(-2.0 / 60.0))
		if state.z > 7.0:
			var ground: float = 0.0
			for offset: Vector2 in physics.WHEEL_OFFSETS:
				ground += physics._wheel_ground(state, offset) * 0.25
			var heave: float = state.y - ground - 0.65
			heave_squared += heave * heave
			var vertical_acceleration: float = (state.yVel - previous_velocity) * 60.0
			acceleration_squared += vertical_acceleration * vertical_acceleration
			pitch_squared += pow(state.pitch - slow_pitch, 2.0)
			roll_squared += pow(state.roll - slow_roll, 2.0)
			for contact: bool in state.wheelContact:
				if not contact:
					airborne_corners += 1
			samples += 1
		previous_velocity = state.yVel
	return {"samples": samples, "heave": sqrt(heave_squared / maxf(1.0, samples)),
		"acceleration": sqrt(acceleration_squared / maxf(1.0, samples)),
		"pitch": rad_to_deg(sqrt(pitch_squared / maxf(1.0, samples))),
		"roll": rad_to_deg(sqrt(roll_squared / maxf(1.0, samples))),
		"airborne": airborne_corners, "damage": state.damage}

func _initialize() -> void:
	var s: Dictionary = physics.create_state()
	advance(s, {"throttle": 1}, 3.0)
	check(s.z > 5.0 and s.speed > 2.0, "forward motion")
	advance(s, {"brake": true}, 1.0)
	check(absf(s.speed) < 0.1, "braking")
	# +Z is forward, so screen-right from the trailing camera is world -X.
	var right_turn: Dictionary = physics.create_state()
	right_turn.yaw = 0.0
	advance(right_turn, {"throttle": 1.0, "steer": 1.0}, 3.0)
	check(right_turn.yaw < 0.0 and right_turn.x < 0.0, "right input turns toward screen-right with +Z forward")
	var left_turn: Dictionary = physics.create_state()
	left_turn.yaw = 0.0
	advance(left_turn, {"throttle": 1.0, "steer": -1.0}, 3.0)
	check(left_turn.yaw > 0.0 and left_turn.x > 0.0, "left input turns toward screen-left with +Z forward")
	var anchor: Dictionary = {"x": s.x + 3.0, "z": s.z + 18.0}
	check(physics.attach_winch(s, anchor), "winch attaches")
	var before: float = Vector2(anchor.x - s.x, anchor.z - s.z).length()
	advance(s, {"reel": true}, 4.0)
	check(Vector2(anchor.x - s.x, anchor.z - s.z).length() < before - 7.0, "winch pulls")
	physics.detach_winch(s)
	check(s.winch == null, "winch releases")
	var normal: Dictionary = physics.create_state("snow", false)
	var winter: Dictionary = physics.create_state("snow", true)
	advance(normal, {"throttle": 1}, 5.0)
	advance(winter, {"throttle": 1}, 5.0)
	check(winter.z > normal.z + 3.0 and winter.slip < normal.slip, "snow tires improve traction")
	var stationary: Dictionary = physics.create_state()
	var stationary_y: float = stationary.y
	advance(stationary, {}, 10.0)
	check(absf(stationary.y - stationary_y) < 0.001 and absf(stationary.yVel) < 0.0001 and absf(stationary.pitchVel) < 0.0001 and absf(stationary.rollVel) < 0.0001, "parked suspension has no persistent oscillation")
	for region: String in ["forest", "snow"]:
		var metrics: Dictionary = cruise_metrics(region)
		print("CRUISE_METRICS ", region, " ", metrics)
		check(metrics.samples > 200 and metrics.heave < 0.025, region + " cruise heave RMS below 2.5 cm")
		check(metrics.acceleration < 0.7 and metrics.pitch < 0.95 and metrics.roll < 0.7, region + " cruise body acceleration and rocking stay bounded")
		check(metrics.airborne == 0 and metrics.damage.body == 100.0 and metrics.damage.tires == 100.0 and metrics.damage.suspension == 100.0, region + " ordinary cruise stays grounded without damage")
	var settling: Dictionary = physics.create_state()
	var ride: float = settling.y
	settling.y += 0.25
	var rebound: float = 0.0
	for i: int in range(90):
		physics.step(settling, {}, 1.0 / 60.0)
		rebound = minf(rebound, settling.y - ride)
	check(rebound > -0.003, "healthy suspension absorbs a 25 cm bump without repeated rebound")
	check(absf(settling.y - ride) < 0.01 and absf(settling.yVel) < 0.025, "healthy suspension settles after bump within 1.5 seconds")
	check(absf(settling.y - ride) < 0.08 and absf(settling.yVel) < 0.1, "spring/damper heave settles")
	settling.x = Terrain.route_x(1410.0) + 18.0
	settling.z = 1410.0
	settling.y = Terrain.height_at(settling.x, settling.z) + 0.65
	advance(settling, {}, 2.5)
	check(absf(settling.wheelHeights[0] - settling.wheelHeights[3]) > 0.1, "independent wheel heights")
	check(absf(settling.suspension[0] - settling.suspension[1]) > 0.0001, "independent suspension travel")
	for region: String in ["forest", "snow"]:
		var drive: Dictionary = physics.create_state(region, true)
		drive.lowGear = true
		for i: int in range(60 * 1800):
			if drive.completed:
				break
			var aim_z: float = drive.z + 5.0
			var target: float = atan2(Terrain.route_x(aim_z) - drive.x, aim_z - drive.z)
			var difference: float = atan2(sin(target - drive.yaw), cos(target - drive.yaw))
			physics.step(drive, {"throttle": 1.0, "steer": clampf(-difference * 2.0, -1.0, 1.0)}, 1.0 / 60.0)
		check(drive.completed, region + " complete expedition")
		check(is_finite(drive.y) and is_finite(drive.pitch) and is_finite(drive.roll), region + " suspension stays finite")
		check(drive.damage.body == 100.0 and drive.damage.tires == 100.0 and drive.damage.suspension == 100.0, region + " normal expedition has no false impact damage")
	var crashed: Dictionary = physics.create_state()
	crashed.speed = 8.0
	physics.step(crashed, {}, 1.0 / 60.0, [{"x": crashed.x, "z": crashed.z + 1.0, "r": 1.0}])
	check(crashed.damage.body < 100.0 and crashed.damage.tires < 100.0 and crashed.damage.suspension < 100.0, "collision damages all vehicle systems")
	var health_after_impact: float = crashed.damage.body
	physics.step(crashed, {}, 1.0 / 60.0, [{"x": crashed.x, "z": crashed.z, "r": 1.0}])
	check(crashed.damage.body == health_after_impact, "collision cooldown avoids repeated substep damage")
	var repair_location: Vector2 = Vector2(crashed.x, crashed.z)
	physics.repair(crashed)
	check(crashed.damage.body == 100.0 and crashed.damage.tires == 100.0 and crashed.damage.suspension == 100.0, "cabin repair restores integrity")
	check(Vector2(crashed.x, crashed.z).is_equal_approx(repair_location) and is_zero_approx(crashed.impact), "repair preserves position and clears impact")
	var limping: Dictionary = physics.create_state()
	limping.damage = {"body": 0.0, "tires": 0.0, "suspension": 0.0}
	limping.lowGear = true
	advance(limping, {"throttle": 1.0}, 5.0)
	check(limping.z > 2.0 and is_finite(limping.y), "zero integrity retains limp-home movement")
	print("FAILURES ", failures)
	quit(failures)
