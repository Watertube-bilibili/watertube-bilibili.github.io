extends SceneTree

func _initialize() -> void:
	call_deferred("_test")

func _test() -> void:
	var shell = preload("res://desktop_main.tscn").instantiate()
	root.add_child(shell)
	await process_frame
	shell.smoke = true
	shell._begin()
	var center := root.get_visible_rect().size * 0.5
	var first := InputEventScreenTouch.new()
	first.index = 2
	first.position = center
	first.pressed = true
	shell._unhandled_input(first)
	if shell.orbit_pointer != 2:
		fail("clear road did not capture screen touch")
		return
	var second := InputEventScreenTouch.new()
	second.index = 3
	second.position = center + Vector2(10, 0)
	second.pressed = true
	shell._unhandled_input(second)
	if shell.orbit_pointer != 2:
		fail("second finger displaced orbit owner")
		return
	var drag := InputEventScreenDrag.new()
	drag.index = 3
	drag.position = center + Vector2(125, 0)
	var old_yaw: float = float(shell.game.orbit)
	if shell._continue_scene_orbit(drag) or not is_equal_approx(float(shell.game.orbit), old_yaw):
		fail("unrelated touch changed camera")
		return
	drag.index = 2
	drag.position = center + Vector2(125, 35)
	if not shell._continue_scene_orbit(drag) or is_equal_approx(float(shell.game.orbit), old_yaw):
		fail("owned screen drag did not orbit camera")
		return
	shell._open_menu("pause")
	if shell.orbit_pointer != -2 or shell._sample_drive().active:
		fail("pause did not reset camera and drive capture")
		return
	shell._open_menu("display")
	var profile_size: int = shell.interface.screen_model.item_count
	if profile_size < 65:
		fail("screen fit picker did not expose the model catalogue")
		return
	var old_preset: Dictionary = preload("res://screen_fit.gd").preferences()
	var option := shell.interface.screen_model as OptionButton
	option.select(mini(option.item_count - 1, 4))
	shell.interface._screen_pref_changed(4.0)
	var next: Dictionary = preload("res://screen_fit.gd").preferences()
	preload("res://screen_fit.gd").save_preferences(old_preset.model, old_preset.side, old_preset.extra)
	if next.model != option.get_item_metadata(option.selected):
		fail("screen fit picker did not save the selected preset")
		return
	shell._open_menu("maps")
	await create_timer(0.3).timeout
	shell._open_menu("garage")
	await create_timer(0.2).timeout
	shell._open_menu("settings")
	await create_timer(0.2).timeout
	shell.controls.open_settings()
	await create_timer(0.2).timeout
	if not bool(shell.controls.settings_open()):
		fail("controller settings did not open")
		return
	print("NEW_NATIVE_SMOKE_OK ", profile_size, " "model choices; touch ownership; open 4 sheets and control settings"")
	quit()

func fail(reason: String) -> void:
	push_error(reason)
	quit(1)
