extends CanvasLayer
## Native driving instruments and sheets. The driving scene and save flow live in desktop_main.

signal action_requested(action: String, value: Variant)

const RouteView = preload("res://desktop_map.gd")
const ScreenFit = preload("res://screen_fit.gd")
const COLOR_INK := Color("17201f")
const COLOR_FACE := Color("252f2c")
const COLOR_LINE := Color("59635b")
const COLOR_PAPER := Color("fbf2e2")
const COLOR_SECONDARY := Color("cbd4c9")
const COLOR_SIGNAL := Color("ecc184")
const COLOR_DANGER := Color("ffab93")
const VIEW_NAMES := ["跟随", "高位", "座舱"]
const SURFACES := {
	"trail": "山间土路", "mud": "泥地", "water": "浅水", "grass": "草地",
	"rock": "岩石", "snow": "积雪", "ice": "冰面"
}

var skin: Theme
var root_control: Control
var area_card: PanelContainer
var meter_card: PanelContainer
var tool_card: PanelContainer
var mini_card: PanelContainer
var winch_card: PanelContainer
var message_card: PanelContainer
var backdrop: ColorRect
var sheet: PanelContainer
var title: Label
var tabs: HBoxContainer
var sheet_body: VBoxContainer
var map_preview: Control
var mini_map: Control
var area: Label
var route: Label
var health: Label
var pedal_warning: Label
var speed: Label
var road: Label
var gearbox: Label
var mini_switch: Button
var tool_camera: Button
var tool_winch: Button
var tool_repair: Button
var message: Label
var anchor_select: OptionButton
var endpoint_select: OptionButton
var connect_button: Button
var release_button: Button
var reel_button: Button
var payout_button: Button
var cable_status: Label
var tension: ProgressBar
var screen_model: OptionButton
var screen_side: OptionButton
var screen_extra: SpinBox
var current_screen := "start"
var anchors: Array = []
var open_winch := false
var mobile := false
var margins := Vector4.ZERO
var viewport_size := Vector2.ZERO

func _ready() -> void:
	layer = 2
	mobile = OS.has_feature("android")
	skin = _make_theme()
	root_control = Control.new()
	root_control.theme = skin
	root_control.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root_control)
	root_control.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_make_instruments()
	_make_sheet()
	reflow()

func captures_point(point: Vector2) -> bool:
	for control in [area_card, meter_card, tool_card, mini_card, winch_card, message_card, sheet]:
		if control.is_visible_in_tree() and control.get_global_rect().has_point(point):
			return true
	return false

func reflow() -> void:
	viewport_size = get_viewport().get_visible_rect().size
	margins = ScreenFit.margins(get_viewport())
	var left := margins.x + 16.0
	var top := margins.y + 16.0
	var right := viewport_size.x - margins.z - 16.0
	var bottom := viewport_size.y - margins.w - 16.0
	var width := maxf(200.0, right - left)
	var height := maxf(180.0, bottom - top)
	var compact := mobile and viewport_size.x <= viewport_size.y
	var short_landscape := mobile and height < 530.0
	var tool_width := minf(350.0 if mobile else 330.0, width * 0.52)
	var mini_width := clampf(width * 0.22, 132.0, 208.0)
	var meter_width := minf(312.0, width * 0.47)
	_set_box(area_card, Rect2(Vector2(left, top), Vector2(minf(290.0, width * 0.47), 72)))
	_set_box(mini_card, Rect2(Vector2(right - mini_width, top), Vector2(mini_width, mini_width + 32)))
	var drive_bottom := bottom - (190.0 if mobile else 0.0)
	var meter_y := top + 78.0 if short_landscape else drive_bottom - 118.0
	var tools_y := top if short_landscape else drive_bottom - (100.0 if mobile else 52.0)
	_set_box(meter_card, Rect2(Vector2(left, meter_y), Vector2(meter_width, 111)))
	_set_box(tool_card, Rect2(Vector2(right - tool_width, tools_y), Vector2(tool_width, 92 if mobile else 47)))
	var winch_width := minf(340.0, width)
	var winch_x := left + (width - winch_width) * 0.5 if short_landscape else right - winch_width
	var winch_y := top + 51.0 if short_landscape else maxf(top + 82.0, tools_y - 252.0)
	_set_box(winch_card, Rect2(Vector2(winch_x, winch_y), Vector2(winch_width, 246)))
	_set_box(message_card, Rect2(Vector2(left + width * 0.23, top + 79), Vector2(width * 0.54, 34)))
	var sheet_width := minf(width, 740.0 if current_screen == "maps" and not compact else 470.0)
	var sheet_height := minf(height, 594.0 if compact else 520.0)
	var sheet_origin := Vector2(left, top + (height - sheet_height) * 0.5)
	if compact:
		sheet_origin = Vector2(left + (width - sheet_width) * 0.5, bottom - sheet_height)
	_set_box(sheet, Rect2(sheet_origin, Vector2(sheet_width, sheet_height)))
	_show_driving_chrome(short_landscape)

