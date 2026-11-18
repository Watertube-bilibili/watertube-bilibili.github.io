extends SceneTree

func _initialize() -> void:
	call_deferred("_capture")

func _capture() -> void:
	var shell := preload("res://desktop_main.tscn").instantiate()
	root.add_child(shell)
	await process_frame
	# Linux runner uses exactly the mobile UI branch and viewport dimensions.
	root.min_size = Vector2i(1, 1)
	root.position = Vector2i.ZERO
	for layout in [["portrait", Vector2i(390, 844)], ["landscape", Vector2i(844, 390)]]:
		root.size = layout[1]
		await create_timer(0.8).timeout
		await RenderingServer.frame_post_draw
		var image := root.get_texture().get_image()
		var out := OS.get_environment("RUNNER_TEMP").path_join("mobile-" + String(layout[0]) + ".jpg")
		if image.save_jpg(out, 0.83) != OK:
			push_error("Could not save native layout preview")
			quit(1)
			return
		print("MOBILE_VIEWPORT ", layout[0], " ", image.get_size())
	quit()
