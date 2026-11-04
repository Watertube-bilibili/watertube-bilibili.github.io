extends Node3D

var simulation=OffroadPhysics.new()
var state:Dictionary
var chunks:ChunkTerrain
var camera:Camera3D
var vehicle:Node3D
var body:Node3D
var wheels:Array=[]
var steering:Node3D
var speed_needle:Node3D
var rpm_needle:Node3D
var environment:WorldEnvironment
var sun:DirectionalLight3D
var scenery:Node3D
var cable:MeshInstance3D
var anchors:Array=[]
var checkpoints:Array=[]
var checkpoint_rings:Array=[]
var playing=false
var camera_mode=0
var orbit=0.0
var elapsed=0.0
var report_clock=0.0
var blocked=false
var previous_position=Vector3.ZERO
var target_camera=Vector3.ZERO
var material_cache={}
var model_scene=preload("res://assets/ridge-rover.glb")
var js_enabled=false

func _ready():
	js_enabled=OS.has_feature("web")
	state=simulation.create_state()
	checkpoints=TerrainMath.checkpoints()
	_setup_environment()
	chunks=ChunkTerrain.new()
	add_child(chunks)
	vehicle=model_scene.instantiate()
	add_child(vehicle)
	body=vehicle.find_child("Body",true,false)
	for wheel_name in ["Wheel_FL","Wheel_FR","Wheel_RL","Wheel_RR"]:
		wheels.append(vehicle.find_child(wheel_name,true,false))
	steering=vehicle.find_child("SteeringWheel",true,false)
	speed_needle=vehicle.find_child("SpeedNeedle",true,false)
	rpm_needle=vehicle.find_child("RPMNeedle",true,false)
	camera=Camera3D.new()
	camera.fov=52
	camera.far=800
	add_child(camera)
	camera.current=true
	cable=MeshInstance3D.new()
	add_child(cable)
	cable.material_override=_mat(Color("d8b770"))
	_reset_world("forest",false,0)
	_report()
	if js_enabled:JavaScriptBridge.eval("window.onRidgeReady && window.onRidgeReady();")

func _setup_environment():
	environment=WorldEnvironment.new()
	var env=Environment.new()
	env.background_mode=Environment.BG_COLOR
	env.background_color=Color("bccdc8")
	env.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color=Color("d5dfd1")
	env.ambient_light_energy=.65
	env.tonemap_mode=Environment.TONE_MAPPER_FILMIC
	env.fog_enabled=true
	env.fog_light_color=Color("c8d3c5")
	env.fog_density=.0065
	environment.environment=env
	add_child(environment)
	sun=DirectionalLight3D.new()
	sun.light_color=Color("fff1d5")
	sun.light_energy=1.65
	sun.rotation_degrees=Vector3(-48,-36,0)
	sun.shadow_enabled=false
	add_child(sun)

func _reset_world(region:String,snow_tires:bool,progress:int):
	state=simulation.create_state(region,snow_tires)
	state.checkpoint=clampi(progress,0,3)
	if progress>0 and progress<4:simulation.recover(state)
	camera_mode=0
	orbit=0
	chunks.setup(region)
	if scenery:scenery.queue_free()
	scenery=Node3D.new()
	add_child(scenery)
	anchors.clear()
	checkpoint_rings.clear()
	_build_scenery(region)
	var snowy=region=="snow"
	environment.environment.background_color=Color("b9c7dd") if snowy else Color("c7d5c8")
	environment.environment.fog_light_color=Color("c2cce0") if snowy else Color("c4d0bd")
	environment.environment.ambient_light_color=Color("d0d8f1") if snowy else Color("d5dfd1")
	sun.light_color=Color("e9f0ff") if snowy else Color("fff1d5")
	vehicle.position=Vector3(state.x,state.y,state.z)
	camera.position=vehicle.position+Vector3(20,12,-23)
	target_camera=vehicle.position+Vector3(-10,1,17)

