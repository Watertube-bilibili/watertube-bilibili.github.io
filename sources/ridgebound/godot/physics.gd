class_name OffroadPhysics
extends RefCounted
## Kinematic off-road traction with four independently sampled spring/damper corners.
## +Z forward; body uses rotation.x=-pitch and rotation.z=roll.
## Wheel order: front-left, front-right, rear-left, rear-right.
const Terrain = preload("res://terrain_math.gd")
const WHEEL_OFFSETS: Array[Vector2] = [Vector2(-1.06, 1.3), Vector2(1.06, 1.3), Vector2(-1.06, -1.3), Vector2(1.06, -1.3)]
# Healthy springs are close to critically damped; damaged dampers remain softer.
const SPRING_RATE: float = 90.0
const DAMPING: float = 20.0
const SUSPENSION_TRAVEL: float = 0.30
const WHEEL_RADIUS: float = 0.64
var _checkpoints: Array = Terrain.checkpoints()

func create_state(region: String = "forest", snow_tires: bool = false) -> Dictionary:
	var x: float = Terrain.route_x(0.0)
	var state: Dictionary = {
		"x": x, "y": Terrain.height_at(x, 0.0, region) + 0.65, "z": 0.0,
		"yaw": Terrain.heading_at(0.0), "speed": 0.0, "region": region, "snowTires": snow_tires,
		"pitch": 0.0, "roll": 0.0, "tilt": 0.0, "lowGear": false, "awd": true, "winch": null,
		"checkpoint": 0, "completed": false, "time": 0.0, "distance": 0.0,
		"surface": Terrain.surface_at(x, 0.0, region), "slip": 0.0, "stuck": 0.0,
		"wheelRotation": 0.0, "collision": false, "steering": 0.0,
		"damage": {"body": 100.0, "tires": 100.0, "suspension": 100.0},
		"impact": 0.0, "damageCooldown": 0.0, "repairAvailable": false,
		"yVel": 0.0, "pitchVel": 0.0, "rollVel": 0.0,
		"contactHeights": [0.0, 0.0, 0.0, 0.0], "contactVelocities": [0.0, 0.0, 0.0, 0.0],
		"suspension": [0.0, 0.0, 0.0, 0.0], "wheelHeights": [0.0, 0.0, 0.0, 0.0],
		"wheelContact": [true, true, true, true], "springForces": [0.0, 0.0, 0.0, 0.0]
	}
	_reset_suspension(state)
	return state

func attach_winch(state: Dictionary, anchor: Dictionary) -> bool:
	if not anchor.has("x") or not anchor.has("z"):
		return false
	var ax: float = float(anchor.x)
	var az: float = float(anchor.z)
	if not is_finite(ax) or not is_finite(az):
		return false
	var distance: float = Vector2(ax - state.x, az - state.z).length()
	if distance > 24.0 or distance < 1.6:
		return false
	state.winch = {"anchor": anchor.duplicate(), "length": distance, "tension": 0.0}
	return true

func detach_winch(state: Dictionary) -> void:
	state.winch = null

func recover(state: Dictionary) -> void:
	var index: int = mini(int(state.checkpoint), _checkpoints.size()) - 1
	state.z = float(_checkpoints[index].z) + 1.8 if index >= 0 else 0.0
	state.x = Terrain.route_x(state.z)
	state.y = Terrain.height_at(state.x, state.z, state.region) + 0.65
	state.yaw = Terrain.heading_at(state.z)
	state.speed = 0.0
	state.pitch = 0.0
	state.roll = 0.0
	state.tilt = 0.0
	state.stuck = 0.0
	state.slip = 0.0
	state.winch = null
	state.collision = false
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
	state.collision = false
	state.winch = null
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

func _wheel_ground(state: Dictionary, offset: Vector2) -> float:
	var fx: float = sin(state.yaw)
	var fz: float = cos(state.yaw)
	var x: float = state.x + fz * offset.x + fx * offset.y
	var z: float = state.z - fx * offset.x + fz * offset.y
	return Terrain.height_at(x, z, state.region)

func _contact_ground(state: Dictionary, offset: Vector2) -> float:
	# Tire footprint supports the chassis across small ripples rather than at a point.
	return _wheel_ground(state, offset) * 0.5 + _wheel_ground(state, offset + Vector2(0.0, 0.6)) * 0.25 + _wheel_ground(state, offset - Vector2(0.0, 0.6)) * 0.25

func _reset_suspension(state: Dictionary) -> void:
	state.yVel = 0.0
	state.pitchVel = 0.0
	state.rollVel = 0.0
	var grounds: Array[float] = []
	for offset: Vector2 in WHEEL_OFFSETS:
		grounds.append(_contact_ground(state, offset))
	state.y = (grounds[0] + grounds[1] + grounds[2] + grounds[3]) * 0.25 + 0.65
	state.pitch = atan(((grounds[0] + grounds[1]) - (grounds[2] + grounds[3])) / 5.2)
	state.roll = atan(((grounds[1] + grounds[3]) - (grounds[0] + grounds[2])) / 4.24)
	for i: int in range(4):
		state.contactHeights[i] = grounds[i]
		state.contactVelocities[i] = 0.0
		state.wheelHeights[i] = _wheel_ground(state, WHEEL_OFFSETS[i]) + WHEEL_RADIUS
		state.suspension[i] = 0.0
		state.wheelContact[i] = true
		state.springForces[i] = 9.81

func step(state: Dictionary, input: Dictionary, dt: float, obstacles: Array = []) -> void:
	if not is_finite(dt) or dt <= 0.0:
		return
	var total: float = minf(dt, 0.15)
	var count: int = maxi(1, int(ceil(total / (1.0 / 120.0))))
	for _i: int in range(count):
		_simulate(state, input, total / float(count), obstacles)

