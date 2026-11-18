class_name TerrainMath
extends RefCounted
## Deterministic world shared by the renderer, wheel contacts and expedition map.
## +Z runs north, +X runs west; coordinates and heights are in metres.

const MIN_X: float = -8000.0
const MAX_X: float = 8000.0
const MIN_Z: float = -2000.0
const MAX_Z: float = 22000.0
const FINISH_Z: float = 20600.0
const LAKE_X: float = -1700.0
const LAKE_Z: float = 1700.0
const LAKE_RADIUS: float = 395.0
const LAKE_WATER_Y: float = -70.0
const RIVER_START: float = 7300.0
const RIVER_END: float = 10400.0

const CHECKPOINT_Z: Array[float] = [700.0, 6200.0, 13200.0, FINISH_Z]
const CHECKPOINT_NAMES: Array[String] = ["松林营地", "云杉山口", "风息草甸", "山顶观景台"]
const BRANCHES: Array = [
	{"start": 320.0, "end": 2050.0, "offset": -1250.0, "name": "湖畔环线"},
	{"start": 2950.0, "end": 6700.0, "offset": 4200.0, "name": "红岩高原"},
	{"start": 6500.0, "end": 10500.0, "offset": -5200.0, "name": "苔原湿地"},
	{"start": 10500.0, "end": 14300.0, "offset": -5200.0, "name": "风蚀台地"},
	{"start": 10700.0, "end": 14300.0, "offset": 6500.0, "name": "云岭横道"},
	{"start": 14500.0, "end": 17800.0, "offset": 6500.0, "name": "峡谷环线"},
	{"start": 17700.0, "end": 21500.0, "offset": -6300.0, "name": "冰川北线"},
]
const LAKES: Array = [
	{"x": LAKE_X, "z": LAKE_Z, "radius": LAKE_RADIUS, "y": LAKE_WATER_Y, "name": "镜湖"},
	{"x": -5450.0, "z": 8800.0, "radius": 530.0, "y": -2.0, "name": "芦苇湖"},
	{"x": 5700.0, "z": 12900.0, "radius": 420.0, "y": 310.0, "name": "云镜湖"},
]
const SUMMITS: Array = [
	Vector4(-540.0, 430.0, 520.0, 74.0),
	Vector4(780.0, 1350.0, 690.0, 141.0),
	Vector4(5200.0, 4620.0, 1980.0, 340.0),
	Vector4(-2900.0, 11020.0, 2550.0, 270.0),
	Vector4(4300.0, 14780.0, 1880.0, 405.0),
	Vector4(-3650.0, 19650.0, 2540.0, 577.0),
]
const SECTIONS: Array[float] = [700.0, 3300.0, 7200.0, 11200.0, 15400.0, 18300.0]
const FOREST_AREAS: Array[String] = ["松风林地", "镜湖谷", "红岩高原", "苔原湿地", "云岭台地", "断层峡谷", "山巅雪线"]
const SNOW_AREAS: Array[String] = ["冰川前哨", "冰镜湖", "冻岩山口", "冻土湿地", "白岭台地", "冰谷", "珠峰雪线"]

static func _smooth(a: float, b: float, x: float) -> float:
	var t: float = clampf((x - a) / (b - a), 0.0, 1.0)
	return t * t * (3.0 - 2.0 * t)

static func _starter_x(z: float) -> float:
	return sin(z / 240.0) * 105.0 + sin(z / 630.0) * 150.0

static func _expedition_x(z: float) -> float:
	return sin(z / 2550.0) * 2050.0 + sin(z / 4750.0) * 1100.0

static func route_x(z: float) -> float:
	if z <= 850.0:
		return _starter_x(z)
	if z >= 2600.0:
		return _expedition_x(z)
	return lerpf(_starter_x(z), _expedition_x(z), _smooth(850.0, 2600.0, z))

static func _route_slope(z: float) -> float:
	if z <= 850.0:
		return cos(z / 240.0) * (105.0 / 240.0) + cos(z / 630.0) * (150.0 / 630.0)
	if z >= 2600.0:
		return cos(z / 2550.0) * (2050.0 / 2550.0) + cos(z / 4750.0) * (1100.0 / 4750.0)
	return (route_x(z + 0.25) - route_x(z - 0.25)) / 0.5

static func heading_at(z: float) -> float:
	return atan(_route_slope(z))

static func branch_routes() -> Array:
	return BRANCHES.duplicate(true)

