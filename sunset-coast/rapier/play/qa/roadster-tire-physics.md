# Roadster wheel rotation and traction

This is a bounded game-physics improvement, not a validated Tesla vehicle model.
It does not target a forced 0.5-second or 0.59-second launch time.

## Scope and native authority

- Roadster only: four independent angular wheel states, unwrapped wheel angles,
  contact slip ratios, tire forces, normal loads and TCS activity.
- Motor torque, wheel inertia and equal/opposite tire reaction torque determine
  wheel speed. An implicit longitudinal compliance model remains inside Godot.
- Longitudinal and existing lateral tire forces share each contact's existing
  normal-load-dependent friction circle. Unsupported wheels generate no body
  force. Default TCS preserves the old nominal traction ceiling and reduces
  torque when lateral demand or slip consumes that capacity.
- Scalar wheel rotation is simplified; the wheels are not separate rigid bodies.
  Existing four-driven-contact layout, suspension and body collision remain.
  This is not a detailed RWD drivetrain, tire-temperature or ABS simulation.
- Visual wheel angles come from native snapshots, including slip, rather than
  being forced to equal chassis distance divided by radius. JavaScript reads
  telemetry and renders it; it does not set acceleration, body velocity or pose.
- Thrust and Rocket now have separate native profile entries. Both deliberately
  retain the old 19 m/s² ground boost, with the same 65–80 m/s taper. Performance
  retains no ground rocket boost. No thrust increase has been introduced.
- Existing unlimited gas/heat gameplay is unchanged.

## Explicit game assumptions

- Effective wheel inertia: 2 kg m² per wheel.
- Tire compliance reaches the friction budget around 0.10 longitudinal slip;
  a 2 m/s low-speed denominator prevents a singularity at standstill.
- TCS reserves 10% of the nominal longitudinal capacity, additionally respecting
  the per-wheel lateral-force budget. The test-only native `roadsterTcs=false`
  input demonstrates wheelspin; no new public toggle or menu is added.
- Motor torque tapers over 10 m/s of wheel-surface speed below a no-load speed
  derived from the existing game top speed plus 15 m/s. This prevents runaway
  wheel RPM in the no-TCS comparison without clamping chassis speed.
- These values are simulation assumptions, not unpublished Tesla specifications.

## Recovery and safe packaging

The original 58a961b5 native body and force token streams were recovered without
behavior changes. Original compiled code, recovered source execution, and the
same recovered source recompiled by official Godot 4.6.3 produced identical
complete snapshots at 60 and 120 Hz across 10 car/aircraft cases for 20 seconds
(36,000 body snapshots per comparison).

The feature is based on combined-maneuver commit 57dff106 and its e342962e PCK.
The final package retains the combined maneuver GDC/remap byte-for-byte. Its
other native resources are protected by `tire-preserved-resources.json`.

Rebuild with installed official Godot 4.6.3:

    python tools/rebuild-roadster-tires.py --output physics/neon-physics.pck --update-manifest

The tool compiles GDC/remap through `--export-pack Web`, replaces only reviewed
body/force/tire resources, and verifies all remaining resources. No installation,
export template change, full-engine rewrite or source-loading runtime pack is
needed. The separate maneuver builder's preservation lock is updated to include
the reviewed tire resources.

