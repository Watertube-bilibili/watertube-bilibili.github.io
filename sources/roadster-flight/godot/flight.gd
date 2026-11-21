extends Node3D

const Terrain := preload("res://landscape.gd")
const Exterior := preload("res://assets/rocket-mobile.glb")
# Reservoir mass is from the presentation. Vehicle mass, acceleration, burn
# rates and control damping are assumptions for an interactive simulation.
const FULL_GAS := 250.0
const DRY_MASS := 1650.0
const G := 9.80665
const LIFT_RATIO := 1.65
const BALANCE_HEIGHT := 0.62
const MAX_LIFT := (DRY_MASS + FULL_GAS) * G * LIFT_RATIO
# Assumed effective exhaust speed for a game-scale cold-gas momentum budget.
const EFFECTIVE_EXHAUST_SPEED := 600.0
const FULL_BURN := MAX_LIFT / EFFECTIVE_EXHAUST_SPEED

var rig: RigidBody3D
var camera: Camera3D
var jets: Array[CPUParticles3D] = []
var gas := FULL_GAS
var throttle := 0.0
var lift_command := 0.0
var burn := 0.0
var airborne_seconds := 0.0
var phase := "停机坪"
var stopped := false
var airborne := false
var flew := false
var frozen := false
var freeze_linear := Vector3.ZERO
var freeze_angular := Vector3.ZERO
var chase := false
var camera_aim := Vector3.ZERO
var telemetry_clock := 0.0
var last_vy := 0.0
var web: JavaScriptObject
var native_label: Label
var wheel_nodes: Array[Node3D] = []
var steering_hubs: Array[Node3D] = []
var wheel_spin := 0.0
var ground_steer := 0.0

func _ready() -> void:
	if OS.has_feature("web"):
		web = JavaScriptBridge.get_interface("flightHub")
	_build_lighting()
	Terrain.build(self)
	_build_vehicle()
	camera = Camera3D.new()
	camera.fov = 43.0
	camera.far = 430.0
	add_child(camera)
	camera.current = true
	if not web:
		var overlay := CanvasLayer.new()
		add_child(overlay)
		native_label = Label.new()
		native_label.position = Vector2(18,14)
		overlay.add_child(native_label)
	reset_flight()
	if web: web.markReady()

func _build_lighting() -> void:
	var world_rules := Environment.new()
	world_rules.background_mode = Environment.BG_SKY
	var sky := Sky.new()
	var atmosphere := ProceduralSkyMaterial.new()
	atmosphere.sky_top_color = Color("#465d74")
	atmosphere.sky_horizon_color = Color("#b1a093")
	atmosphere.ground_horizon_color = Color("#b1a093")
	atmosphere.ground_bottom_color = Color("#333a43")
	atmosphere.sun_angle_max = 23.0
	atmosphere.sun_curve = 0.22
	sky.sky_material = atmosphere
	world_rules.sky = sky
	world_rules.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	world_rules.ambient_light_color = Color("#bdc9e7")
	world_rules.ambient_light_energy = 0.50
	world_rules.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	world_rules.fog_enabled = true
	world_rules.fog_light_color = Color("#a69790")
	world_rules.fog_density = 0.0043
	world_rules.fog_sky_affect = 0.15
	var environment := WorldEnvironment.new()
	environment.environment = world_rules
	add_child(environment)

	var sun := DirectionalLight3D.new()
	sun.name = "Low sun from the salt flat"
	sun.light_color = Color("#ffd9aa")
	sun.light_energy = 1.23
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = 52.0
	add_child(sun)
	sun.rotation_degrees = Vector3(-28.0, -35.0, 0.0)

	var fill := DirectionalLight3D.new()
	fill.light_color = Color("#a2c6fc")
	fill.light_energy = 0.35
	add_child(fill)
	fill.rotation_degrees = Vector3(-42.0, 147.0, 0.0)


func _shape(shape: Shape3D, offset: Vector3) -> void:
	var collision := CollisionShape3D.new()
	collision.shape = shape
	rig.add_child(collision)
	collision.position = offset


