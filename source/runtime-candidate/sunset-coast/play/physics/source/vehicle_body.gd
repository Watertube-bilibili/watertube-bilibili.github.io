class_name NeonPhysicsBody
extends RigidBody3D


const RoadsterForces = preload ( "res://roadster_forces.gd" )
const RoadsterTires = preload("res://roadster_tires.gd")
var roadster_tires: RefCounted
const MAX_BRAKE : = 8.4
var roadster : RefCounted
var physics_id : = ""
var kind : = "car"
var controls : Dictionary = { }
var config : Dictionary = { }
var grounded : = false
var steer : = 0.0
var manual_pressure : = 0.0
var brake_amount : = 0.0
var drift_amount : = 0.0
var contacts : Array = [ ]
var pending_teleport : Dictionary = { }
var previous_linear : = Vector3 . ZERO
var previous_angular : = Vector3 . ZERO
var velocity_history : Array = [ ]
var speed : = 0.0
var lateral_speed : = 0.0
var angle_of_attack : = 0.0
var stall_factor : = 1.0
var airspeed : = 0.0
var wheel_shapes: Array = []
var detached_wheels: Array = []
var wheel_debris: Dictionary = {}
var wheel_repair_serial := 0
var wheel_support_count := 4
var wheel_detach_pending: Dictionary = {}

var wheel_compressions : Array = [ 0.0 , 0.0 , 0.0 , 0.0 ]

static func vec ( value : Variant , fallback : = Vector3 . ZERO ) -> Vector3 :
    if value is Array and value . size ( ) >= 3 :
        return Vector3 ( float ( value [ 0 ] ) , float ( value [ 1 ] ) , float ( value [ 2 ] ) )
    return fallback

static func quat ( value : Variant ) -> Quaternion :
    if value is Array and value . size ( ) >= 4 :
        var q : = Quaternion ( float ( value [ 0 ] ) , float ( value [ 1 ] ) , float ( value [ 2 ] ) , float ( value [ 3 ] ) )
        if q . length_squared ( ) > 1e-06 :
            return q . normalized ( )
    return Quaternion . IDENTITY

static func arr ( v : Vector3 ) -> Array :
    return [ v . x , v . y , v . z ]

func configure ( data : Dictionary ) -> void :
    config = data . duplicate ( true )
    if str ( data . get ( "roadsterTrim" , "" ) ) in [ "performance" , "thrust" , "rocket" ] :
        roadster = RoadsterForces . new ( )
        roadster . configure ( data )
        roadster_tires = RoadsterTires.new()
        roadster_tires.configure(data)
    wheel_repair_serial = int(data.get("wheelRepairSerial", 0))
    detached_wheels = data.get("initialDetachedWheels", []).duplicate()
    physics_id = str ( data . get ( "id" , "body" ) )
    kind = str ( data . get ( "kind" , "car" ) )
    if kind == "motorcycle":
        wheel_compressions = [0.0, 0.0]
        wheel_support_count = 0
    name = physics_id . validate_node_name ( )
    set_meta ( "physics_id" , physics_id )
    mass = clampf ( float ( data . get ( "mass" , 1300.0 if kind == "aircraft" else 1700.0 ) ) , 100.0 , 100000.0 )
    linear_damp_mode = RigidBody3D . DAMP_MODE_REPLACE
    angular_damp_mode = RigidBody3D . DAMP_MODE_REPLACE
    linear_damp = 0.0
    angular_damp = 0.08 if kind == "aircraft" else 0.3
    continuous_cd = true
    contact_monitor = true
    max_contacts_reported = 16
    can_sleep = false
    collision_layer = 2
    collision_mask = 3
    var material : = PhysicsMaterial . new ( )
    material . friction = 0.18
    material . bounce = 0.03
    physics_material_override = material
    var shape : = BoxShape3D . new ( )
    shape . size = vec ( data . get ( "size" ) , Vector3 ( 2.0 , 0.9 , 4.7 ) if kind == "car" else Vector3 ( 2.2 , 1.3 , 8.0 ) )
    var collision : = CollisionShape3D . new ( )
    collision . shape = shape
    collision . position = vec ( data . get ( "collisionOffset" ) )


    if data . has ( "collisionOffset" ) :
        center_of_mass_mode = RigidBody3D . CENTER_OF_MASS_MODE_CUSTOM
        center_of_mass = Vector3 . ZERO
    if bool(data.get("structuralWheelDamage", false)):
        for box_data in data.get("bodyCollisionBoxes", []):
            var hull := CollisionShape3D.new()
            var hull_shape := BoxShape3D.new()
            hull_shape.size = vec(box_data.size)
            hull.shape = hull_shape
            hull.position = vec(box_data.pos)
            add_child(hull)
        collision.free()
        for offset in data.get("wheelOffsets", []):
            var ws := CollisionShape3D.new()
            var cylinder := CylinderShape3D.new()
            cylinder.radius = float(offset[3]) - 0.02
            cylinder.height = 0.28
            ws.shape = cylinder
            ws.rotation.z = PI * 0.5
            ws.position = Vector3(float(offset[0]), float(offset[4]) - 0.72, float(offset[2]))
            add_child(ws)
            ws.disabled = detached_wheels.has(wheel_shapes.size())
            wheel_shapes.append(ws)
    else:
        add_child(collision)
    if kind == "aircraft" :

        var wing : = CollisionShape3D . new ( )
        var wing_shape : = BoxShape3D . new ( )
        wing_shape . size = Vector3 ( float ( data . get ( "wingSpan" , 11.0 ) ) , 0.18 , 1.8 )
        wing . shape = wing_shape
        wing . position = Vector3 ( 0 , 0.1 , 0.0 )
        add_child ( wing )
    transform = Transform3D ( Basis ( quat ( data . get ( "quat" ) ) ) , vec ( data . get ( "pos" ) , Vector3 ( 0 , 0.72 , 0 ) ) )
    linear_velocity = vec ( data . get ( "linear" ) )
    angular_velocity = vec ( data . get ( "angular" ) )
    if roadster_tires != null:
        roadster_tires.reset(linear_velocity.dot(-transform.basis.z))

