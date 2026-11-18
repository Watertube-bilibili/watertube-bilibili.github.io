extends CanvasLayer
## Native controller setup. Browser controls stay in the web interface.
signal action_pressed(action: String)
signal brake_force_changed(force_newtons: float)

const BRIDGE_URL = "http://127.0.0.1:8767"
const ScreenFit = preload("res://screen_fit.gd")
const CONFIG_PATH = "user://desktop-controls.cfg"
const BINDING_LABELS = {
	"steer": "转向", "throttle": "油门", "brake": "刹车", "clutch": "离合器"
}
const PAD_ACTIONS = {
	JOY_BUTTON_Y: "camera",
	JOY_BUTTON_X: "gear",
	JOY_BUTTON_A: "awd",
	JOY_BUTTON_LEFT_SHOULDER: "winch",
	JOY_BUTTON_DPAD_RIGHT: "detach",
	JOY_BUTTON_DPAD_UP: "recover",
	JOY_BUTTON_DPAD_DOWN: "repair",
	JOY_BUTTON_START: "pause",
}

var _bindings: Dictionary = {}
var _devices: Array = []
var _bridge_status: Dictionary = {}
var _bridge_at = -1000
var _bridge_pid = -1
var _token = ""
var _input_request: HTTPRequest
var _force_request: HTTPRequest
var _poll_clock = 0.0
var _force_clock = 0.0
var _force_enabled = false
var _rearm_pending = false
var _rearm_sent = false
var _rearm_at = -1000
var _force_strength = 0.35
var _force_sent = false

var interface_theme: Theme
var brake_max_force_n := 1400.0
var _dialog: AcceptDialog
var _device_label: Label
var _status_label: Label
var _capture_label: Label
var _binding_labels: Dictionary = {}
var _bind_buttons: Dictionary = {}
var _force_check: CheckButton
var _retry_button: Button
var _capture_key = ""
var _capture_until = 0
var _capture_axes: Dictionary = {}
var _capture_best: Dictionary = {}
var _capture_instructions = "先让方向盘回中、踏板松开，再选择要绑定的操作。"

func _ready() -> void:
	layer = 15
	process_mode = Node.PROCESS_MODE_ALWAYS
	_load_settings()
	_build_dialog()
	if OS.get_name() != "Windows":
		return
	_input_request = _make_request()
	_input_request.request_completed.connect(_on_input)
	_force_request = _make_request()
	_force_request.request_completed.connect(_on_force_reply)
	_start_bridge()

func _make_request() -> HTTPRequest:
	var request := HTTPRequest.new()
	request.use_threads = true
	request.timeout = 0.4
	request.body_size_limit = 131072
	request.max_redirects = 0
	add_child(request)
	return request

func _start_bridge() -> void:
	if OS.get_name() != "Windows":
		return
	if _bridge_pid > 0 and OS.is_process_running(_bridge_pid):
		return
	var executable := OS.get_executable_path().get_base_dir().path_join("ridgebound-wheel-bridge.exe")
	if not FileAccess.file_exists(executable):
		return
	var session_key := Crypto.new().generate_random_bytes(16).hex_encode()
	if session_key.length() != 32:
		return
	_token = session_key
	_bridge_pid = OS.create_process(executable, PackedStringArray([
		"--controller-only", "--parent-pid", str(OS.get_process_id()), "--native-token", _token
	]), false)

func _bridge_fresh() -> bool:
	return Time.get_ticks_msec() - _bridge_at < 230

func _headers() -> PackedStringArray:
	return PackedStringArray(["X-Ridgebound-Token: " + _token])

func _process(delta: float) -> void:
	if _input_request and _bridge_pid > 0:
		_poll_clock += delta
		if _poll_clock >= 0.038:
			_poll_clock = 0.0
			_input_request.request(BRIDGE_URL + "/api/input", _headers())
	if not settings_open():
		return
	if _capture_key != "" and Time.get_ticks_msec() >= _capture_until:
		_finish_capture()
	_refresh_dialog()

