/** Touch accelerator direction. Keyboard, pilot and flight retain their contracts. */
export const SHIFT_SPEED_LIMIT = 0.3; // m/s; shifting never rewrites physical speed.
export const TOUCH_GEARS = Object.freeze(['P', 'R', 'N', 'D']);
export function touchTransmissionActive(game) {
  return game.effectiveInputMode === 'touch' && game.inCar && !game.aircraft?.active && !game.flight?.active && !game.isRoadsterFlying?.() && !game.robotaxi?.passenger;
}
export function vehicleGear(vehicle) {
  if (vehicle?.parkingBrakeEngaged) return 'P';
  if (TOUCH_GEARS.includes(vehicle?.touchDriveGear)) return vehicle.touchDriveGear;
  if (TOUCH_GEARS.includes(vehicle?.gear)) return vehicle.gear;
  const speed = vehicle?.speed ?? 0;
  return Math.abs(speed) < .15 ? 'P' : speed < 0 ? 'R' : 'D';
}
// Last-mile actuator guard: neither Pilot, held keys, AEB nor a reset can supply
// propulsion while parked. This uses the existing independent handbrake, not a
// velocity/position rewrite or a fragile held-button boolean.
export function parkingBrakeControls(vehicle, input) {
  if (!vehicle?.parkingBrakeEngaged) return input;
  return {...input, throttle: 0, handbrake: true,
    roadsterBoost: false, roadsterAir: false, roadsterRecover: false,
    roadsterAction: input.roadsterAction === 'cancel' ? 'cancel' : '',
    roadsterManualOverride: true, roadsterPitch: 0, roadsterRoll: 0, roadsterYaw: 0,
    roadsterVertical: 0, roadsterForward: 0, roadsterLateral: 0};
}
export function touchGear(game) {
  const vehicle = game.vehicle;
  if (vehicle?.parkingBrakeEngaged) {
    game.touchGearVehicle = vehicle;
    game.selectedTouchGear = 'P';
    vehicle.touchDriveGear = 'P';
    return 'P';
  }
  const active = touchTransmissionActive(game) && !game.autopilot;
  // D/N/R are temporary touch preferences; P is a per-vehicle brake latch and
  // deliberately survives switching input mode, leaving the car and resets.
  if (!active || game.touchGearVehicle !== vehicle) {
    if (game.touchGearVehicle && !game.touchGearVehicle.parkingBrakeEngaged) delete game.touchGearVehicle.touchDriveGear;
    game.touchGearVehicle = vehicle;
    game.selectedTouchGear = 'D';
  }
  const gear = ['D', 'N', 'R'].includes(game.selectedTouchGear) ? game.selectedTouchGear : 'D';
  if (vehicle) {
    if (active) vehicle.touchDriveGear = gear;
    else delete vehicle.touchDriveGear;
  }
  return gear;
}
export function selectTouchGear(game, gear) {
  const current = touchGear(game);
  if (!touchTransmissionActive(game) || !TOUCH_GEARS.includes(gear) || game.paused || game.transition || game.ui?.isPhoneOpen() || document.getElementById('modal')?.open) return false;
  if (current === gear && !game.autopilot) return true;
  // N releases the drive at any speed. P and direction engagement require rest,
  // including a sideways slide reported by the native physics snapshot.
  const speed = Math.hypot(game.vehicle.speed, game.vehicle.lateralSpeed ?? 0);
  if (gear !== 'N' && current !== gear && (!Number.isFinite(speed) || speed > SHIFT_SPEED_LIMIT)) {
    game.ui?.toast(gear === 'P' ? '请先刹停，再挂 P 驻车挡' : '请先刹停，再切换前进 / 倒车挡');
    return false;
  }
  game.manualTakeover();
  // Clear pointer owners as well as input flags: the driver must press the
  // accelerator again after releasing P or selecting a new drive direction.
  game.resetControls();
  game.vehicle.parkingBrakeEngaged = gear === 'P';
  game.vehicle.touchDriveGear = gear;
  game.selectedTouchGear = gear;
  if (gear === 'P') game.ui?.toast('P 驻车已开启 · 挂 N / R / D 解除');
  return true;
}
export function touchThrottle(game, legacy) {
  const gear = touchGear(game);
  if (game.vehicle?.parkingBrakeEngaged) return 0;
  if (!touchTransmissionActive(game)) return legacy;
  if (gear === 'N') return 0;
  if (gear === 'R') return game.touch.go || game.touch.reverse ? -1 : 0;
  return legacy;
}
