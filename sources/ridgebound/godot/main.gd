extends Node3D

const ExpeditionArt := preload("res://expedition_art.gd")
const RecoveryWinch := preload("res://recovery_winch.gd")

const SolidGeometry = preload("res://solid_geometry.gd")
const MapImporter = preload("res://map_importer.gd")

var simulation=OffroadPhysics.new()
var state:Dictionary
var chunks:ChunkTerrain
var camera:Camera3D
var vehicle:Node3D
var body:Node3D
var wheels:Array=[]
var shock_rods: Array[Node3D] = []
var shock_rest_heights: Array[float] = []
var winch_outlet: Node3D
var rear_winch_outlet: Node3D
var graphics_profile := "auto"
var steering_rest := Basis.IDENTITY
var driver_eye_local := Vector3(0.423, 1.2392, -0.45)
var speed_needle_rest := Basis.IDENTITY
var rpm_needle_rest := Basis.IDENTITY
var steering:Node3D
var speed_needle:Node3D
var rpm_needle:Node3D
var environment:WorldEnvironment
var sun:DirectionalLight3D
var scenery:Node3D
var cable:MeshInstance3D
var anchors:Array=[]
var _anchor_visuals:Dictionary={}
var _anchor_solids: Dictionary = {}
var _scenery_solid_cells: Dictionary = {}
var import_result: Dictionary = {}
const SCENERY_CELL_SIZE: float = 32.0
var _anchor_center=Vector2(INF,INF)
const ANCHOR_RADIUS=96.0
const ANCHOR_SPACING=15.0
const SAFETY_MARGIN: float = 2048.0
const SAFETY_Y: float = -500.0
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
# Native desktop owns pause and controller input through this optional provider.
var desktop_input_provider: Callable

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
	_setup_environment()
	chunks=ChunkTerrain.new()
	add_child(chunks)
	vehicle=model_scene.instantiate()
	add_child(vehicle)
	body=vehicle.find_child("Body",true,false)
	for corner: String in ["FL", "FR", "RL", "RR"]:
		wheels.append(vehicle.find_child("Wheel_" + corner, true, false))
		var shock := vehicle.find_child("ShockRod_" + corner, true, false) as Node3D
		shock_rods.append(shock)
		shock_rest_heights.append(shock.position.y if shock else 0.0)
	winch_outlet = vehicle.find_child("WinchOutlet", true, false) as Node3D
	rear_winch_outlet = vehicle.find_child("RearWinchOutlet", true, false) as Node3D
	var driver_eye := vehicle.find_child("DriverEye", true, false) as Node3D
	if driver_eye:
		driver_eye_local = vehicle.to_local(driver_eye.global_position)
	steering=vehicle.find_child("SteeringWheel",true,false)
	speed_needle=vehicle.find_child("SpeedNeedle",true,false)
	rpm_needle=vehicle.find_child("RPMNeedle",true,false)
	if steering:
		steering_rest = steering.basis
	if speed_needle:
		speed_needle_rest = speed_needle.basis
	if rpm_needle:
		rpm_needle_rest = rpm_needle.basis
	camera=Camera3D.new()
	camera.fov=52
	camera.far=1850
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
	environment = WorldEnvironment.new()
	environment.environment = Environment.new()
	environment.environment.background_mode = Environment.BG_SKY
	sky_material = ProceduralSkyMaterial.new()
	var sky := Sky.new()
	sky.sky_material = sky_material
	environment.environment.sky = sky
	add_child(environment)
	sun = DirectionalLight3D.new()
	add_child(sun)
	ExpeditionArt.apply_quality(get_viewport(), sun, graphics_profile)

