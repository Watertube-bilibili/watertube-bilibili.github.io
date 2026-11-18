extends Node
## Native menu and input around the shared Godot driving scene.

const DrivingScene = preload("res://main.tscn")
const NativeMap = preload("res://desktop_map.gd")
const SAVE_PATH := "user://ridgebound-desktop.cfg"
const AXIS_HINT := "WASD 或方向键驾驶 · 空格刹车"
const WORKFLOW_HINT := "C 视角 · E 快速挂钩 · F 收绳 · V 放绳 · Q 释放"
const SURFACE_INK := Color("17211e")
const PANEL_INK := Color("1e2b26")
const RAISED_INK := Color("27362e")
const PAPER := Color("f1e9d5")
const SOFT := Color("bfccbb")
const MOSS := Color("d0e78d")
const LINE := Color("526354")
const OCHRE := Color("f6bf72")
const SNOW_NAMES := ["冰川前哨", "蓝冰山口", "风雪垭口", "雪线营地"]
const CAMERAS := ["跟随", "高位", "座舱"]
const SURFACES := {
	"trail": "山间土路", "mud": "泥地", "water": "浅水",
	"grass": "草地", "rock": "岩石", "snow": "积雪", "ice": "冰面"
}
const SHORTCUTS := {
	KEY_C: "camera", KEY_X: "awd", KEY_L: "gear", KEY_R: "recover",
	KEY_T: "repair", KEY_E: "winch", KEY_Q: "detach", KEY_ESCAPE: "pause",
	KEY_G: "garage", KEY_M: "map", KEY_F2: "quality", KEY_TAB: "maps"
}

var game: Node3D
var controls: CanvasLayer
var touch_controls: Node
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
var imported_map: Dictionary = {}
var import_result: Dictionary = {}
var import_request := 0
var import_pending := false
var winch_menu_open := false
var reel_held := false
var payout_held := false
var selected_endpoint := "front"
var anchor_ids := PackedStringArray()

var driving_panels: Array[Control] = []
var file_dialog: FileDialog
var archive_map: Control
var menu_section: Label
var selected_anchor: OptionButton
var winch_details: PanelContainer
var winch_line: Label
var winch_attach_selected: Button
var winch_tension: ProgressBar
var winch_reel: Button
var winch_pay: Button
var winch_release: Button
var route_progress: ProgressBar
var region_label: Label
var damage_label: Label
var status_panel: PanelContainer
var gear_panel: PanelContainer
var map_panel: PanelContainer
var route_panel: PanelContainer
var menu_panel: PanelContainer
var map_preview_panel: PanelContainer

var hud: Control
var menu_shade: ColorRect
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
		if OS.has_feature("android"):
			get_window().content_scale_size = Vector2i(720, 420)
		else:
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
	_make_file_picker()
	_load_controls()
	_load_touch_controls()
	get_viewport().size_changed.connect(_layout_interface)
	_layout_interface()
	_set_quality(bool(save.quality) and not ("--safe-graphics" in OS.get_cmdline_user_args()), false)
	_open_menu("start")
	_refresh()
	get_window().focus_exited.connect(_on_focus_lost)
	get_window().files_dropped.connect(_on_files_dropped)
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
	controls.set("interface_theme", hud.theme)
	add_child(controls)
	controls.connect("action_pressed", _action)

func _load_touch_controls() -> void:
	var script_path := "res://touch_drive.gd"
	if not OS.has_feature("android") or not ResourceLoader.exists(script_path):
		return
	var script := load(script_path) as GDScript
	if script == null:
		return
	touch_controls = script.new()
	add_child(touch_controls)
	if touch_controls.has_signal("action_pressed"):
		touch_controls.connect("action_pressed", _action)

func _controls_open() -> bool:
	return is_instance_valid(controls) and bool(controls.call("settings_open"))

func _driving() -> bool:
	return started and menu.is_empty() and not import_pending and not file_dialog.visible \
		and not _controls_open() and (smoke or get_window().has_focus())

