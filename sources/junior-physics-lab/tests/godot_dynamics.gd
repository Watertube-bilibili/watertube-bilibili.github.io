extends SceneTree

var failed=[]
func verify(value,expected,tolerance,name):
	if abs(value-expected)>tolerance:failed.append({"name":name,"actual":value,"expected":expected})
func _initialize():
	call_deferred("test_all")
func test_all():
	var solver=load("res://dynamic_solver.gd").new()
	root.add_child(solver)
	await process_frame
	var r=await solver.evaluate("incline",{"length":1,"angle":12,"mass":200})
	print("incline ",r.values)
	verify(r.values.total,sqrt(2/(9.8*sin(deg_to_rad(12)))),.003,"incline time")
	var r2=await solver.evaluate("incline",{"length":1,"angle":12,"mass":500})
	verify(r2.values.total,r.values.total,.00001,"mass independence")
	r=await solver.evaluate("motion",{"scenario":"uniform","mass":1,"velocity":2,"duration":2})
	print("uniform ",r.values)
	verify(r.values.distance,4,.02,"uniform distance")
	r=await solver.evaluate("motion",{"scenario":"force","mass":1,"force":2,"friction":0,"velocity":0,"duration":2})
	print("force ",r.values)
	verify(r.values.distance,4,.025,"accelerated distance")
	r=await solver.evaluate("motion",{"scenario":"friction","mass":1,"force":0,"friction":.2,"velocity":2,"duration":3})
	print("friction ",r.values)
	verify(r.values.velocity,0,.001,"friction stops")
	verify(r.values.distance,4/(2*.2*9.8),.015,"friction distance")
	r=await solver.evaluate("motion",{"scenario":"freefall","mass":1,"duration":1})
	print("freefall ",r.values)
	verify(r.values.distance,4.9,.035,"freefall distance")
	print(JSON.stringify({"failed":failed}))
	quit(0 if failed.is_empty() else 1)
