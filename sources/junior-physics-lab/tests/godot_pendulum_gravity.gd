# SPDX-License-Identifier: AGPL-3.0-only
extends SceneTree

var failures=[]

func check(condition: bool, description: String) -> void:
	if not condition:
		failures.append(description)

func _initialize() -> void:
	call_deferred("test_gravity")

func test_gravity() -> void:
	var solver=load("res://pendulum_solver.gd").new()
	root.add_child(solver)
	await process_frame
	var earth=await solver.evaluate({"length":1.0,"mass":.2,"angle":5.0,"gravity":9.8})
	await process_frame
	var quarter=await solver.evaluate({"length":1.0,"mass":.2,"angle":5.0,"gravity":2.45})
	await process_frame
	var heavier=await solver.evaluate({"length":1.0,"mass":2.0,"angle":5.0,"gravity":2.45})
	await process_frame
	var weak_long=await solver.evaluate({"length":2.0,"mass":.2,"angle":5.0,"gravity":1.0})
	for result in [earth,quarter,heavier,weak_long]:
		check(result.values.period!=null,"Default observation records two same-direction crossings at g=%s, L=%s"%[result.values.gravity,result.values.length])
		if result.values.period!=null:
			check(abs(result.values.period/result.values.approximatePeriod-1)<.015,"Rigid-body period agrees with small-angle theory")
		check(result.trajectory.size()>10,"Period measurement comes from a sampled trajectory")
	if earth.values.period!=null and quarter.values.period!=null:
		check(abs(quarter.values.period/earth.values.period-2)<.02,"Quarter gravity doubles the measured period")
	if heavier.values.period!=null and quarter.values.period!=null:
		check(abs(heavier.values.period/quarter.values.period-1)<.005,"Mass changes do not change the measured period")
	check(abs(quarter.values.initialEnergy/earth.values.initialEnergy-.25)<.00001,"Potential energy uses selected gravity")
	check(abs(quarter.values.approximatePeriod/earth.values.approximatePeriod-2)<.00001,"Displayed theoretical period uses selected gravity")
	check(quarter.process[2].text.contains("g=2.4500"),"Worked calculation substitutes selected gravity")
	var gravity_reading=false
	for reading in quarter.readings:
		if reading.label=="重力场强度":
			gravity_reading=reading.value==2.45 and reading.unit=="N/kg"
	check(gravity_reading,"Readings show the selected gravity with a unit")
	print(JSON.stringify({"earth_period":earth.values.period,"quarter_gravity_period":quarter.values.period,"heavier_period":heavier.values.period,"weak_gravity_long_pendulum_period":weak_long.values.period,"failures":failures}))
	quit(0 if failures.is_empty() else 1)
