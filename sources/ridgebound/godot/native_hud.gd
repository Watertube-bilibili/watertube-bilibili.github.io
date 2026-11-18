extends CanvasLayer
## Native driving instruments and sheets. The driving scene and save flow live in desktop_main.

signal action_requested(action: String, value: Variant)

const RouteView = preload("res://desktop_map.gd")
const ScreenFit = preload("res://screen_fit.gd")
const COLOR_INK := Color("17201f")
const COLOR_FACE := Color("252f2c")
const COLOR_LINE := Color("59635b")
const COLOR_PAPER := Color("f7eedc")
const COLOR_SECONDARY := Color("e0d4be")
const COLOR_SIGNAL := Color("e7ad75")
const COLOR_DANGER := Color("ffab93")
const VIEW_NAMES := ["跟随", "高位", "座舱"]
const SURFACES := {
	"trail": "山间土路", "mud": "泥地", "water": "浅水", "grass": "草地",
	"rock": "岩石", "snow": "积雪", "ice": "冰面"
}

class TrailAction extends Button:
	var primary := false

	func _ready() -> void:
		mouse_entered.connect(queue_redraw)
		mouse_exited.connect(queue_redraw)
		focus_entered.connect(queue_redraw)
		focus_exited.connect(queue_redraw)

	func _draw() -> void:
		var initial := primary and get_viewport().gui_get_focus_owner() == null
		if initial or has_focus() or is_hovered():
			var center := size.y * 0.5
			draw_colored_polygon(PackedVector2Array([
				Vector2(3.0, center - 5.0), Vector2(12.0, center), Vector2(3.0, center + 5.0),
			]), Color("e7ad75"))

class TrailMarks extends Control:
	const INK := Color(0.06, 0.085, 0.07, 0.76)
	const CHALK := Color("f7eedc")
	const EMBER := Color("e7ad75")
	var reading: Dictionary = {}
	var safe := Vector4.ZERO
	var phone := false
	var low_edge := 0.0
	var face: Font
	var short_landscape := false

	func _draw() -> void:
		if reading.is_empty():
			return
		_compass()
		var att_y := low_edge - 11.0 if not short_landscape else safe.y + 108.0
		var leg := safe.x + 38.0
		var far := size.x - safe.z - 38.0
		if short_landscape:
			far = leg + 78.0
		_attitude(Vector2(leg, att_y), rad_to_deg(float(reading.get("pitch", 0.0))), true)
		_attitude(Vector2(far, att_y), rad_to_deg(float(reading.get("roll", 0.0))), false)

	func _compass() -> void:
		var width := minf(480.0, size.x * 0.46 if short_landscape else size.x * 0.70)
		var middle := (size.x + safe.x - safe.z) * 0.5
		var y := safe.y + 31.0
		var bearing := fposmod(-rad_to_deg(float(reading.get("yaw", 0.0))), 360.0)
		var first := floori((bearing - 55.0) / 5.0) * 5
		var last := ceili((bearing + 55.0) / 5.0) * 5
		for heading in range(first, last + 1, 5):
			var offset := float(heading) - bearing
			if absf(offset) > 54.0:
				continue
			var x := middle + offset * width / 108.0
			var important := posmod(heading, 15) == 0
			var length := 10.0 if important else 5.0
			_stroke(Vector2(x, y), Vector2(x, y + length), CHALK)
			if important:
				var value := str(posmod(heading, 360))
				match posmod(heading, 360):
					0: value = "N"
					90: value = "E"
					180: value = "S"
					270: value = "W"
				_print(value, Vector2(x - 18.0, y - 3.0), 36.0, 16)
		draw_colored_polygon(PackedVector2Array([
			Vector2(middle, y + 11.0), Vector2(middle - 5.0, y + 20.0), Vector2(middle + 5.0, y + 20.0),
		]), EMBER)

	func _attitude(center: Vector2, degrees: float, pitch: bool) -> void:
		var radius := 26.0 if phone else 23.0
		draw_arc(center, radius, PI * 0.16, PI * 1.84, 28, INK, 3.0, true)
		draw_arc(center, radius, PI * 0.16, PI * 1.84, 28, CHALK, 1.0, true)
		var axis := Vector2.RIGHT.rotated(deg_to_rad(clampf(degrees, -72.0, 72.0)))
		_stroke(center - axis * (radius - 7.0), center + axis * (radius - 7.0), EMBER if absf(degrees) >= 28.0 else CHALK)
		draw_circle(center, 2.0, CHALK)
		draw_line(center + Vector2(-4.0, radius), center + Vector2(4.0, radius), EMBER, 2.0, true)
		_print("%+d°" % roundi(degrees), center + Vector2(-32.0, radius + 19.0), 64.0, 19)
		_print("俯仰" if pitch else "侧倾", center + Vector2(-34.0, -radius - 7.0), 68.0, 18)

	func _stroke(from: Vector2, to: Vector2, color: Color) -> void:
		draw_line(from + Vector2(0, 1), to + Vector2(0, 1), INK, 3.0, true)
		draw_line(from, to, color, 1.2, true)

	func _print(text: String, point: Vector2, width: float, font_size: int) -> void:
		var font := face if face else get_theme_default_font()
		draw_string_outline(font, point, text, HORIZONTAL_ALIGNMENT_CENTER, width, font_size, 4, INK)
		draw_string(font, point, text, HORIZONTAL_ALIGNMENT_CENTER, width, font_size, CHALK)

