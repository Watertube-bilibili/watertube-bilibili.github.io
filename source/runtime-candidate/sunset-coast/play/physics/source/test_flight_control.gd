extends SceneTree
const Vehicle = preload("res://vehicle_body.gd")
var checks := 0
var observation_checks := 0
var failures := 0
var tick := 0
var cars := {}
var modes := {}
var landing_streak := 0
func check(ok: bool, label: String):
    checks += 1
    if not ok:
        failures += 1
        printerr("FAIL: " + label)
func _initialize():
    var ground := StaticBody3D.new()
    var shape := CollisionShape3D.new()
    var box := BoxShape3D.new()
    box.size = Vector3(400,1,400)
    shape.shape = box
    ground.add_child(shape)
    ground.position.y = -0.5
    root.add_child(ground)
    for spec in [["auto",40.0,2400.0],["manual",40.0,2400.0],["inverted",40.0,2400.0],["empty",5.0,0.0],["latched",40.0,2400.0],["explicit",40.0,2400.0],["low",5.0,1.0],["bump",1.2,2400.0]]:
        var body = Vehicle.new()
        var config := {"id":spec[0],"roadsterTrim":"rocket","roadsterAirUnits":spec[2],"pos":[cars.size()*12.0,spec[1],0]}
        if spec[0] == "inverted": config.quat = [0,0,1,0]
        body.configure(config)
        body.controls = {"condition":100,"battery":100}
        if spec[0] == "latched": body.controls.roadsterForward = 1.0
        root.add_child(body)
        cars[spec[0]] = body
        modes[spec[0]] = []
func _physics_process(_dt):
    tick += 1
    for key in cars:
        var b = cars[key]
        if modes[key].is_empty() or modes[key][-1] != b.roadster.mode: modes[key].append(b.roadster.mode)
        observation_checks += 1
        if not b.pending_teleport.is_empty():
            failures += 1
            printerr("FAIL: unexpected pending teleport " + key)
    if tick == 5:
        check(cars.auto.roadster.mode == "road", "no auto flight before 0.12 second gate")
    if tick == 15:
        check(cars.auto.roadster.automatic_airborne and cars.auto.roadster.mode == "landing", "automatically detects true airborne")
        check(cars.bump.roadster.mode == "road", "low bump below altitude gate stays road")
        check(cars.latched.roadster.mode == "landing", "held launch-time key cannot seize flight")
        cars.manual.controls.roadsterLateral = 1.0
        cars.manual.controls.roadsterForward = 1.0
        cars.manual.controls.roadsterVertical = 1.0
        cars.explicit.controls.roadsterAir = true
    if tick == 30:
        check(cars.manual.roadster.mode == "air", "fresh manual input owns flight")
        check(cars.manual.linear_velocity.z < -0.5, "manual forward actually accelerates")
        check(cars.manual.linear_velocity.y > cars.auto.linear_velocity.y + 1.0, "manual ascent replaces auto descent target")
        check(cars.explicit.roadster.mode == "air" and not cars.explicit.roadster.automatic_airborne, "explicit flight switch owns flight")
        check(absf(cars.latched.linear_velocity.z) < 0.01, "latched key creates no horizontal thrust")
        cars.latched.controls.roadsterForward = 0.0
    if tick == 32: cars.latched.controls.roadsterForward = 1.0
    if tick == 45:
        check(cars.manual.linear_velocity.y > 0.5, "manual vertical command actually climbs")
        check(cars.manual.linear_velocity.x > 0.5, "manual lateral command actually translates")
        cars.manual.controls.roadsterLateral = 0.0
        check(cars.latched.roadster.mode == "air" and cars.latched.linear_velocity.z < -0.3, "release then repress takes over")
        cars.manual.controls.roadsterForward = 0.0
        cars.manual.controls.roadsterVertical = 0.0
        cars.latched.controls.roadsterForward = 0.0
        cars.explicit.controls.roadsterAir = false
    if tick == 50:
        check(cars.manual.roadster.mode == "landing", "release restores automatic descent")
        check(cars.explicit.roadster.mode == "landing", "explicit off returns landing")
    if tick == 150:
        print("INVERTED_AT_150 up=",cars.inverted.basis.y.y," altitude=",cars.inverted.position.y)
        check(cars.empty.roadster.actual_jet_scale == 0.0, "empty tank cannot produce lift or torque")
        check(cars.empty.position.y < 1.0 and cars.empty.position.y > 0.0, "empty tank gravity and floor collision remain")
        check(cars.empty.roadster.automatic_cushion_impulse == 20.0, "empty tank does not spend undelivered cushion impulse")
        check(cars.low.roadster.automatic_cushion_impulse > 19.0, "low-pressure cushion spends only delivered impulse")
    if cars.auto.roadster.mode == "landing" and cars.auto.grounded and cars.auto.basis.y.y > 0.7 and absf(cars.auto.linear_velocity.y) < 1.0:
        landing_streak += 1
    if tick == 190:
        check(cars.inverted.basis.y.y > 0.9, "inverted vehicle levels using torque")
        print("INVERTED_AT_190 up=",cars.inverted.basis.y.y," altitude=",cars.inverted.position.y)
    if tick == 600:
        check(cars.auto.roadster.mode == "road" and cars.auto.grounded, "automatic descent lands and returns road")
        check(landing_streak >= 17, "landing is gated over sustained ground contact")
        check(modes.auto == ["road","landing","road"], "no automatic mode chatter")
        check(modes.manual == ["road","landing","air","landing","road"], "manual transitions do not chatter")
        print("FLIGHT_CONTROL_TESTS checks=",checks," observation_checks=",observation_checks," failures=",failures," modes=",JSON.stringify(modes))
        quit(1 if failures else 0)
