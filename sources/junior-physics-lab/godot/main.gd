extends Node

const CartScript = preload("res://cart.gd")
const ScientificSolvers = preload("res://solvers.gd")
const DynamicsSolver = preload("res://dynamic_solver.gd")
const PendulumSolver = preload("res://pendulum_solver.gd")
const ApparatusDynamics = preload("res://apparatus_dynamics.gd")
const MechanicsReview = preload("res://mechanics_review.gd")
var scientific_solver: Node
var dynamics_solver: Node
var pendulum_solver: Node
var apparatus_solver: Node
var mechanics_review: Node
var evaluate_callback: JavaScriptObject
var cart: RigidBody2D
var js_window: JavaScriptObject
var start_callback: JavaScriptObject
var reset_callback: JavaScriptObject
var length_m := 1.0
var experiment_id := 0
var previous_distance := 0.0
var previous_time := 0.0
var first_time = null
var run_active := false
var pending_sample := {}
var has_sample := false

func _ready() -> void:
	scientific_solver = ScientificSolvers.new()
	dynamics_solver = DynamicsSolver.new()
	pendulum_solver = PendulumSolver.new()
	apparatus_solver = ApparatusDynamics.new()
	mechanics_review = MechanicsReview.new()
	add_child(scientific_solver)
	add_child(dynamics_solver)
	add_child(pendulum_solver)
	add_child(apparatus_solver)
	add_child(mechanics_review)
	cart = CartScript.new()
	add_child(cart)
	cart.measured.connect(_on_measured)
	if OS.has_feature("web"):
		js_window = JavaScriptBridge.get_interface("window")
		start_callback = JavaScriptBridge.create_callback(_on_start)
		reset_callback = JavaScriptBridge.create_callback(_on_reset)
		evaluate_callback = JavaScriptBridge.create_callback(_on_evaluate)
		js_window.__registerGodotLab(start_callback, reset_callback, evaluate_callback)

func _on_start(args: Array) -> void:
	var data = JSON.parse_string(str(args[0]))
	if not data is Dictionary:
		return
	experiment_id = int(data.get("id", 0))
	length_m = clampf(float(data.get("length", 1.0)), 0.5, 2.0)
	var angle := clampf(float(data.get("angle", 12.0)), 3.0, 30.0)
	var mass_g := clampf(float(data.get("mass", 200.0)), 100.0, 500.0)
	previous_distance = 0.0
	previous_time = 0.0
	first_time = null
	run_active = true
	pending_sample = {"id": experiment_id, "distance": 0.0, "time": 0.0, "first": null, "second": null, "total": null, "done": false}
	has_sample = true
	cart.release(length_m, angle, mass_g)

func _on_reset(_args: Array) -> void:
	run_active = false
	cart.stop()
	pending_sample = {}
	has_sample = false

func crossing_time(target: float, distance: float, time: float) -> float:
	var fraction := clampf((target - previous_distance) / maxf(distance - previous_distance, 0.0000001), 0.0, 1.0)
	return lerpf(previous_time, time, fraction)

func _on_measured(distance: float, time: float) -> void:
	if not run_active:
		return
	if first_time == null and distance >= length_m / 2.0:
		first_time = crossing_time(length_m / 2.0, distance, time)
	var done := distance >= length_m
	var total = null
	var second = null
	if done:
		total = crossing_time(length_m, distance, time)
		second = total - first_time
		run_active = false
		cart.active = false
		cart.set_deferred("freeze", true)
	pending_sample = {"id": experiment_id, "distance": minf(distance, length_m), "time": total if done else time, "first": first_time, "second": second, "total": total, "done": done}
	has_sample = true
	previous_distance = distance
	previous_time = time

func _process(_delta: float) -> void:
	if has_sample and js_window != null:
		js_window.__godotLabSample(JSON.stringify(pending_sample))
		has_sample = false

func _on_evaluate(args: Array) -> void:
	var request = JSON.parse_string(str(args[0]))
	if not request is Dictionary: return
	var model = str(request.get("model", ""))
	var params = request.get("params", {})
	var output = {}
	var scenario = str(params.get("scenario",""))
	if (model=="motion" and scenario=="magnetDeflection") or (model=="energy" and scenario in ["solarFan","indentation"]) or (model=="pressure" and scenario=="airSuspension"):
		_on_reset([])
		output = await mechanics_review.evaluate(model,params)
	elif (model=="force" and scenario=="interaction") or (model=="motion" and scenario=="supportRemoval") or (model=="energy" and scenario in ["rollingPendulum","kineticImpact","elasticReturn"]) or (model=="magnet" and scenario=="motor"):
		_on_reset([])
		output = await apparatus_solver.evaluate(model,params)
	elif model in ["incline", "motion"]:
		_on_reset([])
		output = await dynamics_solver.evaluate(model, params)
	elif model=="energy" and str(params.get("scenario",""))=="pendulum":
		_on_reset([])
		output = await pendulum_solver.evaluate(params)
	else:
		output = scientific_solver.solve(model, params)
	js_window.__godotLabEvaluation(JSON.stringify({"id":request.get("id"),"result":output}))