var skin: Theme
var root_control: Control
var area_card: PanelContainer
var meter_card: PanelContainer
var tool_card: PanelContainer
var tray_card: PanelContainer
var tool_toggle: Button
var tools_open := false
var mini_visible := false
var marks: TrailMarks
var mini_card: PanelContainer
var winch_card: PanelContainer
var message_card: PanelContainer
var backdrop: ColorRect
var sheet: PanelContainer
var title: Label
var back_button: Button
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
	layer = 10
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
	for control in [area_card, meter_card, tool_card, tray_card, mini_card, winch_card, message_card, sheet]:
		if control.is_visible_in_tree() and control.get_global_rect().has_point(point):
			return true
	return false

func reflow() -> void:
	viewport_size = get_viewport().get_visible_rect().size
	margins = ScreenFit.margins(get_viewport())
	var left := margins.x + 18.0
	var top := margins.y + 16.0
	var right := viewport_size.x - margins.z - 18.0
	var bottom := viewport_size.y - margins.w - 16.0
	var width := maxf(200.0, right - left)
	var height := maxf(180.0, bottom - top)
	var portrait := mobile and viewport_size.x <= viewport_size.y
	var tap_height := 88.0 if portrait else (49.0 if mobile else 38.0)
	if mobile:
		for candidate in root_control.find_children("*", "Button", true, false):
			var button := candidate as Button
			button.custom_minimum_size.y = tap_height
			if button is TrailAction:
				button.add_theme_font_size_override("font_size", 37 if portrait else 24)
			else:
				button.add_theme_font_size_override("font_size", 26 if portrait else 16)
	var starting := current_screen == "start"
	var short_landscape := mobile and not portrait and height < 530.0
	title.add_theme_font_size_override("font_size", (72 if portrait else 56) if starting else (45 if portrait else 36))
	var sheet_width := width if portrait else minf(width, 720.0 if current_screen == "maps" else 450.0)
	var sheet_height := minf(height, 790.0 if portrait else 485.0)
	if starting:
		if not portrait:
			sheet_width = minf(330.0, width * 0.46)
		sheet_height = minf(height, 503.0 if portrait else 320.0)
	var menu_origin := Vector2(left + 12.0, top + (height - sheet_height) * 0.5)
	if portrait or starting:
		menu_origin = Vector2(left + 4.0, bottom - sheet_height)
	_set_box(sheet, Rect2(menu_origin, Vector2(sheet_width - 8.0, sheet_height)))
	var area_y := top + (55.0 if portrait else 34.0)
	_set_box(area_card, Rect2(Vector2(left, area_y), Vector2(minf(250.0, width * 0.45), 56.0)))
	var reserve := 188.0 if mobile else 0.0
	var low := bottom - reserve - (41.0 if mobile else 51.0)
	var instrument_y := area_y + 102.0 if short_landscape else low - 39.0
	var meter_width := minf(257.0, width * 0.53)
	var meter_x := left if short_landscape else (left + right - meter_width) * 0.5
	_set_box(meter_card, Rect2(Vector2(meter_x, instrument_y), Vector2(meter_width, 88.0)))
	var tool_width := minf(126.0 if portrait else 94.0, width * 0.38)
	_set_box(tool_card, Rect2(Vector2(right - tool_width, top + 36.0), Vector2(tool_width, tap_height)))
	var tray_width := minf(318.0 if portrait else 290.0, width)
	var tray_height := tray_card.get_combined_minimum_size().y
	var tray_origin := Vector2(right - tray_width, top + tap_height + 48.0)
	if short_landscape:
		tray_origin = Vector2(right - tool_width - tray_width - 12.0, top + 41.0)
	_set_box(tray_card, Rect2(tray_origin, Vector2(tray_width, tray_height)))
	var map_width := minf(247.0 if portrait else 200.0, width * 0.40)
	var map_origin := Vector2(right - map_width, top + tap_height + 51.0)
	if short_landscape:
		map_origin = Vector2((left + right - map_width) * 0.5, top + 48.0)
	_set_box(mini_card, Rect2(map_origin, Vector2(map_width, map_width + tap_height + 16.0)))
	var winch_width := minf(372.0, width)
	var winch_x := right - winch_width
	var winch_height := winch_card.get_combined_minimum_size().y
	if short_landscape:
		winch_x = (left + right - winch_width) * 0.5
	_set_box(winch_card, Rect2(Vector2(winch_x, top + 48.0), Vector2(winch_width, winch_height)))
	_set_box(message_card, Rect2(Vector2(left + width * 0.20, top + 116.0), Vector2(width * 0.60, 40.0)))
	marks.safe = margins
	marks.phone = mobile
	marks.low_edge = low
	marks.short_landscape = short_landscape
	marks.queue_redraw()
	var material_id := backdrop.material as ShaderMaterial
	material_id.set_shader_parameter("portrait", portrait)
	material_id.set_shader_parameter("start_scene", starting)
	_show_driving_chrome()

