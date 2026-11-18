extends SceneTree
## Local generated archives for both supported formats. No game files needed.
const Importer = preload("res://map_importer.gd")
const Terrain = preload("res://terrain_math.gd")

var _checks: int = 0
var _failures: int = 0
var _paths: Array[String] = []

func _check(result: bool, note: String) -> void:
	_checks += 1
	if result:
		print("PASS ", note)
	else:
		_failures += 1
		print("FAIL ", note)

func _zip(files: Dictionary, suffix: String) -> String:
	var path: String = "user://ridgebound-map-test-%s-%s.zip" % [Time.get_ticks_usec(), suffix]
	var archive := ZIPPacker.new()
	if archive.open(path) != OK:
		return ""
	_paths.append(path)
	for key: String in files:
		if archive.start_file(key) != OK or archive.write_file(files[key]) != OK or archive.close_file() != OK:
			archive.close()
			return ""
	archive.close()
	return path

func _replace_zip_data(bytes: PackedByteArray, suffix: String) -> String:
	var path: String = "user://ridgebound-map-test-%s-%s.zip" % [Time.get_ticks_usec(), suffix]
	var output := FileAccess.open(path, FileAccess.WRITE)
	if output == null:
		return ""
	output.store_buffer(bytes)
	output.close()
	_paths.append(path)
	return path

func _ridge_fixture() -> void:
	var manifest: Dictionary = {
		"version": 1, "name": "Training ridge", "width": 65, "depth": 49, "spacing": 2.0,
		"heightScale": 0.02, "baseHeight": 10.0, "surface": "rock",
		"spawn": {"x": -20.0, "z": -6.0, "yawDegrees": 90.0},
		"props": [{"type": "box", "x": 2.0, "z": 4.0, "width": 3.0, "depth": 5.0, "height": 0.3, "yawDegrees": 30.0}],
	}
	var elevations := PackedByteArray()
	elevations.resize(int(manifest.width) * int(manifest.depth) * 2)
	for z: int in range(manifest.depth):
		for x: int in range(manifest.width):
			elevations.encode_u16((z * int(manifest.width) + x) * 2, x * 50 + z * 25)
	var header: PackedByteArray = JSON.stringify(manifest).to_utf8_buffer()
	var path: String = _zip({"ridgebound-map.json": header, "height.u16": elevations}, "ridgebound")
	var loaded: Dictionary = Importer.load_zip(path)
	_check(loaded.ok, "Ridgebound ZIP loads: " + str(loaded.get("error", "")))
	if not loaded.ok:
		return
	Terrain.install_custom(loaded.data)
	_check(Terrain.custom_summary().name == "Training ridge", "custom map name")
	_check(Terrain.bounds_for("custom") == Rect2(-64, -48, 128, 96), "custom real map dimensions")
	_check(Terrain.spawn_for("custom").is_equal_approx(Vector3(-20, PI / 2, -6)), "custom spawn position and orientation")
	_check(is_equal_approx(Terrain.height_at(0, 0, "custom"), 54.0), "raw U16 height scale")
	_check(is_equal_approx(Terrain.height_at(1, 1, "custom"), 54.75), "continuous interpolated height")
	_check(is_equal_approx(Terrain.height_at(-900, -48, "custom"), 10.0), "boundary support clamps sampling to edge")
	_check(Terrain.surface_at(0, 0, "custom") == "rock", "custom surface")
	var shapes: Array = Terrain.custom_props_at(Vector2i.ZERO)
	_check(shapes.size() == 1 and (shapes[0].half as Vector3).is_equal_approx(Vector3(1.5, 0.15, 2.5)), "visible solid prop descriptor")
	_check(Terrain.checkpoints("custom").is_empty() and Terrain.checkpoints("forest").size() == 4, "custom exploration does not affect built-in route")
	_check(not Importer.load_zip(_zip({"ridgebound-map.json": header, "height.u16": elevations.slice(0, 100)}, "truncated")).ok, "truncated raw samples rejected")
	_check(not Importer.load_zip(_zip({"../ridgebound-map.json": header, "height.u16": elevations}, "unsafe")).ok, "parent archive path rejected")
	var corrupt: PackedByteArray = FileAccess.get_file_as_bytes(path)
	if corrupt.size() > 22:
		var directory: int = corrupt.decode_u32(corrupt.size() - 22 + 16)
		corrupt.encode_u32(directory + 24, (128 * 1024 * 1024))
		_check(not Importer.load_zip(_replace_zip_data(corrupt, "oversized-entry")).ok, "huge declared entry rejected before decoding")
	manifest.props[0].x = -20
	manifest.props[0].z = -6
	_check(not Importer.load_zip(_zip({"ridgebound-map.json": JSON.stringify(manifest).to_utf8_buffer(), "height.u16": elevations}, "unsafe-spawn")).ok, "props overlapping spawn rejected")

