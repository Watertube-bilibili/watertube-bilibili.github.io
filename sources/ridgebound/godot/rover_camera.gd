extends Camera3D

const CHASE_DISTANCE := 10.6
const HIGH_DISTANCE := 20.0
const CHASE_PITCH := 0.32
const HIGH_PITCH := 0.56
const MAX_PITCH := 1.32
const MIN_PITCH := -0.16
const SETTLE_DISTANCE_SQUARED := 0.000225

var orbit_yaw := 0.0
var orbit_pitch := 0.0
var _aim := Vector3.ZERO
var _up := Vector3.UP
var _snap := true

func _init() -> void:
	fov = 52.0
	far = 1850.0
	near = 0.06

func recenter() -> void:
	orbit_yaw = 0.0
	orbit_pitch = 0.0

func snap_next_frame() -> void:
	_snap = true

func orbit_by(horizontal: Variant, vertical: Variant, mode: int) -> void:
	if not (horizontal is float or horizontal is int) or not (vertical is float or vertical is int):
		return
	var dx := float(horizontal)
	var dy := float(vertical)
	if not is_finite(dx) or not is_finite(dy):
		return
	var initial := HIGH_PITCH if mode == 1 else CHASE_PITCH
	orbit_yaw = wrapf(orbit_yaw + dx, -PI, PI)
	orbit_pitch = clampf(initial + orbit_pitch + dy, MIN_PITCH, MAX_PITCH) - initial

func follow(base: Vector3, state: Dictionary, eye: Vector3, mode: int, active: bool, delta: float) -> void:
	var desired: Vector3
	var target: Vector3
	var horizon := Vector3.UP
	var vehicle_yaw := float(state.yaw)
	if not active:
		desired = base + Vector3(22, 13, -23)
		target = base + Vector3(-9, 1, 17)
		fov = 52.0
	elif mode == 2:
		var orientation := Basis(Vector3.UP, vehicle_yaw)
		var pitch := clampf(float(state.pitch) * 0.28, -0.12, 0.12)
		var roll := clampf(float(state.roll) * 0.18, -0.06, 0.06)
		var head := orientation * Basis(Vector3.RIGHT, -pitch) * Basis(Vector3.BACK, roll)
		desired = base + orientation * eye
		target = desired + head * Vector3(0, -0.14, 1) * 20.0
		horizon = head * Vector3.UP
		fov = 78.0
	else:
		var screen := get_viewport().get_visible_rect().size
		var distance := HIGH_DISTANCE if mode == 1 else CHASE_DISTANCE
		if screen.y > screen.x:
			distance += 2.5
		var elevation := (HIGH_PITCH if mode == 1 else CHASE_PITCH) + orbit_pitch
		var bearing := vehicle_yaw + orbit_yaw
		# Orbit the car itself so the nose and both flanks stay in frame.
		target = base + Vector3.UP * 1.05
		var ring := distance * cos(elevation)
		desired = target + Vector3(-sin(bearing) * ring, distance * sin(elevation), -cos(bearing) * ring)
		desired.y = maxf(desired.y, TerrainMath.height_at(desired.x, desired.z, state.region) + 0.85)
		fov = 52.0
	var rate := 9.0 if mode == 2 else 12.0
	var alpha := 1.0 if _snap else 1.0 - exp(-maxf(delta, 0.0) * rate)
	position = _approach(position, desired, alpha)
	if active and mode != 2:
		# Interpolation can cross a hillside even when both endpoints clear it.
		position.y = maxf(position.y, TerrainMath.height_at(position.x, position.z, state.region) + 0.70)
	_aim = _approach(_aim, target, alpha)
	_up = _up.lerp(horizon, alpha).normalized()
	if not position.is_equal_approx(_aim):
		look_at(_aim, _up)
	_snap = false

func _approach(current_value: Vector3, destination: Vector3, alpha: float) -> Vector3:
	# Finish the last centimetres even when world-coordinate float precision rounds a step away.
	if alpha >= 1.0 or current_value.distance_squared_to(destination) <= SETTLE_DISTANCE_SQUARED:
		return destination
	return current_value.lerp(destination, alpha)
