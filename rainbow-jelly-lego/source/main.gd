extends Node3D

const Visuals = preload("res://brick_visuals.gd")
const DIMS = [Vector3(2,1.2,4),Vector3(2,1.2,2),Vector3(1,1.2,4),Vector3(1,1.2,2),Vector3(1,1.2,1),Vector3(2,.4,4),Vector3(2,.4,2)]
const CAP = 300
var bricks: Array = []
var links: Array = []
var jobs: Array = []
var blueprint: Array = []
var pool_shapes: Array = []
var plate: StaticBody3D
var cam: Camera3D
var pivot: Node3D
var board_origin = Vector3.ZERO
var jelly = .64
var grip = .65
var tool = 0
var shape = 0
var next_color = 0
var rotate_index = 0
var sim_clock = 0.0
var paused = false
var slow = false
var cinema = false
var demo = false
var demo_freeze = -1.0
var demo_clock = 0.0
var demo_phase = 0
var demo_origin = 0.0
var demo_cycle = 0
var phase_clock = 0.0
var pouring = false
var pour_clock = 0.0
var quake_clock = 0.0
var quake_level = 0
var last_quake = -99.0
var yaw = .70
var elevation = .50
var distance = 72.0
var zoom = 1.0
var camera_height = 12.0
var record_height = 0
var tallest = 0
var record_timer = 0.0
var stats_clock = 0.0
var graph_dirty = false
var parent: Array = []
var anchored_groups: Dictionary = {}
var quality_level = 0
var slow_frames = 0.0
var milestones: Dictionary = {}
var sway = Vector2.ZERO
var sway_velocity = Vector2.ZERO
var shake_phase = 0.0
var held = -1
var dragging = false
var orbiting = false
var pointer_down = Vector2.ZERO
var pointer_last = Vector2.ZERO
var pointer_time = 0.0
var pointer_hit: Dictionary = {}
var drag_plane: Plane
var hold_target = Vector3.ZERO
var hold_last = Vector3.ZERO
var hold_velocity = Vector3.ZERO
var hold_anchor = Vector3.ZERO
var pointers: Dictionary = {}
var pinch_distance = 0.0
var ghost: Node3D
var ghost_body: MeshInstance3D
var ghost_place: Dictionary = {}
var rng = RandomNumberGenerator.new()
var physics_ready = false
var qa_mode = false
var pending_events: Array = []

func _ready() -> void:
	rng.seed = 192734
	Visuals.prepare()
	Visuals.make_world(self)
	blueprint = JSON.parse_string(FileAccess.get_file_as_string("res://blueprint.json"))
	plate = StaticBody3D.new()
	plate.name = "BaseplateCollider"
	add_child(plate)
	var floor_shape = CollisionShape3D.new()
	var floor_box = BoxShape3D.new()
	floor_box.size = Vector3(32,.55,32)
	floor_box.margin = .005
	floor_shape.shape = floor_box
	floor_shape.position.y = -.275
	plate.add_child(floor_shape)
	var table = StaticBody3D.new()
	add_child(table)
	var table_shape = CollisionShape3D.new()
	var table_box = BoxShape3D.new()
	table_box.size = Vector3(68,1.2,62)
	table_shape.shape = table_box
	table_shape.position.y = -1.2
	table.add_child(table_shape)
	var surface = PhysicsMaterial.new()
	surface.friction = .68
	surface.bounce = .06
	plate.physics_material_override = surface
	table.physics_material_override = surface
	for d in DIMS:
		var box = BoxShape3D.new()
		box.size = d - Vector3(.035,.015,.035)
		box.margin = .005
		pool_shapes.append(box)
	for i in range(CAP):
		var body = RigidBody3D.new()
		body.name = "Brick%03d" % i
		body.mass = .12
		body.continuous_cd = true
		body.can_sleep = true
		body.contact_monitor = true
		body.max_contacts_reported = 4
		body.linear_damp = 1.1
		body.angular_damp = 2.0
		body.physics_material_override = surface
		body.freeze = true
		body.collision_layer = 0
		body.collision_mask = 0
		add_child(body)
		body.position = Vector3(0,-100-i*2,0)
		body.set_meta("brick_id",i)
		var collider = CollisionShape3D.new()
		collider.shape = pool_shapes[0]
		body.add_child(collider)
		var skin = Visuals.make_brick(0,0)
		body.add_child(skin)
		skin.hide()
		body.body_entered.connect(_on_contact.bind(i))
		bricks.append({"body":body,"skin":skin,"collider":collider,"active":false,"shape":0,"color":0,"clear":false,"snapped":false,"base_anchor":false,"gx":0,"gz":0,"rot":0,"bottom":0.0,"base":Vector3.ZERO,"squash":0.0,"spring":0.0,"age":0.0,"retire":0.0,"flight":{},"manual":false,"chain":0,"group":i,"ground":false})
		parent.append(i)
	for i in range(650):
		var joint = Generic6DOFJoint3D.new()
		joint.name = "StudConnection%03d" % i
		joint.exclude_nodes_from_collision = true
		add_child(joint)
		links.append({"joint":joint,"active":false,"a":-1,"b":-1,"area":0.0,"anchor_a":Vector3.ZERO,"anchor_b":Vector3.ZERO,"rest_basis":Basis.IDENTITY,"age":0.0,"strain":0.0})
	pivot = Node3D.new()
	add_child(pivot)
	cam = Camera3D.new()
	cam.fov = 37
	cam.near = .1
	cam.far = 250
	pivot.add_child(cam)
	cam.current = true
	ghost = Node3D.new()
	add_child(ghost)
	ghost_body = MeshInstance3D.new()
	var gm = BoxMesh.new()
	gm.size = DIMS[0]
	ghost_body.mesh = gm
	var ghost_mat = StandardMaterial3D.new()
	ghost_mat.albedo_color = Color(1,.85,.5,.32)
	ghost_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	ghost_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	ghost_body.material_override = ghost_mat
	ghost.add_child(ghost_body)
	ghost.hide()
	if OS.has_feature("web"):
		var settings = JSON.parse_string(str(JavaScriptBridge.eval("JSON.stringify(Object.fromEntries(new URLSearchParams(location.search)))",true)))
		if settings is Dictionary:
			demo = str(settings.get("demo","")) == "1"
			if settings.has("t"): demo_freeze = fposmod(float(settings.t),4.0)
		JavaScriptBridge.eval("window.toyNativeReady=true",true)
	else:
		qa_mode = "--qa" in OS.get_cmdline_user_args()
	physics_ready = true
	demo_origin = Time.get_ticks_msec()/1000.0
	_update_camera(1.0)
	if demo: elevation = .28
	if not qa_mode: build(demo)
	_send_event({"type":"ready","engine":"Godot 4.6 · Jolt"})