func _show_driving_chrome() -> void:
	var driving := current_screen.is_empty()
	area_card.visible = driving and tools_open
	meter_card.visible = driving and not open_winch
	marks.visible = driving and not open_winch and not tools_open
	tool_card.visible = driving and not open_winch
	tray_card.visible = driving and tools_open and not open_winch
	mini_card.visible = driving and mini_visible and not open_winch and not tools_open
	winch_card.visible = driving and open_winch

func _toggle_tools() -> void:
	tools_open = not tools_open
	tool_toggle.text = "收起" if tools_open else "工具"
	reflow()

func _toggle_map() -> void:
	mini_visible = not mini_visible
	tools_open = false
	tool_toggle.text = "工具"
	reflow()

func reveal_map() -> void:
	mini_visible = true
	tools_open = false
	tool_toggle.text = "工具"
	reflow()

func show_winch(visible: bool) -> void:
	open_winch = visible
	tools_open = false
	tool_toggle.text = "工具"
	reflow()

func notify(text: String) -> void:
	message.text = text
	message_card.visible = not text.is_empty()

func update_status(snapshot: Dictionary, detail: Dictionary) -> void:
	marks.reading = snapshot
	marks.queue_redraw()
	area.text = String(detail.get("regionName", "松风谷"))
	route.text = String(detail.get("routeText", "自由探索"))
	speed.text = "%02d" % roundi(absf(float(snapshot.speed) * 3.6))
	road.text = "%s  %.0f°" % [SURFACES.get(snapshot.surface, "越野"), snapshot.tilt]
	var gear := "R" if float(snapshot.speed) < -0.08 else "D"
	gearbox.text = "%s  %s   %s" % ["L" if snapshot.lowGear else "H", gear, "4×4" if snapshot.awd else "2WD"]
	health.visible = tools_open
	health.text = "车身 %d%%   轮胎 %d%%   悬挂 %d%%" % [snapshot.damage.body, snapshot.damage.tires, snapshot.damage.suspension]
	var broken := bool(snapshot.get("brakePedalBroken", false))
	var warning_changed := pedal_warning.visible != broken
	pedal_warning.visible = broken
	pedal_warning.text = "制动踏板已断 · 前往维修小屋" if broken else ""
	if not broken and float(snapshot.get("pedalForceN", 0.0)) >= 1.0:
		gearbox.text += "   %d N" % roundi(float(snapshot.pedalForceN))
	if snapshot.get("blocked", false):
		route.text = "正在加载前方路面"
	tool_camera.tooltip_text = "当前视角 · %s" % VIEW_NAMES[clampi(int(snapshot.cameraMode), 0, VIEW_NAMES.size() - 1)]
	tool_repair.disabled = not bool(snapshot.get("repairAvailable", false))
	var overview := bool(detail.get("overview", false))
	mini_switch.text = "跟车" if overview else "全图"
	if mini_card.visible:
		mini_map.call("set_view", snapshot, overview)
	if is_instance_valid(map_preview) and map_preview.is_visible_in_tree():
		map_preview.call("set_view", snapshot, true)
	_refresh_winch(snapshot)
	if warning_changed:
		reflow()

