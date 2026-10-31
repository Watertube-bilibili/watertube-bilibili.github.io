# SPDX-License-Identifier: AGPL-3.0-only
extends RigidBody2D

signal sampled(sample: Dictionary)
const SCALE = 1000.0
var active = false
var fresh = true
var elapsed = 0.0
var parameters = {}
var mode = ""
var in_material = false
var contact_time = -1.0

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
	var collision = CollisionShape2D.new()
	var shape = CircleShape2D.new()
	shape.radius = 10.0
	collision.shape = shape
	add_child(collision)

func begin(config: Dictionary) -> void:
	parameters = config
	mode = str(config.scenario)
	mass = float(config.get("mass",.1))
	lock_rotation = mode!="solarFan"
	if mode=="solarFan":
		inertia = float(config.inertia)*SCALE*SCALE
	fresh = true
	elapsed = 0.0
	in_material = false
	contact_time = -1.0
	active = true
	freeze = false
	sleeping = false

func _integrate_forces(state: PhysicsDirectBodyState2D) -> void:
	if not active:
		return
	if fresh:
		fresh = false
		state.transform = Transform2D.IDENTITY
		state.linear_velocity = Vector2.RIGHT*float(parameters.get("velocity",0.0))*SCALE
		state.angular_velocity = 0.0
		if mode=="airSuspension":
			state.transform = Transform2D(0.0,Vector2(0,-.02*SCALE))
	else:
		elapsed += state.step
	var position_m = state.transform.origin/SCALE
	var velocity_m = state.linear_velocity/SCALE
	var force = Vector2.ZERO
	var torque = 0.0
	var air_force = 0.0
	var local_air_speed = 0.0
	match mode:
		"magnetDeflection":
			if parameters.placement!="none" and float(parameters.strength)>0.0:
				var separation = Vector2(float(parameters.magnetX),float(parameters.magnetY))-position_m
				var softening = float(parameters.softening)
				# A smooth, conservative central attraction with stipulated peak
				# force. This is an equivalent teaching field, not a magnet law.
				force = 1.5*sqrt(3.0)*float(parameters.strength)*softening*softening*separation/pow(separation.length_squared()+softening*softening,1.5)
			state.apply_central_force(force*SCALE)
		"indentation":
			if not in_material and position_m.y>=float(parameters.height):
				in_material = true
				contact_time = elapsed
			if in_material:
				if velocity_m.y<=.0000001:
					state.linear_velocity = Vector2.ZERO
					velocity_m = Vector2.ZERO
				else:
					var net_resistance = float(parameters.resistance)-mass*9.8
					force.y = -minf(net_resistance,mass*velocity_m.y/state.step)
			else:
				force.y = mass*9.8
			state.apply_central_force(force*SCALE)
		"solarFan":
			torque = float(parameters.torque)-float(parameters.damping)*state.angular_velocity
			state.apply_torque(torque*SCALE*SCALE)
		"airSuspension":
			if parameters.blowing=="on":
				local_air_speed = float(parameters.speed)/pow(1.0+maxf(-position_m.y,0.0)/float(parameters.flowLength),2)
			var relative_speed = local_air_speed+velocity_m.y
			air_force = .5*float(parameters.airDensity)*float(parameters.dragCoefficient)*float(parameters.area)*relative_speed*absf(relative_speed)
			force.y = mass*9.8-float(parameters.buoyancy)-air_force
			state.apply_central_force(force*SCALE)
	sampled.emit({"time":elapsed,"x":position_m.x,"y":position_m.y,"vx":velocity_m.x,"vy":velocity_m.y,"fx":force.x,"fy":force.y,"angle":state.transform.get_rotation(),"angularVelocity":state.angular_velocity,"netTorque":torque,"phase":1 if in_material else 0,"contactTime":contact_time,"step":state.step,"airForce":air_force,"localAirSpeed":local_air_speed})