func dimensions(sh: int, rot: int = 0) -> Vector3:
	var d: Vector3 = DIMS[clampi(sh,0,6)]
	if rot % 2 == 1: return Vector3(d.z,d.y,d.x)
	return d

func spawn(sh: int,col: int,pos: Vector3,rot: int=0,clear_brick: bool=false) -> int:
	var id = -1
	var oldest = -1
	var oldest_time = INF
	for i in range(CAP):
		var b: Dictionary = bricks[i]
		if not b.active and id < 0: id = i
		elif b.active and not b.snapped and b.body.sleeping and b.age < oldest_time and b.retire <= 0:
			oldest_time = b.age
			oldest = i
	if id < 0:
		if oldest >= 0: bricks[oldest].retire = .28
		return -1
	var b: Dictionary = bricks[id]
	b.active = true
	b.shape = clampi(sh,0,6)
	b.color = posmod(col,6)
	b.clear = clear_brick
	b.snapped = false
	b.base_anchor = false
	b.rot = posmod(rot,4)
	b.retire = 0.0
	b.squash = 0.0
	b.spring = 0.0
	b.age = sim_clock
	b.flight = {}
	b.manual = false
	b.chain = 0
	b.group = id
	b.skin.scale = Vector3.ONE
	b.skin.position = Vector3.ZERO
	b.skin.rotation = Vector3.ZERO
	Visuals.update_brick(b.skin,b.shape,b.color,b.clear)
	b.skin.show()
	b.collider.shape = pool_shapes[b.shape]
	var body: RigidBody3D = b.body
	body.freeze = true
	body.transform = Transform3D(Basis(Vector3.UP,b.rot*PI/2),pos)
	body.linear_velocity = Vector3.ZERO
	body.angular_velocity = Vector3.ZERO
	body.mass = maxf(.06,DIMS[b.shape].x*DIMS[b.shape].z*.025*(.55 if sh >= 5 else 1.0))
	body.collision_layer = 1
	body.collision_mask = 1
	body.freeze = false
	body.sleeping = false
	graph_dirty = true
	if active_count() >= 100: milestone("hundred","100 块积木，随你发挥。")
	return id

func active_count() -> int:
	var n = 0
	for b in bricks:
		if b.active: n += 1
	return n

func remove_brick(id: int) -> void:
	var b: Dictionary = bricks[id]
	for l in links:
		if l.active and (l.a == id or l.b == id): cut_link(l)
	b.body.freeze = true
	b.body.collision_layer = 0
	b.body.collision_mask = 0
	b.body.position = Vector3(0,-100-id*2,0)
	b.body.linear_velocity = Vector3.ZERO
	b.body.angular_velocity = Vector3.ZERO
	b.skin.hide()
	b.active = false
	b.snapped = false
	b.base_anchor = false
	b.flight = {}
	graph_dirty = true

func reset() -> void:
	jobs.clear()
	for l in links:
		if l.active: cut_link(l)
	for i in range(CAP):
		if bricks[i].active: remove_brick(i)
	held = -1
	dragging = false
	ghost.hide()
	pouring = false
	quake_clock = 0
	plate.position = Vector3.ZERO
	sway = Vector2.ZERO
	sway_velocity = Vector2.ZERO
	record_timer = 0
	tallest = 0
	next_color = 0
	graph_dirty = true

