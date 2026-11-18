extends SceneTree
const Physics = preload("res://physics.gd")
var physics := Physics.new()
var failures := 0

func check(condition: bool, label: String) -> void:
	if condition:
		print("PASS ", label)
	else:
		push_error("FAIL " + label)
		failures += 1

func stone(x: float, z: float, height: float, width := 0.46, length := 0.69) -> Dictionary:
	var a := Vector3(x - width, -.1, z - length)
	var b := Vector3(x - width, -.1, z + length)
	var c := Vector3(x + width, -.1, z + length)
	var d := Vector3(x + width, -.1, z - length)
	var crest := Vector3(x, height, z)
	var mesh := PackedVector3Array([a, b, crest, b, c, crest, c, d, crest, d, a, crest, a, c, b, a, d, c])
	return {"kind": "rock", "x": x, "y": 0.0, "z": z, "r": Vector2(width, length).length(), "top": mesh}

func setup() -> Dictionary:
	var state: Dictionary = physics.create_state()
	state.yaw = 0.0
	state.lowGear = true
	physics._reset_suspension(state)
	return state

func drive(state: Dictionary, obstacles: Array, frames: int) -> Dictionary:
	var peak := 0.0
	var ever_blocked := false
	for i: int in range(frames):
		physics.step(state, {"throttle": 1.0}, 1.0 / 60.0, obstacles)
		peak = maxf(peak, state.wheelHeights[1])
		ever_blocked = ever_blocked or bool(state.collision)
	return {"peak": peak, "blocked": ever_blocked}

func _initialize() -> void:
	physics.ground_height_provider = func(_x: float, _z: float) -> float: return 0.0
	var climb := setup()
	var ride := drive(climb, [stone(.954, 5.0, .24)], 360)
	print("ROCK_CLIMB ", climb.z, " peak=", ride.peak, " health=", climb.damage)
	check(climb.z > 10.0 and ride.peak > Physics.WHEEL_RADIUS + .17, "front tire rides up a rendered rock and the vehicle crosses it")
	check(climb.damage.body == 100 and climb.damage.tires == 100 and not ride.blocked, "slow rock crawl is not an impact or a damage event")

	var clearance := setup()
	drive(clearance, [stone(0.0, 5.0, .24)], 360)
	check(clearance.z > 10.0 and clearance.damage.body == 100, "a centered rock below the differential clears the underbody")

	var grounding := setup()
	grounding.lowGear = false
	grounding.speed = 4.0
	var strike := drive(grounding, [stone(0.0, 5.0, .65)], 360)
	check(grounding.z < 5.0 and strike.blocked and grounding.damage.body < 100, "a real underbody strike blocks travel and damages the vehicle")

	var ledge := setup()
	var tall := drive(ledge, [stone(.954, 5.0, 1.42, .49, .24)], 360)
	check(ledge.z < 4.2 and tall.blocked, "a steep rock too high for the tire cannot be tunneled through")

	var sides := setup()
	var tree := {"kind": "trunk", "x": .4, "y": 0.0, "z": 5.0, "r": .22, "height": 3.0}
	var tree_hit := drive(sides, [tree], 360)
	check(sides.z < 4.0 and tree_hit.blocked, "solid trunks still block and cannot be driven through")

	var underpass := setup()
	var beam := {"kind": "box", "x": 0.0, "y": 3.30, "z": 5.0, "r": 2.5, "half": Vector3(2.0, .18, .24)}
	var overhead := drive(underpass, [beam], 360)
	check(underpass.z > 10.0 and not overhead.blocked, "the vertical collision volume leaves a real opening under a high beam")

	var parked := setup()
	for i: int in range(90):
		physics.step(parked, {"steer": 1.0}, 1.0 / 60.0)
	check(absf(parked.roadSteeringAngle + Physics.MAX_ROAD_STEER) < .001 and absf(parked.yaw) < .001, "road wheels turn 28 degrees even while the parked chassis stays straight")
	print("OBSTACLE_FAILURES ", failures)
	quit(failures)
