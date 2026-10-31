"""Real RPC/catalog SVG checks after catalog creation. No scientific fallback for unlisted scenarios."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,os
root=Path(__file__).resolve().parents[1]
base=os.environ.get('LAB_TEST_URL','http://127.0.0.1:8782')
schema=json.loads((root/'godot/model-schema.json').read_text())['models']
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
 page=b.new_page(viewport={'width':1200,'height':900})
 page.route(base+'/__physics-render-test.html',lambda route:route.fulfill(status=200,content_type='text/html; charset=utf-8',body='<meta charset="utf-8"><body></body>'))
 page.goto(base+'/__physics-render-test.html')
 assert page.evaluate('document.characterSet')=='UTF-8'
 page.set_content('<meta charset="utf-8"><div id="scenes" style="display:grid;grid-template-columns:1fr 1fr;gap:10px"></div>')
 page.add_script_tag(url=base+'/engine/loader.js');page.add_script_tag(url=base+'/modules/physics.js')
 catalog=root/'dist/catalog/physics.js'
 if not catalog.exists():raise RuntimeError('Final physics catalog is required; draft scenario aliases are not scientific validation')
 page.add_script_tag(url=base+'/catalog/physics.js');page.wait_for_function('GodotLab.ready',timeout=60000)
 records=page.evaluate('LAB_CATALOG.filter(x=>x.subject==="physics")')
 gaps=[];total=0;shots=[]
 for e in records:
  m=e['model'];s=e.get('modelParams',{}).get('scenario','')
  if m not in schema or s not in schema[m]['scenarios']:
   gaps.append((e['id'],m,s));continue
  # Controls must override experiment constants, matching the root application.
  params={c['key']:c['value'] for c in e.get('controls',[])}
  for mode in ['default','min','max']:
   p=dict(params)
   if mode!='default':
    for c in e.get('controls',[]):
     if mode in c:p[c['key']]=c[mode]
   result=page.evaluate('async([e,p])=>{const r=await LAB_MODULES.physics.simulate(e,p);const svg=LAB_MODULES.physics.render(e,p,r,.5);const doc=new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${svg}</svg>`,"image/svg+xml");return {svg,error:doc.querySelector("parsererror")?.textContent,solver:r.solver,values:r.values,graph:r.graph,trajectoryKind:r.trajectoryKind};}',[e,p])
   assert not result.get('error'),(e['id'],mode,result.get('error'))
   assert 'NaN' not in result['svg'] and 'Infinity' not in result['svg'],(e['id'],mode)
   assert result['solver'].startswith('Godot'),e['id']
   if s in ['mixture','alcohol_cycle'] or (s=='sublimation' and e.get('modelParams',{}).get('material')=='iodine'):
    assert result['values'].get('qualitative') is True and not result.get('graph'),(e['id'],'qualitative material scenario received an invented temperature curve')
   if e['id']=='phy-cold-bottle-condensation':assert isinstance(result['values'].get('condensing'),bool)
   if e['id']=='phy-pendulum-period':assert result.get('trajectoryKind')=='pendulumAngle'
   if e['id']=='phy-home-circuit-design':assert 'totalCurrent' in result['values']
   total+=1
   if mode=='default' and (e['id'] in ['phy-cup-telephone','phy-melting-curves','phy-periscope','phy-rgb-mixture','phy-telescope','phy-glass-microdeform','phy-archimedes','phy-egg-saltwater','phy-joule-resistance','phy-heat-capacity','phy-incline-speed','phy-piston-pump']):
    page.evaluate('([s,title])=>{const div=document.createElement("div");div.innerHTML=`<div style="font:16px serif;padding:7px">${title}</div><svg viewBox="0 0 900 430">${s}</svg>`;document.querySelector("#scenes").append(div)}',[result['svg'],e['title']])
  print(e['id'],'PASS',flush=True)
 page.screenshot(path='/tmp/physics-renderers-catalog.png',full_page=True)
 assert not gaps,('Catalog scenarios missing from engine schema',gaps)
 print('PASS',len(records),'catalog records;',total,'real RPC + SVG endpoint renders')
 b.close()
