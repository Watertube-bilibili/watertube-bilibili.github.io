# SPDX-License-Identifier: AGPL-3.0-only
extends Node

signal finished(result: Dictionary)
const Body = preload("res://mechanics_review_body.gd")
var body: RigidBody2D
var model_name = ""
var parameters = {}
var trajectory = []
var active = false
var result_pending = {}
var duration = 1.0
var physical_step = 1.0/960.0
var sample_stride = 4
var count = 0
var last_point = []
var angle = 0.0
var prior_wrapped_angle = 0.0
var load_work = 0.0
var prior_load_power = 0.0
var previous_time = 0.0
var saved_ticks = 480
var saved_steps = 32
var saved_scale = 1.0
var contact_velocity = 0.0
var contact_time = -1.0

func evaluate(model: String, supplied: Dictionary) -> Dictionary:
	model_name = model
	parameters = supplied.duplicate()
	trajectory = []
	count = 0
	last_point = []
	angle = 0.0
	prior_wrapped_angle = 0.0
	load_work = 0.0
	prior_load_power = 0.0
	previous_time = 0.0
	contact_time = -1.0
	contact_velocity = 0.0
	physical_step = 1.0/960.0
	if not _configure():
		return {"error":"未支持的装置动力学实验。"}
	body = Body.new()
	add_child(body)
	body.sampled.connect(_sample)
	saved_ticks = Engine.physics_ticks_per_second
	saved_steps = Engine.max_physics_steps_per_frame
	saved_scale = Engine.time_scale
	Engine.physics_ticks_per_second = ceili(16.0/physical_step)
	Engine.max_physics_steps_per_frame = 512
	Engine.time_scale = 16.0
	physical_step = 16.0/Engine.physics_ticks_per_second
	sample_stride = maxi(1,roundi(1.0/(240.0*physical_step)))
	active = true
	body.begin(parameters)
	return await finished

func _number(key: String, fallback: float, low: float, high: float) -> float:
	var value = clampf(float(parameters.get(key,fallback)),low,high)
	parameters[key] = value
	return value

func _configure() -> bool:
	match str(parameters.get("scenario","")):
		"magnetDeflection":
			_number("mass",.05,.02,.2)
			_number("velocity",.5,0.0,1.0)
			_number("strength",.04,0.0,.2)
			duration = _number("duration",1.2,.2,2.0)
			var placement = str(parameters.get("placement","side"))
			if placement not in ["none","front","side"]:
				placement = "side"
			parameters.merge({"placement":placement,"magnetX":1.0 if placement=="front" else .5,"magnetY":0.0 if placement=="front" else -.35,"softening":.25},true)
		"indentation":
			var mass = _number("mass",.05,.02,.2)
			var height = _number("height",.3,.05,1.0)
			var resistance = _number("resistance",10.0,5.0,30.0)
			var fall_time = sqrt(2.0*height/9.8)
			var stopping_time = sqrt(2.0*9.8*height)/(resistance/mass-9.8)
			physical_step = minf(physical_step,stopping_time/128.0)
			duration = fall_time+stopping_time+.1
		"solarFan":
			var power = _number("power",2.0,0.0,5.0)
			var efficiency = _number("efficiency",20.0,0.0,40.0)
			var coverage = _number("coverage",100.0,0.0,100.0)
			var incident = power*coverage/100.0
			var electric = incident*efficiency/100.0
			var voltage = 3.0
			var current = electric/voltage
			parameters.merge({"inputPower":incident,"outputPower":electric,"voltage":voltage,"current":current,"torqueConstant":.01,"torque":.01*current,"inertia":.0002,"damping":.0005},true)
			duration = 3.0
		"airSuspension":
			var mass_g = _number("mass",2.7,1.0,5.0)
			var diameter_cm = _number("diameter",4.0,3.0,5.0)
			var speed = _number("speed",14.0,0.0,20.0)
			var blowing = "on" if str(parameters.get("blowing","on"))=="on" else "off"
			var mass_kg = mass_g/1000.0
			var radius = diameter_cm/200.0
			var area = PI*radius*radius
			var buoyancy = 1.2*(4.0/3.0)*PI*pow(radius,3)*9.8
			var settling_speed = sqrt(2.0*(mass_kg*9.8-buoyancy)/(1.2*.47*area))
			var equilibrium = .2*(sqrt(speed/settling_speed)-1.0) if blowing=="on" and speed>=settling_speed else -1.0
			parameters.merge({"massGrams":mass_g,"mass":mass_kg,"diameter":diameter_cm,"blowing":blowing,"airDensity":1.2,"dragCoefficient":.47,"area":area,"buoyancy":buoyancy,"flowLength":.2,"settlingSpeed":settling_speed,"equilibriumHeight":equilibrium if equilibrium>=0.0 and equilibrium<=.25 else null},true)
			duration = 3.0
		_:
			return false
	return true