func find_placement(gx: int,gz: int,sh: int,rot: int,ignore: int=-1,explicit_bottom: float=-1) -> Dictionary:
	var d = dimensions(sh,rot)
	var bottom = maxf(0,explicit_bottom)
	var supports: Array = []
	var result = {"valid":false,"gx":gx,"gz":gz,"rot":rot,"bottom":bottom,"pos":Vector3(gx+d.x/2,bottom+d.y/2,gz+d.z/2),"supports":supports}
	if gx < -16 or gz < -16 or gx+d.x > 16 or gz+d.z > 16: return result
	if explicit_bottom < 0:
		for b in bricks:
			if not b.active or not b.snapped or b.body.get_meta("brick_id") == ignore: continue
			if not group_anchored(b.group): continue
			var bd = dimensions(b.shape,b.rot)
			if gx < b.gx+bd.x-.02 and gx+d.x > b.gx+.02 and gz < b.gz+bd.z-.02 and gz+d.z > b.gz+.02:
				bottom = maxf(bottom,b.bottom+bd.y)
	result.bottom = bottom
	result.pos.y = bottom+d.y/2+.008
	for i in range(CAP):
		var b: Dictionary = bricks[i]
		if not b.active or i == ignore or not b.flight.is_empty() or b.retire > 0: continue
		var bd = dimensions(b.shape,b.rot)
		var bp: Vector3 = b.base if b.snapped and group_anchored(b.group) else b.body.position
		if absf(result.pos.x-bp.x) < (d.x+bd.x)/2-.035 and absf(result.pos.z-bp.z) < (d.z+bd.z)/2-.035:
			if bp.y-bd.y/2 < bottom+d.y-.025 and bp.y+bd.y/2 > bottom+.03: return result
			if b.snapped and group_anchored(b.group) and absf(b.bottom+bd.y-bottom) < .03: supports.append(i)
	result.valid = bottom < .03 or not supports.is_empty()
	return result

func connect_bricks(a: int,b: int,area: float,world_anchor: Vector3) -> void:
	for l in links:
		if l.active: continue
		var joint: Generic6DOFJoint3D = l.joint
		joint.global_position = world_anchor
		joint.global_basis = Basis.IDENTITY
		for axis in range(3):
			joint.set_flag_x(Generic6DOFJoint3D.FLAG_ENABLE_LINEAR_LIMIT,true) if axis == 0 else joint.set_flag_y(Generic6DOFJoint3D.FLAG_ENABLE_LINEAR_LIMIT,true) if axis == 1 else joint.set_flag_z(Generic6DOFJoint3D.FLAG_ENABLE_LINEAR_LIMIT,true)
			set_joint_param(joint,axis,Generic6DOFJoint3D.PARAM_LINEAR_LOWER_LIMIT,0)
			set_joint_param(joint,axis,Generic6DOFJoint3D.PARAM_LINEAR_UPPER_LIMIT,0)
			set_joint_flag(joint,axis,Generic6DOFJoint3D.FLAG_ENABLE_ANGULAR_LIMIT,true)
			set_joint_param(joint,axis,Generic6DOFJoint3D.PARAM_ANGULAR_LOWER_LIMIT,0)
			set_joint_param(joint,axis,Generic6DOFJoint3D.PARAM_ANGULAR_UPPER_LIMIT,0)
		joint.node_a = bricks[a].body.get_path()
		joint.node_b = bricks[b].body.get_path()
		l.active = true
		l.a = a
		l.b = b
		l.area = area
		l.anchor_a = bricks[a].body.to_local(world_anchor)
		l.anchor_b = bricks[b].body.to_local(world_anchor)
		l.rest_basis = bricks[a].body.basis.inverse()*bricks[b].body.basis
		l.age = sim_clock
		l.strain = 0.0
		graph_dirty = true
		return

func set_joint_param(j: Generic6DOFJoint3D,axis: int,param: int,value: float) -> void:
	if axis == 0: j.set_param_x(param,value)
	elif axis == 1: j.set_param_y(param,value)
	else: j.set_param_z(param,value)

func set_joint_flag(j: Generic6DOFJoint3D,axis: int,flag: int,value: bool) -> void:
	if axis == 0: j.set_flag_x(flag,value)
	elif axis == 1: j.set_flag_y(flag,value)
	else: j.set_flag_z(flag,value)

func cut_link(l: Dictionary) -> void:
	l.joint.node_a = NodePath("")
	l.joint.node_b = NodePath("")
	PhysicsServer3D.joint_clear(l.joint.get_rid())
	l.active = false
	if l.a >= 0 and bricks[l.a].active: bricks[l.a].body.sleeping = false
	if l.b >= 0 and bricks[l.b].active: bricks[l.b].body.sleeping = false
	graph_dirty = true

func place(id: int,gx: int,gz: int,rot: int=0,bottom: float=-1) -> bool:
	var b: Dictionary = bricks[id]
	var p = find_placement(gx,gz,b.shape,rot,id,bottom)
	if not p.valid: return false
	b.body.freeze = true
	b.body.transform = Transform3D(Basis(Vector3.UP,rot*PI/2),p.pos)
	b.base = p.pos
	b.gx = gx
	b.gz = gz
	b.rot = rot
	b.bottom = p.bottom
	b.snapped = true
	b.base_anchor = p.bottom < .03
	b.flight = {}
	b.body.linear_velocity = Vector3.ZERO
	b.body.angular_velocity = Vector3.ZERO
	b.body.freeze = b.base_anchor
	b.body.sleeping = false
	b.squash = .16
	b.spring = 0
	for other_id in p.supports:
		var other: Dictionary = bricks[other_id]
		var bd = dimensions(b.shape,rot)
		var od = dimensions(other.shape,other.rot)
		var x0 = maxf(gx,other.gx)
		var z0 = maxf(gz,other.gz)
		var x1 = minf(gx+bd.x,other.gx+od.x)
		var z1 = minf(gz+bd.z,other.gz+od.z)
		connect_bricks(id,other_id,(x1-x0)*(z1-z0),Vector3((x0+x1)/2,p.bottom,(z0+z1)/2))
	graph_dirty = true
	sway_velocity += Vector2(rng.randf_range(-.12,.12),rng.randf_range(-.1,.1))
	sound("snap",p.bottom/1.2)
	milestone("first","咔嗒，刚刚好。")
	if b.manual:
		b.chain = 1 if b.color == 0 else 0
		for other_id in p.supports:
			var other: Dictionary = bricks[other_id]
			if other.manual and other.color == b.color-1 and other.chain == b.color and other.gx == gx and other.gz == gz: b.chain = b.color+1
		if b.chain > 0: sound("note",b.chain)
		if b.chain == 6:
			sway_velocity.y += 4
			sound("chord",1)
			toast("完美彩虹！")
	return true