func _sample_drive() -> Dictionary:
	var input := {
		"active": _driving(), "throttle": 0.0, "reverse": 0.0, "steer": 0.0,
		"brakeValue": 0.0, "clutch": 0.0, "reel": false, "payout": false
	}
	if not input.active:
		return input
	if is_instance_valid(controls):
		input.merge(controls.call("sample"), true)
	if is_instance_valid(touch_controls) and touch_controls.has_method("sample"):
		var touch: Dictionary = touch_controls.call("sample")
		for key in ["throttle", "reverse", "brakeValue", "clutch"]:
			input[key] = maxf(float(input[key]), float(touch.get(key, 0.0)))
		var touch_steer := float(touch.get("steer", 0.0))
		if absf(touch_steer) > absf(float(input.steer)):
			input.steer = touch_steer
		input.reel = bool(input.reel) or bool(touch.get("reel", false))
		input.payout = bool(input.payout) or bool(touch.get("payout", false))
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
	input.reel = bool(input.reel) or reel_held or _key(KEY_F)
	input.payout = bool(input.payout) or payout_held or _key(KEY_V)
	return input

func _key(code: Key) -> bool:
	return Input.is_physical_key_pressed(code)

func _input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and not event.pressed:
		_clear_winch_buttons()
	if not event is InputEventKey or not event.pressed or event.echo or _controls_open() or file_dialog.visible or import_pending:
		return
	var action: String = SHORTCUTS.get(event.physical_keycode, "")
	if action.is_empty():
		return
	_action(action)
	get_viewport().set_input_as_handled()

func _process(delta: float) -> void:
	if is_instance_valid(touch_controls) and touch_controls.has_method("set_driving_active"):
		touch_controls.call("set_driving_active", _driving())
	if is_instance_valid(controls):
		controls.call("update_feedback", game.get("state"), _driving())
	clock += delta
	notification_remaining = maxf(0.0, notification_remaining - delta)
	if clock >= 0.13:
		clock = 0.0
		_refresh()

func _on_focus_lost() -> void:
	_clear_winch_buttons()
	if started and menu.is_empty() and not _controls_open():
		_open_menu("pause")

func _issue(action: String, data: Dictionary = {}) -> void:
	var command := data.duplicate()
	command["type"] = action
	game.call("_command", command)

func _action(action: String) -> void:
	if _controls_open() or file_dialog.visible or import_pending:
		return
	match action:
		"pause":
			if started:
				_open_menu("pause" if menu.is_empty() else "")
			elif menu == "start":
				_begin()
		"garage":
			_open_menu("garage" if menu != "garage" else ("pause" if started else "start"))
		"maps":
			_open_menu("maps" if menu != "maps" else ("pause" if started else "start"))
		"winch_panel":
			winch_menu_open = not winch_menu_open
			_clear_winch_buttons()
			_refresh()
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
		_notify("F 收绳 · V 放绳 · Q 释放")
		return
	var best: Dictionary = {}
	var best_score := INF
	var heading := Vector2(sin(current.yaw), cos(current.yaw))
	if selected_endpoint == "rear":
		heading = -heading
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
	_attach_anchor(String(best.id))

func _begin() -> void:
	if not started:
		started = true
		_issue("start")
	_open_menu("")

