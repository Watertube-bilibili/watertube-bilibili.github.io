"""Build the isolated static browser preview from verified recovered source.

Run: python3 build-preview.py [--out /absolute/empty/output]
No native runner, WASM, PHP, QA endpoint, or old save is deployed here.
"""
from pathlib import Path
import argparse, hashlib, json, re, shutil, runpy

R=Path(__file__).resolve().parent
runpy.run_path(str(R/'bootstrap-source.py'),run_name='__main__')
parser=argparse.ArgumentParser()
parser.add_argument('--out',type=Path,default=R/'deploy/sunrise-browser-preview')
args=parser.parse_args()
S=R/'source'; D=args.out.resolve(); P='runtime-candidate/sunset-coast/play/'
if D.exists() and any(D.iterdir()):raise SystemExit('Refuse nonempty output; choose a new --out directory')
expected=json.loads((R/'evidence/SOURCE-MANIFEST-current.json').read_text())
for path,digest in expected.items():
    f=S/path
    if not f.is_file() or f.is_symlink() or hashlib.sha256(f.read_bytes()).hexdigest()!=digest:raise SystemExit('Source mismatch: '+path)
original=json.loads((R/'evidence/EXPECTED-V5-BROWSER-STAGE-MANIFEST.json').read_text())
paths={record['path'] for record in original}-{'index.html','ASSET-CREDITS.txt'}
for path in sorted(paths):
    f=S/path
    if not f.is_file() or f.is_symlink():raise SystemExit('Missing source: '+path)
    out=D/path;out.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(f,out)
(D/P/'physics-backend.js').write_text("import {browserWorldRequest} from './browser-world-policy.js';\nconst request=browserWorldRequest();\nexport const browserPhysicsRequested=true;\nexport async function loadPhysicsBackend(){if(!request)throw Error('请从日出独立存档页进入');const {BrowserPhysicsSystem}=await import('./browser-physics.js');return {PhysicsSystem:BrowserPhysicsSystem,preloadPhysics:async()=>{}};}\n")
(D/P/'candidate-entry.js').write_text("import {browserWorldRequest} from './browser-world-policy.js';\nimport {startBrowserWorld} from './browser-world-entry.js';\nconst request=browserWorldRequest();if(!request)throw Error('请从日出独立存档页进入');await startBrowserWorld(request);\n")
f=D/P/'browser-canonical-entry.js';s=f.read_text();s=re.sub(r" if\(\['localhost'.*?return \{kind:'local-browser-preview'\};\n",'',s);assert "return {kind:'local-browser-preview'}" not in s;f.write_text(s)
f=D/P/'delivery-ui.js';s=f.read_text();marker=" if(!production&&new URLSearchParams(location.search).get('deliveryQA')==='1'){";assert marker in s;s=s[:s.index(marker)]+'\n}\n';f.write_text(s)
for name in ['index.html','browser-worlds.html']:
    f=D/'runtime-candidate/sunset-coast'/name;s=f.read_text()
    s=s.replace('本地整合候选，尚未正式发布','独立测试版，尚未完成正式游戏验收')
    s=s.replace('href="../../../?manage=1"','href="../../../sunset-coast/?manage=1"')
    f.write_text(s)
f=D/P/'index.html';s=f.read_text();m=re.search(r'<script type="importmap">(.*?)</script>',s,re.S);d=json.loads(m[1]);d['imports']={k:v for k,v in d['imports'].items() if (f.parent/v.split('?')[0]).is_file()};s=s[:m.start(1)]+json.dumps(d,indent=2)+s[m.end(1):];s=re.sub(r'(\./[^\s\"\'<>?]+)\?v=[a-f0-9]+',lambda m:m[1]+'?v='+hashlib.sha256((f.parent/m[1]).read_bytes()).hexdigest()[:12] if (f.parent/m[1]).is_file() else m[0],s);f.write_text(s)
(D/'index.html').write_text('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SUNRISE · 浏览器测试版</title><meta http-equiv="refresh" content="0;url=./runtime-candidate/sunset-coast/"><a href="./runtime-candidate/sunset-coast/">进入日出地图与独立进度测试版</a></html>')
(D/'ASSET-CREDITS.txt').write_text('Asphalt 01: Poly Haven CC0. Original vehicle model and retained third-party runtime licenses remain with their assets. Isolated browser preview; not full-game acceptance.\n')
records=[{'path':str(f.relative_to(D)),'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for f in sorted(D.rglob('*')) if f.is_file()]
assert not any(re.search(r'godot|\.wasm|\.pck|/physics/|\.php|air-preview-evidence',r['path'],re.I) for r in records)
(R/'evidence/DEPLOY-PREVIEW-MANIFEST.json').write_text(json.dumps(records,indent=2)+'\n')
print(json.dumps({'output':str(D),'files':len(records),'bytes':sum(r['bytes'] for r in records),'browser_gameplay_accepted':False}))
