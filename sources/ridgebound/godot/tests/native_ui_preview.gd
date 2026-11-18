extends SceneTree
## Local CI preview helper. Never included in game builds.

func _initialize() -> void:
	call_deferred("_capture")

func _capture() -> void:
	var scene := preload("res://desktop_main.tscn").instantiate()
	root.add_child(scene)
	await process_frame
	await _snapshot("start")
	scene.call("_begin")
	await _snapshot("drive")
	scene.call("_action", "winch_panel")
	await _snapshot("winch")
	scene.call("_open_menu", "maps")
	await _snapshot("maps")
	quit()

func _snapshot(tag: String) -> void:
	await create_timer(0.4).timeout
	await RenderingServer.frame_post_draw
	var image := root.get_texture().get_image()
	image.resize(760, roundi(760.0 * image.get_height() / image.get_width()), Image.INTERPOLATE_LANCZOS)
	if image.save_jpg(OS.get_environment("RUNNER_TEMP").path_join("ui-" + tag + ".jpg"), 0.86) != OK:
		push_error("Could not save native preview")
