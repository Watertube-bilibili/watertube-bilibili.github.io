/** Touch accelerator direction. Keyboard, pilot and flight controls retain their own contracts. */
export const SHIFT_SPEED_LIMIT = 0.3; // m/s; never rewrite physical speed on a shift.
export function touchTransmissionActive(game) {
  return game.effectiveInputMode === 'touch' && game.inCar && !game.aircraft?.active && !game.flight?.active && !game.isRoadsterFlying?.() && !game.robotaxi?.passenger;
}
export function touchGear(game) {
  // A different vehicle or input mode starts in D; gear is deliberately not saved.
  if (!touchTransmissionActive(game) || game.autopilot || game.touchGearVehicle !== game.vehicle) {
    game.touchGearVehicle = game.vehicle;
    game.selectedTouchGear = 'D';
  }
  return ['D', 'N', 'R'].includes(game.selectedTouchGear) ? game.selectedTouchGear : 'D';
}
export function selectTouchGear(game, gear) {
  const current = touchGear(game);
  if (!touchTransmissionActive(game) || !['D', 'N', 'R'].includes(gear) || game.paused || game.transition || game.ui?.isPhoneOpen() || document.getElementById('modal')?.open || document.body.classList.contains('mobile-drawer-open')) return false;
  if (current === gear && !game.autopilot) return true;
  // N is always available. Any engagement from N or direction change needs near rest.
  if (gear !== 'N' && current !== gear && (!Number.isFinite(game.vehicle.speed) || Math.abs(game.vehicle.speed) > SHIFT_SPEED_LIMIT)) {
    game.ui?.toast('请先刹停，再切换前进 / 倒车挡');
    return false;
  }
  game.manualTakeover();
  // Reset every owner, not just a boolean, so an already held pedal cannot launch
  // in the new direction. The next deliberate press is required after shifting.
  game.resetControls();
  game.selectedTouchGear = gear;
  return true;
}
export function touchThrottle(game, legacy) {
  const gear = touchGear(game);
  if (!touchTransmissionActive(game)) return legacy;
  if (gear === 'N') return 0;
  if (gear === 'R') return game.touch.go || game.touch.reverse ? -1 : 0;
  return legacy;
}
