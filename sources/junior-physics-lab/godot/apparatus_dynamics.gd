# SPDX-License-Identifier: AGPL-3.0-only
extends Node

signal finished(result: Dictionary)
const Body = preload("res://apparatus_body.gd")
const G = 9.8
var bodies = []
var latest = []
var parameters = {}
var scenario = ""
var model_name = ""
var trajectory = []
var active = false
var result_pending = {}
var saved_ticks = 480
var saved_steps = 32
var saved_scale = 1.0
var count = 0
var max_time = 1.0
var last_time = -1.0
var max_displacement = 0.0
var return_time = -1.0
var prior_x = 0.0
var prior_t = 0.0
var unwrapped_angle = 0.0
var prior_angle = 0.0
var previous_point = []
var collided = false
var impact_time = -1.0
var impact_velocity = 0.0
var shared_velocity = 0.0
var momentum_before = 0.0
var momentum_after = 0.0
var impact_block_x = 0.0
var physical_step = 1.0/960.0
var sample_stride = 4

func evaluate(model: String, supplied: Dictionary) -> Dictionary:
	model_name = model
	scenario = str(supplied.get("scenario",""))
	parameters = supplied.duplicate()
	trajectory = []
	bodies = []
	latest = []
	count = 0
	last_time = -1.0
	max_displacement = 0.0
	return_time = -1.0
	prior_x = 0.0
	prior_t = 0.0
	unwrapped_angle = 0.0
	prior_angle = 0.0
	previous_point = []
	collided = false
	impact_time = -1.0
	impact_velocity = 0.0
	shared_velocity = 0.0
	momentum_before = 0.0
	momentum_after = 0.0
	impact_block_x = 0.0
	physical_step = 1.0/960.0
	sample_stride = 4
	var configs = _configure()
	if configs.is_empty():
		return {"error":"未支持的装置动力学实验。"}
	for config in configs:
		var body = Body.new()
		add_child(body)
		bodies.append(body)
		latest.append({})
		body.sampled.connect(_sample.bind(bodies.size()-1))
	saved_ticks = Engine.physics_ticks_per_second
	saved_steps = Engine.max_physics_steps_per_frame
	saved_scale = Engine.time_scale
	# 16x wall-clock acceleration. The step is fixed within a run; very
	# short friction stops use finer steps so they still have >=32 samples.
	Engine.physics_ticks_per_second = ceili(16.0/physical_step)
	physical_step = 16.0/Engine.physics_ticks_per_second
	sample_stride = maxi(1,roundi(1.0/(240.0*physical_step)))
	Engine.max_physics_steps_per_frame = 512
	Engine.time_scale = 16.0
	active = true
	for index in range(bodies.size()):
		bodies[index].begin(configs[index])
	return await finished

func _number(key: String, fallback: float, minimum: float, maximum: float) -> float:
	var value = clampf(float(parameters.get(key,fallback)),minimum,maximum)
	parameters[key] = value
	return value

