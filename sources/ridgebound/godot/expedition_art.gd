extends RefCounted
## Lighting and procedural detail shared by the Compatibility renderers.
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
	sky.sky_top_color = Color("55728d") if winter else Color("456875")
	sky.sky_horizon_color = Color("c7d5e3") if winter else Color("e6d4b0")
	sky.ground_bottom_color = Color("617889") if winter else Color("4e6551")
	sky.ground_horizon_color = sky.sky_horizon_color
	sky.sky_curve = 0.25
	sky.sun_angle_max = 5.5
	env.fog_enabled = true
	env.fog_light_color = Color("c6d4e2") if winter else Color("c2c9af")
	env.fog_density = 0.00155 if winter else 0.00125
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("bbd0e7") if winter else Color("bbd0bd")
	env.ambient_light_energy = 0.48
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.tonemap_white = 1.6
	sun.light_color = Color("f2f6ff") if winter else Color("ffedd0")
	sun.light_energy = 1.12
	sun.rotation_degrees = Vector3(-41, -32, 0) if winter else Vector3(-37, -42, 0)
	sun.shadow_bias = 0.055
	sun.shadow_normal_bias = 0.75
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_2_SPLITS

static func apply_quality(viewport: Viewport, sun: DirectionalLight3D, profile: String, frame_ms: float = 16.7) -> void:
	var fast := profile == "performance" or (profile == "auto" and frame_ms > 34.0)
	var detailed := profile == "quality"
	var is_mobile := OS.has_feature("mobile") or OS.has_feature("web_android") or OS.has_feature("web_ios")
	sun.shadow_enabled = not fast and (detailed or not is_mobile)
	sun.directional_shadow_max_distance = 105.0 if detailed else 65.0
	viewport.msaa_3d = Viewport.MSAA_4X if detailed and not is_mobile else (Viewport.MSAA_2X if not fast else Viewport.MSAA_DISABLED)
	viewport.scaling_3d_scale = 1.0 if detailed else (0.72 if frame_ms > 53.0 and profile == "auto" else (0.82 if fast else 0.94))
