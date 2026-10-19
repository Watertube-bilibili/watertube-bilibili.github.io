extends RefCounted


const Maneuver = preload ( "res://roadster_maneuver.gd" )
var maneuver : = Maneuver . new ( )
# Separate game profiles, deliberately retaining the existing 19 m/s^2 boost.
# No claimed Tesla 0-60 target is used to force a launch time.
const GROUND_THRUST_PROFILES := {
    "performance": {"acceleration": 0.0, "fadeStartSpeed": 65.0, "fadeEndSpeed": 80.0},
    "thrust": {"acceleration": 19.0, "fadeStartSpeed": 65.0, "fadeEndSpeed": 80.0},
    "rocket": {"acceleration": 19.0, "fadeStartSpeed": 65.0, "fadeEndSpeed": 80.0}
}
var trim : = "performance"
var mode : = "road"

var charge : = 100.0
var heat : = 0.0
var boost : = 0.0
var lift : = 0.0
var wing : = 0.0
var wing_pitch : = 0.0
var altitude : = 0.0
var vertical_speed : = 0.0
var warning : = ""
var previous_air : = false
var previous_recover : = false
var launching : = false
var landing_time : = 0.0
var recovery_time : = 0.0
var airborne_time : = 0.0
var automatic_airborne : = false
var automatic_input_latch : Dictionary = { }
var automatic_cushion_impulse : = 20.0
const AIR_AXES : = [ "roadsterPitch" , "roadsterRoll" , "roadsterYaw" , "roadsterVertical" , "roadsterForward" , "roadsterLateral" ]
var auto_stabilizing : = false
var landing_cushion : = 0.0
var roll_target : = 0.0
var roll_rate : = 0.0
var jet_angular_accel : = Vector3 . ZERO
var jets : Dictionary = { }
const ROLL_RATE : = 3.4
const AUTO_LEVEL_RATE : = 1.15

static func number ( value : Variant , fallback : = 0.0 ) -> float :
    if value is int or value is float :
        var result : = float ( value )
        if is_finite ( result ) :
            return result
    return fallback

static func axis ( controls : Dictionary , key : String ) -> float :
    return clampf ( number ( controls . get ( key , 0.0 ) ) , -1.0 , 1.0 )

func configure ( config : Dictionary ) -> void :
    trim = str ( config . get ( "roadsterTrim" , "performance" ) )
    charge = clampf ( number ( config . get ( "roadsterCharge" ) , 100.0 ) , 0.0 , 100.0 )

func reset ( ) -> void :
    maneuver . reset ( )

    mode = "road"
    previous_air = true
    launching = false
    recovery_time = 0.0
    landing_time = 0.0
    airborne_time = 0.0
    automatic_airborne = false
    automatic_input_latch . clear ( )
    roll_target = 0.0
    jets = { }
    boost = 0.0
    lift = 0.0

func ground_resistance ( planar_speed : float , up_y : float , controls : Dictionary ) -> float :



    if mode in [ "air" , "landing" , "recover" ] or up_y <= 0.65 :
        return 0.0
    var braking : = maxf ( number ( controls . get ( "manualBrake" ) ) , number ( controls . get ( "electronicBrake" ) ) )
    return wing * planar_speed * planar_speed * ( 0.0008 if braking > 0.15 else 0.00012 )

