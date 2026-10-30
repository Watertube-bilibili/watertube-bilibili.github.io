# SUNRISE COAST · ULTRA integration, 2026-10-30

The existing public game remains **1.0 Beta**. This update preserves the native physics runtime and the original test entry. The new browser runtime is an opt-in **integration preview**, not a full release.

## Verified inputs

- GitHub main before this update: `ec486e48c0f368f707039f685944356bcea1d832`.
- Drive final-v4: SHA256 `5e4ab9d5dd6cd007b75215da349f8148d627598386d03bff9662f1ca2558430a`; all 506 manifest entries matched. Its base is `0f2f62582e25426b39ac75e0f6d83db95c821390`, so it was not copied over the current game.
- ULTRA KV prototype: SHA256 `203ecfe9970a94a53ed52e003c24af781c907fa586cd91de4bb1bbce4fe371bb`; all 154 manifest entries matched.
- October 30 browser candidate: v4.1 three-volume recovery, then v4.2 GUI, v4.3 region and v5 lifecycle deltas. The 349-file v5 source manifest matched before the additional startup failure fixes in this update.

## Routes and data

| Route | Role | Save behavior |
| --- | --- | --- |
| `/sunset-coast/` | Existing native Beta entry | Existing `sunset-coast-2.0-beta` keys, indexes and backups retained |
| `/sunset-coast-test/` | Original independent test version | Existing `sunset-coast-test-2.0-beta` retained; no files changed |
| `/sunrise-browser-preview/` | New browser integration preview | Explicit new per-map slots; no automatic old-coordinate migration |

The personal project page previously linked its primary SUNRISE button to the old test version. It now links to `/sunset-coast/` and exposes both test choices separately. No existing saves are deleted, bulk migrated or uploaded.

## Implementation status

| Area | Existing public native game | New browser preview / remaining work |
| --- | --- | --- |
| Vehicles and interaction | Existing vehicles and native Roadster air reserve/flight retained | Recovered car/interaction code, selected-model loading and full per-map player snapshots integrated; unsupported models remain gated |
| Maps | Existing city retained | ESTUARY and CRESCENT maps, authored roads/materials and separate save slots; CRESCENT career routes still disabled |
| Storage lifecycle | Existing slots retained | Web Locks, cancellation, failure-closed writers, staged boot writes, conflict detection and BFCache reload; physics must be ready before restore/write |
| Flight and motorcycle | Native physics retained | Experimental browser force/contact integration kept separate; no complete parity claim |
| Structural damage | Existing behavior retained | 3D structural damage not accepted in browser preview |
| PHP accounts / KV | No live service is wired into Pages | Separately retained private service-source handoff; disabled public API with strict origin/TLS boundary; real provider consistency and product hardening remain |

## Startup changes

The native engine still owns rigid bodies, suspension and terrain collisions. It is not removed from the existing game. Its compressed WASM is 9,382,282 bytes. A stuck cached response body or SHA verification now falls back to network after a bounded wait without deleting a merely slow valid entry. Cache cleanup is bounded too. Known 2G/3G or low-throughput connections defer engine preloading so it does not compete with the selected model download. This is a behavior fix, not a measured device startup speed claim.

The isolated browser build excludes Godot/WASM/PCK from its runtime. Ordinary driving uses its implemented browser physics subset. Unsupported physics modes remain disabled instead of silently running a lower-fidelity substitute. Packaged asset size is not equivalent to first-load transfer size.

## Acceptance boundaries

- Current native Node suite: **188 passed, 0 failed, 3 skipped** (191 total). The skips require a Godot executable. The previous 185-item suite actually yielded 182 passed and 3 skipped in this environment.
- Browser candidate source: **434 passed, 0 failed, 3 skipped** (437 total), plus a static closure check for 169 JS modules and 138 import-map entries. The skips require Godot; no GUI acceptance is implied.
- Existing recovered ULTRA tests were rerun with PHP 8.4.27: Node 31, KV adapter 20, account 41, snapshot 48, two-worker HTTP 43 and maintenance boundary 43 passed. Three unsafe consistency/rate-limit counterexamples were reproduced. These use local fake KV, not the production provider.
- Cloud browser: project/launcher UI and new slot/failed-start paths can be checked. The current browser reports `GL_VENDOR = Disabled` and cannot create WebGL, including for the unchanged public game. No 3D gameplay acceptance can be inferred.
- Real iPhone/Safari, Android, Windows GPU, performance, populated-map collision and end-to-end flight acceptance remain outstanding.
- A successful Pages deployment confirms that static files are public. It does not convert any of the above pending gameplay or cloud-service checks into a pass.

## Independent service deployment

GitHub Pages cannot execute PHP. This repository currently uses root deployment with `.nojekyll`; even `_services/` would expose PHP source as static files. PHP source is therefore retained separately as a private handoff, never in the main Pages tree. A future service branch must not be selected as the Pages source. The recommended host serves the game and `/api` on one HTTPS origin, forwarding only `/api` to an independent PHP service. Use only the service `public/` as its document root, inject KV credentials server-side, keep HttpOnly/Secure/SameSite cookies and CSRF checks, and do not put credentials or bearer tokens in browser storage.

The API deliberately remains unavailable for account/cloud-write operations. The old snapshot contract is `coast-plateau-final-v4` / `final-v4-full-1`, which cannot simply accept the new maps and vehicles. Required follow-up: exact current snapshot contract, atomic async-asset restore, real-host CAS/session visibility, password/session lifecycle, abuse protection and capacity/garbage collection.

## Release and rollback

All changes are additive except the bounded native startup fix, cache hashes and corrected entry links. The native/test/history assets are retained. Use the previous Git commit or the pre-integration branch to roll code back; do not clear browser storage. Current release acceptance flags remain false until the actual gameplay and device checks pass.