func _show_driving_chrome(short_landscape: bool) -> void:
	var driving := current_screen.is_empty()
	area_card.visible = driving and not (short_landscape and open_winch)
	meter_card.visible = driving and not (short_landscape and open_winch)
	tool_card.visible = driving and not (short_landscape and open_winch)
	mini_card.visible = driving and not short_landscape and not open_winch
	winch_card.visible = driving and open_winch

func show_winch(visible: bool) -> void:
	open_winch = visible
	reflow()

func notify(text: String) -> void:
	message.text = text
	message_card.visible = not text.is_empty()

func update_status(snapshot: Dictionary, detail: Dictionary) -> void:
	area.text = String(detail.get("regionName", "松风谷"))
	route.text = String(detail.get("routeText", "自由探索"))
	speed.text = "%02d" % roundi(absf(float(snapshot.speed) * 3.6))
	road.text = "%s  %.0f°" % [SURFACES.get(snapshot.surface, "越野"), snapshot.tilt]
	gearbox.text = "%s · %s" % ["四驱" if snapshot.awd else "两驱", "低速挡" if snapshot.lowGear else "高挡"]
	health.text = "车身 %d%%   轮胎 %d%%   悬挂 %d%%" % [snapshot.damage.body, snapshot.damage.tires, snapshot.damage.suspension]
	var broken := bool(snapshot.get("brakePedalBroken", false))
	pedal_warning.visible = broken
	pedal_warning.text = "制动踏板已断 · 前往维修小屋" if broken else ""
	if not broken and float(snapshot.get("pedalForceN", 0.0)) >= 1.0:
		gearbox.text += "   %d N" % roundi(float(snapshot.pedalForceN))
	if snapshot.get("blocked", false):
		route.text = "正在加载前方路面"
	tool_camera.text = VIEW_NAMES[clampi(int(snapshot.cameraMode), 0, VIEW_NAMES.size() - 1)]
	tool_repair.disabled = not bool(snapshot.get("repairAvailable", false))
	var overview := bool(detail.get("overview", false))
	mini_switch.text = "跟车" if overview else "全图"
	if mini_card.visible:
		mini_map.call("set_view", snapshot, overview)
	if is_instance_valid(map_preview) and map_preview.is_visible_in_tree():
		map_preview.call("set_view", snapshot, true)
	_refresh_winch(snapshot)