func step ( body : RigidBody3D , state : PhysicsDirectBodyState3D , controls : Dictionary , grounded : bool ) -> void :
    var dt : = clampf ( state . step , 0.0001 , 0.1 )
    var basis : = state . transform . basis . orthonormalized ( )
    var forward : = - basis . z
    var up : = basis . y
    var velocity : = state . linear_velocity
    vertical_speed = velocity . y
    var mass : = body . mass
    var healthy : = number ( controls . get ( "condition" ) , 100.0 ) > 0.0 and number ( controls . get ( "battery" ) , 100.0 ) > 0.0
    var ray : = PhysicsRayQueryParameters3D . create ( state . transform . origin , state . transform . origin - Vector3 . UP * 1000.0 , 1 , [ body . get_rid ( ) ] )
    var hit : = state . get_space_state ( ) . intersect_ray ( ray )
    altitude = maxf ( 0.0 , state . transform . origin . distance_to ( hit . position ) - 0.72 ) if not hit . is_empty ( ) else 1000.0
    var air : = bool ( controls . get ( "roadsterAir" , false ) ) and trim == "rocket"
    var recover : = bool ( controls . get ( "roadsterRecover" , false ) ) and trim == "rocket"
    warning = ""
    boost = 0.0
    lift = 0.0
    landing_cushion = 0.0
    auto_stabilizing = false
    jet_angular_accel = Vector3 . ZERO
    var jet_acceleration : = Vector3 . ZERO
    roll_rate = state . angular_velocity . dot ( forward )
    if air and not previous_air and mode == "road" :
        if healthy and up . y > 0.6 and velocity . length ( ) < 25.0 :
            mode = "air"
            automatic_airborne = false
            roll_target = atan2 ( basis . x . y , basis . y . y )
            launching = grounded or altitude < 1.5
            landing_time = 0.0
        else :
            warning = "起飞条件未满足"
    previous_air = air
    if recover and not previous_recover and mode == "road" and healthy and velocity . length ( ) < 3.0 and altitude < 1.8 :
        mode = "recover"
        recovery_time = 0.0
    previous_recover = recover

    airborne_time = airborne_time + dt if not grounded and altitude > 0.65 else 0.0
    if trim == "rocket" and mode == "road" and healthy and airborne_time >= 0.12 :
        mode = "landing"
        automatic_airborne = true
        automatic_cushion_impulse = 20.0
        automatic_input_latch . clear ( )
        for key in AIR_AXES :
            if absf ( axis ( controls , key ) ) > 0.01 :
                automatic_input_latch [ key ] = axis ( controls , key )
        if bool ( controls . get ( "roadsterAirBrake" , false ) ) :
            automatic_input_latch . roadsterAirBrake = true
        launching = false
        landing_time = 0.0
        roll_target = atan2 ( basis . x . y , basis . y . y )
    var special : = maneuver . step ( body , state , controls , grounded , altitude , mode , healthy , trim )
    if special . get ( "controlled" , false ) :
        mode = "landing" if special . get ( "landing" , false ) else "air"
        launching = false
        automatic_airborne = false
    elif special . get ( "stopped" , false ) :
        mode = "road" if grounded else ( "landing" if special . get ( "land" , false ) else "air" )
    elif special . get ( "finished" , false ) :
        mode = "road" if special . get ( "landed" , false ) else "air"
    if mode == "air" and not air and not maneuver . active ( ) and special . is_empty ( ) :
        mode = "landing"
        launching = false
    if not healthy :
        if mode != "road" :
            mode = "unpowered" if not grounded else "road"
        warning = "动力损坏" if number ( controls . get ( "condition" ) , 100.0 ) <= 0.0 else "车辆电量耗尽"
    if mode == "unpowered" and grounded :
        mode = "road"
    if mode == "landing" :
        landing_time = landing_time + dt if grounded and up . y > 0.7 and absf ( velocity . y ) < 1.0 else 0.0
        if landing_time > 0.3 :
            mode = "road"
    if mode == "recover" :
        recovery_time += dt
        if recovery_time > 3.0 or not recover or up . y > 0.98 and state . angular_velocity . length ( ) < 0.25 :
            mode = "landing" if not grounded else "road"
    if mode == "road" :
        automatic_airborne = false
        automatic_input_latch . clear ( )


    var flight_controls : = controls
    var manual_air_control : = false
    if automatic_airborne :
        flight_controls = controls . duplicate ( )
        for key in automatic_input_latch . keys ( ) :
            var held : = bool ( controls . get ( key , false ) ) if key == "roadsterAirBrake" else axis ( controls , key ) * float ( automatic_input_latch [ key ] ) > 0.001
            if held :
                flight_controls [ key ] = false if key == "roadsterAirBrake" else 0.0
            else :
                automatic_input_latch . erase ( key )
        for key in AIR_AXES :
            manual_air_control = manual_air_control or absf ( axis ( flight_controls , key ) ) > 0.01
        manual_air_control = manual_air_control or bool ( flight_controls . get ( "roadsterAirBrake" , false ) )
    var active : = mode in [ "air" , "landing" , "recover" ] and healthy



    var automatic_fall : = automatic_airborne and mode == "landing" and not air and not recover and not manual_air_control and not bool ( special . get ( "controlled" , false ) )
    if active :
        var vertical : = axis ( flight_controls , "roadsterVertical" )
        if altitude > 2.0 :
            launching = false
        var target_vertical : = vertical * ( 4.0 if vertical >= 0.0 else 2.0 )
        if launching :
            target_vertical = maxf ( target_vertical , 2.6 )
        if mode == "landing" :
            target_vertical = -2.5 if altitude > 6.0 else ( -1.3 if altitude > 1.4 else -0.65 )
        elif mode == "recover" :
            target_vertical = 0.9 if altitude < 1.2 else 0.0
        if special . get ( "controlled" , false ) :
            target_vertical = float ( special . vertical )
        if altitude > 60.0 :
            target_vertical = minf ( target_vertical , - minf ( 2.0 , ( altitude - 60.0 ) * 0.4 ) )
        var cushioning : = mode == "landing" and altitude < 6.0 and velocity . y < 0.0
        var max_lift : = 26.0 if cushioning else 18.0
        var lift_accel : = clampf ( 9.81 + ( target_vertical - velocity . y ) * ( 4.5 if cushioning else 3.5 ) , 0.0 , max_lift )
        if automatic_fall :
            lift_accel = 0.0
            cushioning = altitude < 6.0 and velocity . y < -0.8 and altitude / maxf ( 0.8 , - velocity . y ) < 0.65 and automatic_cushion_impulse > 0.0
            if cushioning :


                var needed : = maxf ( 0.0 , ( velocity . y * velocity . y - 0.64 ) / ( 2.0 * maxf ( 0.12 , altitude - 0.12 ) ) )
                lift_accel = minf ( minf ( 26.0 , 9.81 + needed ) , automatic_cushion_impulse / dt )
                automatic_cushion_impulse = maxf ( 0.0 , automatic_cushion_impulse - lift_accel * dt )
        jet_acceleration += Vector3 . UP * lift_accel
        state . apply_central_force ( Vector3 . UP * mass * lift_accel )
        lift = clampf ( lift_accel / 18.0 , 0.0 , 1.0 )
        landing_cushion = clampf ( ( lift_accel - 9.81 ) / 16.19 , 0.0 , 1.0 ) if cushioning else 0.0
        var heading : = forward . slide ( Vector3 . UP )
        if heading . length_squared ( ) < 0.001 :
            heading = Vector3 . FORWARD
        heading = heading . normalized ( )
        var right : = heading . cross ( Vector3 . UP ) . normalized ( )
        var command_forward : = axis ( controls , "roadsterForward" ) if mode == "air" and not recover else 0.0
        var command_lateral : = axis ( controls , "roadsterLateral" ) if mode == "air" and not recover else 0.0
        var planar : = velocity . slide ( Vector3 . UP )
        var air_brake : = bool ( controls . get ( "roadsterAirBrake" , false ) ) or mode != "air" or recover
        var acceleration : = ( heading * command_forward * 8.0 + right * command_lateral * 5.0 ) . limit_length ( 8.0 )
        if air_brake :
            acceleration = Vector3 . ZERO
        var maneuver_accel : = ( acceleration - planar * ( 1.1 if air_brake else 0.32 ) ) . limit_length ( 20.0 )
        if special . get ( "controlled" , false ) :
            maneuver_accel = special . acceleration
        elif automatic_fall :
            maneuver_accel = Vector3 . ZERO
        elif special . get ( "braking" , false ) :
            maneuver_accel = ( - planar * 4.0 ) . limit_length ( 20.0 )
        jet_acceleration += maneuver_accel
        state . apply_central_force ( maneuver_accel * mass )
        boost = absf ( command_forward ) * 0.6


        var attitude_controls : = flight_controls
        var level_only : = recover or mode == "recover"
        if special . get ( "controlled" , false ) :
            attitude_controls = controls . duplicate ( )
            attitude_controls . roadsterRoll = special . roll
            level_only = bool ( special . level )
        _stabilize ( state , basis , mass , attitude_controls , level_only )
    elif trim != "performance" and healthy and bool ( controls . get ( "roadsterBoost" , false ) ) and grounded and up . y > 0.65 :

        var throttle : = maxf ( 0.0 , axis ( controls , "throttle" ) )
        if throttle > 0.1 and number ( controls . get ( "manualBrake" ) ) < 0.05 and number ( controls . get ( "electronicBrake" ) ) < 0.05 and not bool ( controls . get ( "handbrake" , false ) ) :
            boost = throttle

            var thrust_profile: Dictionary = GROUND_THRUST_PROFILES.get(trim, GROUND_THRUST_PROFILES.performance)
            var boost_accel := forward * float(thrust_profile.acceleration) * boost * clampf((float(thrust_profile.fadeEndSpeed) - velocity.length()) / (float(thrust_profile.fadeEndSpeed) - float(thrust_profile.fadeStartSpeed)), 0.0, 1.0)
            jet_acceleration += boost_accel
            state . apply_central_force ( boost_accel * mass )
    if special . get ( "groundPrepare" , false ) and healthy :
        jet_acceleration += special . acceleration
        state . apply_central_force ( special . acceleration * mass )
    jets = _jet_channels ( basis . transposed ( ) * jet_acceleration , jet_angular_accel )
    var wing_mode : = str ( controls . get ( "roadsterWingMode" , "auto" ) )
    var braking : = maxf ( number ( controls . get ( "manualBrake" ) ) , number ( controls . get ( "electronicBrake" ) ) )
    var automatic : = velocity . length ( ) > 20.0 or braking > 0.15
    var wing_target : = 1.0 if active or braking > 0.15 or wing_mode == "raised" or wing_mode == "auto" and automatic else 0.0
    wing = move_toward ( wing , wing_target , dt * 1.4 )
    wing_pitch = wing * ( 0.6 if braking > 0.15 else 0.35 )
    if grounded and up . y > 0.65 and not active :
        var downforce : = minf ( 2.0 , velocity . length_squared ( ) * 0.0014 ) * wing

        if trim == "performance" and healthy and velocity . length ( ) > 4.0 :
            downforce += 0.45
        state . apply_central_force ( - Vector3 . UP * mass * downforce )

