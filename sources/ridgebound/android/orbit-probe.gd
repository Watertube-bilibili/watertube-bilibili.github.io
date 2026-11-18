extends Node
## Staging-only observer. Gestures are delivered by Android, through the real input path.

const DrivingUI := preload("res://desktop_main.tscn")
var _shell: Node
var _clock := 0.0
var _sequence := 0

func _ready() -> void:
	_shell = DrivingUI.instantiate()
	add_child(_shell)
	_shell.call("_begin")
	print("ORBIT_PROBE_READY")

func _process(delta: float) -> void:
	_clock += delta
	if _clock < 0.18:
		return
	_clock = 0.0
	var game: Node3D = _shell.get("game")
	var camera: Camera3D = game.get("camera")
	var vehicle: Node3D = game.get("vehicle")
	var touch: CanvasLayer = _shell.get("touch_controls")
	if not camera or not vehicle or not touch:
		return
	var extent := get_viewport().get_visible_rect().size
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
		"viewport": [extent.x, extent.y],
		"screen": [screen.x, screen.y],
		"safe": [safe.position.x, safe.position.y, safe.size.x, safe.size.y],
		"wheel": [wheel.x, wheel.y, radius],
		"gas": [gas.x, gas.y],
		"steer": float(controls.steer),
		"throttle": float(controls.throttle),
	}
	print("ORBIT_PROBE ", JSON.stringify(probe))
