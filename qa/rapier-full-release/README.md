# Original-city Rapier release checks

Run from the repository root with the existing Node installation (validated with Node 24.19.0). No package install, external service or browser storage is used.

```sh
node --test --test-reporter=tap --test-concurrency=1 \
  qa/rapier-full-release/chooser-controller.test.mjs \
  qa/rapier-full-release/save-entry.test.mjs \
  qa/rapier-full-release/roadster-vault.test.mjs \
  qa/rapier-full-release/roadster-autoair.test.mjs \
  qa/rapier-full-release/services/career-police.test.mjs \
  qa/rapier-full-release/services/ride-services.test.mjs
```

The six test files contain 59 cases:

- 22 chooser/entry/save cases: cold initialization, double actions, unavailable storage, navigation failure, deployed module URLs, the exact retained legacy homepage, source-copy bytes and extensions, unchanged old keys, and failed-physics no-save behavior.
- 27 Roadster cases: the actual Rapier/WASM controller, vault/vault-spin trajectories and obstacle rejection, automatic-air behavior and fuel/landing limits. They use real production geometry and vehicle assets. Canvas drawing and selected DOM surfaces are stubs; these are not GUI tests or performance measurements.
- 10 services cases: original taxi/courier/race/patrol and cargo completion/payout/save boundaries, police transitions, RoboTaxi and autonomy-test lifecycle. These call production methods with fixture endpoint transitions and actual physics; they do not prove a complete driven GUI career route.

Runtime imports point at `sunset-coast/rapier/play/`. The Roadster fixture additionally reads `sunset-coast/play/game.js` to retain the original population-method baseline. The entry tests read `sunset-coast/index.html` and the byte-identical `sunset-coast/legacy.html`. Required GLBs, Three.js and Rapier/WASM are already part of those runtime trees. All other executable fixtures are in this folder. Historical `qa/original-city*` and the unpublished `original-city-candidate` tree are not required. Source names in `fixture-origins.json` are provenance, not runtime dependencies; a URL test also uses the former development path as a string without reading it.

The 14 chooser behavior cases retain their previous action assertions. Only their source-file locations and exact navigation URL expectations changed when the chooser became module-relative. The Roadster and services fixture relocations change import paths, not assertions. Their origin records retain the input hashes.

This small suite complements the separately retained full historical regression and actual-browser records. It is not an assertion that all game content, devices or iPhone performance have been tested.

To reproduce the code-resource budget:

```sh
node --experimental-vm-modules qa/rapier-full-release/code-budget.mjs /tmp/sunrise-code-budget.json
```

That script reads the legacy launcher (`sunset-coast/sunrise-hub-launcher.a0e555ba5ecb8629.js`) plus both runtime graphs. It includes reachable literal lazy imports and JS/WASM files once, compresses each file using gzip level 9, and records hashes. It excludes models/textures/fonts/CSS/HTML from the JS/WASM totals and lists the Godot PCK separately. This is a reconstructed resource budget, not measured HTTP transfer, startup time or an equal-asset whole-game comparison.
