extends Node
## Native menu and input around the shared Godot driving scene.

const DrivingScene = preload("res://main.tscn")
const NativeMap = preload("res://desktop_map.gd")
const SAVE_PATH := "user://ridgebound-desktop.cfg"
const AXIS_HINT := "WASD / 方向键驾驶    空格刹车    C 视角    E 挂钩    F 收绳    Q 释放"
const SNOW_NAMES := ["冰川前哨", "蓝冰山口", "风雪垭口", "雪线营地"]
const CAMERAS := ["跟随", "高位", "座舱"]
const SURFACES := {
	"trail": "山间土路", "mud": "泥地", "water": "浅水",
	"grass": "草地", "rock": "岩石", "snow": "积雪", "ice": "冰面"
}
const SHORTCUTS := {
	KEY_C: "camera", KEY_X: "awd", KEY_L: "gear", KEY_R: "recover",
	KEY_T: "repair", KEY_E: "winch", KEY_Q: "detach", KEY_ESCAPE: "pause",
	KEY_G: "garage", KEY_M: "map", KEY_F2: "quality"
}

var game: Node3D
var controls: CanvasLayer
var save := {
	"region": "forest", "coins": 0, "snow_tires": false, "snow_unlocked": false,
	"progress": {"forest": 0, "snow": 0}, "awards": [], "quality": true
}
var snapshot: Dictionary = {}
var menu := "start"
var started := false
var map_overview := false
var clock := 0.0
var notification_remaining := 0.0
var smoke := false

var hud: Control
var menu_shade: ColorRect
var menu_content: VBoxContainer
var menu_title: Label
var menu_detail: Label
var menu_buttons: VBoxContainer
var route_label: Label
var car_label: Label
var speed_label: Label
var equipment_label: Label
var toast_label: Label
var winch_button: Button
var toast_panel: PanelContainer
var map_title: Label
var route_map: Control
var map_mode_button: Button

func _ready() -> void:
	smoke = "--native-smoke" in OS.get_cmdline_user_args()
	if not smoke:
		_load_save()
		get_window().min_size = Vector2i(920, 600)

	game = DrivingScene.instantiate()
	game.set("bootstrap_options", {
		"region": save.region,
		"snowTires": save.snow_tires,
		"progress": _saved_checkpoint(save.region)
	})
	game.set("desktop_input_provider", Callable(self, "_sample_drive"))
	add_child(game)
	_make_interface()
	_load_controls()
	_set_quality(bool(save.quality) and not ("--safe-graphics" in OS.get_cmdline_user_args()), false)
	_open_menu("start")
	_refresh()
	get_window().focus_exited.connect(_on_focus_lost)
	if smoke:
		call_deferred("_run_smoke")

func _load_controls() -> void:
	# The Windows package supplies the controls script and optional DirectInput helper.
	if not ResourceLoader.exists("res://desktop_controls.gd"):
		return
	var controls_script := load("res://desktop_controls.gd") as GDScript
	if controls_script == null:
		return
	controls = controls_script.new()
	add_child(controls)
	controls.connect("action_pressed", _action)

func _controls_open() -> bool:
	return is_instance_valid(controls) and bool(controls.call("settings_open"))

func _driving() -> bool:
	return started and menu.is_empty() and not _controls_open() and (smoke or get_window().has_focus())

func _sample_drive() -> Dictionary:
	var input := {
		"active": _driving(), "throttle": 0.0, "reverse": 0.0, "steer": 0.0,
		"brakeValue": 0.0, "clutch": 0.0, "reel": false
	}
	if not input.active:
		return input
	if is_instance_valid(controls):
		input.merge(controls.call("sample"), true)
	var left := _key(KEY_A) or _key(KEY_LEFT)
	var right := _key(KEY_D) or _key(KEY_RIGHT)
	if left or right:
		input.steer = float(right) - float(left)
	if _key(KEY_W) or _key(KEY_UP):
		input.throttle = 1.0
	if _key(KEY_S) or _key(KEY_DOWN):
		input.reverse = 1.0
	if _key(KEY_SPACE):
		input.brakeValue = 1.0
	input.reel = bool(input.reel) or _key(KEY_F)
	return input

func _key(code: Key) -> bool:
	return Input.is_physical_key_pressed(code)

func _input(event: InputEvent) -> void:
	if not event is InputEventKey or not event.pressed or event.echo or _controls_open():
		return
	var action: String = SHORTCUTS.get(event.physical_keycode, "")
	if action.is_empty():
		return
	_action(action)
	get_viewport().set_input_as_handled()

