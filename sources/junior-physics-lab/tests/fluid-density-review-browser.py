"""SVG checks from real Godot output; first run godot_fluid_density_review.gd."""
# SPDX-License-Identifier: AGPL-3.0-only
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
fixtures=json.loads(Path('/tmp/lab-fluid-density-review.json').read_text())
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1800,'height':1200},device_scale_factor=1)
 page.set_content('<meta charset="utf-8"><body style="margin:0;background:#dce9f1"><main style="display:grid;grid-template-columns:1fr 1fr;gap:12px"></main></body>')
 page.add_script_tag(path=str(ROOT/'dist/modules/physics/fluid-density-review.js'))
 report=page.evaluate('''fixtures=>fixtures.map((fixture,i)=>{
  const svg=LAB_PHYSICS_SCENES.fluidDensityReview({id:fixture.id,model:fixture.model},fixture.params,fixture.result,1);
  if(/NaN|Infinity|undefined/.test(svg))throw Error(fixture.id+' invalid token');
  const xml=new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">'+svg+'</svg>','image/svg+xml');
  if(xml.querySelector('parsererror'))throw Error(fixture.id+' invalid SVG XML');
  const div=document.createElement('div');div.innerHTML='<h3 style="margin:7px;font:15px serif">'+fixture.id+' / '+i+'</h3><svg viewBox="0 0 900 430">'+svg+'</svg>';document.querySelector('main').append(div);
  const overflow=[...div.querySelectorAll('text')].map(t=>{const b=t.getBBox(),m=div.querySelector('svg').getCTM().inverse().multiply(t.getCTM()),a=new DOMPoint(b.x,b.y).matrixTransform(m),z=new DOMPoint(b.x+b.width,b.y+b.height).matrixTransform(m);return {text:t.textContent,x:Math.min(a.x,z.x),y:Math.min(a.y,z.y),right:Math.max(a.x,z.x),bottom:Math.max(a.y,z.y)};}).filter(x=>x.x<0||x.y<0||x.right>900||x.bottom>430);
  if(overflow.length)throw Error(fixture.id+' text overflow '+JSON.stringify(overflow));
  const tube=div.querySelector('[data-u-liquid]');
  return {id:fixture.id,liquid:tube?.getAttribute('d'),left:tube?.getAttribute('data-left-level'),right:tube?.getAttribute('data-right-level'),direction:div.querySelector('[data-probe-direction]')?.getAttribute('transform'),venturi:div.querySelector('[data-venturi-shape]')?.getAttribute('d'),samples:div.querySelectorAll('[data-density-sample]').length};
 })''',fixtures)
 assert all(r['samples']==5 for r in report[:3])
 assert report[3]['liquid']==report[4]['liquid'],'Same depth and density: U readings must not change when probe rotates'
 assert report[3]['direction']!=report[4]['direction'],'Probe must visibly rotate'
 assert report[5]['left']!=report[3]['left'],'Pressure condition must affect U levels'
 assert report[6]['left']==report[6]['right'],'At free surface U levels are equal'
 assert report[7]['venturi']!=report[8]['venturi'],'Cross-section ratio changes pipe geometry'
 assert report[8]['left']==report[8]['right'],'Equal area means equal static pressures'
 assert report[9]['left']==report[9]['right'],'No flow means no dynamic pressure difference'
 assert float(report[10]['left'])>float(report[10]['right']),'Higher wide-section pressure lowers connected manometer surface'
 page.screenshot(path='/tmp/fluid-density-review-scenes.png',full_page=True)
 print(json.dumps({'fixtures':len(report),'scenes':3,'errors':[],'screenshot':'/tmp/fluid-density-review-scenes.png'},ensure_ascii=False))
 b.close()