func group_root(i: int) -> int:
	while parent[i] != i:
		parent[i] = parent[parent[i]]
		i = parent[i]
	return i

func rebuild_graph() -> void:
	for i in range(CAP): parent[i] = i
	for l in links:
		if not l.active: continue
		var a = group_root(l.a)
		var b = group_root(l.b)
		if a != b: parent[maxi(a,b)] = mini(a,b)
	var degrees = PackedInt32Array()
	degrees.resize(CAP)
	for l in links:
		if l.active:
			degrees[l.a] += 1
			degrees[l.b] += 1
	for i in range(CAP):
		bricks[i].group = group_root(i)
		if bricks[i].active and bricks[i].flight.is_empty() and degrees[i] == 0 and not bricks[i].base_anchor: bricks[i].snapped = false
	anchored_groups.clear()
	for b in bricks:
		if b.active and b.base_anchor: anchored_groups[b.group] = true
	graph_dirty = false

func group_anchored(group: int) -> bool:
	return anchored_groups.has(group)

func stack(gx: int,gz: int,sh: int=-1) -> bool:
	if sh < 0: sh = shape
	var p = find_placement(gx,gz,sh,rotate_index)
	if not p.valid: return false
	jobs.append({"at":sim_clock,"shape":sh,"color":next_color,"gx":gx,"gz":gz,"rot":rotate_index,"bottom":p.bottom,"duration":.28,"manual":true,"clear":false,"drop":true})
	next_color = (next_color+1)%6
	_send_event({"type":"queue","nextColor":next_color})
	return true

func build(fast: bool=false) -> void:
	if active_count()+jobs.size()+167 > CAP:
		toast("先腾点地方，再盖一座摩天楼。")
		return
	var offset = Vector2.ZERO
	var found = false
	for v in [Vector2.ZERO,Vector2(-10,0),Vector2(10,0),Vector2(0,-10),Vector2(0,10)]:
		var occupied = false
		for job in jobs:
			if absf(float(job.gx)+dimensions(job.shape,job.rot).x/2-v.x) < 4 and absf(float(job.gz)+dimensions(job.shape,job.rot).z/2-v.y) < 4: occupied = true
		for b in bricks:
			if b.active and absf(b.body.position.x-v.x) < 5 and absf(b.body.position.z-v.y) < 5: occupied = true
		if not occupied:
			offset = v
			found = true
			break
	if not found:
		toast("留出 8 × 8 的空地，就能开工。")
		return
	var total = 1.98 if fast else 8.0
	var duration = .24 if fast else .48
	for n in range(blueprint.size()):
		var b: Dictionary = blueprint[n]
		jobs.append({"at":sim_clock+float(n)/(blueprint.size()-1)*(total-duration),"shape":int(b.shape),"color":int(b.color),"gx":int(b.gx+offset.x),"gz":int(b.gz+offset.y),"rot":int(b.rot),"bottom":float(b.y),"duration":duration,"manual":false,"clear":bool(b.get("clear",false)),"drop":false})
	sound("build",1)
	if not fast: toast("一块一块，盖起小小城市。")

func tower() -> void:
	var offset = Vector2.ZERO
	for v in [Vector2.ZERO,Vector2(-5,0),Vector2(5,0),Vector2(0,-5),Vector2(0,5),Vector2(-5,-5)]:
		var occupied = false
		for job in jobs:
			if absf(float(job.gx)+dimensions(job.shape,job.rot).x/2-v.x) < 4 and absf(float(job.gz)+dimensions(job.shape,job.rot).z/2-v.y) < 4: occupied = true
		for b in bricks:
			if b.active and absf(b.body.position.x-v.x) < 2.5 and absf(b.body.position.z-v.y) < 2.5: occupied = true
		if not occupied:
			offset = v
			break
	if active_count()+jobs.size()+24 > CAP: return
	for i in range(24):
		jobs.append({"at":sim_clock+i*.12,"shape":1,"color":i%6,"gx":int(offset.x)-1,"gz":int(offset.y)-1,"rot":0,"bottom":i*1.2,"duration":.26,"manual":false,"clear":false,"drop":true})

func pour(n: int=25) -> void:
	for i in range(clampi(n,1,CAP)):
		var sh = rng.randi_range(0,6)
		var id = spawn(sh,rng.randi_range(0,5),Vector3(rng.randf_range(-9,9),rng.randf_range(15,27)+float(i/25)*.4,rng.randf_range(-9,9)),rng.randi_range(0,3))
		if id >= 0:
			var body: RigidBody3D = bricks[id].body
			body.rotation.x = rng.randf_range(-.8,.8)
			body.rotation.z = rng.randf_range(-.8,.8)
			body.linear_velocity = Vector3(rng.randf_range(-2,2),-2,rng.randf_range(-2,2))
			body.angular_velocity = Vector3(rng.randf_range(-3,3),rng.randf_range(-2,2),rng.randf_range(-3,3))
	sound("pour",1)