func _simulate(state: Dictionary, input: Dictionary, dt: float, obstacles: Array) -> void:
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
	var snowy: bool = state.region == "snow"
	var winter_grip: float = 0.44 if snowy and not state.snowTires else 1.0
	var steering_response: float = 3.2 if snowy and not state.snowTires else 10.0
	state.steering += (steer - state.steering) * (1.0 - exp(-dt * steering_response))
	state.surface = Terrain.surface_at(state.x, state.z, state.region)
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
	var brake_value: float = clampf(float(input.get("brakeValue", 0.0)), 0.0, 1.0)
	if bool(input.get("brake", false)) or direction_brake or (throttle > 0.0 and reverse > 0.0):
		brake_value = 1.0
	var braking: bool = brake_value > 0.01
	if braking:
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
	var steer_rate: float = -state.steering * winter_grip * steering_health * state.speed / 3.35 * (0.82 / (1.0 + absf(state.speed) * 0.08))
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
		var w: Dictionary = state.winch
		var dx: float = w.anchor.x - state.x
		var dz: float = w.anchor.z - state.z
		var distance: float = Vector2(dx, dz).length()
		if distance > 29.0:
			state.winch = null
		else:
			if reel:
				w.length = maxf(2.2, w.length - dt * 2.8)
			var stretch: float = maxf(0.0, distance - w.length)
			w.tension = clampf(stretch / 0.8 + (0.2 if reel else 0.0), 0.0, 1.0)
			if stretch > 0.0 and distance > 0.01:
				var pull: float = minf(stretch, dt * (3.4 if reel else 5.0))
				state.x += dx / distance * pull
				state.z += dz / distance * pull
				var alignment: float = (dx * forward_x + dz * forward_z) / distance
				if alignment * state.speed < 0.0:
					state.speed *= exp(-dt * 5.0)
	state.collision = false
	for obstacle: Dictionary in obstacles:
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
	if state.x < Terrain.MIN_X or state.x > Terrain.MAX_X or state.z < Terrain.MIN_Z or state.z > Terrain.MAX_Z:
		state.x = clampf(state.x, Terrain.MIN_X, Terrain.MAX_X)
		state.z = clampf(state.z, Terrain.MIN_Z, Terrain.MAX_Z)
		state.speed *= 0.2
	_update_suspension(state, dt, acceleration, steer_rate)
	state.tilt = rad_to_deg(maxf(absf(state.pitch), absf(state.roll)))
	var slip_factor: float = 1.0 - snow_grip if snowy else (0.23 if state.lowGear else 0.78) if mud else 0.9 if water else 0.04 if state.awd else 0.17
	state.slip = clampf((slip_factor + (1.0 - tire_health) * 0.35) * absf(drive), 0.0, 1.0)
	state.stuck = state.stuck + dt if absf(state.speed) < 0.45 and (throttle > 0.0 or reverse > 0.0) else maxf(0.0, state.stuck - dt * 2.0)
	state.distance += Vector2(state.x - old_x, state.z - old_z).length()
	state.wheelRotation += (state.speed * dt + state.slip * drive * dt * 2.0) / WHEEL_RADIUS
	state.time += dt
	if state.checkpoint < _checkpoints.size():
		var target: Dictionary = _checkpoints[state.checkpoint]
		if Vector2(state.x - target.x, state.z - target.z).length() < 13.0:
			state.checkpoint += 1
			if state.checkpoint == _checkpoints.size():
				state.completed = true

func _update_suspension(state: Dictionary, dt: float, acceleration: float, steer_rate: float) -> void:
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
	for i: int in range(4):
		var offset: Vector2 = WHEEL_OFFSETS[i]
		var raw_ground: float = _wheel_ground(state, offset)
		var ground: float = _contact_ground(state, offset)
		# Smooth only support velocity: wheels retain their individual raw ground heights.
		# Dampers oppose compression velocity, not the vehicle's uphill world velocity.
		var contact_velocity: float = clampf((ground - state.contactHeights[i]) / dt, -8.0, 8.0)
		state.contactHeights[i] = ground
		state.contactVelocities[i] = lerpf(state.contactVelocities[i], contact_velocity, 1.0 - exp(-dt * 3.0))
		ground_sum += ground
		var corner_height: float = state.y + sin(state.pitch) * offset.y + sin(state.roll) * offset.x
		var corner_velocity: float = state.yVel + state.pitchVel * offset.y + state.rollVel * offset.x
		var compression: float = ground + 0.65 - corner_height
		var in_contact: bool = compression >= -travel
		max_compression = maxf(max_compression, compression)
		# Each grounded corner contributes spring force and damper force independently.
		# 9.81 preload balances body weight at the nominal ride height.
		var force: float = maxf(0.0, spring_rate * clampf(compression, -travel, travel) - damping * (corner_velocity - state.contactVelocities[i]) + 9.81) if in_contact else 0.0
		state.suspension[i] = clampf(compression, -travel, travel)
		state.wheelContact[i] = in_contact
		state.springForces[i] = force
		state.wheelHeights[i] = raw_ground + WHEEL_RADIUS if in_contact else corner_height - 0.01 - travel
		lift += force * 0.25
		pitch_torque += force * offset.y / (4.0 * 1.3 * 1.3)
		roll_torque += force * offset.x / (4.0 * 1.06 * 1.06)
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
	var minimum_height: float = ground_sum * 0.25 + 0.36
	if state.y < minimum_height:
		state.y = minimum_height
		state.yVel = maxf(0.0, state.yVel)