func _reset_world(region:String,snow_tires:bool,progress:int):
	var build_started=Time.get_ticks_usec()
	world_builds+=1
	if region == "custom" and TerrainMath.custom_summary().is_empty():
		region = "forest"
	checkpoints = TerrainMath.checkpoints(region)
	repair_sites = TerrainMath.repair_sites(region)
	simulation.ground_height_provider = Callable()
	state=simulation.create_state(region,snow_tires)
	state.checkpoint=clampi(progress,0,3) if region != "custom" else 0
	if state.checkpoint > 0:
		simulation.recover(state)
	camera_mode=0
	orbit=0
	var chunks_started=Time.get_ticks_usec()
	chunks.setup(region,Vector3(state.x,state.y,state.z))
	simulation.ground_height_provider = Callable(chunks, "ground_height_at")
	simulation._reset_suspension(state)
	chunks_build_ms=float(Time.get_ticks_usec()-chunks_started)/1000.0
	if scenery:
		scenery.hide()
		scenery.queue_free()
	scenery=Node3D.new()
	add_child(scenery)
	anchors.clear()
	_anchor_visuals.clear()
	_anchor_solids.clear()
	_scenery_solid_cells.clear()
	_anchor_center=Vector2(INF,INF)
	checkpoint_rings.clear()
	var scenery_started=Time.get_ticks_usec()
	_build_scenery(region)
	scenery_build_ms=float(Time.get_ticks_usec()-scenery_started)/1000.0
	ExpeditionArt.apply_atmosphere(environment.environment, sky_material, sun, region)
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

func _box(parent:Node3D,position_:Vector3,size_:Vector3,color:Color,roll:float=0.0,solid:bool=true,climbable:bool=false)->MeshInstance3D:
	var node=MeshInstance3D.new()
	var geometry=BoxMesh.new()
	geometry.size=size_
	node.mesh=geometry
	node.material_override=_mat(color)
	node.position=position_
	node.rotation.z=roll
	node.visibility_range_end=96.0
	parent.add_child(node)
	if solid:
		var descriptor: Dictionary = SolidGeometry.mesh(node.mesh.get_faces(), node.global_transform, "rock") if climbable else _solid_for_node(node)
		_register_scenery_solid(descriptor)
	return node

func _cone(parent:Node3D,position_:Vector3,radius:float,height:float,color:Color,sides:int=6,solid:bool=true)->MeshInstance3D:
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
	if solid:
		_register_scenery_solid(_solid_for_node(node))
	return node

func _solid_for_node(node: MeshInstance3D) -> Dictionary:
	var box_mesh := node.mesh as BoxMesh
	if box_mesh:
		return SolidGeometry.box(node.global_position, box_mesh.size * 0.5, node.global_basis)
	return SolidGeometry.mesh(node.mesh.get_faces(), node.global_transform)

func _scenery_cell(x: float, z: float) -> Vector2i:
	return Vector2i(int(floor(x / SCENERY_CELL_SIZE)), int(floor(z / SCENERY_CELL_SIZE)))

func _register_scenery_solid(solid: Dictionary) -> void:
	var key: Vector2i = _scenery_cell(solid.x, solid.z)
	if not _scenery_solid_cells.has(key):
		_scenery_solid_cells[key] = []
	_scenery_solid_cells[key].append(solid)

func _nearby_scene_obstacles(radius: float) -> Array:
	var x: float = state.x
	var z: float = state.z
	var center := Vector2(x, z)
	var obstacles: Array = chunks.obstacles_near(x, z, radius)
	var extent: float = radius + 6.0
	var first: Vector2i = _scenery_cell(x - extent, z - extent)
	var last: Vector2i = _scenery_cell(x + extent, z + extent)
	for row: int in range(first.y, last.y + 1):
		for col: int in range(first.x, last.x + 1):
			for solid: Dictionary in _scenery_solid_cells.get(Vector2i(col, row), []):
				var reach: float = radius + float(solid.r)
				if center.distance_squared_to(Vector2(solid.x, solid.z)) <= reach * reach:
					obstacles.append(solid)
	for anchor: Dictionary in anchors:
		if _anchor_solids.has(anchor.id) and center.distance_squared_to(Vector2(anchor.x, anchor.z)) <= extent * extent:
			obstacles.append_array(_anchor_solids[anchor.id])
	return obstacles