func _configure() -> Array:
	match scenario:
		"interaction":
			var m1 = _number("mass1",.5,.1,2.0)
			var m2 = _number("mass2",.5,.1,2.0)
			var force = _number("force",.5,0.0,2.0)
			max_time = _number("duration",1.0,.2,2.0)
			return [{"mass":m1,"force":-force},{"mass":m2,"force":force}]
		"supportRemoval":
			var mass = _number("mass",.1,.02,1.0)
			var height = _number("height",.3,.05,1.0)
			max_time = sqrt(2.0*height/G)+.1
			return [{"mass":mass,"axis":Vector2.DOWN,"force":mass*G}]
		"rollingPendulum":
			var mass = _number("mass",.3,.1,1.0)
			var radius = _number("radius",.006,.003,.015)
			var inertia = _number("inertia",.0002,.00002,.001)
			var height = _number("height",.5,.1,1.0)
			# No slip at the axle: a=r*alpha. Combining m*a=m*g-T
			# and I*alpha=T*r gives the total upward string tension.
			var tension = mass*G*inertia/(inertia+mass*radius*radius)
			parameters["tension"] = tension
			max_time = sqrt(2.0*height/(G-tension/mass))+.1
			return [{"mass":mass,"axis":Vector2.DOWN,"force":mass*G-tension,"inertia":inertia,"torque":tension*radius}]
		"kineticImpact":
			var mass = _number("mass",.05,.02,.2)
			var block_mass = _number("blockMass",.2,.05,1.0)
			var velocity = _number("velocity",1.0,.2,2.0)
			var friction = _number("friction",.2,.1,.6)
			max_time = .15/velocity+velocity/(friction*G)+.2
			var stopping_time = mass*velocity/((mass+block_mass)*friction*G)
			physical_step = minf(physical_step,stopping_time/32.0)
			return [{"mass":mass,"position":-.2,"velocity":velocity,"friction":friction},{"mass":block_mass,"friction":friction}]
		"elasticReturn":
			var mass = _number("mass",.3,.1,1.0)
			var spring = _number("spring",1.0,.2,4.0)
			var velocity = _number("velocity",.5,.1,1.0)
			max_time = TAU*sqrt(mass/spring)
			return [{"mass":mass,"velocity":velocity,"spring":spring}]
		"motor":
			var current = _number("current",1.0,-2.0,2.0)
			var turns = _number("turns",100.0,20.0,200.0)
			var core = "iron" if str(parameters.get("core","iron"))=="iron" else "air"
			var field = .015 if core=="iron" else .004
			var area = .001
			var inertia = .0002
			var damping = .0005
			var torque = turns*field*current*area
			parameters.merge({"core":core,"field":field,"area":area,"inertia":inertia,"damping":damping,"torque":torque},true)
			max_time = 3.0
			return [{"mass":.1,"inertia":inertia,"torque":torque,"rotationalDamping":damping}]
	return []

func _sample(sample: Dictionary, index: int) -> void:
	if not active:
		return
	latest[index] = sample
	for item in latest:
		if item.is_empty() or absf(float(item.time)-float(sample.time))>.0000001:
			return
	var time = float(sample.time)
	if time <= last_time:
		return
	last_time = time
	count += 1
	var first = latest[0]
	var x = float(first.position)
	var velocity = float(first.velocity)
	var point = []
	var done = time >= max_time
	match scenario:
		"interaction":
			point = [time,x,latest[1].position,velocity,latest[1].velocity]
		"supportRemoval":
			point = [time,x,velocity]
			done = x >= float(parameters.height)
		"rollingPendulum":
			var angle = float(first.angle)
			unwrapped_angle += wrapf(angle-prior_angle,-PI,PI)
			prior_angle = angle
			point = [time,x,velocity,unwrapped_angle,first.angularVelocity]
			done = x >= float(parameters.height)
		"kineticImpact":
			var other = latest[1]
			point = [time,x,other.position,velocity,other.velocity,1 if collided else 0]
			if not collided and x-float(other.position) >= -.05:
				impact_velocity = velocity
				var m1 = float(parameters.mass)
				var m2 = float(parameters.blockMass)
				momentum_before = m1*velocity+m2*float(other.velocity)
				shared_velocity = momentum_before/(m1+m2)
				bodies[0].pending_impulse = m1*(shared_velocity-velocity)
				bodies[1].pending_impulse = m2*(shared_velocity-float(other.velocity))
				bodies[0].friction_enabled = true
				bodies[1].friction_enabled = true
				impact_time = time+float(first.step)
				impact_block_x = float(other.position)
				collided = true
			elif collided:
				if time <= impact_time+.0000001:
					momentum_after = float(parameters.mass)*velocity+float(parameters.blockMass)*float(other.velocity)
				done = absf(velocity)<.000001 and absf(float(other.velocity))<.000001
		"elasticReturn":
			point = [time,x,velocity,-float(parameters.spring)*x]
			max_displacement = maxf(max_displacement,absf(x))
			if return_time < 0.0 and prior_x > 0.0 and x <= 0.0:
				return_time = lerpf(prior_t,time,prior_x/(prior_x-x))
		"motor":
			var angle = float(first.angle)
			unwrapped_angle += wrapf(angle-prior_angle,-PI,PI)
			prior_angle = angle
			point = [time,rad_to_deg(unwrapped_angle),first.angularVelocity]
	# Locate the prescribed endpoint between the final two actual engine
	# samples; do not let the displayed object pass through its receiving plane.
	if done and not previous_point.is_empty() and scenario!="kineticImpact":
		var fraction = 1.0
		if scenario in ["supportRemoval","rollingPendulum"]:
			fraction = (float(parameters.height)-float(previous_point[1]))/(float(point[1])-float(previous_point[1]))
		else:
			fraction = (max_time-float(previous_point[0]))/(float(point[0])-float(previous_point[0]))
		fraction = clampf(fraction,0.0,1.0)
		for item_index in range(point.size()):
			point[item_index] = lerpf(float(previous_point[item_index]),float(point[item_index]),fraction)
	if count%sample_stride==0 or count==1 or done or (scenario=="kineticImpact" and absf(time-impact_time)<.005):
		trajectory.append(point)
	prior_x = x
	prior_t = time
	previous_point = point
	if done or time >= max_time+.1:
		_finish(point)

