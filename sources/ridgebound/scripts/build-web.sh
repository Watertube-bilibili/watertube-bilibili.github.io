#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
site_root="$(cd -- "$project_root/../.." && pwd)"
godot_bin="${GODOT_BIN:-godot}"
mkdir -p "$site_root/ridgebound/engine" "$project_root/godot/assets"
cp "$site_root/ridgebound/assets/ridge-rover.glb" "$project_root/godot/assets/ridge-rover.glb"
"$godot_bin" --headless --editor --path "$project_root/godot" --import --quit
"$godot_bin" --headless --path "$project_root/godot" --export-release Web "$site_root/ridgebound/engine/ridgebound.html"
