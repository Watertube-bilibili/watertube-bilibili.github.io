"""Run with dist served at 8782; real Godot -> each scientific scene -> SVG XML."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,os
root=Path(__file__).resolve().parents[1]
schema=json.loads((root/'godot/model-schema.json').read_text())
base=os.environ.get('LAB_TEST_URL','http://127.0.0.1:8782')
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
 page=b.new_page(viewport={'width':1200,'height':900})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.route(base+'/__physics-render-test.html',lambda route:route.fulfill(status=200,content_type='text/html; charset=utf-8',body='<meta charset="utf-8"><body></body>'))
 page.goto(base+'/__physics-render-test.html')
 assert page.evaluate('document.characterSet')=='UTF-8'
 page.set_content('<meta charset="utf-8"><body style="margin:0;background:#dae4eb"><div id="scenes" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px"></div></body>')
 page.add_script_tag(url=base+'/engine/loader.js')
 [page.add_script_tag(url=base+'/modules/physics/'+scene.name) for scene in sorted((root/'dist/modules/physics').glob('*.js'))];page.add_script_tag(url=base+'/modules/physics.js')
 page.wait_for_function('GodotLab.ready',timeout=60000)
 total=0;seen=[]
 for model,item in schema['models'].items():
  params={c['key']:c['value'] for c in item['controls']+item.get('extraControls',[])}
  for scenario in item['scenarios']:
   params['scenario']=scenario
   result=page.evaluate('async ([model,p])=>{const e={id:model+"-"+p.scenario,model,modelParams:p}; const r=await LAB_MODULES.physics.simulate(e,{});const svg=LAB_MODULES.physics.render(e,{},r,.5);const doc=new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${svg}</svg>`,"image/svg+xml");return {svg,parseError:doc.querySelector("parsererror")?.textContent,values:r.values,solver:r.solver};}',[model,params])
   assert not result.get('parseError'),(model,scenario,result.get('parseError'))
   assert 'NaN' not in result['svg'] and 'Infinity' not in result['svg'],(model,scenario)
   assert result['solver'].startswith('Godot'),(model,scenario)
   total+=1
   if scenario==item['scenarios'][0]:
    seen.append(result['svg'])
    page.evaluate('([s,title])=>{const div=document.createElement("div");div.innerHTML=`<div style="font:14px sans-serif;padding:5px;color:#28445b">${title}</div><svg viewBox="0 0 900 430">${s}</svg>`;document.querySelector("#scenes").append(div)}',[result['svg'],model])
  print(model,'PASS',len(item['scenarios']),flush=True)
 assert len(set(seen))==len(schema['models'])
 assert not errors,errors
 page.screenshot(path='/tmp/physics-renderers-overview.png',full_page=True)
 print('PASS',total,'real Godot model/scenario SVG scenes')
 b.close()
