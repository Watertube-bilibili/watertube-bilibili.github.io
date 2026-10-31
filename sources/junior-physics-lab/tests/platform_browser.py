"""Browser integration checks. Serve dist/ first; LAB_URL defaults to port 8000.
Uses the actual Godot WebAssembly runtime, no physics mock.
"""
# SPDX-License-Identifier: AGPL-3.0-only
import json, os, time
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE=os.environ.get("LAB_URL", "http://127.0.0.1:8000/")
OUT=Path(os.environ.get("LAB_TEST_OUTPUT", "/tmp/junior-lab-browser"))
OUT.mkdir(parents=True, exist_ok=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=os.environ.get("CHROMIUM_PATH", "/usr/bin/chromium"),args=["--no-sandbox","--enable-unsafe-swiftshader"])
 page=browser.new_page(viewport={"width":1440,"height":1050}, device_scale_factor=1)
 errors=[]; failed=[]
 page.on("pageerror",lambda e: errors.append(str(e)))
 page.on("response",lambda r: failed.append([r.status,r.url]) if r.status>=400 and r.url.startswith(BASE) else None)
 page.goto(BASE)
 page.wait_for_function("window.GodotLab?.ready",timeout=60000)
 counts=page.evaluate("Object.fromEntries(['physics','chemistry','biology'].map(s=>[s,LAB_CATALOG.filter(e=>e.subject===s).length]))")
 assert all(counts.values()),counts
 assert page.locator(".experiment-card").count()==sum(counts.values())
 assert page.evaluate("document.documentElement.scrollWidth<=innerWidth"),"desktop overflow"
 page.screenshot(path=str(OUT/"catalog-desktop.png"))

 # Default simulation and three progress positions for every actual catalog entry.
 # Invalid SVG XML or missing apparatus is a user-visible failure even without JS errors.
 report=page.evaluate("""async()=>{
  const report=[];
  for(const e of LAB_CATALOG){
   const params={...e.modelParams,...Object.fromEntries(e.controls.map(c=>[c.key,c.value]))};
   try{
    const m=LAB_MODULES[e.subject],r=await m.simulate(e,params,1);
    if(!r.readings?.length||!r.process?.length)throw Error('Missing data or process');
    if(e.subject==='physics'&&!r.solver?.startsWith('Godot'))throw Error('Physics did not use Godot');
    for(const t of[0,.5,1]){
     const svg=m.render(e,params,r,t);
     if(/NaN|Infinity|undefined/.test(svg))throw Error('Invalid SVG token at '+t);
     const doc=new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">'+svg+'</svg>','image/svg+xml');
     if(doc.querySelector('parsererror'))throw Error('Invalid SVG XML at '+t+': '+doc.querySelector('parsererror').textContent);
    }
    report.push({id:e.id,ok:true,readings:r.readings.length});
   }catch(error){report.push({id:e.id,ok:false,error:String(error)});}
  }
  return report;
 }""")
 (OUT/"all-experiments.json").write_text(json.dumps(report,ensure_ascii=False,indent=2))
 broken=[r for r in report if not r['ok']]
 assert not broken,json.dumps(broken,ensure_ascii=False)

 # Search, subject and semester filtering, then reset filters.
 page.locator('#catalogSearch').fill('密度')
 assert 0<page.locator('.experiment-card').count()<sum(counts.values())
 page.locator('#catalogSearch').fill('')
 page.locator('[data-subject="biology"]').click()
 page.locator('#termSelect').select_option('7上')
 expected=page.evaluate("LAB_CATALOG.filter(e=>e.subject==='biology'&&(e.term==='7上'||e.relatedTerms?.includes('7上'))).length")
 assert page.locator('.experiment-card').count()==expected and expected>0
 page.locator('[data-subject="all"]').click()
 page.locator('#termSelect').select_option('all')
 representatives=page.evaluate("['physics','chemistry','biology'].map(s=>LAB_CATALOG.find(e=>e.subject===s&&e.interaction.mode==='playback'&&(s!=='physics'||e.model==='incline'))?.id||LAB_CATALOG.find(e=>e.subject===s).id)")
 for i,lab_id in enumerate(representatives):
  page.evaluate("id=>location.hash='lab='+encodeURIComponent(id)",lab_id)
  page.wait_for_function("document.querySelector('#simulationStatus').textContent==='准备就绪'",timeout=60000)
  assert page.locator('#labScene').inner_html().strip()
  assert not page.locator('#stageNotice').is_visible()
  for tab in ['method','principle','exam','worked','sources']:
   page.locator('[data-tab="'+tab+'"]').click()
   assert page.locator('#panel-'+tab).is_visible()
   assert len(page.locator('#panel-'+tab).inner_text())>30
  page.locator('[data-tab="method"]').click()
  page.locator('#favoriteBtn').click()
  assert page.locator('#favoriteBtn').get_attribute('aria-pressed')=='true'
  page.locator('#runBtn').click()
  page.wait_for_timeout(250)
  page.locator('#pauseBtn').click()
  assert page.locator('#simulationStatus').inner_text()=='已暂停'
  page.locator('#pauseBtn').click()
  if i==0:
   page.wait_for_function("document.querySelector('#simulationStatus').textContent==='实验完成'",timeout=10000)
  else:
   page.locator('#playhead').evaluate("el=>{el.value=1000;el.dispatchEvent(new Event('input',{bubbles:true}));}")
  assert page.locator('.reading').count()>0
  if i==0:
   assert page.locator('#resultGraph').is_visible()
   assert page.locator('#stopwatch').is_visible()
   assert float(page.locator('#stopwatchTime').inner_text())>0
  start=time.monotonic()
  page.locator('#calculateBtn').click()
  assert page.locator('#calcProgress').is_visible()
  assert '正在努力计算中' in page.locator('#calcProgress').inner_text()
  page.wait_for_timeout(1000)
  assert page.locator('#calcProgress').is_visible()
  assert page.locator('#currentProcess').inner_text()==''
  page.wait_for_function("!document.querySelector('#calcProgress').offsetHeight",timeout=5000)
  assert time.monotonic()-start>=1.95
  assert page.locator('#currentProcess .process-step').count()>0
  assert page.locator('#recordBadge').inner_text()==str(i+1)
  page.screenshot(path=str(OUT/(str(i)+'-experiment.png')),full_page=True)
  page.locator('#playhead').evaluate("el=>{el.value=400;el.dispatchEvent(new Event('input',{bubbles:true}));}")
  assert page.locator('#calculateBtn').is_disabled()
  assert page.locator('.reading').count()==0

 page.locator('#recordsBtn').click()
 assert page.locator('#recordsTable tbody tr').count()==3
 with page.expect_download() as download:
  page.locator('#exportRecords').click()
 assert download.value.suggested_filename.endswith('.csv')
 page.locator('[data-close="recordsDialog"]').click()
 page.locator('#sourcesBtn').click()
 assert page.locator('#sourceList a').count()>3
 page.keyboard.press('Escape')
 page.locator('#backToCatalog').click()
 page.locator('#favoritesOnly').check()
 assert page.locator('.experiment-card').count()==3
 page.locator('#favoritesOnly').uncheck()
 page.set_viewport_size({'width':390,'height':844})
 page.screenshot(path=str(OUT/'catalog-mobile.png'))
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'mobile catalog overflow'
 page.evaluate("id=>location.hash='lab='+encodeURIComponent(id)",representatives[0])
 page.wait_for_function("document.querySelector('#simulationStatus').textContent==='准备就绪'",timeout=60000)
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'mobile lab overflow'
 page.screenshot(path=str(OUT/'experiment-mobile.png'),full_page=True)
 assert not errors,errors
 assert not failed,failed
 print(json.dumps({'passed':len(report),'subjects':counts,'records':3,'errors':errors,'failedRequests':failed,'screenshots':str(OUT)},ensure_ascii=False))
 browser.close()