func _sample(sample: Dictionary) -> void:
	if not active:
		return
	count += 1
	var scenario = str(parameters.scenario)
	var time = float(sample.time)
	var done = time>=duration
	var point = []
	if scenario=="magnetDeflection":
		point = [time,sample.x,sample.y,sample.vx,sample.vy,sample.fx,sample.fy]
	elif scenario=="indentation":
		point = [time,sample.y,sample.vy,sample.phase,sample.fy]
		if contact_time<0.0 and int(sample.phase)==1:
			contact_time = time
			contact_velocity = float(sample.vy)
		done = int(sample.phase)==1 and float(sample.vy)==0.0
	elif scenario=="airSuspension":
		var height = -float(sample.y)
		point = [time,height,-float(sample.vy),sample.airForce,sample.localAirSpeed,1 if height<=0.0 else 2 if height>=.25 else 0]
		done = done or height<=0.0 or height>=.25
	else:
		var wrapped = float(sample.angle)
		angle += wrapf(wrapped-prior_wrapped_angle,-PI,PI)
		prior_wrapped_angle = wrapped
		var load_power = float(parameters.damping)*pow(float(sample.angularVelocity),2)
		load_work += .5*(load_power+prior_load_power)*(time-previous_time)
		prior_load_power = load_power
		point = [time,rad_to_deg(angle),sample.angularVelocity,load_work]
	if done and scenario!="indentation" and not last_point.is_empty():
		var fraction = (duration-float(last_point[0]))/(time-float(last_point[0]))
		var boundary = int(point[5]) if scenario=="airSuspension" else 0
		if boundary!=0:
			fraction = ((0.0 if boundary==1 else .25)-float(last_point[1]))/(float(point[1])-float(last_point[1]))
		fraction = clampf(fraction,0.0,1.0)
		for index in range(point.size()):
			point[index] = lerpf(float(last_point[index]),float(point[index]),fraction)
		if scenario=="airSuspension":
			point[5] = boundary
	if count==1 or count%sample_stride==0 or done or (scenario=="indentation" and absf(time-contact_time)<physical_step*2.1):
		trajectory.append(point)
	previous_time = time
	last_point = point
	if done or time>duration+.1:
		_finish(point)

func _finish(point: Array) -> void:
	active = false
	body.active = false
	body.set_deferred("freeze",true)
	var values = parameters.duplicate()
	values.merge({"duration":point[0],"integrationStep":physical_step},true)
	result_pending = {"model":model_name,"solver":"Godot RigidBody2D — mechanics review","values":values,"trajectory":trajectory.duplicate()}
	match str(parameters.scenario):
		"magnetDeflection":
			values.merge({"x":point[1],"y":point[2],"vx":point[3],"vy":point[4],"forceX":point[5],"forceY":point[6],"speed":Vector2(float(point[3]),float(point[4])).length()},true)
			var graph_points = []
			for sample in trajectory:
				graph_points.append([sample[1],sample[2]])
			result_pending.graph = {"xLabel":"水平位置 x / m","yLabel":"侧向位置 y / m（上方为负）","points":graph_points}
			_magnet_learning()
		"indentation":
			var depth = float(point[1])-float(values.height)
			values.merge({"distance":point[1],"velocity":point[2],"depth":depth,"contactTime":contact_time,"impactVelocity":contact_velocity,"initialPotential":float(values.mass)*9.8*float(values.height),"gravityWork":float(values.mass)*9.8*float(point[1]),"resistanceWork":float(values.resistance)*depth},true)
			var graph_points = []
			for sample in trajectory:
				graph_points.append([sample[0],maxf(float(sample[1])-float(values.height),0.0)])
			result_pending.graph = {"xLabel":"时间 / s","yLabel":"压入深度 / m","points":graph_points}
			_indentation_learning()
		"solarFan":
			var energy = .5*float(values.inertia)*pow(float(point[2]),2)
			values.merge({"angle":point[1],"angularVelocity":point[2],"rotorEnergy":energy,"loadEnergy":point[3],"inputEnergy":float(values.inputPower)*float(point[0]),"electricEnergy":float(values.outputPower)*float(point[0]),"mechanicalEnergy":energy+float(point[3]),"mechanicalPower":float(values.torque)*float(point[2])},true)
			var states = []
			var graph_points = []
			for sample in trajectory:
				states.append({"time":sample[0],"angle":sample[1],"angularVelocity":sample[2]})
				graph_points.append([sample[0],sample[2]])
			result_pending.rotationStates = states
			result_pending.graph = {"xLabel":"时间 / s","yLabel":"风扇角速度 / (rad/s)","points":graph_points}
			_fan_learning()
		"airSuspension":
			var boundary = int(point[5])
			var status = "landed" if boundary==1 else "upperBoundary" if boundary==2 else "moving"
			if boundary==0 and values.equilibriumHeight!=null and absf(float(point[2]))<.005 and absf(float(point[1])-float(values.equilibriumHeight))<.005:
				status = "nearEquilibrium"
			values.merge({"mass":values.massGrams,"massKg":parameters.mass,"height":point[1],"velocity":point[2],"airForce":point[3],"localAirSpeed":point[4],"weight":float(parameters.mass)*9.8,"status":status},true)
			var graph_points = []
			for sample in trajectory:
				graph_points.append([sample[0],sample[1]])
			result_pending.graph = {"xLabel":"时间 / s","yLabel":"托架上方高度 / m","points":graph_points}
			_air_learning()

