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
var _anchor_visuals:Dictionary={}
var _anchor_center=Vector2(INF,INF)
const ANCHOR_RADIUS=96.0
const ANCHOR_SPACING=15.0
const SAFETY_COLUMNS=32
const SAFETY_ROWS=64
const SAFETY_MARGIN=256.0
var repair_sites:Array=[]
var checkpoints:Array=[]
var checkpoint_rings:Array=[]
var playing=false
var camera_mode=0
var orbit=0.0
var elapsed=0.0
var report_clock=0.0
var blocked=false
var previous_position=Vector3.ZERO
var streaming_waiting=false
var terrain_safety:MeshInstance3D
var coarse_triangles=0
var throttle_value=0.0
var sky_material:ProceduralSkyMaterial
var quality_clock=0.0
var contact_shadow:MeshInstance3D
var target_camera=Vector3.ZERO
var material_cache={}
var model_scene=preload("res://assets/ridge-rover.glb")
var js_enabled=false
# Browser sets this small bootstrap before starting the engine. Native tests may
# assign the same dictionary before adding the scene to the tree.
var bootstrap_options:Dictionary={}
var world_builds:int=0
var initialization_ms:float=0.0
var world_build_ms:float=0.0
var chunks_build_ms:float=0.0
var scenery_build_ms:float=0.0
var terrain_safety_meshes:Dictionary={}
var camera_up=Vector3.UP

func _ready():
	var initialized_at=Time.get_ticks_usec()
	js_enabled=OS.has_feature("web")
	var bootstrap=_read_bootstrap()
	checkpoints=TerrainMath.checkpoints()
	repair_sites=TerrainMath.repair_sites()
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
	camera.far=780
	camera.near=.06
	add_child(camera)
	camera.current=true
	_make_contact_shadow()
	cable=MeshInstance3D.new()
	add_child(cable)
	cable.material_override=_mat(Color("d8b770"))
	_reset_world(bootstrap.region,bootstrap.snowTires,bootstrap.progress)
	initialization_ms=float(Time.get_ticks_usec()-initialized_at)/1000.0
	_report()
	if js_enabled:JavaScriptBridge.eval("window.onRidgeReady && window.onRidgeReady();")

func _normalize_bootstrap(raw:Variant)->Dictionary:
	var result={"region":"forest","snowTires":false,"progress":0}
	if not raw is Dictionary:return result
	result.region="snow" if raw.get("region", "forest")=="snow" else "forest"
	var equipped=raw.get("snowTires",false)
	result.snowTires=equipped is bool and equipped
	var progress=raw.get("progress",0)
	if (progress is int or progress is float) and is_finite(float(progress)):
		var checkpoint=int(floor(float(progress)))
		# A completed expedition starts a fresh trip, matching the browser save UI.
		result.progress=checkpoint if checkpoint>0 and checkpoint<4 else 0
	return result

func _read_bootstrap()->Dictionary:
	var raw:Variant=bootstrap_options
	if js_enabled:
		raw=JSON.parse_string(JavaScriptBridge.eval("JSON.stringify(window.ridgeboundBootstrap || {})"))
	return _normalize_bootstrap(raw)

func _make_contact_shadow():
	# A single soft contact patch gives the tires weight without shadow maps.
	contact_shadow=MeshInstance3D.new()
	contact_shadow.name="VehicleContactShadow"
	var plane=PlaneMesh.new()
	plane.size=Vector2(4.0,6.2)
	contact_shadow.mesh=plane
	contact_shadow.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var shader=Shader.new()
	shader.code="shader_type spatial; render_mode unshaded, blend_mix, depth_draw_never, cull_disabled, shadows_disabled; void fragment(){ vec2 p=(UV-vec2(0.5))*2.0; float fade=1.0-smoothstep(0.3,1.0,length(p)); ALBEDO=vec3(0.10,0.14,0.09); ALPHA=fade*0.43; }"
	var material=ShaderMaterial.new()
	material.shader=shader
	contact_shadow.material_override=material
	add_child(contact_shadow)