func _build_scenery(region:String):
	_build_terrain_safety(region)
	if region == "custom":
		return
	var snowy=region=="snow"
	_refresh_nearby_anchors(true)
	for i in range(checkpoints.size()):
		var cp=checkpoints[i]
		var cp_root=Node3D.new()
		cp_root.position=Vector3(cp.x,TerrainMath.height_at(cp.x,cp.z,region),cp.z)
		cp_root.rotation.y=TerrainMath.heading_at(cp.z)
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
			_box(cabin,Vector3(side*1.35,3.35,0),Vector3(3.1,.17,4.7),Color("d8e2e8") if snowy else Color("425a49"),-side*.42)
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
		_box(cabin,Vector3(0,.12,-3.2),Vector3(5.4,.24,2.5),Color("958a69"),0.0,true,true)
	# A small base camp and the blue lake remain as distant navigation landmarks.
	var camp_y=TerrainMath.height_at(-10,0,region)
	_cone(scenery,Vector3(-10,camp_y+1.5,0),2.8,3,Color("be8857"),3)
	# Liquid water is a surface effect over a solid bed. Frozen lakes use
	# their collision terrain directly, avoiding an offset visual ice plane.
	var liquid_lakes: Array = [] if snowy else TerrainMath.water_bodies(region)
	for site: Dictionary in liquid_lakes:
		var water := MeshInstance3D.new()
		var disk := CylinderMesh.new()
		disk.top_radius = site.radius
		disk.bottom_radius = site.radius
		disk.height = 0.04
		disk.radial_segments = 64
		water.mesh = disk
		water.material_override = ExpeditionArt.water_material(snowy)
		water.position = Vector3(site.x, site.y + 0.01, site.z)
		scenery.add_child(water)
	for site: Dictionary in TerrainMath.landmarks(region):
		_build_lookout(site, region)

func _build_lookout(site: Dictionary, region: String) -> void:
	# The high marker has a clear silhouette and belongs beside the pullout,
	# outside the driving corridor. The station and flags mark its entrance.
	var marker := Node3D.new()
	marker.position = Vector3(site.x, TerrainMath.height_at(site.x, site.z, region), site.z)
	scenery.add_child(marker)
	var frame := _box(marker, Vector3(0, 3, 0), Vector3(1.2, 6, 1.2), Color("70685d"))
	frame.visibility_range_end = 480.0
	var cap := _cone(marker, Vector3(0, 7, 0), 1.8, 2.0, Color("de9864"), 6)
	cap.visibility_range_end = 480.0
	_box(marker, Vector3(0, 1.1, 0), Vector3(3.8, 0.36, 3.8), Color("8a7555"))
	for side: float in [-1.0, 1.0]:
		_box(marker, Vector3(side * 1.7, 1.9, 0), Vector3(0.10, 0.12, 3.5), Color("bdac87"))
		_box(marker, Vector3(side * 1.75, 1.4, 1.7), Vector3(0.11, 1.0, 0.11), Color("746449"))
	var label := Label3D.new()
	label.text = "LOOKOUT"
	label.position = Vector3(0, 3.4, -0.65)
	label.rotation.y = PI
	label.pixel_size = 0.008
	label.visibility_range_end = 75.0
	marker.add_child(label)

func _build_terrain_safety(region: String) -> void:
	# Only two triangles stay resident globally. The scrolling visual layers
	# supply actual height detail, and the near layer controls drivable ground.
	var mesh: ArrayMesh
	if terrain_safety_meshes.has(region):
		mesh = terrain_safety_meshes[region]
	else:
		var bounds: Rect2 = TerrainMath.bounds_for(region)
		var x_min: float = bounds.position.x - SAFETY_MARGIN
		var x_max: float = bounds.end.x + SAFETY_MARGIN
		var z_min: float = bounds.position.y - SAFETY_MARGIN
		var z_max: float = bounds.end.y + SAFETY_MARGIN
		var safety_height: float = SAFETY_Y
		if region == "custom":
			safety_height = float(TerrainMath.custom_summary().get("minHeight", -100000.0)) - 32.0
		var a := Vector3(x_min, safety_height, z_min)
		var b := Vector3(x_max, safety_height, z_min)
		var c := Vector3(x_min, safety_height, z_max)
		var d := Vector3(x_max, safety_height, z_max)
		var material: StandardMaterial3D = _mat(Color("b4c7cd") if region == "snow" else Color("818f73"))
		var tool := SurfaceTool.new()
		tool.begin(Mesh.PRIMITIVE_TRIANGLES)
		for point: Vector3 in [a, b, c, b, d, c]:
			tool.set_normal(Vector3.UP)
			tool.add_vertex(point)
		tool.set_material(material)
		mesh = tool.commit()
		terrain_safety_meshes[region] = mesh
	coarse_triangles = mesh.surface_get_array_len(0) / 3
	terrain_safety = MeshInstance3D.new()
	terrain_safety.name = "OpaqueTerrainUnderlay"
	terrain_safety.mesh = mesh
	terrain_safety.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	scenery.add_child(terrain_safety)