func poke(id: int,direction: Vector3=Vector3(1,0,.3),strength: float=1.0) -> void:
	if id < 0 or not bricks[id].active: return
	var b: Dictionary = bricks[id]
	b.body.sleeping = false
	b.spring += 4
	if b.snapped and group_anchored(b.group):
		sway_velocity += Vector2(direction.x,direction.z)*strength*(2+jelly*3)
		b.body.apply_central_impulse(direction*strength*.14)
	else:
		b.body.apply_impulse(direction*strength*.7+Vector3.UP*.18,Vector3(0,.3,0))
	sound("poke",jelly)

func fracture_near(point: Vector3,force: float,radius: float) -> void:
	var changed = false
	for l in links:
		if not l.active or sim_clock-l.age < .15: continue
		var a: Dictionary = bricks[l.a]
		var p: Vector3 = a.body.to_global(l.anchor_a)
		var r = p.distance_to(point)
		if r > radius: continue
		var local_force = force*(1-r/radius)
		var resistance = (.7+grip*2.6)*sqrt(l.area)
		if local_force > resistance:
			cut_link(l)
			changed = true
	for b in bricks:
		if b.active and b.base_anchor and b.body.position.distance_to(point) < radius*.6 and force > 2+grip*4:
			b.base_anchor = false
			b.body.freeze = false
			b.body.sleeping = false
			changed = true
	if changed:
		milestone("collapse","要倒啦！")
		sound("pop",1)
		graph_dirty = true

func smash(point: Vector3,strength: float=1) -> void:
	fracture_near(point,8*strength,6.25)
	for b in bricks:
		if not b.active or not b.flight.is_empty(): continue
		var delta: Vector3 = b.body.position-point
		var r = delta.length()
		if r > 6.25: continue
		var direction = delta.normalized()
		if Vector2(direction.x,direction.z).length() < .1: direction = Vector3(sin(yaw),.25,cos(yaw)).normalized()
		b.body.sleeping = false
		b.body.apply_impulse((direction+Vector3.UP*.38)*(1-r/6.25)*strength*.8,Vector3(0,.15,0))
		b.spring += 5
	sway_velocity += Vector2(sin(yaw),cos(yaw))*7
	sound("smash",1)

func quake() -> void:
	quake_level = mini(3,quake_level+1) if sim_clock-last_quake < 10 else 1
	last_quake = sim_clock
	quake_clock = 4
	toast("震级 "+["","4.1","5.8","7.2"][quake_level])
	sound("quake",quake_level)

func shake() -> void:
	for b in bricks:
		if not b.active or b.body.freeze or not b.flight.is_empty(): continue
		b.body.sleeping = false
		b.body.apply_central_impulse(Vector3(rng.randf_range(-.12,.12),.45,rng.randf_range(-.12,.12)))
	sway_velocity += Vector2(8,3)
	sound("shake",1)

func empty() -> void:
	jobs.clear()
	for b in bricks:
		if not b.active: continue
		b.base_anchor = false
		b.body.freeze = false
		b.body.sleeping = false
		b.body.apply_central_impulse(Vector3(15,2,.4)*b.body.mass)
		b.retire = 2.2
	graph_dirty = true
	toast("腾出地方，再搭一座。")

func _on_contact(other: Node,id: int) -> void:
	var b: Dictionary = bricks[id]
	if not b.active or not b.flight.is_empty(): return
	var v: float = b.body.linear_velocity.length()
	if v > 1:
		b.spring = minf(8,b.spring+v*.25)
		sound("tap" if other == plate else "clack",v)