func show_screen(mode: String, context: Dictionary) -> void:
	current_screen = mode
	backdrop.visible = not mode.is_empty()
	tools_open = false
	tool_toggle.text = "工具"
	if mode.is_empty():
		reflow()
		return
	for child in sheet_body.get_children():
		sheet_body.remove_child(child)
		child.queue_free()
	map_preview = null
	back_button.visible = mode != "start"
	tabs.visible = mode != "start"
	var first: Button
	var started := bool(context.get("started", false))
	var save: Dictionary = context.get("save", {})
	var installed: Dictionary = context.get("importedMap", {})
	match mode:
		"start":
			title.text = "山野之间"
			first = _menu_link(sheet_body, "出发", "begin", null, true)
			_menu_link(sheet_body, "车库", "screen", "garage")
			_menu_link(sheet_body, "地图", "screen", "maps")
			_menu_link(sheet_body, "设置", "screen", "settings")
		"pause":
			title.text = "暂停"
			first = _menu_link(sheet_body, "继续", "begin", null, true)
			_menu_link(sheet_body, "地图", "screen", "maps")
			_menu_link(sheet_body, "车库", "screen", "garage")
			_menu_link(sheet_body, "设置", "screen", "settings")
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
	marks = TrailMarks.new()
	marks.face = skin.default_font
	marks.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root_control.add_child(marks)
	marks.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var focus := _card(root_control)
	area_card = focus.get_parent() as PanelContainer
	_unbox(area_card)
	area = _label(focus, "", 20)
	route = _label(focus, "", 15)
	route.modulate = COLOR_SECONDARY

	var meters := _card(root_control)
	meter_card = meters.get_parent() as PanelContainer
	_unbox(meter_card)
	var main := HBoxContainer.new()
	main.alignment = BoxContainer.ALIGNMENT_BEGIN
	main.add_theme_constant_override("separation", 8)
	meters.add_child(main)
	speed = _label(main, "00", 33)
	speed.custom_minimum_size.x = 56.0
	var unit := _label(main, "km/h", 14)
	unit.custom_minimum_size.x = 35.0
	road = _label(main, "", 14)
	road.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	gearbox = _label(meters, "", 23)
	gearbox.modulate = COLOR_SIGNAL
	health = _label(meters, "", 14)
	health.modulate = COLOR_SECONDARY
	health.hide()
	pedal_warning = _label(meters, "", 16)
	pedal_warning.modulate = COLOR_DANGER
	pedal_warning.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	pedal_warning.text_overrun_behavior = TextServer.OVERRUN_NO_TRIMMING
	pedal_warning.custom_minimum_size.y = 21
	pedal_warning.hide()

	var access := _card(root_control)
	tool_card = access.get_parent() as PanelContainer
	_unbox(tool_card)
	tool_toggle = _button(access, "工具", "", null, false, false)
	tool_toggle.theme_type_variation = &"QuietButton"
	tool_toggle.pressed.connect(_toggle_tools)

	var tray := _card(root_control)
	tray_card = tray.get_parent() as PanelContainer
	var row := _row(tray)
	tool_camera = _button(row, "视角", "camera", null, false, false)
	tool_winch = _button(row, "绞盘", "winch_panel", null, false, false)
	_button(row, "暂停", "menu", null, false, false)
	var trail := _row(tray)
	_button(trail, "驱动", "awd", null, false, false)
	_button(trail, "挡位", "gear", null, false, false)
	_button(trail, "小地图", "", null, false, false).pressed.connect(_toggle_map)
	var recovery := _row(tray)
	_button(recovery, "脱困", "recover", null, false, false)
	tool_repair = _button(recovery, "维修", "repair", null, false, false)

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
	var close := _button(head, "收起", "winch_panel", null, false, false)
	close.custom_minimum_size.x = 58.0
	close.size_flags_horizontal = Control.SIZE_SHRINK_END
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
	var vignette := Shader.new()
	vignette.code = """
shader_type canvas_item;
uniform bool portrait = false;
uniform bool start_scene = false;
void fragment() {
	float edge = portrait ? smoothstep(0.38, 1.0, UV.y) : 1.0 - smoothstep(0.06, 0.63, UV.x);
	float gain = start_scene ? 0.64 : 0.81;
	COLOR = vec4(0.021, 0.038, 0.030, gain * edge);
}
"""
	var wash := ShaderMaterial.new()
	wash.shader = vignette
	backdrop.material = wash
	backdrop.mouse_filter = Control.MOUSE_FILTER_STOP
	root_control.add_child(backdrop)
	backdrop.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var shell := _card(backdrop, true)
	sheet = shell.get_parent() as PanelContainer
	_unbox(sheet)
	var head := _row(shell)
	title = _label(head, "山野之间", 32)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	back_button = _button(head, "返回", "back")
	back_button.custom_minimum_size.x = 58.0
	back_button.size_flags_horizontal = Control.SIZE_SHRINK_END
	tabs = _row(shell)
	for tab in [["地图", "maps"], ["车库", "garage"], ["设置", "settings"]]:
		_button(tabs, tab[0], "screen", tab[1]).theme_type_variation = &"QuietButton"
	var scroll := ScrollContainer.new()
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.follow_focus = true
	shell.add_child(scroll)
	sheet_body = VBoxContainer.new()
	sheet_body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	sheet_body.add_theme_constant_override("separation", 8)
	scroll.add_child(sheet_body)