func show_screen(mode: String, context: Dictionary) -> void:
	current_screen = mode
	backdrop.visible = not mode.is_empty()
	if mode.is_empty():
		reflow()
		return
	for child in sheet_body.get_children():
		sheet_body.remove_child(child)
		child.queue_free()
	map_preview = null
	tabs.visible = mode != "start"
	var first: Button
	var started := bool(context.get("started", false))
	var save: Dictionary = context.get("save", {})
	var installed: Dictionary = context.get("importedMap", {})
	match mode:
		"start":
			title.text = "山野之间"
			first = _button(sheet_body, "启程", "begin", null, true)
			_button(sheet_body, "地图", "screen", "maps")
			_button(sheet_body, "车库", "screen", "garage")
			_button(sheet_body, "设置", "screen", "settings")
			_hint(sheet_body, "拖动空白处转视角。左手转方向盘，右手踩踏板。" if mobile else "拖动空白处转视角。方向键驾驶，空格刹车。")
		"pause":
			title.text = "暂停"
			first = _button(sheet_body, "继续驾驶", "begin", null, true)
			_button(sheet_body, "地图", "screen", "maps")
			_button(sheet_body, "车库", "screen", "garage")
			_button(sheet_body, "设置", "screen", "settings")
			if not mobile:
				_hint(sheet_body, "C 视角 · E 挂钩 · F 收绳 · V 放绳 · Q 释放")
		"maps":
			title.text = "地图"
			var columns := HBoxContainer.new()
			var list := VBoxContainer.new()
			var wide := not mobile or viewport_size.x > viewport_size.y
			if wide:
				columns.add_theme_constant_override("separation", 14)
				sheet_body.add_child(columns)
				list.custom_minimum_size.x = 236
				columns.add_child(list)
				map_preview = _map(columns, 260)
				map_preview.custom_minimum_size.x = 240
			else:
				sheet_body.add_child(list)
				map_preview = _map(list, 145)
			list.add_theme_constant_override("separation", 8)
			first = _button(list, "松风谷", "region", "forest", true)
			var snow := _button(list, "珠峰雪线", "region", "snow")
			snow.disabled = not bool(save.get("snow_unlocked", false))
			if snow.disabled:
				_hint(list, "完成松风谷后解锁珠峰雪线")
			if not installed.is_empty():
				_button(list, String(installed.get("name", "自定义地图")), "region", "custom")
			_rule(list)
			var pending := bool(context.get("pending", false))
			var zip := _button(list, "导入地图 ZIP", "import")
			zip.disabled = pending
			first.disabled = pending
			snow.disabled = pending or snow.disabled
			var outcome: Dictionary = context.get("importResult", {})
			if pending:
				_hint(list, "正在读取地图…")
			elif outcome.has("error"):
				_hint(list, String(outcome.error), COLOR_DANGER)
			elif not mobile:
				_hint(list, "也可把 ZIP 拖进窗口")
		"garage":
			title.text = "车库"
			var vehicle := String(context.get("vehicle", "rover"))
			for entry in [["rover", "远陆 4×4"], ["yuchuan", "御川 V8"]]:
				var label := String(entry[1]) + (" · 在用" if entry[0] == vehicle else "")
				var pick := _button(sheet_body, label, "vehicle", entry[0], entry[0] == vehicle)
				pick.disabled = entry[0] == vehicle
			var coins := int(save.get("coins", 0))
			var owned := bool(save.get("snow_tires", false))
			_rule(sheet_body)
			_hint(sheet_body, "%d 金币" % coins)
			var tire := _button(sheet_body, "雪地胎已装" if owned else "装雪地胎 · 180 金币", "tires")
			tire.disabled = owned or coins < 180
			_button(sheet_body, "重走当前路线", "restart")
		"settings":
			title.text = "设置"
			first = _button(sheet_body, "控制器与踏板", "controls", null, true)
			_button(sheet_body, "屏幕与机型", "screen", "display")
			_button(sheet_body, "画质 · %s" % ("高" if save.get("quality", true) else "流畅"), "quality")
			if started and not mobile:
				_hint(sheet_body, "F2 切换画质")
			_button(sheet_body, "退出游戏", "quit")
		"display":
			title.text = "屏幕与机型"
			_make_display_preferences()
			_button(sheet_body, "返回设置", "screen", "settings")
	if first and not first.disabled and not mobile:
		first.grab_focus()
	reflow()

func _make_display_preferences() -> void:
	var settings := ScreenFit.preferences()
	_hint(sheet_body, "机型")
	screen_model = OptionButton.new()
	screen_model.custom_minimum_size.y = 54
	sheet_body.add_child(screen_model)
	for choice in ScreenFit.options():
		var index := screen_model.item_count
		screen_model.add_item(String(choice.label))
		screen_model.set_item_metadata(index, String(choice.id))
		if choice.id == settings.model:
			screen_model.select(index)
	screen_model.get_popup().max_size = Vector2i(0, 390)
	screen_model.item_selected.connect(_screen_pref_changed)
	_hint(sheet_body, "横屏开孔朝向")
	screen_side = OptionButton.new()
	screen_side.custom_minimum_size.y = 54
	sheet_body.add_child(screen_side)
	for option in [["auto", "自动"], ["left", "左"], ["right", "右"]]:
		var index := screen_side.item_count
		screen_side.add_item(option[1])
		screen_side.set_item_metadata(index, option[0])
		if option[0] == settings.side:
			screen_side.select(index)
	screen_side.item_selected.connect(_screen_pref_changed)
	_hint(sheet_body, "额外边距")
	screen_extra = SpinBox.new()
	screen_extra.min_value = 0.0
	screen_extra.max_value = 32.0
	screen_extra.step = 1.0
	screen_extra.value = float(settings.extra)
	screen_extra.custom_minimum_size.y = 52
	sheet_body.add_child(screen_extra)
	screen_extra.value_changed.connect(_screen_pref_changed)

