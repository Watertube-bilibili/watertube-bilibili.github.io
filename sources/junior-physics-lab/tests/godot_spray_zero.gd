# SPDX-License-Identifier: AGPL-3.0-only
extends SceneTree
func _initialize():
	var solver=load("res://solvers.gd").new()
	root.add_child(solver)
	var cases=[]
	for speed in [0.0,5.0]:
		var p={"scenario":"flow","speed":speed,"density":1.2,"variant":"straw-spray"}
		var result=solver.solve("pressure",p)
		if speed==0 and (result.values.speed!=0 or result.values.pressureDrop!=0):
			push_error("Zero airflow must have no dynamic pressure difference")
			quit(1)
			return
		cases.append({"params":p,"result":result})
	FileAccess.open("/tmp/spray-zero-cases.json",FileAccess.WRITE).store_string(JSON.stringify(cases))
	print("2 actual Godot spray states exported")
	quit(0)