func _build_vehicle() -> void:
	rig = RigidBody3D.new()
	rig.name = "Rocket"
	rig.mass = DRY_MASS + FULL_GAS
	rig.inertia = Vector3(3100, 3500, 910)
	rig.center_of_mass_mode = RigidBody3D.CENTER_OF_MASS_MODE_CUSTOM
	rig.center_of_mass = Vector3(0, -0.14, 0)
	rig.linear_damp_mode = RigidBody3D.DAMP_MODE_REPLACE
	rig.angular_damp_mode = RigidBody3D.DAMP_MODE_REPLACE
	rig.linear_damp = 0.10
	rig.angular_damp = 1.8
	rig.can_sleep = false
	rig.continuous_cd = true
	rig.contact_monitor = true
	rig.max_contacts_reported = 12
	# Longitudinal and lateral tire grip are applied separately below.
	var surface := PhysicsMaterial.new()
	surface.friction = 0.02
	surface.bounce = 0.0
	rig.physics_material_override = surface
	add_child(rig)
	var shell := BoxShape3D.new()
	shell.size = Vector3(1.85, 0.56, 4.20)
	_shape(shell, Vector3(0, 0.06, 0))
	for side in [-1,1]:
		for axle in [-1,1]:
			var wheel := SphereShape3D.new()
			wheel.radius = 0.325
			_shape(wheel, Vector3(side * 0.82, wheel.radius - BALANCE_HEIGHT, axle * 1.32))
			_make_jet(Vector3(side * 0.84, -0.38, axle * 1.26))
	var model := Exterior.instantiate() as Node3D
	model.position.y = -BALANCE_HEIGHT
	rig.add_child(model)
	for wheel_name in ["Wheel_FL", "Wheel_FR", "Wheel_RL", "Wheel_RR"]:
		var part := model.find_child(wheel_name,true,false) as Node3D
		if part: wheel_nodes.append(part)
	for hub_name in ["Hub_FL", "Hub_FR"]:
		var hub := model.find_child(hub_name,true,false) as Node3D
		if hub: steering_hubs.append(hub)

func _make_jet(position_at_mount: Vector3) -> void:
	var particle := CPUParticles3D.new()
	particle.amount = 35
	particle.lifetime = 0.30
	particle.local_coords = false
	particle.emitting = false
	particle.direction = Vector3.DOWN
	particle.spread = 17.0
	particle.initial_velocity_min = 8.0
	particle.initial_velocity_max = 15.0
	particle.gravity = Vector3(0.0, -0.3, 0.0)
	particle.scale_amount_min = 0.7
	particle.scale_amount_max = 2.8
	particle.color_ramp = Gradient.new()
	particle.color_ramp.set_color(0, Color(0.86, 0.93, 1.0, 0.67))
	particle.color_ramp.set_color(1, Color(0.8, 0.84, 0.91, 0.0))
	var falloff := Gradient.new()
	falloff.set_color(0, Color(0.95, 0.96, 1.0, 0.88))
	falloff.set_color(1, Color(0.74, 0.79, 0.86, 0.0))
	var texture := GradientTexture2D.new()
	texture.gradient = falloff
	texture.width = 32
	texture.height = 32
	texture.fill = GradientTexture2D.FILL_RADIAL
	texture.fill_from = Vector2(0.5, 0.5)
	texture.fill_to = Vector2(1.0, 0.5)
	var material := StandardMaterial3D.new()
	material.albedo_texture = texture
	material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	material.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	material.vertex_color_use_as_albedo = true
	var quad := QuadMesh.new()
	quad.size = Vector2(0.31, 0.31)
	quad.material = material
	particle.mesh = quad
	rig.add_child(particle)
	particle.position = position_at_mount
	jets.append(particle)


func reset_flight() -> void:
	gas = FULL_GAS
	throttle = 0
	burn = 0
	lift_command = 0
	airborne_seconds = 0
	airborne = false
	flew = false
	stopped = false
	last_vy = 0
	frozen = false
	phase = "停机坪"
	wheel_spin = 0
	ground_steer = 0
	rig.freeze = true
	rig.global_transform = Transform3D(Basis.IDENTITY, Vector3(0, BALANCE_HEIGHT + 0.015, 0))
	PhysicsServer3D.body_set_state(rig.get_rid(),PhysicsServer3D.BODY_STATE_TRANSFORM,rig.global_transform)
	rig.linear_velocity = Vector3.ZERO
	rig.angular_velocity = Vector3.ZERO
	rig.mass = DRY_MASS + FULL_GAS
	for jet in jets: jet.emitting = false
	rig.freeze = false
	camera_aim = Vector3(0,0.60,0)
	camera.position = Vector3(-4.95,2.1,6.45)
	camera.look_at(camera_aim,Vector3.UP)
	if web: web.clear()
	_publish()