func _screen_pref_changed(_index_or_value: float) -> void:
	var model := String(screen_model.get_item_metadata(screen_model.selected))
	var side := String(screen_side.get_item_metadata(screen_side.selected))
	ScreenFit.save_preferences(model, side, screen_extra.value)
	action_requested.emit("screen_fit", null)

func _make_instruments() -> void:
	var focus := _card(root_control)
	area_card = focus.get_parent() as PanelContainer
	area = _label(focus, "", 21)
	route = _label(focus, "", 15)
	route.modulate = COLOR_SECONDARY

	var meters := _card(root_control)
	meter_card = meters.get_parent() as PanelContainer
	var main := HBoxContainer.new()
	main.add_theme_constant_override("separation", 8)
	meters.add_child(main)
	speed = _label(main, "00", 39)
	speed.modulate = COLOR_SIGNAL
	_label(main, "km/h", 14)
	road = _label(main, "", 15)
	gearbox = _label(meters, "", 15)
	health = _label(meters, "", 14)
	health.modulate = COLOR_SECONDARY
	pedal_warning = _label(meters, "", 14)
	pedal_warning.modulate = COLOR_DANGER
	pedal_warning.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	pedal_warning.hide()

	var tools := _card(root_control)
	tool_card = tools.get_parent() as PanelContainer
	var row := _row(tools)
	tool_camera = _button(row, "视角", "camera", null, false, false)
	tool_winch = _button(row, "绞盘", "winch_panel", null, false, false)
	_button(row, "菜单", "menu", null, false, false)
	var recovery := _row(tools) if mobile else row
	_button(recovery, "脱困", "recover", null, false, false)
	tool_repair = _button(recovery, "维修", "repair", null, false, false)
	if mobile:
		_button(recovery, "挡位", "gear", null, false, false)
		_button(recovery, "驱动", "awd", null, false, false)

	var plot := _card(root_control)
	mini_card = plot.get_parent() as PanelContainer
	mini_map = _map(plot, 90)
	mini_switch = _button(plot, "全图", "map", null, false, false)

	var toaster := _card(root_control)
	message_card = toaster.get_parent() as PanelContainer
	message = _label(toaster, "", 15)
	message.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	message.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	message_card.hide()

	var rig := _card(root_control)
	winch_card = rig.get_parent() as PanelContainer
	var head := _row(rig)
	var heading := _label(head, "绞盘", 20)
	heading.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_button(head, "收起", "winch_panel", null, false, false).size_flags_horizontal = Control.SIZE_SHRINK_END
	var select := _row(rig)
	endpoint_select = OptionButton.new()
	endpoint_select.add_item("前钩")
	endpoint_select.add_item("后钩")
	endpoint_select.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	endpoint_select.item_selected.connect(_choose_endpoint)
	select.add_child(endpoint_select)
	anchor_select = OptionButton.new()
	anchor_select.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	select.add_child(anchor_select)
	var coupling := _row(rig)
	connect_button = _button(coupling, "挂接", "attach", null, false, false)
	release_button = _button(coupling, "释放", "detach", null, false, false)
	cable_status = _label(rig, "", 14)
	tension = ProgressBar.new()
	tension.max_value = 1.0
	tension.custom_minimum_size.y = 6.0
	tension.show_percentage = false
	rig.add_child(tension)
	var spools := _row(rig)
	reel_button = _hold_button(spools, "按住收绳", "reel")
	payout_button = _hold_button(spools, "按住放绳", "payout")

