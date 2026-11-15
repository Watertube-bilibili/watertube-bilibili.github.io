# SPDX-License-Identifier: AGPL-3.0-only
extends SceneTree
var failures: Array = []
var checks = 0
func verify(ok: bool, message: String) -> void:
	checks += 1
	if not ok: failures.append(message)
func near(actual: float, expected: float, tolerance: float, message: String) -> void:
	verify(absf(actual-expected) <= tolerance, message+": "+str(actual)+" expected "+str(expected))
func _initialize() -> void:
	var solver = load("res://solvers.gd").new()
	var strip = load("res://blow_strip_solver.gd").new()
	var examples: Array = []
	# Use the public routing contract, not a duplicate browser-side formula.
	for density in [0.0, 0.5, 1.2, 2.0]:
		var previous_y = -INF
		for i in range(101):
			var speed = i/10.0
			var r = solver.solve("pressure", {"scenario":"flow", "variant":"blow-strip", "speed":speed, "density":density})
			verify(not r.has("error"), "equilibrium converges across full control sweep")
			if r.has("error"):continue
			var v = r.values
			near(v.dynamicPressure, 0.5*density*speed*speed, 1.0e-10, "dynamic pressure quadratic in speed and linear in density")
			near(v.pressureDrop, v.pressureCoefficient*v.dynamicPressure, 1.0e-10, "dynamic pressure distinguished from estimated pressure difference")
			near(v.liftForce, v.pressureDrop*v.width*v.length, 1.0e-12, "pressure integrated over strip area")
			near(v.netLoadPerLength*v.length, v.liftForce-v.weight, 1.0e-12, "upward load minus gravity")
			verify(v.tipY >= previous_y-1.0e-10, "tip rises monotonically with airflow")
			if i>0:verify(v.tipY-previous_y < 0.015, "bounded response between adjacent control values")
			previous_y = v.tipY
			verify(v.converged and v.residualTorque < 1.0e-10, "small torque residual at elastic equilibrium")
			var arc = 0.0
			for j in range(1, r.stripPoints.size()):
				var a = r.stripPoints[j-1];var b = r.stripPoints[j]
				verify(is_finite(b[0]) and is_finite(b[1]), "finite strip coordinates")
				verify(b[0] > a[0], "non-folded load-facing branch")
				arc += Vector2(b[0]-a[0],b[1]-a[1]).length()
			near(arc, v.length, 1.0e-7, "inextensible paper keeps arc length at large deflection")
			if speed==0 or density==0:
				near(v.liftForce, 0, 0, "zero speed/density gives no lift")
				near(v.tipRise, 0, 1.0e-12, "no airflow equals self-weight reference")
				verify(v.tipY<0 and r.stripPoints==r.restStripPoints, "rest shape sags and matches actual current shape")
			if density==1.2 and i in [0,20,40,60,80,100]:
				examples.append({"speed":speed,"density":density,"tipY":v.tipY,"tipRise":v.tipRise,"pressureDrop":v.pressureDrop})
	var prior = -INF
	for i in range(21):
		var r = strip.solve({"speed":6,"density":i/10.0})
		verify(r.values.tipY>=prior-1.0e-10, "density increases equilibrium elevation at fixed speed")
		prior=r.values.tipY
	for speed in [0.0,2.0,4.0,5.6,6.0,8.0,9.9999]:
		for density in [0.5,1.2,2.0]:
			var left=strip.solve({"speed":speed,"density":density})
			var right=strip.solve({"speed":speed+0.0001,"density":density})
			verify(absf(right.values.tipY-left.values.tipY)<0.00002,"local continuity for tiny speed change including near load balance")
	var routed=solver.solve("pressure",{"scenario":"blowStrip","speed":6,"density":1.2})
	near(routed.values.tipY,strip.solve({"speed":6,"density":1.2}).values.tipY,1.0e-12,"dedicated scenario uses same scientific solver")
	var a=strip.solve({"speed":4,"density":2})
	var b=strip.solve({"speed":8,"density":0.5})
	near(a.values.tipY,b.values.tipY,1.0e-12,"equal rho*v^2 gives identical load and shape")
	near(strip.solve({"speed":0.000001}).values.tipRise,0,1.0e-12,"continuous at zero airflow")
	# Independent beam limit: y_tip = w L^4/(8 EI) for tiny uniform load.
	var tiny = 1.0e-8
	var expected = tiny*pow(strip.LENGTH,4)/(8*strip.EI)
	near(strip.shape(tiny).tipY,expected,expected*0.001,"small-load Euler-Bernoulli limit within 0.1 percent")
	near(strip.shape(-tiny).tipY,-strip.shape(tiny).tipY,1.0e-12,"load reversal symmetry")
	var flat=strip.shape(0)
	near(flat.tipY,0,0,"balanced distributed load makes straight strip")
	near(flat.tipX,strip.LENGTH,1.0e-12,"balanced strip full horizontal length")
	for load in [-strip.WEIGHT_PER_LENGTH,0.02648,0.10148]:
		var coarse=strip.shape(load,24);var medium=strip.shape(load,48);var fine=strip.shape(load,96)
		verify(coarse.converged and medium.converged and fine.converged,"all refinement grids converge")
		verify(absf(medium.tipY-fine.tipY)<absf(coarse.tipY-fine.tipY),"grid refinement approaches common equilibrium")
		near(medium.tipY,fine.tipY,0.0001,"48/96 segment displacement difference below 0.1 mm")
	for item in [["speed",-1,0],["speed",1.0e308,10],["density",-5,0],["density",1000,2]]:
		var r=strip.solve({item[0]:item[1]})
		near(r.values[item[0]],item[2],0,"parameter boundary clamped")
	for key in ["speed","density"]:
		for bad in [NAN, INF, -INF, "nonsense", null, true]:
			var r=strip.solve({key:bad})
			near(r.values[key],2.0 if key=="speed" else 1.2,0,"invalid and nonfinite input safely defaults")
	var generic=solver.solve("pressure",{"scenario":"flow","variant":"straw-spray","speed":4,"density":1.2})
	near(generic.values.pressureDrop,9.6,1.0e-10,"other flow scenarios preserve existing solver")
	verify(not generic.has("stripPoints"),"strip dispatch isolated from other experiments")
	var report={"checks":checks,"failures":failures,"examples":examples,"scope":"Godot 4.6.3 model tests; no physical apparatus validation."}
	var output=OS.get_environment("BLOW_STRIP_SCIENCE_REPORT")
	if output.is_empty():output="/tmp/blow-strip-science.json"
	var file=FileAccess.open(output,FileAccess.WRITE);file.store_string(JSON.stringify(report,"  ")+"\n");file.close()
	print(JSON.stringify(report))
	solver.free()
	quit(0 if failures.is_empty() else 1)
