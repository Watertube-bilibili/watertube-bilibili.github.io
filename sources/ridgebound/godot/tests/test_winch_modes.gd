extends SceneTree

const PhysicsScript := preload("res://physics.gd")
const Winch := preload("res://recovery_winch.gd")
var failures := 0

func _initialize() -> void:
	call_deferred("_run")

func _expect(condition: bool, label: String) -> void:
	if not condition:
		failures += 1
		push_error("FAIL " + label)
	else:
		print("PASS " + label)

func _run() -> void:
	var physics := PhysicsScript.new()
	var state := physics.create_state()
	state.yaw = 0.0
	var anchor := {"x": state.x, "y": state.y + 0.25, "z": state.z - 15.0}
	_expect(physics.attach_winch(state, anchor, "rear"), "attach to the rear recovery point")
	var length := float(state.winch.length)
	_expect(state.winch.endpoint == "rear" and absf(length - Winch.mount(state, "rear").distance_to(Vector3(anchor.x, anchor.y, anchor.z))) < 0.001, "rear drum length starts at the real attachment point")
	for i: int in range(60):
		physics.step(state, {"payout": true}, 1.0 / 60.0)
	_expect(float(state.winch.length) > length + 3.0 and is_zero_approx(float(state.winch.tension)), "payout releases slack without pulling")
	var original_z := float(state.z)
	for i: int in range(240):
		physics.step(state, {"reel": true}, 1.0 / 60.0)
	_expect(float(state.z) < original_z - 5.0, "rear winch pulls the truck backwards")
	physics.detach_winch(state)
	_expect(state.winch == null and not physics.attach_winch(state, anchor, "invalid"), "detach and reject unknown attachment point")
	print("WINCH_FAILURES ", failures)
	quit(failures)
