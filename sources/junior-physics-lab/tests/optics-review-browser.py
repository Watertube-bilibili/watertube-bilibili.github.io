"""SVG and operation checks using real Godot output; run godot_optics_fixtures.gd first."""
# SPDX-License-Identifier: AGPL-3.0-only
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
fixtures=json.loads(Path('/tmp/lab-optics-review.json').read_text())
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1800,'height':1200},device_scale_factor=1)
 page.set_content('<meta charset="utf-8"><body style="margin:0;background:#dae6ee"><main style="display:grid;grid-template-columns:1fr 1fr;gap:12px"></main></body>')
 page.add_script_tag(path=str(ROOT/'dist/modules/physics/optics-review.js'))
 results=page.evaluate('''fixtures=>fixtures.map((fixture,i)=>{
  const render=LAB_PHYSICS_SCENES.opticsReview;
  const svg=render({id:fixture.id,model:fixture.model},fixture.params,fixture.result,1);
  if(/NaN|Infinity|undefined/.test(svg))throw Error(fixture.id+' bad token');
  const xml=new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">'+svg+'</svg>','image/svg+xml');
  if(xml.querySelector('parsererror'))throw Error(fixture.id+' XML');
  const div=document.createElement('div');div.innerHTML='<h3 style="margin:7px;font:15px serif">'+fixture.id+' / '+i+'</h3><svg viewBox="0 0 900 430">'+svg+'</svg>';document.querySelector('main').append(div);
  const bounds=[...div.querySelectorAll('text')].filter(t=>!t.closest('[clip-path]')).map(t=>{const b=t.getBBox(),m=div.querySelector('svg').getCTM().inverse().multiply(t.getCTM()),a=new DOMPoint(b.x,b.y).matrixTransform(m),z=new DOMPoint(b.x+b.width,b.y+b.height).matrixTransform(m);return {text:t.textContent,x:Math.min(a.x,z.x),y:Math.min(a.y,z.y),right:Math.max(a.x,z.x),bottom:Math.max(a.y,z.y)};}).filter(x=>x.x<0||x.y<0||x.right>900||x.bottom>430);
  if(bounds.length)throw Error(fixture.id+' text overflow '+JSON.stringify(bounds));
  return {id:fixture.id,svg};
 })''',fixtures)
 by={}
 for r in results:by.setdefault(r['id'],[]).append(r['svg'])
 assert all(len(set(group))==len(group) for group in by.values()),'Different operations must change actual SVG geometry or observation'
 assert 'data-mirror-second-distance="20"' in by['phy-plane-mirror'][0]
 assert 'data-mirror-second-distance="30"' in by['phy-plane-mirror'][1]
 assert 'scale(2 1)' in by['phy-bottle-lens'][0]
 assert 'scale(-2 1)' in by['phy-bottle-lens'][1]
 assert '焦点处无有限清晰像' in by['phy-bottle-lens'][2]
 assert '找到清晰倒立像' in by['phy-convex-imaging'][1]
 assert '形成虚像' in by['phy-convex-imaging'][2]
 assert '出射光平行' in by['phy-convex-imaging'][3]
 page.screenshot(path='/tmp/optics-review-scenes.png',full_page=True)
 print(json.dumps({'fixtures':len(results),'scenes':len(by),'errors':[],'screenshot':'/tmp/optics-review-scenes.png'},ensure_ascii=False))
 b.close()
