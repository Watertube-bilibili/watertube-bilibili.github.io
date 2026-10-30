extends SceneTree
const Reserve = preload("res://roadster_air_reserve.gd")
const Forces = preload("res://roadster_forces.gd")
const Vehicle = preload("res://vehicle_body.gd")
var checks := 0
var failures := 0
func check(value: bool, label: String) -> void:
    checks += 1
    if not value:
        failures += 1
        printerr("FAIL: " + label)

func _initialize() -> void:
    var a = Reserve.new()
    check(a.units == 2400.0, "large game-balance tank")
    var scale: float = a.consume(19.0, 0.1)
    check(is_equal_approx(scale, 1.0) and is_equal_approx(a.units, 2398.1), "actual thrust impulse charged")
    a.restore(180.0)
    var before: float = a.units
    scale = a.consume(19.0, 0.1)
    check(scale > 0.49 and scale < 0.5, "low pressure force attenuation")
    check(is_equal_approx(before - a.units, 19.0 * scale * 0.1), "delivered impulse equals consumption")
    var b = Reserve.new()
    a.restore(361.0)
    b.restore(361.0)
    a.consume(19.0, 0.1)
    for i in 10: b.consume(19.0, 0.01)
    check(is_equal_approx(a.units, b.units), "pressure threshold integration independent of subdivision")
    a.restore(0.0)
    check(a.consume(100.0, 0.1) == 0.0 and a.units == 0.0, "empty means no jet force")
    a.refill(0.1, true, 0.0, 0.0, false, true)
    check(is_equal_approx(a.units, 0.8), "parked ground refill")
    for invalid in [NAN, INF, -1.0, 0.0, 1000.0]:
        before = a.units
        a.consume(19.0, invalid)
        a.refill(invalid, true, 0.0, 0.0, false, true)
        check(a.units == before, "invalid/reversed/oversized clock rejected")
    before = a.units
    a.refill(0.1, false, 0.0, 0.0, false, true)
    a.refill(0.1, true, 0.0, 0.0, true, true)
    a.refill(0.1, true, 0.25, 0.0, false, true)
    a.refill(0.1, true, 0.0, 0.2, false, true)
    a.refill(0.1, true, NAN, 0.0, false, true)
    a.refill(0.1, true, 0.0, 0.0, false, false)
    check(a.units == before, "airborne/spraying/moving/rotating/invalid/inverted cannot refill")
    for invalid in [NAN, INF, -1.0, "full", null]:
        a.restore(invalid)
        check(a.units == 0.0, "malformed saved fuel cannot grant fuel")
    a.restore(1e20)
    check(a.units == 2400.0, "restore clamps upper bound")
    var f = Forces.new()
    f.configure({"vehicleInstanceId":"rocket:test", "roadsterTrim":"rocket", "roadsterAirUnits":123.0})
    f.reset()
    check(f.snapshot().airUnits == 123.0 and f.snapshot().vehicleInstanceId == "rocket:test", "reset does not refill and identity forwarded")
    call_deferred("integration_test")

func integration_test() -> void:
    var world := Node3D.new()
    root.add_child(world)
    var floor_body := StaticBody3D.new()
    var floor_shape := CollisionShape3D.new()
    var floor_box := BoxShape3D.new()
    floor_box.size = Vector3(100, 1, 100)
    floor_shape.shape = floor_box
    floor_body.add_child(floor_shape)
    floor_body.position.y = -0.5
    world.add_child(floor_body)
    var full = Vehicle.new()
    full.configure({"id":"physics:1", "vehicleInstanceId":"rocket:1", "roadsterTrim":"rocket", "roadsterAirUnits":2400.0, "pos":[0,2,0]})
    full.controls = {"roadsterAir":true, "condition":100, "battery":100}
    world.add_child(full)
    var empty = Vehicle.new()
    empty.configure({"id":"physics:2", "vehicleInstanceId":"rocket:2", "roadsterTrim":"rocket", "roadsterAirUnits":0.0, "pos":[10,2,0]})
    empty.controls = full.controls.duplicate()
    world.add_child(empty)
    var parked = Vehicle.new()
    parked.configure({"id":"physics:3", "vehicleInstanceId":"rocket:3", "roadsterTrim":"rocket", "roadsterAirUnits":123.0, "pos":[20,0.72,0]})
    parked.controls = {"condition":100, "battery":100}
    world.add_child(parked)
    for i in 120: await physics_frame
    check(parked.roadster.air_reserve.units > 123.0 and parked.roadster.air_reserve.units < 140.0, "non-player parked body refills while another flies")
    check(parked.roadster.snapshot().airRefillEligible, "authoritative parked refill eligibility exposed")
    check(full.roadster.air_reserve.units < 2400.0, "real Godot jet force consumes fuel")
    check(full.position.y > empty.position.y + 1.0, "real Godot full tank produces more lift than empty")
    check(empty.position.y < 1.5 and empty.position.y > -0.1, "empty vehicle falls under gravity and collides with floor")
    check(empty.roadster.air_reserve.units == 0.0, "commanded jets never recharge on ground")
    check(empty.gravity_scale == 1.0 and not empty.custom_integrator, "Godot default gravity/integrator retained")
    print("AIR_RESERVE_TESTS checks=", checks, " failures=", failures)
    quit(1 if failures else 0)
