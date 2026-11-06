# Roadster-only four-contact tire rotation model. These are game parameters,
# not Tesla engineering data. Body pose and velocity remain owned by Godot.
extends RefCounted

const WHEEL_INERTIA := 2.0 # kg m^2, assumed effective wheel inertia
const PEAK_SLIP := 0.10
const SLIP_SPEED_FLOOR := 2.0 # regularizes slip near standstill
const TCS_RESERVE := 0.90
var motor_free_surface_speed := 88.0 # derived from game speed limit, not a Tesla RPM claim
var radii := [0.389, 0.389, 0.389, 0.389]
var angular_speeds := [0.0, 0.0, 0.0, 0.0]
var angles := [0.0, 0.0, 0.0, 0.0]
var slips := [0.0, 0.0, 0.0, 0.0]
var loads := [0.0, 0.0, 0.0, 0.0]
var forces := [Vector2.ZERO, Vector2.ZERO, Vector2.ZERO, Vector2.ZERO]
var contacts := [false, false, false, false]
var tcs := [false, false, false, false]

func configure(config: Dictionary) -> void:
    motor_free_surface_speed = maxf(20.0, float(config.get("maxSpeed", 73.0)) + 15.0)
    var geometry: Array = config.get("wheelOffsets", [])
    if geometry.size() == 4:
        for i in 4:
            if geometry[i].size() >= 4:
                radii[i] = clampf(float(geometry[i][3]), 0.15, 1.0)

func reset(speed := 0.0) -> void:
    for i in 4:
        angular_speeds[i] = speed / radii[i]
        angles[i] = 0.0
    begin_step()

func begin_step() -> void:
    for i in 4:
        contacts[i] = false
        slips[i] = 0.0
        loads[i] = 0.0
        forces[i] = Vector2.ZERO
        tcs[i] = false

func contact(index: int, longitudinal: float, lateral_force: float,
        drive_force: float, brake_force: float, normal_load: float,
        tire_limit: float, nominal_grip: float, quarter_mass: float, dt: float, tcs_enabled: bool) -> Vector2:
    contacts[index] = true
    loads[index] = normal_load
    var radius: float = radii[index]
    var old_omega: float = angular_speeds[index]
    var slip_scale := maxf(SLIP_SPEED_FLOOR, absf(longitudinal))
    slips[index] = (old_omega * radius - longitudinal) / slip_scale
    var requested_drive := drive_force
    if tcs_enabled:
        # Reserve lateral adhesion before motor torque is admitted. Unlike the
        # thrusters, the motor must use the same friction circle as steering.
        var longitudinal_budget := sqrt(maxf(0.0, tire_limit * tire_limit - minf(absf(lateral_force), tire_limit) ** 2))
        var traction_budget := minf(longitudinal_budget * TCS_RESERVE, quarter_mass * nominal_grip * TCS_RESERVE)
        drive_force = clampf(drive_force, -traction_budget, traction_budget)
        var driven_slip: float = slips[index] * signf(drive_force)
        if driven_slip > PEAK_SLIP * 1.2:
            drive_force *= clampf(PEAK_SLIP / driven_slip, 0.0, 1.0)
        tcs[index] = absf(drive_force) < absf(requested_drive) - 0.01
    # The old `power` field requests acceleration, not published motor torque.
    # Include rotational inertia when translating that request to wheel torque.
    var drive_torque := drive_force * radius + WHEEL_INERTIA * drive_force / maxf(1.0, quarter_mass) / radius
    drive_torque *= clampf((motor_free_surface_speed - absf(old_omega * radius)) / 10.0, 0.0, 1.0)
    var free_omega := old_omega + drive_torque / WHEEL_INERTIA * dt
    var brake_torque := brake_force * radius
    var combined := Vector2.ZERO
    var locked := false
    if tire_limit > 0.001:
        # Solve brake holding torque and tire reaction in the same step. Merely
        # stopping the free wheel first lets the contact spin it back up and
        # makes the final braking tail depend on the physics tick rate.
        var stiffness := tire_limit / PEAK_SLIP
        var body_compliance := slip_scale / stiffness + dt / maxf(1.0, quarter_mass)
        var compliance := body_compliance + dt * radius * radius / WHEEL_INERTIA
        if brake_torque > 0.0:
            var locked_force := Vector2(-longitudinal / body_compliance, lateral_force).limit_length(tire_limit)
            var holding_torque := free_omega * WHEEL_INERTIA / dt - locked_force.x * radius
            if absf(holding_torque) <= brake_torque:
                combined = locked_force
                locked = true
            else:
                free_omega -= signf(holding_torque) * brake_torque / WHEEL_INERTIA * dt
        if not locked:
            # Equal and opposite tire reaction also spins up a wheel when a
            # jet pulls the chassis. No chassis velocity is assigned here.
            var longitudinal_force := (free_omega * radius - longitudinal) / compliance
            combined = Vector2(longitudinal_force, lateral_force).limit_length(tire_limit)
    else:
        free_omega = move_toward(free_omega, 0.0, brake_torque / WHEEL_INERTIA * dt)
    angular_speeds[index] = 0.0 if locked else free_omega - combined.x * radius / WHEEL_INERTIA * dt
    angles[index] += (old_omega + angular_speeds[index]) * 0.5 * dt
    forces[index] = combined
    return combined

func finish_step(drive_force: float, brake_force: float, dt: float, tcs_enabled: bool) -> void:
    for i in 4:
        if contacts[i]:
            continue
        # An unloaded wheel cannot propel the car. TCS cuts its motor, while
        # existing angular momentum remains; brake torque can still stop it.
        var old_omega: float = angular_speeds[i]
        var torque := 0.0 if tcs_enabled else drive_force * float(radii[i])
        torque *= clampf((motor_free_surface_speed - absf(old_omega * float(radii[i]))) / 10.0, 0.0, 1.0)
        var omega := old_omega + torque / WHEEL_INERTIA * dt
        angular_speeds[i] = move_toward(omega, 0.0, brake_force * float(radii[i]) / WHEEL_INERTIA * dt)
        angles[i] += (old_omega + angular_speeds[i]) * 0.5 * dt
        tcs[i] = tcs_enabled and absf(drive_force) > 0.01

func snapshot() -> Dictionary:
    var tire_forces := []
    for force in forces:
        tire_forces.append([force.x, force.y])
    return {"angularSpeeds": angular_speeds.duplicate(), "angles": angles.duplicate(),
        "slipRatios": slips.duplicate(), "normalLoads": loads.duplicate(),
        "forces": tire_forces, "contacts": contacts.duplicate(), "tcsActive": tcs.duplicate()}