func _finish(final_point: Array) -> void:
	active = false
	for body in bodies:
		body.active = false
		body.set_deferred("freeze",true)
	var values = parameters.duplicate()
	values["duration"] = final_point[0]
	values["integrationStep"] = physical_step
	var graph_points = []
	for point in trajectory:
		graph_points.append([point[0],point[2] if scenario=="kineticImpact" else point[1]])
	result_pending = {"model":model_name,"solver":"Godot RigidBody2D — apparatus dynamics","values":values,"trajectory":trajectory.duplicate(),"graph":{"xLabel":"时间 / s","yLabel":"位置 / m","points":graph_points}}
	match scenario:
		"interaction":
			values.merge({"displacement1":final_point[1],"displacement2":final_point[2],"velocity1":final_point[3],"velocity2":final_point[4],"acceleration1":-float(parameters.force)/float(parameters.mass1),"acceleration2":float(parameters.force)/float(parameters.mass2),"momentum":float(parameters.mass1)*float(final_point[3])+float(parameters.mass2)*float(final_point[4])},true)
			_interaction_learning()
		"supportRemoval":
			values.merge({"distance":final_point[1],"velocity":final_point[2],"horizontalDisplacement":0.0},true)
			_support_learning()
		"rollingPendulum":
			var translational = .5*float(parameters.mass)*pow(float(final_point[2]),2)
			var rotational = .5*float(parameters.inertia)*pow(float(final_point[4]),2)
			values.merge({"distance":final_point[1],"velocity":final_point[2],"angle":final_point[3],"angularVelocity":final_point[4],"translationEnergy":translational,"rotationEnergy":rotational,"initialPotential":float(parameters.mass)*G*float(parameters.height),"releasedPotential":float(parameters.mass)*G*float(final_point[1]),"constraintError":float(final_point[1])-float(parameters.radius)*float(final_point[3])},true)
			_rolling_learning()
		"kineticImpact":
			var initial = .5*float(parameters.mass)*pow(impact_velocity,2)
			var after_impact = .5*(float(parameters.mass)+float(parameters.blockMass))*shared_velocity*shared_velocity
			values.merge({"impactTime":impact_time,"collisionVelocity":shared_velocity,"slideDistance":float(final_point[2])-impact_block_x,"initialEnergy":initial,"afterImpactEnergy":after_impact,"energyLost":initial-after_impact,"momentumBefore":momentum_before,"momentumAfter":momentum_after,"ballPosition":final_point[1],"blockPosition":final_point[2],"finalVelocity":final_point[4]},true)
			_impact_learning()
		"elasticReturn":
			var initial = .5*float(parameters.mass)*pow(float(parameters.velocity),2)
			var final_energy = .5*float(parameters.mass)*pow(float(final_point[2]),2)+.5*float(parameters.spring)*pow(float(final_point[1]),2)
			values.merge({"initialEnergy":initial,"finalEnergy":final_energy,"maxDisplacement":max_displacement,"returnTime":return_time,"period":max_time,"position":final_point[1],"finalVelocity":final_point[2]},true)
			_elastic_learning()
		"motor":
			values.merge({"angle":final_point[1],"angularVelocity":final_point[2]},true)
			var rotation_states = []
			var speed_points = []
			for point in trajectory:
				rotation_states.append({"time":point[0],"angle":point[1],"angularVelocity":point[2]})
				speed_points.append([point[0],point[2]])
			result_pending["rotationStates"] = rotation_states
			result_pending.graph = {"xLabel":"时间 / s","yLabel":"角速度 / (rad/s)","points":speed_points}
			_motor_learning()