func _stabilize ( state : PhysicsDirectBodyState3D , basis : Basis , mass : float , controls : Dictionary , level_only : bool ) -> void :
    var forward : = - basis . z
    var yaw : = atan2 ( - forward . x , - forward . z )
    var pitch : = 0.0 if level_only else axis ( controls , "roadsterPitch" ) * 0.36
    var roll_input : = 0.0 if level_only else axis ( controls , "roadsterRoll" )
    var feedforward_roll : = 0.0
    if level_only :
        roll_target = 0.0
    elif absf ( roll_input ) > 0.001 :

        feedforward_roll = roll_input * ROLL_RATE
        roll_target = wrapf ( roll_target - feedforward_roll * state . step , - PI , PI )
    else :

        var previous_target : = roll_target
        roll_target = move_toward ( roll_target , 0.0 , AUTO_LEVEL_RATE * state . step )
        feedforward_roll = ( previous_target - roll_target ) / state . step
    auto_stabilizing = level_only or absf ( roll_input ) <= 0.001
    var target : = Basis ( Vector3 . UP , yaw ) * Basis ( Vector3 . RIGHT , pitch ) * Basis ( Vector3 . BACK , roll_target )
    var error : = ( target . get_rotation_quaternion ( ) * basis . get_rotation_quaternion ( ) . inverse ( ) ) . normalized ( )
    if error . w < 0.0 :
        error = - error
    var direction : = Vector3 ( error . x , error . y , error . z )
    var rotation_error : = Vector3 . ZERO
    if direction . length ( ) > 1e-05 :
        rotation_error = direction . normalized ( ) * ( 2.0 * atan2 ( direction . length ( ) , clampf ( error . w , -1.0 , 1.0 ) ) )
    var yaw_rate : = 0.0 if level_only else axis ( controls , "roadsterYaw" ) * 0.8
    var desired_rate : = Vector3 . UP * yaw_rate + forward * feedforward_roll
    var desired_accel : = rotation_error * 10.0 + ( desired_rate - state . angular_velocity ) * 5.0


    var inverse_inertia : = state . inverse_inertia_tensor
    if absf ( inverse_inertia . determinant ( ) ) > 1e-15 :
        var torque : = ( inverse_inertia . inverse ( ) * desired_accel ) . limit_length ( mass * 12.0 )
        state . apply_torque ( torque )
        jet_angular_accel = basis . transposed ( ) * ( inverse_inertia * torque )

