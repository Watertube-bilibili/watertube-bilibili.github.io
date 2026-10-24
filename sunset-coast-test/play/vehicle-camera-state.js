// Presentation only: never writes transmission, Pilot, physics or main-camera state.
const gears = ['P', 'R', 'N', 'D'];
export function cameraGear(game) {
  const car = game.vehicle;
  if (!car || car.parkingBrakeEngaged) return 'P';
  if (game.effectiveInputMode === 'touch' && !game.autopilot) {
    if (game.touchGearVehicle === car && gears.includes(game.selectedTouchGear)) return game.selectedTouchGear;
    return gears.includes(car.touchDriveGear) ? car.touchDriveGear : 'D';
  }
  if (gears.includes(car.gear)) return car.gear;
  const speed = Number.isFinite(car.speed) ? car.speed : 0;
  // Keyboard S is a brake while moving forward, not a reverse-gear signal.
  const reverseIntent = game.keys?.KeyS || game.keys?.ArrowDown || game.touch?.reverse;
  return speed < -.15 || Math.abs(speed) <= .15 && reverseIntent ? 'R' : speed > .15 ? 'D' : 'P';
}

export function cameraContext(game, document = globalThis.document) {
  const driving = !!(game.inCar && game.vehicle && !game.transition &&
    !game.aircraft?.active && !game.flight?.active && !game.robotaxi?.passenger && !game.isRoadsterFlying?.());
  return {vehicle: game.vehicle, driving, reverse: driving && cameraGear(game) === 'R',
    suspended: !!(game.paused || game.photoMode?.active || game.ui?.isPhoneOpen?.() ||
      document?.hidden || document?.getElementById?.('modal')?.open || game.physics?.ready === false)};
}

export class VehicleCameraState {
  constructor() { this.vehicle = null; this.reset(); }
  reset() { this.manualView = null; this.reverseView = null; this.wasReverse = false; this.view = null; this.expanded = false; }
  update(context) {
    if (this.vehicle !== context.vehicle || !context.driving) this.reset();
    this.vehicle = context.vehicle;
    if (context.reverse && !this.wasReverse) this.reverseView = 'rear';
    if (!context.reverse) this.reverseView = null;
    this.wasReverse = context.reverse;
    this.view = context.driving && !context.suspended ? (context.reverse ? this.reverseView : this.manualView) : null;
    return this.view;
  }
  select(view) {
    if (!['rear', 'surround'].includes(view)) return;
    this.manualView = view;
    if (this.wasReverse) this.reverseView = view;
  }
  close() {
    this.manualView = null; this.reverseView = null; this.view = null; this.expanded = false;
    // wasReverse is intentionally preserved: close lasts until the next R engagement.
  }
}

export function cameraBudget(profile = {}, expanded = false) {
  const mobile = profile.mobile === true;
  return {maxWidth: mobile ? (expanded ? 480 : 384) : (expanded ? 640 : 480),
    interval: mobile || profile.quality === 'low' ? 100 : 1000 / 15};
}

// Bicycle-model rear-bumper path. This is an estimate, not a collision sensor.
export function reverseGuidePoint(car, distance, side = 0) {
  const wheelBase = Math.max(1, car.wheelBase || 2.7), rearAxle = car.rearAxle ?? wheelBase / 2;
  const halfLength = (car.dimensions?.length ?? wheelBase + 1.7) / 2;
  const steer = Math.max(-.65, Math.min(.65, car.steer || 0));
  const curvature = Math.tan(steer) / wheelBase, yaw = -curvature * distance;
  const x = Math.abs(curvature) < .00001 ? 0 : (Math.cos(curvature * distance) - 1) / curvature;
  const z = Math.abs(curvature) < .00001 ? distance : Math.sin(curvature * distance) / curvature;
  const overhang = halfLength - rearAxle, width = (car.halfWidth ?? (car.dimensions?.width ?? 1.9) / 2) + .12;
  return {x: x + overhang * Math.sin(yaw) + side * width * Math.cos(yaw),
    z: rearAxle + z + overhang * Math.cos(yaw) - side * width * Math.sin(yaw)};
}