func _menu_link(parent: Container, text: String, action: String, value: Variant, primary: bool = false) -> Button:
	var control := TrailAction.new()
	control.text = text
	control.primary = primary
	control.alignment = HORIZONTAL_ALIGNMENT_LEFT
	control.custom_minimum_size.y = 40.0
	control.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	control.theme_type_variation = &"TrailSelected" if primary else &"TrailEntry"
	control.add_theme_font_size_override("font_size", 24)
	control.pressed.connect(func(): action_requested.emit(action, value))
	parent.add_child(control)
	return control

func _unbox(panel: PanelContainer) -> void:
	panel.add_theme_stylebox_override("panel", StyleBoxEmpty.new())

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
	label.text_overrun_behavior = TextServer.OVERRUN_NO_TRIMMING
	label.custom_minimum_size.y = 24
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
	result.set_color("font_shadow_color", "Label", Color(0.05, 0.08, 0.06, 0.80))
	result.set_constant("shadow_offset_y", "Label", 2)
	result.set_constant("shadow_offset_x", "Label", 1)
	result.set_color("font_outline_color", "Label", Color(0.05, 0.08, 0.06, 0.79))
	result.set_constant("outline_size", "Label", 3)
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
	result.set_type_variation(&"QuietButton", &"Button")
	var empty := StyleBoxEmpty.new()
	result.set_stylebox("normal", "QuietButton", empty)
	result.set_stylebox("hover", "QuietButton", _box(COLOR_FACE, COLOR_FACE, 6))
	result.set_color("font_outline_color", "QuietButton", Color(0.05, 0.08, 0.06, 0.86))
	result.set_constant("outline_size", "QuietButton", 3)
	result.set_stylebox("pressed", "QuietButton", _box(COLOR_FACE.lightened(0.08), COLOR_FACE, 6))
	result.set_type_variation(&"TrailEntry", &"Button")
	result.set_type_variation(&"TrailSelected", &"TrailEntry")
	result.set_color("font_outline_color", "TrailEntry", Color(0.05, 0.08, 0.06, 0.76))
	result.set_constant("outline_size", "TrailEntry", 3)
	var plain := _box(Color.TRANSPARENT, Color.TRANSPARENT, 0)
	plain.set_border_width_all(0)
	plain.content_margin_left = 25.0
	plain.content_margin_right = 8.0
	plain.content_margin_top = 0.0
	plain.content_margin_bottom = 0.0
	for state in ["normal", "hover", "pressed", "focus", "disabled"]:
		result.set_stylebox(state, "TrailEntry", plain)
	for state in ["font_color", "font_hover_color", "font_focus_color", "font_pressed_color"]:
		result.set_color(state, "TrailSelected", COLOR_SIGNAL)
	result.set_type_variation(&"SignalButton", &"Button")
	for state in ["font_color", "font_pressed_color", "font_hover_color", "font_focus_color", "font_disabled_color"]:
		result.set_color(state, "SignalButton", COLOR_INK)
	result.set_stylebox("normal", "SignalButton", _box(COLOR_SIGNAL, COLOR_SIGNAL, 7))
	result.set_stylebox("hover", "SignalButton", _box(COLOR_SIGNAL.lightened(0.14), COLOR_SIGNAL, 7))
	result.set_stylebox("disabled", "SignalButton", _box(COLOR_SIGNAL.darkened(0.17), COLOR_SIGNAL, 7))
	return result