func _choose_endpoint(index: int) -> void:
	action_requested.emit("endpoint", "rear" if index == 1 else "front")

func anchor_id() -> String:
	return String(anchor_select.get_item_metadata(anchor_select.selected)) if anchor_select.selected >= 0 else ""

func _refresh_winch(snapshot: Dictionary) -> void:
	var cable: Variant = snapshot.get("winch")
	var attached := cable is Dictionary
	tool_winch.text = "绞盘·挂接" if attached else "绞盘"
	if not winch_card.visible:
		return
	var previous := anchor_id()
	var next: Array = snapshot.get("anchors", [])
	var changed := anchors.size() != next.size()
	if not changed:
		for i in range(anchors.size()):
			if anchors[i].id != next[i].id:
				changed = true
				break
	anchors = next
	if changed:
		anchor_select.clear()
		for i in range(anchors.size()):
			anchor_select.add_item("")
			anchor_select.set_item_metadata(i, String(anchors[i].id))
			if String(anchors[i].id) == previous:
				anchor_select.select(i)
		if anchor_select.selected == -1 and not anchors.is_empty():
			anchor_select.select(0)
	if anchors.is_empty():
		anchor_select.text = "附近无锚点"
	else:
		var forward := Vector2(sin(float(snapshot.yaw)), cos(float(snapshot.yaw)))
		for i in range(anchors.size()):
			var anchor: Dictionary = anchors[i]
			var offset := Vector2(anchor.x - snapshot.x, anchor.z - snapshot.z)
			var direction := "前方" if forward.dot(offset) >= 0.0 else "后方"
			anchor_select.set_item_text(i, "%s · %.0f m" % [direction, float(anchor.d)])
	endpoint_select.disabled = attached
	anchor_select.disabled = attached or anchors.is_empty()
	connect_button.disabled = attached or anchors.is_empty()
	release_button.disabled = not attached
	reel_button.disabled = not attached
	payout_button.disabled = not attached
	if attached:
		var pull := clampf(float(cable.get("tension", 0.0)), 0.0, 1.0)
		cable_status.text = "%.1f m   张力 %.0f%%" % [float(cable.length), pull * 100.0]
		tension.value = pull
	else:
		cable_status.text = "选择前钩或后钩"
		tension.value = 0.0

func _make_sheet() -> void:
	backdrop = ColorRect.new()
	backdrop.color = Color(0.04, 0.06, 0.055, 0.57)
	backdrop.mouse_filter = Control.MOUSE_FILTER_STOP
	root_control.add_child(backdrop)
	backdrop.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var shell := _card(backdrop, true)
	sheet = shell.get_parent() as PanelContainer
	var head := _row(shell)
	title = _label(head, "山野之间", 32)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_button(head, "返回", "back").size_flags_horizontal = Control.SIZE_SHRINK_END
	tabs = _row(shell)
	for tab in [["地图", "maps"], ["车库", "garage"], ["设置", "settings"]]:
		_button(tabs, tab[0], "screen", tab[1])
	_rule(shell)
	var scroll := ScrollContainer.new()
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.follow_focus = true
	shell.add_child(scroll)
	sheet_body = VBoxContainer.new()
	sheet_body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	sheet_body.add_theme_constant_override("separation", 8)
	scroll.add_child(sheet_body)

func _set_box(control: Control, box: Rect2) -> void:
	control.position = box.position
	control.size = box.size

func _card(parent: Control, substantial: bool = false) -> VBoxContainer:
	var frame := PanelContainer.new()
	frame.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var color := COLOR_INK if substantial else Color(COLOR_INK, 0.94)
	frame.add_theme_stylebox_override("panel", _box(color, COLOR_LINE, 16 if substantial else 9))
	parent.add_child(frame)
	var stack := VBoxContainer.new()
	stack.mouse_filter = Control.MOUSE_FILTER_IGNORE
	stack.add_theme_constant_override("separation", 5)
	frame.add_child(stack)
	return stack

func _map(parent: Container, height: int) -> Control:
	var view := RouteView.new()
	view.custom_minimum_size.y = height
	view.size_flags_vertical = Control.SIZE_EXPAND_FILL
	view.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	view.clip_contents = true
	view.mouse_filter = Control.MOUSE_FILTER_IGNORE
	parent.add_child(view)
	return view