func _setup_environment():
	environment=WorldEnvironment.new()
	var env=Environment.new()
	env.background_mode=Environment.BG_SKY
	sky_material=ProceduralSkyMaterial.new()
	sky_material.sky_top_color=Color("9bafa8")
	sky_material.sky_horizon_color=Color("d9c9ad")
	sky_material.ground_bottom_color=Color("718065")
	sky_material.ground_horizon_color=Color("d9c9ad")
	sky_material.sun_angle_max=8.0
	var sky=Sky.new()
	sky.sky_material=sky_material
	env.sky=sky
	env.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color=Color("d5dfd1")
	env.ambient_light_energy=.40
	env.tonemap_mode=Environment.TONE_MAPPER_LINEAR
	env.fog_enabled=true
	env.fog_light_color=Color("c8d3c5")
	env.fog_density=.007
	environment.environment=env
	add_child(environment)
	sun=DirectionalLight3D.new()
	sun.light_color=Color("fff1d5")
	sun.light_energy=.78
	sun.rotation_degrees=Vector3(-48,-36,0)
	sun.shadow_enabled=false
	sun.directional_shadow_mode=DirectionalLight3D.SHADOW_ORTHOGONAL
	sun.directional_shadow_max_distance=48.0
	add_child(sun)

func _reset_world(region:String,snow_tires:bool,progress:int):
	var build_started=Time.get_ticks_usec()
	world_builds+=1
	state=simulation.create_state(region,snow_tires)
	state.checkpoint=clampi(progress,0,3)
	if progress>0 and progress<4:simulation.recover(state)
	camera_mode=0
	orbit=0
	var chunks_started=Time.get_ticks_usec()
	chunks.setup(region,Vector3(state.x,state.y,state.z))
	chunks_build_ms=float(Time.get_ticks_usec()-chunks_started)/1000.0
	if scenery:
		scenery.hide()
		scenery.queue_free()
	scenery=Node3D.new()
	add_child(scenery)
	anchors.clear()
	_anchor_visuals.clear()
	_anchor_center=Vector2(INF,INF)
	checkpoint_rings.clear()
	var scenery_started=Time.get_ticks_usec()
	_build_scenery(region)
	scenery_build_ms=float(Time.get_ticks_usec()-scenery_started)/1000.0
	var snowy=region=="snow"
	environment.environment.background_color=Color("b9c7dd") if snowy else Color("c7d5c8")
	environment.environment.fog_light_color=Color("c2cce0") if snowy else Color("c1c6aa")
	sky_material.sky_top_color=Color("9bafc5") if snowy else Color("9bafa8")
	sky_material.sky_horizon_color=Color("d1dce2") if snowy else Color("d9c9ad")
	sky_material.ground_horizon_color=sky_material.sky_horizon_color
	environment.environment.ambient_light_color=Color("d0d8f1") if snowy else Color("d5dfd1")
	sun.light_color=Color("e9f0ff") if snowy else Color("fff1d5")
	vehicle.position=Vector3(state.x,state.y,state.z)
	camera.position=vehicle.position+Vector3(20,12,-23)
	target_camera=vehicle.position+Vector3(-10,1,17)
	camera_up=Vector3.UP
	world_build_ms=float(Time.get_ticks_usec()-build_started)/1000.0

func _mat(color:Color,roughness:float=.85)->StandardMaterial3D:
	var key=color.to_html()+str(roughness)
	if material_cache.has(key):return material_cache[key]
	var material=StandardMaterial3D.new()
	material.albedo_color=color
	material.roughness=roughness
	material.metallic_specular=.15
	material_cache[key]=material
	return material

func _box(parent:Node3D,position_:Vector3,size_:Vector3,color:Color)->MeshInstance3D:
	var node=MeshInstance3D.new()
	var geometry=BoxMesh.new()
	geometry.size=size_
	node.mesh=geometry
	node.material_override=_mat(color)
	node.position=position_
	node.visibility_range_end=96.0
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
	if height<15.0:node.visibility_range_end=96.0
	parent.add_child(node)
	return node

