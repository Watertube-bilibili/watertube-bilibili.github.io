extends SceneTree
## Verify the larger world contract and representative real-speed branch drives.
const Terrain = preload("res://terrain_math.gd")
const Physics = preload("res://physics.gd")
var physics = Physics.new()
var checks: int = 0
var failures: int = 0

func check(condition: bool, label: String) -> void:
	checks += 1
	if condition:
		print("PASS ", label)
	else:
		push_error("FAIL " + label)
		failures += 1

func _road_profile(index: int, start: float, end: float, region: String) -> Dictionary:
	var grade: float = 0.0
	var length: float = 0.0
	var min_x: float = INF
	var max_x: float = -INF
	var valid: bool = true
	var z: float = start
	while z < end:
		var x: float = Terrain.branch_x(index, z)
		var next_z: float = minf(z + 5.0, end)
		var next_x: float = Terrain.branch_x(index, next_z)
		var distance: float = Vector2(next_x - x, next_z - z).length()
		var height: float = Terrain.height_at(x, z, region)
		var next_height: float = Terrain.height_at(next_x, next_z, region)
		grade = maxf(grade, absf(next_height - height) / distance)
		length += distance
		min_x = minf(min_x, x)
		max_x = maxf(max_x, x)
		valid = valid and Terrain.road_distance(x, z) < 0.001 and Terrain.surface_at(x, z, region) != "water"
		z = next_z
	return {"grade": grade, "length": length, "min_x": min_x, "max_x": max_x, "valid": valid}

func _drive_branch_sample(index: int, start: float, goal: float, region: String) -> Dictionary:
	var car: Dictionary = physics.create_state(region, region == "snow")
	car.x = Terrain.branch_x(index, start)
	car.z = start
	car.yaw = atan2(Terrain.branch_x(index, start + 0.5) - Terrain.branch_x(index, start - 0.5), 1.0)
	car.lowGear = true
	physics.repair(car)
	for i: int in range(3600):
		if car.z >= goal:
			break
		var target: float = atan2(Terrain.branch_x(index, car.z + 5.0) - car.x, 5.0)
		var error: float = angle_difference(car.yaw, target)
		physics.step(car, {"throttle": 1.0, "steer": clampf(-error * 2.0, -1.0, 1.0)}, 0.1)
	return car

