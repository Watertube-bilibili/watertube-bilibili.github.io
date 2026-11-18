extends CanvasLayer
## Independent fingers operate the wheel and pedals. Device orientation only changes the layout.

signal action_pressed(action: String)

const ScreenFit = preload("res://screen_fit.gd")
const UI_FONT_PATH := "res://assets/ridgebound-ui.ttf"

const ACCENT := Color("#d0e78d")
const INK := Color("#17211e")
const PAPER := Color("#f1e9d5")
const RIM := Color("#3c5247")
const MUTED := Color("#bfccbb")
const PANEL := Color(0.08, 0.12, 0.10, 0.84)
const RIM_ROTATION := 2.00712864
const PEDALS := ["reverse", "brake", "throttle"]
const PEDAL_LABELS := ["倒车", "刹车", "油门"]

class DriveSurface extends Control:
	var controller

	func _draw() -> void:
		controller.draw_controls(self)

var _surface: DriveSurface
var _safe_margins := Vector4.ZERO
var _screen_poll := 0.0
var _label_font: Font
var _driving_active := false
var _wheel_center := Vector2.ZERO
var _wheel_radius := 0.0
var _pedal_rects: Array[Rect2] = []
var _held_pedals: Dictionary = {}
var _claimed_mouse := false
var _wheel_finger := -1
var _wheel_start := Vector2.ZERO
var _wheel_angle := 0.0
var _wheel_angle_valid := false
var _wheel_from_center := false
var _steer := 0.0
var _shown_steer := 0.0
var _pedal_idle: StyleBoxFlat
var _pedal_held: StyleBoxFlat
var _throttle_idle: StyleBoxFlat

func _ready() -> void:
	layer = 9
	_label_font = load(UI_FONT_PATH) as Font if ResourceLoader.exists(UI_FONT_PATH) else ThemeDB.fallback_font
	_surface = DriveSurface.new()
	_surface.controller = self
	_surface.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_surface)
	_surface.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_pedal_idle = _make_pedal_style(PANEL, Color(0.75, 0.83, 0.73, 0.39))
	_pedal_held = _make_pedal_style(ACCENT, ACCENT)
	_throttle_idle = _make_pedal_style(Color("#314536"), ACCENT.darkened(0.32))
	_surface.size = get_viewport().get_visible_rect().size
	get_viewport().size_changed.connect(_layout_controls)
	_layout_controls()
	_surface.visible = _driving_active

