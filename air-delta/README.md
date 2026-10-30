# Local Roadster and motorcycle integration

This source candidate preserves the latest browser-world save and lifecycle fixes. It is not a public release and does not enable Roadster, motorcycles, aircraft or special flight maneuvers in browser-world save slots.

## Behavior

The explicit localhost preview can enable Roadster manual flight with `physics=browser&preview=1&map=estuary&air=1`. Add `delivery=1` to use the existing isolated local delivery save, and `moto=1` to enable the recovered motorcycle adapter. `air` and `moto` must appear once and equal `1`. Public hosts and browser-world slot URLs cannot enable these options. Full `roadsterFlight`, `roadsterManeuvers`, and `aircraft` capabilities remain false.

Three Roadster variants retain their authored GLB, tire/suspension rendering, instance identity, battery and air inventory. The local adapter handles manual Rocket takeoff, control and landing using shared finite rigid-body contacts. Air inventory consumes delivered thrust and parked refill occurs once. The recovered cold-asset preflight is merged without replacing current world routing.

The current independent-slot control preferences, rejection of legacy careers before browser-slot mutation, truthful preview release metadata, Game, browser-world policy, slot handling, region validator, startup-failure propagation, `physicsReady` wait and write gates remain unchanged from the integration owner. The physics adapter preserves the single BFCache reload owner. The local QA recorder and its POST endpoint are not included.

## Validation

After incorporating the integration owner's latest startup-failure fix:

- Air, motorcycle, real GLB, cold-asset, identity, native reserve numerical reference and entry-policy tests: 64 passed, 0 failed/skipped. See `evidence/air-moto-cold-assets-tests.log`.
- Lifecycle, default backend, save, camera and related regression tests: 187 passed, 0 failed/skipped. See `evidence/lifecycle-and-default-regression.log`.
- The suites overlap; their counts should not be added as a unique test count.
- The native reserve test compares 24 stored Godot reference outputs; it did not run Godot in this task.
- No new browser, real-device or public deployment acceptance was performed for this merged source.

## Reproduction and preservation

`evidence/AIR-MERGE-MANIFEST.json` records the exact 24 changed paths, predecessor hashes and result hashes. `evidence/AIR-SOURCE.patch` passes `git apply --check` against the current assembled baseline. `apply-air-delta.py --base BASE --destination NEW_DIRECTORY` verifies each predecessor and copies the changes into a fresh directory; it refuses overwriting an existing destination.

The `index.html` import map includes content hashes for all new physics modules and refreshed hashes for changed modules. The source still contains the recoverable native backend; this candidate is not a static deployment bundle.

## Remaining acceptance

Manual flight is still a local experiment. The existing browser-world save policy intentionally rejects these vehicles, including parked/owned unsupported vehicles. Aircraft, automatic Rocket maneuvers, full six-degree midair save, structural wheel detachment and unified structural-body contact ownership remain incomplete. The recovered separate GUI evidence is limited to Rocket and was measured on software rendering at roughly 1–2 FPS; it is not performance acceptance of this new merge.