func _integrate_forces ( state : PhysicsDirectBodyState3D ) -> void :
    if not pending_teleport . is_empty ( ) :

        state . transform = Transform3D ( Basis ( quat ( pending_teleport . get ( "quat" ) ) ) , vec ( pending_teleport . get ( "pos" ) ) )
        state . linear_velocity = vec ( pending_teleport . get ( "linear" ) )
        state . angular_velocity = vec ( pending_teleport . get ( "angular" ) )
        state . sleeping = false
        previous_linear = state . linear_velocity
        previous_angular = state . angular_velocity
        velocity_history . clear ( )
        contacts . clear ( )
        manual_pressure = 0.0
        steer = 0.0
        drift_amount = 0.0
        grounded = false
        pending_teleport . clear ( )
        if roadster != null :
            roadster . reset ( )
        if roadster_tires != null:
            roadster_tires.reset(state.linear_velocity.dot(-state.transform.basis.z))
    else :
        _collect_contacts ( state )
    if kind == "aircraft" :
        _aircraft_forces ( state )
    elif kind == "motorcycle":
        _motorcycle_forces(state)
    else :
        _car_forces ( state )
        if roadster != null :
            roadster . step ( self , state , controls , grounded )
    previous_linear = state . linear_velocity
    previous_angular = state . angular_velocity
    velocity_history . push_front ( { "linear" : previous_linear , "angular" : previous_angular , "pos" : state . transform . origin , "dt" : state . step } )
    if velocity_history . size ( ) > 3 :
        velocity_history . pop_back ( )

func _collect_contacts ( state : PhysicsDirectBodyState3D ) -> void :
    contacts . clear ( )
    grounded = false
    for i in state . get_contact_count ( ) :
        var other : = state . get_contact_collider_object ( i )
        var other_id : = str ( other . get_meta ( "physics_id" , "world" ) ) if is_instance_valid ( other ) else "world"
        var normal : = state . get_contact_local_normal ( i ) . normalized ( )
        var point : = state . get_contact_local_position ( i )
        var impulse : = state . get_contact_impulse ( i ) . length ( )
        var before_a : = previous_linear + previous_angular . cross ( point - state . transform . origin )
        var before_b : = state . get_contact_collider_velocity_at_position ( i )
        if other is NeonPhysicsBody :
            before_b = other . previous_linear + other . previous_angular . cross ( point - other . global_position )
        var closing : = maxf ( 0.0 , - ( before_a - before_b ) . dot ( normal ) )



        for h in velocity_history . size ( ) :
            var frame : Dictionary = velocity_history [ h ]
            var historical_a : Vector3 = frame . linear + frame . angular . cross ( point - frame . pos )
            var historical_b : = before_b
            if other is NeonPhysicsBody and not other . velocity_history . is_empty ( ) :
                var other_frame : Dictionary = other . velocity_history [ mini ( h , other . velocity_history . size ( ) - 1 ) ]
                historical_b = other_frame . linear + other_frame . angular . cross ( point - other_frame . pos )
            closing = maxf ( closing , - ( historical_a - historical_b ) . dot ( normal ) )
        if normal . y > 0.4 :
            grounded = true
        var native_impulse : = impulse
        var impulse_source : = "native"




        if impulse <= 0.01 and closing > 1.2 :
            var after_relative : = state . linear_velocity
            if other is NeonPhysicsBody :
                after_relative -= other . linear_velocity




            var collision_loss : = 0.0
            var age : = state . step
            var force_allowance : = 120.0 if other is NeonPhysicsBody else 60.0
            for h in velocity_history . size ( ) :
                var frame : Dictionary = velocity_history [ h ]
                var before_relative : Vector3 = frame . linear
                if other is NeonPhysicsBody :
                    if h >= other . velocity_history . size ( ) :
                        break
                    before_relative -= other . velocity_history [ h ] . linear
                var normal_speed_loss : = ( after_relative - before_relative ) . dot ( normal )
                collision_loss = maxf ( collision_loss , normal_speed_loss - force_allowance * age )
                age += float ( frame . get ( "dt" , state . step ) )
            if collision_loss > 1.2 :
                var effective_mass : = mass
                if other is NeonPhysicsBody :
                    effective_mass = mass * other . mass / ( mass + other . mass )
                impulse = effective_mass * minf ( closing , collision_loss )
                impulse_source = "manifold-normal-speed-loss"
        if impulse > 0.01 :
            contacts . append ( { "a" : physics_id , "b" : other_id , "point" : arr ( point ) , "normal" : arr ( normal ) , "impulse" : impulse , "nativeImpulse" : native_impulse , "impulseSource" : impulse_source , "relativeNormalSpeed" : closing } )

