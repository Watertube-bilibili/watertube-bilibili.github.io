# SPDX-License-Identifier: AGPL-3.0-only
extends SceneTree

var failures = []
var reports = {}
var solver

func check(condition: bool, label: String) -> void:
	if not condition:
		failures.append(label)

func near(actual: float, expected: float, absolute_tolerance: float, label: String) -> void:
	check(absf(actual-expected)<=absolute_tolerance,"%s: got %.8f; expected %.8f"%[label,actual,expected])

func _initialize() -> void:
	call_deferred("run_tests")

func simulate(model: String, params: Dictionary) -> Dictionary:
	var result = await solver.evaluate(model,params)
	check(result.solver.contains("RigidBody2D"),"Uses actual Godot rigid bodies")
	check(result.trajectory.size()>10,"Trajectory has actual integration samples")
	check(result.process.size()>=3,"Calculations explain model and limits")
	var prior_time = -1.0
	for point in result.trajectory:
		check(float(point[0])>=prior_time if params.get("scenario","")=="rollingPendulum" else float(point[0])>prior_time,"Time advances; rolling event pre/post share a timestamp")
		prior_time = float(point[0])
		for value in point:
			check(is_finite(float(value)),"All sampled physical quantities are finite")
	await process_frame
	return result

func run_tests() -> void:
	solver = load("res://apparatus_dynamics.gd").new()
	root.add_child(solver)
	await process_frame
	var original_ticks = Engine.physics_ticks_per_second
	var original_scale = Engine.time_scale

	var interaction = await simulate("force",{"scenario":"interaction","mass1":.5,"mass2":1.0,"force":.5,"duration":1.0})
	var v = interaction.values
	reports.interaction = v
	near(v.velocity1,-1.0,.005,"Equal opposite force changes first body's velocity")
	near(v.velocity2,.5,.005,"Second independent body's mass changes acceleration")
	near(v.displacement1,-.5,.004,"First body integrated displacement")
	near(v.displacement2,.25,.002,"Second body integrated displacement")
	near(v.momentum,0.0,.00001,"Internal force pair conserves total momentum")
	var no_push = await simulate("force",{"scenario":"interaction","force":0.0})
	near(no_push.values.displacement1,0.0,.000001,"Zero interaction force leaves first car still")
	near(no_push.values.displacement2,0.0,.000001,"Zero interaction force leaves second car still")

	var fall = await simulate("motion",{"scenario":"supportRemoval","height":.3,"mass":.1})
	var heavier_fall = await simulate("motion",{"scenario":"supportRemoval","height":.3,"mass":1.0})
	reports.supportRemoval = fall.values
	near(fall.values.duration,sqrt(.6/9.8),.002,"Released support produces gravitational free fall")
	near(fall.values.duration,heavier_fall.values.duration,.000001,"Ideal fall time is mass independent")
	near(fall.values.horizontalDisplacement,0.0,.000001,"Rapid ideal removal imparts no horizontal momentum")

	var rolling = await simulate("energy",{"scenario":"rollingPendulum"})
	v = rolling.values.descent
	reports.rollingPendulum = rolling.values
	near(v.constraintError,0.0,.00002,"No-slip y=r theta constraint survives actual integrations")
	near(v.velocity,rolling.values.radius*v.angularVelocity,.00002,"No-slip v=r omega constraint")
	near(v.translationEnergy+v.rotationEnergy,v.releasedPotential,.006,"Rolling descent conserves total mechanical energy")
	check(v.rotationEnergy>v.translationEnergy,"Specified high inertia stores most energy in rotation")
	var larger_axle = await simulate("energy",{"scenario":"rollingPendulum","radius":.012})
	check(larger_axle.values.descent.duration<v.duration,"Larger axle with unchanged inertia descends faster")
	var high_inertia = await simulate("energy",{"scenario":"rollingPendulum","inertia":.0004})
	check(high_inertia.values.descent.duration>v.duration,"Larger inertia with unchanged axle descends slower")

	var impact = await simulate("energy",{"scenario":"kineticImpact"})
	v = impact.values
	reports.kineticImpact = v
	near(v.collisionVelocity,.2,.00001,"Perfectly inelastic collision common speed")
	near(v.momentumBefore,v.momentumAfter,.00001,"Collision pair impulses conserve momentum")
	near(v.finalVelocity,0.0,.00001,"Friction stops impacted block without reversal")
	near(v.slideDistance,pow(v.collisionVelocity,2)/(2*v.friction*9.8),.0004,"Measured sliding distance matches friction work")
	check(v.energyLost>0,"Inelastic collision dissipates energy before friction stage")
	var faster = await simulate("energy",{"scenario":"kineticImpact","velocity":2.0})
	near(faster.values.slideDistance/v.slideDistance,4.0,.12,"Doubling impact speed approximately quadruples slide distance")
	var heavier_ball = await simulate("energy",{"scenario":"kineticImpact","mass":.1})
	check(heavier_ball.values.slideDistance>v.slideDistance,"Heavier ball drives same block farther at same initial speed")
	var previous_block_x = -1.0
	for point in impact.trajectory:
		check(point[2]>=previous_block_x-.00000001,"Block cannot reverse due to dry friction")
		previous_block_x = point[2]

	var elastic = await simulate("energy",{"scenario":"elasticReturn"})
	v = elastic.values
	reports.elasticReturn = v
	near(v.maxDisplacement,v.velocity*sqrt(v.mass/v.spring),.001,"Spring turning point follows energy exchange")
	near(v.returnTime,PI*sqrt(v.mass/v.spring),.002,"First return time follows actual spring trajectory")
	near(v.finalEnergy,v.initialEnergy,.0003,"Undamped spring exchanges energy without artificial decay")
	var stiffer = await simulate("energy",{"scenario":"elasticReturn","spring":4.0})
	check(stiffer.values.maxDisplacement<v.maxDisplacement,"Stiffer equivalent spring reduces maximum excursion")
	check(stiffer.values.returnTime<v.returnTime,"Stiffer equivalent spring returns sooner")

	var motor = await simulate("magnet",{"scenario":"motor","current":1.0})
	v = motor.values
	reports.motor = v
	var theoretical_omega = v.torque/v.damping*(1.0-exp(-v.damping*v.duration/v.inertia))
	near(v.angularVelocity,theoretical_omega,.003,"Motor rigid-body acceleration includes rotational damping")
	check(motor.rotationStates.size()>10,"Motor exposes engine rotation samples")
	near(motor.rotationStates[-1].angle,v.angle,.000001,"Motor angle field is degrees consistently")
	var reversed = await simulate("magnet",{"scenario":"motor","current":-1.0})
	near(reversed.values.angle,-v.angle,.001,"Reversing current reverses actual rotor position")
	near(reversed.values.angularVelocity,-v.angularVelocity,.00001,"Reversing current reverses actual angular velocity")
	var off = await simulate("magnet",{"scenario":"motor","current":0.0})
	near(off.values.angle,0.0,.000001,"No current leaves initially stationary motor still")
	var air = await simulate("magnet",{"scenario":"motor","core":"air"})
	check(air.values.angularVelocity<v.angularVelocity,"Weaker stipulated magnetic field reduces rotor speed")
	near(Engine.physics_ticks_per_second,original_ticks,0.0,"Solver restores global physics tick rate")
	near(Engine.time_scale,original_scale,0.0,"Solver restores global time scale")
	print(JSON.stringify({"reports":reports,"failures":failures}))
	quit(0 if failures.is_empty() else 1)
