class_name TerrainMath
extends RefCounted
## Shared metre-based world contract for rendering, wheels, streaming and the map.
## Both regions occupy 2 km x 4 km; the expedition and three loops use real distances.
const MIN_X: float = -1000.0
const MAX_X: float = 1000.0
const MIN_Z: float = -200.0
const MAX_Z: float = 3800.0
const FINISH_Z: float = 3300.0
const LAKE_X: float = -330.0
const LAKE_Z: float = 900.0
const LAKE_RADIUS: float = 105.0
const LAKE_WATER_Y: float = 12.0
const BRANCHES: Array = [
	{"start": 450.0, "end": 1100.0, "offset": -260.0, "name": "湖畔支线"},
	{"start": 1350.0, "end": 2100.0, "offset": 330.0, "name": "岩脊支线"},
	{"start": 2350.0, "end": 3050.0, "offset": -350.0, "name": "高山支线"},
]

static func route_x(z: float) -> float:
	return sin(z / 240.0) * 105.0 + sin(z / 630.0) * 150.0

static func _route_slope(z: float) -> float:
	return cos(z / 240.0) * (105.0 / 240.0) + cos(z / 630.0) * (150.0 / 630.0)

static func heading_at(z: float) -> float:
	return atan(_route_slope(z))

static func branch_routes() -> Array:
	return BRANCHES.duplicate(true)

static func branch_x(index: int, z: float) -> float:
	if index < 0 or index >= BRANCHES.size():
		return route_x(z)
	var branch: Dictionary = BRANCHES[index]
	if z < branch.start or z > branch.end:
		return route_x(z)
	var t: float = (z - branch.start) / (branch.end - branch.start)
	var wave: float = sin(PI * t)
	return route_x(z) + branch.offset * wave * wave

static func _branch_slope(index: int, z: float) -> float:
	var branch: Dictionary = BRANCHES[index]
	var length: float = branch.end - branch.start
	var t: float = (z - branch.start) / length
	return _route_slope(z) + branch.offset * PI / length * sin(TAU * t)

static func road_distance(x: float, z: float) -> float:
	# Local perpendicular distance keeps road shoulders consistent on diagonal loops.
	var slope: float = _route_slope(z)
	var nearest: float = absf(x - route_x(z)) / sqrt(1.0 + slope * slope)
	for i: int in range(BRANCHES.size()):
		var branch: Dictionary = BRANCHES[i]
		if z >= branch.start and z <= branch.end:
			var branch_slope: float = _branch_slope(i, z)
			nearest = minf(nearest, absf(x - branch_x(i, z)) / sqrt(1.0 + branch_slope * branch_slope))
	return nearest

static func river_x(z: float) -> float:
	return route_x(z) - 125.0 - 50.0 * sin(z / 280.0)

static func _smooth(a: float, b: float, x: float) -> float:
	var t: float = clampf((x - a) / (b - a), 0.0, 1.0)
	return t * t * (3.0 - 2.0 * t)

