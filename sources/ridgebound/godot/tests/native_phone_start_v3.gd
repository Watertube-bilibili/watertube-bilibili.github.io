extends SceneTree

func _initialize() -> void:
	call_deferred("_capture")

func _capture() -> void:
	var shell = preload("res://desktop_main.tscn").instantiate()
	root.add_child(shell)
	await process_frame
	root.min_size = Vector2i(1, 1)
	root.position = Vector2i.ZERO
	shell.smoke = true
	var formats := [
		["portrait", Vector2i(390, 844)], ["landscape", Vector2i(844, 390)],
	]
	for layout in formats:
		root.size = layout[1]
		await create_timer(0.9).timeout
		await RenderingServer.frame_post_draw
		var camp = shell.game.camp
		if not camp or not camp.visible or not camp.parked_car:
			push_error("The live model and title scene should be present before departure")
			quit(1)
			return
		var car_pixels: Image = camp.studio.get_texture().get_image()
		if car_pixels.get_used_rect().size.x < car_pixels.get_width() / 3:
			push_error("The camp car failed to appear in the transparent render")
			quit(1)
			return
		var source := root.get_texture().get_image()
		var actual_scale := float(source.get_width()) / root.get_visible_rect().size.x
		var hero := Button.new()
		for control in shell.interface.sheet_body.find_children("*", "Button", true, false):
			if control.text == "出发":
				hero.free()
				hero = control
				break
		if not hero.is_visible_in_tree() or hero.size.y * actual_scale < 44.0 or shell.interface.back_button.visible:
			push_error("Start affordances fail touch-size or navigation checks")
			quit(1)
			return
		if int(layout[1].x) < int(layout[1].y) and shell.interface.sheet.size.x * actual_scale < 350.0:
			push_error("Portrait menu is too narrow for the safe area")
			quit(1)
			return
		var scroll: Control = shell.interface.sheet_body.get_parent()
		for control in shell.interface.sheet_body.find_children("*", "Button", true, false):
			if not scroll.get_global_rect().has_point(control.get_global_rect().get_center()) or control.size.y * actual_scale < 44.0:
				push_error("A menu touch target was clipped or too small: " + control.text)
				quit(1)
				return
		print("MOBILE_TARGET ", layout[0], " ", round(hero.size.y * actual_scale), "px")
		_save(source, String(layout[0]) + "-start")
	shell._begin()
	for layout in formats:
		root.size = layout[1]
		await create_timer(0.9).timeout
		await RenderingServer.frame_post_draw
		if shell.game.camp and shell.game.camp.visible:
			push_error("The title art should be hidden while driving")
			quit(1)
			return
		var controls = shell.touch_controls
		var wheel := Rect2(controls._wheel_center - Vector2.ONE * controls._wheel_radius, Vector2.ONE * controls._wheel_radius * 2)
		for panel in [shell.interface.meter_card, shell.interface.tool_card]:
			if panel.visible and panel.get_global_rect().intersects(wheel):
				push_error("Driving wheel overlaps a HUD card")
				quit(1)
				return
			for pedal in controls._pedal_rects:
				if panel.visible and panel.get_global_rect().intersects(pedal):
					push_error("Pedal overlaps a HUD card")
					quit(1)
					return
		_save(root.get_texture().get_image(), String(layout[0]) + "-drive")
		shell.interface._toggle_tools()
		await process_frame
		var tool_panel: Control = shell.interface.tray_card
		for pedal in controls._pedal_rects:
			if tool_panel.get_global_rect().intersects(pedal):
				push_error("Expanded tools overlap touch pedals")
				quit(1)
				return
		shell.interface._toggle_tools()
	print("MOBILE_LAYOUT_OK")
	quit()

func _save(image: Image, name: String) -> void:
	var path := OS.get_environment("RUNNER_TEMP").path_join("mobile-" + name + ".jpg")
	if image.save_jpg(path, 0.85) != OK:
		push_error("Could not write the viewport capture")
	print("MOBILE_VIEWPORT ", name, " ", image.get_size())
