# SPDX-License-Identifier: AGPL-3.0-only
# SI quantities are converted to Godot's 1000-units-per-metre world here.
extends RigidBody2D

signal sampled(sample: Dictionary)
const SCALE = 1000.0
var active = false
var fresh = true
var elapsed = 0.0
var axis = Vector2.RIGHT
var initial_position = 0.0
var initial_velocity = 0.0
var spring = 0.0
var friction = 0.0
var friction_enabled = false
var pending_impulse = 0.0
var rotational_damping = 0.0

func _ready() -> void:
	gravity_scale = 0.0
	linear_damp_mode = RigidBody2D.DAMP_MODE_REPLACE
	angular_damp_mode = RigidBody2D.DAMP_MODE_REPLACE
	linear_damp = 0.0
	angular_damp = 0.0
	can_sleep = false
	freeze = true
	collision_layer = 0
	collision_mask = 0
	var shape = CollisionShape2D.new()
	var circle = CircleShape2D.new()
	circle.radius = 10.0
	shape.shape = circle
	add_child(shape)

func begin(config: Dictionary) -> void:
	mass = float(config.get("mass",1.0))
	axis = config.get("axis",Vector2.RIGHT)
	initial_position = float(config.get("position",0.0))
	initial_velocity = float(config.get("velocity",0.0))
	spring = float(config.get("spring",0.0))
	friction = float(config.get("friction",0.0))
	friction_enabled = bool(config.get("frictionEnabled",false))
	rotational_damping = float(config.get("rotationalDamping",0.0))
	lock_rotation = not config.has("inertia")
	if config.has("inertia"):
		inertia = float(config.inertia)*SCALE*SCALE
	constant_force = axis*float(config.get("force",0.0))*SCALE
	constant_torque = float(config.get("torque",0.0))*SCALE*SCALE
	fresh = true
	elapsed = 0.0
	pending_impulse = 0.0
	active = true
	freeze = false
	sleeping = false

func _integrate_forces(state: PhysicsDirectBodyState2D) -> void:
	if not active:
		return
	if fresh:
		fresh = false
		state.transform = Transform2D(0.0,axis*initial_position*SCALE)
		state.linear_velocity = axis*initial_velocity*SCALE
		state.angular_velocity = 0.0
	else:
		elapsed += state.step
	# The ideal inelastic impact transfers a pair of opposite impulses. They
	# are applied to the two actual bodies in their next integration callbacks.
	if pending_impulse != 0.0:
		state.apply_central_impulse(axis*pending_impulse*SCALE)
		pending_impulse = 0.0
	var position_m = state.transform.origin.dot(axis)/SCALE
	var velocity_m = state.linear_velocity.dot(axis)/SCALE
	if spring > 0.0:
		state.apply_central_force(axis*(-spring*position_m)*SCALE)
	if rotational_damping > 0.0:
		state.apply_torque(-rotational_damping*state.angular_velocity*SCALE*SCALE)
	if friction_enabled and friction > 0.0 and velocity_m != 0.0:
		# Limit the final friction impulse to the momentum remaining, so dry
		# friction cannot reverse a body after it has come to rest.
		var friction_force = minf(friction*mass*9.8,mass*absf(velocity_m)/state.step)
		state.apply_central_force(-axis*signf(velocity_m)*friction_force*SCALE)
	sampled.emit({"time":elapsed,"position":position_m,"velocity":velocity_m,"angle":state.transform.get_rotation(),"angularVelocity":state.angular_velocity,"step":state.step})
