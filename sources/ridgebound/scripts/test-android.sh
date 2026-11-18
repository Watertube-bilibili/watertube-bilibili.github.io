#!/usr/bin/env bash
# Run the orbit-probe APK on a dedicated phone-shaped Android emulator.
set -euo pipefail
python3 - "$@" <<'PY'
import json
import math
import os
from pathlib import Path
import re
import struct
import subprocess
import sys
import time


RUNTIME_TAGS = ("AndroidRuntime:E", "godot:V", "libc:F", "DEBUG:E", "ActivityTaskManager:I")


def adb(*args, binary=False, check=True):
    command = ["adb", *map(str, args)]
    result = subprocess.run(command, capture_output=True, text=not binary, timeout=60)
    if check and result.returncode:
        raise RuntimeError(f"{command!r} exited {result.returncode}: {result.stderr}")
    return result.stdout


def samples():
    result = []
    for line in adb("logcat", "-d", "-s", "godot:V").splitlines():
        if "ORBIT_PROBE {" in line:
            result.append(json.loads(line.split("ORBIT_PROBE ", 1)[-1]))
    return result


def wait_probe(description, predicate, timeout=18):
    until = time.monotonic() + timeout
    while time.monotonic() < until:
        stream = samples()
        if stream and predicate(stream[-1]):
            return stream[-1]
        time.sleep(0.25)
    last = stream[-1] if stream else "(no samples)"
    raise RuntimeError(f"{description}: last probe {last}")


def icon_package(path):
    override = os.environ.get("RIDGEBOUND_ANDROID_APP_ID")
    if override:
        return override
    sdk = Path(os.environ.get("ANDROID_SDK_ROOT") or os.environ["ANDROID_HOME"])
    tools = os.environ.get("RIDGEBOUND_ANDROID_BUILD_TOOLS", "36.0.0")
    info = subprocess.check_output([str(sdk / "build-tools" / tools / "aapt"), "dump", "badging", path], text=True)
    match = re.search(r"^package: name='([^']+)'", info, flags=re.MULTILINE)
    if not match:
        raise RuntimeError("No Android application ID in APK")
    return match[1]


def bound_controls(sample):
    view_w, view_h = sample["viewport"]
    screen_w, screen_h = sample["screen"]
    safe_left, safe_top, safe_w, safe_h = sample["safe"]
    scale_x = screen_w / view_w
    scale_y = screen_h / view_h
    wheel_x, wheel_y, radius = sample["wheel"]
    gas_x, gas_y = sample["gas"]
    # Convert actual shared viewport coordinates back to the platform's safe rectangle.
    frames = [
        ((wheel_x - radius) * scale_x, (wheel_y - radius) * scale_y,
         (wheel_x + radius) * scale_x, (wheel_y + radius) * scale_y),
        (gas_x * scale_x, gas_y * scale_y, gas_x * scale_x, gas_y * scale_y),
    ]
    for left, top, right, bottom in frames:
        if not (safe_left - 2 <= left <= right <= safe_left + safe_w + 2
                and safe_top - 2 <= top <= bottom <= safe_top + safe_h + 2):
            raise RuntimeError(f"Wheel or accelerator intersects a display cutout: {sample}")


def swipe(start, end, duration=580):
    points = [round(value) for point in (start, end) for value in point]
    adb("shell", "input", "touchscreen", "swipe", *points, duration)