func _car_forces ( state : PhysicsDirectBodyState3D ) -> void :
    _sync_wheel_damage(state)
    var dt : = state . step
    var basis : = state . transform . basis . orthonormalized ( )
    var up : = basis . y
    var forward : = - basis . z
    var right : = basis . x
    speed = state . linear_velocity . dot ( forward )
    lateral_speed = state . linear_velocity . dot ( right )
    var throttle : = clampf ( float ( controls . get ( "throttle" , 0.0 ) ) , -1.0 , 1.0 )
    var requested : = clampf ( float ( controls . get ( "manualBrake" , 0.0 ) ) , 0.0 , 1.0 )
    var electronic : = clampf ( float ( controls . get ( "electronicBrake" , 0.0 ) ) , 0.0 , 1.0 )
    if bool ( controls . get ( "manualBrakeBroken" , false ) ) :
        manual_pressure = 0.0
        requested = 0.0
    var start_pressure : = manual_pressure
    var rate : = 24.0 if requested > manual_pressure else 30.0
    manual_pressure = move_toward ( manual_pressure , requested , rate * dt )
    var ramp_time : = minf ( dt , absf ( requested - start_pressure ) / rate )
    var average_pressure : = ( start_pressure + manual_pressure ) * 0.5 * ramp_time / dt + requested * ( 1.0 - ramp_time / dt )
    brake_amount = maxf ( manual_pressure , electronic )
    var handbrake : = 1.0 if bool ( controls . get ( "handbrake" , false ) ) else 0.0
    drift_amount = move_toward ( drift_amount , handbrake if absf ( speed ) > 2.0 else 0.0 , ( 5.0 if handbrake > 0 else 2.2 ) * dt )
    var grip : = clampf ( float ( config . get ( "lateralGrip" , 9.8 ) ) , 3.0 , 18.0 )
    var brake_accel : = maxf ( maxf ( average_pressure , electronic ) * minf ( MAX_BRAKE , grip * 0.96 ) , handbrake * 5.2 )
    var axle_broken : = bool ( controls . get ( "axleBroken" , false ) )
    var axle_side : = clampf ( float ( controls . get ( "axleSide" , 0.0 ) ) , -1.0 , 1.0 ) if axle_broken else 0.0
    var power : = float ( config . get ( "power" , 7.5 ) ) * ( 0.18 if axle_broken else 1.0 )
    if float ( controls . get ( "condition" , 100.0 ) ) <= 0.0 :
        power = 0.0
    elif float ( controls . get ( "battery" , 100.0 ) ) <= 0.0 :
        power *= 0.05
    var drive_accel : = (throttle * power if roadster_tires != null else clampf(throttle * power, -grip * 0.9, grip * 0.9)) if brake_accel <= 0.001 else 0.0
    var planar : = state . linear_velocity . slide ( Vector3 . UP )
    var resistance : = 0.14 * tanh ( 2.0 * planar . length ( ) ) + 0.0004 * planar . length_squared ( )
    if axle_broken :
        resistance += 1.6 * tanh ( 2.0 * planar . length ( ) )
    if roadster != null :
        resistance += roadster . ground_resistance ( planar . length ( ) , up . y , controls )
    if drive_accel != 0.0 :


        var direction : = signf ( drive_accel )
        var limit : = 3.0 if axle_broken else ( float ( config . get ( "maxSpeed" , 65.0 ) ) if direction > 0.0 else 9.0 )
        var drag_along_drive : = resistance * planar . normalized ( ) . dot ( forward ) * direction
        var limit_accel : = maxf ( 0.0 , ( limit - speed * direction ) * 4.0 + drag_along_drive )
        drive_accel = direction * minf ( absf ( drive_accel ) , limit_accel )
    var wheel_base : = float ( config . get ( "wheelBase" , 2.9 ) )
    var track : = float ( config . get ( "track" , 1.65 ) )
    var max_steer : = float ( config . get ( "maxSteer" , 0.55 ) )



    var available_grip : = sqrt ( maxf ( 0.25 , grip * grip - minf ( grip , brake_accel ) ** 2 ) )
    var steer_limit : = minf ( max_steer , atan ( available_grip * wheel_base / maxf ( 1.0 , speed * speed ) ) )
    var steer_target : = clampf ( float ( controls . get ( "steer" , 0.0 ) ) * ( 0.45 if axle_broken else 1.0 ) , - steer_limit , steer_limit )
    steer = move_toward ( steer , steer_target , ( 2.6 if absf ( steer_target ) < 0.005 or signf ( steer_target ) != signf ( steer ) else 1.65 ) * dt )
    var supported : = 0
    var wheel_index : = 0
    var tcs_enabled := bool(controls.get("roadsterTcs", true))
    if roadster_tires != null:
        roadster_tires.begin_step()
    for axle in [ -1.0 , 1.0 ] :
        for side in [ -1.0 , 1.0 ] :
            var mount : = basis * Vector3 ( side * track * 0.5 , 0.1 , axle * wheel_base * 0.5 )
            var offsets : Array = config . get ( "wheelOffsets" , [ ] )
            var wheel_geometry : Array = offsets [ wheel_index ] if offsets . size ( ) == 4 else [ ]
            if bool(config.get("structuralWheelDamage", false)) and wheel_geometry.size() >= 5:
                mount = basis * Vector3(float(wheel_geometry[0]), float(wheel_geometry[1]), float(wheel_geometry[2]))
            var origin := state.transform.origin + mount
            if detached_wheels.has(wheel_index):
                wheel_compressions[wheel_index] = 0.0
                wheel_index += 1
                continue
            var hit : = _wheel_surface_hit ( state . get_space_state ( ) , origin , up , wheel_geometry )
            wheel_compressions [ wheel_index ] = 0.0
            wheel_index += 1
            if hit . is_empty ( ) or hit . normal . dot ( up ) < 0.3 :
                continue
            var distance : float = ( origin - hit . position ) . dot ( up )
            var compression : = maxf ( 0.0 , 1.0 - distance - _wheel_radius_loss(wheel_index - 1) )
            if compression <= 0.0 :
                continue
            supported += 1
            wheel_compressions [ wheel_index - 1 ] = compression
            var contact_velocity : = state . get_velocity_at_local_position ( mount )
            var normal : Vector3 = hit . normal . normalized ( )


            var sports : = roadster != null or str ( config . get ( "suspensionProfile" , "" ) ) == "low-sports"
            var spring_rate : = float ( config . get ( "suspensionRate" , 32.0 if sports else 13.625 ) )
            var damping : = float ( config . get ( "suspensionDamping" , 3.8 if sports else 2.05 ) )
            var compression_speed : = - contact_velocity . dot ( normal )
            var support : = 9.81 * 0.25 + ( compression - 0.18 ) * spring_rate + compression_speed * damping
            if sports :


                var stop_travel : = maxf ( 0.0 , compression - 0.225 )
                support += stop_travel * 200.0 + minf ( 1.0 , stop_travel / 0.02 ) * maxf ( 0.0 , compression_speed ) * 2.0
            var spring_force : = clampf ( support * mass , 0.0 , mass * 9.81 * 0.8 )


            state . apply_force ( normal * spring_force , mount )

            var damaged_wheel : bool = axle_broken and axle < 0 and side == axle_side
            var damage: Dictionary = controls.get("wheelDamage", {})
            var flats: Array = damage.get("flat", [])
            var toes: Array = damage.get("toe", [])
            var flat := float(flats[wheel_index - 1]) if flats.size() == 4 else 0.0
            var toe := float(toes[wheel_index - 1]) if toes.size() == 4 else 0.0
            var tire_angle : float = toe + ( steer if axle < 0 else 0.0 ) + ( side * 0.24 if damaged_wheel else 0.0 )
            var tire_forward : = forward . rotated ( up , tire_angle )
            tire_forward = tire_forward . slide ( hit . normal ) . normalized ( )
            var tire_right : = tire_forward . cross ( hit . normal ) . normalized ( )
            var tire_offset : = basis * Vector3 ( side * track * 0.5 , -0.15 , axle * wheel_base * 0.5 )
            var tire_velocity : = state . get_velocity_at_local_position ( tire_offset )
            var longitudinal : = tire_velocity . dot ( tire_forward )
            var lateral : = tire_velocity . dot ( tire_right )
            var axle_grip : = grip * ( 1.0 - ( 0.82 if axle > 0 else 0.15 ) * drift_amount )
            var tire_limit : = spring_force * axle_grip / 9.81 * (1.0 - clampf(flat * 3.0, 0.0, 0.6)) * ( 0.3 if damaged_wheel else 1.0 )
            var brake_force : = minf ( mass * brake_accel * 0.25 , absf ( longitudinal ) * mass * 0.25 / dt )
            var longitudinal_force : = mass * drive_accel * 0.25 - signf ( longitudinal ) * brake_force
            var lateral_force : = - lateral * mass * 2.3



            var combined_force : = Vector2 ( longitudinal_force , lateral_force ) . limit_length ( tire_limit )
            if roadster_tires != null:
                combined_force = roadster_tires.contact(wheel_index - 1, longitudinal, lateral_force, mass * drive_accel * 0.25, brake_force, spring_force, tire_limit, grip, mass * 0.25, dt, tcs_enabled)
            state . apply_force ( tire_forward * combined_force . x + tire_right * combined_force . y , tire_offset )
    wheel_support_count = supported
    grounded = supported > 0 or grounded
    if roadster_tires != null:
        roadster_tires.finish_step(mass * drive_accel * 0.25, mass * brake_accel * 0.25, dt, tcs_enabled)

    if planar . length ( ) > 0.001 :
        state . apply_central_force ( - planar . normalized ( ) * mass * resistance )


