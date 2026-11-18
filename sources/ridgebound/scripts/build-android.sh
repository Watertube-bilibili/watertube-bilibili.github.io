#!/usr/bin/env bash
# Build a native Android APK without altering the Web or Windows Godot projects.
set -euo pipefail

ridgebound_root="$(cd -- "$(dirname -- "$0")/.." && pwd)"
project_source="$ridgebound_root/godot"
godot_bin="$(command -v "${GODOT_BIN:-godot}")"
version="$("$godot_bin" --version)"
case "$version" in
  4.6.3.stable.*) ;;
  *) echo "Expected Godot 4.6.3.stable, found $version" >&2; exit 1 ;;
esac

sdk_dir="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-}}"
java_dir="${JAVA_HOME:-}"
test -d "$sdk_dir" && test -x "$sdk_dir/platform-tools/adb" || {
  echo "Set ANDROID_SDK_ROOT (or ANDROID_HOME) to an SDK with platform-tools installed." >&2
  exit 1
}
test -x "$java_dir/bin/java" && test -x "$java_dir/bin/keytool" || {
  echo "Set JAVA_HOME to OpenJDK 17." >&2
  exit 1
}
java_spec="$("$java_dir/bin/java" -XshowSettings:properties -version 2>&1 | awk -F' = ' '/java.specification.version/ { print $2 }')"
test "$java_spec" = 17 || { echo "Godot APK export requires OpenJDK 17 here." >&2; exit 1; }
sdk_tools="${RIDGEBOUND_ANDROID_BUILD_TOOLS:-36.0.0}"
for tool in aapt apksigner zipalign; do
  test -x "$sdk_dir/build-tools/$sdk_tools/$tool" || {
    echo "Install Android build-tools;$sdk_tools (missing $tool)." >&2
    exit 1
  }
done
export JAVA_HOME="$java_dir"

template="${RIDGEBOUND_ANDROID_TEMPLATE:-${XDG_DATA_HOME:-$HOME/.local/share}/godot/export_templates/4.6.3.stable/android_release.apk}"
test -s "$template" || { echo "Set RIDGEBOUND_ANDROID_TEMPLATE to the official Godot 4.6.3 android_release.apk." >&2; exit 1; }

output="${1:-dist/ridgebound/Ridgebound-Android.apk}"
mkdir -p -- "$(dirname -- "$output")"
output="$(cd -- "$(dirname -- "$output")" && pwd)/$(basename -- "$output")"
build_dir="$(mktemp -d -t ridgebound-android.XXXXXXXX)"
trap 'rm -rf -- "$build_dir"' EXIT
project="$build_dir/project"
editor="$build_dir/editor"
mkdir -p "$project" "$editor/editor_data/export_templates/4.6.3.stable"

tar -C "$project_source" --exclude='./.godot' --exclude='./android' -cf - . | tar -C "$project" -xf -
test -s "$project/desktop_main.tscn" && test -s "$project/touch_drive.gd" && test -s "$project/assets/ridge-rover.glb"
cp -- "$godot_bin" "$editor/godot"
chmod +x "$editor/godot"
touch "$editor/_sc_"
ln -s -- "$(realpath -- "$template")" "$editor/editor_data/export_templates/4.6.3.stable/android_release.apk"

if [ -z "${GODOT_ANDROID_KEYSTORE_RELEASE_PATH:-}" ]; then
  # A local sideload key is reused on subsequent builds on this machine.
  # Set release credentials to publish upgrades from more than one machine.
  keydir="${XDG_DATA_HOME:-$HOME/.local/share}/ridgebound/android"
  mkdir -p "$keydir"
  chmod 700 "$keydir"
  key="$keydir/preview.p12"
  if [ ! -s "$key" ]; then
    (
      umask 077
      "$java_dir/bin/keytool" -genkeypair -keystore "$key" -storetype PKCS12 \
        -storepass android -keypass android -alias ridgebound-preview \
        -keyalg RSA -keysize 2048 -validity 10000 -dname 'CN=Ridgebound Local Preview'
    )
  fi
  export GODOT_ANDROID_KEYSTORE_RELEASE_PATH="$key"
  export GODOT_ANDROID_KEYSTORE_RELEASE_USER=ridgebound-preview
  export GODOT_ANDROID_KEYSTORE_RELEASE_PASSWORD=android
  echo "APK uses a local preview signing key."
else
  : "${GODOT_ANDROID_KEYSTORE_RELEASE_USER:?Set the release signing alias.}"
  : "${GODOT_ANDROID_KEYSTORE_RELEASE_PASSWORD:?Set the release signing password.}"
  test -s "$GODOT_ANDROID_KEYSTORE_RELEASE_PATH"
  GODOT_ANDROID_KEYSTORE_RELEASE_PATH="$(realpath -- "$GODOT_ANDROID_KEYSTORE_RELEASE_PATH")"
  export GODOT_ANDROID_KEYSTORE_RELEASE_PATH
fi