func _interaction_learning() -> void:
	var v = result_pending.values
	result_pending.assumptions = "两辆实际刚体在无摩擦水平轨道上，从静止开始受到等大、反向的相互作用力；作用力在所选时段内恒定。两力分别作用在两辆车上，不能当成作用在一辆车上的平衡力。"
	result_pending.readings = [{"label":"甲车所受力（向右为正）","value":-v.force,"unit":"N"},{"label":"乙车所受力","value":v.force,"unit":"N"},{"label":"甲车速度","value":v.velocity1,"unit":"m/s"},{"label":"乙车速度","value":v.velocity2,"unit":"m/s"}]
	result_pending.process = [{"title":"分别确定研究对象","text":"甲车质量 m₁=%.3f kg，乙车质量 m₂=%.3f kg。规定水平向右为正；甲受力 −%.3f N，乙受力 +%.3f N。"%[v.mass1,v.mass2,v.force,v.force]},{"title":"比较相互作用力","text":"F甲对乙 与 F乙对甲 大小相等、方向相反、作用在不同物体上。这对力不是平衡力；质量不同也不改变这两个力大小相等的关系。"},{"title":"读取运动结果","text":"经过 %.4f s，甲车速度约 %.4f m/s，乙车速度约 %.4f m/s。相同受力时间内，质量较小的车速度改变更明显。"%[v.duration,v.velocity1,v.velocity2]}]
	result_pending.conclusion = "相互作用力等大反向；质量不同的物体，运动状态的改变程度可以不同。"

func _support_learning() -> void:
	var v = result_pending.values
	result_pending.assumptions = "t=0 表示支撑物已沿水平方向快速抽离。理想化为抽离时间极短且传给物体的水平冲量为零；物体随后只受重力，忽略空气阻力。只模拟落到下方接收面之前，不模拟杯口或杯底碰撞。"
	result_pending.readings = [{"label":"下落高度","value":v.height,"unit":"m"},{"label":"下落时间","value":v.duration,"unit":"s"},{"label":"竖直速度","value":v.velocity,"unit":"m/s"},{"label":"水平位移","value":0.0,"unit":"m"}]
	result_pending.process = [{"title":"分析抽离瞬间","text":"支撑物抽离前，物体静止。理想快速抽离不给物体水平冲量，故物体保留原来的水平静止状态。"},{"title":"分析抽离后受力","text":"失去支持力后，物体受竖直向下的重力，因此向下运动。不能说物体只凭惯性就会向下落。"},{"title":"读数并区分方向","text":"从 %.3f m 高处下落约需 %.4f s；水平位移为 0 m，向下速度约 %.4f m/s。"%[v.height,v.duration,v.velocity]}]
	result_pending.conclusion = "惯性解释物体保持原有水平运动状态；重力解释它在失去支持后向下运动。"