# Two centreline tire contacts, rear wheel propulsion and bounded rider balance.
# This is assisted rigid-body motorcycle handling, not a soft-body simulation.
# Never writes transforms/velocities to keep the bike upright after a crash.
func _motorcycle_forces(state: PhysicsDirectBodyState3D) -> void:
    var dt := state.step
    var basis := state.transform.basis.orthonormalized()
    var up := basis.y
    var forward := -basis.z
    var right := basis.x
    speed = state.linear_velocity.dot(forward)
    lateral_speed = state.linear_velocity.dot(right)
    var grip := clampf(float(config.get("lateralGrip", 8.5)), 3.0, 14.0)
    var wheel_base := maxf(0.6, float(config.get("wheelBase", 1.45)))
    var steer_limit := minf(float(config.get("maxSteer", 0.6)), atan(grip * wheel_base / maxf(1.0, speed * speed)))
    var target_steer := clampf(float(controls.get("steer", 0.0)), -steer_limit, steer_limit)
    steer = move_toward(steer, target_steer, dt * 2.4)
    var requested := clampf(float(controls.get("manualBrake", 0.0)), 0.0, 1.0)
    if bool(controls.get("manualBrakeBroken", false)):
        requested = 0.0
        manual_pressure = 0.0
    manual_pressure = move_toward(manual_pressure, requested, dt * (24.0 if requested > manual_pressure else 30.0))
    brake_amount = maxf(manual_pressure, clampf(float(controls.get("electronicBrake", 0.0)), 0.0, 1.0))
    var brake_accel := brake_amount * minf(MAX_BRAKE, grip * 0.9)
    var throttle := clampf(float(controls.get("throttle", 0.0)), -1.0, 1.0)
    var drive_accel := throttle * clampf(float(config.get("power", 5.0)), 0.0, 14.0)
    if float(controls.get("condition", 100.0)) <= 0.0 or float(controls.get("battery", 100.0)) <= 0.0 or brake_amount > 0.01:
        drive_accel = 0.0
    var max_speed := float(config.get("maxSpeed", 22.0)) if drive_accel >= 0.0 else 2.0
    if speed * signf(drive_accel) >= max_speed:
        drive_accel = 0.0
    var offsets: Array = config.get("wheelOffsets", [])
    var supported := 0
    var normals := Vector3.ZERO
    for i in 2:
        wheel_compressions[i] = 0.0
        if offsets.size() != 2 or offsets[i].size() < 5:
            continue
        var geometry: Array = offsets[i]
        var mount := basis * Vector3(float(geometry[0]), float(geometry[1]), float(geometry[2]))
        var origin := state.transform.origin + mount
        var hit := _wheel_surface_hit(state.get_space_state(), origin, up, geometry)
        if hit.is_empty() or hit.normal.dot(up) < 0.4:
            continue
        var compression := maxf(0.0, 1.0 - (origin - hit.position).dot(up))
        if compression <= 0.0:
            continue
        supported += 1
        wheel_compressions[i] = compression
        var normal: Vector3 = hit.normal.normalized()
        normals += normal
        var local_velocity := state.get_velocity_at_local_position(mount)
        var spring_accel := 9.81 * 0.5 + (compression - 0.18) * 36.0 - local_velocity.dot(normal) * 3.6
        var support := clampf(spring_accel * mass, 0.0, mass * 9.81 * 1.2)
        state.apply_force(normal * support, mount)
        var tire_forward := forward.rotated(up, steer if i == 0 else 0.0).slide(normal).normalized()
        var tire_right := tire_forward.cross(normal).normalized()
        var tire_offset := basis * Vector3(float(geometry[0]), float(geometry[4]) - 0.72 - float(geometry[3]), float(geometry[2]))
        var tire_velocity := state.get_velocity_at_local_position(tire_offset)
        var longitudinal := tire_velocity.dot(tire_forward)
        var lateral := tire_velocity.dot(tire_right)
        var brake_share := 0.65 if i == 0 else 0.35
        var brake_force := mass * brake_accel * brake_share
        if i == 1 and bool(controls.get("handbrake", false)):
            brake_force = maxf(brake_force, mass * 3.0)
        brake_force = minf(brake_force, absf(longitudinal) * mass * 0.5 / dt)
        var propulsion := mass * drive_accel if i == 1 and up.y > 0.5 else 0.0
        var forces := Vector2(propulsion - signf(longitudinal) * brake_force, -lateral * mass * 3.0)
        forces = forces.limit_length(support * grip / 9.81)
        state.apply_force(tire_forward * forces.x + tire_right * forces.y, tire_offset)
    wheel_support_count = supported
    grounded = supported > 0 or grounded
    drift_amount = 0.0
    # Rider's balancing authority disappears in the air or after falling.
    if supported > 0 and up.y > 0.55:
        var ground_up := normals.normalized()
        var lateral_accel := speed * speed * tan(steer) / wheel_base
        var lean := clampf(atan(lateral_accel / 9.81), -0.42, 0.42) if bool(controls.get("motorcycleOccupied", true)) else 0.0
        var desired_up := (ground_up * cos(lean) - right.slide(ground_up).normalized() * sin(lean)).normalized()
        var roll_error := up.cross(desired_up).dot(forward)
        var roll_velocity := state.angular_velocity.dot(forward)
        var balance := clampf(roll_error * 26.0 - roll_velocity * 5.5, -8.0, 8.0)
        state.apply_torque(forward * mass * balance)
    var planar := state.linear_velocity.slide(Vector3.UP)
    if planar.length() > 0.001:
        var resistance := 0.12 + 0.0012 * planar.length_squared()
        state.apply_central_force(-planar.normalized() * mass * resistance)