func _physics_process(dt: float) -> void:
	if not physics_ready: return
	if paused: return
	sim_clock = demo_clock if demo and demo_freeze < 0 else sim_clock+dt
	if demo and demo_freeze >= 0 and sim_clock > demo_freeze:
		PhysicsServer3D.set_active(false)
		paused = true
		return
	if graph_dirty: rebuild_graph()
	var job_index = 0
	while job_index < jobs.size():
		var job: Dictionary = jobs[job_index]
		if job.at > sim_clock:
			job_index += 1
			continue
		var d = dimensions(job.shape,job.rot)
		var target = Vector3(job.gx+d.x/2,job.bottom+d.y/2+.008,job.gz+d.z/2)
		var a = rng.randf()*TAU
		var start: Vector3 = target+Vector3(0,3,0) if job.drop else Vector3(sin(a)*25,maxf(10,target.y+5),cos(a)*25)
		var id = spawn(job.shape,job.color,start,job.rot,job.clear)
		if id >= 0:
			var b: Dictionary = bricks[id]
			b.body.freeze = true
			b.body.collision_layer = 0
			b.body.collision_mask = 0
			b.manual = job.manual
			b.flight = {"start":start,"target":target,"at":job.at,"duration":job.duration,"gx":job.gx,"gz":job.gz,"rot":job.rot,"bottom":job.bottom,"arc":0.0 if job.drop else 4.0}
		jobs.remove_at(job_index)
	if pouring:
		pour_clock += dt*40
		if pour_clock >= 1:
			var count = int(pour_clock)
			pour_clock -= count
			pour(count)
	if quake_clock > 0:
		quake_clock = maxf(0,quake_clock-dt)
		var elapsed = 4-quake_clock
		var envelope = sin(PI*elapsed/4)
		var movement = Vector3(sin(elapsed*8.3),0,sin(elapsed*6.5)*.45)*envelope*(.09*quake_level)
		plate.position = movement
		var acceleration = Vector3(sin(elapsed*8.3),0,sin(elapsed*6.5)*.45)*envelope*(8+quake_level*9)*(3.0 if quake_level == 3 else 1.0)
		sway_velocity += Vector2(acceleration.x,acceleration.z)*dt*.4
		for b in bricks:
			if not b.active or not b.flight.is_empty(): continue
			if b.base_anchor:
				b.body.position = b.base+movement
			else:
				b.body.sleeping = false
				b.body.apply_central_force(acceleration*b.body.mass*(.35+maxf(0,b.body.position.y)/25))
		if quake_level >= 2:
			for l in links:
				if not l.active or sim_clock-l.age < .5: continue
				var b: Dictionary = bricks[l.a]
				var height = b.body.position.y
				var response = absf(acceleration.x)*height/40*(.25 if quake_level == 2 else 1.0)
				var resistance = (1.8+grip*4.5)*sqrt(l.area)
				if response > resistance*(1.0 if quake_level == 2 else .7):
					var release_point: Vector3 = b.body.to_global(l.anchor_a)-b.body.global_position
					cut_link(l)
					b.body.apply_impulse(acceleration.normalized()*b.body.mass*(3.5 if quake_level == 3 else .8),release_point)
					milestone("collapse","要倒啦！")
					break
	else:
		plate.position = plate.position.lerp(Vector3.ZERO,minf(1,dt*12))
		for b in bricks:
			if b.active and b.base_anchor: b.body.position = b.base+plate.position
	var omega = lerpf(13.5,7.0,jelly)
	sway_velocity += (-omega*omega*sway-sway_velocity*3.8)*dt
	sway += sway_velocity*dt
	if sway.length() < .001 and sway_velocity.length() < .005:
		sway = Vector2.ZERO
		sway_velocity = Vector2.ZERO
	for i in range(CAP):
		var b: Dictionary = bricks[i]
		if not b.active: continue
		if not b.flight.is_empty():
			var f: Dictionary = b.flight
			var u = clampf((sim_clock-f.at)/f.duration,0,1)
			var ease = smoothstep(0,1,u)
			b.body.position = f.start.lerp(f.target,ease)+Vector3.UP*sin(u*PI)*f.arc
			b.body.rotation = Vector3(sin(u*PI)*.15,f.rot*PI/2+(1-u)*.35,0)
			b.skin.scale = Vector3.ONE*minf(1,.2+u*3)
			if u >= 1:
				var gx = int(f.gx)
				var gz = int(f.gz)
				var rot = int(f.rot)
				var bottom = float(f.bottom)
				b.flight = {}
				b.body.collision_layer = 1
				b.body.collision_mask = 1
				if not place(i,gx,gz,rot,bottom):
					b.body.freeze = false
					b.body.sleeping = false
			continue
		var body: RigidBody3D = b.body
		if body.linear_velocity.length() > 30: body.linear_velocity = body.linear_velocity.limit_length(30)
		if body.angular_velocity.length() > 16: body.angular_velocity = body.angular_velocity.limit_length(16)
		b.spring += (-pow(lerpf(58,40,jelly),2)*b.squash-14*b.spring)*dt
		b.squash = clampf(b.squash+b.spring*dt,-.13,.25)
		var squash: float = b.squash
		var bulge = 1/sqrt(1-squash)
		b.skin.scale = Vector3(bulge,1-squash,bulge)
		b.skin.position = Vector3.ZERO
		b.skin.rotation = Vector3.ZERO
		if b.snapped and group_anchored(b.group):
			var u = clampf(b.base.y/40,0,1)
			b.skin.position = Vector3(sway.x,0,sway.y)*u*u*.35
			b.skin.rotation = Vector3(sway.y,0,-sway.x)*u*.018
		if b.retire > 0:
			b.retire -= dt
			if b.retire < .28: b.skin.scale *= maxf(0,b.retire/.28)
			if b.retire <= 0: remove_brick(i)
		elif body.position.y < -10: b.retire = .28
	if held >= 0 and dragging:
		var b: Dictionary = bricks[held]
		if b.active and not b.body.freeze:
			var delta: Vector3 = hold_target-b.body.position
			b.body.apply_central_force((delta*95-b.body.linear_velocity*16)*b.body.mass)
			b.body.apply_torque(-b.body.angular_velocity*b.body.mass*2)
			if b.snapped and delta.length() > 1+grip*3: fracture_near(b.body.position,8,1.5)
			b.body.sleeping = false
	_update_height(dt)

func _update_height(dt: float) -> void:
	var height = 0.0
	var all_rest = true
	for b in bricks:
		if b.active and b.snapped and group_anchored(b.group):
			height = maxf(height,b.body.position.y+DIMS[b.shape].y/2)
			if not b.body.freeze and not b.body.sleeping: all_rest = false
	tallest = roundi(height/1.2)
	if all_rest and jobs.is_empty() and quake_clock <= 0:
		record_timer += dt
		if record_timer > 2: record_height = maxi(record_height,tallest)
	else: record_timer = 0
	for h in [10,25,40]:
		if tallest >= h: milestone("height%d"%h,"叠到 %d 块高啦！"%h)