func _process(delta: float) -> void:
	if is_instance_valid(controls):
		controls.call("update_feedback", game.get("state"), _driving())
	clock += delta
	notification_remaining = maxf(0.0, notification_remaining - delta)
	if clock >= 0.13:
		clock = 0.0
		_refresh()

func _on_focus_lost() -> void:
	if started and menu.is_empty() and not _controls_open():
		_open_menu("pause")

func _issue(action: String, data: Dictionary = {}) -> void:
	var command := data.duplicate()
	command["type"] = action
	game.call("_command", command)

func _action(action: String) -> void:
	if _controls_open():
		return
	match action:
		"pause":
			if started:
				_open_menu("pause" if menu.is_empty() else "")
			elif menu == "start":
				_begin()
		"garage":
			_open_menu("garage" if menu != "garage" else ("pause" if started else "start"))
		"controls":
			if is_instance_valid(controls):
				if menu.is_empty():
					_open_menu("pause")
				controls.call("open_settings")
			else:
				_notify("控制器设置不可用")
		"quality":
			_set_quality(not bool(save.quality))
			if not menu.is_empty():
				_open_menu(menu)
		"map":
			if started:
				map_overview = not map_overview
				_refresh()
		"winch":
			if _driving():
				_attach_nearest()
		"repair":
			if not _driving():
				return
			if bool(snapshot.get("repairAvailable", false)):
				_issue(action)
				_notify("维修完成")
			else:
				_notify("驶近维修小屋即可修理车辆")
		"gear", "awd", "recover", "camera", "detach":
			if _driving():
				_issue(action)
				_refresh()

func _attach_nearest() -> void:
	var current: Dictionary = game.call("get_snapshot")
	if current.winch != null:
		_notify("按住 F 收绳，按 Q 释放")
		return
	var best: Dictionary = {}
	var best_score := INF
	var heading := Vector2(sin(current.yaw), cos(current.yaw))
	var position := Vector2(current.x, current.z)
	for anchor in current.get("anchors", []):
		var offset := Vector2(anchor.x, anchor.z) - position
		var distance := float(anchor.d)
		var score := distance - (8.0 if heading.dot(offset) > 0.0 else 0.0)
		if score < best_score:
			best = anchor
			best_score = score
	if best.is_empty():
		_notify("24 米内没有锚点")
		return
	_issue("attach", {"id": best.id})
	_notify("绞盘已挂钩，按住 F 收绳")

func _begin() -> void:
	if not started:
		started = true
		_issue("start")
	_open_menu("")

func _switch_region(region: String, restart: bool = false) -> void:
	if region == "snow" and not save.snow_unlocked:
		return
	if not restart and region == save.region:
		_begin()
		return
	save.region = region
	if restart:
		save.progress[region] = 0
	_issue("reset", {
		"region": region, "snowTires": save.snow_tires,
		"progress": _saved_checkpoint(region), "playing": true
	})
	snapshot = game.call("get_snapshot")
	started = true
	_write_save()
	_open_menu("")
	if region == "snow" and not save.snow_tires:
		_notify("普通胎已入雪线，冰面更容易打滑")
	_refresh()

func _buy_tires() -> void:
	if save.snow_tires or int(save.coins) < 180:
		return
	save.coins -= 180
	save.snow_tires = true
	_issue("tires")
	_write_save()
	_open_menu("garage")

func _set_quality(high: bool, persist: bool = true) -> void:
	save.quality = high
	if not smoke:
		get_viewport().scaling_3d_scale = 1.0 if high else 0.8
		get_viewport().msaa_3d = Viewport.MSAA_2X if high else Viewport.MSAA_DISABLED
		var sun := game.get("sun") as DirectionalLight3D
		sun.shadow_enabled = high
		sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_2_SPLITS if high else DirectionalLight3D.SHADOW_ORTHOGONAL
		sun.directional_shadow_max_distance = 100.0 if high else 48.0
	if persist:
		_write_save()
		_notify("高画质 · 动态阴影和抗锯齿" if high else "流畅画质")

func _saved_checkpoint(region: String) -> int:
	var value := int(save.progress.get(region, 0))
	return value if value < 4 else 0