func _aircraft_forces ( state : PhysicsDirectBodyState3D ) -> void :
    var basis : = state . transform . basis . orthonormalized ( )
    var forward : = - basis . z
    var up : = basis . y
    var right : = basis . x
    var velocity : = state . linear_velocity
    airspeed = velocity . length ( )
    speed = velocity . dot ( forward )
    lateral_speed = velocity . dot ( right )
    var throttle : = clampf ( float ( controls . get ( "throttle" , 0.0 ) ) , 0.0 , 1.0 )
    if float ( controls . get ( "condition" , 100.0 ) ) <= 0.0 or float ( controls . get ( "battery" , 100.0 ) ) <= 0.0 :
        throttle = 0.0
    var pitch : = clampf ( float ( controls . get ( "pitch" , 0.0 ) ) , -1.0 , 1.0 )
    var roll : = clampf ( float ( controls . get ( "roll" , 0.0 ) ) , -1.0 , 1.0 )
    var yaw : = clampf ( float ( controls . get ( "yaw" , controls . get ( "steer" , 0.0 ) ) ) , -1.0 , 1.0 )
    state . apply_central_force ( forward * mass * float ( config . get ( "thrust" , 5.6 ) ) * throttle )
    var aoa : = atan2 ( - velocity . dot ( up ) , maxf ( 0.1 , speed ) )
    angle_of_attack = aoa
    var flaps : = clampf ( float ( controls . get ( "flaps" , 0.0 ) ) , 0.0 , 1.0 )
    var cl : = clampf ( 0.45 + flaps * 0.35 + aoa * 4.0 , -1.25 , 1.45 + flaps * 0.25 )
    var stall : = 1.0 - smoothstep ( 0.3 , 0.95 , absf ( aoa ) ) * 0.88
    stall_factor = stall
    var wing_area : = float ( config . get ( "wingArea" , 18.0 ) )
    var pressure : = 0.5 * 1.225 * airspeed * airspeed
    var lift : = pressure * wing_area * cl * stall

    var lift_direction : = up . slide ( velocity . normalized ( ) ) . normalized ( ) if airspeed > 0.1 else up
    state . apply_central_force ( lift_direction * lift )
    var drag : = pressure * wing_area * ( 0.035 + flaps * 0.065 + 0.065 * cl * cl + ( 1.0 - stall ) * 0.7 )
    if airspeed > 0.01 :
        state . apply_central_force ( - velocity . normalized ( ) * drag )
        state . apply_central_force ( - right * lateral_speed * mass * minf ( 1.6 , airspeed * 0.02 ) )
    var authority : = clampf ( airspeed / 28.0 , 0.08 , 1.4 )
    var local_omega : = basis . transposed ( ) * state . angular_velocity
    var torque_local : = Vector3 ( pitch * 4.2 - local_omega . x * 4.8 - aoa * 0.8 ,
        yaw * 2.5 - local_omega . y * 4.2 , - roll * 5.6 - local_omega . z * 4.0 )
    state . apply_torque ( basis * torque_local * mass * authority )

    for gear in [ Vector3 ( 0 , -0.2 , -2.3 ) , Vector3 ( -1.2 , -0.2 , 1.8 ) , Vector3 ( 1.2 , -0.2 , 1.8 ) ] :
        var offset : Vector3 = basis * gear
        var start : Vector3 = state . transform . origin + offset
        var query : = PhysicsRayQueryParameters3D . create ( start , start - up * 1.25 , 1 , [ get_rid ( ) ] )
        var hit : = state . get_space_state ( ) . intersect_ray ( query )
        if hit . is_empty ( ) or hit . normal . y < 0.25 :
            continue
        var compression : = maxf ( 0.0 , 1.1 - start . distance_to ( hit . position ) )
        if compression <= 0.0 :
            continue
        grounded = true
        var gear_velocity : = state . get_velocity_at_local_position ( offset )
        var normal : Vector3 = hit . normal . normalized ( )
        var support : = clampf ( compression * mass * 22.0 - gear_velocity . dot ( normal ) * mass * 2.5 , 0.0 , mass * 9.81 )


        state . apply_force ( normal * support , offset )
        var ground_right : = right . slide ( normal ) . normalized ( )
        var ground_forward : = forward . slide ( normal ) . normalized ( )
        state . apply_force ( - ground_right * clampf ( gear_velocity . dot ( ground_right ) * mass * 0.8 , - support * 0.6 , support * 0.6 ) , offset )
        var braking : = clampf ( float ( controls . get ( "brake" , controls . get ( "manualBrake" , 0.0 ) ) ) , 0 , 1 )
        var ground_speed : = gear_velocity . dot ( ground_forward )
        state . apply_force ( - ground_forward * signf ( ground_speed ) * minf ( absf ( ground_speed ) * mass / ( 3.0 * state . step ) , mass * ( braking * 2.4 + 0.04 ) ) , offset )

