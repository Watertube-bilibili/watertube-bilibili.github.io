# Runtime test only: loads the shipped PCK unchanged. The comparison subclass
# suppresses only ground_resistance; mass, brakes, downforce and wing logic match.
extends SceneTree
var tick := 0
var cases := []
var disabled_script: GDScript
func _initialize():
    var Aero = load("res://roadster_forces.gd")
    var aero = Aero.new()
    aero.wing = 1.0
    var contract = {}
    for speed in [0.0, 10.0, 30.0, 60.0]:
        contract[str(int(speed))] = {"coast":aero.ground_resistance(speed,1.0,{}),"manual":aero.ground_resistance(speed,1.0,{"manualBrake":1.0}),"electronic":aero.ground_resistance(speed,1.0,{"electronicBrake":1.0})}
    contract["handbrake"] = aero.ground_resistance(60.0,1.0,{"handbrake":true})
    contract["hoverInput"] = aero.ground_resistance(60.0,1.0,{"roadsterAirBrake":true})
    contract["inverted"] = aero.ground_resistance(60.0,-1.0,{"manualBrake":1.0})
    for mode in ["air","landing","recover"]:
        aero.mode=mode
        contract[mode]=aero.ground_resistance(60.0,1.0,{"manualBrake":1.0})
    print("AERO_NATIVE_CONTRACT ",JSON.stringify(contract))
    Engine.physics_ticks_per_second = 60
    var ground = StaticBody3D.new()
    var collision = CollisionShape3D.new()
    var shape = BoxShape3D.new()
    shape.size = Vector3(200.0,1.0,2000.0)
    collision.shape=shape
    ground.position.y = -0.5
    ground.add_child(collision)
    root.add_child(ground)
    disabled_script=GDScript.new()
    disabled_script.source_code='extends "res://roadster_forces.gd"\nfunc ground_resistance(planar_speed: float, up_y: float, controls: Dictionary) -> float:\n    return 0.0\n'
    assert(disabled_script.reload() == OK)
    var Body = load("res://vehicle_body.gd")
    var i:=0
    for trim in ["performance","thrust","rocket"]:
        for brake in ["manualBrake","electronicBrake"]:
            for disabled in [false,true]:
                var body=Body.new()
                var config={"id":str(i),"kind":"car","roadsterTrim":trim,"mass":1940.0,"size":[1.9,0.8,4.5],"collisionOffset":[0.0,0.0,0.0],"pos":[-55.0+i*10.0,0.82,500.0],"power":24.0,"maxSpeed":73.0,"wheelBase":2.7,"track":1.8,"lateralGrip":11.8}
                body.configure(config)
                body.axis_lock_angular_x=true
                body.axis_lock_angular_y=true
                body.axis_lock_angular_z=true
                if disabled:
                    body.roadster=disabled_script.new()
                    body.roadster.configure(config)
                body.controls={"condition":100.0,"battery":100.0,"roadsterWingMode":"auto"}
                root.add_child(body)
                cases.append({"trim":trim,"brake":brake,"disabled":disabled,"body":body,"stopTick":0,"distance":0.0,"maxWing":0.0,"maxPitch":0.0})
                i+=1
func _physics_process(_dt):
    tick+=1
    if tick==121:
        for c in cases:
            c.body.linear_velocity=Vector3(0.0,0.0,-60.0)
            c.body.controls[c.brake]=1.0
            c.start=c.body.position.z
    if tick>121:
        for c in cases:
            c.maxWing=maxf(c.maxWing,c.body.roadster.wing)
            c.maxPitch=maxf(c.maxPitch,c.body.roadster.wing_pitch)
            if c.stopTick==0 and absf(c.body.speed)<0.1:
                c.stopTick=tick-121
                c.distance=c.start-c.body.position.z
    if tick==800:
        var results=[]
        for c in cases:
            results.append({"trim":c.trim,"brake":c.brake,"aeroDisabled":c.disabled,"stopSeconds":float(c.stopTick)/60.0,"distance":c.distance,"wing":c.maxWing,"pitch":c.maxPitch,"grounded":c.body.grounded})
        print("AERO_NATIVE_RESULTS ",JSON.stringify(results))
        quit()