func _process(dt: float) -> void:
	if not physics_ready: return
	if OS.has_feature("web"):
		var raw = str(JavaScriptBridge.eval("JSON.stringify((window.toyCommands||[]).splice(0))",true))
		var commands = JSON.parse_string(raw)
		if commands is Array:
			for c in commands: command(str(c.get("cmd",c.get("name",""))),c.get("value",null))
	if demo:
		demo_clock = sim_clock if demo_freeze >= 0 else fposmod(Time.get_ticks_msec()/1000.0-demo_origin,4)
		var cycle = int((Time.get_ticks_msec()/1000.0-demo_origin)/4)
		if demo_freeze < 0 and cycle != demo_cycle:
			demo_cycle = cycle
			reset()
			sim_clock = 0
			rng.seed = 192734
			build(true)
			demo_phase = 0
		if demo_clock >= 2 and demo_phase == 0:
			demo_phase = 1
			quake_level = 1
			last_quake = sim_clock
			quake()
		if demo_clock > 3.3:
			var f = maxf(0,1-(demo_clock-3.3)/.7)
			for b in bricks:
				if b.active: b.skin.scale *= f
	if not paused: _update_camera(dt)
	if not demo and Engine.get_frames_per_second() < 28:
		slow_frames += dt
		if slow_frames > 2 and quality_level < 2:
			quality_level += 1
			slow_frames = 0
			if quality_level == 1 and OS.has_feature("web"):
				JavaScriptBridge.eval("window.toyLowResolution&&window.toyLowResolution()",true)
			else:
				for child in get_children():
					if child is DirectionalLight3D: child.shadow_enabled = false
	else: slow_frames = maxf(0,slow_frames-dt)
	stats_clock += dt
	if stats_clock > .15:
		stats_clock = 0
		_send_event({"type":"stats","state":get_state()})

func command(cmd: String,value: Variant=null) -> void:
	match cmd:
		"build": build()
		"tower": tower()
		"quake": quake()
		"pour": pour(25 if value == null else int(value))
		"pourStart": pouring = true; pour_clock = -11.2; pour(25)
		"pourStop": pouring = false
		"shake": shake()
		"empty": empty()
		"reset": reset()
		"tool": tool = int(value)
		"shape": shape = clampi(int(value),0,6)
		"rotate":
			rotate_index = (rotate_index+1)%4
			if held >= 0 and not bricks[held].snapped:
				bricks[held].body.rotation.y += PI/2
				bricks[held].rot = (bricks[held].rot+1)%4
		"jelly": jelly = clampf(float(value),0,1)
		"grip": grip = clampf(float(value),0,1)
		"palette": Visuals.set_palette(str(value))
		"classic": Visuals.set_classic(bool(value))
		"slow": slow = bool(value); Engine.time_scale = .25 if slow else 1
		"pause":
			paused = not paused
			PhysicsServer3D.set_active(not paused)
		"cinema": cinema = not cinema
		"poke":
			var target = _screen_hit(Vector2(float(value.get("x",0)),float(value.get("y",0))))
			if target.has("id"): poke(target.id)
		"smash":
			var target = _screen_hit(Vector2(float(value.get("x",0)),float(value.get("y",0))))
			smash(target.get("point",Vector3.ZERO))
		"stack": stack(int(value.get("gx",0)),int(value.get("gz",0)),int(value.get("shape",shape)))

func get_state() -> Dictionary:
	var awake = 0
	var kinetic = 0.0
	var groups: Dictionary = {}
	var joint_count = 0
	for b in bricks:
		if not b.active: continue
		if not b.body.sleeping and not b.body.freeze: awake += 1
		kinetic += b.body.mass*b.body.linear_velocity.length_squared()*.5
		if b.snapped: groups[b.group] = true
	for l in links:
		if l.active: joint_count += 1
	return {"renderer":"GODOT · JOLT","fps":Engine.get_frames_per_second(),"bricks":active_count(),"awake":awake,"structures":groups.size(),"joints":joint_count,"tallest":tallest,"record":record_height,"kineticEnergy":kinetic,"asleep":awake==0,"nextColor":next_color,"paused":paused,"engine":"Godot 4.6.3","physics":"Jolt"}

func _update_camera(dt: float) -> void:
	var top = float(tallest)*1.2
	var desired = maxf(10,top*.44)
	camera_height = lerpf(camera_height,desired,minf(1,dt*1.8))
	if cinema: yaw += dt*.045
	var target = Vector3(0,17 if demo else camera_height,0)
	var ideal_distance = (79.0 if demo else 62.0+maxf(0,top-25)*.75)*zoom
	var aspect = get_viewport().get_visible_rect().size.x/maxf(1,get_viewport().get_visible_rect().size.y)
	ideal_distance *= maxf(1,.85/aspect)
	distance = lerpf(distance,ideal_distance,minf(1,dt*2))
	cam.position = target+Vector3(sin(yaw)*cos(elevation),sin(elevation),cos(yaw)*cos(elevation))*distance
	cam.look_at(target)

func _screen_hit(screen: Vector2) -> Dictionary:
	var origin = cam.project_ray_origin(screen)
	var direction = cam.project_ray_normal(screen)
	var query = PhysicsRayQueryParameters3D.create(origin,origin+direction*250)
	query.collide_with_areas = false
	var hit = get_world_3d().direct_space_state.intersect_ray(query)
	if not hit.is_empty():
		var out = {"point":hit.position,"normal":hit.normal}
		if hit.collider.has_meta("brick_id"): out.id = int(hit.collider.get_meta("brick_id"))
		return out
	var point = Plane(Vector3.UP,0).intersects_ray(origin,direction)
	return {"point":point if point != null else Vector3.ZERO}

