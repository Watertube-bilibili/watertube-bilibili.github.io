class_name JellyVisuals
extends RefCounted

# The visual shell is independent of the engine's rigid collision shape.
# One unit is one 8 mm stud pitch. Every brick shares one of seven meshes.
const DIMS = [Vector3(2,1.2,4), Vector3(2,1.2,2), Vector3(1,1.2,4), Vector3(1,1.2,2), Vector3(1,1.2,1), Vector3(2,.4,4), Vector3(2,.4,2)]
const PALETTES = {
	"rainbow": [Color("e51e46"), Color("f27418"), Color("f5c914"), Color("18b75d"), Color("1689e8"), Color("9541df")],
	"pastel": [Color("ee8fa7"), Color("efb27a"), Color("efda83"), Color("8fceb0"), Color("8ab9e5"), Color("b496dc")],
	"neon": [Color("ff2463"), Color("ff801e"), Color("d8ef13"), Color("20ec8c"), Color("00bdf4"), Color("c147fb")]
}
static var _meshes: Array[ArrayMesh] = []
static var _materials: Array[ShaderMaterial] = []
static var _clear_material: ShaderMaterial
static var _shader: Shader
static var _classic: bool = false
static var _palette: String = "rainbow"
static var _vertices: PackedVector3Array
static var _normals: PackedVector3Array
static var _colors: PackedColorArray

static func prepare() -> void:
	if not _meshes.is_empty():
		return
	_shader = Shader.new()
	_shader.code = """
shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx, cull_back;
uniform vec4 jelly_color : source_color = vec4(.9,.2,.3,1.0);
uniform float classic = 0.0;
uniform float clarity = 0.0;
varying vec3 local_p;
varying float thin;
void vertex(){ local_p=VERTEX; thin=COLOR.r; }
void fragment(){
 float f=pow(1.0-clamp(dot(normalize(NORMAL),normalize(VIEW)),0.0,1.0),3.0);
 float d=sin(local_p.x*89.0)*sin(local_p.y*93.0)*sin(local_p.z*81.0);
 vec3 base=jelly_color.rgb;
 float depth=mix(.48,.86,thin);
 vec3 gummy=base*(depth+.22*f)+base*.10;
 gummy=mix(gummy,mix(base,vec3(1.0,.94,.83),.18),clarity);
 ALBEDO=mix(gummy,base,classic);
 METALLIC=0.0;
 ROUGHNESS=mix(.135+d*.013,.21,classic);
 SPECULAR=.42;
 CLEARCOAT=.52;
 CLEARCOAT_ROUGHNESS=.19;
 RIM=.25*(1.0-classic);
 RIM_TINT=.7;
 EMISSION=base*(.012+f*.035)*(1.0-classic);
}
"""
	for i in range(6):
		var mat := ShaderMaterial.new()
		mat.shader = _shader
		mat.set_shader_parameter("jelly_color", PALETTES[_palette][i])
		_materials.append(mat)
	_clear_material = ShaderMaterial.new()
	_clear_material.shader = _shader
	_clear_material.set_shader_parameter("jelly_color", Color(.65,.86,.87))
	_clear_material.set_shader_parameter("clarity", .8)
	for dim in DIMS:
		_meshes.append(_build_brick(dim))

static func make_brick(shape: int, color_index: int, clear_brick: bool = false) -> Node3D:
	prepare()
	var root := Node3D.new()
	root.name = "JellySkin"
	var mesh := MeshInstance3D.new()
	mesh.mesh = _meshes[clampi(shape,0,6)]
	mesh.material_override = _clear_material if clear_brick else _materials[posmod(color_index,6)]
	root.add_child(mesh)
	return root

static func update_brick(visual: Node3D, shape: int, color_index: int, clear_brick: bool = false) -> void:
	prepare()
	var mesh: MeshInstance3D = visual.get_child(0)
	mesh.mesh = _meshes[clampi(shape,0,6)]
	mesh.material_override = _clear_material if clear_brick else _materials[posmod(color_index,6)]

