extends RefCounted
# Game balance units, NOT a real vehicle pressure/volume specification.
const CAPACITY := 2400.0
const REFILL_PER_SECOND := 8.0
const LOW_PRESSURE_UNITS := CAPACITY * 0.15
const TORQUE_LEVER_METERS := 2.0
var units := CAPACITY

static func finite_number(value: Variant, fallback: float) -> float:
    if value is float or value is int:
        if is_finite(float(value)):
            return float(value)
    return fallback

func restore(value: Variant) -> void:
    # Malformed persisted fuel must never grant a free full tank.
    units = clampf(finite_number(value, 0.0), 0.0, CAPACITY)

func pressure() -> float:
    return clampf(units / LOW_PRESSURE_UNITS, 0.0, 1.0)

func consume(demand: float, dt: float) -> float:
    # demand = sum(|force|/mass) + |torque|/(mass * authored lever).
    # Integrate delivered impulse, including low-pressure decay analytically.
    if not is_finite(dt) or dt <= 0.0 or dt > 0.1 or not is_finite(demand) or demand <= 0.0:
        return 0.0
    var before := units
    var remaining := dt
    if units > LOW_PRESSURE_UNITS:
        var high_time := minf(remaining, (units - LOW_PRESSURE_UNITS) / demand)
        units -= high_time * demand
        remaining -= high_time
    if remaining > 0.0:
        units *= exp(-demand * remaining / LOW_PRESSURE_UNITS)
    units = clampf(units, 0.0, CAPACITY)
    return clampf((before - units) / (demand * dt), 0.0, 1.0)

func refill(dt: float, grounded: bool, speed: float, angular_speed: float, spraying: bool, upright: bool) -> void:
    if not is_finite(dt) or dt <= 0.0 or dt > 0.1:
        return
    if grounded and upright and not spraying and is_finite(speed) and is_finite(angular_speed) and speed >= 0.0 and speed < 0.25 and angular_speed >= 0.0 and angular_speed < 0.2:
        units = minf(CAPACITY, units + REFILL_PER_SECOND * dt)
