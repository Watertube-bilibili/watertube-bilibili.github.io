extends RefCounted

const FILE := "user://vehicle-condition.cfg"
var broken := false

static func calibrated(value: Variant, fallback: float) -> float:
	if (value is float or value is int) and is_finite(float(value)):
		return clampf(float(value), 300.0, 2500.0)
	return fallback

func restore() -> void:
	if OS.has_feature("web"):
		var saved: Variant = JavaScriptBridge.eval("(() => {try {return localStorage.getItem('ridgebound-mpv-brake') === '1'} catch {return false}})()")
		broken = saved == true
		return
	var config := ConfigFile.new()
	if config.load(FILE) == OK:
		broken = config.get_value("yuchuan", "brake_pedal_broken", false) == true

func remember(state: Dictionary) -> void:
	if state.get("vehicleId") != "yuchuan" or broken == state.get("brakePedalBroken", false):
		return
	broken = bool(state.brakePedalBroken)
	if OS.has_feature("web"):
		var value := "1" if broken else "0"
		JavaScriptBridge.eval("try {localStorage.setItem('ridgebound-mpv-brake','%s')} catch {}" % value)
		return
	var config := ConfigFile.new()
	config.set_value("yuchuan", "brake_pedal_broken", broken)
	config.save(FILE)