func _jet_channels ( local_accel : Vector3 , local_angular : Vector3 ) -> Dictionary :


    return { "up" : clampf ( local_accel . y / 26.0 , 0.0 , 1.0 ) , "down" : clampf ( - local_accel . y / 26.0 , 0.0 , 1.0 ) ,
        "forward" : clampf ( - local_accel . z / 8.0 , 0.0 , 1.0 ) , "reverse" : clampf ( local_accel . z / 8.0 , 0.0 , 1.0 ) ,
        "right" : clampf ( local_accel . x / 8.0 , 0.0 , 1.0 ) , "left" : clampf ( - local_accel . x / 8.0 , 0.0 , 1.0 ) ,
        "pitchUp" : clampf ( local_angular . x / 12.0 , 0.0 , 1.0 ) , "pitchDown" : clampf ( - local_angular . x / 12.0 , 0.0 , 1.0 ) ,
        "rollRight" : clampf ( - local_angular . z / 12.0 , 0.0 , 1.0 ) , "rollLeft" : clampf ( local_angular . z / 12.0 , 0.0 , 1.0 ) ,
        "yawLeft" : clampf ( local_angular . y / 12.0 , 0.0 , 1.0 ) , "yawRight" : clampf ( - local_angular . y / 12.0 , 0.0 , 1.0 ) }

func snapshot ( ) -> Dictionary :
    return { "trim" : trim , "mode" : mode , "charge" : charge , "heat" : heat , "boost" : boost , "lift" : lift , "wing" : wing , "wingPitch" : wing_pitch , "altitude" : altitude , "verticalSpeed" : vertical_speed , "warning" : warning , "jets" : jets , "autoStabilizing" : auto_stabilizing , "automaticAirborne" : automatic_airborne , "landingCushion" : landing_cushion , "rollRate" : roll_rate , "maneuver" : maneuver . snapshot ( ) }
