# Roadster aerodynamic braking regression

## Scope and primary evidence

- Tesla's [Roadster page](https://www.tesla.com/roadster) describes active wings and high-downforce / low-drag modes. The checked page does not give production braking thresholds, wing angles or a drag coefficient for this game to reproduce.
- Tesla's patent application [US20260285418A1](https://patents.justia.com/patent/20260285418), published September 24, 2026, describes brake-actuation-aware wing control and aerobraking. A patent embodiment is not confirmation of a production Roadster's exact implementation or performance.
- The game's dimensions, timing, forces and aerodynamic coefficients remain simulation approximations. Nothing here is a real-vehicle operating instruction.

## Verified defect and narrow fix

The shipped Godot pack already applies a genuine speed-squared aerodynamic resistance for all three Roadster trims. Its service-braking coefficient is 0.0008 versus 0.00012 when coasting, multiplied by native wing deployment and squared planar speed. Ground service braking also changes the native wing pitch from `wing * 0.35` to `wing * 0.6`. Manual and electronic braking both activate it. This is separate from Rocket's thrust-based `roadsterAirBrake` hover control.

The newer reference-video `roadster-aero.js` animation ignored these native outputs and always rendered only the selected road / high-downforce / low-drag pose. That hid the automatic braking action.

The fix composes the native braking-wing output over the selected rear-wing pose, preserves the selected mode and front-panel state, and returns smoothly on release. The cockpit and vehicle-option launcher explicitly show aerodynamic braking. Parked/stationary cars and flight states do not claim ground aero braking. No force, collision, suspension, vehicle-root pose, flight control or P control is altered. No extra drag is added in JavaScript.

The runtime PCK remains byte-for-byte identical:

`58a961b55f569ed6a9c1850515b336efdae1b23f90300d33be7e57ced5ecbf9b`

## Reproducible tests

From repository root:

```sh
node --test sunset-coast/play/tests/roadster-aero.test.mjs sunset-coast/play/tests/roadster-aero-native.test.mjs sunset-coast/play/tests/flight-console.test.mjs
```

The native test requires the already-installed official Godot 4.6.3 binary as `godot`. If unavailable, that test explicitly skips and must be run separately before claiming native verification. It loads the unchanged shipped pack with an external test script. It neither exports nor rewrites the pack and needs no original project or export templates.

The test first calls the actual shipped force method to check speed-squared scaling, zero force at zero speed, manual/electronic equivalence and exclusion of flight/hover. It then runs 12 native rigid bodies: Performance, Thrust and Rocket; manual/electronic brakes; each with aero enabled and a test-only subclass suppressing only aerodynamic resistance. Both arms retain identical brakes, mass, downforce and wing logic. The straight, level fixture locks rotation to isolate longitudinal braking.

Observed at 60 m/s on Godot 4.6.3 (all trims):

- Manual brake: aero on 176.24 m / 6.22 s; aero disabled 196.28 m / 6.70 s.
- Electronic brake: aero on 175.39 m / 6.20 s; aero disabled 195.23 m / 6.68 s.
- Native wing reaches deployment 1.0 and pitch 0.6 rad.

These are regression-fixture measurements, not predicted Roadster performance. JavaScript tests cover the rendered rig transforms, restoration of every mode, frame-rate independence, cockpit text, real UI update handlers and retained P/flight control behavior.

## Remaining verification boundary

Headless Godot integration and JavaScript tests are not an interactive desktop/browser playtest. Actual WebGL rendering, keyboard feel and visible wing clearance still need an in-browser check. Existing high-downforce/low-drag preset force calibration is outside this narrow regression fix; the legacy native wing controller is unchanged.

## Later combination-action update

The separate vault-plus-roll change now recompiles only the maneuver controller in the production PCK. The “unchanged PCK” statement above describes the aerodynamic-braking fix itself, not that later release. The force/body resources used by these aerobraking tests remain byte-for-byte unchanged, and the tests continue to load the current production pack.