func _label(parent: Container, text: String, size: int) -> Label:
	var result := Label.new()
	result.text = text
	result.add_theme_font_size_override("font_size", size)
	result.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	parent.add_child(result)
	return result

func _hint(parent: Container, text: String, ink: Color = COLOR_SECONDARY) -> void:
	var label := _label(parent, text, 15)
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.modulate = ink

func _row(parent: Container) -> HBoxContainer:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 6)
	parent.add_child(row)
	return row

func _rule(parent: Container) -> void:
	var separator := HSeparator.new()
	separator.custom_minimum_size.y = 9
	parent.add_child(separator)

func _button(parent: Container, text: String, action: String, value: Variant = null, primary: bool = false, keyboard: bool = true) -> Button:
	var control := Button.new()
	control.text = text
	control.custom_minimum_size.y = 45 if mobile else 34
	control.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	control.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	if not keyboard:
		control.focus_mode = Control.FOCUS_NONE
	if primary:
		control.theme_type_variation = &"SignalButton"
	if not action.is_empty():
		control.pressed.connect(func(): action_requested.emit(action, value))
	parent.add_child(control)
	return control

func _hold_button(parent: Container, text: String, action: String) -> Button:
	var button := _button(parent, text, "", null, false, false)
	button.button_down.connect(func(): action_requested.emit(action, true))
	button.button_up.connect(func(): action_requested.emit(action, false))
	return button

func _box(fill: Color, border: Color, padding: int) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = fill
	style.border_color = border
	style.set_border_width_all(1)
	style.set_corner_radius_all(8)
	style.content_margin_left = padding
	style.content_margin_top = padding
	style.content_margin_bottom = padding
	style.content_margin_right = padding
	return style

func _make_theme() -> Theme:
	var result := Theme.new()
	var path := "res://assets/ridgebound-ui.ttf"
	if ResourceLoader.exists(path):
		result.default_font = load(path) as Font
	result.default_font_size = 16
	result.set_color("font_color", "Label", COLOR_PAPER)
	result.set_stylebox("panel", "AcceptDialog", _box(COLOR_INK, COLOR_LINE, 12))
	result.set_stylebox("panel", "PopupMenu", _box(COLOR_INK, COLOR_LINE, 6))
	result.set_color("font_color", "PopupMenu", COLOR_PAPER)
	result.set_stylebox("background", "ProgressBar", _box(COLOR_FACE, COLOR_FACE, 1))
	result.set_stylebox("fill", "ProgressBar", _box(COLOR_SIGNAL, COLOR_SIGNAL, 1))
	for type in ["Button", "OptionButton"]:
		result.set_color("font_color", type, COLOR_PAPER)
		result.set_color("font_disabled_color", type, COLOR_SECONDARY.darkened(0.18))
		result.set_stylebox("normal", type, _box(COLOR_FACE, COLOR_LINE, 6))
		result.set_stylebox("hover", type, _box(COLOR_FACE.lightened(0.10), COLOR_SECONDARY, 6))
		result.set_stylebox("pressed", type, _box(COLOR_FACE.lightened(0.05), COLOR_SIGNAL, 6))
		result.set_stylebox("disabled", type, _box(COLOR_INK, COLOR_FACE, 6))
		var focus := _box(Color.TRANSPARENT, COLOR_SIGNAL, 1)
		focus.set_border_width_all(2)
		result.set_stylebox("focus", type, focus)
	result.set_type_variation(&"SignalButton", &"Button")
	for state in ["font_color", "font_pressed_color", "font_hover_color", "font_focus_color", "font_disabled_color"]:
		result.set_color(state, "SignalButton", COLOR_INK)
	result.set_stylebox("normal", "SignalButton", _box(COLOR_SIGNAL, COLOR_SIGNAL, 7))
	result.set_stylebox("hover", "SignalButton", _box(COLOR_SIGNAL.lightened(0.14), COLOR_SIGNAL, 7))
	result.set_stylebox("disabled", "SignalButton", _box(COLOR_SIGNAL.darkened(0.17), COLOR_SIGNAL, 7))
	return result
