#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
site_root="$(cd -- "$project_root/../.." && pwd)"
release="4.4.1-stable"
release_url="https://github.com/godotengine/godot-builds/releases/download/$release"
source_url="https://raw.githubusercontent.com/godotengine/godot/$release"
toolchain="${RIDGEBOUND_GODOT44_CACHE:-${XDG_CACHE_HOME:-$HOME/.cache}/ridgebound-godot/$release}"
destination="${1:-$site_root/dist/ridgebound-desktop}"
mingw="${MINGW_CXX:-x86_64-w64-mingw32-g++-posix}"

for tool in curl python3 tar mktemp "$mingw" x86_64-w64-mingw32-objdump makensis; do
  if ! command -v "$tool" >/dev/null; then
    printf 'Missing build tool: %s\n' "$tool" >&2
    exit 1
  fi
done

scratch="$(mktemp -d)"
trap 'rm -rf -- "$scratch"' EXIT
mkdir -p "$toolchain" "$destination"
toolchain="$(cd -- "$toolchain" && pwd)"
destination="$(cd -- "$destination" && pwd)"
godot="$toolchain/godot"
windows_template="$toolchain/windows_release_x86_64.exe"

fetch() {
  curl -fLsS --retry 4 --retry-all-errors --connect-timeout 20 "$1" -o "$2"
}

get_release_asset() {
  local name="$1"
  fetch "$release_url/$name" "$scratch/$name"
  python3 - "$scratch/SHA512-SUMS.txt" "$scratch/$name" <<'PY'
import hashlib
from pathlib import Path
import sys

checksums, asset = map(Path, sys.argv[1:])
expected = next((
    parts[0]
    for line in checksums.read_text(encoding="utf-8").splitlines()
    if len(parts := line.split(maxsplit=1)) == 2
    and parts[1].lstrip("*").removeprefix("./") == asset.name
), None)
with asset.open("rb") as handle:
    actual = hashlib.file_digest(handle, "sha512").hexdigest()
if actual != expected:
    raise SystemExit(f"Upstream SHA-512 mismatch: {asset.name}")
PY
}

if [[ ! -x "$godot" || ! -s "$windows_template" ]]; then
  fetch "$release_url/SHA512-SUMS.txt" "$scratch/SHA512-SUMS.txt"
fi
if [[ ! -x "$godot" ]]; then
  editor="Godot_v${release}_linux.x86_64.zip"
  get_release_asset "$editor"
  python3 -m zipfile -e "$scratch/$editor" "$scratch/editor"
  install -m 755 "$scratch/editor/${editor%.zip}" "$godot"
fi
if [[ ! -s "$windows_template" ]]; then
  templates="Godot_v${release}_export_templates.tpz"
  get_release_asset "$templates"
  python3 - "$scratch/$templates" "$windows_template" <<'PY'
from pathlib import Path
import shutil
import sys
from zipfile import ZipFile

archive, output = map(Path, sys.argv[1:])
temporary = output.with_suffix(".part")
with ZipFile(archive) as z, z.open("templates/windows_release_x86_64.exe") as source, temporary.open("wb") as target:
    shutil.copyfileobj(source, target)
temporary.replace(output)
PY
fi
for license_file in LICENSE.txt COPYRIGHT.txt; do
  if [[ ! -s "$toolchain/Godot-$license_file" ]]; then
    fetch "$source_url/$license_file" "$scratch/$license_file"
    install -m 644 "$scratch/$license_file" "$toolchain/Godot-$license_file"
  fi
done

case "$("$godot" --version)" in
  4.4.1.stable.*) ;;
  *) printf 'The native build requires the Godot 4.4.1 stable editor.\n' >&2; exit 1 ;;
esac

native_project="$scratch/project"
game_files="$scratch/Ridgebound"
mkdir -p "$native_project" "$game_files/licenses"
tar -C "$project_root/godot" --exclude='./.godot' -cf - . | tar -C "$native_project" -xf -
cp -- "$site_root/ridgebound/assets/ridge-rover.glb" "$native_project/assets/ridge-rover.glb"

# Native import uses its own 4.4.1 project cache. The web project and pack are untouched.
python3 - "$native_project" "$windows_template" <<'PY'
import json
from pathlib import Path
import re
import sys

project = Path(sys.argv[1])
configuration = project / "project.godot"
text = configuration.read_text(encoding="utf-8")
text, replaced = re.subn(
    r'^config/features=PackedStringArray\("4\.\d+"',
    'config/features=PackedStringArray("4.4"',
    text,
    count=1,
    flags=re.MULTILINE,
)
if replaced != 1:
    raise SystemExit("Unrecognised Godot config/features")
