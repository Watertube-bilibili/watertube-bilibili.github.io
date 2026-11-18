extends RefCounted
## Materials and a single daylight rig shared by OpenGL and Vulkan.
const LAND_SHADER := preload("res://art/trail_surface.gdshader")
const WATER_SHADER := preload("res://art/alpine_water.gdshader")

static func terrain_material(region: String) -> ShaderMaterial:
	var material := ShaderMaterial.new()
	material.shader = LAND_SHADER
	material.set_shader_parameter("snow", region == "snow")
	return material

static func water_material(frozen: bool) -> ShaderMaterial:
	var material := ShaderMaterial.new()
	material.shader = WATER_SHADER
	material.set_shader_parameter("frozen", frozen)
	return material

static func apply_atmosphere(env: Environment, sky: ProceduralSkyMaterial, sun: DirectionalLight3D, region: String) -> void:
	var winter := region == "snow"
	sky.sky_top_color = Color("608499") if winter else Color("557889")
	sky.sky_horizon_color = Color("c2cfd6") if winter else Color("c2c7b8")
	sky.ground_bottom_color = Color("63788a") if winter else Color("3e5647")
	sky.ground_horizon_color = sky.sky_horizon_color
	sky.sky_curve = 0.34
	sky.sun_angle_max = 4.0
	sky.sun_curve = 0.16

	env.fog_enabled = true
	env.fog_light_color = Color("bccdd6") if winter else Color("aabdaf")
	env.fog_density = 0.00130 if winter else 0.00115
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("c0d5e3") if winter else Color("c1d1c3")
	env.ambient_light_energy = 0.48 if winter else 0.55
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.tonemap_exposure = 0.68 if winter else 0.84
	env.tonemap_white = 2.1

	sun.light_color = Color("fff4e5") if winter else Color("fff2da")
	sun.light_energy = 0.68 if winter else 0.82
	sun.rotation_degrees = Vector3(-39, -31, 0) if winter else Vector3(-34, -44, 0)
	sun.shadow_bias = 0.05
	sun.shadow_normal_bias = 0.60
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_2_SPLITS

static func apply_quality(viewport: Viewport, sun: DirectionalLight3D, profile: String, frame_ms: float = 16.7) -> void:
	var mobile := OS.has_feature("mobile") or OS.has_feature("web_android") or OS.has_feature("web_ios")
	var fast := profile == "performance" or (profile == "auto" and frame_ms > 36.0)
	var high := profile == "quality"
	sun.shadow_enabled = not fast
	sun.directional_shadow_max_distance = 92.0 if high else (50.0 if mobile else 68.0)
	var msaa := Viewport.MSAA_DISABLED
	if not fast:
		msaa = Viewport.MSAA_4X if high and not mobile else Viewport.MSAA_2X
	if viewport.msaa_3d != msaa:
		viewport.msaa_3d = msaa
	var resolution := 1.0 if high else (0.76 if fast else 0.92)
	if not is_equal_approx(viewport.scaling_3d_scale, resolution):
		viewport.scaling_3d_scale = resolution

## Compact closed crown. Paired wider/narrower rings describe the branch tiers.
## The exact same mesh is available to the collision layer.
static func evergreen_crown(material: Material, winter: bool) -> ArrayMesh:
	const SIDES := 7
	var profile: Array[Vector2] = [
		Vector2(-0.50, 0.10), Vector2(-0.39, 0.91), Vector2(-0.09, 0.53),
		Vector2(-0.05, 0.70), Vector2(0.19, 0.30), Vector2(0.23, 0.43),
		Vector2(0.49, 0.025),
	]
	var points := PackedVector3Array()
	var shades := PackedColorArray()
	for ring: int in range(profile.size()):
		for side: int in range(SIDES):
			var angle := TAU * float(side) / SIDES + 0.14 * float(ring % 3)
			var edge := float((side * 9 + (ring % 2) * 7) % 11) / 10.0
			var radius := profile[ring].y * lerpf(0.81, 1.10, edge)
			var y := profile[ring].x + 0.024 * (edge - 0.5)
			points.append(Vector3(cos(angle) * radius + y * 0.105, y, sin(angle) * radius))
			var value := lerpf(0.58, 1.0, clampf(y + 0.58 + 0.17 * edge, 0.0, 1.0))
			var tip := Color("b4c7bf") if winter else Color("dae3bc")
			shades.append(tip.lerp(Color.WHITE, value) * Color(value, value, value))
	var mesh := SurfaceTool.new()
	mesh.begin(Mesh.PRIMITIVE_TRIANGLES)
	mesh.set_material(material)
	for ring: int in range(profile.size() - 1):
		for side: int in range(SIDES):
			var a := ring * SIDES + side
			var b := ring * SIDES + (side + 1) % SIDES
			var c := a + SIDES
			var d := b + SIDES
			_add_crown_face(mesh, points[a], points[b], points[c], shades[a], shades[b], shades[c])
			_add_crown_face(mesh, points[b], points[d], points[c], shades[b], shades[d], shades[c])
	var upper := (profile.size() - 1) * SIDES
	for side: int in range(SIDES):
		var next := (side + 1) % SIDES
		_add_crown_face(mesh, Vector3(0, -0.51, 0), points[next], points[side], shades[side], shades[next], shades[side])
		_add_crown_face(mesh, Vector3(0.052, 0.51, 0), points[upper + side], points[upper + next], Color.WHITE, shades[upper + side], shades[upper + next])
	return mesh.commit()

static func _add_crown_face(tool: SurfaceTool, a: Vector3, b: Vector3, c: Vector3, first: Color, second: Color, third: Color) -> void:
	var normal := (c - a).cross(b - a).normalized()
	tool.set_normal(normal)
	tool.set_color(first)
	tool.add_vertex(a)
	tool.set_normal(normal)
	tool.set_color(second)
	tool.add_vertex(b)
	tool.set_normal(normal)
	tool.set_color(third)
	tool.add_vertex(c)