func _wheel_surface_hit ( space : PhysicsDirectSpaceState3D , origin : Vector3 , up : Vector3 , geometry : Array ) -> Dictionary :
    var reach : = 0.82 + float ( config . get ( "suspensionRebound" , 0.08 ) )
    var query : = PhysicsRayQueryParameters3D . create ( origin , origin - up * reach , 1 , [ get_rid ( ) ] )
    var hit : = space . intersect_ray ( query )
    if hit . is_empty ( ) or hit . normal . dot ( up ) < 0.3 :
        return { }



    if geometry . size ( ) >= 5 and up . y > 0.5 :
        var compression : = 1.0 - origin . distance_to ( hit . position )
        var wheel_center : = origin + up * ( float ( geometry [ 4 ] ) - 0.82 + compression - 0.18 )
        var foot_origin : = Vector3 ( wheel_center . x , origin . y , wheel_center . z )
        var foot_query : = PhysicsRayQueryParameters3D . create ( foot_origin , foot_origin - Vector3 . UP * ( reach / up . y ) , 1 , [ get_rid ( ) ] )
        var foot : = space . intersect_ray ( foot_query )
        if not foot . is_empty ( ) and foot . normal . dot ( up ) >= 0.3 and foot . position . y > hit . position . y + 0.0001 :
            return foot
    return hit

