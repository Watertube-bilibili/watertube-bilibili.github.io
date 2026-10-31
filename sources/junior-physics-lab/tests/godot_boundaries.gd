extends SceneTree
var failures=[]
var checks=0
func finite_tree(value,path):
	if value is float and not is_finite(value):failures.append(path+" is non-finite")
	elif value is Dictionary:
		for key in value:finite_tree(value[key],path+"."+str(key))
	elif value is Array:
		for i in range(value.size()):finite_tree(value[i],path+"["+str(i)+"]")
func _initialize():
	var solvers=load("res://solvers.gd").new()
	root.add_child(solvers)
	var schema=JSON.parse_string(FileAccess.get_file_as_string("res://model-schema.json"))
	for name in schema.models:
		if name in ["incline","motion"]:continue
		var model=schema.models[name]
		for scenario in model.scenarios:
			if name=="energy" and scenario=="pendulum":continue # Real joint solver is covered in godot_extra.gd.
			for mode in ["default","min","max"]:
				var params={"scenario":scenario}
				for control in model.controls+model.get("extraControls",[]):
					params[control.key]=control.get(mode,control.value)
				var output=solvers.solve(name,params)
				checks+=1
				if output.has("error"):failures.append(name+"/"+scenario+":"+output.error)
				finite_tree(output,name+"/"+scenario+"/"+mode)
	print(JSON.stringify({"scenarioBoundaryChecks":checks,"failures":failures}))
	quit(0 if failures.is_empty() else 1)