static func branch_x(index: int, z: float) -> float:
	var center: float = route_x(z)
	if index < 0 or index >= BRANCHES.size():
		return center
	var branch: Dictionary = BRANCHES[index]
	if z < branch.start or z > branch.end:
		return center
	var wave: float = sin(PI * (z - branch.start) / (branch.end - branch.start))
	return center + branch.offset * wave * wave

static func road_distance(x: float, z: float) -> float:
	# The local perpendicular distance preserves trail width along diagonal roads.
	var center: float = route_x(z)
	var slope: float = _route_slope(z)
	var nearest: float = absf(x - center) / sqrt(1.0 + slope * slope)
	for branch: Dictionary in BRANCHES:
		if z < branch.start or z > branch.end:
			continue
		var length: float = branch.end - branch.start
		var phase: float = PI * (z - branch.start) / length
		var wave: float = sin(phase)
		var branch_center: float = center + branch.offset * wave * wave
		var branch_slope: float = slope + branch.offset * PI / length * sin(2.0 * phase)
		var distance: float = absf(x - branch_center) / sqrt(1.0 + branch_slope * branch_slope)
		nearest = minf(nearest, distance)
	return nearest

static func river_x(z: float) -> float:
	return route_x(z) - 900.0 - 260.0 * sin(z / 480.0)

static func water_bodies() -> Array:
	return LAKES.duplicate(true)

static func _lake_index(x: float, z: float, margin: float) -> int:
	for i: int in range(LAKES.size()):
		var lake: Dictionary = LAKES[i]
		var radius: float = lake.radius + margin
		var dz: float = z - lake.z
		if absf(dz) > radius:
			continue
		var dx: float = x - lake.x
		if dx * dx + dz * dz < radius * radius:
			return i
	return -1

static func _road_elevation(x: float, z: float, snowy: bool) -> float:
	# Local hills remain approachable. Later sections use longer climbing grades and
	# a lateral ridge profile so branches do not all share the same elevation.
	var starter: float = 2.4 + z * 0.012 + sin(z / 210.0) * 5.0
	if z < 850.0:
		return starter
	var grade: float = 2.4 + z * 0.010 + 27.0 * sin(z / 1480.0)
	grade += 42.0 * sin(x / 2260.0) * _smooth(850.0, 4200.0, z)
	grade += 118.0 * _smooth(2700.0, 5700.0, z) * (1.0 - _smooth(6100.0, 8400.0, z))
	grade += 176.0 * _smooth(9400.0, 12700.0, z) * (1.0 - _smooth(13300.0, 15700.0, z))
	grade += (540.0 if snowy else 338.0) * _smooth(16200.0, FINISH_Z, z)
	return lerpf(starter, grade, _smooth(850.0, 2550.0, z))

static func height_at(x: float, z: float, region: String = "forest") -> float:
	var snowy: bool = region == "snow"
	var distance: float = road_distance(x, z)
	var grade: float = _road_elevation(x, z, snowy)
	# Most wheel samples are already on the smooth trail and need no distant relief.
	var ripple: float = sin(z * 0.9) * sin(x * 0.55) * _smooth(0.0, 160.0, z)
	if distance <= 5.0:
		return grade + ripple * 0.035
	var long_form: float = 52.0 * sin(x * 0.0013 + z * 0.00059)
	long_form += 38.0 * cos(z * 0.00177 - x * 0.00114)
	var hills: float = 18.0 * sin(x * 0.009 + z * 0.003) + 12.0 * cos(z * 0.012 - x * 0.004)
	var expansion: float = _smooth(400.0, 3200.0, maxf(z, absf(x)))
	var relief: float = long_form * lerpf(0.32, 1.0, expansion) + hills
	for summit: Vector4 in SUMMITS:
		var dz: float = (z - summit.y) / summit.z
		if absf(dz) > 2.8:
			continue
		var dx: float = (x - summit.x) / summit.z
		relief += summit.w * exp(-(dx * dx + dz * dz))
	if z > RIVER_START and z < RIVER_END:
		var valley: float = _smooth(RIVER_START, 7900.0, z) * (1.0 - _smooth(9850.0, RIVER_END, z))
		var bank: float = (x - river_x(z)) / 255.0
		relief -= 75.0 * exp(-bank * bank) * valley
	# The shoulder widens with relief so carved routes join tall hills smoothly.
	var shoulder: float = _smooth(5.0, 69.0 + absf(relief) * 2.9, distance)
	var height: float = grade + relief * shoulder + ripple * lerpf(0.035, 0.11, shoulder)
	var index: int = _lake_index(x, z, 300.0)
	if index >= 0:
		var lake: Dictionary = LAKES[index]
		var lake_distance: float = Vector2(x - lake.x, z - lake.z).length()
		var shore: float = float(lake.y) - 0.08
		if lake_distance < lake.radius:
			var depth: float = 0.0 if snowy else 2.2
			return shore - depth * (1.0 - _smooth(lake.radius - 65.0, lake.radius, lake_distance))
		height = lerpf(shore, height, _smooth(lake.radius, lake.radius + 300.0, lake_distance))
		# The terrain rises just outside the water mesh, even on an existing low bank.
		var rim: float = 0.3 * _smooth(lake.radius, lake.radius + 15.0, lake_distance)
		rim *= 1.0 - _smooth(lake.radius + 30.0, lake.radius + 100.0, lake_distance)
		height += rim
	return height

