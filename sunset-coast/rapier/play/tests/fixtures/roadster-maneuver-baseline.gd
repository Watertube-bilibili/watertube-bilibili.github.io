# Token-equivalent recovery of the shipped 58a961b5 PCK controller.
# Retained unchanged for original vault/spin equivalence tests.
extends RefCounted


const MAX_OBSTACLE_HEIGHT : = 3.5
const MAX_SCAN : = 28.0
const CRUISE_SPEED : = 3.2
const CAR_SIZE : = Vector3 ( 2.9 , 1.4 , 5.8 )
const SPIN_RADIUS : = 3.25
var kind : = ""
var phase : = ""
var status : = "idle"
var reason : = ""
var serial : = 0
var elapsed : = 0.0
var phase_time : = 0.0
var scan_time : = 0.0
var progress : = 0.0
var angle : = 0.0
var start : = Vector3 . ZERO
var goal : = Vector3 . ZERO
var heading : = Vector3 . FORWARD
var cruise_y : = 0.0
var landing_y : = 0.0
var last_serial : = 0
var emergency_brake : = false
var code : = "IDLE"
var preparation_grounded : = false
var preparation_limit : = 5.0
const MAX_BRAKE_SCAN : = 100.0

func active ( ) -> bool :
    return status == "active"

func reset ( ) -> void :
    kind = ""
    phase = ""
    status = "idle"
    code = "IDLE"
    reason = ""
    progress = 0.0
    angle = 0.0
    emergency_brake = false

func _ray ( space : PhysicsDirectSpaceState3D , a : Vector3 , b : Vector3 , rid : RID ) -> Dictionary :
    var query : = PhysicsRayQueryParameters3D . create ( a , b , 3 , [ rid ] )
    query . hit_from_inside = true
    return space . intersect_ray ( query )

func _clear ( space : PhysicsDirectSpaceState3D , a : Vector3 , b : Vector3 , rid : RID , sphere : = false , orientation : Variant = null ) -> bool :
    var query : = PhysicsShapeQueryParameters3D . new ( )
    if sphere :
        var shape : = SphereShape3D . new ( )
        shape . radius = SPIN_RADIUS
        query . shape = shape
    else :
        var shape : = BoxShape3D . new ( )
        shape . size = CAR_SIZE
        query . shape = shape
    var basis : Basis = orientation if orientation is Basis else Basis . looking_at ( heading , Vector3 . UP )
    query . transform = Transform3D ( basis , a + ( Vector3 . ZERO if sphere else basis . y * 0.15 ) )
    query . collision_mask = 3
    query . exclude = [ rid ]
    query . margin = 0.06
    if not space . intersect_shape ( query , 1 ) . is_empty ( ) :
        return false
    query . motion = b - a
    var cast : = space . cast_motion ( query )
    return cast . size ( ) == 2 and cast [ 0 ] >= 0.9999

func _surface ( space : PhysicsDirectSpaceState3D , center : Vector3 , base_y : float , rid : RID ) -> Dictionary :


    var right : = heading . cross ( Vector3 . UP )
    var low : = INF
    var high : = - INF
    for x in [ -1.4 , -0.7 , 0.0 , 0.7 , 1.4 ] :
        for z in [ -2.8 , -1.4 , 0.0 , 1.4 , 2.8 ] :
            var p : Vector3 = center + right * x + heading * z
            var hit : = _ray ( space , Vector3 ( p . x , base_y + 7.0 , p . z ) , Vector3 ( p . x , base_y - 3.0 , p . z ) , rid )
            if hit . is_empty ( ) or hit . normal . y < 0.96 or hit . collider is RigidBody3D :
                return { }
            var y : float = hit . position . y
            if y < -0.2 or absf ( y - base_y ) > 0.55 :
                return { }
            low = minf ( low , y )
            high = maxf ( high , y )
    if high - low > 0.18 :
        return { }
    return { "y" : high }

func _refuse ( message : String , diagnostic : = "SPACE_UNSAFE" ) -> Dictionary :
    status = "rejected"
    code = diagnostic
    phase = ""
    progress = 0.0
    angle = 0.0
    reason = message
    return { }

