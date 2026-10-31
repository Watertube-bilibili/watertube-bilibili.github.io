# SPDX-License-Identifier: AGPL-3.0-only
extends Node
signal finished(result: Dictionary)
const Body=preload("res://rolling_pendulum_body.gd")
const G=9.8
var body: RigidBody2D
var parameters: Dictionary
var states: Array
var tick: int
var stride: int
var previous_branch: int
var saved_ticks: int
var saved_steps: int
var saved_scale: float
var integration_step: float

func number(p: Dictionary,key: String,fallback: float,low: float,high: float) -> float:
	var raw=p.get(key,fallback)
	var value=float(raw) if raw is int or raw is float or str(raw).is_valid_float() else fallback
	return clampf(value,low,high) if is_finite(value) else fallback

func evaluate(p: Dictionary) -> Dictionary:
	parameters={"scenario":"rollingPendulum","mass":number(p,"mass",0.3,0.1,1),"radius":number(p,"radius",0.006,0.003,0.015),"inertia":number(p,"inertia",0.0002,0.00002,0.001),"height":number(p,"height",0.5,0,1),"cycles":int(number(p,"cycles",3,1,5))}
	var m=float(parameters.mass); var r=float(parameters.radius); var moment=float(parameters.inertia)
	parameters["q"]=(moment-m*r*r)/(moment+m*r*r)
	parameters["initialPotential"]=m*G*float(parameters.height)
	parameters["valid"]=parameters.q>=-0.0000000001
	integration_step=number(p,"step",1.0/960.0,1.0/3840.0,1.0/480.0)
	if not parameters.valid:
		parameters["reason"]="此反卷捕获模型要求 I≥mr²；请增大转动惯量或减小质量、轴半径。I<mr²不能用取绝对值强行造出回升。"
		return _result([],[],"outside-model-domain")
	parameters.q=maxf(0,parameters.q)
	if parameters.height==0:
		var initial={"time":0.0,"position":0.0,"velocity":0.0,"angle":0.0,"angularVelocity":0.0,"branch":1,"phase":"stopped","branchPositionAnchor":0.0,"branchAngleAnchor":0.0,"potentialEnergy":0.0,"translationEnergy":0.0,"rotationEnergy":0.0,"mechanicalEnergy":0.0,"energyLost":0.0,"tension":m*G}
		return _result([initial],[],"zero-height")
	states=[]; tick=0; previous_branch=1
	saved_ticks=Engine.physics_ticks_per_second; saved_steps=Engine.max_physics_steps_per_frame; saved_scale=Engine.time_scale
	Engine.physics_ticks_per_second=ceili(16.0/integration_step)
	integration_step=16.0/Engine.physics_ticks_per_second
	stride=maxi(1,roundi(1.0/(120.0*integration_step)))
	Engine.max_physics_steps_per_frame=512; Engine.time_scale=16.0
	body=Body.new(); add_child(body); body.configure(parameters)
	body.measured.connect(_sample); body.completed.connect(_complete)
	return await finished

func _sample(sample: Dictionary) -> void:
	tick+=1
	# Every event side is retained, even when ordinary samples are decimated.
	if tick%stride==0 or states.is_empty() or sample.position==parameters.height or sample.phase in ["turning","stopped","resolution-limit"]:
		states.append(sample.duplicate())
	if sample.time>300 and body.active:
		body.active=false
		_complete("time-limit")

func _complete(reason: String) -> void:
	var output=_result(states,body.events,reason)
	body.active=false; body.set_deferred("freeze",true)
	call_deferred("_deliver",output)

func _deliver(output: Dictionary) -> void:
	body.queue_free()
	Engine.physics_ticks_per_second=saved_ticks; Engine.max_physics_steps_per_frame=saved_steps; Engine.time_scale=saved_scale
	finished.emit(output)

