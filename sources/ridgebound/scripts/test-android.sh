#!/usr/bin/env bash
# Run on a connected phone-shaped API 35 x86_64 emulator or Android test device.
set -euo pipefail
apk="$1"
output_dir="${2:-/tmp/ridgebound-android-smoke}"
mkdir -p -- "$output_dir"
app="io.github.watertube.ridgebound"

adb install -r "$apk"
adb shell am force-stop "$app"
adb logcat -c
activity="$(adb shell cmd package resolve-activity --brief -a android.intent.action.MAIN -c android.intent.category.LAUNCHER "$app" | tr -d '\r' | tail -n 1)"
[[ "$activity" == "$app/"* ]] || { echo "APK launcher activity is missing." >&2; exit 1; }
adb shell am start -W -n "$activity"

snapshot() {
  local direction="$1" rotation="$2" file="$output_dir/$1.png"
  adb shell wm user-rotation lock "$rotation"
  local attempt
  for attempt in {1..30}; do
    sleep 1
    adb shell pidof -s "$app" >/dev/null || {
      adb logcat -d -t 180
      echo "The native Android game stopped." >&2
      exit 1
    }
    adb exec-out screencap -p > "$file"
    if python3 - "$direction" "$file" <<'PY'
import struct
import sys

with open(sys.argv[2], "rb") as png:
    head = png.read(24)
if not head.startswith(b"\x89PNG\r\n\x1a\n") or len(head) < 24:
    raise SystemExit(1)
width, height = struct.unpack(">II", head[16:24])
raise SystemExit(0 if (height > width if sys.argv[1] == "portrait" else width > height) else 1)
PY
    then
      break
    fi
    if (( attempt == 30 )); then
      echo "The app did not render the $direction orientation." >&2
      exit 1
    fi
  done
  adb shell dumpsys activity activities > "$output_dir/$direction.activities"
  grep -E 'mResumedActivity|topResumedActivity' "$output_dir/$direction.activities" | grep -Fq "$app"
}

trap 'adb shell wm user-rotation free >/dev/null 2>&1 || true' EXIT
snapshot portrait 0
snapshot landscape 1
adb logcat -d -s AndroidRuntime:E godot:V > "$output_dir/android.log"
if grep -E '(FATAL EXCEPTION|SCRIPT ERROR:)' "$output_dir/android.log"; then
  exit 1
fi
grep -q 'Godot Engine v4.6.3' "$output_dir/android.log"
echo "ANDROID_ORIENTATIONS_OK"