func _build_scenery(region:String):
	_build_terrain_safety(region)
	var snowy=region=="snow"
	var rng=RandomNumberGenerator.new()
	rng.seed=6731
	# A bounded set of silhouettes surrounds the whole valley, not only its start.
	for z0 in range(-150,4001,450):
		for side in [-1,1]:
			var x=side*(TerrainMath.MAX_X+120+rng.randf()*110)
			var z=float(z0)+rng.randf()*100
			var h=90+rng.randf()*100
			var pos=Vector3(x,TerrainMath.height_at(x,z,region)+h*.42-12,z)
			_cone(scenery,pos,85+rng.randf()*60,h,Color("97adc0") if snowy else Color("98ad98"),5)
			if snowy:
				_cone(scenery,pos+Vector3(0,h*.33,0),32,h*.35,Color("e6ebef"),5)
	_refresh_nearby_anchors(true)
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
		ring.visibility_range_end=96.0
		cp_root.add_child(ring)
		checkpoint_rings.append(ring)
	for site in repair_sites:
		var cabin=Node3D.new()
		cabin.position=Vector3(site.x,TerrainMath.height_at(site.x,site.z,region),site.z)
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
		label.visibility_range_end=96.0
		cabin.add_child(label)
		_box(cabin,Vector3(0,.12,-3.2),Vector3(5.4,.24,2.5),Color("958a69"))
	# A small base camp and the blue lake remain as distant navigation landmarks.
	var camp_y=TerrainMath.height_at(-10,0,region)
	_cone(scenery,Vector3(-10,camp_y+1.5,0),2.8,3,Color("be8857"),3)
	var water=MeshInstance3D.new()
	var disk=CylinderMesh.new()
	disk.top_radius=TerrainMath.LAKE_RADIUS
	disk.bottom_radius=TerrainMath.LAKE_RADIUS
	disk.height=.04
	disk.radial_segments=48
	water.mesh=disk
	water.material_override=_mat(Color("8daec6") if snowy else Color("71a6ab"),.25)
	water.position=Vector3(TerrainMath.LAKE_X,TerrainMath.LAKE_WATER_Y+.01,TerrainMath.LAKE_Z)
	scenery.add_child(water)

