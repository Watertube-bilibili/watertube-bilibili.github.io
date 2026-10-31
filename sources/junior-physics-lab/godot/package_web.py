"""Pack the official Godot Web export for static hosts with 25 MiB asset limits."""
from pathlib import Path
import gzip
root=Path(__file__).resolve().parent.parent
engine=root/'dist/engine'
wasm=engine/'lab.wasm'
if wasm.exists():
    (engine/'lab.wasm.bin').write_bytes(gzip.compress(wasm.read_bytes(),compresslevel=9,mtime=0))
    wasm.unlink()
js=engine/'lab.js'
s=js.read_text()
needle='loadPromise = preloader.loadPromise(`${loadPath}.wasm`, size, true);'
assert needle in s or 'window.__godotWasmResponse ||' in s, 'Godot loader layout changed; inspect packaging hook.'
s=s.replace(needle,'loadPromise = window.__godotWasmResponse || preloader.loadPromise(`${loadPath}.wasm`, size, true);')
js.write_text(s)
# The site's own accessible HTML is the only entrypoint.
for name in ['lab.html','lab.png']:
    (engine/name).unlink(missing_ok=True)
print('Web physics packaged:', (engine/'lab.wasm.bin').stat().st_size, 'compressed bytes')