func _refresh_nearby_anchors(force:bool=false):
	if state.region == "custom":
		return
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
				next.append({"id":id,"x":x,"y":chunks.ground_height_at(x,z)+.65,"z":z,"r":.45,"height":h})
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
			_anchor_solids.erase(id)
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
				_anchor_solids.erase(id)
			continue
		if not layer_ready or Vector2(anchor.x-state.x,anchor.z-state.z).length()<4.0:
			continue
		var group=Node3D.new()
		group.name=id
		var base_height: float = chunks.ground_height_at(anchor.x, anchor.z)
		anchor.y = base_height + 0.65
		group.position=Vector3(anchor.x,base_height,anchor.z)
		scenery.add_child(group)
		var h=float(anchor.height)
		var trunk := _box(group,Vector3(0,h*.25,0),Vector3(.26,h*.5,.26),Color("675b45"),0.0,false)
		var lower := _cone(group,Vector3(0,h*.59,0),h*.3,h*.75,Color("718b96") if snowy else Color("3c5e49"),6,false)
		var upper := _cone(group,Vector3(0,h*.85,0),h*.21,h*.56,Color("7b939d") if snowy else Color("4b6c50"),6,false)
		_anchor_solids[id] = [_solid_for_node(trunk), _solid_for_node(lower), _solid_for_node(upper)]
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
	elif desktop_input_provider.is_valid():
		var sampled: Variant = desktop_input_provider.call()
		if sampled is Dictionary:
			input.merge(sampled, true)
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
	if quality_clock >= 1.25:
		quality_clock = 0.0
		if graphics_profile == "auto" and not desktop_input_provider.is_valid():
			ExpeditionArt.apply_quality(get_viewport(), sun, graphics_profile, float(chunks.get_stats().avgMs))
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
			input.brakeAssist = 0.65
		previous_position=Vector3(state.x,state.y,state.z)
		var previous_state=state.duplicate(true)
		simulation.step(state, input, minf(dt, 0.1), _nearby_scene_obstacles(6.0))
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
		"import_map":_import_map(command)
		"quality":
			var requested := String(command.get("profile", "auto"))
			if requested in ["auto", "quality", "performance"]:
				graphics_profile = requested
				ExpeditionArt.apply_quality(get_viewport(), sun, graphics_profile, float(chunks.get_stats().avgMs))
		"reset":
			playing=command.get("playing",true)
			_reset_world(command.get("region","forest"),command.get("snowTires",false),int(command.get("progress",0)))
		"recover":
			simulation.recover(state)
			if not chunks.is_ready_at(state.x,state.z):
				chunks.setup(state.region,Vector3(state.x,state.y,state.z))
			simulation._reset_suspension(state)
			vehicle.position=Vector3(state.x,state.y,state.z)
			camera.position=vehicle.position+Vector3(0,6,-12)
			target_camera=vehicle.position+Vector3(0,1,4)
		"gear":state.lowGear=not state.lowGear
		"awd":state.awd=not state.awd
		"tires":state.snowTires=true
		"attach":
			for anchor in anchors:
				if anchor.id == command.get("id", "") and _anchor_visuals.has(anchor.id):
					simulation.attach_winch(state, anchor, String(command.get("endpoint", "front")))
					break
		"detach":simulation.detach_winch(state)
		"camera":camera_mode=(camera_mode+1)%3;orbit=0
		"photo":_take_photo()
		"orbit":orbit+=float(command.get("delta",0))
		"repair":
			if _can_repair():simulation.repair(state)

func _import_map(command: Dictionary) -> void:
	var path: Variant = command.get("path")
	var request_id: Variant = command.get("requestId")
	import_result = {"ok": false, "requestId": request_id, "error": "请选择地图 ZIP 文件。"}
	if not path is String or String(path).is_empty():
		return
	if js_enabled and path != "/tmp/ridgebound-import.zip":
		return
	var result: Dictionary = MapImporter.load_zip(path)
	if js_enabled:
		DirAccess.remove_absolute(path)
	if not result.get("ok", false):
		import_result.error = result.get("error", "地图导入失败。")
		return
	TerrainMath.install_custom(result.data)
	terrain_safety_meshes.erase("custom")
	import_result = {"ok": true, "requestId": request_id, "summary": result.summary}
	playing = true
	_reset_world("custom", bool(state.snowTires), 0)

