"""Validate static browser preview graph, import-map hashes and excluded native files."""
from pathlib import Path
import argparse, hashlib, json, re, subprocess

R=Path(__file__).resolve().parent
parser=argparse.ArgumentParser();parser.add_argument('--root',type=Path,default=R/'deploy/sunrise-browser-preview');args=parser.parse_args();root=args.root.resolve()
errors=[];modules=[]
for f in root.rglob('*'):
    if not f.is_file():continue
    p=str(f.relative_to(root))
    if re.search(r'godot|\.wasm|\.pck|/physics/|\.php|air-preview-evidence',p,re.I):errors.append('unexpected native/QA file: '+p)
    if f.suffix not in ['.js','.mjs']:continue
    modules.append(f)
    for match in re.finditer(r'''(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)['"]([^'"]+)['"]''',f.read_text()):
        specifier=match[1].split('?')[0]
        if specifier.startswith('.') and not (f.parent/specifier).is_file():errors.append(p+': missing '+specifier)
index=root/'runtime-candidate/sunset-coast/play/index.html';html=index.read_text()
mapping=json.loads(re.search(r'<script type="importmap">(.*?)</script>',html,re.S)[1])['imports']
for key,value in mapping.items():
    path,_,query=value.partition('?');target=index.parent/path
    if not target.is_file():errors.append('import map missing: '+value);continue
    if query.startswith('v=') and query[2:]!=hashlib.sha256(target.read_bytes()).hexdigest()[:12]:errors.append('stale hash: '+value)
for f in modules:
    result=subprocess.run(['node','--check',str(f)],capture_output=True,text=True)
    if result.returncode:errors.append(str(f)+': '+result.stderr)
report={'modules':len(modules),'import_map_entries':len(mapping),'errors':errors,'browser_gameplay_accepted':False}
(R/'evidence/STATIC-PREVIEW-CHECK.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report));raise SystemExit(bool(errors))
