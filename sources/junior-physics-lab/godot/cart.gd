extends RigidBody2D

signal measured(distance: float, time: float)
var active := false
var axis := Vector2.LEFT
var origin := Vector2.ZERO
var elapsed := 0.0
var fresh := true
const SCALE := 1000.0

func _ready() -> void:
	gravity_scale = 0.0
	linear_damp_mode = RigidBody2D.DAMP_MODE_REPLACE
	linear_damp = 0.0
	angular_damp_mode = RigidBody2D.DAMP_MODE_REPLACE
	angular_damp = 0.0
	lock_rotation = true
	can_sleep = false
	collision_layer = 0
	collision_mask = 0
	freeze = true
	var shape := CollisionShape2D.new()
	var circle := CircleShape2D.new()
	circle.radius = 5.0
	shape.shape = circle
	add_child(shape)

func release(length_m: float, angle_deg: float, mass_g: float) -> void:
	active = false
	freeze = true
	constant_force = Vector2.ZERO
	position = Vector2.ZERO
	origin = position
	linear_velocity = Vector2.ZERO
	angular_velocity = 0.0
	mass = mass_g / 1000.0
	var angle := deg_to_rad(angle_deg)
	axis = Vector2(-cos(angle), sin(angle))
	# The ideal ramp's normal reaction cancels the perpendicular component of
	# gravity. Godot's RigidBody2D solver integrates the remaining real force.
	# No animation trajectory or analytic travel-time formula is used here.
	constant_force = axis * mass * 9.8 * sin(angle) * SCALE
	elapsed = 0.0
	fresh = true
	active = true
	freeze = false
	sleeping = false

func stop() -> void:
	active = false
	constant_force = Vector2.ZERO
	freeze = true
	linear_velocity = Vector2.ZERO
	position = Vector2.ZERO
	elapsed = 0.0

func _integrate_forces(state: PhysicsDirectBodyState2D) -> void:
	if not active:
		return
	if fresh:
		fresh = false
		elapsed = 0.0
		state.transform = Transform2D(0.0, Vector2.ZERO)
		state.linear_velocity = Vector2.ZERO
		state.angular_velocity = 0.0
		measured.emit(0.0, 0.0)
		return
	else:
		elapsed += state.step
	var distance := maxf(0.0, (state.transform.origin - origin).dot(axis) / SCALE)
	measured.emit(distance, elapsed)
