#!/usr/bin/env python3
"""Set the minimum SDK in an official Godot Android template before signing."""
import struct
import sys
from zipfile import ZipFile


def u16(data, pos):
    return struct.unpack_from("<H", data, pos)[0]


def u32(data, pos):
    return struct.unpack_from("<I", data, pos)[0]


def length(data, pos, utf8):
    """Decode Android's one- or two-word string length."""
    word, flag = (data[pos], 0x80) if utf8 else (u16(data, pos), 0x8000)
    span = 1 if utf8 else 2
    if word & flag:
        following = data[pos + span] if utf8 else u16(data, pos + span)
        return ((word & (flag - 1)) << (span * 8)) | following, pos + span * 2
    return word, pos + span


def strings(data, pos, header_size, chunk_end):
    count = u32(data, pos + 8)
    if pos + header_size + count * 4 > chunk_end:
        raise ValueError("Invalid Android XML string pool")
    utf8 = bool(u32(data, pos + 16) & 0x100)
    start = pos + u32(data, pos + 20)
    for index in range(count):
        value_start = start + u32(data, pos + header_size + index * 4)
        char_count, value_start = length(data, value_start, utf8)
        if utf8:
            byte_count, value_start = length(data, value_start, True)
            encoding = "utf-8"
        else:
            byte_count = char_count * 2
            encoding = "utf-16le"
        if not start <= value_start <= value_start + byte_count <= chunk_end:
            raise ValueError("Invalid string in Android XML string pool")
        yield data[value_start:value_start + byte_count].decode(encoding)


def patch_manifest(original, minimum_sdk):
    data = bytearray(original)
    if len(data) < 8 or u16(data, 0) != 3 or u32(data, 4) != len(data):
        raise ValueError("Unexpected Android manifest format")
    names = []
    uses_sdk_count = 0
    pos = u16(data, 2)
    previous = None
    while pos < len(data):
        chunk_type = u16(data, pos)
        header_size = u16(data, pos + 2)
        size = u32(data, pos + 4)
        if not 8 <= header_size <= size <= len(data) - pos:
            raise ValueError("Invalid Android manifest node")
        if chunk_type == 1:
            names = list(strings(data, pos, header_size, pos + size))
        elif chunk_type == 0x0102:
            extension = pos + header_size
            if not extension + 20 <= pos + size:
                raise ValueError("Invalid Android XML start node")
            if names[u32(data, extension + 4)] == "uses-sdk":
                uses_sdk_count += 1
                start = extension + u16(data, extension + 8)
                span = u16(data, extension + 10)
                count = u16(data, extension + 12)
                if not start >= extension + 20 or span < 20 or start + span * count > pos + size:
                    raise ValueError("Invalid uses-sdk attributes")
                for attr in range(start, start + span * count, span):
                    if names[u32(data, attr + 4)] != "minSdkVersion":
                        continue
                    if previous is not None or u16(data, attr + 12) != 8 or data[attr + 15] not in (0x10, 0x11):
                        raise ValueError("Expected one integer SDK constraint")
                    previous = u32(data, attr + 16)
                    if previous > minimum_sdk:
                        raise ValueError("Refusing to lower the template SDK requirement")
                    struct.pack_into("<I", data, attr + 8, 0xFFFFFFFF)
                    data[attr + 15] = 0x10
                    struct.pack_into("<I", data, attr + 16, minimum_sdk)
        pos += size
    if uses_sdk_count != 1 or previous is None:
        raise ValueError("Expected one uses-sdk/minSdkVersion in the Android template")
    print(f"Android minimum SDK {previous} -> {minimum_sdk}")
    return data


def main():
    source, output = sys.argv[1:3]
    minimum_sdk = int(sys.argv[3])
    with ZipFile(source) as template, ZipFile(output, "w") as updated:
        for entry in template.infolist():
            data = template.read(entry)
            if entry.filename == "AndroidManifest.xml":
                data = patch_manifest(data, minimum_sdk)
            updated.writestr(entry, data)


if __name__ == "__main__":
    main()
