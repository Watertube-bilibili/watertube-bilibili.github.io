extends SceneTree

const GAME := preload("res://main.tscn")
var drive: Node3D

func _initialize() -> void:
	_run.call_deferred()

func _pause_for_tiles() -> void:
	for i: int in range(82):
		await process_frame
		if i > 16 and int(drive.chunks.get_stats().propsChunks) > 12:
			break
	for i: int in range(10):
		await process_frame
	await RenderingServer.frame_post_draw

func _save(path: String) -> bool:
	var frame := root.get_texture().get_image()
	if frame == null or frame.is_empty():
		push_error("FAIL Capture is empty")
		return false
	var readings := PackedFloat32Array()
	for row: int in range(int(frame.get_height() * 0.45), int(frame.get_height() * 0.89), 3):
		for column: int in range(int(frame.get_width() * 0.22), int(frame.get_width() * 0.78), 3):
			readings.append(frame.get_pixel(column, row).get_luminance())
	readings.sort()
	print("ART_FRAME ", path, " size=", frame.get_size(), " middle=", readings[readings.size() / 2], " near_white=", readings[int(readings.size() * 0.99)])
	if path.ends_with("snow.png") and readings[int(readings.size() * 0.99)] > 0.985:
		push_error("FAIL Snow ground still clips in the test frame")
		return false
	return frame.save_png(path) == OK

func _run() -> void:
	var destination := OS.get_cmdline_user_args()[0]
	root.size = Vector2i(1024, 595)
	drive = GAME.instantiate()
	root.add_child(drive)
	drive.playing = true
	drive._command({"type": "quality", "profile": "quality"})
	await _pause_for_tiles()
	if not _save(destination.path_join("forest.png")):
		quit(1)
		return
	root.size = Vector2i(480, 810)
	await _pause_for_tiles()
	if not _save(destination.path_join("portrait.png")):
		quit(1)
		return
	root.size = Vector2i(1024, 595)
	drive._command({"type":"reset","region":"snow","playing":true})
	await _pause_for_tiles()
	if not _save(destination.path_join("snow.png")):
		quit(1)
		return
	print("ART_PREVIEW_OK")
	quit(0)