func _wheel_radius_loss(index: int) -> float:
    if not bool(config.get("structuralWheelDamage", false)):
        return 0.0
    var flats: Array = controls.get("wheelDamage", {}).get("flat", [])
    if flats.size() != 4 or index < 0 or index >= 4:
        return 0.0
    return float(config.wheelOffsets[index][3]) * clampf(float(flats[index]), 0.0, 0.16)

func _visual_wheel_compressions ( ) -> Array :


    var result : Array = [ ]
    var basis : = global_basis . orthonormalized ( )
    for offset in config . get ( "wheelOffsets" , [ ] ) :
        if detached_wheels.has(result.size()):
            result.append(0.0)
            continue
        var origin : = global_position + basis * vec ( offset )
        var hit : = _wheel_surface_hit ( get_world_3d ( ) . direct_space_state , origin , basis . y , offset )
        result . append ( maxf ( 0.0 , 1.0 - ( origin - hit . position ) . dot ( basis . y ) - _wheel_radius_loss(result.size()) ) if not hit . is_empty ( ) else 0.0 )
    return result if result.size() == (2 if kind == "motorcycle" else 4) else wheel_compressions

func snapshot ( ) -> Dictionary :
    var q : = global_basis . orthonormalized ( ) . get_rotation_quaternion ( )
    return { "id" : physics_id , "kind" : kind , "mass" : mass , "pos" : arr ( global_position ) , "quat" : [ q . x , q . y , q . z , q . w ] ,
        "linear" : arr ( linear_velocity ) , "angular" : arr ( angular_velocity ) , "grounded" : grounded ,
        "speed" : speed , "lateralSpeed" : lateral_speed , "steer" : steer ,
        "manualBrakePressure" : manual_pressure , "brakeAmount" : brake_amount , "driftAmount" : drift_amount ,
        "airspeed" : airspeed , "angleOfAttack" : angle_of_attack , "stallFactor" : stall_factor , "stalled" : kind == "aircraft" and ( stall_factor < 0.65 or airspeed < 27.0 ) and not grounded ,
        "roadster" : roadster . snapshot ( ) if roadster != null else null ,
        "wheelRepairSerial": wheel_repair_serial, "wheelColliders": _wheel_collider_snapshot(), "wheelDamageVersion": 1 if bool(config.get("structuralWheelDamage", false)) else 0, "detachedWheels": detached_wheels.duplicate(), "wheelDebris": _wheel_debris_snapshot(), "wheelSupportCount": wheel_support_count,
        "wheelDynamics": roadster_tires.snapshot() if roadster_tires != null else null,
        "suspensionRest" : 0.18 , "suspensionRebound" : float ( config . get ( "suspensionRebound" , 0.08 ) ) , "wheelCompressions" : wheel_compressions , "wheelVisualCompressions" : _visual_wheel_compressions ( ) if kind in ["car", "motorcycle"] else [ ] , "rideHeight" : 1.16 if kind == "aircraft" else 0.72 }


