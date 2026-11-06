# Roadster combined obstacle vault and roll

## Delivered behavior

The Rocket vehicle options include a distinct “越障＋转圈” action. It sends one `vault_spin` request, not two mutually exclusive requests. The original upright vault and stationary aerial roll remain available and unchanged. P, unavailable physics, non-Rocket trims, aircraft contexts and interrupted/modal UI still reject inappropriate requests.

The native maneuver controller first checks braking distance, launch support, obstacle height, an entire landing footprint and ascent/descent channels. For the combined crossing it raises cruise height to at least obstacle top + 3.25 m rolling-envelope radius + 0.45 m, and sweeps that entire envelope along the crossing. It starts the roll as it approaches the obstacle while continuing forward travel. The unchanged native force/torque controller drives every movement. One accumulated revolution must finish, and the car must regain a stable upright attitude, before descent.

The corridor is rechecked during crossing; the descent channel and landing support are rechecked before and during descent. Cancel, a fresh manual input, a newly blocked corridor, a changed landing surface and power loss stop the maneuver. Power loss does not magically prevent a physical fall or collision.

## Source recovery and reproducible Web compilation

The available baseline contained compiled GDScript, not the original project source. Only `roadster_maneuver` was recovered from Godot's token stream. Before changing it, three actual Godot 4.6.3 runs were compared: original PCK, unchanged resource repack, and token-recovered source replacement. Original `vault` and `spin` each produced exactly identical sampled positions, quaternions, linear/angular velocities and maneuver snapshots through 1,800 physics frames.

The recovered baseline is retained as a regression fixture. The modified source is reviewable under `physics/source`. The production pack does NOT rely on loading a new plaintext GDScript resource. The installed official Godot 4.6.3 engine compiles the source using its Web `--export-pack` operation with `script_export_mode=2`. Only the resulting `roadster_maneuver.gdc` and `.gd.remap` are replaced. The other 14 resources, including the force/body controllers, bridge, main scene and project settings, retain their exact original bytes. The WebAssembly binary and loader are unchanged.

Build from repository root:

```sh
python sunset-coast/play/tools/rebuild-roadster-pack.py \
  --output sunset-coast/play/physics/neon-physics.pck --update-manifest
```

This uses only the already-installed official Godot executable; no export-template download, additional installation, guessed bytecode rewrite, browser flags or permissions change is needed. It checks each input PCK entry's MD5, all 14 preserved resource SHA-256 values, the output entries and the exact engine version. Repeated builds produce the same PCK SHA-256.

## Regressions run

```sh
node --test sunset-coast/play/*.test.mjs sunset-coast/play/tests/*.test.mjs
```

The full suite passed 177 tests with zero failures or skips. The native suite loads the production compiled PCK and runs 14 separate real rigid-body scenarios for 2,100 frames at 60 Hz, using the authored Roadster collider dimensions, mass, wheelbase, track and grip. Covered cases:

- Combined crossing and roll over 2.0 m and 3.4 m obstacles, followed by stable landing.
- Full roll clearance refusal in a corridor where the original upright vault still succeeds.
- Missing obstacle and missing landing platform refusal.
- Mid-roll explicit cancellation, fresh manual takeover, new corridor intrusion and changed landing surface.
- Power loss retains real gravity/collision and never reports a successful stunt.
- Repeated requests do not restart the action; old vault and spin still complete.

Observed clear-path combined result: 6.3577 rad accumulated roll; 7.9627 m of forward travel while rotating; descent uprightness `up.y >= 0.99955`; final position approximately `(0, 0.72, -14)`; grounded/road mode; no obstacle contacts; maximum single-frame displacement 0.0525 m. These are gameplay regression-fixture measurements, not real Roadster capability claims.

The legacy comparison compiles the recovered baseline and compares all sampled native state against the production compiled pack. UI tests execute actual button handlers, cancellation, snapshot application and the P-lock adapter.

## Verification boundary and rollback

Native Godot and DOM-handler tests are not an interactive browser playtest. The supported existing cloud browser could be selected, but could not reach this executor's local preview (`ERR_CONNECTION_REFUSED`). No denied Chromium launch was retried and no sandbox/security flags were used. Actual WebAssembly startup, rendered roll clearance and in-browser controls therefore remain unverified. Using the identical official Web compiler, bytecode/remap formats and unchanged loader avoids introducing the untested plaintext-resource loading path, but does not replace a real browser test.

The known-good pre-combination PCK is available at commit `7d9727528e6416231841740e63f8a5098906479e`, SHA-256 `58a961b55f569ed6a9c1850515b336efdae1b23f90300d33be7e57ced5ecbf9b`. Revert the combination commit as a unit if necessary: UI action, native pack and manifest/cache hashes must remain aligned. Verify served PCK bytes against the new manifest after any authorized publication.
