class_name OffroadPhysics
extends RefCounted

const RecoveryWinch := preload("res://recovery_winch.gd")
## Kinematic off-road traction with four independently sampled spring/damper corners.
## +Z forward; body uses rotation.x=-pitch and rotation.z=roll.
## Wheel order: front-left, front-right, rear-left, rear-right.
const Terrain = preload("res://terrain_math.gd")
const Contacts = preload("res://obstacle_contacts.gd")
const WHEEL_OFFSETS: Array[Vector2] = [Vector2(-0.954, 1.3), Vector2(0.954, 1.3), Vector2(-0.954, -1.3), Vector2(0.954, -1.3)]
const HALF_TRACK := 0.954
const WHEELBASE := 2.6
const MAX_ROAD_STEER := 0.49
# Healthy springs are close to critically damped; damaged dampers remain softer.
const SPRING_RATE: float = 90.0
const DAMPING: float = 20.0
const SUSPENSION_TRAVEL: float = 0.30
const WHEEL_RADIUS: float = 0.52
const REST_HEIGHT := 0.53
const DEFAULT_PEDAL_MAX_FORCE_N := 1400.0
const MPV_PEDAL_BREAK_FORCE_N := 1600.0
const MPV_WHEELBASE := 3.42
const MPV_HALF_TRACK := 0.91
const MPV_WHEEL_RADIUS := 0.405
const MPV_REST_HEIGHT := 0.415
const MPV_WHEEL_OFFSETS: Array[Vector2] = [
	Vector2(-MPV_HALF_TRACK, MPV_WHEELBASE * 0.5),
	Vector2(MPV_HALF_TRACK, MPV_WHEELBASE * 0.5),
	Vector2(-MPV_HALF_TRACK, -MPV_WHEELBASE * 0.5),
	Vector2(MPV_HALF_TRACK, -MPV_WHEELBASE * 0.5),
]
const ROVER_GEOMETRY := {
	"wheelbase": WHEELBASE, "halfTrack": HALF_TRACK, "wheelRadius": WHEEL_RADIUS,
	"restHeight": REST_HEIGHT, "wheelOffsets": WHEEL_OFFSETS,
}
const MPV_GEOMETRY := {
	"wheelbase": MPV_WHEELBASE, "halfTrack": MPV_HALF_TRACK, "wheelRadius": MPV_WHEEL_RADIUS,
	"restHeight": MPV_REST_HEIGHT, "wheelOffsets": MPV_WHEEL_OFFSETS,
}
const NO_ROCK_SUPPORT: Array[float] = [-INF, -INF, -INF, -INF]
var _checkpoints: Array = Terrain.checkpoints()
# Scene runtime optionally uses the visible, triangulated ground of a ready tile.
var ground_height_provider: Callable

static func vehicle_geometry(vehicle_id: String) -> Dictionary:
	return MPV_GEOMETRY if vehicle_id == "yuchuan" else ROVER_GEOMETRY

func create_state(region: String = "forest", snow_tires: bool = false, vehicle_id: String = "rover") -> Dictionary:
	var spawn: Vector3 = Terrain.spawn_for(region)
	var state: Dictionary = {
		"x": spawn.x, "z": spawn.z,
		"vehicleId": "yuchuan" if vehicle_id == "yuchuan" else "rover",
		"pedalMaxForceN": DEFAULT_PEDAL_MAX_FORCE_N, "pedalForceN": 0.0, "brakePedalBroken": false,
		"yaw": spawn.y, "speed": 0.0, "region": region, "snowTires": snow_tires,
		"pitch": 0.0, "roll": 0.0, "tilt": 0.0, "lowGear": false, "awd": true, "winch": null,
		"checkpoint": 0, "completed": false, "time": 0.0, "distance": 0.0,
		"surface": Terrain.surface_at(spawn.x, spawn.z, region), "slip": 0.0, "stuck": 0.0,
		"wheelRotation": 0.0, "collision": false, "steering": 0.0, "roadSteeringAngle": 0.0,
		"damage": {"body": 100.0, "tires": 100.0, "suspension": 100.0},
		"impact": 0.0, "damageCooldown": 0.0, "repairAvailable": false,
		"yVel": 0.0, "pitchVel": 0.0, "rollVel": 0.0,
		"contactHeights": [0.0, 0.0, 0.0, 0.0], "contactVelocities": [0.0, 0.0, 0.0, 0.0],
		"suspension": [0.0, 0.0, 0.0, 0.0], "wheelHeights": [0.0, 0.0, 0.0, 0.0],
		"wheelContact": [true, true, true, true], "springForces": [0.0, 0.0, 0.0, 0.0]
	}
	_reset_suspension(state)
	return state

