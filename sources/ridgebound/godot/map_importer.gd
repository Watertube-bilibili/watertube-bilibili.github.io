extends RefCounted
## Decode data-only map ZIPs. Both Web and desktop call load_zip() on a local file.

const BoundedZip = preload("res://bounded_map_zip.gd")
const MAX_GRID: int = 4096
const MAX_MAP_METRES: float = 65536.0
const MAX_MANIFEST: int = 512 * 1024
const MAX_SCENE_METADATA: int = 16 * 1024 * 1024
const MAX_OBJECT_FILE: int = 2 * 1024 * 1024
const SURFACES: Array[String] = ["grass", "trail", "mud", "rock", "water", "snow", "ice"]

static func _error(message: String) -> Dictionary:
	return {"ok": false, "error": message}

static func _number(value: Variant, minimum: float, maximum: float) -> bool:
	return (value is float or value is int) and is_finite(float(value)) and float(value) >= minimum and float(value) <= maximum

static func _size(value: Variant) -> bool:
	return _number(value, 2.0, float(MAX_GRID)) and floorf(float(value)) == float(value)

static func _label(value: Variant, fallback: String) -> String:
	if not value is String:
		return fallback
	var label: String = value.strip_edges().replace("\r", " ").replace("\n", " ").substr(0, 80)
	return fallback if label.is_empty() else label

static func _json(zip: BoundedZip, key: String, limit: int) -> Variant:
	var bytes: PackedByteArray = zip.read_entry(key, limit)
	return JSON.parse_string(bytes.get_string_from_utf8()) if not bytes.is_empty() else null

static func _world_rect(width: int, depth: int, spacing: float, beam: bool) -> Rect2:
	var border: int = 0 if beam else 1
	var size: Vector2 = Vector2((width - border) * spacing, (depth - border) * spacing)
	return Rect2(-size * 0.5, size)

static func _inside(bounds: Rect2, x: float, z: float, inset: float = 0.0) -> bool:
	return bounds.grow(-inset).has_point(Vector2(x, z))

static func _summary(data: Dictionary, name: String, source: String, warnings: String) -> Dictionary:
	var area: Rect2 = data.bounds
	return {
		"name": name, "source": source, "warnings": warnings,
		"width": area.size.x, "depth": area.size.y, "minHeight": data.base,
		"bounds": {"minX": area.position.x, "maxX": area.end.x, "minZ": area.position.y, "maxZ": area.end.y},
	}

static func _success(data: Dictionary, name: String, source: String, warnings: String = "") -> Dictionary:
	data.summary = _summary(data, name, source, warnings)
	return {"ok": true, "data": data, "summary": data.summary}

static func _grid(width: int, depth: int, spacing: float, base: float, height_scale: float, bytes: PackedByteArray, beam: bool) -> Dictionary:
	return {
		"width": width, "depth": depth, "spacing": spacing, "base": base, "height_scale": height_scale,
		"bytes": bytes, "height_offset": 5 if beam else 0, "layer_offset": 5 + width * depth * 2 if beam else -1,
		"bounds": _world_rect(width, depth, spacing, beam),
		"flip_x": beam, "beam": beam, "surface": "grass", "materials": [], "props": [], "spawn": Vector3.ZERO,
	}

static func _extent_ok(area: Rect2) -> bool:
	return area.size.x >= 32.0 and area.size.y >= 32.0 and area.size.x <= MAX_MAP_METRES and area.size.y <= MAX_MAP_METRES

static func _sample(data: Dictionary, x: int, z: int) -> float:
	var bytes: PackedByteArray = data.bytes
	return float(bytes.decode_u16(int(data.height_offset) + (z * int(data.width) + x) * 2))

static func grid_xy(data: Dictionary, x: float, z: float) -> Vector2:
	var area: Rect2 = data.bounds
	var step: float = data.spacing
	var column: float = (area.end.x - x) / step if bool(data.flip_x) else (x - area.position.x) / step
	return Vector2(clampf(column, 0.0, float(data.width) - 1.0), clampf((z - area.position.y) / step, 0.0, float(data.depth) - 1.0))

static func height_at(data: Dictionary, x: float, z: float) -> float:
	var uv: Vector2 = grid_xy(data, x, z)
	var col: int = floori(uv.x)
	var row: int = floori(uv.y)
	var right: int = mini(col + 1, int(data.width) - 1)
	var ahead: int = mini(row + 1, int(data.depth) - 1)
	var near_row: float = lerpf(_sample(data, col, row), _sample(data, right, row), uv.x - float(col))
	var far_row: float = lerpf(_sample(data, col, ahead), _sample(data, right, ahead), uv.x - float(col))
	return float(data.base) + lerpf(near_row, far_row, uv.y - float(row)) * float(data.height_scale)

