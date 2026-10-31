# Science courseware physics runtime

The courseware uses Godot 4.6.3's real 2D rigid-body physics solver. The HTML page
owns controls, SVG apparatus, timer presentation, and experiment records. The
Godot WebAssembly runtime owns the cart's motion and crossing times.

## Physical model

`cart.gd` creates a `RigidBody2D` with zero damping, locked rotation, and no external
collisions. The ideal ramp's normal reaction removes the normal component of
gravity; the remaining force is `m g sin(angle)` along `(-cos(angle), sin(angle))`.
Thus the cart starts on the right and moves left/down. Coordinates use 1,000 Godot
units per meter. Mass is provided in grams and converted to kilograms.

Godot integrates body position and velocity at 480 fixed physics ticks per second.
The script reads `PhysicsDirectBodyState2D.transform` to measure distance; it does
not calculate a motion path or total travel time from an analytical formula.
Midpoint and finish times are interpolated between actual solver samples. The
semi-implicit solver yields approximately 1 millisecond difference from the exact
continuous-time ideal model at this timestep. Calculations retain internal
precision; the displayed substitutions and final answers explicitly use
approximation signs when rounded.

A fresh release resets transform and velocity in `_integrate_forces`, preventing
old engine state leaking into a subsequent experiment. The experiment id is
returned unchanged with every sample so the page can discard stale events.

## Build

Requires Godot 4.6.3.stable and its official Web single-thread release export
template (web_nothreads_release.zip) installed in the normal export-template
directory. From the repository root:

    python research/compile-physics.py
    python research/sync-engine-catalog-schema.py
    godot --headless --path godot --editor --import --quit
    godot --headless --path godot --export-release Web ../dist/engine/lab.html
    python godot/package_web.py
    python research/stamp-assets.py

The packaging step gzip-compresses the exported 36 MiB WebAssembly into a roughly 9 MiB
lab.wasm.bin. This keeps every asset below static-host upload limits. It also
patches one loader line in the generated lab.js so the engine uses the decompressed
Response supplied by loader.js. No physics code changes during packaging.
Generated standalone HTML/icon assets are removed because the main courseware
page provides the accessible UI.

Asset stamping versions the page scripts, styles, and the runtime's dependent
downloads together so a browser does not combine an old catalog with a new pack.

`dist/engine/loader.js` is hand-authored and retained across exports. The browser
needs WebAssembly, WebGL 2 and the standard DecompressionStream API. Single-thread
export requires no SharedArrayBuffer or cross-origin-isolation headers. Godot's
canvas is 16 by 16 pixels and outside the visible viewport; it does not take focus.
Audio uses the Dummy driver. No service worker is installed.

## Integration contract

Load engine/loader.js after the page controller. It auto-boots and exposes:

- GodotLab.ready: true once the Godot scene has registered its bridge.
- GodotLab.start({length, angle, mass, id}): release a cart.
- GodotLab.reset(): cancel the current run.

Window events:

- godot-ready: runtime ready.
- godot-loading: {loaded, total} compressed download bytes.
- godot-error: {message} on boot failure.
- godot-sample: {id, distance, time, first, second, total, done}. Distance is in
  meters; all times are seconds. First, second, and total are null until their
  respective crossings have occurred.

The original engine license and third-party notices accompany the exported
runtime in dist/engine/LICENSE.txt and dist/engine/COPYRIGHT.txt.

## Full physics catalog evaluation API

`GodotLab.evaluate(model, params)` returns a Promise for a catalog simulation.
Requests are queued so independent rigid-body evaluations cannot overlap.
`model-schema.json` defines the 25 model families, supported scenarios, default
controls, extra scenario-specific controls, and units. The copy under
`dist/engine/` is available to the browser. A catalog record supplies
`modelParams.scenario`; its visible control values override other defaults.

The result has `model`, `values`, `readings`, `process`, `conclusion`, `assumptions`,
`graph`, and `solver`. Model-specific numeric fields are under `values`. Graphs are
plain `[x,y]` point arrays with axis labels. Null represents an undefined or
out-of-model quantity, such as a finite image distance at the focal plane. It must
not be rendered as zero.

The model families intentionally use two different kinds of computation:

* `incline` and `motion`: actual Godot RigidBody2D integration. `dynamic_solver.gd`
  temporarily raises time scale and physics tick rate together, preserving the
  1/480 simulation-second step while returning a 2-second trajectory in roughly
  0.15 wall-clock seconds. It restores engine settings after every request.
  Motion includes uniform motion, inertia, applied force, dry friction, free fall,
  and collision against a static wall. These return
  `trajectory: [[time, signedPosition, signedVelocity], ...]` plus actual elapsed
  time, displacement, total path length, average velocity and mean speed.
* Other families: scientific numerical relationships implemented in GDScript
  (`solvers.gd`, `extra_solvers.gd`, `phase_materials.gd`), not claimed to be native rigid-body features. They include
  geometric optics, circuit networks, calorimetry/enthalpy, hydrostatics,
  mechanical advantage, electricity/magnetism, and explicit qualitative models.
* `energy/pendulum`: a real `RigidBody2D` connected to a static pivot by
  `PinJoint2D`. The engine records the angle and measures periods between
  successive crossings in the same direction. The small-angle formula is
  provided separately as an approximation; it does not generate the trajectory.
* `apparatus_dynamics.gd` and `mechanics_review.gd`: actual rigid bodies for
  paired carts, support removal, descending rolling pendulum, impact and friction,
  elastic return, motor rotation, two-dimensional magnetic deflection, an ideal
  solar motor and indentation against a given resisting force. The rolling
  pendulum currently covers descent only; reverse winding is declared incomplete.
* Dedicated review solvers implement cantilever shapes and frequencies, acoustic
  source versus received signals, multi-surface optical rays, meter wiring and
  ranges, elastic/plastic unloading, hydrostatic measurements and flow continuity.
  Their stated constants and approximations are teaching inputs, not fabricated
  measurements of real instruments.

Phase results include `phaseStates` so a renderer can show changing solid/liquid
fractions during a constant-temperature plateau. Rotating and vibrating scenes
consume their dedicated trajectories rather than a generic progress animation.
The browser's manual stopwatch measures actual elapsed wall-clock time and only
submits a stopped reading to Godot for analysis. Web Audio consumes computed
frequencies for quiet, user-initiated audition; Godot's audio driver stays disabled.

All computations stay inside Godot; the browser only interpolates returned
trajectories for presentation. No browser formula fallback is used.

### Assumptions and interpretation

- Thermal models distinguish heating without phase change, mixing, and the
  water/ice enthalpy model. The latter includes melting/boiling plateaus.
- Lens images at the focal point have no finite image distance. Refraction detects
  total internal reflection instead of clamping it to an invented refracted ray.
- Circuit models are ideal DC networks. Short-circuit current includes an explicit
  source resistance. Filament temperature dependence and LED fixed voltage drop
  are labeled approximations; conductivity comparisons use representative
  resistances and are not claimed as material measurements.
- Molecular diffusion, electroscope deflection and electromagnet strength use
  dimensionless qualitative indicators. They do not invent experimental data.
- Lever inputs are moment arms; work-angle and efficiency validity restrictions
  are retained. Buoyancy distinguishes imposed immersion from floating balance.
- Solar conversion models use input power and efficiency, not fictitious direct
  conversion into a cart's kinetic energy.
- Advanced relationships (e.g. ideal adiabatic gas, magnetic force) are explicitly
  identified as numerical extensions of the junior-classroom qualitative model.

### Verification

Run from the repository root:

    godot --headless --path godot --script ../tests/godot_domain.gd
    godot --headless --path godot --script ../tests/godot_dynamics.gd
    godot --headless --path godot --script ../tests/godot_extra.gd
    godot --headless --path godot --script ../tests/godot_phase_materials.gd

The first verifies independent physical identities, singularities, unit
conversions, phase plateaus and limiting cases. The second verifies actual
solver trajectories against analytical tolerances, mass independence and dry
friction stopping. For browser RPC verification, serve `dist/` at port 8780 and
run `python tests/godot_browser.py` (requires Playwright and Chromium).

Additional endpoint sweep:

    godot --headless --path godot --script ../tests/godot_boundaries.gd

This covers every static schema scenario at default/min/max numeric control
settings and checks for non-finite outputs. Numerical stability checks supplement,
but do not replace, the independent physical identities in the domain suite.