func attach_winch(state: Dictionary, anchor: Dictionary, endpoint: String = "front") -> bool:
	return RecoveryWinch.attach(state, anchor, endpoint)

func detach_winch(state: Dictionary) -> void:
	state.winch = null

func recover(state: Dictionary) -> void:
	var spawn: Vector3 = Terrain.spawn_for(state.region)
	if state.region != "custom" and state.checkpoint > 0:
		var index: int = mini(int(state.checkpoint), _checkpoints.size()) - 1
		spawn.z = float(_checkpoints[index].z) + 1.8
		spawn.x = Terrain.route_x(spawn.z)
		spawn.y = Terrain.heading_at(spawn.z)
	state.z = spawn.z
	state.x = spawn.x
	state.yaw = spawn.y
	state.speed = 0.0
	state.pitch = 0.0
	state.roll = 0.0
	state.tilt = 0.0
	state.stuck = 0.0
	state.slip = 0.0
	state.winch = null
	state.collision = false
	state.pedalForceN = 0.0
	state.surface = Terrain.surface_at(state.x, state.z, state.region)
	_reset_suspension(state)

func repair(state: Dictionary) -> void:
	# Cabin validation belongs to main.gd. Repair preserves location and progression.
	state.damage = {"body": 100.0, "tires": 100.0, "suspension": 100.0}
	state.impact = 0.0
	state.damageCooldown = 0.0
	state.speed = 0.0
	state.slip = 0.0
	state.stuck = 0.0
	state.steering = 0.0
	state.roadSteeringAngle = 0.0
	state.collision = false
	state.winch = null
	state.brakePedalBroken = false
	state.pedalForceN = 0.0
	_reset_suspension(state)
	state.tilt = rad_to_deg(maxf(absf(state.pitch), absf(state.roll)))

func _apply_damage(state: Dictionary, impact: float, body_loss: float, tire_loss: float, suspension_loss: float) -> void:
	if state.damageCooldown > 0.0:
		return
	state.damage.body = clampf(state.damage.body - body_loss, 0.0, 100.0)
	state.damage.tires = clampf(state.damage.tires - tire_loss, 0.0, 100.0)
	state.damage.suspension = clampf(state.damage.suspension - suspension_loss, 0.0, 100.0)
	state.impact = maxf(state.impact, impact)
	state.damageCooldown = 0.55

func _ground_height(x: float, z: float, region: String) -> float:
	if ground_height_provider.is_valid():
		return float(ground_height_provider.call(x, z))
	return Terrain.height_at(x, z, region)

func _wheel_position(x: float, z: float, forward: Vector2, offset: Vector2) -> Vector2:
	return Vector2(x, z) + Vector2(forward.y, -forward.x) * offset.x + forward * offset.y

func _wheel_ground(state: Dictionary, offset: Vector2) -> float:
	var forward := Vector2(sin(state.yaw), cos(state.yaw))
	var point := _wheel_position(state.x, state.z, forward, offset)
	return _ground_height(point.x, point.y, state.region)

func _contact_ground(state: Dictionary, offset: Vector2) -> float:
	# Tire footprint supports the chassis across small ripples rather than at a point.
	return _wheel_ground(state, offset) * 0.5 + _wheel_ground(state, offset + Vector2(0.0, 0.6)) * 0.25 + _wheel_ground(state, offset - Vector2(0.0, 0.6)) * 0.25

