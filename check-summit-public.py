from pathlib import Path
import hashlib, json, os, re, time, urllib.request
from urllib.parse import quote
game = 'https://watertube-bilibili.github.io/ridgebound/'
folder = Path('ridgebound')
version = 'summit-20261118'
def receipt(url, match, label):
    latest = ''
    for retry in range(16):
        try:
            query = urllib.request.Request(url, headers={'User-Agent': 'Ridgebound-Pages-Release-Check/2'})
            with urllib.request.urlopen(query, timeout=55) as response:
                payload = response.read()
            if match(payload):
                print('LIVE', label, len(payload), hashlib.sha256(payload).hexdigest(), flush=True)
                return payload
            latest = 'previous version or unexpected checksum'
        except Exception as ex:
            latest = repr(ex)
        time.sleep(7)
    raise SystemExit(f'{label} verification failed: {latest}')
def file(path, rel=None):
    local = folder / (rel or path)
    expected = hashlib.sha256(local.read_bytes()).digest()
    return receipt(game + path + '?v=' + version, lambda data: hashlib.sha256(data).digest() == expected, path)
entry = (folder/'index.html').read_text()
game_src = re.search(r'src="\./(game\.mjs\?v=[a-f0-9]+)"',entry).group(1)
for endpoint in ['?v='+version,'index.html?v='+version]:
    receipt(game+endpoint,lambda data: version.encode() in data and game_src.encode() in data, 'entry '+endpoint)
for path in ['game.mjs','device-layout.mjs','device-profiles.json','style.css','assets/camp-tall.webp','assets/camp-wide.webp']:
    file(path)
manifest = json.loads((folder/'engine/assets.mjs').read_text().split('export default ',1)[1].rstrip(';\n'))
file('engine/'+manifest['pack']['url'])
file('engine/'+manifest['pack']['gzip'])
for name in ['Ridgebound-Setup-x64.exe','Ridgebound-Windows-x64.zip','Ridgebound-source.bundle']:
    file('downloads/'+name)
if os.environ.get('VERIFY_ANDROID') == '1':
    file('downloads/Ridgebound-Android.apk')
print('PUBLIC_SUMMIT_OK', flush=True)
