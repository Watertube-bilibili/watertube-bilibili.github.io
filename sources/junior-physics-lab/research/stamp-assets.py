# SPDX-License-Identifier: AGPL-3.0-only
"""Stamp HTML assets after catalog generation and Godot export to avoid mixed releases."""
import hashlib
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1] / 'dist'
digest = hashlib.sha256()
for path in sorted(root.rglob('*')):
    if path.is_file() and path.suffix in {'.js', '.css', '.pck'}:
        digest.update(str(path.relative_to(root)).encode())
        digest.update(path.read_bytes())
revision = digest.hexdigest()[:12]
index = root / 'index.html'
html = re.sub(r'((?:src|href)="(?!https?://)[^"?]+\.(?:js|css))(?:\?v=[^"&]+)?"', lambda match: match[1]+'?v='+revision+'"', index.read_text())
index.write_text(html)
print('Asset revision:', revision)
