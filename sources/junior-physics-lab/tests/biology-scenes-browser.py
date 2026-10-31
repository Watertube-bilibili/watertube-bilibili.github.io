# SPDX-License-Identifier: AGPL-3.0-only
"""Render original biology SVGs in Chromium, with no physics mocks."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1800,'height':1000})
 page.set_content('<meta charset="utf-8"><body style="margin:0;background:#dae4eb"><div id="scenes" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px"></div></body>')
 for f in ['catalog/biology.js','modules/biology.js']:page.add_script_tag(content=(root/'dist'/f).read_text())
 results=page.evaluate('''()=>LAB_CATALOG.filter(e=>!e.requiresPhysics).map(e=>{const p=Object.fromEntries(e.controls.map(c=>[c.key,c.value])),m=LAB_MODULES.biology,r=m.simulate(e,p,1),svg=m.render(e,p,r,.7);const doc=new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">'+svg+'</svg>','image/svg+xml');const div=document.createElement('div');div.innerHTML=`<div style="font:16px sans-serif;padding:5px">${e.id}</div><svg viewBox="0 0 900 430">${svg}</svg>`;document.querySelector('#scenes').append(div);return {id:e.id,error:doc.querySelector('parsererror')?.textContent};})''')
 assert not [r for r in results if r.get('error')],results
 page.screenshot(path='/tmp/biology-scenes-overview.png',full_page=True)
 # Capture four contrasting core scenes at native viewbox size.
 for id in ['bio-microscope','bio-pickle','bio-kidney-slide','bio-pond']:
  page.evaluate('''id=>{const e=LAB_CATALOG.find(x=>x.id===id),p=Object.fromEntries(e.controls.map(c=>[c.key,c.value])),m=LAB_MODULES.biology,r=m.simulate(e,p,1);document.body.innerHTML='<svg width="900" height="430" viewBox="0 0 900 430">'+m.render(e,p,r,.7)+'</svg>'}''',id)
  page.screenshot(path='/tmp/'+id+'.png',clip={'x':0,'y':0,'width':900,'height':430})
 print('PASS',len(results),'nonphysics biology scenes SVG XML and browser rendering')
 b.close()