func _on_input(result: int, code: int, _response_headers: PackedStringArray, body: PackedByteArray) -> void:
	if result != HTTPRequest.RESULT_SUCCESS or code != 200:
		return
	var packet = JSON.parse_string(body.get_string_from_utf8())
	if not packet is Dictionary or packet.get("bridge", "") != "ridgebound-directinput":
		return
	if packet.get("version") != 1 or not packet.get("devices") is Array or not packet.get("ffb") is Dictionary:
		return
	_devices = packet.devices
	_bridge_status = packet.ffb
	_bridge_at = Time.get_ticks_msec()
	var emergency := str(_bridge_status.get("status", "")).begins_with("F8")
	var recently_rearmed: bool = Time.get_ticks_msec() - _rearm_at < 160
	if _force_device() == "" or (emergency and not _rearm_pending and not recently_rearmed):
		_force_enabled = false
		_rearm_pending = false
		_force_check.set_pressed_no_signal(false)
	if _capture_key != "":
		_observe_capture()

func update_feedback(state: Dictionary, controls_active: bool) -> void:
	if not _force_request:
		return
	if not _bridge_fresh():
		_force_enabled = false
		_rearm_pending = false
		_force_check.set_pressed_no_signal(false)
		return
	var wheel := _force_device()
	var engine_focused := get_window().has_focus()
	var armed := _force_enabled and wheel != "" and controls_active and engine_focused and not settings_open()
	if not armed and not _force_sent and not _rearm_pending:
		return
	var now := Time.get_ticks_msec() * 0.001
	# A stop is sent on the next frame once the preceding request completes.
	if armed and not _rearm_pending and now - _force_clock < 0.045:
		return
	var damage = state.get("damage", {})
	var packet := {
		"enabled": armed,
		"deviceId": wheel,
		"strength": _force_strength,
		"steer": clampf(float(state.get("steering", 0.0)), -1.0, 1.0),
		"speed": float(state.get("speed", 0.0)),
		"slip": clampf(float(state.get("slip", 0.0)), 0.0, 1.0),
		"impact": clampf(float(state.get("impact", 0.0)), 0.0, 1.0),
		"suspension": 1.0 - clampf(float(damage.get("suspension", 100.0)) / 100.0, 0.0, 1.0),
	}
	var headers := _headers()
	headers.append("Content-Type: application/json")
	if _rearm_pending:
		headers.append("X-Ridgebound-Rearm: 1")
	if _force_request.request(BRIDGE_URL + "/api/feedback", headers, HTTPClient.METHOD_POST, JSON.stringify(packet)) == OK:
		_force_sent = armed
		_rearm_sent = _rearm_pending
		_force_clock = now

func _on_force_reply(result: int, code: int, _response_headers: PackedStringArray, _body: PackedByteArray) -> void:
	if result == HTTPRequest.RESULT_SUCCESS and code == 200:
		if _rearm_sent:
			_rearm_pending = false
			_rearm_at = Time.get_ticks_msec()
	else:
		_force_enabled = false
		_rearm_pending = false
		_force_check.set_pressed_no_signal(false)
	_rearm_sent = false

func _force_device() -> String:
	var binding: Dictionary = _bindings.get("steer", {})
	if binding.is_empty():
		return ""
	var device := _device_for(str(binding.id))
	return str(device.get("id", "")) if bool(device.get("forceFeedback", false)) else ""

func _device_for(id: String) -> Dictionary:
	if _bridge_fresh():
		for device in _devices:
			if device is Dictionary and device.get("id") == id and device.get("connected", false):
				return device
	return {}

func _device_axis(device: Dictionary, index: int) -> Variant:
	var axes = device.get("axes", [])
	var available = device.get("axisAvailable", [])
	if not axes is Array or not available is Array or index < 0 or index >= axes.size() or index >= available.size() or not available[index]:
		return null
	var value = axes[index]
	if (value is float or value is int) and is_finite(float(value)):
		return clampf(float(value), -1.0, 1.0)
	return null

func _deadzone(value: float, dead: float) -> float:
	return signf(value) * maxf(absf(value) - dead, 0.0) / (1.0 - dead)