func _plan ( body : RigidBody3D , state : PhysicsDirectBodyState3D , requested : String , grounded : bool , altitude : float , mode : String ) -> Dictionary :
    kind = requested
    var basis : = state . transform . basis . orthonormalized ( )
    var pos : = state . transform . origin
    if state . linear_velocity . slide ( Vector3 . UP ) . length ( ) > 2.0 or absf ( state . linear_velocity . y ) > 0.8 :
        return _refuse ( "尚未刹稳，请松开驾驶输入后重试" , "NOT_SETTLED" )
    if basis . y . y < 0.97 or state . angular_velocity . length ( ) > 0.35 :
        return _refuse ( "姿态还未稳定，请按 X 回正后重试" , "ATTITUDE_UNSTABLE" )
    if requested == "vault" and ( not grounded or mode != "road" ) :
        return _refuse ( "智能越障请从地面开始" , "VAULT_GROUND_REQUIRED" )
    if mode not in [ "road" , "air" ] :
        return _refuse ( "请先完成回正；空中可直接选择转圈" , "MODE_BUSY" )
    var space : = state . get_space_state ( )
    var rid : = body . get_rid ( )
    heading = ( - basis . z ) . slide ( Vector3 . UP ) . normalized ( )
    start = pos
    goal = pos
    var base_y : = pos . y - altitude - 0.72
    landing_y = base_y
    if requested == "spin" :


        if altitude > 55.0 :
            return _refuse ( "离地过高或下方地形未载入，请先下降" , "SPIN_ALTITUDE" )
        cruise_y = maxf ( pos . y , landing_y + 6.0 )
        if cruise_y - landing_y > 55.0 :
            return _refuse ( "高度过高，请先下降" , "SPIN_ALTITUDE" )
        goal . y = cruise_y
        if not _clear ( space , pos , goal , rid , false , basis ) or not _clear ( space , goal , goal , rid , true ) :
            return _refuse ( "上方或车身周围不足 3.25 米，不能安全转圈" , "SPIN_CLEARANCE" )
    else :
        var origin_pad : = _surface ( space , pos , base_y , rid )
        if origin_pad . is_empty ( ) :
            return _refuse ( "起飞地面坡度或凹凸过大，请移到平整路面" , "VAULT_LAUNCH_SUPPORT" )
        landing_y = float ( origin_pad . y )
        var nearest : = INF
        var right : = heading . cross ( Vector3 . UP )

        for x in [ -1.2 , -0.6 , 0.0 , 0.6 , 1.2 ] :
            for y in [ 0.25 , 0.65 , 1.1 ] :
                var a : Vector3 = Vector3 ( pos . x , base_y + y , pos . z ) + right * x + heading * 2.9
                var hit : = _ray ( space , a , a + heading * 17.1 , rid )
                if not hit . is_empty ( ) :
                    nearest = minf ( nearest , ( hit . position - pos ) . dot ( heading ) )
        if not is_finite ( nearest ) :
            return _refuse ( "前方 20 米内未识别到可越过的障碍" , "NO_OBSTACLE" )
        if nearest < 5.0 :
            return _refuse ( "离障碍太近，请后退留出起飞空间" , "OBSTACLE_TOO_CLOSE" )
        var found : = false
        for i in range ( int ( ceil ( nearest + 5.0 ) ) , int ( MAX_SCAN ) + 1 ) :
            var candidate : = pos + heading * float ( i )
            var pad : = _surface ( space , candidate , base_y , rid )
            if not pad . is_empty ( ) :
                goal = candidate
                landing_y = float ( pad . y )
                found = true
                break
        if not found :
            return _refuse ( "障碍后方没有可用的完整落地区域" , "NO_LANDING_PAD" )
        var highest : = base_y


        var distance : = ( goal - pos ) . length ( )
        for i in range ( int ( ceil ( distance / 0.65 ) ) + 1 ) :
            for x in [ -1.4 , -0.7 , 0.0 , 0.7 , 1.4 ] :
                var p : Vector3 = pos + heading * minf ( distance , i * 0.65 ) + right * x
                var hit : = _ray ( space , Vector3 ( p . x , base_y + 80.0 , p . z ) , Vector3 ( p . x , base_y - 1.0 , p . z ) , rid )
                if hit . is_empty ( ) :
                    return _refuse ( "航线下方没有连续地面，不能安全越障" , "CORRIDOR_UNSUPPORTED" )
                highest = maxf ( highest , hit . position . y )
        if highest - base_y > MAX_OBSTACLE_HEIGHT :
            return _refuse ( "障碍过高或上方有遮挡，无法安全越过" , "OBSTACLE_TOO_HIGH" )
        cruise_y = maxf ( base_y + 3.8 , highest + 2.1 )
        var launch : = Vector3 ( pos . x , cruise_y , pos . z )
        var crossing : = Vector3 ( goal . x , cruise_y , goal . z )
        var touchdown : = Vector3 ( goal . x , landing_y + 0.72 , goal . z )
        if not _clear ( space , pos , launch , rid ) or not _clear ( space , launch , crossing , rid ) or not _clear ( space , crossing , touchdown , rid ) :
            return _refuse ( "起飞、越障航线或落地通道被遮挡" , "PATH_BLOCKED" )
    kind = requested
    phase = "lift"
    status = "active"
    code = "EXECUTING"
    reason = "正在抬升并检查航线" if kind == "vault" else "正在抬升至安全转圈高度"
    elapsed = 0.0
    phase_time = 0.0
    scan_time = 0.0
    progress = 0.0
    angle = 0.0
    emergency_brake = false
    return { "started" : true }

