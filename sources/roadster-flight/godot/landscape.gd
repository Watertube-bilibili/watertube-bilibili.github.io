extends RefCounted

const TARMAC := Color("#313a3d")
const PAINT := Color("#b5ab90")
const MARK := Color("#e29959")


static func _material(color: Color, roughness: float = 0.87) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = roughness
	return material


static func _box(parent: Node3D, name: String, position: Vector3, size: Vector3,
		material: StandardMaterial3D) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	node.mesh = mesh
	node.name = name
	node.material_override = material
	parent.add_child(node)
	node.position = position
	return node


static func _ring(parent: Node3D, radius: float, width: float, height: float,
		material: StandardMaterial3D, detail: int, gap_ratio: float = 0.0) -> void:
	var surface := SurfaceTool.new()
	surface.begin(Mesh.PRIMITIVE_TRIANGLES)
	for step in range(detail):
		var theta := TAU * float(step) / detail
		var following := TAU * (float(step) + 1.0 - gap_ratio) / detail
		var leading_direction := Vector3(sin(theta), 0.0, cos(theta))
		var trailing_direction := Vector3(sin(following), 0.0, cos(following))
		var origin := Vector3(0.0, height, 0.0)
		var a := origin + leading_direction * (radius + width)
		var b := origin + trailing_direction * (radius + width)
		var c := origin + trailing_direction * radius
		var d := origin + leading_direction * radius
		for vertex in [a, b, c, a, c, d]:
			surface.set_normal(Vector3.UP)
			surface.add_vertex(vertex)
	var instance := MeshInstance3D.new()
	instance.name = "Landing pad ring"
	instance.mesh = surface.commit()
	instance.material_override = material
	parent.add_child(instance)


static func _mountain_belt(parent: Node3D, near_radius: float, far_radius: float,
		peak_height: float, offset: float, dark: Color, light: Color) -> void:
	var noise := FastNoiseLite.new()
	noise.seed = 2006 + int(offset * 8.0)
	noise.frequency = 0.17
	var angles := 74
	var rings: Array[PackedVector3Array] = []
	for ring_index in range(3):
		var vertices := PackedVector3Array()
		for step in range(angles):
			var angle := TAU * float(step) / angles
			var ridges := noise.get_noise_2d(cos(angle) * 38.0, sin(angle) * 38.0)
			var variations := noise.get_noise_2d(cos(angle) * 70.0 + 13.0, sin(angle) * 70.0 - 4.0)
			var radius := lerpf(near_radius, far_radius, ring_index * 0.5) + variations * 11.0
			var height := maxf(1.5, (0.54 + ridges * 0.70 + variations * 0.20) * peak_height)
			vertices.append(Vector3(sin(angle) * radius, height if ring_index == 1 else 0.1,
					cos(angle) * radius + offset))
		rings.append(vertices)
	var surface := SurfaceTool.new()
	surface.begin(Mesh.PRIMITIVE_TRIANGLES)
	for ring_index in range(2):
		for step in range(angles):
			var following := (step + 1) % angles
			var a: Vector3 = rings[ring_index][step]
			var b: Vector3 = rings[ring_index + 1][step]
			var c: Vector3 = rings[ring_index + 1][following]
			var d: Vector3 = rings[ring_index][following]
			for triangle in [[a, b, c], [a, c, d]]:
				var tint := (noise.get_noise_2d(step * 5, ring_index * 8) + 1.0) * 0.5
				for vertex in triangle:
					surface.set_color(dark.lerp(light, tint))
					surface.add_vertex(vertex)
	surface.generate_normals()
	var color := _material(Color.WHITE)
	color.vertex_color_use_as_albedo = true
	color.cull_mode = BaseMaterial3D.CULL_DISABLED
	var mountain := MeshInstance3D.new()
	mountain.name = "Lakebed ridges"
	mountain.mesh = surface.commit()
	mountain.material_override = color
	parent.add_child(mountain)


static func build(parent: Node3D) -> void:
	var ground := StaticBody3D.new()
	ground.name = "Flight surface"
	parent.add_child(ground)
	var shape := BoxShape3D.new()
	shape.size = Vector3(700.0, 1.0, 700.0)
	var collision := CollisionShape3D.new()
	collision.shape = shape
	collision.position.y = -0.5
	ground.add_child(collision)
	var salt := _material(Color("#827b6d"))
	var surface := _box(parent, "Dry lakebed", Vector3(0, -0.046, 0), Vector3(690, 0.04, 690), salt)
	var terrain_material := ShaderMaterial.new()
	var shader := Shader.new()
	shader.code = """
shader_type spatial;
varying vec3 surface_position;
float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float field(vec2 p) {
	vec2 cell = floor(p);
	vec2 q = fract(p);
	vec2 u = q * q * (3.0 - 2.0 * q);
	return mix(mix(hash(cell), hash(cell + vec2(1, 0)), u.x),
		mix(hash(cell + vec2(0, 1)), hash(cell + vec2(1)), u.x), u.y);
}
void vertex() {
	surface_position = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}
void fragment() {
	vec2 uv = surface_position.xz;
	float coarse = field(uv * 0.095);
	float fine = field(uv * 16.0);
	ALBEDO = mix(vec3(0.26, 0.23, 0.19), vec3(0.36, 0.32, 0.25), coarse)
		+ vec3((fine - 0.5) * 0.055);
	ROUGHNESS = 0.9;
}
"""
	terrain_material.shader = shader
	surface.material_override = terrain_material
	_box(parent, "Tarmac runway", Vector3(0, -0.013, -14), Vector3(19.0, 0.023, 86.0), _material(TARMAC))
	var painted := _material(PAINT)
	var marked := _material(MARK)
	painted.cull_mode = BaseMaterial3D.CULL_DISABLED
	marked.cull_mode = BaseMaterial3D.CULL_DISABLED
	_ring(parent, 5.0, 0.046, 0.003, painted, 96)
	_ring(parent, 5.8, 0.115, 0.003, painted, 36, 0.61)
	_ring(parent, 6.6, 0.040, 0.003, marked, 24, 0.46)
	for side in [-1, 1]:
		_box(parent, "Runway edge", Vector3(8.55 * side, 0.002, -14), Vector3(0.085, 0.004, 82.0), painted)
		for position in range(-53, 28, 10):
			_box(parent, "Runway edge marker", Vector3(8.18 * side, 0.002, position),
					Vector3(0.44, 0.004, 0.14), marked)
		for stripe in range(5):
			_box(parent, "Threshold stripe", Vector3((1.0 + stripe * 1.2) * side, 0.002, 24.0),
					Vector3(0.42, 0.004, 3.1), painted)
	for position in range(-51, -8, 6):
		_box(parent, "Runway centreline", Vector3(0.0, 0.002, position),
				Vector3(0.12, 0.004, 2.15), painted)
	_mountain_belt(parent, 105, 170, 15, -3, Color("#60574d"), Color("#827264"))
	_mountain_belt(parent, 177, 266, 31, 11, Color("#59616b"), Color("#777f88"))
