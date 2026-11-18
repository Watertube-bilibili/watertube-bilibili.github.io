extends RefCounted
## A limited reader for local map ZIPs. The central directory is validated before
## any entry is read. Nothing is extracted to the filesystem.

const MAX_ARCHIVE_BYTES: int = 128 * 1024 * 1024
const MAX_ENTRIES: int = 8192
const MAX_DIRECTORY_BYTES: int = 8 * 1024 * 1024
const CENTRAL_SIGNATURE: int = 0x02014b50
const LOCAL_SIGNATURE: int = 0x04034b50
const END_SIGNATURE: int = 0x06054b50

var _file: FileAccess
var _directory_offset: int
var entries: Dictionary = {}
var error: String = ""

func _fail(message: String) -> bool:
	error = message
	return false

static func safe_path(path: String) -> bool:
	if path.is_empty() or path.length() > 512 or path.begins_with("/") or "\\" in path or ":" in path:
		return false
	for part: String in path.trim_suffix("/").split("/"):
		if part.is_empty() or part == "." or part == "..":
			return false
	for index: int in range(path.length()):
		if path.unicode_at(index) < 32:
			return false
	return true

func open(path: String) -> bool:
	entries.clear()
	error = ""
	_file = FileAccess.open(path, FileAccess.READ)
	if _file == null:
		return _fail("无法打开地图 ZIP。")
	var length: int = _file.get_length()
	if length < 22 or length > MAX_ARCHIVE_BYTES:
		return _fail("地图 ZIP 必须小于或等于 128 MiB。")
	var tail_start: int = maxi(0, length - 22 - 65535)
	_file.seek(tail_start)
	var tail: PackedByteArray = _file.get_buffer(length - tail_start)
	if tail.size() != length - tail_start:
		return _fail("无法读取 ZIP 目录。")
	var footer: int = -1
	for offset: int in range(tail.size() - 22, -1, -1):
		if tail.decode_u32(offset) == END_SIGNATURE and offset + 22 + tail.decode_u16(offset + 20) == tail.size():
			footer = offset
			break
	if footer < 0:
		return _fail("文件不是有效的 ZIP。")
	var count: int = tail.decode_u16(footer + 10)
	var directory_size: int = tail.decode_u32(footer + 12)
	_directory_offset = tail.decode_u32(footer + 16)
	if tail.decode_u16(footer + 4) != 0 or tail.decode_u16(footer + 6) != 0 or tail.decode_u16(footer + 8) != count:
		return _fail("该 ZIP 分卷格式不受支持。")
	if count < 1 or count > MAX_ENTRIES or directory_size > MAX_DIRECTORY_BYTES:
		return _fail("ZIP 目录过大或为空。")
	if _directory_offset + directory_size != tail_start + footer:
		return _fail("ZIP 目录偏移无效，或使用了 ZIP64。")
	_file.seek(_directory_offset)
	var directory: PackedByteArray = _file.get_buffer(directory_size)
	if directory.size() != directory_size:
		return _fail("ZIP 目录截断。")
	var cursor: int = 0
	for _entry: int in range(count):
		if cursor + 46 > directory_size or directory.decode_u32(cursor) != CENTRAL_SIGNATURE:
			return _fail("ZIP 中央目录损坏。")
		var name_size: int = directory.decode_u16(cursor + 28)
		var extras: int = directory.decode_u16(cursor + 30) + directory.decode_u16(cursor + 32)
		var next: int = cursor + 46 + name_size + extras
		if name_size < 1 or name_size > 512 or next > directory_size:
			return _fail("ZIP 文件名或目录记录无效。")
		var raw_name: PackedByteArray = directory.slice(cursor + 46, cursor + 46 + name_size)
		var name: String = raw_name.get_string_from_utf8()
		var key: String = name.to_lower()
		if raw_name != name.to_utf8_buffer() or not safe_path(name) or entries.has(key):
			return _fail("ZIP 包含不安全或重复的文件路径。")
		var local_offset: int = directory.decode_u32(cursor + 42)
		var packed_size: int = directory.decode_u32(cursor + 20)
		var unpacked_size: int = directory.decode_u32(cursor + 24)
		if directory.decode_u16(cursor + 34) != 0 or local_offset + 30 + packed_size > _directory_offset or unpacked_size == 0xffffffff:
			return _fail("ZIP 文件区块越界，或使用了 ZIP64。")
		entries[key] = {
			"name": name, "offset": local_offset, "compressed": packed_size,
			"size": unpacked_size, "method": directory.decode_u16(cursor + 10),
			"flags": directory.decode_u16(cursor + 8), "crc": directory.decode_u32(cursor + 16),
		}
		cursor = next
	return cursor == directory_size or _fail("ZIP 目录有额外数据。")

func read_entry(key: String, byte_limit: int) -> PackedByteArray:
	if not entries.has(key):
		return PackedByteArray()
	var entry: Dictionary = entries[key]
	var size: int = entry.size
	var packed_size: int = entry.compressed
	var method: int = entry.method
	# Each selected entry has its own hard allocation budget.
	if size <= 0 or size > byte_limit or packed_size > byte_limit + 65536 or (int(entry.flags) & 0x2041) != 0:
		return PackedByteArray()
	if method != 0 and method != 8:
		return PackedByteArray()
	_file.seek(int(entry.offset))
	var header: PackedByteArray = _file.get_buffer(30)
	if header.size() != 30 or header.decode_u32(0) != LOCAL_SIGNATURE:
		return PackedByteArray()
	var name_size: int = header.decode_u16(26)
	var data_start: int = entry.offset + 30 + name_size + header.decode_u16(28)
	if data_start + packed_size > _directory_offset or name_size != str(entry.name).to_utf8_buffer().size():
		return PackedByteArray()
	if header.decode_u16(8) != method or header.decode_u16(6) != entry.flags:
		return PackedByteArray()
	if _file.get_buffer(name_size) != str(entry.name).to_utf8_buffer():
		return PackedByteArray()
	_file.seek(data_start)
	var bytes: PackedByteArray = _file.get_buffer(packed_size)
	if bytes.size() != packed_size:
		return PackedByteArray()
	if method == 0:
		return bytes if packed_size == size else PackedByteArray()
	# ZIP method 8 and gzip use the same raw DEFLATE stream. Add gzip framing
	# so Godot can enforce the validated output size and the ZIP entry CRC.
	var gzip: PackedByteArray = PackedByteArray([31, 139, 8, 0, 0, 0, 0, 0, 0, 255])
	gzip.append_array(bytes)
	gzip.resize(gzip.size() + 8)
	gzip.encode_u32(gzip.size() - 8, int(entry.crc))
	gzip.encode_u32(gzip.size() - 4, size)
	var unpacked: PackedByteArray = gzip.decompress(size, FileAccess.COMPRESSION_GZIP)
	return unpacked if unpacked.size() == size else PackedByteArray()