func _load_save() -> void:
	var config := ConfigFile.new()
	if config.load(SAVE_PATH) != OK:
		return
	var coins: Variant = config.get_value("garage", "coins", 0)
	save.coins = clampi(coins, 0, 480) if coins is int else 0
	var tires: Variant = config.get_value("garage", "snow_tires", false)
	var unlocked: Variant = config.get_value("garage", "snow_unlocked", false)
	var quality: Variant = config.get_value("display", "quality", true)
	save.snow_tires = tires if tires is bool else false
	save.snow_unlocked = unlocked if unlocked is bool else false
	save.quality = quality if quality is bool else true
	if save.snow_unlocked and config.get_value("journey", "region", "forest") == "snow":
		save.region = "snow"
	for region in ["forest", "snow"]:
		var checkpoint: Variant = config.get_value("journey", region, 0)
		save.progress[region] = clampi(checkpoint, 0, 4) if checkpoint is int else 0
	var awards: Variant = config.get_value("journey", "awards", [])
	if awards is Array:
		for region in ["forest", "snow"]:
			for index in range(4):
				var key := "%s:%d" % [region, index]
				if key in awards:
					save.awards.append(key)

func _write_save() -> void:
	if smoke:
		return
	var config := ConfigFile.new()
	for key in ["coins", "snow_tires", "snow_unlocked"]:
		config.set_value("garage", key, save[key])
	config.set_value("display", "quality", save.quality)
	for region in ["forest", "snow"]:
		config.set_value("journey", region, save.progress[region])
	config.set_value("journey", "region", save.region)
	config.set_value("journey", "awards", save.awards)
	var temporary := SAVE_PATH + ".tmp"
	if config.save(temporary) == OK:
		var result := DirAccess.rename_absolute(
			ProjectSettings.globalize_path(temporary), ProjectSettings.globalize_path(SAVE_PATH)
		)
		if result != OK:
			push_warning("Unable to finish the desktop save: %d" % result)

func _record_progress(previous: Dictionary, current: Dictionary) -> void:
	if previous.is_empty() or previous.region != current.region or int(current.checkpoint) <= int(previous.checkpoint):
		return
	for index in range(int(previous.checkpoint), int(current.checkpoint)):
		var key := "%s:%d" % [current.region, index]
		if key not in save.awards:
			save.awards.append(key)
			save.coins += 60
			_notify("抵达 %s · +60 金币" % _checkpoint_name(current.region, index))
	save.progress[current.region] = int(current.checkpoint)
	if bool(current.completed):
		if current.region == "forest":
			save.snow_unlocked = true
			_notify("松风谷已完成 · 珠峰雪线现已解锁")
		else:
			_notify("已抵达珠峰雪线终点")
	_write_save()

func _checkpoint_name(region: String, index: int) -> String:
	var points: Array = game.get("checkpoints")
	var safe := clampi(index, 0, points.size() - 1)
	return SNOW_NAMES[safe] if region == "snow" else points[safe].name

func _notify(message: String) -> void:
	toast_label.text = message
	notification_remaining = 4.0
	toast_panel.show()

func _distance(metres: float) -> String:
	return "%.1f km" % (metres / 1000.0) if metres >= 1000.0 else "%d m" % roundi(metres)

func _refresh() -> void:
	var next: Dictionary = game.call("get_snapshot")
	_record_progress(snapshot, next)
	snapshot = next
	var checkpoints: Array = game.get("checkpoints")
	var point: Dictionary = checkpoints[clampi(int(next.checkpoint), 0, checkpoints.size() - 1)]
	var remaining := Vector2(next.x - point.x, next.z - point.z).length()
	var title := String(next.areaName)
	route_label.text = "%s   %d / %d\n%s" % [
		title, next.checkpoint, checkpoints.size(),
		"自由探索 · 已完成路线" if next.completed else "%s · %s" % [_checkpoint_name(next.region, next.checkpoint), _distance(remaining)]
	]
	speed_label.text = "%02d km/h" % roundi(absf(float(next.speed)) * 3.6)
	car_label.text = "%s · 坡度 %.1f°\n车身 %d%%   胎 %d%%   悬挂 %d%%" % [
		SURFACES.get(next.surface, "越野"), next.tilt, next.damage.body, next.damage.tires, next.damage.suspension
	]
	var cable := "绞盘待命" if next.winch == null else "绳长 %.1f m · 按住 F 收绳" % float(next.winch.length)
	equipment_label.text = "%s · %s · %s\n%s" % [
		"四驱" if next.awd else "两驱", "低速挡" if next.lowGear else "公路挡",
		CAMERAS[clampi(int(next.cameraMode), 0, CAMERAS.size() - 1)],
		"正在准备前方路面" if next.blocked else ("可维修 · T" if next.repairAvailable else cable)
	]
	winch_button.text = "释放 Q" if next.winch != null else "挂绞盘 E"
	toast_panel.visible = notification_remaining > 0.0
	map_title.text = "%s   ↑ 北" % ("区域全图" if map_overview else "附近路线")
	map_mode_button.text = "%s · M" % ("5 km / 跟车" if map_overview else "100 m / 全图")
	route_map.call("set_view", snapshot, map_overview)

