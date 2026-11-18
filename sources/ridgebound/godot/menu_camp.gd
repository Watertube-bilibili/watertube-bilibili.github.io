extends CanvasLayer
## The title art depicts the original summit trailhead. The parked vehicle is
## rendered from the equipped game model into a transparent, on-demand viewport.

var canvas: Control
var landscape: TextureRect
var car_picture: TextureRect
var studio: SubViewport
var model_root: Node3D
var showroom_camera: Camera3D
var parked_car: Node3D
var wide_art: Texture2D
var tall_art: Texture2D
var selected := ""
var _last_size := Vector2.ZERO

func _ready() -> void:
	layer = 1
	wide_art = load("res://art/title/camp_wide.webp") as Texture2D
	tall_art = load("res://art/title/camp_tall.webp") as Texture2D
	canvas = Control.new()
	canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(canvas)
	canvas.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	landscape = TextureRect.new()
	landscape.mouse_filter = Control.MOUSE_FILTER_IGNORE
	landscape.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	landscape.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	canvas.add_child(landscape)
	landscape.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	studio = SubViewport.new()
	studio.transparent_bg = true
	studio.own_world_3d = true
	studio.render_target_update_mode = SubViewport.UPDATE_DISABLED
	studio.msaa_3d = Viewport.MSAA_2X
	add_child(studio)
	var sky := WorldEnvironment.new()
	sky.environment = Environment.new()
	sky.environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	sky.environment.ambient_light_color = Color("dce3e4")
	sky.environment.ambient_light_energy = 0.74
	studio.add_child(sky)
	var sun := DirectionalLight3D.new()
	studio.add_child(sun)
	sun.light_color = Color("ffe0ab")
	sun.light_energy = 1.35
	sun.look_at_from_position(Vector3(-4, 7, 5), Vector3.ZERO, Vector3.UP)
	var fill := DirectionalLight3D.new()
	studio.add_child(fill)
	fill.light_color = Color("ceeaef")
	fill.light_energy = 0.26
	fill.look_at_from_position(Vector3(4, 3, -5), Vector3.ZERO, Vector3.UP)
	model_root = Node3D.new()
	studio.add_child(model_root)
	var contact := MeshInstance3D.new()
	var ground := PlaneMesh.new()
	ground.size = Vector2(3.5, 6.7)
	contact.mesh = ground
	var material := ShaderMaterial.new()
	var shader := Shader.new()
	shader.code = "shader_type spatial; render_mode unshaded, cull_disabled, depth_draw_never, shadows_disabled; void fragment(){vec2 v=(UV-0.5)*2.0; ALBEDO=vec3(0.11,0.12,0.09); ALPHA=0.50*(1.0-smoothstep(0.26,1.0,length(v)));}"
	material.shader = shader
	contact.material_override = material
	studio.add_child(contact)
	showroom_camera = Camera3D.new()
	showroom_camera.projection = Camera3D.PROJECTION_ORTHOGONAL
	showroom_camera.size = 3.6
	studio.add_child(showroom_camera)
	showroom_camera.current = true
	showroom_camera.look_at_from_position(Vector3(5.8, 3.0, 7.0), Vector3(0, 1.05, 0), Vector3.UP)
	car_picture = TextureRect.new()
	car_picture.mouse_filter = Control.MOUSE_FILTER_IGNORE
	car_picture.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	car_picture.texture = studio.get_texture()
	canvas.add_child(car_picture)
	canvas.resized.connect(_layout)
	_layout()

func display_vehicle(template: PackedScene, id: String) -> void:
	if id == selected:
		return
	if parked_car:
		model_root.remove_child(parked_car)
		parked_car.queue_free()
	parked_car = template.instantiate() as Node3D
	if not parked_car:
		return
	selected = id
	model_root.add_child(parked_car)
	parked_car.position.y = float(OffroadPhysics.vehicle_geometry(id).wheelRadius)
	studio.render_target_update_mode = SubViewport.UPDATE_ONCE

func _layout() -> void:
	if not is_node_ready() or not studio:
		return
	var size := canvas.size
	if size == _last_size or size.x <= 0.0 or size.y <= 0.0:
		return
	_last_size = size
	var portrait := size.y >= size.x
	landscape.texture = tall_art if portrait else wide_art
	var width := size.x * (0.84 if portrait else 0.47)
	var area := Vector2(width, width * 0.61)
	var feet := size * (Vector2(0.53, 0.58) if portrait else Vector2(0.71, 0.70))
	car_picture.position = feet - Vector2(area.x * 0.50, area.y * 0.77)
	car_picture.size = area
	var density := clampf(get_viewport().get_screen_transform().get_scale().x, 1.0, 2.0)
	var pixels := area * density
	pixels *= minf(1.0, 1152.0 / maxf(1.0, pixels.x))
	studio.size = Vector2i(maxi(48, ceili(pixels.x)), maxi(32, ceili(pixels.y)))
	studio.render_target_update_mode = SubViewport.UPDATE_ONCE

func reveal(value: bool) -> void:
	if value != visible:
		visible = value
	if value:
		_layout()
