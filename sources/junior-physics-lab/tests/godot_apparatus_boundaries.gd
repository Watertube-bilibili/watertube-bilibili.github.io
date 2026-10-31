# SPDX-License-Identifier: AGPL-3.0-only
extends SceneTree

var failures = []
var fixtures = []
var cases = [
	["force",{"scenario":"interaction","mass1":.1,"mass2":2.0,"force":2.0,"duration":2.0}],
	["motion",{"scenario":"supportRemoval","mass":.02,"height":.05}],
	["motion",{"scenario":"supportRemoval","mass":1.0,"height":1.0}],
	["energy",{"scenario":"rollingPendulum","mass":.1,"radius":.003,"inertia":.001,"height":1.0}],
	["energy",{"scenario":"rollingPendulum","mass":1.0,"radius":.015,"inertia":.00002,"height":.1}],
	["energy",{"scenario":"kineticImpact","mass":.02,"blockMass":1.0,"velocity":.2,"friction":.6}],
	["energy",{"scenario":"kineticImpact","mass":.2,"blockMass":.05,"velocity":2.0,"friction":.1}],
	["energy",{"scenario":"elasticReturn","mass":1.0,"spring":.2,"velocity":1.0}],
	["energy",{"scenario":"elasticReturn","mass":.1,"spring":4.0,"velocity":.1}],
	["magnet",{"scenario":"motor","current":2.0,"turns":200,"core":"iron"}],
	["magnet",{"scenario":"motor","current":-2.0,"turns":20,"core":"air"}]
]

func check(condition: bool, label: String) -> void:
	if not condition:
		failures.append(label)

func _initialize() -> void:
	call_deferred("run_tests")

func run_tests() -> void:
	var solver = load("res://apparatus_dynamics.gd").new()
	root.add_child(solver)
	await process_frame
	for item in cases:
		var result = await solver.evaluate(item[0],item[1])
		var v = result.values
		fixtures.append({"model":item[0],"params":item[1],"result":result})
		for point in result.trajectory:
			for value in point:
				check(is_finite(float(value)),"Finite boundary state for "+v.scenario)
		match v.scenario:
			"interaction":
				check(absf(v.momentum)<.0002,"Momentum cancellation for unequal boundary masses")
			"supportRemoval":
				check(absf(v.distance-v.height)<.000001,"Exact receiving plane endpoint")
				check(absf(v.duration/sqrt(2.0*v.height/9.8)-1.0)<.012,"Boundary free-fall time")
			"rollingPendulum":
				check(absf(v.constraintError)<.0002,"Boundary no-slip position constraint")
				check(absf((v.rotationEnergy+v.translationEnergy)/v.releasedPotential-1.0)<.015,"Boundary rolling energy accounting")
			"kineticImpact":
				var theoretical_distance = v.collisionVelocity*v.collisionVelocity/(2.0*v.friction*9.8)
				check(v.slideDistance>0.0,"Tiny collision still produces measurable positive displacement")
				check(absf(v.slideDistance/theoretical_distance-1.0)<.045,"Adaptive integration resolves short stopping distance")
				check(absf(v.momentumBefore-v.momentumAfter)<.00002,"Boundary collision conserves momentum")
			"elasticReturn":
				check(absf(v.finalEnergy/v.initialEnergy-1.0)<.004,"Boundary spring energy")
				check(absf(v.returnTime/(PI*sqrt(v.mass/v.spring))-1.0)<.003,"Boundary spring return time")
			"motor":
				check(signf(v.angle)==signf(v.current),"Boundary motor responds with correct rotation direction")
		await process_frame
	var fixture_path = OS.get_environment("APPARATUS_FIXTURE_PATH")
	if not fixture_path.is_empty():
		var file = FileAccess.open(fixture_path,FileAccess.WRITE)
		file.store_string(JSON.stringify(fixtures))
	print(JSON.stringify({"cases":cases.size(),"failures":failures}))
	quit(0 if failures.is_empty() else 1)