func _build_terrain_safety(region:String):
	# Fixed 4096 triangles cover all 8 km² plus an outer skirt. The fine 16 m
	# layer remains the only drivable ground; distant coverage never grows with tiles.
	var mesh:ArrayMesh
	if terrain_safety_meshes.has(region):
		mesh=terrain_safety_meshes[region]
	else:
		var tool=SurfaceTool.new()
		tool.begin(Mesh.PRIMITIVE_TRIANGLES)
		var snowy=region=="snow"
		var stride=SAFETY_COLUMNS+1
		var x_min=TerrainMath.MIN_X-SAFETY_MARGIN
		var z_min=TerrainMath.MIN_Z-SAFETY_MARGIN
		var x_step=(TerrainMath.MAX_X-TerrainMath.MIN_X+SAFETY_MARGIN*2)/SAFETY_COLUMNS
		var z_step=(TerrainMath.MAX_Z-TerrainMath.MIN_Z+SAFETY_MARGIN*2)/SAFETY_ROWS
		var points=PackedVector3Array()
		var colors=PackedColorArray()
		points.resize((SAFETY_COLUMNS+1)*(SAFETY_ROWS+1))
		colors.resize(points.size())
		for row in range(SAFETY_ROWS+1):
			for column in range(SAFETY_COLUMNS+1):
				var x=x_min+column*x_step
				var z=z_min+row*z_step
				var index=row*stride+column
				points[index]=Vector3(x,TerrainMath.height_at(x,z,region)-5.0,z)
				var variation=sin(x*.051+z*.039)*.035
				colors[index]=(Color("c5d5d9") if snowy else Color("a1ac7c")).lightened(variation)
		# A coarse face must not bridge a valley above its actual road. Conservatively
		# lower shared corners to the local centre and every road's sampled corridor.
		var samples=points.duplicate()
		for row in range(SAFETY_ROWS):
			for column in range(SAFETY_COLUMNS):
				var index=row*stride+column
				var x=x_min+(column+.5)*x_step
				var z=z_min+(row+.5)*z_step
				var minimum=TerrainMath.height_at(x,z,region)-5.0
				for corner in [index,index+1,index+stride,index+stride+1]:
					minimum=minf(minimum,samples[corner].y)
				for corner in [index,index+1,index+stride,index+stride+1]:
					points[corner].y=minf(points[corner].y,minimum)
		for road in range(-1,TerrainMath.BRANCHES.size()):
			var start=TerrainMath.MIN_Z if road<0 else float(TerrainMath.BRANCHES[road].start)
			var finish=TerrainMath.MAX_Z if road<0 else float(TerrainMath.BRANCHES[road].end)
			var z=start
			while z<=finish:
				var center=TerrainMath.route_x(z) if road<0 else TerrainMath.branch_x(road,z)
				for offset in [-7.0,0.0,7.0]:
					var x=center+offset
					var column=clampi(int(floor((x-x_min)/x_step)),0,SAFETY_COLUMNS-1)
					var row=clampi(int(floor((z-z_min)/z_step)),0,SAFETY_ROWS-1)
					var index=row*stride+column
					var height=TerrainMath.height_at(x,z,region)-3.4
					for corner in [index,index+1,index+stride,index+stride+1]:
						points[corner].y=minf(points[corner].y,height)
				z+=8.0
		for row in range(SAFETY_ROWS):
			for column in range(SAFETY_COLUMNS):
				var a=row*stride+column
				for triangle in [[a,a+stride,a+1],[a+1,a+stride,a+stride+1]]:
					var normal=(points[triangle[1]]-points[triangle[0]]).cross(points[triangle[2]]-points[triangle[0]]).normalized()
					for index in [triangle[0],triangle[2],triangle[1]]:
						tool.set_color(colors[index])
						tool.set_normal(normal)
						tool.add_vertex(points[index])
		var material=StandardMaterial3D.new()
		material.vertex_color_use_as_albedo=true
		material.vertex_color_is_srgb=true
		material.metallic_specular=0.0
		material.roughness=1.0
		tool.set_material(material)
		mesh=tool.commit()
		terrain_safety_meshes[region]=mesh
	coarse_triangles=mesh.surface_get_array_len(0)/3
	terrain_safety=MeshInstance3D.new()
	terrain_safety.name="ResidentTerrainSilhouette"
	terrain_safety.mesh=mesh
	terrain_safety.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	scenery.add_child(terrain_safety)

