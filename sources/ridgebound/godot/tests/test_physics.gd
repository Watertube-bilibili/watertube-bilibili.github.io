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
	var settling: Dictionary = physics.create_state()
	var ride: float = settling.y
	settling.y += 0.25
	advance(settling, {}, 2.5)
	check(absf(settling.y - ride) < 0.08 and absf(settling.yVel) < 0.1, "spring/damper heave settles")
	settling.x = Terrain.route_x(141.0) + 9.0
	settling.z = 141.0
	settling.y = Terrain.height_at(settling.x, settling.z) + 0.65
	advance(settling, {}, 2.5)
	check(absf(settling.wheelHeights[0] - settling.wheelHeights[3]) > 0.1, "independent wheel heights")
	check(absf(settling.suspension[0] - settling.suspension[1]) > 0.0001, "independent suspension travel")
	for region: String in ["forest", "snow"]:
		var drive: Dictionary = physics.create_state(region, true)
		drive.lowGear = true
		for i: int in range(60 * 160):
			if drive.completed:
				break
			var aim_z: float = drive.z + 5.0
			var target: float = atan2(Terrain.route_x(aim_z) - drive.x, aim_z - drive.z)
			var difference: float = atan2(sin(target - drive.yaw), cos(target - drive.yaw))
			physics.step(drive, {"throttle": 1.0, "steer": clampf(-difference * 2.0, -1.0, 1.0)}, 1.0 / 60.0)
		check(drive.completed, region + " complete expedition")
		check(is_finite(drive.y) and is_finite(drive.pitch) and is_finite(drive.roll), region + " suspension stays finite")
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
