# Public entry and startup recovery check · 2026-11-07

Checked the existing release at commit `18cdb0b82b2a804ad099fb1799d3873ae120226f` before this small follow-up. GitHub Pages run `42332439329` reported successful build and deployment. The repository HEAD matched that commit.

The real public `https://watertube-bilibili.github.io/sunset-coast/` launcher initialized its save list and enabled its controls in the cloud browser. A new, separate QA slot opened the deployed Rapier play URL. Production `game.js` and Three.js executed, but rendering stopped with `Error creating WebGL context`; this browser reported both `GL_VENDOR` and `GL_RENDERER` as `Disabled`. This is a graphics capability limit, not proof of a public CDN outage or a gameplay pass. No browser permissions, security settings, graphics flags or network restrictions were changed.

The observed failure screen had only a low-level graphics error and reload. This follow-up adds a plain-language WebGL explanation, warns against clearing site data and provides a direct return to save management. Other startup failures get the same recovery link, without duplicate links on repeated failures. It also catches a top-level `localStorage` SecurityError instead of leaving loading unresolved. It does not alter physics parameters, save keys, old-city content, legacy versions or other projects. Updated module hashes keep the recovery code reachable through both import maps.

## Focused verification

Run with the existing Node installation, without installing packages:

```sh
node --test --test-reporter=tap --test-concurrency=1 \
  qa/rapier-full-release/chooser-controller.test.mjs \
  qa/rapier-full-release/startup-recovery.test.mjs
```

Result: 25/25 pass, no failures/skips. The 14 existing chooser tests are unchanged. The 11 new tests cover WebGL and generic error rendering, idempotent safe navigation, absent loading surfaces, invalid slots, unavailable/occupied locks, actual runtime failure cleanup, unchanged original/QA bytes, blocked late writes, one-shot disposal, the ready/pagehide lifecycle and the top-level storage getter failure. The startup tests execute the production runtime/session/hash/write guards with a fixture DOM and an outer schema-validator stub. They do not instantiate a GPU or drive the game.

`node --check sunset-coast/rapier/play/city-runtime-entry.js` passes. The historical full 59-case release suite and prior 3D browser evidence are in `RESULTS.md`; they were not rerun in full for this follow-up. Public driving, all career routes and iPhone/Safari performance remain unverified in this environment.
