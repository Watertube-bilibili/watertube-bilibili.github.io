extends RigidBody2D

signal sampled(time: float, distance: float, velocity: float)
var active = false
var fresh = true
var elapsed = 0.0
var axis = Vector2.RIGHT
var start_velocity = 0.0
var applied_force = 0.0
var friction_coefficient = 0.0
var normal_force = 0.0
var stationary = false
const SCALE = 1000.0

func _ready() -> void:
	gravity_scale = 0.0
	linear_damp_mode = RigidBody2D.DAMP_MODE_REPLACE
	linear_damp = 0.0
	angular_damp_mode = RigidBody2D.DAMP_MODE_REPLACE
	angular_damp = 0.0
	lock_rotation = true
	can_sleep = false
	freeze = true
	contact_monitor = true
	max_contacts_reported = 4
	var shape = CollisionShape2D.new()
	var circle = CircleShape2D.new()
	circle.radius = 10.0
	shape.shape = circle
	add_child(shape)

func begin(config: Dictionary) -> void:
	mass = maxf(float(config.get("mass",1.0)),.0001)
	axis = config.get("axis",Vector2.RIGHT)
	start_velocity = float(config.get("velocity",0.0))
	applied_force = float(config.get("force",0.0))
	friction_coefficient = float(config.get("friction",0.0))
	normal_force = float(config.get("normal",mass*9.8))
	fresh = true
	elapsed = 0.0
	stationary = false
	constant_force = axis * applied_force * SCALE
	freeze = false
	active = true
	sleeping = false

func _integrate_forces(state: PhysicsDirectBodyState2D) -> void:
	if not active: return
	if fresh:
		fresh = false
		state.transform = Transform2D(0.0,Vector2.ZERO)
		state.linear_velocity = axis*start_velocity*SCALE
		state.angular_velocity = 0.0
		elapsed = 0.0
	else:
		elapsed += state.step
	var velocity = state.linear_velocity.dot(axis)/SCALE
	var friction = friction_coefficient*normal_force
	if friction>0:
		if abs(velocity)<.0001 or (start_velocity>=0 and velocity<0 and applied_force<=friction):
			if abs(applied_force)<=friction:
				state.linear_velocity = Vector2.ZERO
				velocity = 0
				constant_force = Vector2.ZERO
				stationary = true
			else:constant_force=axis*(applied_force-signf(applied_force)*friction)*SCALE
		else:constant_force=axis*(applied_force-signf(velocity)*friction)*SCALE
	else:constant_force=axis*applied_force*SCALE
	var distance=state.transform.origin.dot(axis)/SCALE
	sampled.emit(elapsed,distance,velocity)
