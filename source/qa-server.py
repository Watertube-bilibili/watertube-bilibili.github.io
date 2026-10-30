from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parent
OUT=ROOT.parent/'coast-collision-wheels-evidence-20261029'
OUT.mkdir(parents=True,exist_ok=True)
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def do_POST(self):
  name=self.path.removeprefix('/qa-evidence/')
  if not self.path.startswith('/qa-evidence/') or not re.fullmatch('[a-z0-9-]{1,70}',name):self.send_error(404);return
  size=int(self.headers.get('Content-Length','0'))
  if size>1000000:self.send_error(413);return
  data=json.loads(self.rfile.read(size));f=OUT/(name+'.json')
  if f.exists():f=OUT/(name+'-'+str(__import__('time').time_ns())+'.json')
  f.write_text(json.dumps(data,indent=2));self.send_response(200);self.end_headers();self.wfile.write(b'OK')
ThreadingHTTPServer(('127.0.0.1',8765),Handler).serve_forever()
