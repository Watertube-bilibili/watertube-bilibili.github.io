# SPDX-License-Identifier: AGPL-3.0-only
extends SceneTree
func _initialize() -> void:
	var solver=load("res://optics_review.gd").new()
	var specs: Array=[
		["phy-diffuse-reflection","optics",{"scenario":"diffuse","angle":30,"roughness":15}],
		["phy-diffuse-reflection","optics",{"scenario":"diffuse","angle":60,"roughness":0}],
		["phy-plane-mirror","optics",{"scenario":"mirrorCompare","distance":30,"secondDistance":20,"eyeHeight":15}],
		["phy-plane-mirror","optics",{"scenario":"mirrorCompare","distance":30,"secondDistance":30,"eyeHeight":25,"screen":true}],
		["phy-prism-spectrum","optics",{"scenario":"prism","incidence":50,"apex":60}],
		["phy-prism-spectrum","optics",{"scenario":"prism","incidence":30,"apex":65}],
		["phy-myopia-correction","lens",{"scenario":"correctedEye","type":"myopia","eyePower":62,"objectDistance":5,"withLens":false}],
		["phy-myopia-correction","lens",{"scenario":"correctedEye","type":"myopia","eyePower":62,"objectDistance":5,"withLens":true,"correctionPower":-3.1}],
		["phy-hyperopia-correction","lens",{"scenario":"correctedEye","type":"hyperopia","eyePower":56,"objectDistance":0.25,"withLens":false}],
		["phy-hyperopia-correction","lens",{"scenario":"correctedEye","type":"hyperopia","eyePower":56,"objectDistance":0.25,"withLens":true,"correctionPower":6.94}],
		["phy-bottle-lens","lens",{"scenario":"cylinder","focal":8,"distance":4}],
		["phy-bottle-lens","lens",{"scenario":"cylinder","focal":8,"distance":12}],
		["phy-bottle-lens","lens",{"scenario":"cylinder","focal":8,"distance":8}],
		["phy-near-point","measurement",{"scenario":"nearPoint","observedDistance":15,"clarity":"clear"}],
		["phy-near-point","measurement",{"scenario":"nearPoint","observedDistance":30,"clarity":"blurred"}],
		["phy-convex-imaging","lens",{"scenario":"imagingBench","focal":10,"distance":30,"height":3,"screenDistance":25}],
		["phy-convex-imaging","lens",{"scenario":"imagingBench","focal":10,"distance":30,"height":3,"screenDistance":15}],
		["phy-convex-imaging","lens",{"scenario":"imagingBench","focal":10,"distance":5,"height":3,"screenDistance":15}],
		["phy-convex-imaging","lens",{"scenario":"imagingBench","focal":10,"distance":10,"height":3,"screenDistance":15}]]
	var fixtures: Array=[]
	for spec in specs:fixtures.append({"id":spec[0],"model":spec[1],"params":spec[2],"result":solver.solve(spec[1],spec[2])})
	var file=FileAccess.open("/tmp/lab-optics-review.json",FileAccess.WRITE)
	file.store_string(JSON.stringify(fixtures));file.close()
	print("wrote ",fixtures.size()," actual Godot optical fixtures")
	quit()
