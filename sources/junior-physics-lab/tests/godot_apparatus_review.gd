# SPDX-License-Identifier: AGPL-3.0-only
extends SceneTree

var failures = []
var fixtures = []
var solver

func check(condition: bool, description: String) -> void:
	if not condition:
		failures.append(description)

func _initialize() -> void:
	call_deferred("run_tests")

func simulate(model: String, params: Dictionary) -> Dictionary:
	var result = await solver.evaluate(model,params)
	fixtures.append({"model":model,"params":params,"result":result})
	check(result.solver.contains("RigidBody2D"),"Results use the actual rigid-body solver")
	check(result.trajectory.size()>10,"Result has sampled engine trajectory")
	var time = -1.0
	for point in result.trajectory:
		check(point[0]>time,"Engine sample time is strictly increasing")
		time = point[0]
		for value in point:
			check(is_finite(float(value)),"Every sample is finite")
	await process_frame
	return result

func run_tests() -> void:
	solver = load("res://mechanics_review.gd").new()
	root.add_child(solver)
	await process_frame
	var none = await simulate("motion",{"scenario":"magnetDeflection","placement":"none"})
	check(absf(none.values.x-.6)<.001,"No magnet preserves uniform horizontal motion")
	check(absf(none.values.y)<.000001,"No magnet gives no lateral displacement")
	var front = await simulate("motion",{"scenario":"magnetDeflection","placement":"front"})
	check(front.values.vx>.5,"Front magnet accelerates the approaching ball")
	check(absf(front.values.y)<.000001,"Centered front field does not invent lateral motion")
	var side = await simulate("motion",{"scenario":"magnetDeflection","placement":"side"})
	check(side.values.y<-.01 and side.values.vy<-.01,"Side magnet changes actual two-dimensional trajectory")
	check(side.values.x>.1,"Side-deflected ball also retains forward motion")
	var stationary = await simulate("motion",{"scenario":"magnetDeflection","placement":"none","velocity":0.0})
	check(absf(stationary.values.x)<.000001,"Zero initial speed without magnet stays still")
	var field_extreme = await simulate("motion",{"scenario":"magnetDeflection","mass":.02,"velocity":1.0,"strength":.2,"duration":2.0,"placement":"side"})
	var max_energy_error = 0.0
	var q = field_extreme.values
	var coefficient = 1.5*sqrt(3.0)*q.strength*q.softening*q.softening
	var initial_energy = .5*q.mass*q.velocity*q.velocity-coefficient/sqrt(q.magnetX*q.magnetX+q.magnetY*q.magnetY+q.softening*q.softening)
	for point in field_extreme.trajectory:
		var distance_squared = pow(q.magnetX-float(point[1]),2)+pow(q.magnetY-float(point[2]),2)
		var energy = .5*q.mass*(float(point[3])*float(point[3])+float(point[4])*float(point[4]))-coefficient/sqrt(distance_squared+q.softening*q.softening)
		max_energy_error = maxf(max_energy_error,absf(energy-initial_energy))
	check(max_energy_error<.001,"Smooth magnetic equivalent field is mechanically self-consistent")

	var indentation = await simulate("energy",{"scenario":"indentation"})
	q = indentation.values
	var theoretical_depth = q.mass*9.8*q.height/(q.resistance-q.mass*9.8)
	check(absf(q.depth/theoretical_depth-1.0)<.025,"Penetration follows gravity and specified contact resistance")
	check(q.velocity==0.0,"Contact resistance stops the falling ball")
	check(absf(q.resistanceWork/q.gravityWork-1.0)<.025,"Contact work accounts for gravity during penetration")
	var higher = await simulate("energy",{"scenario":"indentation","height":.6})
	check(absf(higher.values.depth/q.depth-2.0)<.06,"Doubling height approximately doubles ideal constant-resistance imprint")
	var softer = await simulate("energy",{"scenario":"indentation","resistance":5.0})
	check(softer.values.depth>q.depth,"Lower material resistance creates deeper indentation")
	var tiny = await simulate("energy",{"scenario":"indentation","mass":.02,"height":.05,"resistance":30.0})
	q = tiny.values
	check(q.depth>0.0,"Tiny indentation remains positive and resolved")
	check(absf(q.resistanceWork/q.gravityWork-1.0)<.03,"Adaptive integration resolves thin shallow indentation")
	var deep = await simulate("energy",{"scenario":"indentation","mass":.2,"height":1.0,"resistance":5.0})
	q = deep.values
	check(q.depth>0.0 and absf(q.resistanceWork/q.gravityWork-1.0)<.025,"Deep penetration boundary conserves work")

	var fan = await simulate("energy",{"scenario":"solarFan"})
	q = fan.values
	check(q.angularVelocity>0.0 and q.angle>0.0,"Illuminated fan has real accumulated engine rotation")
	check(q.mechanicalEnergy<=q.electricEnergy,"Motor does not produce more mechanical energy than electrical input")
	check(q.electricEnergy<=q.inputEnergy,"Photovoltaic conversion does not create energy")
	check(absf(q.outputPower-.4)<.000001,"Input efficiency gives expected electrical power")
	var half = await simulate("energy",{"scenario":"solarFan","coverage":50.0})
	check(absf(half.values.angularVelocity/q.angularVelocity-.5)<.003,"Same load receives less torque with half exposed area")
	var shaded = await simulate("energy",{"scenario":"solarFan","coverage":0.0})
	check(shaded.values.angle==0.0 and shaded.values.angularVelocity==0.0,"Fully covered panel cannot start the fan")
	var no_conversion = await simulate("energy",{"scenario":"solarFan","efficiency":0.0})
	check(no_conversion.values.angle==0.0,"Zero photovoltaic conversion cannot start the fan")
	var powerful = await simulate("energy",{"scenario":"solarFan","power":5.0,"efficiency":40.0,"coverage":100.0})
	check(powerful.values.mechanicalEnergy<powerful.values.electricEnergy,"Maximum power stays within physical energy budget")
	var destination = OS.get_environment("APPARATUS_FIXTURE_PATH")
	if not destination.is_empty():
		var file = FileAccess.open(destination,FileAccess.WRITE)
		file.store_string(JSON.stringify(fixtures))
	print(JSON.stringify({"cases":fixtures.size(),"magnetic_energy_error":max_energy_error,"failures":failures}))
	quit(0 if failures.is_empty() else 1)