# Opt-in wheel rigid bodies share the original native physics world and solver.
# No render-only disappearance and no JS position integration.
func _sync_wheel_damage(state: PhysicsDirectBodyState3D) -> void:
    if not bool(config.get("structuralWheelDamage", false)):
        return
    var serial := int(controls.get("wheelRepairSerial", 0))
    if serial != wheel_repair_serial:
        wheel_repair_serial = serial
        contacts.clear()
        velocity_history.clear()
        previous_linear = state.linear_velocity
        previous_angular = state.angular_velocity
        detached_wheels.clear()
        wheel_detach_pending.clear()
        for debris in wheel_debris.values():
            if is_instance_valid(debris):
                debris.queue_free()
        wheel_debris.clear()
        for shape in wheel_shapes:
            shape.set_deferred("disabled", false)
    var requested: Array = controls.get("wheelDamage", {}).get("detachedWheels", [])
    for raw in requested:
        var index := int(raw)
        if index < 0 or index >= wheel_shapes.size() or detached_wheels.has(index):
            continue
        detached_wheels.append(index)
        wheel_compressions[index] = 0.0
        var shape: CollisionShape3D = wheel_shapes[index]
        shape.set_deferred("disabled", true)
        var offset: Array = config.wheelOffsets[index]
        var local_center: Vector3 = shape.position
        var center := state.transform * local_center
        var velocity := state.linear_velocity + state.angular_velocity.cross(center - state.transform.origin)
        var rotation := state.transform.basis.orthonormalized() * Basis(Vector3.UP, steer if index < 2 else 0.0)
        wheel_detach_pending[index] = wheel_repair_serial
        _spawn_wheel_debris.call_deferred(index, center, rotation, velocity, state.angular_velocity, wheel_repair_serial)
    for index in wheel_shapes.size():
        if detached_wheels.has(index):
            continue
        var offset: Array = config.wheelOffsets[index]
        var travel := clampf(float(wheel_compressions[index]) - 0.18, -0.08, 0.07)
        var shape: CollisionShape3D = wheel_shapes[index]
        # Inset attached obstacle hull only: ray suspension owns ground support.
        # A full-radius rigid cylinder double-supports the tire and starves ray grip.
        shape.shape.set_deferred("radius", float(offset[3]) - _wheel_radius_loss(index) - 0.02)
        shape.set_deferred("position", Vector3(float(offset[0]), float(offset[4]) - 0.72 + travel, float(offset[2])))
        shape.set_deferred("rotation", Vector3(0.0, steer if index < 2 else 0.0, PI * 0.5))

func _spawn_wheel_debris(index: int, center: Vector3, rotation: Basis, velocity: Vector3, angular: Vector3, serial: int) -> void:
    if not is_inside_tree() or wheel_repair_serial != serial or not detached_wheels.has(index):
        return
    var body := RigidBody3D.new()
    body.name = "DetachedWheel_" + str(index)
    body.mass = 24.0
    body.continuous_cd = true
    body.collision_layer = 2
    body.collision_mask = 3
    body.linear_damp = 0.08
    body.angular_damp = 0.12
    var material := PhysicsMaterial.new()
    material.friction = 0.8
    material.bounce = 0.18
    body.physics_material_override = material
    var collider := CollisionShape3D.new()
    var cylinder := CylinderShape3D.new()
    cylinder.radius = float(config.wheelOffsets[index][3]) - _wheel_radius_loss(index)
    cylinder.height = 0.28
    collider.shape = cylinder
    collider.rotation.z = PI * 0.5
    body.add_child(collider)
    get_parent().add_child(body)
    body.global_transform = Transform3D(rotation, center)
    body.linear_velocity = velocity
    body.angular_velocity = angular + rotation * Vector3(-speed / maxf(cylinder.radius, 0.1), 0.0, 0.0)
    body.add_collision_exception_with(self)
    wheel_debris[index] = body
    wheel_detach_pending.erase(index)

func _wheel_debris_snapshot() -> Array:
    var result: Array = []
    for index in wheel_debris:
        var body: RigidBody3D = wheel_debris[index]
        if not is_instance_valid(body):
            continue
        var q := body.global_basis.orthonormalized().get_rotation_quaternion()
        result.append({"index": index, "pos": arr(body.global_position), "quat": [q.x, q.y, q.z, q.w], "linear": arr(body.linear_velocity), "mass": body.mass, "radius": (body.get_child(0).shape as CylinderShape3D).radius})
    return result

func _exit_tree() -> void:
    for body in wheel_debris.values():
        if is_instance_valid(body):
            body.queue_free()

func _wheel_collider_snapshot() -> Array:
    var result: Array = []
    for index in wheel_shapes.size():
        var shape: CollisionShape3D = wheel_shapes[index]
        result.append({"index": index, "disabled": shape.disabled, "radius": (shape.shape as CylinderShape3D).radius, "pos": arr(global_transform * shape.position)})
    return result
