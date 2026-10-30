# SUNRISE COAST integration source — 2026-10-30

This branch preserves the reconstructed source and reproducible tests for the SUNSHINE COAST ULTRA → SUNRISE COAST integration. It is a source branch, not the GitHub Pages deployment root. Do not publish the whole directory.

## Current result

The source was reconstructed in order from the v4.1 code/assets/native-history volumes, v4.2 GUI corrections, v4.3 region validation, and v5 lifecycle delta. All 363 original volume records and all 349 final v5 source hashes matched before the changes in this task.

The isolated browser preview supports ESTUARY and CRESCENT maps with separate version-2 local save slots. ESTUARY includes its migrated delivery career. It preserves the old runner and save namespaces rather than rewriting old coordinates. Browser-world slots still reject motorcycles, Roadster flight, aircraft, and unsupported structural features. CRESCENT careers are not enabled. PHP accounts and KV cloud saves are not included or activated.

Changes after the recovered v5 baseline:

- Propagate browser-world WebGL/constructor failures, close the lifecycle on physics startup failure, and wait for `physicsReady` before restoring or enabling durable writes.
- Preserve single-owner page/BFCache lifecycle and slot locking.
- Isolate control-size preferences per browser-world slot.
- Reject unmigrated legacy careers before they mutate an ESTUARY browser slot.
- Replace old native/motorcycle release claims with current browser-preview metadata.
- Replace an unavailable historical test directory with a real snapshot/save/validation regression; make the CRESCENT native export helper relative to this checkout.
- Refresh the map hub after BFCache Back/Forward restoration. Generation guards ignore stale list/create results, restore create buttons, and prevent old async work from redirecting the restored page. Both hubs use a content-hashed chooser module; the initial loading label is map-neutral.

## Acceptance state

| Layer | Evidence |
| --- | --- |
| Source reconstruction | Exact predecessor SHA256 manifests in `evidence/` |
| Automated tests | 437 tests: 434 passed, 0 failed, 3 native Godot tests skipped |
| BFCache follow-up | 5 new targeted chooser tests passed; baseline full suite was not rerun |
| Static preview | 169 JS modules checked; 138 import-map hashes valid; no missing relative module imports |
| Browser UI | Two-map hub and legacy link observed; HTTPS creation worked for both maps, and the ESTUARY slot remained after a WebGL failure. The BFCache correction still requires its separate public recheck. |
| 3D browser gameplay | Not accepted in this run; managed browser reported disabled WebGL |
| Real devices and performance | Not tested |
| Public deployment | Handled separately on the Pages branch; not established by this source tree |

The three skipped tests need an actual Godot executable to validate shipped PCK aero braking and maneuver trajectories/packing. Stored numerical references are not a fresh native runtime test. Original nested QA notes and manifests are historical evidence only; they do not supersede the table above or `source/runtime-candidate/sunset-coast/release-info.json`.

## Reproduce

Node.js and Python 3 are sufficient for the browser-source tests and static build. No package installation is required; renderer libraries and models are vendored. From this checkout:

```bash
bash run-tests.sh
python3 build-preview.py --out ../sunrise-browser-preview-build
python3 verify-preview.py --root ../sunrise-browser-preview-build
```

The build refuses a nonempty output directory. Publish only that generated browser-preview tree at `/sunrise-browser-preview/`. It contains no Godot/WASM/PCK, PHP, or local QA recorder. Its static assets total about 41.4 MB; this is the whole asset library, not a measured startup transfer. The source retains native modules and compressed binaries for recovery and native testing.

The 37,700,666-byte raw `neon-physics.wasm` is intentionally not tracked. `bootstrap-source.py` regenerates it locally from the included 9,382,282-byte gzip, checking both compressed and regenerated SHA256 values and refusing to overwrite mismatched bytes. `run-tests.sh` and `build-preview.py` invoke this bootstrap automatically. You can also run `python3 bootstrap-source.py` directly before native-tool work. This is reproducible source, not a missing engine download. The original recovery archives remain unchanged.

`evidence/current-full-tests.log` and `evidence/STATIC-PREVIEW-CHECK.json` contain the current baseline checks. `SOURCE-MANIFEST-current.json` verifies current source, while the v4.2/v4.3/v5 manifests preserve predecessor provenance.

`evidence/BFCACHE-CHOOSER-RESULT.json` and `evidence/bfcache-chooser-tests.log` record the later hub fix. Its five tests cover restored slot visibility/button state, overlapping render responses, late create navigation, stale errors, and duplicate clicks. Static dependency and import-hash checks were repeated after that change.

## Optional Roadster and motorcycle source experiment

`air-delta/` contains only the 24-file delta and replay tools, not another complete source copy. It preserves the current world slots, region validator, lifecycle, startup-failure protection, and public capability gates. Reconstruct it into a new directory:

```bash
python3 air-delta/apply-air-delta.py --base . --destination ../sunrise-air-local
bash air-delta/run-air-tests.sh ../sunrise-air-local
```

The replay checks every changed predecessor and output hash and refuses to overwrite a destination. If native checks are required in the reconstructed experiment, first run `python3 bootstrap-source.py` in this baseline checkout and then replay into a fresh directory. The experiment accepts Roadster manual flight only on localhost with `physics=browser&preview=1&map=estuary&air=1`; add `moto=1` for the motorcycle adapter. Public browser-world save slots keep these features disabled. No QA POST recorder is included.

Air-specific tests passed 64/64, and related lifecycle/default-backend tests passed 187/187; those suites overlap and must not be added as a unique count. There was no new browser, real-device, or public acceptance of this merged experiment. Aircraft, full Rocket maneuvers, midair six-degree saves, and unified structural-body ownership remain incomplete.

This branch contains no PHP service, credentials, browser profile, or user save export. It does not change production data.