func _magnet_learning() -> void:
	var v = result_pending.values
	result_pending.assumptions = "俯视无摩擦水平面，铁球以实际二维刚体运动。磁体采用指定的平滑中心吸引力场：软化尺度 a=0.25 m，F=F最大·(3√3/2)·a²·r/(|r|²+a²)^(3/2)，r 指向磁体；该公式只是可控等效磁吸模型，不是现实磁铁的定量磁力定律，不模拟接触、磁化和铁球自转。图中侧方上侧的 y 为负。"
	result_pending.readings = [{"label":"水平位置","value":v.x,"unit":"m"},{"label":"侧向位移","value":v.y,"unit":"m"},{"label":"水平速度","value":v.vx,"unit":"m/s"},{"label":"侧向速度","value":v.vy,"unit":"m/s"}]
	result_pending.process = [{"title":"建立无磁体对照","text":"先选择“无磁体”，铁球不受水平合力，将保持原有静止或匀速直线运动状态。"},{"title":"改变磁体位置","text":"前方磁体的作用力沿原运动方向，能改变速度大小；侧方磁体提供侧向力，使速度方向发生改变。每次比较保持铁球质量和初速度相同。"},{"title":"用分方向读数判断偏转","text":"观察 %.3f s 后，水平速度 vx≈%.4f m/s，侧向速度 vy≈%.4f m/s；侧向位移 y≈%.4f m。vy 不为零表明运动方向已改变。"%[v.duration,v.vx,v.vy,v.y]},{"title":"说明等效模型边界","text":"吸引力的大小随球到磁体的位置改变。本模型用于验证受力与运动方向的关系，不能据此计算某块真实磁铁对铁球的吸力。"}]
	result_pending.conclusion = "力可以改变物体运动的快慢，也可以改变运动方向；速度方向变化同样属于运动状态变化。"

func _indentation_learning() -> void:
	var v = result_pending.values
	result_pending.assumptions = "钢珠从静止下落，进入软介质后受到给定恒定向上阻力 R，且 R>mg；实际刚体持续积分到停止，停止后由静态支持力平衡重力，不模拟反弹。深度是该恒阻力理想模型的压入距离，不是对实际橡皮泥非线性形变的定量预测。钢珠半径仅用于图示，h 是钢珠接触介质前下降的距离。"
	result_pending.readings = [{"label":"接触前下降高度","value":v.height,"unit":"m"},{"label":"初始重力势能","value":v.initialPotential,"unit":"J"},{"label":"介质阻力（给定）","value":v.resistance,"unit":"N"},{"label":"停止时压入深度","value":v.depth*1000.0,"unit":"mm"}]
	result_pending.process = [{"title":"控制变量进行比较","text":"同一钢珠比较不同释放高度时，要保持材料阻力模型相同。比较质量时，应保持下降高度和材料条件相同。压入深度是作用效果，单位是长度，不能直接当作能量的焦耳数。"},{"title":"计算进入介质前的势能","text":"Ep=mgh=%.4f×9.8×%.4f≈%.6f J。"%[v.mass,v.height,v.initialPotential]},{"title":"计入压入过程中的重力做功（拓展）","text":"钢珠停止时总下降距离为 h+d，重力仍在压入阶段做功。故 mg(h+d)=R·d，整理得 d=mgh/(R−mg)≈%.6f m。"%(v.initialPotential/(v.resistance-v.mass*9.8))},{"title":"核对刚体积分结果","text":"实际轨迹停止深度约 %.6f m；重力做功约 %.6f J，克服阻力做功约 %.6f J。二者的小差异来自接触和停止时的固定步长近似。"%[v.depth,v.gravityWork,v.resistanceWork]}]
	result_pending.conclusion = "在钢珠和介质条件相同时，释放高度越大，压入越深，可间接比较重力势能的大小。"

