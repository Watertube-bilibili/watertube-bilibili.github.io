extends SceneTree
## Exercise independent Android-style touch streams in a headless viewport.

const TouchDrive := preload("res://touch_drive.gd")
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func _run() -> void:
	var viewport := SubViewport.new()
	viewport.size = Vector2i(390, 844)
	root.add_child(viewport)
	var controls = TouchDrive.new()
	viewport.add_child(controls)
	controls.set_driving_active(true)
	await process_frame
	_check_layout(controls, viewport.size)
	await _drive(viewport, controls)
	viewport.size = Vector2i(844, 390)
	await process_frame
	_check_layout(controls, viewport.size)
	await _drive(viewport, controls)
	if failures == 0:
		print("TOUCH_DRIVE_SMOKE_OK")
	quit(failures)

func _expect(condition: bool, message: String) -> void:
	if not condition:
		failures += 1
		push_error(message)

func _check_layout(controls, screen_size: Vector2i) -> void:
	var wheel_size := Vector2.ONE * float(controls._wheel_radius)
	var wheel := Rect2(Vector2(controls._wheel_center) - wheel_size, wheel_size * 2.0)
	var screen := Rect2(Vector2.ZERO, Vector2(screen_size))
	_expect(screen.encloses(wheel), "wheel must be on-screen in both orientations")
	for pedal: Rect2 in controls._pedal_rects:
		_expect(screen.encloses(pedal) and not wheel.intersects(pedal), "pedals must be visible and clear of the wheel")
		_expect(pedal.size.x >= 44.0 and pedal.size.y >= 44.0, "small pedals must remain tappable")

func _touch(viewport: Viewport, index: int, point: Vector2, pressed: bool, canceled := false) -> void:
	var event := InputEventScreenTouch.new()
	event.index = index
	event.position = point
	event.pressed = pressed
	event.canceled = canceled
	viewport.push_input(event, true)

func _drag(viewport: Viewport, index: int, point: Vector2) -> void:
	var event := InputEventScreenDrag.new()
	event.index = index
	event.position = point
	viewport.push_input(event, true)

func _drive(viewport: SubViewport, controls) -> void:
	var wheel: Vector2 = controls._wheel_center
	var lift: float = controls._wheel_radius * 0.8
	var gas: Vector2 = controls._pedal_rects[2].get_center()
	var brake: Vector2 = controls._pedal_rects[1].get_center()
	_touch(viewport, 1, wheel + Vector2(0.0, -lift), true)
	_touch(viewport, 2, gas, true)
	_drag(viewport, 1, wheel + Vector2(lift, 0.0))
	await process_frame
	var sample: Dictionary = controls.sample()
	_expect(sample.steer > 0.6 and sample.throttle == 1.0, "clockwise wheel drag while accelerating must steer right")
	_touch(viewport, 1, wheel + Vector2(lift, 0.0), false, true)
	sample = controls.sample()
	_expect(sample.steer == 0.0 and sample.throttle == 1.0, "wheel cancellation must not release the accelerator finger")
	_touch(viewport, 3, wheel, true)
	_drag(viewport, 3, wheel + Vector2(-lift, 0.0))
	_touch(viewport, 2, gas, false)
	_touch(viewport, 4, brake, true)
	sample = controls.sample()
	_expect(sample.steer < -0.6 and sample.throttle == 0.0 and sample.brakeValue == 1.0, "hub drag and independent brake must both work")
	controls.notification(Node.NOTIFICATION_APPLICATION_FOCUS_OUT)
	sample = controls.sample()
	_expect(sample.steer == 0.0 and sample.brakeValue == 0.0, "focus loss must neutralize all touches")
	_touch(viewport, 4, brake, true)
	controls.set_driving_active(false)
	_expect(controls.sample().brakeValue == 0.0, "menu navigation must neutralize pedals")
	controls.set_driving_active(true)
	_expect(controls.sample().brakeValue == 0.0, "resume must not retain a stale touch")
