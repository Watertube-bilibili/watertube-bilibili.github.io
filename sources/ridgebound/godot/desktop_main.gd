extends Node
## Native menu and input around the shared Godot driving scene.

const DrivingScene = preload("res://main.tscn")
const NativeHUD = preload("res://native_hud.gd")
const ScreenFit = preload("res://screen_fit.gd")
const SAVE_PATH := "user://ridgebound-desktop.cfg"
const ORBIT_NONE := -2
const ORBIT_MOUSE := -1
const SNOW_NAMES := ["冰川前哨", "蓝冰山口", "风雪垭口", "雪线营地"]
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
	"progress": {"forest": 0, "snow": 0}, "awards": [], "quality": true, "vehicle": "rover"
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
var orbit_pointer := ORBIT_NONE
var orbit_position := Vector2.ZERO
var screen_check := 0.0
var portrait_layout := false
var interface: CanvasLayer
var file_dialog: FileDialog

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
		"progress": _saved_checkpoint(save.region),
		"vehicleId": save.vehicle
	})
	game.set("desktop_input_provider", Callable(self, "_sample_drive"))
	add_child(game)
	interface = NativeHUD.new()
	add_child(interface)
	interface.connect("action_requested", _handle_interface)
	_make_file_picker()
	_load_controls()
	_load_touch_controls()
	get_viewport().size_changed.connect(_layout_interface)
	_layout_interface()
	_set_quality(bool(save.quality) and not ("--safe-graphics" in OS.get_cmdline_user_args()), false)
	if save.vehicle != "rover":
		_issue("vehicle", {"id": save.vehicle})
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
	controls.set("interface_theme", interface.get("skin"))
	add_child(controls)
	controls.connect("action_pressed", _action)
	controls.connect("brake_force_changed", _set_brake_calibration)
	_set_brake_calibration(float(controls.get("brake_max_force_n")))

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
	if _continue_scene_orbit(event):
		get_viewport().set_input_as_handled()
		return
	if not event is InputEventKey or not event.pressed or event.echo or _controls_open() or file_dialog.visible or import_pending:
		return
	var action: String = SHORTCUTS.get(event.physical_keycode, "")
	if action.is_empty():
		return
	_action(action)
	get_viewport().set_input_as_handled()

func _unhandled_input(event: InputEvent) -> void:
	# Wheel, pedals and GUI get first refusal. Only a fresh press on the scene
	# may own an orbit; another finger can still control the vehicle.
	if orbit_pointer != ORBIT_NONE or not _can_orbit() or event.device == InputEvent.DEVICE_ID_EMULATION:
		return
	var pointer := ORBIT_NONE
	var position := Vector2.ZERO
	if event is InputEventScreenTouch and event.pressed and not event.canceled:
		pointer = event.index
		position = event.position
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
		pointer = ORBIT_MOUSE
		position = event.position
	if pointer == ORBIT_NONE or not position.is_finite() or _over_driving_ui(position):
		return
	orbit_pointer = pointer
	orbit_position = position
	get_viewport().set_input_as_handled()

func _over_driving_ui(position: Vector2) -> bool:
	return bool(interface.call("captures_point", position))

func _can_orbit() -> bool:
	return is_instance_valid(game) and _driving() and int(game.get("camera_mode")) < 2

func _continue_scene_orbit(event: InputEvent) -> bool:
	if orbit_pointer == ORBIT_NONE or event.device == InputEvent.DEVICE_ID_EMULATION:
		return false
	if not _can_orbit():
		_cancel_scene_orbit()
		return false
	if orbit_pointer == ORBIT_MOUSE:
		if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and not event.pressed:
			_cancel_scene_orbit()
			return true
		if event is InputEventMouseMotion:
			if event.button_mask & MOUSE_BUTTON_MASK_LEFT:
				_orbit_to(event.position)
			else:
				_cancel_scene_orbit()
			return true
	else:
		if event is InputEventScreenTouch and event.index == orbit_pointer and (not event.pressed or event.canceled):
			_cancel_scene_orbit()
			return true
		if event is InputEventScreenDrag and event.index == orbit_pointer:
			_orbit_to(event.position)
			return true
	return false