static func set_palette(palette_name: String) -> void:
	prepare()
	_palette = palette_name if PALETTES.has(palette_name) else "rainbow"
	for i in range(6):
		_materials[i].set_shader_parameter("jelly_color", PALETTES[_palette][i])

static func set_classic(value: bool) -> void:
	prepare()
	_classic = value
	for mat in _materials:
		mat.set_shader_parameter("classic", 1.0 if value else 0.0)
	_clear_material.set_shader_parameter("classic", 1.0 if value else 0.0)

static func _triangle(a: Vector3,b: Vector3,c: Vector3,na: Vector3,nb: Vector3,nc: Vector3,skin: float) -> void:
	_vertices.append(a); _vertices.append(b); _vertices.append(c)
	_normals.append(na); _normals.append(nb); _normals.append(nc)
	var color := Color(skin,skin,skin,1)
	_colors.append(color); _colors.append(color); _colors.append(color)

static func _rounded_box(center: Vector3,size: Vector3,radius: float,skin: float) -> void:
	var ext := size*.5
	var inner := ext-Vector3.ONE*radius
	# Four samples per face retain broad flat panels and genuinely round the edges.
	for axis in range(3):
		var u_axis := (axis+1)%3
		var v_axis := (axis+2)%3
		for sign_value in [-1.0,1.0]:
			var points: Array[Vector3] = []
			var normals: Array[Vector3] = []
			for v in range(4):
				for u in range(4):
					var p := Vector3.ZERO
					p[axis] = ext[axis]*sign_value
					p[u_axis] = [-ext[u_axis],-inner[u_axis],inner[u_axis],ext[u_axis]][u]
					p[v_axis] = [-ext[v_axis],-inner[v_axis],inner[v_axis],ext[v_axis]][v]
					var q := p.clamp(-inner,inner)
					var n := (p-q).normalized()
					points.append(center+q+n*radius)
					normals.append(n)
			for v in range(3):
				for u in range(3):
					var a := v*4+u
					var b := a+1
					var c := a+4
					var d := c+1
					if sign_value > 0:
						_triangle(points[a],points[c],points[b],normals[a],normals[c],normals[b],skin)
						_triangle(points[b],points[c],points[d],normals[b],normals[c],normals[d],skin)
					else:
						_triangle(points[a],points[b],points[c],normals[a],normals[b],normals[c],skin)
						_triangle(points[b],points[d],points[c],normals[b],normals[d],normals[c],skin)

