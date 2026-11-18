extends Node
## Staging-only observer. Gestures are delivered by Android, through the real input path.

const DrivingUI := preload("res://desktop_main.tscn")
const ScreenFit := preload("res://screen_fit.gd")
class TouchMonitor extends Node:
	var observe: Callable
	func _input(event: InputEvent) -> void:
		if event is InputEventScreenTouch:
			observe.call(event)

var _shell: Node
var _clock := 0.0
var _sequence := 0

func _ready() -> void:
	print("ORBIT_PROBE_INSTANTIATING")
	_shell = DrivingUI.instantiate()
	add_child(_shell)
	var monitor := TouchMonitor.new()
	monitor.observe = _trace_touch
	add_child(monitor)
	print("ORBIT_PROBE_READY")

func _process(delta: float) -> void:
	_clock += delta
	if _clock < 0.18:
		return
	_clock = 0.0
	var game: Node3D = _shell.get("game")
	if not game:
		return
	var camera: Camera3D = game.get("camera")
	var vehicle: Node3D = game.get("vehicle")
	var touch: CanvasLayer = _shell.get("touch_controls")
	var extent := get_viewport().get_visible_rect().size
	var start := _start_center()
	if not start.is_empty():
		_sequence += 1
		print("ORBIT_PROBE ", JSON.stringify({
			"sequence": _sequence, "active": false, "start": start, "viewport": [extent.x, extent.y],
		}))
		return
	if not camera or not vehicle or not touch:
		return
	var offset := camera.global_position - vehicle.global_position
	var snapshot: Dictionary = game.call("get_snapshot")
	var orbit: Dictionary = snapshot.get("cameraOrbit", {})
	var wheel: Vector2 = touch.get("_wheel_center")
	var radius: float = touch.get("_wheel_radius")
	var pedals: Array = touch.get("_pedal_rects")
	if pedals.size() < 3 or radius <= 0.0:
		return
	var gas: Vector2 = pedals[2].get_center()
	var safe := DisplayServer.get_display_safe_area()
	var screen := DisplayServer.screen_get_size()
	var controls: Dictionary = touch.call("sample")
	_sequence += 1
	var probe := {
		"sequence": _sequence,
		"active": bool(_shell.call("_driving")),
		"yaw": float(orbit.get("yaw", 0.0)),
		"pitch": float(orbit.get("pitch", 0.0)),
		"pose": [offset.x, offset.y, offset.z],
		"cutouts": DisplayServer.get_display_cutouts().size(),
		"rotation": ScreenFit._display_rotation(),
		"viewport": [extent.x, extent.y],
		"screen": [screen.x, screen.y],
		"safe": [safe.position.x, safe.position.y, safe.size.x, safe.size.y],
		"wheel": [wheel.x, wheel.y, radius],
		"gas": [gas.x, gas.y],
		"steer": float(controls.steer),
		"throttle": float(controls.throttle),
	}
	print("ORBIT_PROBE ", JSON.stringify(probe))

func _start_center() -> Array:
	var interface: CanvasLayer = _shell.get("interface")
	if interface == null or str(interface.get("current_screen")) != "start":
		return []
	var actions: Container = interface.get("sheet_body")
	if actions == null:
		return []
	# Both native home layouts place the driving action first in the sheet.
	for child in actions.get_children():
		var button := child as Button
		if button == null or not button.is_visible_in_tree() or button.disabled:
			continue
		var bounds := button.get_global_rect()
		if bounds.has_area():
			var center := bounds.get_center()
			return [center.x, center.y]
	return []

func _trace_touch(event: InputEventScreenTouch) -> void:
	if is_instance_valid(_shell):
		var touch := _shell.get("touch_controls") as CanvasLayer
		print("ORBIT_TOUCH ", JSON.stringify({
			"index": event.index, "pressed": event.pressed, "canceled": event.canceled,
			"point": [event.position.x, event.position.y], "rotation": ScreenFit._display_rotation(),
			"allowsOrbit": bool(_shell.call("_can_orbit")),
			"hitsHUD": bool(_shell.call("_over_driving_ui", event.position)),
			"hitsDrivingControl": touch != null and bool(touch.call("_is_drive_position", event.position)),
			"source": event.device,
		}))