func set_frozen(pause: bool) -> void:
	if frozen == pause: return
	frozen = pause
	if pause:
		freeze_linear = rig.linear_velocity
		freeze_angular = rig.angular_velocity
		rig.freeze = true
		for jet in jets: jet.emitting = false
	elif not stopped:
		rig.freeze = false
		rig.linear_velocity = freeze_linear
		rig.angular_velocity = freeze_angular

func altitude() -> float:
	return maxf(0.0, rig.global_position.y - BALANCE_HEIGHT)

func _input(event: InputEvent) -> void:
	if web or not (event is InputEventKey and event.pressed and not event.echo): return
	match event.physical_keycode:
		KEY_R: reset_flight()
		KEY_C: chase = not chase
		KEY_X: throttle = 0.0
		KEY_H: throttle = minf(1.0, rig.mass * G / MAX_LIFT)

func _axis(positive: Key, negative: Key) -> float:
	return float(Input.is_physical_key_pressed(positive)) - float(Input.is_physical_key_pressed(negative))

func _physics_process(dt: float) -> void:
	if not rig: return
	if web:
		if bool(web.resetRequested):
			web.resetRequested = false
			reset_flight()
		set_frozen(bool(web.paused))
		chase = bool(web.chase)
	if stopped or frozen: return
	var travel := Vector2.ZERO
	var tilt := Vector2.ZERO
	var yaw_cmd := 0.0
	var adjust := 0.0
	var boost := false
	if web:
		travel = Vector2(float(web.moveX),float(web.moveY)).limit_length()
		tilt = Vector2(float(web.tiltX),float(web.tiltY)).limit_length()
		yaw_cmd = float(web.yawCmd)
		adjust = float(web.adjust)
		boost = bool(web.boost)
		if bool(web.cut):
			throttle = 0.0
			web.cut = false
		if bool(web.trim):
			throttle = rig.mass * G / MAX_LIFT
			web.trim = false
	else:
		travel = Vector2(_axis(KEY_D,KEY_A), _axis(KEY_W,KEY_S)).limit_length()
		tilt = Vector2(_axis(KEY_RIGHT,KEY_LEFT), _axis(KEY_UP,KEY_DOWN)).limit_length()
		yaw_cmd = _axis(KEY_E,KEY_Q)
		adjust = _axis(KEY_PAGEUP,KEY_PAGEDOWN)
		boost = Input.is_physical_key_pressed(KEY_SPACE)
	throttle = clampf(throttle + adjust * dt * 0.75,0,1)
	var demand := maxf(throttle,float(boost))
	var basis_car := rig.global_basis.orthonormalized()
	var speed_local := basis_car.inverse() * rig.linear_velocity
	var height := altitude()
	var touching := not rig.get_colliding_bodies().is_empty()
	var grounded := basis_car.y.y > 0.65 and (touching or height < 0.055)
	airborne = not grounded
	var jet_controls := airborne or demand > rig.mass * G / MAX_LIFT
	var control_activity := (0.14 * travel.length() + 0.15 * tilt.length() + 0.10 * absf(yaw_cmd)) if jet_controls else 0.0
	var demand_burn := FULL_BURN * (demand + control_activity)
	var fraction := minf(1.0, gas / (demand_burn * dt)) if demand_burn > 0.0 else 0.0
	burn = demand_burn * fraction
	gas = maxf(0.0, gas - burn * dt)
	rig.mass = DRY_MASS + gas
	lift_command = demand * fraction
	rig.apply_central_force(basis_car.y * (MAX_LIFT * lift_command))
	if jet_controls:
		rig.apply_central_force(basis_car * Vector3(-travel.x*3.4,0,travel.y*3.9) * rig.mass * fraction)
		rig.apply_torque(basis_car * Vector3(tilt.y * 3400.0,-yaw_cmd*3700.0,tilt.x*1700.0) * fraction)
	if grounded:
		# Wheel forces follow the horizontal tire axes, so ground drive cannot lift the car.
		var forward := Vector3(basis_car.z.x, 0, basis_car.z.z).normalized()
		var left := Vector3(basis_car.x.x, 0, basis_car.x.z).normalized()
		var target_speed := travel.y * (27.0 if travel.y > 0 else 9.0)
		var acceleration := clampf((target_speed - speed_local.z) * 1.05,-7.2,7.2)
		rig.apply_central_force(rig.mass * (forward * acceleration + left * clampf(-speed_local.x * 5.0,-8.0,8.0)))
		var steer_gain := clampf(speed_local.z / 5.0,-1.0,1.0)
		var desired_yaw := -travel.x * steer_gain * 1.02
		rig.apply_torque(Vector3.UP * ((desired_yaw - rig.angular_velocity.y) * 11700.0))
		ground_steer = move_toward(ground_steer, -travel.x * 0.38, 2.6 * dt)
		wheel_spin = fmod(wheel_spin + speed_local.z * dt / 0.335, TAU)
	else:
		ground_steer = move_toward(ground_steer,0.0,1.7*dt)
	for wheel in wheel_nodes:
		wheel.basis = Basis(Vector3.RIGHT,wheel_spin)
	for hub in steering_hubs:
		hub.rotation.y = ground_steer
	for jet in jets: jet.emitting = lift_command > 0.05
	if airborne and height > 0.12:
		airborne_seconds += dt
		flew = true
	if touching and (basis_car.y.y < 0.12 or (last_vy < -8.5 and flew)):
		_stop("着陆过重")
	elif height > 110 or absf(rig.position.x) > 170 or absf(rig.position.z) > 170:
		_stop("超出场地")
	elif gas < 0.001 and airborne: phase = "气量耗尽"
	elif airborne: phase = "空中飞行"
	elif absf(speed_local.z) > 0.5: phase = "地面行驶"
	elif flew: phase = "已着陆"
	elif lift_command > 0.01: phase = "推力上升"
	else: phase = "停机坪"
	last_vy = rig.linear_velocity.y