func _make_interface() -> void:
	var layer := CanvasLayer.new()
	layer.layer = 2
	add_child(layer)
	hud = Control.new()
	hud.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(hud)
	hud.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	hud.theme = _theme()

	var route_card := _placed_panel(hud, Control.PRESET_TOP_LEFT, Vector4(24, 22, 300, 100))
	route_label = _label(route_card, "", 17)

	var map_box := _placed_panel(hud, Control.PRESET_TOP_RIGHT, Vector4(-250, 22, -24, 275))
	map_title = _label(map_box, "", 14)
	var clip := Control.new()
	clip.clip_contents = true
	clip.custom_minimum_size.y = 174
	clip.size_flags_vertical = Control.SIZE_EXPAND_FILL
	clip.mouse_filter = Control.MOUSE_FILTER_IGNORE
	map_box.add_child(clip)
	route_map = NativeMap.new()
	route_map.mouse_filter = Control.MOUSE_FILTER_IGNORE
	clip.add_child(route_map)
	route_map.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	map_mode_button = _button(map_box, "", _action.bind("map"), false)

	var status_card := _placed_panel(hud, Control.PRESET_BOTTOM_LEFT, Vector4(24, -142, 304, -24))
	speed_label = _label(status_card, "", 31)
	car_label = _label(status_card, "", 14)

	var gear_card := _placed_panel(hud, Control.PRESET_BOTTOM_RIGHT, Vector4(-328, -153, -24, -24))
	equipment_label = _label(gear_card, "", 14)
	var row := HBoxContainer.new()
	gear_card.add_child(row)
	winch_button = _button(row, "挂绞盘 E", _winch_button_pressed, false)
	_button(row, "车库 G", _action.bind("garage"), false)
	_button(row, "暂停 Esc", _action.bind("pause"), false)

	var prompt := _placed_panel(hud, Control.PRESET_CENTER_TOP, Vector4(-208, 23, 208, 60))
	toast_label = _label(prompt, "", 15)
	toast_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	toast_panel = prompt.get_parent() as PanelContainer

	menu_shade = ColorRect.new()
	menu_shade.color = Color(0.05, 0.10, 0.09, 0.62)
	menu_shade.mouse_filter = Control.MOUSE_FILTER_STOP
	hud.add_child(menu_shade)
	menu_shade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var center := CenterContainer.new()
	menu_shade.add_child(center)
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var menu_panel := PanelContainer.new()
	menu_panel.custom_minimum_size.x = 480
	center.add_child(menu_panel)
	menu_content = VBoxContainer.new()
	menu_content.add_theme_constant_override("separation", 12)
	menu_panel.add_child(menu_content)
	menu_title = _label(menu_content, "", 32)
	menu_detail = _label(menu_content, "", 15)
	menu_detail.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	menu_detail.custom_minimum_size.x = 430
	menu_buttons = VBoxContainer.new()
	menu_buttons.add_theme_constant_override("separation", 6)
	menu_content.add_child(menu_buttons)

func _placed_panel(parent: Control, preset: Control.LayoutPreset, offsets: Vector4) -> VBoxContainer:
	var panel := PanelContainer.new()
	panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	parent.add_child(panel)
	panel.set_anchors_and_offsets_preset(preset)
	panel.offset_left = offsets.x
	panel.offset_top = offsets.y
	panel.offset_right = offsets.z
	panel.offset_bottom = offsets.w
	var box := VBoxContainer.new()
	box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	box.add_theme_constant_override("separation", 4)
	panel.add_child(box)
	return box

func _label(parent: Node, value: String, font_size: int) -> Label:
	var label := Label.new()
	label.text = value
	label.add_theme_font_size_override("font_size", font_size)
	parent.add_child(label)
	return label

func _button(parent: Node, title: String, callback: Callable, focusable: bool = true) -> Button:
	var button := Button.new()
	button.text = title
	button.custom_minimum_size.y = 38
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	if not focusable:
		button.focus_mode = Control.FOCUS_NONE
	button.pressed.connect(callback)
	parent.add_child(button)
	return button