static func height_at(x: float, z: float, region: String = "forest") -> float:
	# Broad, climbable grades. All connected roads share this longitudinal profile.
	var road: float = 2.4 + z * 0.012 + sin(z / 210.0) * 5.0
	road += 18.0 * exp(-pow((z - 1500.0) / 310.0, 2.0))
	road += 45.0 * exp(-pow((z - 2760.0) / 480.0, 2.0))
	road -= 8.0 * exp(-pow((z - 2050.0) / 220.0, 2.0))
	if region == "snow":
		road += 35.0 * exp(-pow((z - 1480.0) / 320.0, 2.0))
		road += 25.0 * exp(-pow((z - 3100.0) / 390.0, 2.0))
	var offroad: float = sin(x * 0.009 + z * 0.003) * 18.0 + cos(z * 0.012 - x * 0.004) * 12.0
	offroad += 94.0 * exp(-pow((x + 650.0) / 240.0, 2.0) - pow((z - 1300.0) / 500.0, 2.0))
	offroad += 128.0 * exp(-pow((x - 680.0) / 270.0, 2.0) - pow((z - 2400.0) / 650.0, 2.0))
	var distance: float = road_distance(x, z)
	var shoulder: float = _smooth(4.0, 42.0, distance)
	var h: float = road + offroad * shoulder
	# Small tyre-scale detail articulates the wheels without roughening the starter road.
	var ripple: float = lerpf(0.035, 0.11, shoulder)
	h += ripple * sin(z * 0.9) * sin(x * 0.55) * _smooth(0.0, 160.0, maxf(0.0, z))
	var lake_distance: float = Vector2(x - LAKE_X, z - LAKE_Z).length()
	if lake_distance < 140.0:
		var lake_bed: float = LAKE_WATER_Y - 0.1 if region == "snow" else LAKE_WATER_Y - 4.0 + sin(x * 0.025) * 0.15
		h = lerpf(lake_bed, h, _smooth(LAKE_RADIUS, 140.0, lake_distance))
	# A broad dry river valley lies west of the main road, with gentle side banks.
	if z > 1650.0 and z < 2250.0:
		var valley_window: float = _smooth(1650.0, 1740.0, z) * (1.0 - _smooth(2160.0, 2250.0, z))
		h -= 14.0 * exp(-pow((x - river_x(z)) / 55.0, 2.0)) * valley_window * shoulder
	return h

static func surface_at(x: float, z: float, region: String = "forest") -> String:
	var lake_distance: float = Vector2(x - LAKE_X, z - LAKE_Z).length()
	var distance: float = road_distance(x, z)
	var wet_section: bool = (z > 450.0 and z < 650.0) or (z > 1780.0 and z < 1960.0)
	if region == "snow":
		if lake_distance < LAKE_RADIUS + 2.0 or (distance < 6.2 and wet_section):
			return "ice"
		return "snow"
	if lake_distance < LAKE_RADIUS + 12.0 and height_at(x, z) < LAKE_WATER_Y:
		return "water"
	if distance < 6.2 and wet_section:
		return "mud"
	if distance < 5.2:
		if (z > 1350.0 and z < 1620.0) or (z > 2600.0 and z < 2850.0):
			return "rock"
		return "trail"
	if (x > 470.0 and z > 1880.0 and z < 2820.0) or (x < -480.0 and z > 850.0 and z < 1800.0):
		return "rock"
	if z > 1700.0 and z < 2200.0 and absf(x - river_x(z)) < 18.0:
		return "mud"
	return "grass"

static func checkpoints() -> Array:
	return [
		{"x": route_x(700.0), "z": 700.0, "name": "松林营地"},
		{"x": route_x(1500.0), "z": 1500.0, "name": "云杉山口"},
		{"x": route_x(2400.0), "z": 2400.0, "name": "风息草甸"},
		{"x": route_x(3300.0), "z": 3300.0, "name": "山顶观景台"},
	]

static func repair_sites() -> Array:
	var sites: Array = []
	var names: Array = ["松林维修站", "山口维修站", "河谷维修站", "山巅维修站"]
	var points: Array = checkpoints()
	for i: int in range(points.size()):
		sites.append({"x": points[i].x + 10.0, "z": points[i].z, "name": names[i]})
	for i: int in range(BRANCHES.size()):
		var z: float = (BRANCHES[i].start + BRANCHES[i].end) * 0.5
		sites.append({"x": branch_x(i, z) + 10.0, "z": z, "name": BRANCHES[i].name + "小屋"})
	return sites

static func area_name(x: float, z: float, region: String = "forest") -> String:
	for i: int in range(BRANCHES.size()):
		var branch: Dictionary = BRANCHES[i]
		if z > branch.start and z < branch.end:
			var center: float = branch_x(i, z)
			if absf(center - route_x(z)) > 20.0 and absf(x - center) < 18.0:
				return branch.name
	var section: int = 0 if z < 700.0 else 1 if z < 1500.0 else 2 if z < 2400.0 else 3
	var names: Array = ["冰川前哨", "冰岩山口", "雪谷营地", "珠峰雪线"] if region == "snow" else ["松风林地", "云杉山口", "河谷营地", "高山草甸"]
	return names[section]