func _stop ( message : String , land : = false , brake : = true , diagnostic : = "CANCELLED" ) -> Dictionary :
    status = "cancelled"
    code = diagnostic
    phase = ""
    reason = message
    emergency_brake = brake
    return { "stopped" : true , "land" : land , "braking" : brake }

func _braking_clear ( body : RigidBody3D , state : PhysicsDirectBodyState3D , on_ground : bool ) -> bool :
    var velocity : = state . linear_velocity . slide ( Vector3 . UP )
    var speed : = velocity . length ( )
    if speed < 0.6 and absf ( state . linear_velocity . y ) < 0.35 :
        return true


    var distance : = speed * speed / 12.0 + speed * 0.25 + 0.5
    if distance > MAX_BRAKE_SCAN :
        return false
    var space : = state . get_space_state ( )
    var rid : = body . get_rid ( )
    var pos : = state . transform . origin
    var direction : = velocity . normalized ( ) if speed > 0.1 else heading
    if not on_ground :
        var vertical : = state . linear_velocity . y
        var rise : = signf ( vertical ) * ( vertical * vertical / 12.0 + absf ( vertical ) * 0.2 )


        var basis : = Basis . looking_at ( heading , Vector3 . UP )
        var relative : = basis . transposed ( ) * state . transform . basis
        var projected : = relative . x . abs ( ) * CAR_SIZE . x + relative . y . abs ( ) * CAR_SIZE . y + relative . z . abs ( ) * CAR_SIZE . z
        var shape : = BoxShape3D . new ( )
        shape . size = Vector3 ( maxf ( CAR_SIZE . x , projected . x ) , maxf ( CAR_SIZE . y , projected . y ) + absf ( rise ) , maxf ( CAR_SIZE . z , projected . z ) ) + Vector3 . ONE * 0.12
        var query : = PhysicsShapeQueryParameters3D . new ( )
        query . shape = shape
        query . transform = Transform3D ( basis , pos + Vector3 . UP * ( 0.15 + rise * 0.5 ) )
        query . collision_mask = 3
        query . exclude = [ rid ]
        query . margin = 0.06
        if not space . intersect_shape ( query , 1 ) . is_empty ( ) :
            return false
        query . motion = direction * distance
        var cast : = space . cast_motion ( query )
        return cast . size ( ) == 2 and cast [ 0 ] >= 0.9999


    var previous : = pos
    var ground_y : = pos . y - 0.72
    var count : = maxi ( 1 , int ( ceil ( distance / 1.25 ) ) )
    for i in range ( count + 1 ) :
        var sample : = pos + direction * distance * float ( i ) / float ( count )
        var hit : = _ray ( space , Vector3 ( sample . x , ground_y + 1.3 , sample . z ) , Vector3 ( sample . x , ground_y - 1.3 , sample . z ) , rid )
        if hit . is_empty ( ) or hit . collider is RigidBody3D or hit . normal . y < 0.96 or absf ( hit . position . y - ground_y ) > 0.4 :
            return false
        ground_y = hit . position . y
        sample . y = ground_y + 0.72
        var forward : = heading . slide ( hit . normal ) . normalized ( )
        var basis : = Basis . looking_at ( forward , hit . normal )
        if not _clear ( space , previous , sample , rid , false , basis ) :
            return false
        previous = sample
    return true