static func surface_at(data: Dictionary, x: float, z: float) -> String:
	var offset: int = data.layer_offset
	if offset < 0:
		return data.surface
	var point: Vector2 = grid_xy(data, x, z)
	var bytes: PackedByteArray = data.bytes
	var index: int = bytes[offset + floori(point.y) * int(data.width) + floori(point.x)]
	var materials: Array = data.materials
	return str(materials[index]) if index < materials.size() else "grass"

static func load_zip(path: String) -> Dictionary:
	var zip := BoundedZip.new()
	if not zip.open(path):
		return _error(zip.error)
	if zip.entries.has("ridgebound-map.json"):
		return _ridgebound(zip)
	return _beamng(zip)

static func _ridgebound(zip: BoundedZip) -> Dictionary:
	var parsed: Variant = _json(zip, "ridgebound-map.json", MAX_MANIFEST)
	if not parsed is Dictionary or parsed.get("version", 0) != 1:
		return _error("ridgebound-map.json 缺失、损坏，或版本不是 1。")
	var manifest: Dictionary = parsed
	if not _size(manifest.get("width")) or not _size(manifest.get("depth")):
		return _error("自定义地图网格宽、高必须是 2 到 4096 的整数。")
	var width: int = int(manifest.width)
	var depth: int = int(manifest.depth)
	var spacing: Variant = manifest.get("spacing", 2.0)
	var base: Variant = manifest.get("baseHeight", 0.0)
	var height_scale: Variant = manifest.get("heightScale", 0.01)
	if manifest.has("maxHeight") and not manifest.has("heightScale"):
		if not _number(manifest.maxHeight, 0.001, 20000.0):
			return _error("maxHeight 必须在 0.001 到 20000 米之间。")
		height_scale = float(manifest.maxHeight) / 65535.0
	if not _number(spacing, 0.5, 32.0) or not _number(base, -10000.0, 10000.0) or not _number(height_scale, 0.00000001, 20000.0 / 65535.0):
		return _error("自定义地图的采样间距、基准高度或高度比例无效。")
	var bounds: Rect2 = _world_rect(width, depth, float(spacing), false)
	if not _extent_ok(bounds):
		return _error("自定义地图每一边必须在 32 到 65536 米之间。")
	var filename: Variant = manifest.get("heightFile", "height.u16")
	if not filename is String or not BoundedZip.safe_path(filename) or not filename.to_lower().ends_with(".u16"):
		return _error("heightFile 必须指向 ZIP 内的 .u16 高度数据文件。")
	var samples: int = width * depth * 2
	var raw: PackedByteArray = zip.read_entry(filename.to_lower(), samples)
	if raw.size() != samples:
		return _error("高度数据文件损坏，或字节数与网格尺寸不符。")
	var data: Dictionary = _grid(width, depth, float(spacing), float(base), float(height_scale), raw, false)
	var surface: Variant = manifest.get("surface", "grass")
	if not surface is String or surface not in SURFACES:
		return _error("地图 surface 类型不受支持。")
	data.surface = surface
	var spawn: Variant = manifest.get("spawn", {})
	if not spawn is Dictionary:
		return _error("spawn 必须是包含 x、z、yawDegrees 的对象。")
	var coordinates: Dictionary = spawn
	var x: Variant = coordinates.get("x", 0.0)
	var z: Variant = coordinates.get("z", 0.0)
	var yaw: Variant = coordinates.get("yawDegrees", 0.0)
	if not _number(x, -MAX_MAP_METRES, MAX_MAP_METRES) or not _number(z, -MAX_MAP_METRES, MAX_MAP_METRES) or not _number(yaw, -360.0, 360.0):
		return _error("出生点坐标或朝向无效。")
	if not _inside(bounds, float(x), float(z), 4.0):
		return _error("出生点必须在地图边缘向内至少 4 米。")
	data.spawn = Vector3(float(x), deg_to_rad(float(yaw)), float(z))
	var props: Variant = manifest.get("props", [])
	if not props is Array or props.size() > 2048:
		return _error("props 必须是至多含 2048 个长方体障碍的列表。")
	var tile_counts: Dictionary = {}
	for prop: Variant in props:
		var object: Dictionary = _box_data(data, prop)
		if object.is_empty():
			return _error("障碍物坐标或尺寸无效，或与出生点重叠。")
		var key: Vector2i = Vector2i(floori(float(object.x) / 16.0), floori(float(object.z) / 16.0))
		var tile_count: int = int(tile_counts.get(key, 0)) + 1
		if tile_count > 64:
			return _error("同一个 16 米地图区块内最多放 64 个障碍物。")
		tile_counts[key] = tile_count
		data.props.append(object)
	return _success(data, _label(manifest.get("name"), "自定义地图"), "Ridgebound ZIP")