func _switch_region(region: String, restart: bool = false) -> void:
	if import_pending or (region == "snow" and not save.snow_unlocked):
		return
	if region == "custom" and imported_map.is_empty():
		return
	if not restart and region == snapshot.get("region", save.region):
		_begin()
		return
	if region != "custom":
		save.region = region
		if restart:
			save.progress[region] = 0
	_issue("reset", {
		"region": region, "snowTires": save.snow_tires,
		"progress": 0 if region == "custom" else _saved_checkpoint(region), "playing": true
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
	if previous.is_empty() or current.region == "custom" or previous.region != current.region or int(current.checkpoint) <= int(previous.checkpoint):
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
	if points.is_empty():
		return "自由探索"
	var safe := clampi(index, 0, points.size() - 1)
	return SNOW_NAMES[safe] if region == "snow" else String(points[safe].get("name", "检查点"))

func _notify(message: String) -> void:
	toast_label.text = message
	notification_remaining = 4.0
	toast_panel.show()

func _distance(metres: float) -> String:
	return "%.1f km" % (metres / 1000.0) if metres >= 1000.0 else "%d m" % roundi(metres)

func _make_file_picker() -> void:
	file_dialog = FileDialog.new()
	file_dialog.title = "导入地图 ZIP"
	file_dialog.access = FileDialog.ACCESS_FILESYSTEM
	file_dialog.file_mode = FileDialog.FILE_MODE_OPEN_FILE
	file_dialog.add_filter("*.zip,*.ZIP", "地图模组 ZIP")
	file_dialog.theme = hud.theme
	file_dialog.file_selected.connect(_on_archive_selected)
	add_child(file_dialog)

func _pick_archive() -> void:
	if import_pending:
		return
	_clear_winch_buttons()
	file_dialog.popup_centered_ratio(0.74)

func _on_files_dropped(paths: PackedStringArray) -> void:
	if _controls_open() or import_pending or paths.is_empty():
		return
	if paths.size() != 1:
		_show_import_error("请一次拖入一个地图 ZIP")
		return
	if file_dialog.visible:
		file_dialog.hide()
	_on_archive_selected(paths[0])

func _on_archive_selected(path: String) -> void:
	if import_pending:
		return
	if path.get_extension().to_lower() != "zip":
		_show_import_error("请选择 .zip 地图包")
		return
	import_request += 1
	import_pending = true
	_open_menu("maps")
	# Draw the busy status and neutralize force feedback before parsing.
	await get_tree().process_frame
	_issue("import_map", {"path": path, "requestId": import_request})
	var next: Dictionary = game.call("get_snapshot")
	import_result = next.get("importResult", {})
	import_pending = false
	if int(import_result.get("requestId", -1)) != import_request:
		_show_import_error("地图导入未完成")
		return
	if not bool(import_result.get("ok", false)):
		_show_import_error(String(import_result.get("error", "地图 ZIP 无法读取")))
		return
	imported_map = import_result.get("summary", {})
	if imported_map.is_empty():
		imported_map = next.get("customMap", {})
	snapshot = next
	started = true
	_issue("start")
	_open_menu("")
	_notify("已载入 %s" % imported_map.get("name", "自定义地图"))
	_refresh()

func _show_import_error(message: String) -> void:
	import_result = {"error": message}
	_open_menu("maps")

func _clear_winch_buttons() -> void:
	reel_held = false
	payout_held = false

func _attach_anchor(id: String) -> void:
	if not _driving() or id.is_empty() or snapshot.get("winch") != null:
		return
	_issue("attach", {"id": id, "endpoint": selected_endpoint})
	_refresh()
	if snapshot.get("winch") != null:
		_notify("已挂接%s绞盘" % ("后部" if selected_endpoint == "rear" else "前部"))

func _attach_selected_anchor() -> void:
	if selected_anchor.selected >= 0:
		_attach_anchor(String(selected_anchor.get_item_metadata(selected_anchor.selected)))

func _set_winch_endpoint(index: int) -> void:
	selected_endpoint = "rear" if index == 1 else "front"

func _set_reel_held(held: bool) -> void:
	reel_held = held and _driving()

func _set_payout_held(held: bool) -> void:
	payout_held = held and _driving()

func _refresh_winch(next: Dictionary) -> void:
	var cable: Variant = next.get("winch")
	var attached := cable is Dictionary
	var ids := PackedStringArray()
	for anchor in next.get("anchors", []):
		ids.append(String(anchor.id))
	if ids != anchor_ids:
		var previous := ""
		if selected_anchor.selected >= 0:
			previous = String(selected_anchor.get_item_metadata(selected_anchor.selected))
		anchor_ids = ids
		selected_anchor.clear()
		for anchor in next.get("anchors", []):
			var index := selected_anchor.item_count
			selected_anchor.add_item("锚点 %d · %s" % [index + 1, _distance(float(anchor.d))])
			selected_anchor.set_item_metadata(index, String(anchor.id))
			if String(anchor.id) == previous:
				selected_anchor.select(index)
		if selected_anchor.selected < 0 and selected_anchor.item_count > 0:
			selected_anchor.select(0)
	if ids.is_empty():
		selected_anchor.text = "附近暂无锚点"
	selected_anchor.disabled = attached or ids.is_empty()
	winch_attach_selected.disabled = attached or ids.is_empty()
	winch_release.disabled = not attached
	winch_reel.disabled = not attached
	winch_pay.disabled = not attached
	if attached:
		var endpoint := "后部" if cable.get("endpoint", "front") == "rear" else "前部"
		var tension := clampf(float(cable.get("tension", 0.0)), 0.0, 1.0)
		winch_line.text = "%s · %.1f m · 张力 %d%%" % [endpoint, float(cable.length), roundi(tension * 100)]
		winch_tension.value = tension
	else:
		winch_line.text = "附近锚点 %d · 可按 E 快速挂接" % ids.size()
		winch_tension.value = 0.0
		_clear_winch_buttons()
	winch_button.text = "绞盘  收起" if winch_menu_open else ("绞盘  已挂接" if attached else "绞盘")
	winch_details.visible = menu.is_empty() and winch_menu_open
	_update_hud_panels()

func _refresh() -> void:
	var next: Dictionary = game.call("get_snapshot")
	_record_progress(snapshot, next)
	snapshot = next
	var checkpoints: Array = game.get("checkpoints")
	var custom := String(next.region) == "custom"
	var region_name := "珠峰雪线" if next.region == "snow" else "松风谷"
	if custom:
		region_name = String(next.get("mapName", imported_map.get("name", "自定义地图")))
	region_label.text = region_name
	route_label.text = "%s · 自由探索" % String(next.areaName)
	route_progress.visible = not custom and not checkpoints.is_empty()
	if route_progress.visible:
		var point: Dictionary = checkpoints[clampi(int(next.checkpoint), 0, checkpoints.size() - 1)]
		var remaining := Vector2(next.x - point.x, next.z - point.z).length()
		route_label.text = "%s  ·  %s" % [_checkpoint_name(next.region, next.checkpoint), _distance(remaining)]
		if next.completed:
			route_label.text = "自由探索 · 路线已完成"
		route_progress.max_value = checkpoints.size()
		route_progress.value = int(next.checkpoint)
	speed_label.text = "%02d" % roundi(absf(float(next.speed)) * 3.6)
	car_label.text = "%s   坡度 %.1f°" % [SURFACES.get(next.surface, "越野"), next.tilt]
	damage_label.text = "车身 %d%%   轮胎 %d%%   悬挂 %d%%" % [next.damage.body, next.damage.tires, next.damage.suspension]
	var mode := "%s / %s" % ["四驱" if next.awd else "两驱", "低速挡" if next.lowGear else "高挡"]
	equipment_label.text = "%s   ·   %s" % [mode, CAMERAS[clampi(int(next.cameraMode), 0, CAMERAS.size() - 1)]]
	if next.blocked:
		equipment_label.text = "正在准备前方路面"
	elif next.repairAvailable:
		equipment_label.text += "   可维修 T"
	toast_panel.visible = notification_remaining > 0.0
	map_title.text = "%s   ↑ 北" % ("区域全图" if map_overview else "附近路线")
	map_mode_button.text = "%s · M" % ("跟车" if map_overview else "全图")
	route_map.call("set_view", next, map_overview)
	if map_preview_panel.visible:
		archive_map.call("set_view", next, true)
	_refresh_winch(next)

func _make_interface() -> void:
	var layer := CanvasLayer.new()
	layer.layer = 2
	add_child(layer)
	hud = Control.new()
	hud.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(hud)
	hud.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	hud.theme = _theme()

	var route_card := _placed_panel(hud, Control.PRESET_TOP_LEFT, Vector4(20, 70, 288, 164))
	route_panel = route_card.get_parent() as PanelContainer
	driving_panels.append(route_panel)
	region_label = _label(route_card, "", 20)
	route_label = _label(route_card, "", 15)
	route_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	route_progress = ProgressBar.new()
	route_progress.show_percentage = false
	route_progress.custom_minimum_size.y = 4
	route_card.add_child(route_progress)

	var map_box := _placed_panel(hud, Control.PRESET_TOP_RIGHT, Vector4(-232, 70, -20, 299))
	map_panel = map_box.get_parent() as PanelContainer
	driving_panels.append(map_panel)
	var map_row := HBoxContainer.new()
	map_box.add_child(map_row)
	map_title = _label(map_row, "", 14)
	map_title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	map_mode_button = _button(map_row, "", _action.bind("map"), false)
	map_mode_button.custom_minimum_size.y = 32
	map_mode_button.size_flags_horizontal = Control.SIZE_SHRINK_END
	route_map = _create_map(map_box, 164)

	var status_card := _placed_panel(hud, Control.PRESET_BOTTOM_LEFT, Vector4(20, -154, 288, -20))
	status_panel = status_card.get_parent() as PanelContainer
	driving_panels.append(status_panel)
	var speed_line := HBoxContainer.new()
	status_card.add_child(speed_line)
	speed_label = _label(speed_line, "00", 42)
	speed_label.modulate = MOSS
	_label(speed_line, "km/h", 16)
	car_label = _label(status_card, "", 15)
	damage_label = _label(status_card, "", 14)
	damage_label.modulate = SOFT

	var gear_card := _placed_panel(hud, Control.PRESET_BOTTOM_RIGHT, Vector4(-340, -120, -20, -20))
	gear_panel = gear_card.get_parent() as PanelContainer
	driving_panels.append(gear_panel)
	equipment_label = _label(gear_card, "", 15)
	var row := HBoxContainer.new()
	gear_card.add_child(row)
	winch_button = _button(row, "绞盘", _action.bind("winch_panel"), false)
	_button(row, "脱困 R", _action.bind("recover"), false)
	_button(row, "视角 C", _action.bind("camera"), false)
	if OS.has_feature("android"):
		var modes := HBoxContainer.new()
		gear_card.add_child(modes)
		_button(modes, "挡位", _action.bind("gear"), false)
		_button(modes, "驱动", _action.bind("awd"), false)
		_button(modes, "维修", _action.bind("repair"), false)
	_make_winch_panel()

	var prompt := _placed_panel(hud, Control.PRESET_CENTER_TOP, Vector4(-215, 73, 215, 118))
	toast_label = _label(prompt, "", 15)
	toast_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	toast_panel = prompt.get_parent() as PanelContainer

	menu_shade = ColorRect.new()
	menu_shade.color = Color(0.04, 0.08, 0.07, 0.48)
	menu_shade.mouse_filter = Control.MOUSE_FILTER_STOP
	hud.add_child(menu_shade)
	menu_shade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)

	var menu_box := _placed_panel(menu_shade, Control.PRESET_TOP_LEFT, Vector4(20, 70, 456, 580))
	menu_panel = menu_box.get_parent() as PanelContainer
	menu_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	menu_panel.add_theme_stylebox_override("panel", _style(SURFACE_INK, LINE, 20))
	menu_panel.set_anchor(SIDE_BOTTOM, 1.0)
	menu_panel.offset_bottom = -20
	menu_box.size_flags_vertical = Control.SIZE_EXPAND_FILL
	menu_box.add_theme_constant_override("separation", 11)
	menu_section = _label(menu_box, "", 14)
	menu_section.modulate = MOSS
	menu_title = _label(menu_box, "", 32)
	menu_detail = _label(menu_box, "", 16)
	menu_detail.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	menu_detail.modulate = SOFT
	var scroller := ScrollContainer.new()
	scroller.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroller.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroller.follow_focus = true
	menu_box.add_child(scroller)
	menu_buttons = VBoxContainer.new()
	menu_buttons.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	menu_buttons.add_theme_constant_override("separation", 8)
	scroller.add_child(menu_buttons)

	var preview := _placed_panel(menu_shade, Control.PRESET_TOP_RIGHT, Vector4(-431, 70, -20, 505))
	map_preview_panel = preview.get_parent() as PanelContainer
	_label(preview, "当前区域   ↑ 北", 16)
	archive_map = _create_map(preview, 230)
	map_preview_panel.hide()
	_make_header()

func _create_map(parent: Container, height: float) -> Control:
	var clip := Control.new()
	clip.clip_contents = true
	clip.custom_minimum_size.y = height
	clip.size_flags_vertical = Control.SIZE_EXPAND_FILL
	clip.mouse_filter = Control.MOUSE_FILTER_IGNORE
	parent.add_child(clip)
	var view := NativeMap.new()
	view.mouse_filter = Control.MOUSE_FILTER_IGNORE
	clip.add_child(view)
	view.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	return view

func _make_header() -> void:
	var header := PanelContainer.new()
	hud.add_child(header)
	header.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	header.offset_bottom = 56
	header.add_theme_stylebox_override("panel", _style(SURFACE_INK, LINE, 8, 0))
	var nav := HBoxContainer.new()
	nav.add_theme_constant_override("separation", 8)
	header.add_child(nav)
	var product := _label(nav, "  山野之间    RIDGEBOUND", 18)
	product.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	product.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	_button(nav, "地图", _action.bind("maps"), false)
	_button(nav, "车库", _action.bind("garage"), false)
	_button(nav, "控制器", _action.bind("controls"), false)
	_button(nav, "暂停", _action.bind("pause"), false)

func _make_winch_panel() -> void:
	var box := _placed_panel(hud, Control.PRESET_BOTTOM_RIGHT, Vector4(-340, -338, -20, -130))
	winch_details = box.get_parent() as PanelContainer
	winch_details.add_theme_stylebox_override("panel", _style(SURFACE_INK, LINE, 10))
	var head := HBoxContainer.new()
	box.add_child(head)
	var heading := _label(head, "绞盘控制", 20)
	heading.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_button(head, "收起", _action.bind("winch_panel"), false).size_flags_horizontal = Control.SIZE_SHRINK_END
	var choose := HBoxContainer.new()
	box.add_child(choose)
	var endpoint := OptionButton.new()
	endpoint.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	endpoint.add_item("前部绞盘")
	endpoint.add_item("后部绞盘")
	endpoint.item_selected.connect(_set_winch_endpoint)
	choose.add_child(endpoint)
	selected_anchor = OptionButton.new()
	selected_anchor.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	choose.add_child(selected_anchor)
	var attach := HBoxContainer.new()
	box.add_child(attach)
	winch_attach_selected = _button(attach, "挂接", _attach_selected_anchor, false)
	winch_release = _button(attach, "释放 Q", _action.bind("detach"), false)
	winch_line = _label(box, "", 14)
	winch_tension = ProgressBar.new()
	winch_tension.custom_minimum_size.y = 5
	winch_tension.show_percentage = false
	winch_tension.max_value = 1.0
	box.add_child(winch_tension)
	var row := HBoxContainer.new()
	box.add_child(row)
	winch_reel = _button(row, "按住收绳 F", Callable(), false)
	winch_pay = _button(row, "按住放绳 V", Callable(), false)
	winch_reel.button_down.connect(_set_reel_held.bind(true))
	winch_reel.button_up.connect(_set_reel_held.bind(false))
	winch_pay.button_down.connect(_set_payout_held.bind(true))
	winch_pay.button_up.connect(_set_payout_held.bind(false))
	winch_details.hide()

func _layout_interface() -> void:
	if not is_instance_valid(map_preview_panel):
		return
	var viewport := get_viewport().get_visible_rect().size
	var narrow := viewport.x < 970.0
	var phone := OS.has_feature("android")
	var portrait := viewport.y > viewport.x
	var short_phone := phone and not portrait and viewport.y < 590.0
	var status_bottom := -200.0 if phone else -20.0
	var gear_height := 142.0 if phone else 100.0
	var tool_bottom := status_bottom - gear_height - 10.0
	if short_phone:
		status_bottom = 199.0 - viewport.y
		tool_bottom = maxf(310.0, viewport.y - 55.0) - viewport.y
	status_panel.offset_bottom = status_bottom
	status_panel.offset_top = status_bottom - 134
	gear_panel.offset_bottom = 70.0 + gear_height - viewport.y if short_phone else status_bottom
	gear_panel.offset_top = gear_panel.offset_bottom - gear_height
	if narrow:
		status_panel.offset_right = 273
		gear_panel.offset_left = -297
	else:
		status_panel.offset_right = 288
		gear_panel.offset_left = -340
	winch_details.offset_bottom = tool_bottom
	winch_details.offset_top = tool_bottom - 224
	winch_details.offset_left = gear_panel.offset_left
	winch_details.offset_right = -20.0
	if short_phone:
		winch_details.offset_left = -viewport.x * 0.5 - 146.0
		winch_details.offset_right = -viewport.x * 0.5 + 146.0
		winch_details.offset_top = 66.0 - viewport.y
	map_panel.offset_left = -193 if narrow else -232
	menu_panel.offset_right = minf(viewport.x - 20.0, 460.0 if not narrow else 423.0)
	if phone and portrait:
		menu_panel.offset_right = viewport.x - 20.0
	map_preview_panel.visible = menu == "maps" and not (phone and portrait)
	if map_preview_panel.visible:
		map_preview_panel.offset_left = -maxf(320.0, viewport.x - menu_panel.offset_right - 40.0)
		map_preview_panel.offset_bottom = maxf(350.0, minf(viewport.y - 24.0, 510.0))
	_update_hud_panels()

func _update_hud_panels() -> void:
	var visible := menu.is_empty()
	for panel in driving_panels:
		panel.visible = visible
	var viewport := get_viewport().get_visible_rect().size
	if OS.has_feature("android") and viewport.x > viewport.y and viewport.y < 590.0:
		route_panel.hide()
		map_panel.hide()
		if winch_menu_open:
			gear_panel.hide()
			status_panel.hide()

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
	if callback.is_valid():
		button.pressed.connect(callback)
	parent.add_child(button)
	return button

func _open_menu(mode: String) -> void:
	menu = mode
	_clear_winch_buttons()
	menu_shade.visible = not mode.is_empty()
	winch_details.visible = mode.is_empty() and winch_menu_open
	_layout_interface()
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
			menu_section.text = "驾驶"
			menu_title.text = "山野之间"
			menu_detail.text = AXIS_HINT + "\n" + WORKFLOW_HINT
			if OS.has_feature("android"):
				menu_detail.text = "左手转动方向盘，右手控制油门、刹车和倒车"
			initial = _menu_button("启程", _begin, true)
			_menu_button("地图与 ZIP 导入", _open_menu.bind("maps"))
			_menu_button("车库", _open_menu.bind("garage"))
		"pause":
			menu_section.text = "驾驶"
			menu_title.text = "旅途暂停"
			menu_detail.text = AXIS_HINT + "\n" + WORKFLOW_HINT + "\nT 维修 · L 低速挡 · X 四驱"
			if OS.has_feature("android"):
				menu_detail.text = "从这里切换地图或调整控制器"
			initial = _menu_button("继续驾驶", _begin, true)
			_menu_button("地图与 ZIP 导入", _open_menu.bind("maps"))
			_menu_button("车库", _open_menu.bind("garage"))
		"maps":
			menu_section.text = "路线选择"
			menu_title.text = "地图"
			menu_detail.text = "选择区域，或导入自己的地图 ZIP。"
			initial = _menu_button("松风谷", _switch_region.bind("forest"), true)
			initial.disabled = import_pending
			var snow_button := _menu_button(
				"珠峰雪线" if save.snow_unlocked else "珠峰雪线 · 完成松风谷解锁",
				_switch_region.bind("snow")
			)
			snow_button.disabled = import_pending or not save.snow_unlocked
			if not imported_map.is_empty():
				var custom_button := _menu_button(
					"%s · 自定义地图" % String(imported_map.get("name", "已导入")), _switch_region.bind("custom")
				)
				custom_button.disabled = import_pending
			_menu_separator()
			var import_button := _menu_button("导入地图 ZIP", _pick_archive)
			import_button.disabled = import_pending
			var status := _label(menu_buttons, "", 15)
			status.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
			status.text = "选择 ZIP 文件" if OS.has_feature("android") else "选择 ZIP 文件，也可拖入游戏窗口。"
			status.modulate = SOFT
			if import_pending:
				status.text = "正在读取地图…"
			elif import_result.has("error"):
				status.text = String(import_result.error)
				status.modulate = OCHRE
			elif not imported_map.is_empty():
				status.text = "已导入 %s · 本次游戏可用" % String(imported_map.get("name", "自定义地图"))
				var warnings: Variant = imported_map.get("warnings", [])
				if (warnings is Array or warnings is PackedStringArray) and not warnings.is_empty():
					status.text += "\n" + String(warnings[0])
			var back_button := _menu_button("返回", _open_menu.bind("pause" if started else "start"))
			back_button.disabled = import_pending
		"garage":
			menu_section.text = "车辆与物资"
			menu_title.text = "车库"
			menu_detail.text = "%d 金币 · 首次到达检查点奖励 60" % int(save.coins)
			var tire_button := _menu_button(
				"雪地胎已安装" if save.snow_tires else "购买雪地胎 · 180 金币", _buy_tires
			)
			tire_button.disabled = bool(save.snow_tires) or int(save.coins) < 180
			var active_region := String(snapshot.get("region", save.region))
			_menu_button("返回当前地图营地", _switch_region.bind(active_region, true))
			initial = _menu_button("返回", _open_menu.bind("pause" if started else "start"), true)
	if mode == "start" or mode == "pause":
		_menu_separator()
		_menu_button("手柄、方向盘和踏板", _action.bind("controls"))
		_menu_button("画质 · %s" % ("高" if save.quality else "流畅"), _action.bind("quality"))
		_menu_button("退出游戏", get_tree().quit)
	if initial and not initial.disabled and not OS.has_feature("android"):
		initial.grab_focus()

func _menu_separator() -> void:
	var separator := HSeparator.new()
	separator.custom_minimum_size.y = 12
	menu_buttons.add_child(separator)

func _menu_button(title: String, callback: Callable, primary: bool = false) -> Button:
	var button := _button(menu_buttons, title, callback)
	button.alignment = HORIZONTAL_ALIGNMENT_LEFT
	button.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	button.custom_minimum_size.y = 47 if OS.has_feature("android") else 44
	if primary:
		button.theme_type_variation = &"PrimaryButton"
	return button

func _style(fill: Color, trim: Color, padding: int, radius: int = 9) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = fill
	style.border_color = trim
	style.set_border_width_all(1)
	style.set_corner_radius_all(radius)
	style.content_margin_left = padding
	style.content_margin_right = padding
	style.content_margin_top = padding
	style.content_margin_bottom = padding
	return style

func _theme() -> Theme:
	var theme := Theme.new()
	theme.default_font_size = 16
	theme.set_color("font_color", "Label", PAPER)
	theme.set_stylebox("panel", "PanelContainer", _style(Color(PANEL_INK, 0.94), LINE, 11))
	theme.set_stylebox("panel", "AcceptDialog", _style(SURFACE_INK, LINE, 13))
	theme.set_stylebox("panel", "PopupMenu", _style(SURFACE_INK, LINE, 6))
	theme.set_color("font_color", "PopupMenu", PAPER)
	theme.set_stylebox("background", "ProgressBar", _style(SURFACE_INK, SURFACE_INK, 1, 1))
	theme.set_stylebox("fill", "ProgressBar", _style(MOSS, MOSS, 1, 1))
	var focus := _style(Color.TRANSPARENT, MOSS, 4)
	focus.set_border_width_all(2)
	for button_type in ["Button", "OptionButton"]:
		theme.set_color("font_color", button_type, PAPER)
		theme.set_color("font_disabled_color", button_type, SOFT.darkened(0.25))
		theme.set_stylebox("normal", button_type, _style(RAISED_INK, LINE, 9))
		theme.set_stylebox("hover", button_type, _style(RAISED_INK.lightened(0.08), SOFT, 9))
		theme.set_stylebox("pressed", button_type, _style(LINE, MOSS, 9))
		theme.set_stylebox("disabled", button_type, _style(SURFACE_INK, LINE.darkened(0.25), 9))
		theme.set_stylebox("focus", button_type, focus)
	theme.set_type_variation(&"PrimaryButton", &"Button")
	for color_key in ["font_color", "font_pressed_color", "font_hover_color", "font_focus_color", "font_hover_pressed_color"]:
		theme.set_color(color_key, "PrimaryButton", SURFACE_INK)
	theme.set_stylebox("normal", "PrimaryButton", _style(MOSS, MOSS, 10))
	theme.set_stylebox("hover", "PrimaryButton", _style(MOSS.lightened(0.18), PAPER, 10))
	theme.set_stylebox("pressed", "PrimaryButton", _style(MOSS.darkened(0.12), MOSS, 10))
	return theme

func _run_smoke() -> void:
	await get_tree().process_frame
	if snapshot.is_empty() or not snapshot.streaming.groundReady or not is_instance_valid(route_map) or not is_instance_valid(file_dialog):
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
