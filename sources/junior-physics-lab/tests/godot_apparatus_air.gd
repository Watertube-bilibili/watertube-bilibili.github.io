# SPDX-License-Identifier: AGPL-3.0-only
extends SceneTree

var failures = []
var fixtures = []

func check(condition: bool, label: String) -> void:
	if not condition:
		failures.append(label)

func _initialize() -> void:
	call_deferred("run_tests")

func run_tests() -> void:
	var solver = load("res://mechanics_review.gd").new()
	root.add_child(solver)
	await process_frame
	for params in [{"scenario":"airSuspension"},{"scenario":"airSuspension","blowing":"off"},{"scenario":"airSuspension","speed":0.0},{"scenario":"airSuspension","speed":3.0},{"scenario":"airSuspension","mass":5.0},{"scenario":"airSuspension","diameter":5.0},{"scenario":"airSuspension","mass":1.0,"diameter":5.0,"speed":20.0}]:
		var result = await solver.evaluate("pressure",params)
		fixtures.append({"model":"pressure","params":params,"result":result})
		var v = result.values
		check(result.trajectory.size()>5,"Air model returns actual trajectory samples")
		check(v.height>=-.0000001 and v.height<=.2500001,"Finite axial model stops at its boundaries")
		for point in result.trajectory:
			for item in point:
				check(is_finite(float(item)),"Finite air-force integration state")
		check(result.assumptions.contains("不是倒置漏斗"),"Upward jet is explicitly distinguished from inverted-funnel experiment")
		if v.equilibriumHeight!=null:
			var wind = v.speed/pow(1.0+v.equilibriumHeight/v.flowLength,2)
			var drag = .5*v.airDensity*v.dragCoefficient*v.area*wind*wind
			check(absf(drag+v.buoyancy-v.weight)<.000001,"Theoretical equilibrium balances all vertical forces")
		await process_frame
	var standard = fixtures[0].result.values
	check(standard.height>.02,"Sufficient upward flow actually raises the ball")
	check(fixtures[1].result.values.status=="landed","Switching airflow off produces a falling trajectory")
	check(fixtures[2].result.values.status=="landed","Zero inlet speed cannot support the ball")
	check(fixtures[3].result.values.status=="landed","Weak flow is not automatically labeled suspended")
	check(fixtures[4].result.values.equilibriumHeight<standard.equilibriumHeight,"Heavier ball has lower theoretical equilibrium at the same airflow")
	check(fixtures[5].result.values.equilibriumHeight>standard.equilibriumHeight,"Larger projected area increases theoretical supporting height")
	var destination = OS.get_environment("APPARATUS_FIXTURE_PATH")
	if not destination.is_empty():
		var file = FileAccess.open(destination,FileAccess.WRITE)
		file.store_string(JSON.stringify(fixtures))
	var states = []
	for fixture in fixtures:
		states.append(fixture.result.values)
	print(JSON.stringify({"cases":fixtures.size(),"states":states,"failures":failures}))
	quit(0 if failures.is_empty() else 1)