func _reset_suspension(state: Dictionary) -> void:
	state.yVel = 0.0
	state.pitchVel = 0.0
	state.rollVel = 0.0
	var geometry := vehicle_geometry(String(state.get("vehicleId", "rover")))
	var offsets: Array[Vector2] = geometry.wheelOffsets
	var grounds: Array[float] = []
	for offset: Vector2 in offsets:
		grounds.append(_contact_ground(state, offset))
	state.y = (grounds[0] + grounds[1] + grounds[2] + grounds[3]) * 0.25 + float(geometry.restHeight)
	state.pitch = atan(((grounds[0] + grounds[1]) - (grounds[2] + grounds[3])) / (2.0 * float(geometry.wheelbase)))
	state.roll = atan(((grounds[1] + grounds[3]) - (grounds[0] + grounds[2])) / (4.0 * float(geometry.halfTrack)))
	for i: int in range(offsets.size()):
		state.contactHeights[i] = grounds[i]
		state.contactVelocities[i] = 0.0
		state.wheelHeights[i] = _wheel_ground(state, offsets[i]) + float(geometry.wheelRadius)
		state.suspension[i] = 0.0
		state.wheelContact[i] = true
		state.springForces[i] = 9.81

func _unit_input(value: Variant) -> float:
	if value is bool:
		return 1.0 if value else 0.0
	if (value is float or value is int) and is_finite(float(value)):
		return clampf(float(value), 0.0, 1.0)
	return 0.0

func _sample_brake(state: Dictionary, input: Dictionary) -> float:
	var calibration: Variant = state.get("pedalMaxForceN", DEFAULT_PEDAL_MAX_FORCE_N)
	var max_force := DEFAULT_PEDAL_MAX_FORCE_N
	if (calibration is float or calibration is int) and is_finite(float(calibration)) and float(calibration) > 0.0:
		max_force = float(calibration)
	state.pedalMaxForceN = max_force

	var travel := maxf(_unit_input(input.get("brakeValue", 0.0)), _unit_input(input.get("brake", false)))
	var force := travel * max_force
	var measured: Variant = input.get("brakeForceN")
	if (measured is float or measured is int) and is_finite(float(measured)) and float(measured) >= 0.0:
		force = float(measured)
		travel = minf(force, max_force) / max_force
	state.pedalForceN = force

	var is_mpv := state.get("vehicleId", "rover") == "yuchuan"
	var newly_broken := force > MPV_PEDAL_BREAK_FORCE_N
	state.brakePedalBroken = is_mpv and (state.get("brakePedalBroken", false) == true or newly_broken)
	if state.brakePedalBroken:
		return 0.0
	# Stream look-ahead can slow a healthy vehicle without pushing the driver's pedal.
	return maxf(travel, _unit_input(input.get("brakeAssist", 0.0)))

func step(state: Dictionary, input: Dictionary, dt: float, obstacles: Array = []) -> void:
	if not is_finite(dt) or dt <= 0.0:
		return
	var geometry := vehicle_geometry(String(state.get("vehicleId", "rover")))
	var brake_request := _sample_brake(state, input)
	var total: float = minf(dt, 0.15)
	var count: int = maxi(1, int(ceil(total / (1.0 / 120.0))))
	# Limit precise mesh tests to objects the car can reach in this frame.
	var center := Vector2(float(state.x), float(state.z))
	var rocks: Array = []
	var solids: Array = []
	var legacy: Array = []
	for obstacle: Dictionary in obstacles:
		var delta := Vector2(float(obstacle.x), float(obstacle.z)) - center
		var reach := float(obstacle.get("r", 0.5)) + 5.0
		if delta.length_squared() > reach * reach:
			continue
		match String(obstacle.get("kind", "")):
			"rock": rocks.push_back(obstacle)
			"trunk", "box", "convex": solids.push_back(obstacle)
			_: legacy.push_back(obstacle)
	var world: Rect2 = Terrain.bounds_for(state.region)
	for _i: int in range(count):
		_simulate(state, input, total / float(count), rocks, solids, legacy, world, geometry, brake_request)