func _stop(reason: String) -> void:
	stopped = true
	phase = reason
	throttle = 0
	lift_command = 0
	burn = 0
	rig.freeze = true
	for jet in jets: jet.emitting = false

func _publish() -> void:
	if not rig: return
	var rotation_deg := rig.rotation_degrees
	var horizontal := Vector2(rig.linear_velocity.x,rig.linear_velocity.z).length()
	var state := {"altitude":altitude(),"speed":horizontal,"verticalSpeed":rig.linear_velocity.y,
		"pitch":-rotation_deg.x,"roll":rotation_deg.z,"yaw":-rotation_deg.y,"gas":gas,
		"throttle":throttle,"lift":lift_command,"burn":burn,"remaining":gas/burn if burn > 0.001 else -1.0,
		"phase":phase,"elapsed":airborne_seconds,"stopped":stopped,"paused":frozen,
		"distance":Vector2(rig.position.x,rig.position.z).length(),"airborne":airborne}
	if web: web.update(JSON.stringify(state))
	elif native_label:
		native_label.text = "Rocket   |   %.1f m   %.0f km/h   Gas %.1f kg   Power %.0f%%\nW/S drive   A/D steer   Arrows pitch/roll   Q/E yaw   Space boost\nPgUp / PgDn throttle	H trim	X cut	C camera	R reset" % [altitude(),horizontal*3.6,gas,lift_command*100]

func _process(delta: float) -> void:
	if not camera or not rig: return
	var aspect := get_viewport().get_visible_rect().size.aspect()
	camera.keep_aspect = Camera3D.KEEP_HEIGHT if aspect > 1.15 else Camera3D.KEEP_WIDTH
	camera.fov = 43.0 if aspect > 1.15 else 52.0
	var axes := rig.global_basis
	var heading := Vector3(axes.z.x,0,axes.z.z).normalized()
	if heading.length_squared() < 0.04: heading = Vector3.BACK
	var left := Vector3.UP.cross(heading)
	var zoom := 1.0 if aspect > 1.15 else 1.06
	var offset := (-heading * 7.8 + left * 1.0 + Vector3.UP * 2.5) if chase else (heading * 6.55 - left * 4.95 + Vector3.UP * 1.95)
	var blend := 1.0-exp(-4.5*delta)
	var target := rig.global_position + Vector3.UP * (0.15 if aspect > 1.15 else 0.42)
	camera.position = camera.position.lerp(rig.global_position + offset*zoom,blend)
	camera_aim = camera_aim.lerp(target,blend)
	if camera.position.distance_squared_to(camera_aim) > 0.1: camera.look_at(camera_aim,Vector3.UP)
	telemetry_clock += delta
	if telemetry_clock > 0.09:
		telemetry_clock = 0
		_publish()