func _refresh_nearby_anchors(force:bool=false):
	var position_=Vector2(state.x,state.z)
	if not force and _anchor_center.is_finite() and position_.distance_squared_to(_anchor_center)<144.0:return
	_anchor_center=position_
	var next:Array=[]
	var ids:Dictionary={}
	var first=int(floor((state.z-ANCHOR_RADIUS)/ANCHOR_SPACING))
	var last=int(ceil((state.z+ANCHOR_RADIUS)/ANCHOR_SPACING))
	# Only about 14 longitudinal samples per nearby road, independent of map size.
	for road in range(-1,TerrainMath.BRANCHES.size()):
		for sample in range(first,last+1):
			var rng=RandomNumberGenerator.new()
			rng.seed=(sample*73856093) ^ ((road+2)*19349663) ^ 6731
			var z=sample*ANCHOR_SPACING+8.0+rng.randf()*2
			if z<TerrainMath.MIN_Z or z>TerrainMath.MAX_Z:continue
			if road>=0 and (z<TerrainMath.BRANCHES[road].start or z>TerrainMath.BRANCHES[road].end):continue
			var x0=TerrainMath.route_x(z) if road<0 else TerrainMath.branch_x(road,z)
			var x1=TerrainMath.route_x(z+1) if road<0 else TerrainMath.branch_x(road,z+1)
			var shoulder=sqrt(1.0+pow(x1-x0,2.0))
			for side in [-1,1]:
				var x=x0+side*(7.5+rng.randf()*2)*shoulder
				var h=4+rng.randf()*2
				if position_.distance_squared_to(Vector2(x,z))>ANCHOR_RADIUS*ANCHOR_RADIUS:continue
				if TerrainMath.road_distance(x,z)<6.0 or TerrainMath.surface_at(x,z,state.region)=="water":continue
				var id="anchor-%d-%d-%d" % [road,sample,side]
				ids[id]=true
				next.append({"id":id,"x":x,"y":TerrainMath.height_at(x,z,state.region)+.65,"z":z,"r":.45,"height":h})
	if state.winch!=null:
		var attached=state.winch.anchor
		if not ids.has(attached.id) and position_.distance_to(Vector2(attached.x,attached.z))<64.0:
			ids[attached.id]=true
			next.append(attached.duplicate())
	for id in _anchor_visuals.keys():
		if not ids.has(id):
			_anchor_visuals[id].hide()
			_anchor_visuals[id].queue_free()
			_anchor_visuals.erase(id)
	anchors=next

func _update_anchor_layers():
	_refresh_nearby_anchors()
	var snowy=state.region=="snow"
	for anchor in anchors:
		var id=anchor.id
		var layer_ready=chunks.props_ready_at(anchor.x,anchor.z)
		if _anchor_visuals.has(id):
			if not layer_ready:
				_anchor_visuals[id].hide()
				_anchor_visuals[id].queue_free()
				_anchor_visuals.erase(id)
			continue
		if not layer_ready or Vector2(anchor.x-state.x,anchor.z-state.z).length()<4.0:
			continue
		var group=Node3D.new()
		group.name=id
		group.position=Vector3(anchor.x,anchor.y-.65,anchor.z)
		scenery.add_child(group)
		var h=float(anchor.height)
		_box(group,Vector3(0,h*.25,0),Vector3(.26,h*.5,.26),Color("675b45"))
		_cone(group,Vector3(0,h*.59,0),h*.3,h*.75,Color("718b96") if snowy else Color("3c5e49"))
		_cone(group,Vector3(0,h*.85,0),h*.21,h*.56,Color("7b939d") if snowy else Color("4b6c50"))
		_anchor_visuals[id]=group

func _can_repair()->bool:
	for site in repair_sites:
		if Vector2(state.x-site.x,state.z-site.z).length()<16.0:
			return true
	return false