def gestures(sample, width, height):
    # Two swipes in the clear center viewport, where no touch control is present.
    # Both must affect the real camera pose as well as its requested orbit.
    # Reverse vertical motion on a high camera so repeated orientation tests
    # still exercise pitch instead of running into its intended travel limit.
    pitch_y = 0.34 if sample["pitch"] > 0.25 else 0.64
    for axis, start, end in [
        ("yaw", (width * 0.46, height * 0.47), (width * 0.61, height * 0.47)),
        ("pitch", (width * 0.50, height * 0.49), (width * 0.50, height * pitch_y)),
    ]:
        other_axis = "pitch" if axis == "yaw" else "yaw"
        swipe(start, end)
        before = sample
        sample = wait_probe(
            f"center Android swipe must change camera {axis} and its pose",
            lambda s: s["active"] and s["sequence"] > before["sequence"]
            and abs(s[axis] - before[axis]) > 0.035 and math.dist(s["pose"], before["pose"]) > 0.20,
        )
        if abs(sample[other_axis] - before[other_axis]) > 0.025:
            raise RuntimeError(f"{axis}-only swipe also displaced {other_axis}")
    for action in ("steer", "throttle"):
        before = sample
        vw, vh = before["viewport"]
        scale_x, scale_y = width / vw, height / vh
        if action == "steer":
            x, y, radius = before["wheel"]
            start = (x * scale_x, y * scale_y)
            end = ((x + radius * 0.76) * scale_x, y * scale_y)
        else:
            x, y = before["gas"]
            start = end = (x * scale_x, y * scale_y)
        swipe(start, end, 2_400)
        sample = wait_probe(
            f"{action} touch must return to neutral on release",
            lambda s: s["sequence"] > before["sequence"] and abs(s[action]) < 0.02,
        )
        during = [s for s in samples() if before["sequence"] < s["sequence"] <= sample["sequence"]]
        if not any(abs(s[action]) > 0.30 for s in during):
            raise RuntimeError(f"Android did not deliver the real {action} gesture: {during}")
        if any(abs(s[axis] - before[axis]) > 0.025 for s in during for axis in ("yaw", "pitch")):
            raise RuntimeError(f"The Android {action} control also moved the camera")
        print(f"Real {action} touch did not affect the camera")


def screenshot(directory, name):
    png = adb("exec-out", "screencap", "-p", binary=True)
    if not png.startswith(b"\x89PNG\r\n\x1a\n") or len(png) < 24:
        raise RuntimeError("Invalid screenshot data")
    (directory / (name + ".png")).write_bytes(png)
    return struct.unpack(">II", png[16:24])


def capture(directory, label, rotation, notch, app):
    before = wait_probe("driving UI is ready", lambda s: s["active"])
    # The wm user-rotation command is unavailable on Android 10.
    adb("shell", "settings", "put", "system", "user_rotation", rotation)

    def matches(s):
        return (s["active"] and s["rotation"] == rotation
                and (s["viewport"][1] > s["viewport"][0]) == (rotation == 0)
                and (not notch or s["cutouts"] > 0))

    first = wait_probe(f"Android surface and viewport rotated to {label}",
                       lambda s: s["sequence"] > before["sequence"] and matches(s))
    sample = wait_probe(f"surface settled after rotating to {label}",
                        lambda s: s["sequence"] >= first["sequence"] + 4 and matches(s))
    bound_controls(sample)
    width, height = screenshot(directory, label)
    if (height > width) != (rotation == 0):
        raise RuntimeError(f"Screenshot dimensions disagree with {label}")
    activities = adb("shell", "dumpsys", "activity", "activities")
    if not any(app in line and re.search(r"mResumedActivity|topResumedActivity", line)
               for line in activities.splitlines()):
        raise RuntimeError("The tested game is not the resumed Android activity")
    gestures(sample, width, height)
    screenshot(directory, label)
    (directory / (label + ".activities")).write_text(activities, encoding="utf-8")
    print(f"{label}: rendered {width}×{height}, both orbit axes and driving controls passed")