static func _cylinder(center: Vector3,radius: float,height: float,skin: float,inner: float=0.0) -> void:
	const SEGMENTS := 16
	var y0 := center.y-height*.5
	var y1 := center.y+height*.5
	var bevel := minf(.022,height*.2)
	var ys := [y0,y0+bevel,y1-bevel,y1]
	var rs := [radius-bevel,radius,radius,radius-bevel]
	for ring in range(3):
		for i in range(SEGMENTS):
			var t0 := TAU*float(i)/SEGMENTS
			var t1 := TAU*float(i+1)/SEGMENTS
			var n0 := Vector3(cos(t0),0,sin(t0))
			var n1 := Vector3(cos(t1),0,sin(t1))
			var a := Vector3(center.x+n0.x*rs[ring],ys[ring],center.z+n0.z*rs[ring])
			var b := Vector3(center.x+n1.x*rs[ring],ys[ring],center.z+n1.z*rs[ring])
			var c := Vector3(center.x+n0.x*rs[ring+1],ys[ring+1],center.z+n0.z*rs[ring+1])
			var d := Vector3(center.x+n1.x*rs[ring+1],ys[ring+1],center.z+n1.z*rs[ring+1])
			var ny0 := -.55 if ring == 0 else .55 if ring == 2 else 0.0
			var nn0 := (n0+Vector3.UP*ny0).normalized()
			var nn1 := (n1+Vector3.UP*ny0).normalized()
			_triangle(a,b,c,nn0,nn1,nn0,skin)
			_triangle(b,d,c,nn1,nn1,nn0,skin)
	for side in [-1,1]:
		var y := y0 if side < 0 else y1
		var normal: Vector3 = Vector3.UP*side
		var r := radius-bevel
		for i in range(SEGMENTS):
			var t0 := TAU*float(i)/SEGMENTS
			var t1 := TAU*float(i+1)/SEGMENTS
			var a := Vector3(center.x+cos(t0)*r,y,center.z+sin(t0)*r)
			var b := Vector3(center.x+cos(t1)*r,y,center.z+sin(t1)*r)
			var c := Vector3(center.x+cos(t0)*inner,y,center.z+sin(t0)*inner)
			var d := Vector3(center.x+cos(t1)*inner,y,center.z+sin(t1)*inner)
			if side > 0:
				_triangle(a,b,c,normal,normal,normal,skin)
				if inner > 0: _triangle(b,d,c,normal,normal,normal,skin)
			else:
				_triangle(a,c,b,normal,normal,normal,skin)
				if inner > 0: _triangle(b,c,d,normal,normal,normal,skin)
	if inner > 0:
		for i in range(SEGMENTS):
			var t0 := TAU*float(i)/SEGMENTS
			var t1 := TAU*float(i+1)/SEGMENTS
			var n0 := Vector3(-cos(t0),0,-sin(t0))
			var n1 := Vector3(-cos(t1),0,-sin(t1))
			var a := Vector3(center.x-cos(t0)*-inner,y0,center.z-sin(t0)*-inner)
			var b := Vector3(center.x-cos(t1)*-inner,y0,center.z-sin(t1)*-inner)
			var c := a+Vector3.UP*height
			var d := b+Vector3.UP*height
			_triangle(a,c,b,n0,n0,n1,skin*.7)
			_triangle(b,c,d,n1,n0,n1,skin*.7)

static func _array_mesh() -> ArrayMesh:
	var arrays := []
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX] = _vertices
	arrays[Mesh.ARRAY_NORMAL] = _normals
	arrays[Mesh.ARRAY_COLOR] = _colors
	var mesh := ArrayMesh.new()
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES,arrays)
	_vertices = PackedVector3Array(); _normals = PackedVector3Array(); _colors = PackedColorArray()
	return mesh

static func _build_brick(dim: Vector3) -> ArrayMesh:
	_vertices = PackedVector3Array(); _normals = PackedVector3Array(); _colors = PackedColorArray()
	var w := dim.x
	var h := dim.y
	var d := dim.z
	_rounded_box(Vector3(0,h*.5-.075,0),Vector3(w-.025,.15,d-.025),.035,.62)
	_rounded_box(Vector3(-(w-.175)*.5,-.075,0),Vector3(.15,h-.15,d-.04),.035,.45)
	_rounded_box(Vector3((w-.175)*.5,-.075,0),Vector3(.15,h-.15,d-.04),.035,.45)
	_rounded_box(Vector3(0,-.075,-(d-.175)*.5),Vector3(w-.15,h-.15,.15),.035,.45)
	_rounded_box(Vector3(0,-.075,(d-.175)*.5),Vector3(w-.15,h-.15,.15),.035,.45)
	for x in range(int(w)):
		for z in range(int(d)):
			_cylinder(Vector3(float(x)-(w-1)*.5,h*.5+.10625,float(z)-(d-1)*.5),.3,.2125,.98)
	if w == 2:
		for z in range(int(d)-1):
			_cylinder(Vector3(0,-.075,float(z)-(d-2)*.5),.405,h-.18,.29,.285)
	elif d > 1:
		for z in range(int(d)-1):
			_cylinder(Vector3(0,-.075,float(z)-(d-2)*.5),.19,h-.18,.36)
	return _array_mesh()

