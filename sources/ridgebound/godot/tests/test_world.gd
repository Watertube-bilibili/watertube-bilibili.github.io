extends SceneTree
## Expanded-world contracts and real-speed driving checks; no movement time scaling.
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

func _initialize() -> void:
	check((Terrain.MAX_X - Terrain.MIN_X) * (Terrain.MAX_Z - Terrain.MIN_Z) == 8000000.0, "each region has 8 square kilometres of driving bounds")
	var points: Array = Terrain.checkpoints()
	check(points.size() == 4 and points[0].z == 700.0 and points[1].z == 1500.0 and points[2].z == 2400.0 and points[3].z == 3300.0, "four existing checkpoint indices map to the expanded expedition")
	var finite_world: bool = true
	var minimum: float = INF
	var maximum: float = -INF
	for region: String in ["forest", "snow"]:
		for x: int in range(-1000, 1001, 80):
			for z: int in range(-200, 3801, 80):
				var h: float = Terrain.height_at(float(x), float(z), region)
				finite_world = finite_world and is_finite(h)
				minimum = minf(minimum, h)
				maximum = maxf(maximum, h)
	check(finite_world and maximum - minimum > 100.0, "whole world is finite with substantial mountain and valley relief")
	check(Terrain.surface_at(Terrain.LAKE_X, Terrain.LAKE_Z) == "water" and Terrain.surface_at(Terrain.LAKE_X, Terrain.LAKE_Z, "snow") == "ice", "large lake changes from water to ice between regions")
	check(Terrain.surface_at(Terrain.route_x(550.0), 550.0) == "mud" and Terrain.surface_at(Terrain.route_x(1850.0), 1850.0, "snow") == "ice", "wet sections reach the new expedition distances")
	check(Terrain.surface_at(Terrain.route_x(1450.0), 1450.0) == "rock", "mountain pass has a distinct rock surface")
	var branches: Array = Terrain.branch_routes()
	var road_extent: bool = true
	for i: int in range(branches.size()):
		var branch: Dictionary = branches[i]
		check(is_equal_approx(Terrain.branch_x(i, branch.start), Terrain.route_x(branch.start)) and is_equal_approx(Terrain.branch_x(i, branch.end), Terrain.route_x(branch.end)), branch.name + " joins the main road at both ends")
		var start_slope: float = (Terrain.branch_x(i, branch.start + 0.01) - Terrain.branch_x(i, branch.start - 0.01)) / 0.02
		var end_slope: float = (Terrain.branch_x(i, branch.end + 0.01) - Terrain.branch_x(i, branch.end - 0.01)) / 0.02
		check(absf(start_slope - tan(Terrain.heading_at(branch.start))) < 0.001 and absf(end_slope - tan(Terrain.heading_at(branch.end))) < 0.001, branch.name + " has continuous junction headings")
		var driveable_grade: bool = true
		for region: String in ["forest", "snow"]:
			for z: int in range(int(branch.start), int(branch.end) + 1, 5):
				var x: float = Terrain.branch_x(i, float(z))
				road_extent = road_extent and x > Terrain.MIN_X + 30.0 and x < Terrain.MAX_X - 30.0
				road_extent = road_extent and Terrain.road_distance(x, z) < 0.001
				var next_x: float = Terrain.branch_x(i, float(z) + 1.0)
				var grade: float = absf(Terrain.height_at(next_x, z + 1.0, region) - Terrain.height_at(x, z, region)) / Vector2(next_x - x, 1.0).length()
				driveable_grade = driveable_grade and grade < 0.32 and Terrain.surface_at(x, z, region) != "water"
		check(driveable_grade, branch.name + " stays climbable in both regions without underwater road")
		# Drive the entire loop and its reconnection at unmodified low-range speed.
		var driver: Dictionary = physics.create_state("forest", false)
		driver.z = branch.start - 12.0
		driver.x = Terrain.branch_x(i, driver.z)
		driver.yaw = Terrain.heading_at(driver.z)
		driver.lowGear = true
		physics.repair(driver)
		for frame: int in range(60 * 550):
			if driver.z >= branch.end + 12.0:
				break
			var target: float = atan2(Terrain.branch_x(i, driver.z + 5.0) - driver.x, 5.0)
			var error: float = angle_difference(driver.yaw, target)
			physics.step(driver, {"throttle": 1.0, "steer": clampf(-error * 2.0, -1.0, 1.0)}, 1.0 / 60.0)
		check(driver.z >= branch.end + 12.0 and Terrain.road_distance(driver.x, driver.z) < 2.0, branch.name + " can be driven completely and rejoin the main road")
		check(driver.damage.body == 100.0 and driver.damage.tires == 100.0 and driver.damage.suspension == 100.0, branch.name + " normal driving causes no false collision damage")
		print("LOOP_DRIVE ", i, " seconds=", snappedf(driver.time, 0.1), " distance_m=", snappedf(driver.distance, 0.1))
	check(road_extent, "all branch centrelines remain within boundaries and road-distance recognition")
	var sites: Array = Terrain.repair_sites()
	check(sites.size() == 7 and sites[4].z == 775.0 and sites[5].z == 1725.0 and sites[6].z == 2700.0, "four checkpoint huts and three branch huts are exposed to rendering and maps")
	for i: int in range(4):
		var restored: Dictionary = physics.create_state()
		restored.checkpoint = i + 1
		physics.recover(restored)
		check(restored.z > points[i].z and restored.z < points[i].z + 3.0, "saved checkpoint " + str(i + 1) + " restores at its new far location")
	var far_driver: Dictionary = physics.create_state()
	far_driver.z = 3520.0
	far_driver.x = Terrain.route_x(far_driver.z)
	far_driver.yaw = Terrain.heading_at(far_driver.z)
	physics.repair(far_driver)
	for frame: int in range(120):
		physics.step(far_driver, {"throttle": 1.0}, 1.0 / 60.0)
	check(far_driver.z > 3521.0, "driving remains possible beyond the former world and final checkpoint")
	far_driver.x = Terrain.MAX_X - 0.1
	far_driver.yaw = PI * 0.5
	physics.repair(far_driver)
	far_driver.speed = 9.0
	physics.step(far_driver, {"throttle": 1.0}, 0.1)
	check(far_driver.x <= Terrain.MAX_X and far_driver.z <= Terrain.MAX_Z, "vehicle respects the shared expanded world bounds")
	print("WORLD_CHECKS ", checks, " FAILURES ", failures)
	quit(failures)