def main():
    apk = Path(sys.argv[1])
    output = Path(sys.argv[2] if len(sys.argv) > 2 else "/tmp/ridgebound-android-smoke")
    output.mkdir(parents=True, exist_ok=True)
    app = icon_package(apk)
    overlay = "com.android.internal.display.cutout.emulation.tall"
    notch = False
    restore_notch = False
    rotation_keys = ("accelerometer_rotation", "user_rotation")
    rotation_settings = {
        key: adb("shell", "settings", "get", "system", key).strip() for key in rotation_keys
    }
    try:
        adb("shell", "settings", "put", "system", "accelerometer_rotation", 0)
        overlays = adb("shell", "cmd", "overlay", "list", "--user", "0", check=False)
        match = next((line for line in overlays.splitlines() if overlay in line), "")
        if match:
            notch = True
            if "[x]" not in match.lower():
                adb("shell", "cmd", "overlay", "enable", "--user", "0", overlay)
                restore_notch = True
        print("System cutout overlay enabled" if notch else "System cutout overlay unavailable on this image")
        print(adb("install", "-r", apk).strip())
        adb("shell", "am", "force-stop", app)
        adb("logcat", "-c")
        activity = adb("shell", "cmd", "package", "resolve-activity", "--brief", "-a",
                       "android.intent.action.MAIN", "-c", "android.intent.category.LAUNCHER", app).strip().splitlines()[-1]
        if not activity.startswith(app + "/"):
            raise RuntimeError("APK launcher activity is missing")
        print(adb("shell", "am", "start", "-W", "-n", activity).strip())
        screenshot(output, "launch")
        start = wait_probe("the real Android start menu appeared", lambda s: s.get("start"), timeout=40)
        width, height = screenshot(output, "start-menu")
        x, y = start["start"]
        vw, vh = start["viewport"]
        adb("shell", "input", "touchscreen", "tap", round(x * width / vw), round(y * height / vh))
        wait_probe("real Android tap on the primary menu action started driving", lambda s: s["active"], timeout=25)
        print("ANDROID_START_BUTTON_TAP_OK")
        capture(output, "portrait", 0, notch, app)
        capture(output, "landscape", 1, notch, app)
        capture(output, "reverse-landscape", 3, notch, app)
        log = adb("logcat", "-d", "-s", *RUNTIME_TAGS)
        if not re.search(r"Godot Engine v4\.6\.3", log) or re.search(r"FATAL EXCEPTION|SCRIPT ERROR:", log):
            raise RuntimeError("Android runtime failed during orbit verification")
        print("ANDROID_ORIENTATIONS_OK")
        print("ANDROID_ORBIT_GESTURES_OK")
    finally:
        log = adb("logcat", "-d", "-s", *RUNTIME_TAGS, check=False)
        (output / "android.log").write_text(log, encoding="utf-8")
        if sys.exc_info()[0] is not None:
            lines = [line for line in log.splitlines() if "ORBIT_PROBE {" not in line]
            print("\n".join(lines[-100:]), file=sys.stderr)
            device_log = adb("logcat", "-b", "all", "-d", check=False)
            (output / "failure.device.log").write_text(device_log, encoding="utf-8")
            exit_info = adb("shell", "dumpsys", "activity", "exit-info", app, check=False)
            (output / "failure.exit-info").write_text(exit_info, encoding="utf-8")
            relevant = [line for line in device_log.splitlines()
                        if app in line or re.search(r"low.memory|lmkd|tombstone|SIGSEGV", line, re.I)]
            print("\n".join(relevant[-35:]), file=sys.stderr)
            (output / "failure.activities").write_text(adb("shell", "dumpsys", "activity", "activities", check=False), encoding="utf-8")
            (output / "failure.display").write_text(adb("shell", "dumpsys", "window", "displays", check=False), encoding="utf-8")
            try:
                screenshot(output, "failure")
            except (OSError, RuntimeError, subprocess.SubprocessError):
                pass
        for key in reversed(rotation_keys):
            value = rotation_settings[key]
            if value == "null":
                adb("shell", "settings", "delete", "system", key, check=False)
            else:
                adb("shell", "settings", "put", "system", key, value, check=False)
        if restore_notch:
            adb("shell", "cmd", "overlay", "disable", "--user", "0", overlay, check=False)


if __name__ == "__main__":
    main()
PY
