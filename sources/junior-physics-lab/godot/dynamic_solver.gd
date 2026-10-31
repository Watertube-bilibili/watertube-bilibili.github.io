extends Node

signal finished(result: Dictionary)
const DynamicBody = preload("res://dynamic_body.gd")
var body: RigidBody2D
var wall: StaticBody2D
var active = false
var model_name = "motion"
var parameters = {}
var trajectory = []
var elapsed = 0.0
var prior_distance = 0.0
var prior_time = 0.0
var first_time = null
var target_distance = 0.0
var duration = 2.0
var stop_on_distance = false
var result_pending = {}
var steps = 0
var path_length = 0.0
var saved_ticks = 480
var saved_steps = 32
var saved_scale = 1.0

func evaluate(model: String, p: Dictionary) -> Dictionary:
	model_name=model
	parameters=p.duplicate()
	trajectory=[]
	prior_distance=0.0
	prior_time=0.0
	first_time=null
	steps=0
	path_length=0.0
	duration=clampf(float(p.get("duration",2)),.1,10)
	stop_on_distance=model=="incline"
	target_distance=clampf(float(p.get("length",1)),.05,20)
	body=DynamicBody.new()
	add_child(body)
	body.sampled.connect(_sample)
	var mass=maxf(float(p.get("mass",1)),.0001)
	var force=float(p.get("force",2))
	var friction=clampf(float(p.get("friction",.1)),0,2)
	var velocity=float(p.get("velocity",1))
	var scenario=str(p.get("scenario","force"))
	var axis=Vector2.RIGHT
	var normal=mass*9.8
	if model=="incline":
		mass/=1000
		var angle=deg_to_rad(clampf(float(p.get("angle",12)),.1,85))
		axis=Vector2(-cos(angle),sin(angle))
		force=mass*9.8*sin(angle)
		friction=0.0
		velocity=0.0
		normal=mass*9.8*cos(angle)
		duration=15.0
	elif scenario in ["uniform","inertia","collision"]:
		force=0.0
		friction=0.0
	elif scenario=="friction":
		force=friction*mass*9.8*(1 if velocity>=0 else -1) if bool(p.get("uniformPull",false)) else 0.0
	elif scenario=="freefall":
		axis=Vector2.DOWN
		force=mass*9.8
		friction=0.0
		velocity=0.0
	if scenario=="collision" and model!="incline":
		var wall_distance=maxf(float(p.get("distance",1)),.1)
		wall=StaticBody2D.new()
		var wall_shape=CollisionShape2D.new()
		var rectangle=RectangleShape2D.new()
		rectangle.size=Vector2(20,200)
		wall_shape.shape=rectangle
		wall.add_child(wall_shape)
		wall.position=Vector2(wall_distance*1000+20,0)
		add_child(wall)
		var material=PhysicsMaterial.new()
		material.friction=0.0
		material.bounce=clampf(float(p.get("elasticity",.5)),0,1)
		body.physics_material_override=material
	else:
		body.collision_layer=0
		body.collision_mask=0
	# Advance the real solver quickly while preserving dt=1/480 simulation second.
	# More fixed ticks per wall-clock second compensate for the temporary time scale.
	saved_ticks=Engine.physics_ticks_per_second
	saved_steps=Engine.max_physics_steps_per_frame
	saved_scale=Engine.time_scale
	Engine.physics_ticks_per_second=7680
	Engine.max_physics_steps_per_frame=256
	Engine.time_scale=16.0
	active=true
	body.begin({"mass":mass,"axis":axis,"velocity":velocity,"force":force,"friction":friction,"normal":normal})
	var output=await finished
	return output

func interpolate_crossing(target: float, distance: float, time: float) -> float:
	return lerpf(prior_time,time,clampf((target-prior_distance)/maxf(distance-prior_distance,.000000001),0,1))

func _sample(time: float, distance: float, velocity: float) -> void:
	if not active:return
	steps+=1
	path_length+=abs(distance-prior_distance)
	if first_time==null and stop_on_distance and distance>=target_distance/2:
		first_time=interpolate_crossing(target_distance/2,distance,time)
	var done=distance>=target_distance if stop_on_distance else time>=duration
	if steps%8==0 or steps==1 or done:
		trajectory.append([time,distance,velocity])
	if done or time>=15:
		active=false
		body.active=false
		body.set_deferred("freeze",true)
		var total=interpolate_crossing(target_distance,distance,time) if stop_on_distance and distance>=target_distance else time
		var traveled=target_distance if stop_on_distance and distance>=target_distance else distance
		if trajectory.size()>0:trajectory[-1]=[total,traveled,velocity]
		if stop_on_distance and distance>=target_distance:path_length=target_distance
		var second=total-first_time if first_time!=null else null
		var values={"length":target_distance,"angle":parameters.get("angle",12),"mass":parameters.get("mass",1),"duration":total,"distance":traveled,"first":first_time,"second":second,"total":total,"speed":path_length/total if total>0 else 0,"averageVelocity":traveled/total if total>0 else 0,"pathLength":path_length,"velocity":velocity,"scenario":parameters.get("scenario","speed" if model_name=="incline" else "force")}
		var points=[]
		for point in trajectory:points.append([point[0],point[1]])
		result_pending={"model":model_name,"values":values,"trajectory":trajectory.duplicate(),"solver":"Godot RigidBody2D","graph":{"xLabel":"时间 / s","yLabel":"沿运动轴的位置 / m","points":points}}
		add_learning_results(result_pending)
	prior_distance=distance
	prior_time=time