func _rolling_learning() -> void:
	var v = result_pending.values
	result_pending.assumptions = "仅模拟滚摆从静止释放后的下降段。两股轻绳的合张力记为 T，绳与半径 r 的轮轴不打滑；轮轴视为刚体，转动惯量 I 为给定值，无轴摩擦和空气阻力。约束 a=rα 决定张力，Godot 分别以重力减张力和张力力矩积分平移与转动；不模拟底端反卷上升。"
	result_pending.readings = [{"label":"下降距离","value":v.distance,"unit":"m"},{"label":"平动速度","value":v.velocity,"unit":"m/s"},{"label":"平动动能","value":v.translationEnergy,"unit":"J"},{"label":"转动动能","value":v.rotationEnergy,"unit":"J"}]
	result_pending.process = [{"title":"记录重力势能的减少","text":"m=%.3f kg，下降 h≈%.4f m。重力势能减少 mgh≈%.3f×9.8×%.4f=%.6f J。"%[v.mass,v.distance,v.mass,v.distance,v.releasedPotential]},{"title":"区分两种运动","text":"轮轴一边下降、一边转动；重力势能同时转化为平动动能和转动动能。不能把全部 mgh 都当作平动动能。"},{"title":"核对能量（拓展）","text":"E平动=mv²/2≈%.6f J；E转动=Iω²/2≈%.6f J，合计约 %.6f J。固定步长积分会产生小量数值误差。"%[v.translationEnergy,v.rotationEnergy,v.translationEnergy+v.rotationEnergy]},{"title":"限定模型的适用范围","text":"本图只演示下降。实际滚摆在最低点附近重新卷绳并上升，需要另行处理绳的约束变化，不能由本段动画推断。"}]
	result_pending.conclusion = "滚摆下降时，重力势能转化为平动和转动的动能；忽略阻力时机械能近似守恒。"

func _impact_learning() -> void:
	var v = result_pending.values
	result_pending.assumptions = "用两个实际刚体模拟球与木块。球在碰前作水平匀速运动；接触时采用完全非弹性近似，以等大反向冲量使两者获得共同速度，此后一起受到恒定滑动摩擦力而停止。碰撞阶段忽略地面冲量，不模拟弹跳或球的转动。接触判定精度受固定步长限制。"
	result_pending.readings = [{"label":"球碰前速度","value":v.velocity,"unit":"m/s"},{"label":"球碰前动能","value":v.initialEnergy,"unit":"J"},{"label":"碰后共同速度","value":v.collisionVelocity,"unit":"m/s"},{"label":"木块滑行距离","value":v.slideDistance,"unit":"m"}]
	result_pending.process = [{"title":"控制变量并比较现象","text":"比较球的质量时保持碰前速度、同一木块和接触面相同；比较速度时保持球质量、同一木块和接触面相同。木块滑行距离反映碰撞后系统克服摩擦所做的功。"},{"title":"先看碰撞损失（拓展）","text":"完全非弹性模型中，v共=mv/(m+M)=%.4f×%.4f/(%.4f+%.4f)≈%.4f m/s。碰前球的动能约 %.6f J，碰后总动能约 %.6f J；二者不相等。"%[v.mass,v.velocity,v.mass,v.blockMass,v.collisionVelocity,v.initialEnergy,v.afterImpactEnergy]},{"title":"再看摩擦做功（拓展）","text":"f=μ(m+M)g≈%.6f N；停止时克服摩擦做功 f·s≈%.6f J，与碰后动能约 %.6f J 比较。不能把球碰前全部动能直接写成木块克服摩擦做的功。"%[v.friction*(v.mass+v.blockMass)*G,v.friction*(v.mass+v.blockMass)*G*v.slideDistance,v.afterImpactEnergy]},{"title":"读取比较结果","text":"本次木块滑行约 %.5f m。该模型仅用于相同碰撞条件下的控制变量比较。"%v.slideDistance}]
	result_pending.conclusion = "在其他碰撞条件相同时，改变球的质量或速度会改变木块滑行距离；碰撞本身也会损失机械能。"