func _simulate(state: Dictionary, input: Dictionary, dt: float, rocks: Array, solids: Array, legacy: Array, world: Rect2, geometry: Dictionary, brake_request: float) -> void:
	state.damageCooldown = maxf(0.0, state.damageCooldown - dt)
	state.impact = maxf(0.0, state.impact - dt * 3.5)
	var body_health: float = clampf(state.damage.body / 100.0, 0.0, 1.0)
	var tire_health: float = clampf(state.damage.tires / 100.0, 0.0, 1.0)
	var tire_grip: float = lerpf(0.68, 1.0, tire_health)
	var steering_health: float = lerpf(0.62, 1.0, tire_health)
	var throttle: float = clampf(float(input.get("throttle", 0.0)), 0.0, 1.0)
	var reverse: float = clampf(float(input.get("reverse", 0.0)), 0.0, 1.0)
	var steer: float = clampf(float(input.get("steer", 0.0)), -1.0, 1.0)
	var reel: bool = bool(input.get("reel", false))
	var payout: bool = bool(input.get("payout", false))
	state.surface = Terrain.surface_at(state.x, state.z, state.region)
	var snowy: bool = state.region == "snow" or state.surface == "snow" or state.surface == "ice"
	var winter_grip: float = 0.44 if snowy and not state.snowTires else 1.0
	var steering_response: float = 3.2 if snowy and not state.snowTires else 10.0
	state.steering += (steer - state.steering) * (1.0 - exp(-dt * steering_response))
	var mud: bool = state.surface == "mud"
	var water: bool = state.surface == "water"
	var fx: float = sin(state.yaw)
	var fz: float = cos(state.yaw)
	var slope: float = (Terrain.height_at(state.x + fx, state.z + fz, state.region) - Terrain.height_at(state.x - fx, state.z - fz, state.region)) * 0.5
	var max_speed: float = 4.4 if state.lowGear else 10.0
	var snow_grip: float = (0.77 if state.snowTires else 0.22) if state.surface == "ice" else (0.96 if state.snowTires else 0.46)
	var terrain_grip: float = 1.0
	if snowy:
		terrain_grip = snow_grip
	elif mud:
		terrain_grip = 0.72 if state.lowGear else 0.24
	elif water:
		terrain_grip = 0.22
	elif state.surface == "grass":
		terrain_grip = 0.86
	var grip: float = (1.0 if state.awd else 0.62) * terrain_grip * tire_grip
	var drive: float = throttle - reverse
	var direction_brake: bool = (drive < 0.0 and state.speed > 0.3) or (drive > 0.0 and state.speed < -0.3)
	var brake_value := brake_request
	var pedals_conflict := throttle > 0.0 and reverse > 0.0
	if (direction_brake or pedals_conflict) and not state.brakePedalBroken:
		brake_value = 1.0
	var braking := brake_value > 0.01
	# A broken pedal leaves rolling resistance, but cannot auto-brake for a gear change.
	if braking or direction_brake or pedals_conflict:
		drive = 0.0
	var terminal: float = max_speed * 0.54 if drive < 0.0 else max_speed
	var torque: float = (8.6 if state.lowGear else 5.7) * grip * lerpf(0.64, 1.0, body_health)
	var engine: float = drive * torque * maxf(0.0, 1.0 - absf(state.speed) / terminal)
	var rolling: float = (1.0 if mud else 3.6 if water else 0.35) + absf(state.speed) * (0.7 if mud else 2.0 if water else 0.12)
	var slope_force: float = slope * 7.5
	var acceleration: float = engine - slope_force
	if absf(state.speed) < 0.04 and is_zero_approx(drive) and not reel:
		state.speed = 0.0
		acceleration = 0.0
	else:
		var friction: float = rolling + 17.0 * brake_value
		if absf(state.speed) < friction * dt and absf(acceleration) < friction:
			state.speed = 0.0
		else:
			acceleration -= signf(state.speed if not is_zero_approx(state.speed) else drive) * friction
	var old_speed: float = state.speed
	state.speed = clampf(state.speed + acceleration * dt, -max_speed * 0.6, max_speed * 1.16)
	if braking and signf(state.speed) != signf(old_speed):
		state.speed = 0.0
	if not is_zero_approx(drive) and absf(state.speed) < 0.06 and signf(state.speed) != signf(drive) and absf(slope_force) < torque + rolling:
		state.speed = 0.0
	# In this +Z-forward, Y-up world, screen-right is world -X.
	state.roadSteeringAngle = -state.steering * MAX_ROAD_STEER
	var steer_rate: float = tan(state.roadSteeringAngle) * winter_grip * steering_health * state.speed / (float(geometry.wheelbase) * (1.0 + absf(state.speed) * 0.055))
	var old_yaw: float = state.yaw
	state.yaw += steer_rate * dt
	var forward_x: float = sin(state.yaw)
	var forward_z: float = cos(state.yaw)
	var old_x: float = state.x
	var old_z: float = state.z
	state.x += forward_x * state.speed * dt
	state.z += forward_z * state.speed * dt
	if snowy and absf(state.speed) > 0.08:
		var side_x: float = cos(state.yaw)
		var side_z: float = -sin(state.yaw)
		var side_slope: float = (Terrain.height_at(state.x + side_x, state.z + side_z, state.region) - Terrain.height_at(state.x - side_x, state.z - side_z, state.region)) * 0.5
		var downhill_slide: float = side_slope * (0.3 if state.snowTires else 2.4) * dt
		state.x -= side_x * downhill_slide
		state.z -= side_z * downhill_slide
	if state.winch != null:
		RecoveryWinch.apply(state, reel, payout, dt)
	state.collision = false
	for obstacle: Dictionary in legacy:
		var min_distance: float = float(obstacle.get("r", 0.5)) + 0.92
		var dx: float = state.x - obstacle.x
		var dz: float = state.z - obstacle.z
		var distance: float = Vector2(dx, dz).length()
		if distance < min_distance:
			var nx: float = dx / distance if distance > 0.0001 else -forward_x
			var nz: float = dz / distance if distance > 0.0001 else -forward_z
			state.x = obstacle.x + nx * min_distance
			state.z = obstacle.z + nz * min_distance
			var crash_speed: float = absf(state.speed)
			if crash_speed > 1.0:
				var severity: float = minf(10.0, crash_speed - 0.9)
				_apply_damage(state, crash_speed, minf(18.0, severity * 1.8), minf(8.0, severity * 0.75), minf(12.0, severity * 1.1))
			state.speed *= 0.18
			state.collision = true
	if state.x < world.position.x or state.x > world.end.x or state.z < world.position.y or state.z > world.end.y:
		state.x = clampf(state.x, world.position.x, world.end.x)
		state.z = clampf(state.z, world.position.y, world.end.y)
		state.speed *= 0.2
	var floor_heights: Array[float] = NO_ROCK_SUPPORT
	if not rocks.is_empty() or not solids.is_empty():
		floor_heights = _resolve_obstacles(state, old_x, old_z, old_yaw, rocks, solids, torque, dt, geometry)
	_update_suspension(state, dt, acceleration, steer_rate, floor_heights)
	state.tilt = rad_to_deg(maxf(absf(state.pitch), absf(state.roll)))
	var slip_factor: float = 1.0 - snow_grip if snowy else (0.23 if state.lowGear else 0.78) if mud else 0.9 if water else 0.04 if state.awd else 0.17
	state.slip = clampf((slip_factor + (1.0 - tire_health) * 0.35) * absf(drive), 0.0, 1.0)
	state.stuck = state.stuck + dt if absf(state.speed) < 0.45 and (throttle > 0.0 or reverse > 0.0) else maxf(0.0, state.stuck - dt * 2.0)
	state.distance += Vector2(state.x - old_x, state.z - old_z).length()
	state.wheelRotation += (state.speed * dt + state.slip * drive * dt * 2.0) / float(geometry.wheelRadius)
	state.time += dt
	if state.region != "custom" and state.checkpoint < _checkpoints.size():
		var target: Dictionary = _checkpoints[state.checkpoint]
		if Vector2(state.x - target.x, state.z - target.z).length() < 13.0:
			state.checkpoint += 1
			if state.checkpoint == _checkpoints.size():
				state.completed = true