func _result(samples: Array,events: Array,reason: String) -> Dictionary:
	var v=parameters.duplicate(true)
	v["stopReason"]=reason
	v["integrationStep"]=integration_step if integration_step>0 else 0.0
	v["duration"]=samples[-1].time if not samples.is_empty() else 0.0
	v["finalState"]=samples[-1] if not samples.is_empty() else {}
	v["completedCycles"]=events.filter(func(e):return e.kind=="top").size()
	v["bottomRetention"]=float(v.q)*float(v.q)
	v["constraintError"]=0.0; v["velocityConstraintError"]=0.0; v["energyBalanceError"]=0.0
	var trajectory=[]; var potential=[]; var translation=[]; var rotation=[]; var loss=[]
	for sample in samples:
		trajectory.append([sample.time,sample.position,sample.velocity,sample.angle,sample.angularVelocity])
		potential.append([sample.time,sample.potentialEnergy]); translation.append([sample.time,sample.translationEnergy]); rotation.append([sample.time,sample.rotationEnergy]); loss.append([sample.time,sample.energyLost])
		v.constraintError=maxf(v.constraintError,absf(sample.position-sample.branchPositionAnchor-sample.branch*float(v.radius)*(sample.angle-sample.branchAngleAnchor)))
		v.velocityConstraintError=maxf(v.velocityConstraintError,absf(sample.velocity-sample.branch*float(v.radius)*sample.angularVelocity))
		v.energyBalanceError=maxf(v.energyBalanceError,absf(sample.mechanicalEnergy+sample.energyLost-float(v.initialPotential)))
	for event in events:
		if event.kind=="bottom":
			var s=event.pre
			v["descent"]={"duration":s.time,"distance":s.position,"velocity":s.velocity,"angle":s.angle,"angularVelocity":s.angularVelocity,"translationEnergy":s.translationEnergy,"rotationEnergy":s.rotationEnergy,"releasedPotential":v.initialPotential,"constraintError":s.position-float(v.radius)*s.angle}
			break
	var readings=[]
	if reason=="resolution-limit":v["resolutionLimited"]=true
	if v.valid and not samples.is_empty():
		var end=samples[-1]
		readings=[{"label":"已观察的反卷上升次数","value":v.completedCycles,"unit":"次"},{"label":"观察结束时离最低点高度","value":float(v.height)-float(end.position),"unit":"m"},{"label":"剩余机械能","value":end.mechanicalEnergy,"unit":"J"},{"label":"累计换向损失","value":end.energyLost,"unit":"J"}]
	else:readings=[{"label":"模型适用条件","value":v.get("reason","未生成运动"),"unit":""}]
	var assumptions="轻绳、恒定轮轴半径且不打滑，忽略行程中摩擦与空气阻力。下降和上升均由Godot刚体分别积分合力与力矩。下端用新切点瞬时非弹性收紧近似：q=(I−mr²)/(I+mr²)，角速度乘q而质心速度变号；每次损失转向前动能的1−q²。该事件不模拟绳弹性、松绳、真实冲击持续时间或接触应力。要求I≥mr²；q=0停底。往返次数是观察截点，不表示真实滚摆此时永久停住。预测回升高度低于0.1 μm或往返不足32个时间步时停止观察，保留剩余动能，不把它冒充耗散。"
	var process=[{"title":"核对下降运动","text":"两股绳的合张力T=mgI/(I+mr²)，ma=mg−T、Iα=σTr；在同一绕线支路满足v=σrω。重力势能转化为平动和转动动能，不能只算mv²/2。"},{"title":"最低点反卷（模型拓展）","text":"新切点瞬时收紧时，关于该点的角动量守恒给出q=(I−mr²)/(I+mr²)=%.6f。v后=−qv前，ω后=qω前；I>mr²时质心改向上升，轴继续沿原方向转动。"%v.q},{"title":"核对机械能去向","text":"每次换向动能保留q²=%.6f，损失比例1−q²=%.6f；其余行程近似机械能守恒。势能+平动能+转动能+累计损失应约等于初始mgH=%.6f J。"%[v.bottomRetention,1.0-v.bottomRetention,v.initialPotential]},{"title":"上端转向","text":"上升时重力和张力力矩使v与ω减小；到顶点两者为零，绕线侧保持不变，随后自然反向下降。不能在上端再次执行最低点的收紧冲量。"},{"title":"适用范围","text":v.get("reason",assumptions)}]
	return {"model":"energy","solver":"Godot RigidBody2D — rolling pendulum with impulsive no-slip capture","values":v,"playbackAvailable":v.valid and samples.size()>1,"completionLabel":"达到分辨限，已停止观察" if reason=="resolution-limit" else "收紧后停摆" if reason=="capture-stop" else "本次往返观察结束","trajectoryKind":"rollingPendulum","trajectory":trajectory,"rollingStates":samples,"events":events,"readings":readings,"process":process,"assumptions":assumptions,"conclusion":"滚摆下降时重力势能转化为平动与转动动能，反卷上升时动能转回重力势能；下端收紧损失能量，回升高度逐次降低。" if v.valid else v.reason,"graph":{"xLabel":"模型时间 / s","yLabel":"能量 / J","series":[{"name":"重力势能","points":potential},{"name":"平动动能","points":translation},{"name":"转动动能","points":rotation},{"name":"累计损失","points":loss}]}}