static func make_world(parent: Node3D) -> void:
	prepare()
	var environment := Environment.new()
	environment.background_mode = Environment.BG_SKY
	var sky := Sky.new()
	var sky_material := ProceduralSkyMaterial.new()
	sky_material.sky_top_color = Color("c4a7a2")
	sky_material.sky_horizon_color = Color("eee2ce")
	sky_material.ground_horizon_color = Color("eee2ce")
	sky_material.ground_bottom_color = Color("b99880")
	sky_material.sky_energy_multiplier = .65
	sky_material.ground_energy_multiplier = .65
	sky_material.sky_curve = .22
	sky_material.ground_curve = .25
	sky_material.sun_angle_max = 4.0
	sky.sky_material = sky_material
	environment.sky = sky
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color("e7e4f2")
	environment.ambient_light_energy = .26
	environment.reflected_light_source = Environment.REFLECTION_SOURCE_SKY
	environment.tonemap_mode = Environment.TONE_MAPPER_LINEAR
	var world := WorldEnvironment.new()
	world.environment = environment
	parent.add_child(world)
	var key := DirectionalLight3D.new()
	key.light_color = Color("fff1d8")
	key.light_energy = .68
	key.rotation_degrees = Vector3(-55,-35,0)
	key.shadow_enabled = true
	key.directional_shadow_max_distance = 120
	key.shadow_bias = .035
	key.shadow_normal_bias = .8
	parent.add_child(key)
	var rim := DirectionalLight3D.new()
	rim.light_color = Color("b6daff")
	rim.light_energy = .32
	rim.rotation_degrees = Vector3(-32,150,0)
	parent.add_child(rim)
	var fill := DirectionalLight3D.new()
	fill.light_color = Color("ffe2ca")
	fill.light_energy = .12
	fill.rotation_degrees = Vector3(-25,50,0)
	parent.add_child(fill)
	var mint := StandardMaterial3D.new()
	mint.albedo_color = Color("a3c6b4")
	mint.roughness = .78
	mint.metallic_specular = .24
	var plate := MeshInstance3D.new()
	_vertices = PackedVector3Array(); _normals = PackedVector3Array(); _colors = PackedColorArray()
	_rounded_box(Vector3(0,-.275,0),Vector3(32,.55,32),.12,1.0)
	plate.mesh = _array_mesh()
	plate.material_override = mint
	parent.add_child(plate)
	var cylinder := CylinderMesh.new()
	cylinder.top_radius = .3
	cylinder.bottom_radius = .3
	cylinder.height = .2125
	cylinder.radial_segments = 12
	var multi := MultiMesh.new()
	multi.transform_format = MultiMesh.TRANSFORM_3D
	multi.mesh = cylinder
	multi.instance_count = 1024
	for i in range(1024):
		multi.set_instance_transform(i,Transform3D(Basis.IDENTITY,Vector3(float(i%32)-15.5,.10625,float(i/32)-15.5)))
	var studs := MultiMeshInstance3D.new()
	studs.multimesh = multi
	studs.material_override = mint
	parent.add_child(studs)
	var wood := ShaderMaterial.new()
	var wood_shader := Shader.new()
	wood_shader.code = """
shader_type spatial;
uniform vec4 wood_light : source_color = vec4(.54,.39,.235,1);
varying vec3 p;
void vertex(){p=VERTEX;}
void fragment(){
 float f=sin(p.x*2.5+sin(p.z*.14)*1.5+sin(p.x*29.0)*.11);
 float line=pow(.5+.5*sin(p.x*53.0+sin(p.z*.2)),8.0);
 ALBEDO=wood_light.rgb*(.9+f*.035-line*.025); ROUGHNESS=.82;
}
"""
	wood.shader = wood_shader
	var table := MeshInstance3D.new()
	_vertices = PackedVector3Array(); _normals = PackedVector3Array(); _colors = PackedColorArray()
	_rounded_box(Vector3(0,-1.55,0),Vector3(69,2,62),.65,1.0)
	table.mesh = _array_mesh()
	table.material_override = wood
	parent.add_child(table)
