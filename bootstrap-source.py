"""Re-create the omitted native WASM from its exact vendored gzip, without network access."""
from pathlib import Path
import gzip, hashlib, os, tempfile

ROOT=Path(__file__).resolve().parent
TARGET=ROOT/'source/runtime-candidate/sunset-coast/play/physics/neon-physics.wasm'
COMPRESSED=TARGET.with_suffix('.wasm.gz')
RAW_SHA256='26b61ce95247012ab3dca3ff51e96d1cdbff44ee91a8c20a83e150afca83f1b6'
GZIP_SHA256='9352825a316f4449b81d326706e78be95ed5a81c0e797f35879ef8b39bc505bd'
RAW_BYTES=37700666
GZIP_BYTES=9382282

def digest(path):
    h=hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda:stream.read(1024*1024),b''):h.update(chunk)
    return h.hexdigest()

def bootstrap():
    if not COMPRESSED.is_file() or COMPRESSED.is_symlink() or COMPRESSED.stat().st_size!=GZIP_BYTES or digest(COMPRESSED)!=GZIP_SHA256:
        raise SystemExit('Native gzip is missing or differs from the verified recovery bytes')
    if TARGET.exists():
        if TARGET.is_symlink() or TARGET.stat().st_size!=RAW_BYTES or digest(TARGET)!=RAW_SHA256:
            raise SystemExit('Existing native WASM differs from the verified recovery bytes; refusing overwrite')
        print('Native WASM verified: '+RAW_SHA256)
        return
    temporary=None
    try:
        with tempfile.NamedTemporaryFile(prefix='.wasm-rebuild-',dir=TARGET.parent,delete=False) as output:
            temporary=Path(output.name);total=0;h=hashlib.sha256()
            with gzip.open(COMPRESSED,'rb') as source:
                while chunk:=source.read(1024*1024):
                    total+=len(chunk)
                    if total>RAW_BYTES:raise ValueError('Native WASM exceeds its verified size')
                    output.write(chunk);h.update(chunk)
        if total!=RAW_BYTES or h.hexdigest()!=RAW_SHA256:raise ValueError('Regenerated native WASM hash mismatch')
        os.replace(temporary,TARGET);temporary=None
        print('Native WASM regenerated and verified: '+RAW_SHA256)
    finally:
        if temporary is not None:temporary.unlink(missing_ok=True)

if __name__=='__main__':bootstrap()