func _unhandled_input(event: InputEvent) -> void:
	if demo or not physics_ready: return
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP and event.pressed: zoom = clampf(zoom*.91,.55,1.6)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN and event.pressed: zoom = clampf(zoom*1.09,.55,1.6)
		elif event.button_index in [MOUSE_BUTTON_LEFT,MOUSE_BUTTON_RIGHT,MOUSE_BUTTON_MIDDLE]:
			if event.pressed: _pointer_start(event.position,event.button_index != MOUSE_BUTTON_LEFT)
			else: _pointer_end(event.position)
	elif event is InputEventMouseMotion:
		if Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT) or orbiting: _pointer_move(event.position,event.relative)
	elif event is InputEventScreenTouch:
		if event.pressed:
			pointers[event.index] = event.position
			if pointers.size() == 1: _pointer_start(event.position,false)
			else:
				orbiting = true
				dragging = false
				held = -1
				ghost.hide()
				var values = pointers.values()
				pinch_distance = values[0].distance_to(values[1])
		else:
			pointers.erase(event.index)
			if pointers.is_empty(): _pointer_end(event.position)
	elif event is InputEventScreenDrag:
		pointers[event.index] = event.position
		if pointers.size() >= 2:
			var values = pointers.values()
			var dist: float = values[0].distance_to(values[1])
			if pinch_distance > 0: zoom = clampf(zoom*pinch_distance/maxf(10,dist),.55,1.6)
			pinch_distance = dist
		_pointer_move(event.position,event.relative)

func _pointer_start(pos: Vector2,orbit: bool) -> void:
	pointer_down = pos
	pointer_last = pos
	pointer_time = Time.get_ticks_msec()/1000.0
	pointer_hit = _screen_hit(pos)
	orbiting = orbit
	dragging = false
	held = int(pointer_hit.get("id",-1))
	if held >= 0:
		var p: Vector3 = bricks[held].body.position
		drag_plane = Plane(-cam.global_basis.z,p)
		hold_target = p
		hold_last = p
		hold_velocity = Vector3.ZERO
		hold_anchor = p

func _pointer_move(pos: Vector2,relative: Vector2) -> void:
	if orbiting:
		yaw -= relative.x*.006
		elevation = clampf(elevation+relative.y*.004,.17,1.1)
	elif held >= 0 and tool == 0 and pos.distance_to(pointer_down) > 6:
		dragging = true
		var p = drag_plane.intersects_ray(cam.project_ray_origin(pos),cam.project_ray_normal(pos))
		if p != null:
			hold_target = p
			hold_target.y = maxf(.6,hold_target.y)
			hold_velocity = (hold_target-hold_last)*30
			hold_last = hold_target
			var b: Dictionary = bricks[held]
			if b.base_anchor and hold_target.distance_to(b.body.position) > 1+grip*3:
				b.base_anchor = false
				b.body.freeze = false
				fracture_near(b.body.position,8,1.5)
				graph_dirty = true
			var d = dimensions(b.shape,b.rot)
			var gx = roundi(hold_target.x-d.x/2)
			var gz = roundi(hold_target.z-d.z/2)
			ghost_place = find_placement(gx,gz,b.shape,b.rot,held)
			ghost.visible = ghost_place.valid
			if ghost.visible:
				ghost.position = ghost_place.pos
				ghost_body.mesh.size = d
	pointer_last = pos

func _pointer_end(pos: Vector2) -> void:
	var tap = pos.distance_to(pointer_down) <= 6 and Time.get_ticks_msec()/1000.0-pointer_time < .45
	if dragging and held >= 0:
		var b: Dictionary = bricks[held]
		if not b.snapped and ghost_place.get("valid",false) and hold_velocity.length() < 12 and absf(hold_target.y-ghost_place.pos.y) < 2.5 and Vector2(hold_target.x-ghost_place.pos.x,hold_target.z-ghost_place.pos.z).length() < .38:
			var p: Dictionary = ghost_place
			b.manual = true
			place(held,p.gx,p.gz,b.rot,p.bottom)
		else:
			b.body.sleeping = false
			b.body.linear_velocity = hold_velocity.limit_length(24)
	elif tap and not orbiting:
		var hit = _screen_hit(pos)
		var point: Vector3 = hit.get("point",Vector3.ZERO)
		if tool == 0 and hit.has("id"): poke(hit.id,Vector3(sin(yaw),0,cos(yaw)))
		elif tool == 1:
			var d = dimensions(shape,rotate_index)
			stack(roundi(point.x-d.x/2),roundi(point.z-d.z/2))
		elif tool == 2: smash(point)
	held = -1
	dragging = false
	orbiting = false
	ghost.hide()

func milestone(key: String,text: String) -> void:
	if not milestones.has(key):
		milestones[key] = true
		toast(text)

func toast(text: String) -> void:
	if not demo: _send_event({"type":"toast","text":text})

func sound(kind: String,pitch: float=1) -> void:
	if not demo and OS.has_feature("web"):
		JavaScriptBridge.eval("window.toySound&&window.toySound("+JSON.stringify(kind)+","+str(pitch)+")",true)

func _send_event(data: Dictionary) -> void:
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.toyEvent&&window.toyEvent("+JSON.stringify(data)+")",true)
