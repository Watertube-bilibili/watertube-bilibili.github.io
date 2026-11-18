"""Package the same web release with the separately built Windows input/FFB bridge."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json, hashlib
source = Path(__file__).resolve().parents[1]
site = source.parents[1]
web = site / 'ridgebound'
bridge = source / 'windows-bridge'
exe = web / 'downloads/ridgebound-wheel-bridge.exe'
assert exe.is_file(), 'Build the DirectInput bridge first.'
assert (web / 'engine/ridgebound.wasm').is_file(), 'Export Godot Web first.'
output = web / 'downloads/ridgebound-windows.zip'
with ZipFile(output, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
    archive.write(exe, exe.name)
    for name in ['Start-Ridgebound.bat', 'README.md', 'LICENSE', 'THIRD-PARTY.md']:
        archive.write(bridge / name, name)
    for file in (bridge / 'licenses').rglob('*'):
        if file.is_file(): archive.write(file, 'bridge-licenses/' + str(file.relative_to(bridge / 'licenses')))
    for file in sorted(web.rglob('*')):
        rel = file.relative_to(web)
        if not file.is_file() or rel.parts[0] == 'downloads': continue
        if rel.as_posix() == 'index.html':
            html = file.read_text().replace('../projects.html', 'https://watertube-bilibili.github.io/projects.html')
            archive.writestr('web/index.html', html)
        else: archive.write(file, 'web/' + rel.as_posix())
print(output)
print('ZIP_BYTES', output.stat().st_size)
print('SHA256', hashlib.sha256(output.read_bytes()).hexdigest())