func _axis_value(key: String, fallback: float) -> float:
	var binding: Dictionary = _bindings.get(key, {})
	if binding.is_empty():
		return fallback
	var value = _device_axis(_device_for(str(binding.id)), int(binding.axis))
	if value == null:
		return 0.0
	var fraction := (float(value) - float(binding.rest)) / float(binding.travel)
	if key == "steer":
		return _deadzone(clampf(fraction, -1.0, 1.0), 0.055)
	return _deadzone(clampf(fraction, 0.0, 1.0), 0.03)

func _first_pad() -> int:
	for id in Input.get_connected_joypads():
		if Input.is_joy_known(id):
			return id
	return -1

func sample() -> Dictionary:
	var pad := _first_pad()
	var throttle := 0.0
	var brake := 0.0
	var steer := 0.0
	if pad >= 0:
		throttle = clampf(Input.get_joy_axis(pad, JOY_AXIS_TRIGGER_RIGHT), 0.0, 1.0)
		brake = clampf(Input.get_joy_axis(pad, JOY_AXIS_TRIGGER_LEFT), 0.0, 1.0)
		steer = _deadzone(Input.get_joy_axis(pad, JOY_AXIS_LEFT_X), 0.12)
	return {
		"steer": _axis_value("steer", steer),
		"throttle": _axis_value("throttle", throttle),
		"brakeValue": _axis_value("brake", brake),
		"clutch": _axis_value("clutch", 0.0),
		"reverse": 1.0 if pad >= 0 and Input.is_joy_button_pressed(pad, JOY_BUTTON_B) else 0.0,
		"reel": pad >= 0 and Input.is_joy_button_pressed(pad, JOY_BUTTON_RIGHT_SHOULDER)
	}

func _input(event: InputEvent) -> void:
	if settings_open() or not get_window().has_focus():
		return
	if event is InputEventJoypadButton and event.pressed and event.device == _first_pad():
		var action: String = PAD_ACTIONS.get(event.button_index, "")
		if action != "":
			action_pressed.emit(action)

func settings_open() -> bool:
	return is_instance_valid(_dialog) and _dialog.visible

func open_settings() -> void:
	_capture_key = ""
	_capture_instructions = "先让方向盘回中、踏板松开，再选择要绑定的操作。"
	_refresh_dialog()
	_layout_dialog(true)

func _layout_dialog(open_now: bool = false) -> void:
	if not is_instance_valid(_dialog) or (not open_now and not _dialog.visible):
		return
	var safe := ScreenFit.margins(get_viewport())
	var view := get_viewport().get_visible_rect().size
	var origin := Vector2(safe.x, safe.y) + Vector2(16, 16)
	var available := view - Vector2(safe.x + safe.z, safe.y + safe.w) - Vector2(32, 32)
	var size := Vector2(minf(660.0, available.x), minf(590.0, available.y))
	_dialog.popup(Rect2i(Rect2(origin + (available - size) * 0.5, size)))

func _connected_axes() -> Dictionary:
	var axes: Dictionary = {}
	if not _bridge_fresh():
		return axes
	for device in _devices:
		if not device is Dictionary or not device.get("connected", false):
			continue
		for index in range(8):
			var value = _device_axis(device, index)
			if value == null:
				continue
			var id := str(device.get("id", ""))
			if id != "":
				axes[id + ":" + str(index)] = {
					"id": id, "name": str(device.get("name", "DirectInput")),
					"axis": index, "value": float(value)
				}
	return axes

func _begin_capture(key: String) -> void:
	_capture_axes = _connected_axes()
	if _capture_axes.is_empty():
		_capture_instructions = "尚未检测到可绑定的 DirectInput 轴。"
		return
	_capture_key = key
	_capture_until = Time.get_ticks_msec() + 4200
	_capture_best = {}
	_capture_instructions = "请只向右转一次方向盘，随后回中。" if key == "steer" else "请将目标踏板踩到底一次，随后松开。"

func _observe_capture() -> void:
	for current in _connected_axes().values():
		var axis_key := str(current.id) + ":" + str(current.axis)
		var start: Dictionary = _capture_axes.get(axis_key, {})
		if start.is_empty():
			continue
		var travel := float(current.value) - float(start.value)
		if absf(travel) < 0.18 or absf(travel) <= absf(float(_capture_best.get("travel", 0.0))):
			continue
		_capture_best = {
			"id": current.id, "name": current.name, "axis": current.axis,
			"rest": start.value, "travel": travel
		}

