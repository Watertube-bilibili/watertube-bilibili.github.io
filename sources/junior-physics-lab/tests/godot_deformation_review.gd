# SPDX-License-Identifier: AGPL-3.0-only
extends SceneTree

var failures = []
var fixtures = []

func check(condition: bool, label: String) -> void:
	if not condition:
		failures.append(label)

func _initialize() -> void:
	var solver = load("res://deformation_review.gd").new()
	for material in ["spring","clay"]:
		for peak_force in [0.0,1.0,2.0,2.5,4.0,8.0]:
			var loaded = solver.solve({"material":material,"stage":"loaded","force":peak_force})
			var unloaded = solver.solve({"material":material,"stage":"unloaded","force":peak_force})
			for result in [loaded,unloaded]:
				var v = result.values
				fixtures.append({"params":{"scenario":"deformation","material":material,"stage":v.stage,"force":peak_force},"result":result})
				check(is_finite(v.height) and v.height>0.0,"Every supported specimen retains finite positive height")
				check(absf(v.deformation-v.elasticDeformation-v.plasticDeformation)<.000000001,"Total deformation equals elastic plus plastic components")
				check(result.assumptions.contains("全新试样") and result.assumptions.contains("不累计"),"Peak force defines a fresh monotonic loading history")
				if material=="clay":
					check(absf(v.widthRatio*v.widthRatio*v.height-.05)<.000000001,"Two transverse expansions conserve stipulated volume")
				else:
					check(v.widthRatio==1.0 and v.plasticDeformation==0.0,"Ideal spring has no plastic residue or transverse expansion")
			check(loaded.values.force==peak_force,"Loaded force equals the stipulated peak")
			check(unloaded.values.force==0.0,"Full unloading has zero current external force")
			check(unloaded.values.elasticDeformation==0.0,"Elastic component fully recovers on unloading")
			if peak_force==0.0:
				check(loaded.values.height==.05 and unloaded.values.height==.05,"A zero-load fresh specimen has no deformation in either stage")
			if material=="spring":
				check(absf(loaded.values.height-(.05+peak_force/500.0))<.000000001,"Spring extension follows Godot Hooke law")
				check(unloaded.values.height==.05,"All supported spring loads recover original length")
			elif peak_force<=2.0:
				check(unloaded.values.height==.05,"Sub-yield soft material fully recovers")
			else:
				check(unloaded.values.height<.05 and unloaded.values.plasticDeformation>0.0,"Above-yield material retains deformation with zero current force")
				check(unloaded.values.height>loaded.values.height,"Plastic specimen still recovers its elastic compression")
	# Changing the hypothetical peak restarts a fresh test; no invisible mutable
	# history carries a previous 8 N plastic strain into a new 1 N comparison.
	solver.solve({"material":"clay","stage":"loaded","force":8.0})
	var restarted = solver.solve({"material":"clay","stage":"unloaded","force":1.0})
	check(restarted.values.height==.05,"Changing peak force selects a new declared loading history")
	var destination = OS.get_environment("DEFORMATION_FIXTURE_PATH")
	if not destination.is_empty():
		var file = FileAccess.open(destination,FileAccess.WRITE)
		file.store_string(JSON.stringify(fixtures))
	print(JSON.stringify({"cases":fixtures.size(),"failures":failures}))
	quit(0 if failures.is_empty() else 1)