func _winch_button_pressed() -> void:
	_action("winch" if snapshot.get("winch") == null else "detach")

func _open_menu(mode: String) -> void:
	menu = mode
	menu_shade.visible = not mode.is_empty()
	if mode.is_empty():
		var focused := get_viewport().gui_get_focus_owner()
		if focused:
			focused.release_focus()
		return
	for old in menu_buttons.get_children():
		menu_buttons.remove_child(old)
		old.queue_free()
	var initial: Button
	match mode:
		"start":
			menu_title.text = "山野之间"
			menu_detail.text = "松风谷 / 珠峰雪线\n" + AXIS_HINT
			initial = _button(menu_buttons, "启程", _begin)
			_button(menu_buttons, "车库", _open_menu.bind("garage"))
		"pause":
			menu_title.text = "旅途暂停"
			menu_detail.text = AXIS_HINT + "\nG 车库    M 地图    F2 画质    T 维修"
			initial = _button(menu_buttons, "继续驾驶", _begin)
			_button(menu_buttons, "车库", _open_menu.bind("garage"))
		"garage":
			menu_title.text = "车库 · %d 金币" % int(save.coins)
			menu_detail.text = "检查点首次到达奖励 60 金币。雪地胎可提升雪地抓地，普通胎也可进入已解锁雪线。"
			initial = _button(menu_buttons, "启程 · 松风谷", _switch_region.bind("forest"))
			var snow_button := _button(
				menu_buttons, "启程 · 珠峰雪线" if save.snow_unlocked else "珠峰雪线 · 完成松风谷解锁",
				_switch_region.bind("snow")
			)
			snow_button.disabled = not save.snow_unlocked
			var tire_button := _button(
				menu_buttons, "雪地胎已安装" if save.snow_tires else "购买雪地胎 · 180 金币", _buy_tires
			)
			tire_button.disabled = bool(save.snow_tires) or int(save.coins) < 180
			_button(menu_buttons, "从营地重新出发", _switch_region.bind(save.region, true))
			_button(menu_buttons, "返回", _open_menu.bind("pause" if started else "start"))
	if mode != "garage":
		_button(menu_buttons, "手柄、方向盘与独立踏板", _action.bind("controls"))
		_button(menu_buttons, "画质 · %s" % ("高" if save.quality else "流畅"), _action.bind("quality"))
		_button(menu_buttons, "退出游戏", get_tree().quit)
	if initial:
		initial.grab_focus()

func _style(fill: Color, trim: Color, padding: int) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = fill
	style.border_color = trim
	style.set_border_width_all(1)
	style.set_corner_radius_all(7)
	style.content_margin_left = padding
	style.content_margin_right = padding
	style.content_margin_top = padding
	style.content_margin_bottom = padding
	return style

func _theme() -> Theme:
	var theme := Theme.new()
	theme.default_font_size = 16
	theme.set_color("font_color", "Label", Color("f2eeda"))
	theme.set_color("font_color", "Button", Color("fcf3d4"))
	theme.set_color("font_disabled_color", "Button", Color("adb7a6"))
	theme.set_stylebox("panel", "PanelContainer", _style(Color(0.09, 0.17, 0.15, 0.91), Color("4c6a5a"), 10))
	theme.set_stylebox("normal", "Button", _style(Color("2a473a"), Color("60806e"), 7))
	theme.set_stylebox("hover", "Button", _style(Color("3c5e4d"), Color("a4c0a9"), 7))
	theme.set_stylebox("pressed", "Button", _style(Color("4b684f"), Color("d5bc86"), 7))
	theme.set_stylebox("disabled", "Button", _style(Color("263932"), Color("465950"), 7))
	return theme

func _run_smoke() -> void:
	await get_tree().process_frame
	if snapshot.is_empty() or not snapshot.streaming.groundReady or not is_instance_valid(route_map):
		push_error("Native HUD or boot ground unavailable")
		get_tree().quit(1)
		return
	_begin()
	_action("camera")
	_refresh()
	if not started or snapshot.cameraMode != 1:
		push_error("Native shell could not change camera")
		get_tree().quit(1)
		return
	_open_menu("pause")
	if bool(_sample_drive().active):
		push_error("Native pause failed to neutralize drive input")
		get_tree().quit(1)
		return
	print("NATIVE_SMOKE_OK")
	get_tree().quit()
