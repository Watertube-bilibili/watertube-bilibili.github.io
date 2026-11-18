#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
site_root="$(cd -- "$project_root/../.." && pwd)"
godot_bin="${GODOT_BIN:-godot}"
mkdir -p "$site_root/ridgebound/engine" "$project_root/godot/assets"
for model in ridge-rover yuchuan-v8; do
  cp "$site_root/ridgebound/assets/$model.glb" "$project_root/godot/assets/$model.glb"
done
cp "$project_root/godot/device-profiles.json" "$site_root/ridgebound/device-profiles.json"
"$godot_bin" --headless --editor --path "$project_root/godot" --import --quit
"$godot_bin" --headless --path "$project_root/godot" --export-release Web "$site_root/ridgebound/engine/ridgebound.html"

python3 "$project_root/scripts/prepare-web.py"