func _orbit_to(position: Vector2) -> void:
	if not position.is_finite():
		_cancel_scene_orbit()
		return
	var motion := position - orbit_position
	orbit_position = position
	var extent := get_viewport().get_visible_rect().size
	var reference := maxf(180.0, minf(extent.x, extent.y))
	if not motion.is_zero_approx():
		_issue("orbit", {
			"delta": -4.2 * motion.x / reference,
			"pitchDelta": 2.1 * motion.y / reference,
		})

func _cancel_scene_orbit() -> void:
	orbit_pointer = ORBIT_NONE

func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT or what == NOTIFICATION_APPLICATION_PAUSED:
		_cancel_scene_orbit()

func _process(delta: float) -> void:
	if orbit_pointer != ORBIT_NONE and not _can_orbit():
		_cancel_scene_orbit()
	if is_instance_valid(touch_controls) and touch_controls.has_method("set_driving_active"):
		touch_controls.call("set_driving_active", _driving())
	if is_instance_valid(controls):
		controls.call("update_feedback", game.get("state"), _driving())
	clock += delta
	screen_check += delta
	var was_notifying := notification_remaining > 0.0
	notification_remaining = maxf(0.0, notification_remaining - delta)
	if was_notifying and notification_remaining == 0.0:
		interface.call("notify", "")
	if screen_check >= 0.25:
		screen_check = 0.0
		var profile: Vector4 = interface.get("margins")
		if not ScreenFit.margins(get_viewport()).is_equal_approx(profile):
			_layout_interface()
	if clock >= 0.13:
		clock = 0.0
		_refresh()

func _on_focus_lost() -> void:
	_cancel_scene_orbit()
	_clear_winch_buttons()
	if started and menu.is_empty() and not _controls_open():
		_open_menu("pause")

func _issue(action: String, data: Dictionary = {}) -> void:
	if action == "camera" or action == "reset" or action == "recover" or action == "import_map":
		_cancel_scene_orbit()
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
			interface.call("show_winch", winch_menu_open)
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
		"progress": 0 if region == "custom" else _saved_checkpoint(region), "playing": true,
		"vehicleId": save.vehicle,
	})
	if save.vehicle != "rover" and String(game.call("get_snapshot").get("vehicleId", "")) != save.vehicle:
		_issue("vehicle", {"id": save.vehicle})
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
	var saved_vehicle: Variant = config.get_value("garage", "vehicle", "rover")
	save.vehicle = "yuchuan" if saved_vehicle == "yuchuan" else "rover"
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
	for key in ["coins", "snow_tires", "snow_unlocked", "vehicle"]:
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
	notification_remaining = 4.0
	interface.call("notify", message)

func _distance(metres: float) -> String:
	return "%.1f km" % (metres / 1000.0) if metres >= 1000.0 else "%d m" % roundi(metres)

func _make_file_picker() -> void:
	file_dialog = FileDialog.new()
	file_dialog.title = "导入地图 ZIP"
	file_dialog.access = FileDialog.ACCESS_FILESYSTEM
	file_dialog.file_mode = FileDialog.FILE_MODE_OPEN_FILE
	file_dialog.add_filter("*.zip,*.ZIP", "地图模组 ZIP")
	file_dialog.theme = interface.get("skin")
	file_dialog.file_selected.connect(_on_archive_selected)
	add_child(file_dialog)

func _pick_archive() -> void:
	if import_pending:
		return
	_clear_winch_buttons()
	var safe := ScreenFit.margins(get_viewport())
	var extent := get_viewport().get_visible_rect().size
	var margin := Vector2(safe.x, safe.y) + Vector2(16, 16)
	var available := extent - Vector2(safe.x + safe.z, safe.y + safe.w) - Vector2(32, 32)
	var picker_size := Vector2(minf(840.0, available.x), minf(620.0, available.y))
	var box := Rect2(margin + (available - picker_size) * 0.5, picker_size)
	file_dialog.popup(Rect2i(box))

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
	if save.vehicle != "rover" and String(next.get("vehicleId", "")) != save.vehicle:
		_issue("vehicle", {"id": save.vehicle})
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

