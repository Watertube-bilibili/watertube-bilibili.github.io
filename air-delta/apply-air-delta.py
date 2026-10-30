"""Replay only the verified air delta onto an exact source baseline; never overwrite it."""
from pathlib import Path
import argparse, hashlib, json, shutil

parser=argparse.ArgumentParser()
parser.add_argument('--base',required=True)
parser.add_argument('--destination',required=True)
args=parser.parse_args()
root=Path(__file__).resolve().parent
base=Path(args.base).resolve()
dest=Path(args.destination).resolve()
if dest.exists():raise SystemExit('Destination exists; refusing overwrite')
records=json.loads((root/'evidence/AIR-MERGE-MANIFEST.json').read_text())
for item in records:
 path=Path(item['path'])
 if path.is_absolute() or '..' in path.parts:raise SystemExit('Unsafe manifest path')
 old=base/path;new=root/path
 if item['base_sha256'] is None:
  if old.exists():raise SystemExit('New path already exists: '+str(path))
 elif not old.is_file() or hashlib.sha256(old.read_bytes()).hexdigest()!=item['base_sha256']:
  raise SystemExit('Baseline changed: '+str(path))
 if not new.is_file() or hashlib.sha256(new.read_bytes()).hexdigest()!=item['sha256']:
  raise SystemExit('Delta hash mismatch: '+str(path))
for tree in ['source','tests']:shutil.copytree(base/tree,dest/tree)
for item in records:
 path=Path(item['path']);(dest/path).parent.mkdir(parents=True,exist_ok=True);shutil.copy2(root/path,dest/path)
print(dest)