func _elastic_learning() -> void:
	var v = result_pending.values
	result_pending.assumptions = "回滚罐仅作一维等效弹簧—质量模型：位置 x=0 为弹性元件无形变处，给定等效刚度 k 与质量 m，从该处赋予初速度后，实际刚体受到回复力 F=−kx。忽略耗散，不复现特定罐体内的橡皮筋机构，也未计入罐体转动惯量。"
	result_pending.readings = [{"label":"初始动能","value":v.initialEnergy,"unit":"J"},{"label":"最大形变","value":v.maxDisplacement,"unit":"m"},{"label":"首次回到起点","value":v.returnTime,"unit":"s"},{"label":"末态机械能","value":v.finalEnergy,"unit":"J"}]
	result_pending.process = [{"title":"明确等效模型","text":"质量 m=%.3f kg，等效刚度 k=%.3f N/m；x=0 时以 %.3f m/s 的速度向右运动。回复力始终指向 x=0。"%[v.mass,v.spring,v.velocity]},{"title":"追踪能量转化","text":"先向右运动时，动能转化为弹性势能；到最远处速度为零，回复力仍不为零，因此物体开始返回。回程中弹性势能重新转化为动能。"},{"title":"核对最大形变（拓展）","text":"由 mv₀²/2=kx最大²/2，x最大=v₀√(m/k)≈%.5f m；实际刚体轨迹测得最大形变约 %.5f m。"%[v.velocity*sqrt(v.mass/v.spring),v.maxDisplacement]},{"title":"区分理想模型与实物","text":"无耗散模型会持续往复；实物受摩擦、空气阻力和材料内耗影响，回滚距离通常逐次减小。不同罐体机构也不一定满足线性 F=−kx。"}]
	result_pending.conclusion = "弹性元件的回复力使物体返回；动能与弹性势能相互转化。"

func _motor_learning() -> void:
	var v = result_pending.values
	result_pending.assumptions = "刚体转子绕固定中心转动，用理想换向器的平均转矩 τ=NBIA 代替随转角变化的瞬时转矩，电流反向时平均转矩反向。固定线圈面积 A=0.001 m²、转动惯量 I转=0.0002 kg·m²、粘性阻尼系数 b=0.0005 N·m·s；铁芯/空气档的等效磁感应强度分别为 0.015/0.004 T，不代表真实铁芯的普遍倍数。Godot 以 τ−bω 实际积分；角位移输出单位为度，角速度为 rad/s。不模拟线圈电阻、反电动势、电刷换向细节或外接负载。"
	result_pending.readings = [{"label":"电流","value":v.current,"unit":"A"},{"label":"等效磁感应强度","value":v.field,"unit":"T"},{"label":"平均电磁转矩","value":v.torque,"unit":"N·m"},{"label":"末态角速度","value":v.angularVelocity,"unit":"rad/s"}]
	result_pending.process = [{"title":"分析电动机工作原理","text":"通电线圈在磁场中受到力的作用。换向器使线圈持续得到同一转向的平均驱动转矩；改变电流方向会改变转动方向。"},{"title":"说明模型给定量（拓展）","text":"线圈匝数 N=%.0f，等效磁感应强度 B=%.4f T，电流 I电=%.3f A，线圈面积 A=%.4f m²。平均转矩 τ=NB I电 A≈%.6f N·m。"%[v.turns,v.field,v.current,v.area,v.torque]},{"title":"区分启动与稳定转动","text":"启动时角速度为零，阻尼力矩为零；随后阻尼力矩 bω 随转速增大。经过 %.3f s，刚体角速度约 %.5f rad/s。零电流且从静止释放时，转子保持静止。"%[v.duration,v.angularVelocity]}]
	result_pending.conclusion = "通电线圈在磁场中受力转动，电能转化为机械能；反转电流方向会反转转动方向。"

func _process(_delta: float) -> void:
	if result_pending.is_empty():
		return
	Engine.time_scale = saved_scale
	Engine.physics_ticks_per_second = saved_ticks
	Engine.max_physics_steps_per_frame = saved_steps
	var output = result_pending
	result_pending = {}
	for body in bodies:
		body.queue_free()
	bodies = []
	finished.emit(output)