func _rock_floors(state: Dictionary, rocks: Array, offsets: Array[Vector2], tire_radius: float) -> Array[float]:
	if rocks.is_empty():
		return NO_ROCK_SUPPORT
	var forward := Vector2(sin(state.yaw), cos(state.yaw))
	var floors: Array[float] = []
	for i: int in range(offsets.size()):
		var point := _wheel_position(state.x, state.z, forward, offsets[i])
		# The front tires turn on the steering pivots before they meet a rock.
		var steering := float(state.roadSteeringAngle) if i < 2 else 0.0
		var heading := Vector2(sin(state.yaw + steering), cos(state.yaw + steering))
		floors.push_back(Contacts.wheel_floor(point, heading, tire_radius, rocks))
	return floors

func _resolve_obstacles(state: Dictionary, old_x: float, old_z: float, old_yaw: float, rocks: Array, solids: Array, torque: float, dt: float, geometry: Dictionary) -> Array[float]:
	var offsets: Array[Vector2] = geometry.wheelOffsets
	var tire_radius := float(geometry.wheelRadius)
	var floors: Array[float] = _rock_floors(state, rocks, offsets, tire_radius)
	var travel := Vector2(float(state.x) - old_x, float(state.z) - old_z).length()
	if travel < 0.00001 and absf(float(state.yaw) - old_yaw) < 0.0001:
		return floors
	var blocked: bool = Contacts.body_hits(state, solids, true, offsets, tire_radius)
	if not blocked:
		blocked = Contacts.body_hits(state, rocks, false, offsets, tire_radius)
	var rise := 0.0
	var grade := 0.0
	if not blocked and travel > 0.00001:
		var before_forward := Vector2(sin(old_yaw), cos(old_yaw))
		for i: int in range(floors.size()):
			if not is_finite(floors[i]):
				continue
			var wheel := _wheel_position(old_x, old_z, before_forward, offsets[i])
			var steering := float(state.roadSteeringAngle) if i < 2 else 0.0
			var before_heading := Vector2(sin(old_yaw + steering), cos(old_yaw + steering))
			var before := Contacts.wheel_floor(wheel, before_heading, tire_radius, rocks)
			var before_ground := _ground_height(wheel.x, wheel.y, state.region) + tire_radius
			rise = maxf(rise, floors[i] - maxf(before, before_ground))
		grade = rise / travel
		# A ramp can be driven onto. A steep rock face exceeding wheel radius/
		# tractive effort cannot be hopped through by horizontal integration.
		var climb_limit := 0.55 + torque * 0.13 + (0.45 if state.winch != null else 0.0)
		blocked = rise > climb_limit * travel + 0.012
	if blocked:
		var impact := absf(float(state.speed))
		if impact > 1.1:
			var severity := minf(10.0, impact - 1.0)
			_apply_damage(state, impact, severity * 1.4, severity * 0.6, severity * 0.9)
		state.x = old_x
		state.z = old_z
		state.yaw = old_yaw
		state.speed = 0.0
		state.collision = true
		return _rock_floors(state, rocks, offsets, tire_radius)
	if grade > 0.0:
		state.speed = move_toward(state.speed, 0.0, minf(grade, 2.0) * 3.6 * dt)
	return floors