## Verification

    node --test tests/roadster-tire-telemetry.test.mjs tests/roadster-tires-native.test.mjs
    node --test --test-concurrency=1 *.test.mjs tests/*.test.mjs

The native tests cover 60/120 Hz, normal/low grip, TCS on/off, acceleration,
steering, combined braking/steering, reverse, P, brake-to-boost interlock,
propulsion shutoff and unsupported wheels. They verify friction bounds, finite
states, ordinary-car trajectory identity and a default launch change below 5%.
The changed launch time is measured; no stopwatch is used to force velocity.

Launch comparisons use the last stationary native frame and interpolate the
speed threshold, with no rollout-distance deduction. Report 0–60 mph separately
from 0–100 km/h. Fixed-step fixture results are not browser latency measurements
or certified real-vehicle performance. Wheel rotational inertia can slightly
increase launch time without increasing rocket thrust to conceal that effect.

## Measured results (official native engine)

The suite has **181 tests**. Before the braking-tail correction, all passed
when run as 143 in `tests/` and 38 top-level tests. An overlapping parallel run
hit the older aero fixture's 35-second subprocess timeout (180/181), so final
integration should use the serial command above rather than competing Godot
processes. The final correction passed the extended 60/120 Hz native matrix, including
all new stopping assertions. The unchanged recovery equivalence also passed. Recovery checks include 36,000 complete body snapshots
per original-versus-recompiled comparison. The two-rate tire matrix covers all
14 scenarios for 16 seconds each. A second pack build is byte-identical. The resulting runtime pack
is 58,096 bytes, SHA-256
`4385b0f9482c7489963d034acf1f4ee066edca31d8f1ccce19d863fe45dea833`.

Measured 0–100 km/h from the last stationary native frame, in seconds:

| Mode | 60 Hz baseline | 60 Hz tires | 120 Hz baseline | 120 Hz tires |
| --- | ---: | ---: | ---: | ---: |
| Performance | 2.6840 | 2.7676 | 2.6841 | 2.7677 |
| Thrust | 0.9498 | 0.9829 | 0.9499 | 0.9831 |
| Rocket | 0.9498 | 0.9829 | 0.9499 | 0.9831 |

Launches are about 3.1–3.5% slower after adding wheel dynamics. This is explicitly
reported rather than hidden by increasing boost or forcing a timed velocity.
The 5% comparison threshold is a regression-test allowance, not a real-car
accuracy claim. Thrust and Rocket are **not** differently performance-tuned yet.

Low-grip full-throttle peak slip is about 0.091 with TCS versus 43–45 without it
(the latter is a very large ratio at near-zero chassis speed, not a claim about
real Tesla tires). No-TCS wheel speed stays below 233 rad/s. Every contact stays
within its normal-load friction circle; unsupported-wheel force is zero. P
remains stationary, brake/boost cutoffs hold, and ordinary cars have exactly the
same full native snapshots as the baseline. An initial prototype showed a tick-rate-dependent braking tail; that version
must not ship. Solving the static brake holding torque and tire reaction in the
same native step removes the tail without changing chassis velocity or thrust.
After the correction:

| Braking case | 60 Hz time below 0.05 m/s | 120 Hz | 60 Hz distance | 120 Hz |
| --- | ---: | ---: | ---: | ---: |
| Full brake after boost | 6.033 s | 6.017 s | 159.13 m | 158.45 m |
| 65% brake plus steering | 4.533 s | 4.500 s | 62.60 m | 62.06 m |

Both then reach below 0.001 m/s within another 0.284 s and remain stopped:
final speed is below 0.000001 m/s, with zero position change over the last two
seconds. Transient negative longitudinal speed is below 0.0034 m/s in magnitude
(the old model reached 0.0039 m/s); there is no sustained reversal or creep.
The tests require stopping-time differences below 0.1 s, distance differences
below 2%, finite/upright state and no persistent motion. Brake entry speeds differ
slightly because control sampling differs between rates, so these distances are
not certified equal-speed brake tests. This is not an ABS model. Detailed metrics are in
`roadster-tire-native-results.json`.

Native and unit tests do not validate an interactive browser/WebAssembly
session. No browser playtest or publication is claimed here. The existing
maneuver GDC/remap and other unrelated native resources are preserved exactly.

## Public release validation scope

The native tire comparison test, its baseline binary and dependent fixtures are retained with the local validation evidence and are not included in this public release. The 185-test integrated result refers to that complete local candidate, not the smaller public test set. Runtime PCK bytes and all runtime source files are identical to the tested candidate. Existing public tests remain available; this repository alone does not contain the omitted native tire comparison fixture.