func _update_vehicle(dt):
	var road_yaw := float(state.get("roadSteeringAngle", -float(state.steering) * OffroadPhysics.MAX_ROAD_STEER))
	vehicle.position=Vector3(state.x,state.y,state.z)
	vehicle.rotation.y=state.yaw
	if body:
		body.rotation.x=-state.pitch
		body.rotation.z=state.roll
	for i in range(wheels.size()):
		if wheels[i]:
			wheels[i].rotation.x=float(state.wheelRotation)
			wheels[i].rotation.y=road_yaw if i<2 else 0.0
			if state.has("wheelHeights"):wheels[i].position.y=state.wheelHeights[i]-state.y
		var shock: Node3D = shock_rods[i]
		if shock:
			shock.position.y = shock_rest_heights[i] + float(state.suspension[i])
	# Preserve the imported tilt of each pivot as it rotates about local Y.
	# Blender local Z becomes local Y in the exported glTF coordinate system.
	if steering:
		# World road yaw already maps a right input to negative rotation.
		steering.basis = steering_rest * Basis(Vector3.UP, road_yaw * 16.0)
	if speed_needle:
		speed_needle.basis = speed_needle_rest * Basis(Vector3.UP, -absf(state.speed) * 0.22)
	if rpm_needle:
		rpm_needle.basis = rpm_needle_rest * Basis(Vector3.UP, -absf(state.speed) * 0.16 - 0.15 - throttle_value * 0.65)
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
		var local_camera: Vector3 = driver_eye_local
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
	# At kilometer-scale coordinates, single-precision interpolation can round
	# a small step away entirely. Finish the transition inside 1.5 cm.
	const SETTLE_DISTANCE_SQUARED: float = 0.000225
	if camera.position.distance_squared_to(desired) < SETTLE_DISTANCE_SQUARED:
		camera.position = desired
	else:
		camera.position = camera.position.lerp(desired, alpha)
	if target_camera.distance_squared_to(target) < SETTLE_DISTANCE_SQUARED:
		target_camera = target
	else:
		target_camera = target_camera.lerp(target, alpha)
	camera_up=camera_up.lerp(desired_up,alpha).normalized()
	camera.look_at(target_camera,camera_up)

func _update_cable():
	cable.visible = state.winch != null
	if not cable.visible:
		return
	var line: Dictionary = state.winch
	var endpoint := String(line.get("endpoint", "front"))
	var socket: Node3D = rear_winch_outlet if endpoint == "rear" else winch_outlet
	var start := socket.global_position if socket else RecoveryWinch.mount(state, endpoint)
	var finish := Vector3(float(line.anchor.x), float(line.anchor.y), float(line.anchor.z))
	var axis := finish - start
	if axis.length_squared() < 0.0001:
		cable.visible = false
		return
	var tangent := axis.normalized()
	var right := tangent.cross(Vector3.UP)
	right = right.normalized() if right.length_squared() > 0.0001 else Vector3.RIGHT
	var up := tangent.cross(right).normalized()
	var sag := clampf((float(line.length) - axis.length()) * 0.65, 0.015, 1.45)
	var geometry := cable.mesh as ImmediateMesh
	if geometry == null:
		geometry = ImmediateMesh.new()
		cable.mesh = geometry
	geometry.clear_surfaces()
	geometry.surface_begin(Mesh.PRIMITIVE_TRIANGLE_STRIP)
	for step: int in range(14):
		var t0 := float(step) / 14.0
		var t1 := float(step + 1) / 14.0
		var current := start.lerp(finish, t0) - Vector3.UP * sin(t0 * PI) * sag
		var next := start.lerp(finish, t1) - Vector3.UP * sin(t1 * PI) * sag
		for side: int in range(7):
			var angle := TAU * side / 6.0
			var normal := right * cos(angle) + up * sin(angle)
			geometry.surface_set_normal(normal)
			geometry.surface_add_vertex(current + normal * 0.021)
			geometry.surface_set_normal(normal)
			geometry.surface_add_vertex(next + normal * 0.021)
	geometry.surface_end()

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
	report["graphicsProfile"]=graphics_profile
	report["startup"]={"worldBuilds":world_builds,"initializationMs":snappedf(initialization_ms,.01),"worldBuildMs":snappedf(world_build_ms,.01),"chunksMs":snappedf(chunks_build_ms,.01),"sceneryMs":snappedf(scenery_build_ms,.01)}
	report["playing"]=playing
	report["customMap"] = TerrainMath.custom_summary()
	report["importResult"] = import_result
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
