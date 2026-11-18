extends RefCounted
## Two recovery points on the production Blender model, in metres and model axes.
const FRONT_MOUNT := Vector3(0.0, 0.3956, 2.197)
const REAR_MOUNT := Vector3(0.0, 0.18736, -2.16892)
const MAX_ATTACH_DISTANCE := 26.0
const MIN_LENGTH := 1.35
const MAX_LENGTH := 30.0
const REEL_SPEED := 2.65
const PAYOUT_SPEED := 3.20

static func mount(state: Dictionary, endpoint: String) -> Vector3:
	var rest := REAR_MOUNT if endpoint == "rear" else FRONT_MOUNT
	var orientation := Basis(Vector3.UP, float(state.yaw)) * Basis(Vector3.RIGHT, -float(state.pitch)) * Basis(Vector3.BACK, float(state.roll))
	return Vector3(float(state.x), float(state.y), float(state.z)) + orientation * rest

static func attach(state: Dictionary, anchor: Dictionary, endpoint: String = "front") -> bool:
	if not anchor.has("x") or not anchor.has("z"):
		return false
	if endpoint != "front" and endpoint != "rear":
		return false
	var anchor_y := float(anchor.get("y", state.y))
	var target := Vector3(float(anchor.x), anchor_y, float(anchor.z))
	if not target.is_finite():
		return false
	var length := target.distance_to(mount(state, endpoint))
	if length < MIN_LENGTH or length > MAX_ATTACH_DISTANCE:
		return false
	var fixed_anchor := anchor.duplicate()
	fixed_anchor.y = anchor_y
	state.winch = {"anchor": fixed_anchor, "endpoint": endpoint, "length": length, "tension": 0.0}
	return true

static func apply(state: Dictionary, reel: bool, payout: bool, dt: float) -> void:
	var line: Dictionary = state.winch
	var target := Vector3(float(line.anchor.x), float(line.anchor.get("y", state.y)), float(line.anchor.z))
	var center := Vector3(float(state.x), float(state.y), float(state.z))
	var point := mount(state, String(line.get("endpoint", "front")))
	var span := target - point
	var length := span.length()
	if length > MAX_LENGTH + 3.0:
		state.winch = null
		return
	if payout and not reel:
		line.length = minf(MAX_LENGTH, float(line.length) + dt * PAYOUT_SPEED)
	if reel and not payout:
		# The drum stops feeding under load until the vehicle moves or is freed.
		var stall_length := maxf(MIN_LENGTH, length - 0.92)
		line.length = maxf(stall_length, float(line.length) - dt * REEL_SPEED) if float(line.length) > stall_length else float(line.length)
	var stretch := maxf(0.0, length - float(line.length))
	line.tension = clampf(stretch / 0.92, 0.0, 1.0)
	if stretch <= 0.0 or length <= 0.0001:
		return
	var direction := span / length
	var travel := minf(stretch, dt * lerpf(2.8, 5.0, float(line.tension)))
	state.x += direction.x * travel
	state.z += direction.z * travel
	var forward := Vector3(sin(float(state.yaw)), 0.0, cos(float(state.yaw)))
	if direction.dot(forward) * float(state.speed) < 0.0:
		state.speed *= exp(-dt * (2.5 + float(line.tension) * 3.5))
	var arm := point - center
	var moment := arm.cross(direction).y
	state.yaw += clampf(moment * travel * 0.10, -0.025, 0.025)