text = re.sub(
    r"(?m)^(?:renderer/rendering_method(?:\.\w+)?|gl_compatibility/driver\.windows|"
    r"anti_aliasing/quality/msaa_3d|scaling_3d/scale)=.*\n",
    "",
    text,
)
text = text.replace(
    "[rendering]\n",
    '[rendering]\nrenderer/rendering_method="gl_compatibility"\n'
    'renderer/rendering_method.mobile="gl_compatibility"\n'
    'gl_compatibility/driver.windows="opengl3"\n'
    'anti_aliasing/quality/msaa_3d=2\nscaling_3d/scale=1.0\n',
    1,
)
configuration.write_text(text, encoding="utf-8")
(project / "export_presets.cfg").write_text(
    '[preset.0]\n'
    'name="Windows x64"\n'
    'platform="Windows Desktop"\n'
    'runnable=true\n'
    'dedicated_server=false\n'
    'custom_features="ridgebound_desktop"\n'
    'export_filter="all_resources"\n'
    'include_filter=""\n'
    'exclude_filter="tests/*"\n'
    'export_path=""\n'
    'script_export_mode=2\n'
    '[preset.0.options]\n'
    'custom_template/debug=""\n'
    f'custom_template/release={json.dumps(sys.argv[2])}\n'
    'binary_format/embed_pck=false\n'
    'binary_format/architecture="x86_64"\n'
    'debug/export_console_wrapper=0\n'
    'texture_format/s3tc_bptc=true\n'
    'texture_format/etc2_astc=false\n'
    'codesign/enable=false\n'
    'application/modify_resources=false\n'
    'application/export_angle=2\n'
    'application/export_d3d12=2\n',
    encoding="utf-8",
)
PY

run_godot() {
  local label="$1" log="$scratch/$1.log"
  shift
  "$godot" --headless "$@" 2>&1 | tee "$log"
  if grep -Eq '(^|[[:space:]])(SCRIPT ERROR|ERROR):' "$log"; then
    printf 'Godot %s reported errors.\n' "$label" >&2
    exit 1
  fi
}

run_godot import --editor --path "$native_project" --import --quit
run_godot export --path "$native_project" --export-release "Windows x64" "$game_files/Ridgebound.exe"
(
  cd "$scratch"
  run_godot smoke --main-pack "$game_files/Ridgebound.pck" --quit-after 80
)

"$mingw" -std=c++17 -O2 -Wall -Wextra -Wpedantic -municode \
  -D_WIN32_WINNT=0x0601 -DWINVER=0x0601 -static -static-libgcc -static-libstdc++ \
  "$project_root/windows-bridge/bridge.cpp" -o "$game_files/ridgebound-wheel-bridge.exe" \
  -ldinput8 -ldxguid -lws2_32 -lole32 -lshell32 -luser32

cp -- "$toolchain/Godot-LICENSE.txt" "$toolchain/Godot-COPYRIGHT.txt" "$game_files/licenses/"
cp -- "$project_root/LICENSE" "$game_files/licenses/Ridgebound.txt"
cp -- "$project_root/windows-bridge/LICENSE" "$game_files/licenses/DirectInput-bridge.txt"
for package in g++-mingw-w64-x86-64-posix gcc-mingw-w64-x86-64-posix \
  gcc-mingw-w64-x86-64-posix-runtime mingw-w64-common mingw-w64-x86-64-dev; do
  notice="/usr/share/doc/$package/copyright"
  if [[ ! -r "$notice" ]]; then
    printf 'Missing MinGW redistribution notice: %s\n' "$notice" >&2
    exit 1
  fi
  cp -- "$notice" "$game_files/licenses/$package.txt"
done
cp -- "$project_root/windows-desktop/README.txt" "$game_files/README.txt"

makensis -V3 "-DAPP_FILES=$game_files" "-DOUTPUT_EXE=$scratch/Ridgebound-Setup-x64.exe" \
  "$project_root/windows-desktop/setup.nsi"

python3 "$project_root/scripts/verify-desktop.py" \
  "$game_files" "$scratch/Ridgebound-Setup-x64.exe" "$windows_template" \
  "$scratch/Ridgebound-Windows-x64.zip"
install -m 644 "$scratch/Ridgebound-Setup-x64.exe" "$scratch/Ridgebound-Windows-x64.zip" "$destination"
sha256sum -- "$destination/Ridgebound-Setup-x64.exe" "$destination/Ridgebound-Windows-x64.zip"
