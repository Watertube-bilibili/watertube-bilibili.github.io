extends RefCounted
## Device cutouts are in display pixels. This class returns margins in the root
## viewport's logical units, shared by the HUD, touch input and settings panels.

const CATALOG := "res://device-profiles.json"
const SETTINGS := "user://screen-fit.cfg"
static var _models: Array[Dictionary] = []
static var _by_id: Dictionary = {}
static var _selection: Dictionary = {}
static var _last_size := Vector2.ZERO
static var _last_result := Vector4.ZERO
static var _last_read := -1000

static func options() -> Array[Dictionary]:
	if not _models.is_empty():
		return _models
	_models.append({"id": "auto", "label": "自动 · 系统安全区域", "top": 0.0, "bottom": 0.0})
	var catalog: Variant = JSON.parse_string(FileAccess.get_file_as_string(CATALOG))
	if catalog is Dictionary and catalog.get("version") == 1 and catalog.get("models") is Array:
		for entry: Variant in catalog.models:
			if entry is Dictionary and entry.get("id") is String and entry.get("label") is String and entry.has("top") and entry.has("bottom"):
				_models.append(entry)
	for entry: Dictionary in _models:
		_by_id[entry.id] = entry
	return _models

static func preferences() -> Dictionary:
	if _selection.is_empty():
		options()
		var config := ConfigFile.new()
		config.load(SETTINGS)
		_selection = _validated(str(config.get_value("screen", "model", "auto")), str(config.get_value("screen", "side", "auto")), float(config.get_value("screen", "extra", 0.0)))
	return _selection.duplicate()

static func _validated(model: String, side: String, extra: float) -> Dictionary:
	return {"model": model if _by_id.has(model) else "auto", "side": side if side in ["auto", "left", "right"] else "auto", "extra": clampf(extra, 0.0, 32.0) if is_finite(extra) else 0.0}

static func save_preferences(model: String, side: String, extra: float) -> void:
	options()
	_selection = _validated(model, side, extra)
	_last_read = -1000
	var config := ConfigFile.new()
	for key: String in _selection:
		config.set_value("screen", key, _selection[key])
	config.save(SETTINGS)

static func _hardware_margins(pixels: Vector2, safe: Rect2, holes: Array) -> Vector4:
	if not safe.has_area():
		return Vector4.ZERO
	# Android can already crop the game Surface to its safe rectangle.
	if (safe.size - pixels).abs().length_squared() <= 2.0:
		return Vector4.ZERO
	var visible := Rect2(Vector2.ZERO, pixels)
	safe = visible.intersection(safe)
	if not safe.has_area():
		return Vector4.ZERO
	var result := Vector4(safe.position.x, safe.position.y, maxf(0, pixels.x - safe.end.x), maxf(0, pixels.y - safe.end.y))
	for rectangle: Rect2 in holes:
		var hole := visible.intersection(rectangle)
		if not hole.has_area():
			continue
		# In landscape a corner camera belongs to a side edge, even if it is
		# equally close to the top. The full affected strip protects any HUD.
		var gap := Vector4(hole.position.x, hole.position.y, pixels.x - hole.end.x, pixels.y - hole.end.y)
		var limit := minf(pixels.x, pixels.y) * 0.28
		if pixels.x > pixels.y and minf(gap.x, gap.z) < limit:
			if gap.x < gap.z:
				result.x = maxf(result.x, hole.end.x)
			else:
				result.z = maxf(result.z, pixels.x - hole.position.x)
		elif minf(gap.y, gap.w) < limit:
			if gap.y < gap.w:
				result.y = maxf(result.y, hole.end.y)
			else:
				result.w = maxf(result.w, pixels.y - hole.position.y)
	return result

static func _display_rotation() -> int:
	if Engine.has_singleton("AndroidRuntime"):
		var android = Engine.get_singleton("AndroidRuntime")
		var activity = android.getActivity()
		if activity:
			var display = activity.getWindowManager().getDefaultDisplay()
			if display:
				return int(display.getRotation()) # Surface.ROTATION_0, 90, 180, 270
	return 0

static func fit(size: Vector2, system: Vector4, model: Dictionary, side: String, rotation: int, extra: float) -> Vector4:
	var short_side := minf(size.x, size.y)
	var top := short_side * clampf(float(model.get("top", 0.0)), 0.0, 0.20)
	var bottom := short_side * clampf(float(model.get("bottom", 0.0)), 0.0, 0.12)
	var result := system
	if size.x > size.y:
		if side in ["left", "right"] and model.get("id", "auto") == "auto":
			top = short_side * 0.09
		var right := rotation == 3
		if absf(system.x - system.z) > short_side * 0.025:
			right = system.z > system.x
		if side != "auto":
			right = side == "right"
		if right:
			result.z = maxf(result.z, top)
		else:
			result.x = maxf(result.x, top)
		result.w = maxf(result.w, bottom * 0.65)
	elif rotation == 2:
		result.w = maxf(result.w, top)
		result.y = maxf(result.y, bottom)
	else:
		result.y = maxf(result.y, top)
		result.w = maxf(result.w, bottom)
	var pad := clampf(extra, 0.0, 32.0) * short_side / 390.0
	return (result + Vector4(pad, pad, pad, pad)).ceil()

static func margins(viewport: Viewport) -> Vector4:
	var size := viewport.get_visible_rect().size
	var now := Time.get_ticks_msec()
	if size == _last_size and now - _last_read < 200:
		return _last_result
	var choice := preferences()
	var model: Dictionary = _by_id[choice.model]
	var system := Vector4.ZERO
	var rotation := 0
	if OS.get_name() in ["Android", "iOS"]:
		var pixels := Vector2(DisplayServer.window_get_size())
		if pixels.x > 0.0 and pixels.y > 0.0:
			var safe := Rect2(DisplayServer.get_display_safe_area())
			var holes: Array = DisplayServer.get_display_cutouts() if safe.has_area() and OS.get_name() == "Android" else []
			var physical := _hardware_margins(pixels, safe, holes)
			var scale := size / pixels
			system = physical * Vector4(scale.x, scale.y, scale.x, scale.y)
			# When the OS has inset the entire rendering Surface upstream,
			# adding a model band for the same hardware edge would count it twice.
			var display := Vector2(DisplayServer.screen_get_size())
			if safe.has_area() and (safe.size - pixels).abs().length_squared() <= 2.0 and (display - pixels).length_squared() > 4.0:
				model = {"id": choice.model, "top": 0.0, "bottom": 0.0}
		rotation = _display_rotation()
	_last_size = size
	_last_read = now
	_last_result = fit(size, system, model, choice.side, rotation, float(choice.extra))
	return _last_result