func _mat(color:Color,roughness:float=.85)->StandardMaterial3D:
	var key=color.to_html()+str(roughness)
	if material_cache.has(key):return material_cache[key]
	var material=StandardMaterial3D.new()
	material.albedo_color=color
	material.roughness=roughness
	material_cache[key]=material
	return material

func _box(parent:Node3D,position_:Vector3,size_:Vector3,color:Color)->MeshInstance3D:
	var node=MeshInstance3D.new()
	var geometry=BoxMesh.new()
	geometry.size=size_
	node.mesh=geometry
	node.material_override=_mat(color)
	node.position=position_
	parent.add_child(node)
	return node

func _cone(parent:Node3D,position_:Vector3,radius:float,height:float,color:Color,sides:int=6)->MeshInstance3D:
	var node=MeshInstance3D.new()
	var geometry=CylinderMesh.new()
	geometry.top_radius=0
	geometry.bottom_radius=radius
	geometry.height=height
	geometry.radial_segments=sides
	node.mesh=geometry
	node.material_override=_mat(color)
	node.position=position_
	parent.add_child(node)
	return node

func _build_scenery(region:String):
	var snowy=region=="snow"
	var rng=RandomNumberGenerator.new()
	rng.seed=6731
	for i in range(24):
		var angle=i*TAU/24.0
		var radius=280+rng.randf()*100
		var h=50+rng.randf()*100
		var pos=Vector3(sin(angle)*radius,h*.36-12,150+cos(angle)*radius)
		_cone(scenery,pos,45+rng.randf()*45,h,Color("97adc0") if snowy else Color("98ad98"),5)
		if snowy:
			_cone(scenery,pos+Vector3(0,h*.33,0),18,h*.35,Color("e6ebef"),5)
	for z0 in range(8,351,15):
		for side in [-1,1]:
			var z=float(z0)+rng.randf()*2
			var x=TerrainMath.route_x(z)+side*(7+rng.randf()*2)
			var y=TerrainMath.height_at(x,z,region)
			var h=4+rng.randf()*2
			anchors.append({"id":"anchor-"+str(anchors.size()),"x":x,"y":y+.65,"z":z,"r":.45})
			_box(scenery,Vector3(x,y+h*.25,z),Vector3(.26,h*.5,.26),Color("675b45"))
			_cone(scenery,Vector3(x,y+h*.59,z),h*.3,h*.75,Color("718b96") if snowy else Color("3c5e49"))
			_cone(scenery,Vector3(x,y+h*.85,z),h*.21,h*.56,Color("7b939d") if snowy else Color("4b6c50"))
	for i in range(checkpoints.size()):
		var cp=checkpoints[i]
		var cp_root=Node3D.new()
		cp_root.position=Vector3(cp.x,TerrainMath.height_at(cp.x,cp.z,region),cp.z)
		scenery.add_child(cp_root)
		for side in [-1,1]:
			_box(cp_root,Vector3(side*4,1.9,0),Vector3(.13,3.8,.13),Color("746449"))
			_box(cp_root,Vector3(side*4+.5,3.1,0),Vector3(1,.65,.07),Color("d6a265"))
		var ring=MeshInstance3D.new()
		var torus=TorusMesh.new()
		torus.inner_radius=3.68
		torus.outer_radius=3.78
		torus.rings=32
		torus.ring_segments=6
		ring.mesh=torus
		ring.material_override=_mat(Color("e0bf76"))
		ring.position.y=.18
		cp_root.add_child(ring)
		checkpoint_rings.append(ring)
		var cabin=Node3D.new()
		cabin.position=Vector3(cp.x+10,TerrainMath.height_at(cp.x+10,cp.z,region),cp.z)
		scenery.add_child(cabin)
		_box(cabin,Vector3(0,1.5,0),Vector3(5,3,4),Color("746c53"))
		for side in [-1,1]:
			var roof=_box(cabin,Vector3(side*1.35,3.35,0),Vector3(3.1,.17,4.7),Color("d8e2e8") if snowy else Color("425a49"))
			roof.rotation.z=-side*.42
		_box(cabin,Vector3(0,.95,-2.06),Vector3(1.05,1.9,.08),Color("303e32"))
		_box(cabin,Vector3(1.5,1.65,-2.07),Vector3(.9,.85,.08),Color("e7ce8c"))
		_box(cabin,Vector3(-1.5,1.65,-2.07),Vector3(.9,.85,.08),Color("e7ce8c"))
		_box(cabin,Vector3(0,2.5,-2.11),Vector3(2.2,.4,.1),Color("bda676"))
		var label=Label3D.new()
		label.text="REPAIR  +"
		label.font_size=36
		label.pixel_size=.006
		label.position=Vector3(0,2.5,-2.18)
		label.rotation.y=PI
		cabin.add_child(label)
		_box(cabin,Vector3(0,.12,-3.2),Vector3(5.4,.24,2.5),Color("958a69"))
	# A small base camp and the blue lake remain as distant navigation landmarks.
	var camp_y=TerrainMath.height_at(-10,0,region)
	_cone(scenery,Vector3(-10,camp_y+1.5,0),2.8,3,Color("be8857"),3)
	var water=MeshInstance3D.new()
	var disk=CylinderMesh.new()
	disk.top_radius=22
	disk.bottom_radius=22
	disk.height=.04
	disk.radial_segments=48
	water.mesh=disk
	water.material_override=_mat(Color("8daec6") if snowy else Color("71a6ab"),.25)
	water.position=Vector3(-55,.81,100)
	scenery.add_child(water)