static func _box_data(data: Dictionary, raw: Variant) -> Dictionary:
	if not raw is Dictionary or raw.get("type") != "box":
		return {}
	var p: Dictionary = raw
	for key: String in ["x", "z"]:
		if not _number(p.get(key), -MAX_MAP_METRES, MAX_MAP_METRES):
			return {}
	for key: String in ["width", "height", "depth"]:
		if not _number(p.get(key), 0.1, 16.0):
			return {}
	var yaw: Variant = p.get("yawDegrees", 0.0)
	var offset: Variant = p.get("bottomOffset", 0.0)
	if not _number(yaw, -360.0, 360.0) or not _number(offset, -16.0, 32.0):
		return {}
	var half: Vector3 = Vector3(float(p.width), float(p.height), float(p.depth)) * 0.5
	var r: float = Vector2(half.x, half.z).length()
	var x: float = p.x
	var z: float = p.z
	var y: float = height_at(data, x, z) + float(offset) + half.y
	if not _inside(data.bounds, x, z, r):
		return {}
	var spawn: Vector3 = data.spawn
	if Vector2(x - spawn.x, z - spawn.z).length() < r + 4.0:
		return {}
	return {"kind": "box", "x": x, "y": y, "z": z, "half": half, "yaw": deg_to_rad(float(yaw)), "r": r}

static func _beamng(zip: BoundedZip) -> Dictionary:
	var levels: Dictionary = {}
	for key: String in zip.entries:
		if not key.begins_with("levels/") or not key.ends_with("items.level.json"):
			continue
		var parts: PackedStringArray = key.split("/", false)
		if parts.size() >= 3 and parts[-1] == "items.level.json":
			levels[parts[1]] = true
	if levels.size() != 1:
		return _error("ZIP 根目录需要 ridgebound-map.json，或只含一个 levels/<地图>/items.level.json 地图目录。")
	var level: String = levels.keys()[0]
	var prefix: String = "levels/" + level + "/"
	var scene: Dictionary = _beam_scene(zip, prefix)
	if not bool(scene.get("ok", false)):
		return scene
	var terrain: Dictionary = scene.terrain
	var ref: Variant = terrain.get("terrainFile")
	if not ref is String:
		return _error("BeamNG TerrainBlock 缺少 terrainFile 路径。")
	var clean: String = ref.trim_prefix("/").to_lower()
	if not BoundedZip.safe_path(clean) or not clean.ends_with(".ter"):
		return _error("BeamNG 地形文件路径无效。")
	if not clean.begins_with(prefix):
		if clean.begins_with("levels/"):
			return _error("BeamNG 地形引用位于另一个地图。")
		clean = prefix + clean
	var spacing: Variant = terrain.get("squareSize")
	var height_range: Variant = terrain.get("maxHeight")
	var position: Variant = terrain.get("position")
	if not _number(spacing, 0.5, 32.0) or not _number(height_range, 0.001, 20000.0) or not _vec3(position):
		return _error("BeamNG 地形的 squareSize、maxHeight 或 position 无效。")
	var matrix: Variant = terrain.get("rotationMatrix")
	if matrix != null and not _identity(matrix):
		return _error("暂时仅支持没有旋转的 BeamNG TerrainBlock。")
	var raw: PackedByteArray = zip.read_entry(clean, MAX_GRID * MAX_GRID * 3 + 65536)
	if raw.size() < 9 or raw[0] != 9:
		return _error("只支持 BeamNG .ter v9 地形，或文件缺失、损坏。")
	var size: int = raw.decode_u32(1)
	if size < 2 or size > MAX_GRID:
		return _error("BeamNG 高度网格每边最多 4096 个采样。")
	if not _extent_ok(_world_rect(size, size, float(spacing), true)):
		return _error("BeamNG 地图每一边必须在 32 到 65536 米之间。")
	var materials_offset: int = 5 + size * size * 3
	if materials_offset + 4 > raw.size():
		return _error("BeamNG .ter 高度及地表数据长度不足。")
	var materials: Variant = _beam_materials(raw, materials_offset)
	if not materials is Array:
		return _error("BeamNG .ter 材质列表截断或不符合 v9 格式。")
	var data: Dictionary = _grid(size, size, float(spacing), float(position[2]), float(height_range) / 65536.0, raw, true)
	data.materials = materials
	var info: Variant = _json(zip, prefix + "info.json", MAX_MANIFEST)
	if not info is Dictionary:
		info = {}
	data.spawn = _beam_spawn(scene.spawns, info, position, data)
	var name: String = _label(info.get("title", info.get("name")), level)
	return _success(data, name, "BeamNG .ter v9", "已导入地形、地表类型及可用出生点。BeamNG 的模型、道路物件、地洞、森林和脚本未导入。")

