# SPDX-License-Identifier: AGPL-3.0-only
extends Node2D
signal finished(result: Dictionary)
const PendulumBody=preload("res://pendulum_body.gd")
var bob: RigidBody2D
var anchor: StaticBody2D
var joint: PinJoint2D
var samples=[]
var crossings=[]
var duration=6.0
var length=1.0
var mass=.2
var gravity_strength=9.8
var initial_angle=15.0
var previous_angle=0.0
var previous_time=0.0
var active=false
var pending={}
var saved_ticks=480
var saved_steps=32
var saved_scale=1.0
var tick=0

func evaluate(p: Dictionary) -> Dictionary:
	length=clampf(float(p.get("length",1)),.05,3)
	mass=clampf(float(p.get("mass",.2)),.01,5)
	gravity_strength=clampf(float(p.get("gravity",9.8)),.1,30)
	initial_angle=clampf(float(p.get("angle",15)),1,60)
	duration=clampf(float(p.get("duration",maxf(6.0,2.5*TAU*sqrt(length/gravity_strength)))),1,120)
	samples=[[0.0,initial_angle,0.0]]
	crossings=[]
	previous_angle=deg_to_rad(initial_angle)
	previous_time=0.0
	tick=0
	anchor=StaticBody2D.new()
	anchor.collision_layer=0
	anchor.collision_mask=0
	add_child(anchor)
	bob=PendulumBody.new()
	bob.mass=mass
	bob.gravity_scale=0
	bob.linear_damp=0
	bob.angular_damp=0
	bob.linear_damp_mode=RigidBody2D.DAMP_MODE_REPLACE
	bob.angular_damp_mode=RigidBody2D.DAMP_MODE_REPLACE
	bob.lock_rotation=false
	bob.can_sleep=false
	bob.collision_layer=0
	bob.collision_mask=0
	bob.position=Vector2(sin(previous_angle),cos(previous_angle))*length*1000
	var shape=CollisionShape2D.new()
	var circle=CircleShape2D.new()
	circle.radius=10
	shape.shape=circle
	bob.add_child(shape)
	add_child(bob)
	bob.constant_force=Vector2(0,mass*gravity_strength*1000)
	bob.sampled.connect(_sample)
	joint=PinJoint2D.new()
	add_child(joint)
	joint.position=Vector2.ZERO
	joint.node_a=anchor.get_path()
	joint.node_b=bob.get_path()
	joint.bias=.9
	joint.softness=0
	saved_ticks=Engine.physics_ticks_per_second
	saved_steps=Engine.max_physics_steps_per_frame
	saved_scale=Engine.time_scale
	Engine.physics_ticks_per_second=7680
	Engine.max_physics_steps_per_frame=256
	Engine.time_scale=16
	active=true
	bob.active=true
	return await finished

func _sample(time: float, pos: Vector2, vel: Vector2) -> void:
	if not active:return
	var angle=atan2(pos.x,pos.y)
	var omega=(pos.y*vel.x-pos.x*vel.y)/maxf(pos.length_squared(),.000001)
	if previous_angle>0 and angle<=0:
		crossings.append(lerpf(previous_time,time,previous_angle/(previous_angle-angle)))
	tick+=1
	if tick%8==0 or time>=duration:samples.append([time,rad_to_deg(angle),omega])
	previous_angle=angle
	previous_time=time
	if time>=duration:
		active=false
		bob.active=false
		bob.set_deferred("freeze",true)
		var period=crossings[1]-crossings[0] if crossings.size()>1 else null
		var small_period=TAU*sqrt(length/gravity_strength)
		var energy=mass*gravity_strength*length*(1-cos(deg_to_rad(initial_angle)))
		var graph=[]
		for sample in samples:graph.append([sample[0],sample[1]])
		pending={"model":"energy","solver":"Godot RigidBody2D + PinJoint2D","values":{"scenario":"pendulum","length":length,"angle":initial_angle,"mass":mass,"gravity":gravity_strength,"period":period,"approximatePeriod":small_period,"initialEnergy":energy,"duration":time},"trajectory":samples.duplicate(),"trajectoryKind":"pendulumAngle","readings":[{"label":"摆长","value":length,"unit":"m"},{"label":"初始摆角","value":initial_angle,"unit":"°"},{"label":"重力场强度","value":gravity_strength,"unit":"N/kg"},{"label":"相邻同向过中点的周期","value":period,"unit":"s"},{"label":"小角度周期近似","value":small_period,"unit":"s"}],"process":[{"title":"选择比较方法","text":"控制其他条件相同，分别改变摆长、摆球质量或重力场强度；测量连续若干次摆动的总时间。比较摆长时还应保持初始摆角和释放方式相同。"},{"title":"由重复运动求周期","text":"一次完整往返为一次全振动。若 n 次全振动的时间为 t，则 T=t/n；本图还记录相邻两次同向经过最低点的时间差。"},{"title":"对照模型结果","text":"当前摆长 %.4f m，同向过中点测得周期 %s s。小角度理想单摆的拓展公式 T≈2π√(L/g)，代入 g=%.4f m/s² 得 %.4f s。"%[length,str(period) if period!=null else "未记录足够周期",gravity_strength,small_period]},{"title":"控制条件后下结论","text":"在摆角较小、忽略阻力的条件下，摆长越长，周期越大；重力场强度越小，周期越大；周期与摆球质量无关。摆角较大时，小角度近似的误差会增大。"}],"conclusion":"摆动过程中动能与重力势能相互转化；理想模型中忽略空气阻力和支点摩擦。周期比较应统一摆长的测量端点：悬点到摆球重心。","assumptions":"运动由真实刚体和转动铰链约束求解，绳杆无质量、摆球为质点近似。数值约束可能有微小能量误差；不把小角度周期公式当成任意摆角的精确公式。","graph":{"xLabel":"时间 / s","yLabel":"摆角 / °","points":graph}}

func _process(_delta: float) -> void:
	if pending.is_empty():return
	Engine.time_scale=saved_scale
	Engine.physics_ticks_per_second=saved_ticks
	Engine.max_physics_steps_per_frame=saved_steps
	var output=pending
	pending={}
	joint.queue_free()
	bob.queue_free()
	anchor.queue_free()
	finished.emit(output)
