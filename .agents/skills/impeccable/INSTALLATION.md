# Impeccable installation

- Official source: https://github.com/pbakaus/impeccable
- Source commit: `695cea5c6d1cbd420fc331375c7ef126a774e5f7`
- Skill version: **4.8.0**
- Engine version pinned by upstream: **0.1.18**
- Installed on: 2026-11-04
- Scope: this project, Codex CLI skill (`.agents/skills/impeccable/`)
- Method: upstream README’s supported manual copy of the complete `.agents/skills/impeccable` folder; no npm installer, hooks, or external agent configuration.
- License: Apache-2.0; included as `LICENSE`. Upstream third-party notices are preserved in `NOTICE.md`.

The upstream files are unchanged. The launcher can fetch its checksum-verified, version-pinned engine on first use; engine binaries and caches are not committed here. Upstream references and packaged agent definitions are included. The skill is project-scoped and does not affect other repositories.

Use `$impeccable` in Codex after reloading skills. Existing project goals and user instructions take precedence. For this repository’s independent game, product and design context should remain scoped to `ridgebound/`.