func _beam_fixture() -> void:
	const SIZE: int = 64
	var raw := PackedByteArray()
	raw.resize(5 + SIZE * SIZE * 3 + 4)
	raw[0] = 9
	raw.encode_u32(1, SIZE)
	var layer_offset: int = 5 + SIZE * SIZE * 2
	for z: int in range(SIZE):
		for x: int in range(SIZE):
			var index: int = z * SIZE + x
			raw.encode_u16(5 + index * 2, x * 128 + z * 64)
			raw[layer_offset + index] = 1 if x == 1 else 0
	raw.encode_u32(5 + SIZE * SIZE * 3, 2)
	for material: String in ["Traildirt", "BlackIce"]:
		raw.append(material.length())
		raw.append_array(material.to_utf8_buffer())
	var block: Dictionary = {
		"class": "TerrainBlock", "terrainFile": "/levels/sample/theTerrain.ter",
		"squareSize": 2.0, "maxHeight": 512.0, "position": [-128.0, -256.0, 15.0],
		"rotationMatrix": [1, 0, 0, 0, 1, 0, 0, 0, 1],
	}
	var spawn: Dictionary = {"class": "SpawnSphere", "name": "start", "position": [-74.0, -186.0, 17.0]}
	var objects: PackedByteArray = (JSON.stringify(block) + "\n" + JSON.stringify(spawn) + "\n").to_utf8_buffer()
	var files: Dictionary = {
		"levels/sample/info.json": '{"title":"Beam fixture","defaultSpawnPointName":"start"}'.to_utf8_buffer(),
		"levels/sample/main/MissionGroup/items.level.json": objects,
		"levels/sample/theTerrain.ter": raw,
		"levels/sample/ignored.lua": 'error("must never execute")'.to_utf8_buffer(),
	}
	var loaded: Dictionary = Importer.load_zip(_zip(files, "beam"))
	_check(loaded.ok, "BeamNG v9 terrain and child MissionGroup path loads: " + str(loaded.get("error", "")))
	if not loaded.ok:
		return
	Terrain.install_custom(loaded.data)
	_check(Terrain.custom_summary().name == "Beam fixture", "BeamNG info title")
	_check(Terrain.spawn_for("custom").is_equal_approx(Vector3(10, 0, 6)), "BeamNG terrain origin and SpawnSphere conversion")
	_check(is_equal_approx(Terrain.height_at(62, -64, "custom"), 16.0), "BeamNG x conversion and u16 scale")
	_check(is_equal_approx(Terrain.height_at(64, -62, "custom"), 15.5), "BeamNG row order and elevation origin")
	_check(Terrain.surface_at(62, -64, "custom") == "ice", "BeamNG surface read from binary material index")
	raw[0] = 8
	files["levels/sample/theTerrain.ter"] = raw
	_check(not Importer.load_zip(_zip(files, "legacy")).ok, "unsupported .ter version rejected with no map replacement")
	_check(Terrain.custom_summary().name == "Beam fixture", "invalid archive leaves last loaded map available")

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	_ridge_fixture()
	_beam_fixture()
	for path: String in _paths:
		DirAccess.remove_absolute(path)
	Terrain.install_custom({})
	print("MAP_IMPORT_CHECKS %d FAILURES %d" % [_checks, _failures])
	quit(_failures)