func _prepare ( body : RigidBody3D , state : PhysicsDirectBodyState3D , requested : String , grounded : bool , mode : String ) -> Dictionary :
    kind = requested
    var planar_speed : = state . linear_velocity . slide ( Vector3 . UP ) . length ( )
    if absf ( state . linear_velocity . y ) > 8.0 :
        return _refuse ( "垂直速度过大，请先稳住升降" , "VERTICAL_SPEED" )
    if state . transform . basis . y . y < 0.85 or state . angular_velocity . length ( ) > 1.2 :
        return _refuse ( "请先按 X 回正，再启动一键动作" , "ATTITUDE_UNSTABLE" )
    if requested == "vault" and ( not grounded or mode != "road" ) :
        return _refuse ( "智能越障请从地面开始；空中可直接转圈" , "VAULT_GROUND_REQUIRED" )
    if mode not in [ "road" , "air" , "landing" ] :
        return _refuse ( "请先完成回正" , "MODE_BUSY" )
    heading = ( - state . transform . basis . z ) . slide ( Vector3 . UP ) . normalized ( )
    preparation_grounded = grounded and mode == "road"
    var braking_distance : = planar_speed * planar_speed / 12.0 + planar_speed * 0.25 + 0.5
    if not _braking_clear ( body , state , preparation_grounded ) :
        emergency_brake = true
        return _refuse ( "需要约 %.0f 米连续刹停空间；前方有障碍、断路或超出 100 米检查范围，正在刹车" % braking_distance , "BRAKE_CLEARANCE" )
    preparation_limit = 3.5 + planar_speed / 6.0
    kind = requested
    phase = "prepare"
    status = "active"
    code = "PREPARING"
    reason = "已接管，正在刹稳；松开原有按键后可手动接管"
    preparation_grounded = grounded and mode == "road"
    heading = ( - state . transform . basis . z ) . slide ( Vector3 . UP ) . normalized ( )
    start = state . transform . origin
    goal = start
    progress = 0.0
    angle = 0.0
    elapsed = 0.0
    phase_time = 0.0
    emergency_brake = false
    return { "started" : true }

func _manual ( controls : Dictionary ) -> bool :
    if bool ( controls . get ( "roadsterManualOverride" , false ) ) or bool ( controls . get ( "roadsterRecover" , false ) ) or bool ( controls . get ( "roadsterAirBrake" , false ) ) :
        return true
    for key in [ "roadsterForward" , "roadsterLateral" , "roadsterVertical" , "roadsterYaw" , "roadsterPitch" , "roadsterRoll" ] :
        if absf ( float ( controls . get ( key , 0.0 ) ) ) > 0.02 :
            return true
    return false