func _fan_learning() -> void:
	var v = result_pending.values
	result_pending.assumptions = "用理想供电与平均转矩模型演示光能驱动风扇：电池板有效受光功率 P光=P满光×受光比例，电功率 P电=ηP光；稳压等效电压固定 3 V，电流 I=P电/3，转矩 τ=0.01I N·m。转子惯量 0.0002 kg·m²，负载力矩 0.0005ω N·m，由实际 Godot 刚体积分。仅比较各次从静止启动的结果；不模拟电池板真实伏安曲线、启动阈值、反电动势或运行中突然遮光。模型范围内电机机械输出小于供给电功率。角位移为度，角速度为 rad/s。"
	result_pending.readings = [{"label":"有效受光功率","value":v.inputPower,"unit":"W"},{"label":"电池板输出电功率","value":v.outputPower,"unit":"W"},{"label":"风扇角速度","value":v.angularVelocity,"unit":"rad/s"},{"label":"累计机械输出","value":v.mechanicalEnergy,"unit":"J"}]
	result_pending.process = [{"title":"先求有效受光功率","text":"P光=P满光×受光比例=%.3f×%.1f%%=%.4f W。完全遮光时受光比例为零。"%[v.power,v.coverage,v.inputPower]},{"title":"计算光电转换","text":"P电=ηP光=%.1f%%×%.4f=%.4f W。给定等效供电电压 U=3 V，则 I=P电/U≈%.5f A。"%[v.efficiency,v.inputPower,v.outputPower,v.current]},{"title":"由转矩和负载计算转动","text":"平均驱动转矩 τ=0.01I≈%.6f N·m；转子受净转矩 τ−bω，在实际刚体积分中从静止逐渐加速，%.3f s 后角速度约 %.5f rad/s。"%[v.torque,v.duration,v.angularVelocity]},{"title":"写出能量转化链","text":"光能→电能→机械能。给电机的电能约 %.6f J，转子动能与克服负载做功合计约 %.6f J，其余能量归入电机等环节的损耗。不能把光功率直接当作风扇转速。"%[v.electricEnergy,v.mechanicalEnergy]}]
	result_pending.conclusion = "受光比例和光电转换效率影响可供给电功率，进而影响同一风扇在相同负载下的启动转速。"

func _air_learning() -> void:
	var v = result_pending.values
	result_pending.assumptions = "向上气流的有限竖直模型：z 为球底离托架的高度，初始 z=0.02 m、速度为零；只模拟到 z=0 托架或 z=0.25 m 上边界，不模拟碰撞。指定轴向风速 u(z)=u₀/(1+z/0.2)²，空气密度 1.2 kg/m³、球体阻力系数 0.47；以相对风速计算二次气动力，并计入排开空气的浮力。实际刚体受到重力、气动力和浮力。这不是倒置漏斗向下吹气的装置，不求解真实漏斗流场，不证明横向或三维稳定，也不保证任意风速下悬浮。气流每轮保持开或关，不模拟口吹脉动。"
	result_pending.readings = [{"label":"球质量","value":v.mass,"unit":"g"},{"label":"当前高度","value":v.height*100.0,"unit":"cm"},{"label":"气流作用力（向上为正）","value":v.airForce,"unit":"N"},{"label":"重力","value":v.weight,"unit":"N"}]
	var state_text = {"landed":"球已到达托架，下降段结束；本次气流不能维持悬浮。","upperBoundary":"球达到模型上边界；不继续推断更高位置的运动。","nearEquilibrium":"球已接近竖直平衡高度；这不代表三维稳定已得到证明。","moving":"观察结束时球仍在运动，不能直接称为稳定悬浮。"}[v.status]
	result_pending.process = [{"title":"先做关气流的对照","text":"保持球质量和直径相同，把气流开关设为“关”。球从托架上方 2 cm 静止释放，在重力、浮力和空气阻力作用下下落。"},{"title":"把质量换成千克","text":"m=%.3f g=%.6f kg，因此 G=mg≈%.6f N。球直径为 %.2f cm，迎风面积 A≈%.7f m²。"%[v.mass,v.massKg,v.weight,v.diameter,v.area]},{"title":"比较向上与向下的作用","text":"向上气动力取决于空气相对球的速度：F气=ρCdA(u−v)|u−v|/2。竖直平衡时 F气+F浮=mg；给定场中气流随高度减弱，风速过小可能不存在托架上方的平衡高度。"},{"title":"依据轨迹得出有限结论","text":state_text}]
	result_pending.conclusion = state_text+"漏斗内真实流动及侧向稳定还需要更完整的流场与受力分析。"

func _process(_delta: float) -> void:
	if result_pending.is_empty():
		return
	Engine.time_scale = saved_scale
	Engine.physics_ticks_per_second = saved_ticks
	Engine.max_physics_steps_per_frame = saved_steps
	var output = result_pending
	result_pending = {}
	body.queue_free()
	finished.emit(output)