func _set_reel_held(held: bool) -> void:
	reel_held = held and _driving()

func _set_payout_held(held: bool) -> void:
	payout_held = held and _driving()

func _refresh() -> void:
	var next: Dictionary = game.call("get_snapshot")
	_record_progress(snapshot, next)
	snapshot = next
	var points: Array = game.get("checkpoints")
	var custom := String(next.region) == "custom"
	var region_name := "珠峰雪线" if next.region == "snow" else "松风谷"
	var target := "自由探索"
	if custom:
		region_name = String(next.get("mapName", imported_map.get("name", "自定义地图")))
	elif not points.is_empty() and not bool(next.completed):
		var point: Dictionary = points[clampi(int(next.checkpoint), 0, points.size() - 1)]
		var distance := Vector2(next.x - point.x, next.z - point.z).length()
		target = "%s · %s" % [_checkpoint_name(next.region, next.checkpoint), _distance(distance)]
	interface.call("update_status", next, {
		"overview": map_overview, "regionName": region_name, "routeText": target,
	})
	if next.get("winch") == null:
		_clear_winch_buttons()

func _set_brake_calibration(force_newtons: float) -> void:
	_issue("pedal_calibration", {"maxForceN": force_newtons})

func _layout_interface() -> void:
	_cancel_scene_orbit()
	if is_instance_valid(interface):
		interface.call("reflow")
		var viewport_size := get_viewport().get_visible_rect().size
		var portrait := viewport_size.y >= viewport_size.x
		var changed := portrait_layout != portrait
		portrait_layout = portrait
		if changed and menu == "maps" and is_instance_valid(file_dialog):
			_open_menu("maps")
	if is_instance_valid(controls):
		controls.call("_layout_dialog")

func _open_menu(mode: String) -> void:
	_cancel_scene_orbit()
	_clear_winch_buttons()
	menu = mode
	interface.call("show_screen", mode, {
		"started": started, "save": save, "importedMap": imported_map,
		"importResult": import_result, "pending": import_pending, "vehicle": save.vehicle,
	})
	if mode.is_empty():
		var focused := get_viewport().gui_get_focus_owner()
		if focused:
			focused.release_focus()
	if not snapshot.is_empty():
		_refresh()

func _handle_interface(action: String, value: Variant) -> void:
	if import_pending or _controls_open():
		return
	match action:
		"screen":
			_open_menu(String(value))
		"screen_fit":
			_layout_interface()
		"begin":
			_begin()
		"menu":
			_open_menu("pause")
		"back":
			if menu == "display":
				_open_menu("settings")
			elif menu == "pause":
				_begin()
			elif menu != "start":
				_open_menu("pause" if started else "start")
		"quit":
			get_tree().quit()
		"region":
			_switch_region(String(value))
		"import":
			_pick_archive()
		"tires":
			_buy_tires()
		"restart":
			_switch_region(String(snapshot.get("region", save.region)), true)
		"vehicle":
			var next_id := "yuchuan" if value == "yuchuan" else "rover"
			_issue("vehicle", {"id": next_id})
			_refresh()
			save.vehicle = String(snapshot.get("vehicleId", "rover"))
			_write_save()
			_open_menu("garage")
		"endpoint":
			selected_endpoint = "rear" if value == "rear" else "front"
		"attach":
			_attach_anchor(String(interface.call("anchor_id")))
		"reel":
			_set_reel_held(bool(value))
		"payout":
			_set_payout_held(bool(value))
		_:
			_action(action)

func _run_smoke() -> void:
	await get_tree().process_frame
	if snapshot.is_empty() or not snapshot.streaming.groundReady or not is_instance_valid(interface) or not is_instance_valid(file_dialog):
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