func _process(dt):
	elapsed+=dt
	var input={"throttle":0,"reverse":0,"steer":0,"brake":false,"reel":false,"active":false}
	if js_enabled:
		var parsed=JSON.parse_string(JavaScriptBridge.eval("JSON.stringify(window.ridgeboundInput || {})"))
		if parsed is Dictionary:input.merge(parsed,true)
		var commands=JSON.parse_string(JavaScriptBridge.eval("JSON.stringify((window.ridgeboundCommands || []).splice(0))"))
		if commands is Array:
			for command in commands:_command(command)
	else:
		input.active=true
		input.throttle=1 if Input.is_physical_key_pressed(KEY_W) else 0
		input.reverse=1 if Input.is_physical_key_pressed(KEY_S) else 0
		input.steer=float(Input.is_physical_key_pressed(KEY_D))-float(Input.is_physical_key_pressed(KEY_A))
		input.brake=Input.is_physical_key_pressed(KEY_SPACE)
		playing=true
	var forward=Vector3(sin(state.yaw),0,cos(state.yaw))
	chunks.update_stream(Vector3(state.x,state.y,state.z),forward*state.speed,dt)
	if input.active:
		previous_position=Vector3(state.x,state.y,state.z)
		var obstacles=chunks.get_obstacles().duplicate()
		for anchor in anchors:
			if absf(anchor.z-state.z)<15:obstacles.append(anchor)
		simulation.step(state,input,minf(dt,.1),obstacles)
		blocked=not chunks.is_ready_at(state.x,state.z)
		if blocked:
			state.x=previous_position.x
			state.z=previous_position.z
			state.y=previous_position.y
			state.speed=0.0
	else:blocked=false
	state.repairAvailable=false
	for cp in checkpoints:
		if Vector2(state.x-cp.x-10,state.z-cp.z).length()<16:state.repairAvailable=true
	_update_vehicle(dt)
	_update_camera(dt)
	_update_cable()
	for i in range(checkpoint_rings.size()):checkpoint_rings[i].visible=i==int(state.checkpoint)
	report_clock+=dt
	if report_clock>.1:
		report_clock=0
		_report()

func _command(command:Dictionary):
	match command.get("type",""):
		"start":playing=true
		"reset":
			playing=command.get("playing",true)
			_reset_world(command.get("region","forest"),command.get("snowTires",false),int(command.get("progress",0)))
		"recover":simulation.recover(state)
		"gear":state.lowGear=not state.lowGear
		"awd":state.awd=not state.awd
		"tires":state.snowTires=true
		"attach":
			for anchor in anchors:
				if anchor.id==command.get("id",""):simulation.attach_winch(state,anchor)
		"detach":simulation.detach_winch(state)
		"camera":camera_mode=(camera_mode+1)%3;orbit=0
		"orbit":orbit+=float(command.get("delta",0))
		"repair":
			if state.repairAvailable:simulation.repair(state)

