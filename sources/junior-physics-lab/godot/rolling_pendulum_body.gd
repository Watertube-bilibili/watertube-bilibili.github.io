# SPDX-License-Identifier: AGPL-3.0-only
# Piecewise no-slip rigid-body integration with an impulsive string capture.
extends RigidBody2D

signal measured(sample: Dictionary)
signal completed(reason: String)
const SCALE = 1000.0
const G = 9.8
var axle_radius: float
var moment: float
var travel: float
var requested_cycles: int
var q: float
var tension: float
var branch: int = 1
var anchor_y: float = 0.0
var anchor_angle: float = 0.0
var elapsed: float = 0.0
var angle: float = 0.0
var prior_wrapped: float = 0.0
var lost: float = 0.0
var bottoms: int = 0
var tops: int = 0
var fresh: bool = true
var active: bool = false
var previous: Dictionary = {}
var events: Array = []
var step: float
var stop_reason: String = ""

func configure(p: Dictionary) -> void:
	mass=p.mass; moment=p.inertia; axle_radius=p.radius
	travel=p.height; requested_cycles=p.cycles; q=p.q
	inertia=moment*SCALE*SCALE
	gravity_scale=0.0
	linear_damp_mode=RigidBody2D.DAMP_MODE_REPLACE
	angular_damp_mode=RigidBody2D.DAMP_MODE_REPLACE
	linear_damp=0; angular_damp=0; can_sleep=false
	collision_layer=0; collision_mask=0
	var shape=CollisionShape2D.new()
	var circle=CircleShape2D.new(); circle.radius=10
	shape.shape=circle; add_child(shape)
	tension=mass*G*moment/(moment+mass*axle_radius*axle_radius)
	constant_force=Vector2.DOWN*(mass*G-tension)*SCALE
	constant_torque=tension*axle_radius*SCALE*SCALE
	active=true

func snapshot(y: float,v: float,theta: float,omega: float,phase: String) -> Dictionary:
	var potential=mass*G*(travel-y)
	var translation=0.5*mass*v*v
	var rotation=0.5*moment*omega*omega
	return {"time":elapsed,"position":y,"velocity":v,"angle":theta,"angularVelocity":omega,
		"branch":branch,"phase":phase,"branchPositionAnchor":anchor_y,"branchAngleAnchor":anchor_angle,
		"potentialEnergy":potential,"translationEnergy":translation,"rotationEnergy":rotation,
		"mechanicalEnergy":potential+translation+rotation,"energyLost":lost,"tension":tension}

func _integrate_forces(state: PhysicsDirectBodyState2D) -> void:
	if not active:return
	step=state.step
	if fresh:
		fresh=false
		state.transform=Transform2D(0,Vector2.ZERO)
		state.linear_velocity=Vector2.ZERO; state.angular_velocity=0
	else:
		elapsed+=step
		var wrapped=state.transform.get_rotation()
		angle+=wrapf(wrapped-prior_wrapped,-PI,PI)
		prior_wrapped=wrapped
	var y=state.transform.origin.y/SCALE
	var v=state.linear_velocity.y/SCALE
	var omega=state.angular_velocity
	var current=snapshot(y,v,angle,omega,"descending" if v>=0 else "ascending")
	# Roll back the very small overshoot to a crossing interpolated between two
	# actual engine states. The next integration step starts at this event state;
	# no analytic position curve or reversed trajectory is generated.
	if not previous.is_empty() and y>=travel and v>0:
		var fraction=clampf((travel-float(previous.position))/(y-float(previous.position)),0,1)
		current=_crossing(previous,current,fraction)
		elapsed=current.time; y=travel; angle=current.angle
		v=current.velocity; omega=current.angularVelocity
		current=snapshot(y,v,angle,omega,"descending")
		measured.emit(current)
		var before=current.duplicate()
		var new_branch=-branch
		# General mass-metric no-slip projection: unlike simply multiplying by
		# q, this also removes the measured finite-precision constraint drift.
		var impulse=(v-new_branch*axle_radius*omega)/(state.inverse_mass+axle_radius*axle_radius*state.inverse_inertia*SCALE*SCALE)
		var before_kinetic=current.translationEnergy+current.rotationEnergy
		branch=-branch; anchor_y=travel; anchor_angle=angle
		state.linear_velocity=Vector2(0,v*SCALE); state.angular_velocity=omega
		state.apply_central_impulse(Vector2.UP*impulse*SCALE)
		state.apply_torque_impulse(branch*axle_radius*impulse*SCALE*SCALE)
		v=state.linear_velocity.y/SCALE; omega=state.angular_velocity
		var after_kinetic=0.5*mass*v*v+0.5*moment*omega*omega
		lost+=maxf(0,before_kinetic-after_kinetic)
		bottoms+=1
		current=snapshot(y,v,angle,omega,"ascending")
		events.append({"kind":"bottom","index":bottoms,"time":elapsed,"pre":before,"post":current.duplicate(),"impulse":impulse,"lostEnergy":before_kinetic-after_kinetic})
		# q=0 physically stops. A nonzero but unresolved return only stops the
		# observation: retain its actual post-capture KE, never relabel it heat.
		if q==0.0:
			lost+=after_kinetic
			v=0; omega=0
			current=snapshot(y,0,angle,0,"stopped")
			current["tension"]=mass*G
			current["endpointSupport"]=true
			events[-1]["post"]=current.duplicate()
			events[-1]["lostEnergy"]=before_kinetic
			stop_reason="capture-stop"
		elif after_kinetic/(mass*G)<0.0000001 or 2.0*absf(v)/(G-tension/mass)<32.0*step:
			current=snapshot(y,v,angle,omega,"resolution-limit")
			stop_reason="resolution-limit"
	elif not previous.is_empty() and float(previous.velocity)<0 and v>=0:
		var fraction=clampf(-float(previous.velocity)/(v-float(previous.velocity)),0,1)
		current=_crossing(previous,current,fraction)
		elapsed=current.time; y=current.position; angle=current.angle
		v=0; omega=0
		current=snapshot(y,0,angle,0,"turning")
		tops+=1
		events.append({"kind":"top","index":tops,"time":elapsed,"pre":current.duplicate(),"post":current.duplicate(),"lostEnergy":0.0})
		# branch does NOT change at the top. Gravity and string torque naturally
		# reverse v and omega on the following actual rigid-body integration steps.
		if tops>=requested_cycles:stop_reason="observation-complete"
	state.transform=Transform2D(angle,Vector2(0,y*SCALE))
	prior_wrapped=state.transform.get_rotation()
	state.linear_velocity=Vector2(0,v*SCALE)
	state.angular_velocity=omega
	constant_torque=branch*tension*axle_radius*SCALE*SCALE
	if not stop_reason.is_empty():
		active=false; constant_force=Vector2.ZERO; constant_torque=0
		measured.emit(current)
		completed.emit(stop_reason)
		return
	previous=current
	measured.emit(current)

func _crossing(a: Dictionary,b: Dictionary,fraction: float) -> Dictionary:
	var sample={}
	for key in ["time","position","velocity","angle","angularVelocity"]:
		sample[key]=lerpf(float(a[key]),float(b[key]),fraction)
	return sample