func _process(dt):
	elapsed+=dt
	var input={"throttle":0,"reverse":0,"steer":0,"brake":false,"brakeValue":0.0,"reel":false,"active":false}
	if js_enabled:
		var parsed=JSON.parse_string(JavaScriptBridge.eval("JSON.stringify(window.ridgeboundInput || {})"))
		if parsed is Dictionary:input.merge(parsed,true)
		var commands=JSON.parse_string(JavaScriptBridge.eval("JSON.stringify((window.ridgeboundCommands || []).splice(0))"))
		if commands is Array:
			for command in commands:
				if command is Dictionary:_command(command)
	else:
		input.active=true
		input.throttle=1 if Input.is_physical_key_pressed(KEY_W) else 0
		input.reverse=1 if Input.is_physical_key_pressed(KEY_S) else 0
		input.steer=float(Input.is_physical_key_pressed(KEY_D))-float(Input.is_physical_key_pressed(KEY_A))
		input.brake=Input.is_physical_key_pressed(KEY_SPACE)
		playing=true
	var forward=Vector3(sin(state.yaw),0,cos(state.yaw))
	chunks.update_stream(Vector3(state.x,state.y,state.z),forward*state.speed,dt)
	_update_anchor_layers()
	quality_clock+=dt
	if quality_clock>1.0:
		quality_clock=0.0
		var average_ms=float(chunks.get_stats().avgMs)
		var target_scale=.6 if average_ms>60.0 else (.75 if average_ms>35.0 else .9)
		get_viewport().scaling_3d_scale=target_scale
	streaming_waiting=false
	if input.active:
		# Start slowing before the fine-terrain boundary; the final position guard
		# below remains mandatory for a slow device, a cable pull or a large frame.
		var travel_direction=forward*signf(float(state.speed))
		var stopping_distance=3.2+state.speed*state.speed/14.0
		var lookahead=Vector3(state.x,state.y,state.z)+travel_direction*stopping_distance
		if absf(state.speed)>.35 and not chunks.is_ready_at(lookahead.x,lookahead.z):
			streaming_waiting=true
			input.throttle=0.0
			input.reverse=0.0
			input.brakeValue=maxf(float(input.brakeValue),.65)
		previous_position=Vector3(state.x,state.y,state.z)
		var previous_state=state.duplicate(true)
		var obstacles=chunks.get_obstacles().duplicate()
		for anchor in anchors:
			if _anchor_visuals.has(anchor.id) and absf(anchor.z-state.z)<15:obstacles.append(anchor)
		simulation.step(state,input,minf(dt,.1),obstacles)
		blocked=not chunks.is_ready_at(state.x,state.z)
		if blocked:
			# Reject all effects of an unsafe step, including spring samples,
			# checkpoint rewards, damage and cable length, not only coordinates.
			state=previous_state
			state.speed=0.0
			state.yVel=0.0
	else:blocked=false
	state.steer=state.steering
	state.repairAvailable=_can_repair()
	throttle_value=float(input.throttle) if input.active else 0.0
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
		"recover":
			simulation.recover(state)
			if not chunks.is_ready_at(state.x,state.z):
				chunks.setup(state.region,Vector3(state.x,state.y,state.z))
			vehicle.position=Vector3(state.x,state.y,state.z)
			camera.position=vehicle.position+Vector3(0,6,-12)
			target_camera=vehicle.position+Vector3(0,1,4)
		"gear":state.lowGear=not state.lowGear
		"awd":state.awd=not state.awd
		"tires":state.snowTires=true
		"attach":
			for anchor in anchors:
				if anchor.id==command.get("id","") and _anchor_visuals.has(anchor.id):simulation.attach_winch(state,anchor)
		"detach":simulation.detach_winch(state)
		"camera":camera_mode=(camera_mode+1)%3;orbit=0
		"photo":_take_photo()
		"orbit":orbit+=float(command.get("delta",0))
		"repair":
			if _can_repair():simulation.repair(state)

func _update_vehicle(dt):
	vehicle.position=Vector3(state.x,state.y,state.z)
	vehicle.rotation.y=state.yaw
	if body:
		body.rotation.x=-state.pitch
		body.rotation.z=state.roll
	for i in range(wheels.size()):
		if wheels[i]:
			wheels[i].rotation.x=float(state.wheelRotation)
			wheels[i].rotation.y=-state.steering*.4 if i<2 else 0
			if state.has("wheelHeights"):wheels[i].position.y=state.wheelHeights[i]-state.y
	# Blender local Z becomes local Y in the exported glTF coordinate system.
	if steering:steering.rotation.y=state.steering*2.5
	if speed_needle:speed_needle.rotation.y=-absf(state.speed)*.22
	if rpm_needle:rpm_needle.rotation.y=-absf(state.speed)*.16-.15-throttle_value*.65
	if contact_shadow:
		var x=float(state.x)
		var z=float(state.z)
		var fx=sin(state.yaw)
		var fz=cos(state.yaw)
		var front=TerrainMath.height_at(x+fx,z+fz,state.region)
		var back=TerrainMath.height_at(x-fx,z-fz,state.region)
		var left=TerrainMath.height_at(x-fz,z+fx,state.region)
		var right=TerrainMath.height_at(x+fz,z-fx,state.region)
		contact_shadow.position=Vector3(x,TerrainMath.height_at(x,z,state.region)+.16,z)
		contact_shadow.rotation=Vector3(-atan((front-back)*.5),state.yaw,atan((right-left)*.5))