static func _wet_trail(z: float) -> bool:
	return (z > 450.0 and z < 640.0) or (z > 7750.0 and z < 8030.0) or (z > 15900.0 and z < 16160.0)

static func biome_at(x: float, z: float, region: String = "forest") -> String:
	if region == "snow":
		return "icefield" if z > 17700.0 else "alpine"
	if z > 18300.0:
		return "alpine"
	if z > 7100.0 and z < 10900.0 and x < route_x(z) - 230.0:
		return "marsh"
	if (z > 3200.0 and z < 7000.0 and x > route_x(z) + 300.0) or (z > 11200.0 and z < 17600.0 and absf(x) > 2150.0):
		return "stone"
	return "pine"

static func surface_at(x: float, z: float, region: String = "forest") -> String:
	var lake: int = _lake_index(x, z, 0.0)
	var distance: float = road_distance(x, z)
	if region == "snow":
		if lake >= 0 or (distance < 6.2 and _wet_trail(z)) or (z > 18700.0 and sin(z / 145.0) + 0.35 * cos(x / 37.0) > 0.6):
			return "ice"
		return "snow"
	if lake >= 0:
		return "water"
	if distance < 6.2 and _wet_trail(z):
		return "mud"
	if distance < 5.2:
		if (z > 4640.0 and z < 5180.0) or (z > 15100.0 and z < 15750.0):
			return "rock"
		return "trail"
	if z > RIVER_START and z < RIVER_END and absf(x - river_x(z)) < 76.0:
		return "mud"
	var biome: String = biome_at(x, z)
	return "rock" if biome == "stone" or biome == "alpine" else "grass"

static func checkpoints() -> Array:
	var result: Array = []
	for i: int in range(CHECKPOINT_Z.size()):
		var z: float = CHECKPOINT_Z[i]
		result.append({"x": route_x(z), "z": z, "name": CHECKPOINT_NAMES[i]})
	return result

static func repair_sites() -> Array:
	var sites: Array = []
	var names: Array[String] = ["松林维修站", "山口维修站", "河谷维修站", "山巅维修站"]
	for i: int in range(CHECKPOINT_Z.size()):
		var z: float = CHECKPOINT_Z[i]
		sites.append({"x": route_x(z) + 10.0, "z": z, "name": names[i]})
	for i: int in range(BRANCHES.size()):
		var branch: Dictionary = BRANCHES[i]
		var z: float = (branch.start + branch.end) * 0.5
		sites.append({"x": branch_x(i, z) + 10.0, "z": z, "name": branch.name + "小屋"})
	for hub: Array in [[3000.0, "岔口补给站"], [8800.0, "湿地补给站"], [16200.0, "峡口补给站"]]:
		sites.append({"x": route_x(hub[0]) + 10.0, "z": hub[0], "name": hub[1]})
	return sites

static func landmarks() -> Array:
	var points: Array = []
	for i: int in range(BRANCHES.size()):
		var branch: Dictionary = BRANCHES[i]
		var z: float = (branch.start + branch.end) * 0.5 + 70.0
		points.append({"x": branch_x(i, z) - 22.0, "z": z, "name": branch.name + "观景点", "kind": "lookout"})
	return points

static func area_name(x: float, z: float, region: String = "forest") -> String:
	var main: float = route_x(z)
	for i: int in range(BRANCHES.size()):
		var branch: Dictionary = BRANCHES[i]
		if z <= branch.start or z >= branch.end:
			continue
		var center: float = branch_x(i, z)
		if absf(center - main) > 160.0 and absf(x - center) < 180.0:
			return branch.name
	var section: int = 0
	while section < SECTIONS.size() and z >= SECTIONS[section]:
		section += 1
	return SNOW_AREAS[section] if region == "snow" else FOREST_AREAS[section]