func _update_suspension(state: Dictionary, dt: float, acceleration: float, steer_rate: float, floors: Array[float] = NO_ROCK_SUPPORT) -> void:
	var suspension_health: float = clampf(state.damage.suspension / 100.0, 0.0, 1.0)
	var spring_rate: float = SPRING_RATE * lerpf(0.68, 1.0, suspension_health)
	var damping: float = DAMPING * lerpf(0.34, 1.0, suspension_health)
	var travel: float = SUSPENSION_TRAVEL * lerpf(1.3, 1.0, suspension_health)
	var landing_speed: float = maxf(0.0, -state.yVel)
	var max_compression: float = 0.0
	var lift: float = 0.0
	var pitch_torque: float = 0.0
	var roll_torque: float = 0.0
	var ground_sum: float = 0.0
	var geometry := vehicle_geometry(String(state.get("vehicleId", "rover")))
	var offsets: Array[Vector2] = geometry.wheelOffsets
	var tire_radius := float(geometry.wheelRadius)
	var rest_height := float(geometry.restHeight)
	var half_wheelbase := float(geometry.wheelbase) * 0.5
	var half_track := float(geometry.halfTrack)
	for i: int in range(offsets.size()):
		var offset: Vector2 = offsets[i]
		var rock_ground: float = floors[i] - tire_radius
		var raw_ground: float = maxf(_wheel_ground(state, offset), rock_ground)
		var ground: float = maxf(_contact_ground(state, offset), rock_ground)
		# Smooth only support velocity: wheels retain their individual raw ground heights.
		# Dampers oppose compression velocity, not the vehicle's uphill world velocity.
		var contact_velocity: float = clampf((ground - state.contactHeights[i]) / dt, -8.0, 8.0)
		state.contactHeights[i] = ground
		state.contactVelocities[i] = lerpf(state.contactVelocities[i], contact_velocity, 1.0 - exp(-dt * 3.0))
		ground_sum += ground
		var corner_height: float = state.y + sin(state.pitch) * offset.y + sin(state.roll) * offset.x
		var corner_velocity: float = state.yVel + state.pitchVel * offset.y + state.rollVel * offset.x
		var compression: float = ground + rest_height - corner_height
		var in_contact: bool = compression >= -travel
		max_compression = maxf(max_compression, compression)
		# Each grounded corner contributes spring force and damper force independently.
		# 9.81 preload balances body weight at the nominal ride height.
		var force: float = maxf(0.0, spring_rate * clampf(compression, -travel, travel) - damping * (corner_velocity - state.contactVelocities[i]) + 9.81) if in_contact else 0.0
		state.suspension[i] = clampf(compression, -travel, travel)
		state.wheelContact[i] = in_contact
		state.springForces[i] = force
		state.wheelHeights[i] = raw_ground + tire_radius if in_contact else corner_height - (rest_height - tire_radius) - travel
		lift += force * 0.25
		pitch_torque += force * offset.y / (4.0 * half_wheelbase * half_wheelbase)
		roll_torque += force * offset.x / (4.0 * half_track * half_track)
	if max_compression > 0.12 and landing_speed > 2.8:
		var impact_severity: float = minf(6.0, landing_speed - 2.8)
		_apply_damage(state, landing_speed, impact_severity * 0.35, impact_severity * 0.55, impact_severity * 1.2)
	elif absf(state.speed) > 3.2 and (absf(state.pitch) > 0.65 or absf(state.roll) > 0.6):
		_apply_damage(state, 1.1, 0.15, 0.25, 0.5)
	state.yVel += (lift - 9.81) * dt
	state.pitchVel += (pitch_torque - acceleration * 0.35 - state.pitchVel * 3.0) * dt
	state.rollVel += (roll_torque - steer_rate * state.speed * 0.35 - state.rollVel * 4.0) * dt
	state.y += state.yVel * dt
	state.pitch = clampf(state.pitch + state.pitchVel * dt, -1.0, 1.0)
	state.roll = clampf(state.roll + state.rollVel * dt, -1.0, 1.0)
	# Hard bump stops keep the chassis above terrain after abrupt resets/collisions.
	var minimum_height: float = ground_sum * 0.25 + rest_height - 0.29
	if state.y < minimum_height:
		state.y = minimum_height
		state.yVel = maxf(0.0, state.yVel)
