class_name TerrainMath
extends RefCounted
## Shared deterministic terrain for rendering, wheels, surfaces and checkpoints.

static func route_x(z: float) -> float:
	return sin(z / 40.0) * 13.0 + sin(z / 95.0) * 19.0

static func heading_at(z: float) -> float:
	return atan(route_x(z + 0.5) - route_x(z - 0.5))

static func _smooth(a: float, b: float, x: float) -> float:
	var t: float = clampf((x - a) / (b - a), 0.0, 1.0)
	return t * t * (3.0 - 2.0 * t)

static func height_at(x: float, z: float, region: String = "forest") -> float:
	var road: float = 2.4 + z * 0.026 + sin(z * 0.033) * 2.7 + 6.0 * exp(-pow((z - 145.0) / 32.0, 2.0)) + 9.0 * exp(-pow((z - 277.0) / 48.0, 2.0))
	var offroad: float = sin(x * 0.059 + z * 0.015) * 3.4 + cos(z * 0.044 - x * 0.02) * 2.2 + 21.0 * exp(-pow((x + 73.0) / 32.0, 2.0) - pow((z - 222.0) / 54.0, 2.0)) + 26.0 * exp(-pow((x - 86.0) / 37.0, 2.0) - pow((z - 150.0) / 61.0, 2.0))
	var h: float = road + offroad * _smooth(3.5, 23.0, absf(x - route_x(z))) + 0.09 * sin(z * 1.3) * sin(x * 0.7)
	if region == "snow":
		h += 7.5 * exp(-pow((z - 145.0) / 31.0, 2.0))
	var lake_distance: float = Vector2(x + 55.0, z - 100.0).length()
	if lake_distance < 32.0:
		var lake_bed: float = 0.7 if region == "snow" else -2.0 + sin(x * 0.1) * 0.08
		h = lerpf(lake_bed, h, _smooth(21.0, 32.0, lake_distance))
	return h

static func surface_at(x: float, z: float, region: String = "forest") -> String:
	var lake_distance: float = Vector2(x + 55.0, z - 100.0).length()
	var offroad: float = absf(x - route_x(z))
	var wet_section: bool = (z > 45.0 and z < 78.0) or (z > 178.0 and z < 207.0)
	if region == "snow":
		if lake_distance < 24.0 or (offroad < 6.2 and wet_section):
			return "ice"
		return "snow"
	if lake_distance < 24.0 and height_at(x, z) < 0.8:
		return "water"
	if offroad < 6.2 and wet_section:
		return "mud"
	if offroad < 5.2:
		return "trail"
	if (x > 57.0 and z > 107.0 and z < 197.0) or (x < -51.0 and z > 183.0 and z < 265.0):
		return "rock"
	return "grass"

static func checkpoints() -> Array:
	return [
		{"x": route_x(70.0), "z": 70.0, "name": "松林营地"},
		{"x": route_x(150.0), "z": 150.0, "name": "云杉山口"},
		{"x": route_x(240.0), "z": 240.0, "name": "风息草甸"},
		{"x": route_x(330.0), "z": 330.0, "name": "山顶观景台"},
	]