func _finish_capture() -> void:
	if not _capture_best.is_empty() and not _device_for(str(_capture_best.id)).is_empty():
		_bindings[_capture_key] = _capture_best.duplicate()
		if _capture_key == "steer":
			_force_enabled = false
			_rearm_pending = false
			_force_check.set_pressed_no_signal(false)
		_save_settings()
		_capture_instructions = str(BINDING_LABELS[_capture_key]) + "已绑定。"
	else:
		_capture_instructions = "没测到完整的轴行程。请松开踏板或回中后重试。"
	_capture_key = ""

func _clear_binding(key: String) -> void:
	if _capture_key == key:
		_capture_key = ""
	_bindings.erase(key)
	if key == "steer":
		_force_enabled = false
		_rearm_pending = false
		_force_check.set_pressed_no_signal(false)
	_save_settings()

func _load_settings() -> void:
	var config := ConfigFile.new()
	if config.load(CONFIG_PATH) != OK:
		return
	var saved_force: Variant = config.get_value("pedals", "max_brake_force_n", 1400.0)
	if (saved_force is float or saved_force is int) and is_finite(float(saved_force)):
		brake_max_force_n = clampf(float(saved_force), 300.0, 2500.0)
	var strength = config.get_value("feedback", "strength", 0.35)
	if (strength is float or strength is int) and is_finite(float(strength)):
		_force_strength = clampf(float(strength), 0.0, 0.60)
	for key in BINDING_LABELS:
		var binding = config.get_value("axes", key, {})
		if not binding is Dictionary:
			continue
		var id = binding.get("id")
		var axis = binding.get("axis")
		var rest = binding.get("rest")
		var travel = binding.get("travel")
		if not id is String or not id.begins_with("di:") or id.length() > 100 or not axis is int or axis < 0 or axis > 7:
			continue
		if not (rest is float or rest is int) or not (travel is float or travel is int):
			continue
		if not is_finite(float(rest)) or not is_finite(float(travel)) or absf(float(rest)) > 1.0 or absf(float(travel)) < 0.18 or absf(float(rest) + float(travel)) > 1.001:
			continue
		_bindings[key] = binding

func _save_settings() -> void:
	var config := ConfigFile.new()
	config.set_value("feedback", "strength", _force_strength)
	config.set_value("pedals", "max_brake_force_n", brake_max_force_n)
	for key in _bindings:
		config.set_value("axes", key, _bindings[key])
	config.save(CONFIG_PATH)

