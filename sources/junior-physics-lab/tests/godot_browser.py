"""Real WebAssembly RPC and all model-default integration test; serve dist on8780."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json,math,time
schema=json.loads((Path(__file__).resolve().parents[1]/'godot/model-schema.json').read_text())
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
 page=b.new_page()
 errors=[]
 page.on('pageerror',lambda e: errors.append(str(e)))
 page.goto('http://127.0.0.1:8780/engine/LICENSE.txt')
 page.set_content('<html><body><input id="keycheck"><canvas id="physicsCanvas" width="16" height="16" style="position:fixed;left:-32px"></canvas></body></html>')
 page.add_script_tag(url='http://127.0.0.1:8780/engine/loader.js')
 page.wait_for_function('GodotLab.ready',timeout=60000)
 outputs={}
 for model,item in schema['models'].items():
  params={c['key']:c['value'] for c in item['controls']}
  params['scenario']=item['scenarios'][0]
  start=time.monotonic()
  result=page.evaluate('([m,p])=>GodotLab.evaluate(m,p)',[model,params])
  assert result.get('readings') and result.get('values'),(model,result)
  assert result.get('solver','').startswith('Godot'),model
  outputs[model]=result
  print(model,round(time.monotonic()-start,3),result['values'],flush=True)
 # Test queue ordering, successive engine dynamics, and keyboard focus.
 queue=page.evaluate('()=>Promise.all([GodotLab.evaluate("incline",{length:1,angle:12,mass:200}),GodotLab.evaluate("incline",{length:1,angle:12,mass:500}),GodotLab.evaluate("circuit",{scenario:"parallel",voltage:6,resistance:10,resistance2:20})])')
 assert abs(queue[0]['values']['total']-queue[1]['values']['total'])<1e-5
 assert abs(queue[2]['values']['current']-.9)<1e-6
 page.locator('#keycheck').click()
 page.keyboard.type('keyboard works')
 assert page.locator('#keycheck').input_value()=='keyboard works'
 assert not errors,errors
 print('PASS',len(outputs),'families + queue + mass independence + keyboard')
 b.close()