func _make_pedal_style(fill: Color, border: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = fill
	style.border_color = border
	style.set_border_width_all(1)
	style.set_corner_radius_all(15)
	style.shadow_color = Color(0.03, 0.06, 0.04, 0.44)
	style.shadow_size = 5
	style.shadow_offset = Vector2(0, 2)
	return style

func set_driving_active(active: bool) -> void:
	if _driving_active == active:
		return
	_driving_active = active
	if not active:
		reset_input()
	if is_instance_valid(_surface):
		_surface.visible = active

func reset_input() -> void:
	_held_pedals.clear()
	_wheel_finger = -1
	_claimed_mouse = false
	_wheel_angle_valid = false
	_steer = 0.0
	_shown_steer = 0.0
	if is_instance_valid(_surface):
		_surface.queue_redraw()

func sample() -> Dictionary:
	if not _driving_active:
		return {"steer": 0.0, "throttle": 0.0, "reverse": 0.0, "brakeValue": 0.0, "reel": false, "payout": false}
	return {
		"steer": _steer,
		"throttle": float(_pedal_is_held("throttle")),
		"reverse": float(_pedal_is_held("reverse")),
		"brakeValue": float(_pedal_is_held("brake")),
		"reel": false,
		"payout": false,
	}

func _pedal_is_held(action: String) -> bool:
	return action in _held_pedals.values()

func _layout_controls() -> void:
	# A finger held during rotation used the old coordinate space.
	reset_input()
	var extent := get_viewport().get_visible_rect().size
	_safe_margins = ScreenFit.margins(get_viewport())
	var left_edge := 18.0 + _safe_margins.x
	var right_edge := extent.x - 18.0 - _safe_margins.z
	var bottom_edge := extent.y - 18.0 - _safe_margins.w
	var portrait := extent.y >= extent.x
	var span := maxf(1.0, right_edge - left_edge)
	_wheel_radius = minf(clampf(extent.x * 0.145, 55.0, 82.0) if portrait else 70.0, span * 0.235)
	_wheel_center = Vector2(left_edge + _wheel_radius, bottom_edge - _wheel_radius)
	var gap := 9.0
	var width := clampf(span * 0.146, 66.0, 94.0)
	width = minf(width, (span - _wheel_radius * 2.0 - 34.0) / 3.30)
	width = maxf(24.0, width)
	var total := width * 3.3 + gap * 2.0
	_pedal_rects.clear()
	var start := right_edge - total
	for i in range(PEDALS.size()):
		var is_gas := i == 2
		var pedal_width := width * 1.30 if is_gas else width
		var height := 120.0 if is_gas else 98.0
		if not portrait:
			height -= 7.0
		_pedal_rects.append(Rect2(Vector2(start, bottom_edge - height), Vector2(pedal_width, height)))
		start += pedal_width + gap
	_surface.queue_redraw()

func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT or what == NOTIFICATION_APPLICATION_PAUSED:
		reset_input()

func _input(event: InputEvent) -> void:
	if not _driving_active:
		return
	var handled := false
	if event is InputEventScreenTouch:
		if event.pressed and not event.canceled:
			handled = _begin_touch(event.index, event.position)
		else:
			handled = _end_touch(event.index)
	elif event is InputEventScreenDrag:
		handled = _move_touch(event.index, event.position)
	elif event is InputEventMouse and event.device == InputEvent.DEVICE_ID_EMULATION:
		# Consume the emulated mouse sequence only if it started on a pedal or wheel.
		# Other fingers must not swallow an unrelated menu's release.
		if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
			if event.pressed:
				_claimed_mouse = _is_drive_position(event.position)
			handled = _claimed_mouse
			if not event.pressed:
				_claimed_mouse = false
		else:
			handled = _claimed_mouse
	if handled:
		get_viewport().set_input_as_handled()

func _is_drive_position(point: Vector2) -> bool:
	if point.distance_squared_to(_wheel_center) <= _wheel_radius * _wheel_radius:
		return true
	for rect in _pedal_rects:
		if rect.has_point(point):
			return true
	return false

func _begin_touch(index: int, point: Vector2) -> bool:
	if index == _wheel_finger or _held_pedals.has(index):
		return true
	var relative := point - _wheel_center
	if relative.length_squared() <= _wheel_radius * _wheel_radius:
		if _wheel_finger == -1:
			_wheel_finger = index
			_wheel_start = relative
			_wheel_angle = relative.angle()
			_wheel_angle_valid = relative.length() >= _wheel_radius * 0.32
			_wheel_from_center = not _wheel_angle_valid
			_steer = 0.0
			_surface.queue_redraw()
		return true
	for i in range(_pedal_rects.size()):
		if _pedal_rects[i].has_point(point):
			_held_pedals[index] = PEDALS[i]
			_surface.queue_redraw()
			return true
	return false

func _move_touch(index: int, point: Vector2) -> bool:
	if index != _wheel_finger:
		return _held_pedals.has(index)
	var relative := point - _wheel_center
	if _wheel_from_center:
		_steer = clampf((relative.x - _wheel_start.x) / (_wheel_radius * 0.9), -1.0, 1.0)
	elif relative.length() < _wheel_radius * 0.28:
		_wheel_angle_valid = false
	else:
		var next_angle := relative.angle()
		if _wheel_angle_valid:
			# Screen coordinates have +Y down, so positive angle is clockwise.
			_steer = clampf(_steer + angle_difference(_wheel_angle, next_angle) / RIM_ROTATION, -1.0, 1.0)
		_wheel_angle = next_angle
		_wheel_angle_valid = true
	return true

func _end_touch(index: int) -> bool:
	if index == _wheel_finger:
		_wheel_finger = -1
		_steer = 0.0
	elif not _held_pedals.erase(index):
		return false
	_surface.queue_redraw()
	return true

func _process(delta: float) -> void:
	_screen_poll += delta
	if _screen_poll >= 0.25:
		_screen_poll = 0.0
		if not ScreenFit.margins(get_viewport()).is_equal_approx(_safe_margins):
			_layout_controls()
	if not _driving_active:
		return
	var next := _steer if _wheel_finger >= 0 else move_toward(_shown_steer, 0.0, delta * 7.0)
	if next != _shown_steer:
		_shown_steer = next
		_surface.queue_redraw()

func draw_controls(canvas: Control) -> void:
	var center := _wheel_center
	var radius := _wheel_radius
	var rotation := _shown_steer * RIM_ROTATION
	canvas.draw_circle(center, radius, PANEL, true, -1.0, true)
	canvas.draw_arc(center, radius - 2.0, 0.0, TAU, 64, Color(0.79, 0.88, 0.75, 0.58), 1.0, true)
	canvas.draw_arc(center, radius - 11.0, 0.0, TAU, 64, RIM, 15.0, true)
	for spoke in [0.0, PI, PI / 2.0]:
		var edge := center + Vector2.from_angle(float(spoke) + rotation) * (radius - 16.0)
		canvas.draw_line(center, edge, RIM.lightened(0.16), 10.0, true)
	canvas.draw_circle(center, radius * 0.27, INK.lightened(0.16), true, -1.0, true)
	canvas.draw_circle(center, radius * 0.27, MUTED.darkened(0.35), false, 1.0, true)
	var mark := -PI * 0.5 + rotation
	canvas.draw_arc(center, radius - 4.0, mark - 0.07, mark + 0.07, 8, ACCENT, 4.0, true)
	var font := _label_font if _label_font != null else ThemeDB.fallback_font
	for i in range(_pedal_rects.size()):
		var rect := _pedal_rects[i]
		var held := _pedal_is_held(PEDALS[i])
		var style := _pedal_held if held else (_throttle_idle if i == 2 else _pedal_idle)
		canvas.draw_style_box(style, rect)
		var color := INK if held else PAPER
		var text_size := 18
		var baseline := rect.position.y + rect.size.y * 0.68
		canvas.draw_string(font, Vector2(rect.position.x, baseline), PEDAL_LABELS[i], HORIZONTAL_ALIGNMENT_CENTER, rect.size.x, text_size, color)
		var symbol := "↑" if i == 2 else ("↓" if i == 0 else "Ⅱ")
		canvas.draw_string(font, Vector2(rect.position.x, rect.position.y + rect.size.y * 0.37), symbol, HORIZONTAL_ALIGNMENT_CENTER, rect.size.x, 22, color)