func step ( body : RigidBody3D , state : PhysicsDirectBodyState3D , controls : Dictionary , grounded : bool , altitude : float , mode : String , healthy : bool , trim : String ) -> Dictionary :
    var raw_serial : Variant = controls . get ( "roadsterActionSerial" , 0 )
    var incoming : = int ( raw_serial ) if ( raw_serial is float or raw_serial is int ) and is_finite ( float ( raw_serial ) ) else 0
    var action : = str ( controls . get ( "roadsterAction" , "" ) )
    if incoming > last_serial :
        last_serial = incoming
        serial = incoming
        if action == "cancel" :
            if active ( ) :
                return _stop ( "已取消，驾驶员接管" , bool ( controls . get ( "roadsterCancelLanding" , false ) ) )
        elif action in [ "vault" , "spin" ] :
            if active ( ) :
                return { }
            if trim != "rocket" :
                return _refuse ( "仅 Rocket 配置支持智能空中特技" , "TRIM_UNSUPPORTED" )
            if not healthy :
                return _refuse ( "动力损坏或车辆电量耗尽" , "NO_POWER" )
            _prepare ( body , state , action , grounded , mode )
    if not active ( ) :
        if emergency_brake and healthy and not _manual ( controls ) and state . linear_velocity . slide ( Vector3 . UP ) . length ( ) > 0.08 :
            return { "groundPrepare" : true , "acceleration" : ( - state . linear_velocity . slide ( Vector3 . UP ) * 4.0 ) . limit_length ( 8.0 ) } if grounded and mode == "road" else { "braking" : true }
        emergency_brake = false
        return { }
    if not healthy :
        return _stop ( "动力中断，特技已取消" , false , false , "NO_POWER" )
    if _manual ( controls ) :
        return _stop ( "新的手动操作已接管" , false , false , "MANUAL_OVERRIDE" )
    var dt : = state . step
    elapsed += dt
    phase_time += dt
    scan_time += dt
    if elapsed > 30.0 :
        return _stop ( "动作超时，已转为悬停，请手动接管" )
    var pos : = state . transform . origin
    if phase == "prepare" :
        var planar : = state . linear_velocity . slide ( Vector3 . UP )
        if phase_time > preparation_limit :
            return _stop ( "未能刹稳，请先停车或悬停后重试" , false , true , "PREPARE_TIMEOUT" )
        if planar . length ( ) < 0.6 and absf ( state . linear_velocity . y ) < 0.35 and state . transform . basis . y . y > 0.97 and state . angular_velocity . length ( ) < 0.3 :
            _plan ( body , state , kind , grounded , altitude , mode )
            if not active ( ) :
                return { }
        else :
            var braking : = ( - planar * 4.0 ) . limit_length ( 8.0 )
            reason = "正在自动刹稳 %.0f km/h · 随后检查%s；新输入可接管" % [ planar . length ( ) * 3.6 , "障碍与落地" if kind == "vault" else "转圈空间" ]
            if scan_time > 0.1 :
                scan_time = 0.0
                if not _braking_clear ( body , state , preparation_grounded and grounded ) :
                    return _stop ( "刹停空间出现遮挡，已中止特技并继续刹车，请接管" , false , true , "PREPARE_BLOCKED" )
            if preparation_grounded and grounded :
                return { "groundPrepare" : true , "acceleration" : braking }
            return { "controlled" : true , "vertical" : 0.0 , "acceleration" : braking , "roll" : 0.0 , "level" : true , "landing" : false }
    var target : = Vector3 ( start . x , cruise_y , start . z ) if phase == "lift" else Vector3 ( goal . x , cruise_y , goal . z )
    if phase == "land" :
        target . y = landing_y + 0.72
    if scan_time > 0.1 :
        scan_time = 0.0
        var space : = state . get_space_state ( )
        var rid : = body . get_rid ( )
        if phase in [ "spin" , "settle" ] and kind == "spin" :
            if not _clear ( space , pos , pos , rid , true ) :
                return _stop ( "转圈空间出现障碍，已停止动作，请接管" )
        else :
            if not _clear ( space , pos , target , rid , false , state . transform . basis if phase == "lift" else null ) :
                return _stop ( "航线出现障碍，已悬停，请接管" )
        if phase == "land" and _surface ( space , goal , landing_y , rid ) . is_empty ( ) :
            return _stop ( "落地区域已不安全，已悬停，请接管" )
    var delta : = target - pos
    var planar : = state . linear_velocity . slide ( Vector3 . UP )
    var desired_planar : = delta . slide ( Vector3 . UP ) * 1.5
    desired_planar = desired_planar . limit_length ( CRUISE_SPEED )
    var acceleration : = ( ( desired_planar - planar ) * 2.8 ) . limit_length ( 8.0 )
    var vertical : = clampf ( delta . y * 1.7 , -1.5 , 3.0 )
    var rolling : = false
    var landing : = phase == "land"
    if phase == "lift" and absf ( delta . y ) < 0.18 and absf ( state . linear_velocity . y ) < 0.4 and delta . slide ( Vector3 . UP ) . length ( ) < 0.2 :
        phase = "spin" if kind == "spin" else "cross"
        phase_time = 0.0
        reason = "正在完成一周翻滚" if kind == "spin" else "正在越过已识别障碍"
    elif phase == "cross" :
        progress = clampf ( 0.2 + 0.6 * ( 1.0 - delta . slide ( Vector3 . UP ) . length ( ) / maxf ( 1.0 , ( goal - start ) . length ( ) ) ) , 0.2 , 0.8 )
        if delta . slide ( Vector3 . UP ) . length ( ) < 0.18 and planar . length ( ) < 0.35 :
            phase = "land"
            phase_time = 0.0
            reason = "落地区域已确认，正在缓降"
    elif phase == "spin" :
        angle += state . angular_velocity . dot ( - state . transform . basis . z . normalized ( ) ) * dt
        progress = clampf ( angle / TAU , 0.0 , 1.0 )
        rolling = angle < TAU + 0.02
        if not rolling :
            phase = "settle"
            phase_time = 0.0
            reason = "一周转圈完成，正在回正"
    elif phase == "settle" and state . transform . basis . y . y > 0.995 and state . angular_velocity . length ( ) < 0.15 :
        status = "complete"
        code = "COMPLETE"
        phase = ""
        reason = "转圈完成，已回正悬停；T 可缓降"
        progress = 1.0
        return { "finished" : true }
    elif phase == "land" :
        vertical = -1.3 if altitude > 1.4 else -0.55
        if grounded and state . transform . basis . y . y > 0.98 and absf ( state . linear_velocity . y ) < 0.8 :
            if phase_time > 0.4 :
                status = "complete"
                code = "COMPLETE"
                phase = ""
                reason = "越障完成，已安全落地"
                progress = 1.0
                return { "finished" : true , "landed" : true }
        else :
            phase_time = 0.0
    return { "controlled" : true , "vertical" : vertical , "acceleration" : acceleration , "roll" : 1.0 if rolling else 0.0 , "level" : not rolling , "landing" : landing }

func snapshot ( ) -> Dictionary :
    return { "kind" : kind , "phase" : phase , "status" : status , "reason" : reason , "progress" : progress , "serial" : serial , "angle" : angle , "code" : code }