func _update_vehicle(dt):
	vehicle.position=Vector3(state.x,state.y,state.z)
	vehicle.rotation.y=state.yaw
	if body:
		body.rotation.x=-state.pitch
		body.rotation.z=state.roll
	for i in range(wheels.size()):
		if wheels[i]:
			wheels[i].rotation.x=float(state.wheelRotation)
			wheels[i].rotation.y=state.steering*.4 if i<2 else 0
			if state.has("wheelHeights"):wheels[i].position.y=state.wheelHeights[i]-state.y
	if steering:steering.rotation.z=-state.steering*2.5
	if speed_needle:speed_needle.rotation.z=-absf(state.speed)*.22
	if rpm_needle:rpm_needle.rotation.z=-absf(state.speed)*.16-.15

func _update_camera(dt):
	var base=vehicle.position
	var desired:Vector3
	var target:Vector3
	var forward=Vector3(sin(state.yaw),0,cos(state.yaw))
	if not playing:
		desired=base+Vector3(22,13,-23)
		target=base+Vector3(-9,1,17)
		camera.fov=52
	elif camera_mode==2:
		var local_camera=Vector3(-.47,1.58,-.45)
		desired=body.to_global(local_camera) if body else vehicle.to_global(local_camera)
		var basis_=vehicle.basis*body.basis if body else vehicle.basis
		target=desired+basis_*Vector3(0,-.14,1)*20
		camera.fov=78
	else:
		var distance=22.0 if camera_mode==1 else 12.5
		if get_viewport().get_visible_rect().size.x<get_viewport().get_visible_rect().size.y:distance+=3.5
		var yaw=state.yaw+orbit
		desired=base+Vector3(-sin(yaw)*distance,15 if camera_mode==1 else 6,-cos(yaw)*distance)
		desired.y=maxf(desired.y,TerrainMath.height_at(desired.x,desired.z,state.region)+2.5)
		target=base+forward*4+Vector3(0,1.25,0)
		camera.fov=52
	var alpha=1-exp(-dt*(14 if camera_mode==2 else 4))
	camera.position=camera.position.lerp(desired,alpha)
	target_camera=target_camera.lerp(target,alpha)
	camera.look_at(target_camera,Vector3.UP)

func _update_cable():
	cable.visible=state.winch!=null
	if not cable.visible:return
	var a=state.winch.anchor
	var start=vehicle.to_global(Vector3(0,.25,2.35))
	var finish=Vector3(a.x,a.y,a.z)
	var geometry=ImmediateMesh.new()
	geometry.surface_begin(Mesh.PRIMITIVE_LINE_STRIP)
	for i in range(17):
		var t=i/16.0
		var point=start.lerp(finish,t)
		point.y-=sin(t*PI)*.25
		geometry.surface_add_vertex(point)
	geometry.surface_end()
	cable.mesh=geometry

func _report():
	if not js_enabled:return
	var report=state.duplicate(true)
	report["cameraMode"]=camera_mode
	report["streaming"]=chunks.get_stats()
	report["blocked"]=blocked
	var visible_anchors=[]
	for anchor in anchors:
		var distance=Vector2(anchor.x-state.x,anchor.z-state.z).length()
		if distance<24 and distance>2:
			var point=Vector3(anchor.x,anchor.y+1.3,anchor.z)
			var screen=camera.unproject_position(point)
			var a=anchor.duplicate()
			a["d"]=distance
			a["sx"]=screen.x/get_viewport().get_visible_rect().size.x
			a["sy"]=screen.y/get_viewport().get_visible_rect().size.y
			a["visible"]=not camera.is_position_behind(point)
			visible_anchors.append(a)
	report["anchors"]=visible_anchors
	JavaScriptBridge.eval("window.onRidgeState && window.onRidgeState("+JSON.stringify(report)+");")