python3 - "$project" "$editor/editor_data" "$sdk_dir" "$java_dir" <<'PY'
from pathlib import Path
import json
import os
import re
import sys

project, editor_data, sdk, java = (Path(p).resolve() for p in sys.argv[1:])
quote = lambda value: json.dumps(str(value), ensure_ascii=False)
settings = (
    '[gd_resource type="EditorSettings" format=3]\n\n[resource]\n'
    f'export/android/android_sdk_path = {quote(sdk)}\n'
    f'export/android/java_sdk_path = {quote(java)}\n'
)
(editor_data / "editor_settings-4.6.tres").write_text(settings, encoding="utf-8")
doc = project / "project.godot"
cfg = doc.read_text(encoding="utf-8")

def set_section(name, values):
    global cfg
    pattern = rf"(?m)^\[{re.escape(name)}\]\n((?:[^[]|\[(?!\w+\]))*)"
    match = re.search(pattern, cfg)
    lines = match.group(1).splitlines() if match else []
    existing = [line for line in lines if line.split("=", 1)[0].strip() not in values]
    new = f"[{name}]\n" + "\n".join(existing + [f"{k}={v}" for k, v in values.items()]).strip("\n") + "\n\n"
    cfg = cfg[:match.start()] + new + cfg[match.end():] if match else cfg.rstrip() + "\n\n" + new

set_section("application", {"run/main_scene": '"res://desktop_main.tscn"'})
set_section("display", {
    "window/handheld/orientation": "6",
    "window/size/viewport_width": "720",
    "window/size/viewport_height": "720",
    "window/stretch/mode": '"canvas_items"',
    "window/stretch/aspect": '"expand"',
    "window/energy_saving/keep_screen_on": "true",
})
set_section("input_devices", {
    "sensors/enable_accelerometer": "false",
    "sensors/enable_gyroscope": "false",
    "sensors/enable_gravity": "false",
    "sensors/enable_magnetometer": "false",
    "pointing/emulate_mouse_from_touch": "true",
})
set_section("rendering", {
    "renderer/rendering_method.mobile": '"gl_compatibility"',
    "anti_aliasing/quality/msaa_3d": "0",
})
doc.write_text(cfg, encoding="utf-8")

version_code = int(os.environ.get("RIDGEBOUND_ANDROID_VERSION_CODE", "1"))
if not 1 <= version_code <= 2100000000:
    raise SystemExit("Invalid Android version code.")
version_name = quote(os.environ.get("RIDGEBOUND_ANDROID_VERSION_NAME", "1.0"))
emulator = "true" if os.environ.get("RIDGEBOUND_ANDROID_ENABLE_X86_64") == "1" else "false"
presets = f"""[preset.0]
name="Android"
platform="Android"
runnable=true
dedicated_server=false
custom_features="ridgebound_android"
export_filter="all_resources"
include_filter=""
exclude_filter="tests/*"
export_path=""
script_export_mode=2

[preset.0.options]
gradle_build/use_gradle_build=false
architectures/arm64-v8a=true
architectures/armeabi-v7a=false
architectures/x86=false
architectures/x86_64={emulator}
package/unique_name="io.github.watertube.ridgebound"
package/name="山野之间"
package/signed=true
version/code={version_code}
version/name={version_name}
screen/immersive_mode=true
screen/edge_to_edge=false
permissions/internet=false
"""
(project / "export_presets.cfg").write_text(presets, encoding="utf-8")
PY

run_godot() {
  local log="$1"
  shift
  "$editor/godot" --headless --path "$project" "$@" 2>&1 | tee "$log"
  if grep -Eq '(^|[[:space:]])(ERROR:|SCRIPT ERROR:|Parse Error:|Export failed)' "$log"; then
    echo "Godot import or export reported an error." >&2
    exit 1
  fi
}
run_godot "$build_dir/import.log" --editor --import --quit
run_godot "$build_dir/export.log" --export-release Android "$build_dir/Ridgebound.apk"
"$sdk_dir/build-tools/$sdk_tools/apksigner" verify --verbose --print-certs "$build_dir/Ridgebound.apk"
"$sdk_dir/build-tools/$sdk_tools/zipalign" -c -P 16 4 "$build_dir/Ridgebound.apk"
"$sdk_dir/build-tools/$sdk_tools/aapt" dump badging "$build_dir/Ridgebound.apk" | tee "$build_dir/badging.log"
grep -q "package: name='io.github.watertube.ridgebound'" "$build_dir/badging.log"
grep -E -q 'native-code:.*arm64-v8a' "$build_dir/badging.log"
"$sdk_dir/build-tools/$sdk_tools/aapt" dump xmltree "$build_dir/Ridgebound.apk" AndroidManifest.xml > "$build_dir/manifest.log"
grep -E -q 'screenOrientation.*(fullUser|0x0*d[[:space:]]*$)' "$build_dir/manifest.log"

mv -- "$build_dir/Ridgebound.apk" "$output"
sha256sum -- "$output"