func _initialize() -> void:
	check((Terrain.MAX_X - Terrain.MIN_X) * (Terrain.MAX_Z - Terrain.MIN_Z) == 384000000.0, "each region has 384 square kilometres of driving bounds")
	var points: Array = Terrain.checkpoints()
	check(points.size() == 4 and points[0].z == 700.0 and points[1].z == 6200.0 and points[2].z == 13200.0 and points[3].z == 20600.0, "four existing checkpoint indices map to the new expedition")
	var finite_world: bool = true
	var minimum: float = INF
	var maximum: float = -INF
	for region: String in ["forest", "snow"]:
		for x: int in range(int(Terrain.MIN_X), int(Terrain.MAX_X) + 1, 200):
			for z: int in range(int(Terrain.MIN_Z), int(Terrain.MAX_Z) + 1, 200):
				var h: float = Terrain.height_at(float(x), float(z), region)
				finite_world = finite_world and is_finite(h)
				minimum = minf(minimum, h)
				maximum = maxf(maximum, h)
	check(finite_world and minimum > -500.0 and maximum - minimum > 1000.0, "large-area relief stays finite and above the visual underlay")
	for lake: Dictionary in Terrain.water_bodies():
		check(Terrain.surface_at(lake.x, lake.z) == "water" and Terrain.surface_at(lake.x, lake.z, "snow") == "ice", lake.name + " changes from water to ice between regions")
	check(Terrain.surface_at(Terrain.route_x(550.0), 550.0) == "mud" and Terrain.surface_at(Terrain.route_x(7900.0), 7900.0, "snow") == "ice", "wet sections reach both starter and far expedition districts")
	check(Terrain.surface_at(Terrain.route_x(4950.0), 4950.0) == "rock", "the red rock pass has a distinct surface")
	for region: String in ["forest", "snow"]:
		var main: Dictionary = _road_profile(-1, 0.0, Terrain.FINISH_Z, region)
		check(main.length > 23000.0 and main.length < 25000.0 and main.grade < 0.27 and main.valid, region + " main road has a continuous, climbable profile over 23 km")
	var branches: Array = Terrain.branch_routes()
	check(branches.size() == 7, "seven branch loops")
	var min_road_x: float = INF
	var max_road_x: float = -INF
	var combined_branch_length: float = 0.0
	for i: int in range(branches.size()):
		var branch: Dictionary = branches[i]
		check(is_equal_approx(Terrain.branch_x(i, branch.start), Terrain.route_x(branch.start)) and is_equal_approx(Terrain.branch_x(i, branch.end), Terrain.route_x(branch.end)), branch.name + " joins the main road at both ends")
		var start_slope: float = (Terrain.branch_x(i, branch.start + 0.01) - Terrain.branch_x(i, branch.start - 0.01)) / 0.02
		var end_slope: float = (Terrain.branch_x(i, branch.end + 0.01) - Terrain.branch_x(i, branch.end - 0.01)) / 0.02
		check(absf(start_slope - tan(Terrain.heading_at(branch.start))) < 0.001 and absf(end_slope - tan(Terrain.heading_at(branch.end))) < 0.001, branch.name + " has continuous junction headings")
		var forest: Dictionary = _road_profile(i, branch.start, branch.end, "forest")
		var snow: Dictionary = _road_profile(i, branch.start, branch.end, "snow")
		check(forest.valid and snow.valid and forest.grade < 0.27 and snow.grade < 0.27, branch.name + " stays climbable in both regions without underwater road")
		min_road_x = minf(min_road_x, forest.min_x)
		max_road_x = maxf(max_road_x, forest.max_x)
		combined_branch_length += forest.length
		var midpoint: float = (branch.start + branch.end) * 0.5
		var driver: Dictionary = _drive_branch_sample(i, midpoint - 65.0, midpoint + 65.0, "forest" if i % 2 == 0 else "snow")
		check(driver.z >= midpoint + 65.0 and Terrain.road_distance(driver.x, driver.z) < 2.0, branch.name + " is driveable in a far-side branch sample")
		check(driver.damage.body == 100.0 and driver.damage.tires == 100.0 and driver.damage.suspension == 100.0, branch.name + " sample causes no false damage")
	check(min_road_x > Terrain.MIN_X + 30.0 and min_road_x < -6000.0 and max_road_x > 6000.0 and max_road_x < Terrain.MAX_X - 30.0 and combined_branch_length > 77000.0, "the road network spans over 12 km laterally and 77 km of branches")
	var sites: Array = Terrain.repair_sites()
	var site_access: bool = sites.size() == 14
	for site: Dictionary in sites:
		site_access = site_access and Terrain.road_distance(site.x, site.z) <= 10.1 and Terrain.surface_at(site.x, site.z) != "water"
	check(site_access and Terrain.landmarks().size() == 7, "four checkpoint huts, seven branch huts and three main hubs stay beside a road")
	for i: int in range(points.size()):
		var restored: Dictionary = physics.create_state()
		restored.checkpoint = i + 1
		physics.recover(restored)
		check(restored.z > points[i].z and restored.z < points[i].z + 3.0, "saved checkpoint " + str(i + 1) + " restores beyond the matching new location")
	var far_driver: Dictionary = _drive_branch_sample(-1, 21320.0, 21345.0, "forest")
	check(far_driver.z >= 21345.0, "driving remains possible north of the final checkpoint")
	far_driver.x = Terrain.MAX_X - 0.1
	far_driver.yaw = PI * 0.5
	physics.repair(far_driver)
	far_driver.speed = 9.0
	physics.step(far_driver, {"throttle": 1.0}, 0.1)
	check(far_driver.x <= Terrain.MAX_X and far_driver.z <= Terrain.MAX_Z, "vehicle respects the shared expanded world bounds")
	print("WORLD_CHECKS ", checks, " FAILURES ", failures)
	quit(failures)
