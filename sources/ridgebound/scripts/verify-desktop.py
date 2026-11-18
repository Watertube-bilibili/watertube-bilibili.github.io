"""Verify the native package's binary formats, imports and portable file set."""
from pathlib import Path
import re
import struct
import subprocess
import sys
from zipfile import ZIP_DEFLATED, ZipFile


def verify_pe(file, allowed_machines):
    with file.open("rb") as handle:
        dos = handle.read(64)
        if len(dos) != 64 or dos[:2] != b"MZ":
            raise ValueError(f"Missing DOS header: {file.name}")
        handle.seek(struct.unpack_from("<I", dos, 60)[0])
        pe = handle.read(96)
    if (
        len(pe) != 96
        or pe[:4] != b"PE\0\0"
        or struct.unpack_from("<H", pe, 4)[0] not in allowed_machines
    ):
        raise ValueError(f"Incorrect PE architecture: {file.name}")
    subsystem_version = struct.unpack_from("<HH", pe, 24 + 48)
    if subsystem_version > (6, 1):
        raise ValueError(f"PE subsystem requires newer than Windows 7: {file.name}")


def imports(file):
    info = subprocess.check_output(
        ["x86_64-w64-mingw32-objdump", "-p", str(file)], text=True
    )
    dlls = set(re.findall(r"DLL Name:\s+(\S+)", info.lower(), flags=re.IGNORECASE))
    if not dlls:
        raise ValueError(f"No PE import table found: {file.name}")
    return dlls, info


def main():
    files, setup, template, output = map(Path, sys.argv[1:])
    game = files / "Ridgebound.exe"
    helper = files / "ridgebound-wheel-bridge.exe"
    pck = files / "Ridgebound.pck"
    verify_pe(game, {0x8664})
    verify_pe(helper, {0x8664})
    verify_pe(setup, {0x14C, 0x8664})

    game_dlls, _ = imports(game)
    template_dlls, _ = imports(template)
    if game_dlls != template_dlls:
        raise ValueError("Godot export imports differ from the upstream 4.4.1 template")
    helper_dlls, helper_imports = imports(helper)
    helper_system_dlls = {
        "advapi32.dll", "bcrypt.dll", "crypt32.dll", "dinput8.dll", "gdi32.dll",
        "iphlpapi.dll", "kernel32.dll", "msvcrt.dll", "ntdll.dll", "psapi.dll",
        "ole32.dll", "oleaut32.dll", "shell32.dll", "shlwapi.dll", "user32.dll",
        "version.dll", "winmm.dll", "ws2_32.dll",
    }
    unknown = helper_dlls - helper_system_dlls
    if unknown:
        raise ValueError(f"Helper unexpectedly needs extra DLLs: {sorted(unknown)}")
    newer_winapi = {
        "CreateFile2", "GetSystemTimePreciseAsFileTime", "GetThreadDescription",
        "IsWow64Process2", "SetThreadDescription", "WaitOnAddress", "WakeByAddressSingle",
    }
    unavailable = {api for api in newer_winapi if re.search(rf"\b{api}\b", helper_imports)}
    if unavailable:
        raise ValueError(f"Helper imports APIs unavailable on Windows 7: {sorted(unavailable)}")
    print("Godot template imports:", ", ".join(sorted(game_dlls)))
    print("Helper imports:", ", ".join(sorted(helper_dlls)))

    with pck.open("rb") as handle:
        header = handle.read(20)
    if len(header) != 20 or header[:4] != b"GDPC" or struct.unpack_from("<III", header, 8) != (4, 4, 1):
        raise ValueError("PCK header does not match Godot 4.4.1")

    names = {}
    for file in sorted(files.rglob("*")):
        if file.is_file():
            names[f"Ridgebound/{file.relative_to(files).as_posix()}"] = file
    with ZipFile(output, "w", compression=ZIP_DEFLATED, compresslevel=9) as zip_file:
        for name, file in names.items():
            zip_file.write(file, name)
    with ZipFile(output) as zip_file:
        if set(zip_file.namelist()) != set(names) or zip_file.testzip() is not None:
            raise ValueError("Portable ZIP contents or CRC check failed")
        for name in ("Ridgebound.exe", "Ridgebound.pck", "ridgebound-wheel-bridge.exe", "README.txt"):
            if f"Ridgebound/{name}" not in names:
                raise ValueError(f"Portable ZIP is missing {name}")


if __name__ == "__main__":
    main()