static func _vec3(value: Variant) -> bool:
	if not value is Array or value.size() != 3:
		return false
	for coordinate: Variant in value:
		if not _number(coordinate, -100000.0, 100000.0):
			return false
	return true

static func _identity(matrix: Variant) -> bool:
	if not matrix is Array or matrix.size() != 9:
		return false
	for i: int in range(9):
		if not _number(matrix[i], -1.01, 1.01) or absf(float(matrix[i]) - (1.0 if i % 4 == 0 else 0.0)) > 0.001:
			return false
	return true

static func _beam_scene(zip: BoundedZip, prefix: String) -> Dictionary:
	var terrain: Dictionary = {}
	var spawns: Array = []
	var bytes_total: int = 0
	for key: String in zip.entries:
		if not key.begins_with(prefix) or not key.ends_with("/items.level.json"):
			continue
		var entry_size: int = zip.entries[key].size
		if entry_size == 0:
			continue
		bytes_total += entry_size
		if entry_size > MAX_OBJECT_FILE or bytes_total > MAX_SCENE_METADATA:
			return _error("BeamNG 场景元数据过大。")
		var bytes: PackedByteArray = zip.read_entry(key, MAX_OBJECT_FILE)
		if bytes.is_empty():
			return _error("BeamNG 场景元数据损坏。")
		for line: String in bytes.get_string_from_utf8().split("\n", false):
			var line_text: String = line.strip_edges().trim_prefix("\ufeff")
			if line_text.is_empty():
				continue
			var object: Variant = JSON.parse_string(line_text)
			if not object is Dictionary:
				return _error("BeamNG items.level.json 不是逐行 JSON 对象。")
			match object.get("class"):
				"TerrainBlock":
					if not terrain.is_empty():
						return _error("暂不支持含多个 TerrainBlock 的 BeamNG 地图。")
					terrain = object
				"SpawnSphere":
					if spawns.size() < 128:
						spawns.append(object)
	if terrain.is_empty():
		return _error("BeamNG 地图没有可读的 TerrainBlock。")
	return {"ok": true, "terrain": terrain, "spawns": spawns}

static func _beam_materials(raw: PackedByteArray, offset: int) -> Variant:
	var count: int = raw.decode_u32(offset)
	if count > 254:
		return null
	var cursor: int = offset + 4
	var surfaces: Array = []
	for _i: int in range(count):
		if cursor >= raw.size():
			return null
		var length: int = raw[cursor]
		cursor += 1
		if cursor + length > raw.size():
			return null
		var name: String = raw.slice(cursor, cursor + length).get_string_from_utf8().to_lower()
		cursor += length
		surfaces.append(_material_surface(name))
	if cursor != raw.size():
		return null
	return surfaces

static func _material_surface(name: String) -> String:
	for key: String in ["ice", "snow", "water", "mud", "rock", "asphalt", "gravel", "dirt", "sand"]:
		if key in name:
			return "trail" if key in ["asphalt", "gravel", "dirt", "sand"] else key
	return "grass"

static func _beam_spawn(spawns: Array, info: Dictionary, origin: Array, data: Dictionary) -> Vector3:
	var preferred: String = str(info.get("defaultSpawnPointName", "spawns_default"))
	var choice: Vector3 = Vector3.ZERO
	var candidate_found: bool = false
	var area: Rect2 = data.bounds
	for entry: Dictionary in spawns:
		var pos: Variant = entry.get("position")
		if not _vec3(pos):
			continue
		var x: float = area.end.x - (float(pos[0]) - float(origin[0]))
		var z: float = area.position.y + (float(pos[1]) - float(origin[1]))
		if not _inside(area, x, z, 4.0):
			continue
		var yaw: float = 0.0
		var rotation: Variant = entry.get("rotationMatrix")
		if rotation is Array and rotation.size() == 9 and _number(rotation[1], -1.01, 1.01) and _number(rotation[4], -1.01, 1.01):
			yaw = atan2(-float(rotation[1]), float(rotation[4]))
		if not candidate_found:
			choice = Vector3(x, yaw, z)
			candidate_found = true
		if str(entry.get("name")) == preferred:
			return Vector3(x, yaw, z)
	return choice