func _build_dialog() -> void:
	_dialog = AcceptDialog.new()
	if interface_theme != null:
		_dialog.theme = interface_theme
	_dialog.title = "方向盘与踏板"
	_dialog.ok_button_text = "返回"
	_dialog.min_size = Vector2i(360, 260)
	_dialog.exclusive = true
	add_child(_dialog)
	var scroll := ScrollContainer.new()
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.follow_focus = true
	_dialog.add_child(scroll)
	var content := VBoxContainer.new()
	content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	content.add_theme_constant_override("separation", 8)
	scroll.add_child(content)

	var gamepad_help := Label.new()
	gamepad_help.text = "手柄：左摇杆转向，RT 油门，LT 刹车，B 倒车\nY 视角，X 低速挡，A 四驱，LB 挂绳，RB 收绳，右方向键松绳"
	gamepad_help.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	content.add_child(gamepad_help)
	_device_label = Label.new()
	content.add_child(_device_label)
	content.add_child(HSeparator.new())

	for key in BINDING_LABELS:
		var row := HBoxContainer.new()
		content.add_child(row)
		var label := Label.new()
		label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
		label.custom_minimum_size.x = 160.0 if OS.has_feature("android") else 260.0
		_binding_labels[key] = label
		row.add_child(label)
		var bind_button := Button.new()
		bind_button.text = "校准绑定"
		bind_button.pressed.connect(_begin_capture.bind(key))
		_bind_buttons[key] = bind_button
		row.add_child(bind_button)
		var clear_button := Button.new()
		clear_button.text = "清除"
		clear_button.pressed.connect(_clear_binding.bind(key))
		row.add_child(clear_button)
	var calibration := HBoxContainer.new()
	content.add_child(calibration)
	var calibration_label := Label.new()
	calibration_label.text = "满行程制动力"
	calibration_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	calibration.add_child(calibration_label)
	var max_force := SpinBox.new()
	max_force.min_value = 300.0
	max_force.max_value = 2500.0
	max_force.step = 50.0
	max_force.suffix = "N"
	max_force.value = brake_max_force_n
	max_force.tooltip_text = "设定踏板踩到底在游戏中对应的力"
	max_force.value_changed.connect(_set_brake_force)
	calibration.add_child(max_force)

	_capture_label = Label.new()
	content.add_child(_capture_label)
	content.add_child(HSeparator.new())

	_force_check = CheckButton.new()
	_force_check.text = "启用已绑定方向盘的力反馈"
	_force_check.toggled.connect(func(enabled: bool):
		_force_enabled = enabled
		_rearm_pending = enabled
	)
	content.add_child(_force_check)
	var force_row := HBoxContainer.new()
	content.add_child(force_row)
	var strength_label := Label.new()
	strength_label.text = "强度 %d%%" % roundi(_force_strength * 100.0)
	force_row.add_child(strength_label)
	var strength := HSlider.new()
	strength.max_value = 0.6
	strength.step = 0.01
	strength.value = _force_strength
	strength.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	strength.value_changed.connect(func(value: float):
		_force_strength = value
		strength_label.text = "强度 %d%%" % roundi(value * 100.0)
		_save_settings()
	)
	force_row.add_child(strength)
	_status_label = Label.new()
	content.add_child(_status_label)
	var emergency := Label.new()
	emergency.text = "F8 立即停用力反馈。重新启用前，先在这里关闭再打开。"
	emergency.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	content.add_child(emergency)
	_retry_button = Button.new()
	_retry_button.text = "启动方向盘辅助程序"
	_retry_button.pressed.connect(_start_bridge)
	content.add_child(_retry_button)

func _set_brake_force(value: float) -> void:
	brake_max_force_n = clampf(value, 300.0, 2500.0)
	_save_settings()
	brake_force_changed.emit(brake_max_force_n)

func _refresh_dialog() -> void:
	var names := PackedStringArray()
	if _bridge_fresh():
		for device in _devices:
			if device is Dictionary and device.get("connected", false):
				names.append(str(device.get("name", "DirectInput")))
	_device_label.text = "DirectInput：" + ("、".join(names) if not names.is_empty() else "没有连接设备")
	_device_label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	var can_bind := not names.is_empty() and _capture_key == ""
	for key in BINDING_LABELS:
		var binding: Dictionary = _bindings.get(key, {})
		var label: Label = _binding_labels[key]
		var button: Button = _bind_buttons[key]
		button.disabled = not can_bind
		var detail := "默认/未绑定"
		if not binding.is_empty():
			var device := _device_for(str(binding.id))
			detail = "%s · 轴 %d · %s" % [str(binding.get("name", "DirectInput")), int(binding.axis) + 1,
				"离线" if device.is_empty() else "%d%%" % roundi(_axis_value(key, 0.0) * 100.0)]
		label.text = str(BINDING_LABELS[key]) + "：" + detail
	_capture_label.text = _capture_instructions
	if _capture_key != "":
		var seconds := ceili(maxf(0.0, float(_capture_until - Time.get_ticks_msec()) / 1000.0))
		_capture_label.text += "（%d 秒）" % seconds
	_force_check.disabled = _force_device() == ""
	_retry_button.visible = OS.get_name() == "Windows" and not _bridge_fresh()
	if not _bridge_fresh():
		_status_label.text = "方向盘辅助程序未连接。"
	elif _force_device() == "":
		_status_label.text = "先绑定支持 DirectInput 力反馈的转向轴。"
	elif str(_bridge_status.get("status", "")).begins_with("F8"):
		_status_label.text = "已按 F8 停止。"
	else:
		_status_label.text = "力反馈已运行" if _bridge_status.get("armed", false) else "关闭此窗口并驾驶时才输出反馈。"
