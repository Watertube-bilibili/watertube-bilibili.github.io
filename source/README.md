# Isolated structural diagnostics candidate — 2026-10-27 19:41 UTC

**11/11 files-only integration tests pass. No GUI, browser/WebGL, new native collision, whole-vehicle or two-car comparison-image acceptance.** Original candidate and worker folders were not edited. No install, publication, task creation, account access, damage injection in a live game or localStorage write.

## What changed
The existing real S adapter exposes a read-only snapshot of its verified bound profile and live panel vertex counts, for the exact owned vehicle only. The structural core exposes counts from its existing bound panel/rest metadata. Runtime diagnostics reads existing node displacement, broken beams, detached-part count and revision. It records the last structural damage attempt's received impulse and recognized provenance label, not a guessed solver impulse. Missing/unrecognized values are `unknown`; repair/rebind generation remains explicitly `unknown` because no trustworthy existing generation field exists. Last contact may precede repair; the overlay says so. Structural revision resets at repair and is NOT called repair generation.

The small `<details>` overlay is collapsed initially. It is enabled only when all five exact URL values are present:
`?preview=1&map=estuary&blenderVehicle=volt-s-v2&damage=structure&structuralDiagnostics=1`

Entry remains `runtime-candidate/sunset-coast/play/index.html`. Overlay reads at most every 500 ms plus user expand/collapse events; no reads while closed or document hidden. It traverses no geometry vertex arrays and writes no mesh, save or gameplay state. Pagehide and loss of gate dispose it. Keyboard events inside the panel do not propagate to game controls. Default and Roadster APIs, render loop, native package, repair transaction and save behavior are untouched. Import-map hashes refreshed for changed modules. No need to reload the existing paused session for this files-only result; doing so would lose its disposable live state.

## Measured result (test fixture, NOT native collision evidence)
The real audited GLB was loaded into the actual factory and structural binding. The existing actual Game/core received a labelled synthetic contact fixture (20,000 received impulse):
- Bound profile: `volt-s-review-profile-v1`; 8 panels; 6,428 structural vertices.
- 276 mirror vertices excluded; their actual position arrays unchanged.
- Structural node maximum displacement: 0 → 0.4825 m; broken beams: 0 → 4; detached parts: 0.
- Actual deformable mesh position arrays change, not merely condition/UI counters.
- Explicit actual repair resets displacement/broken beams to zero, restores mesh arrays exactly, retains binding vertex count and charges the already-tested virtual $250 transaction once.
- Second impact changes structure again; independent vehicle buffers remain unchanged; foreign same-root identity does not receive a bound diagnostic.

Displacement shown is structural **node** displacement, not a claimed measured visible-mesh displacement. `manifold-normal-speed-loss` is explicitly an inherited estimate, not solver impulse. Test provenance is labelled and does not establish new native contact truth.

## Test coverage / limits
`node --test common-composition-review/structural-diagnostics-20261027-1941/integration.test.mjs`

Retains all 8 existing tests and adds exact five-flag gate permutations, zero DOM/state/timer access when disabled, measured actual GLB/core impact/repair/buffer checks, mirror exclusion, instance isolation, unknown provenance, overlay collapse/hidden suppression, keyboard isolation, gate removal and pagehide cleanup. DOM/timer boundary tests use doubles. Game constructor/bootstrap tail is omitted in the Node import as in the baseline; actual Game methods and production factory/core implementations are used. Node reports the existing multiple-Three-import warning (browser uses the import map).

No real DOM layout/visibility, browser bootstrap of this new overlay, mobile performance, real native collision with overlay, two-vehicle angled impacts, fragments visual quality, or old/new screenshot comparison was run. These remain unaccepted. No screenshot is produced or relabelled as new evidence.

## Preservation and recovery
`BASELINE-PRESERVATION.json`: original recovery manifest rechecked without mismatch. `FILE-DELTA.json` and `SOURCE-DELTA.patch`: precise candidate differences. `rollback-originals/`: original bytes for every modified pre-existing source/test file. `SHA256-MANIFEST.json`: candidate/restoration content hashes. `STRUCTURAL-DIAGNOSTICS-RESTORE-20261027-1941.zip`: self-contained standalone candidate, test, delta, originals and report. ZIP SHA256 recorded separately; CRC and content hashes verified after packaging.

Do not overlay this whole directory onto another project. For recovery, extract the ZIP into a fresh isolated directory. To remove diagnostics in that extracted copy, restore matching paths from `rollback-originals/` and remove `runtime-candidate/sunset-coast/play/s-diagnostics-ui.js`; the original baseline is itself unchanged and remains the preferred prior version. The diagnostic UI must be visually/native tested in a separately authorized preview before acceptance.