func _update_camera(dt):
	var base=vehicle.position
	var desired:Vector3
	var target:Vector3
	var desired_up=Vector3.UP
	var forward=Vector3(sin(state.yaw),0,cos(state.yaw))
	if not playing:
		desired=base+Vector3(22,13,-23)
		target=base+Vector3(-9,1,17)
		camera.fov=52
	elif camera_mode==2:
		var local_camera=Vector3(.47,1.58,-.45)
		var yaw_basis=Basis(Vector3.UP,float(state.yaw))
		# Keep road feel while damping suspension motion instead of rigidly
		# inheriting the sprung body's full pitch, roll and head-position arc.
		var pitch_sway=clampf(float(state.pitch)*.28,-.12,.12)
		var roll_sway=clampf(float(state.roll)*.18,-.06,.06)
		var head_basis=yaw_basis*Basis(Vector3.RIGHT,-pitch_sway)*Basis(Vector3.BACK,roll_sway)
		desired=base+yaw_basis*local_camera
		target=desired+head_basis*Vector3(0,-.14,1)*20
		desired_up=head_basis*Vector3.UP
		camera.fov=78
	else:
		var distance=22.0 if camera_mode==1 else 12.5
		if get_viewport().get_visible_rect().size.x<get_viewport().get_visible_rect().size.y:distance+=3.5
		var yaw=state.yaw+orbit
		desired=base+Vector3(-sin(yaw)*distance,15 if camera_mode==1 else 6,-cos(yaw)*distance)
		desired.y=maxf(desired.y,TerrainMath.height_at(desired.x,desired.z,state.region)+2.5)
		target=base+forward*4+Vector3(0,1.25,0)
		camera.fov=52
	var alpha=1-exp(-dt*(6 if camera_mode==2 else 4))
	camera.position=camera.position.lerp(desired,alpha)
	target_camera=target_camera.lerp(target,alpha)
	camera_up=camera_up.lerp(desired_up,alpha).normalized()
	camera.look_at(target_camera,camera_up)

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

func _take_photo():
	if not js_enabled:return
	await RenderingServer.frame_post_draw
	var image=get_viewport().get_texture().get_image()
	if image==null:return
	var data_url="data:image/png;base64,"+Marshalls.raw_to_base64(image.save_png_to_buffer())
	JavaScriptBridge.eval("window.onRidgePhoto && window.onRidgePhoto("+JSON.stringify(data_url)+");")

func get_snapshot()->Dictionary:
	var report=state.duplicate(true)
	report["steer"]=state.steering
	report["cameraMode"]=camera_mode
	report["streaming"]=chunks.get_stats()
	report["blocked"]=blocked or streaming_waiting
	report["coarseTriangles"]=coarse_triangles
	report["areaName"]=TerrainMath.area_name(state.x,state.z,state.region)
	report["nearbyAnchors"]=anchors.size()
	report["renderScale"]=get_viewport().scaling_3d_scale
	report["startup"]={"worldBuilds":world_builds,"initializationMs":snappedf(initialization_ms,.01),"worldBuildMs":snappedf(world_build_ms,.01),"chunksMs":snappedf(chunks_build_ms,.01),"sceneryMs":snappedf(scenery_build_ms,.01)}
	report["playing"]=playing
	var visible_anchors=[]
	for anchor in anchors:
		if not _anchor_visuals.has(anchor.id):continue
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
	return report

func _report():
	if not js_enabled:return
	var report=get_snapshot()
	JavaScriptBridge.eval("window.onRidgeState && window.onRidgeState("+JSON.stringify(report)+");")
