from pathlib import Path
import re,json,hashlib
p=Path(__file__).parent/'runtime-candidate/sunset-coast/play';f=p/'index.html';s=f.read_text();m=re.search(r'<script type="importmap">(.*?)</script>',s,re.S);data=json.loads(m[1]);
for k,v in data['imports'].items():
 path=p/v.split('?')[0]
 if path.is_file() and '?v=' in v:data['imports'][k]=v.split('?')[0]+'?v='+hashlib.sha256(path.read_bytes()).hexdigest()[:12]
s=s[:m.start(1)]+json.dumps(data,indent=2)+s[m.end(1):];s=re.sub(r'src="\./candidate-entry.js(?:\?[^"]*)?"','src="./candidate-entry.js?v='+hashlib.sha256((p/'candidate-entry.js').read_bytes()).hexdigest()[:12]+'"',s);f.write_text(s)