func add_learning_results(output: Dictionary) -> void:
	var v=output.values
	var t=float(v.total)
	var s=float(v.pathLength)
	var speed=s/t
	output.assumptions="运动由 Godot 刚体按固定步长积分。斜面忽略阻力；碰撞与摩擦的参数在各实验中说明。图像横轴为模型经过时间，结果末步取近似值。"
	output.readings=[{"label":"运动时间","value":t,"unit":"s"},{"label":"路程","value":s,"unit":"m"},{"label":"平均速度（路程/时间）","value":speed,"unit":"m/s","derived":true}]
	output.process=[
		{"title":"明确研究过程","text":"研究从开始运动到记录结束的整个过程。路程 s ≈ %.4f m，总时间 t ≈ %.4f s。"%[s,t]},
		{"title":"写出公式并统一单位","text":"按初中课本的平均速度定义，v = s/t。路程用米，时间用秒，计算结果的单位为米每秒。"},
		{"title":"代入并计算","text":"v = s/t ≈ %.4f m ÷ %.4f s ≈ %.4f m/s。中间过程保留精度，末步取近似值。"%[s,t,speed]},
		{"title":"作答与检查","text":"本段运动的平均速度约为 %.4f m/s。若发生往返，应累计各段路程，不能用终点与起点的距离替代。"%speed}]
	output.conclusion="合力会改变运动状态；合力为零时，物体保持静止或匀速直线运动。比较不同实验时应控制其他条件相同。"
	if model_name=="incline" and v.first!=null and v.second!=null and float(v.second)>0:
		var half=s/2
		var t1=float(v.first)
		var t2=float(v.second)
		var v1=half/t1
		var v2=half/t2
		output.readings=[{"label":"全程路程","value":s,"unit":"m"},{"label":"全程时间","value":t,"unit":"s"},{"label":"全程平均速度","value":speed,"unit":"m/s","derived":true},{"label":"前半程时间","value":t1,"unit":"s"},{"label":"后半程时间","value":t2,"unit":"s"}]
		output.table={"derivedColumns":[3],"headers":["路段","路程 / m","时间 / s","平均速度 / (m/s)"],"rows":[["全程",s,t,speed],["前半程",half,t1,v1],["后半程",half,t2,v2]]}
		output.process=[
			{"title":"记录对应的路程与时间","text":"全程 s = %.4f m，t ≈ %.4f s；前半程路程 s₁ = s/2 = %.4f m，时间 t₁ ≈ %.4f s。"%[s,t,half,t1]},
			{"title":"求后半程的路程与时间","text":"s₂ = s − s₁ = %.4f m；t₂ = t − t₁ ≈ %.4f s − %.4f s ≈ %.4f s。后半程不能从中点另行静止释放来代替。"%[half,t,t1,t2]},
			{"title":"计算全程平均速度","text":"v = s/t ≈ %.4f m ÷ %.4f s ≈ %.4f m/s。"%[s,t,speed]},
			{"title":"分别计算两段平均速度","text":"v₁ = s₁/t₁ ≈ %.4f m ÷ %.4f s ≈ %.4f m/s；v₂ = s₂/t₂ ≈ %.4f m ÷ %.4f s ≈ %.4f m/s。"%[half,t1,v1,half,t2,v2]},
			{"title":"比较并得出结论","text":"v₂ > v > v₁，说明小车在斜面上下滑时速度增大。全程平均速度按总路程除以总时间计算，不能直接取两段速度的算术平均值。"}]
		output.conclusion="小车做加速运动，后半程平均速度大于前半程。理想无阻力斜面中，保持坡度和路程相同，改变小车质量不改变下滑时间。"
		output.graph.yLabel="路程 / m"

func _process(_delta: float) -> void:
	if not result_pending.is_empty():
		Engine.time_scale=saved_scale
		Engine.physics_ticks_per_second=saved_ticks
		Engine.max_physics_steps_per_frame=saved_steps
		var output=result_pending
		result_pending={}
		if is_instance_valid(body):body.queue_free()
		if is_instance_valid(wall):wall.queue_free()
		finished.emit(output)
