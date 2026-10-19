# Native rigid-body regression. Only fixture setup/reset uses pose assignment.
# The production maneuver may only return forces/torque targets to RoadsterForces.
extends SceneTree
var tick := 0
var cases := []
var legacy_only := false
func _initialize():
    Engine.physics_ticks_per_second = 60
    legacy_only = "legacy" in OS.get_cmdline_user_args()
    var names = ["vault", "spin"] if legacy_only else ["combo", "max_height", "no_obstacle", "low_clearance", "low_clearance_vault", "no_landing_pad", "cancel", "manual", "intruder", "landing_changed", "no_power", "repeated", "vault", "spin"]
    var Body = load("res://vehicle_body.gd")
    for i in names.size():
        var name = names[i]
        var x = float(i) * 80.0
        var ground_center = Vector3(x, -0.5, 34.0) if name == "no_landing_pad" else Vector3(x, -0.5, 0.0)
        _box(ground_center, Vector3(60.0, 1.0, 92.0) if name == "no_landing_pad" else Vector3(60.0, 1.0, 160.0), name + "_ground")
        if name != "no_obstacle":
            var height = 3.4 if name == "max_height" else 2.0
            _box(Vector3(x, height * 0.5, -10.0), Vector3(4.0, height, 2.0), name + "_obstacle")
        if name in ["low_clearance", "low_clearance_vault"]:
            _box(Vector3(x + 2.8, 5.7, -10.0), Vector3(0.5, 4.0, 4.0), name + "_overhang")
        var body = Body.new()
        # Roadster authored collider dimensions, mass, wheelbase, track and grip.
        body.configure({"id":name, "kind":"car", "roadsterTrim":"rocket", "mass":1940.0, "size":[2.04,0.91,4.75], "collisionOffset":[0.0,-0.065,0.015], "pos":[x,0.82,0.0], "power":24.0, "maxSpeed":73.0, "wheelBase":2.85, "track":1.76, "lateralGrip":11.8})
        body.controls = {"condition":100.0, "battery":100.0, "roadsterAir":false}
        root.add_child(body)
        cases.append({"name":name, "body":body, "triggered":false, "terminal":{}, "trace":[], "contactIds":[], "rollTravel":0.0, "lastZ":0.0, "minUp":1.0, "landingUp":1.0, "maxStep":0.0, "previous":body.position, "phases":[], "landAngle":0.0})
func _box(pos: Vector3, size: Vector3, id: String):
    var rigid = StaticBody3D.new()
    rigid.set_meta("physics_id", id)
    var collision = CollisionShape3D.new()
    var shape = BoxShape3D.new()
    shape.size = size
    collision.shape = shape
    rigid.position = pos
    rigid.add_child(collision)
    root.add_child(rigid)
    return rigid
func _physics_process(_dt):
    tick += 1
    for c in cases:
        var body = c.body
        var m = body.roadster.maneuver
        if tick == 121:
            body.controls.roadsterAction = "vault" if c.name in ["vault", "low_clearance_vault"] else ("spin" if c.name == "spin" else "vault_spin")
            body.controls.roadsterActionSerial = 1
        if tick > 121 and body.roadster.mode == "air":
            body.controls.roadsterAir = true
        if c.name == "manual" and c.triggered:
            body.controls.roadsterManualOverride = false
        if not c.triggered and m.phase == "cross" and m.angle > 1.5:
            c.triggered = true
            if c.name == "cancel":
                body.controls.roadsterAction = "cancel"
                body.controls.roadsterActionSerial = 2
            elif c.name == "manual":
                body.controls.roadsterManualOverride = true
            elif c.name == "intruder":
                _box(body.position + Vector3(0.0, 0.0, -4.5), Vector3(0.5, 0.5, 0.5), "new_intruder")
            elif c.name == "landing_changed":
                _box(Vector3(m.goal.x, 0.5, m.goal.z), Vector3(4.0, 1.0, 4.0), "new_landing_obstacle")
            elif c.name == "no_power":
                body.controls.condition = 0.0
            elif c.name == "repeated":
                body.controls.roadsterActionSerial = 2
        if m.status in ["complete", "rejected", "cancelled"] and c.terminal.is_empty():
            c.terminal = m.snapshot().duplicate(true)
            c.terminal["tick"] = tick
        if not m.phase in c.phases:
            c.phases.append(m.phase)
        if m.phase == "cross" and body.angular_velocity.length() > 0.3:
            c.rollTravel += absf(body.position.z - c.lastZ)
            c.minUp = minf(c.minUp, body.basis.y.y)
        if m.phase == "land":
            c.landingUp = minf(c.landingUp, body.basis.y.y)
            c.landAngle = m.angle
        c.lastZ = body.position.z
        c.maxStep = maxf(c.maxStep, body.position.distance_to(c.previous))
        c.previous = body.position
        for contact in body.contacts:
            if not contact.b in c.contactIds:
                c.contactIds.append(contact.b)
        if tick % 30 == 0:
            c.trace.append({"tick":tick,"pos":[body.position.x,body.position.y,body.position.z],"q":[body.quaternion.x,body.quaternion.y,body.quaternion.z,body.quaternion.w],"linear":[body.linear_velocity.x,body.linear_velocity.y,body.linear_velocity.z],"angular":[body.angular_velocity.x,body.angular_velocity.y,body.angular_velocity.z],"maneuver":m.snapshot(),"mode":body.roadster.mode,"grounded":body.grounded})
    if tick == 2100:
        var results = []
        for c in cases:
            results.append({"name":c.name,"terminal":c.terminal,"final":c.trace[-1],"trace":c.trace if legacy_only else [],"contactIds":c.contactIds,"rollTravel":c.rollTravel,"minUp":c.minUp,"landingUp":c.landingUp,"maxStep":c.maxStep,"phases":c.phases,"landAngle":c.landAngle})
        print("COMBO_NATIVE_RESULTS ", JSON.stringify(results))
        quit()
