# SPDX-License-Identifier: AGPL-3.0-only
"""Draw actual Godot classroom outputs, including source-off negative controls."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
cases=json.loads(Path('/tmp/classroom-review-cases.json').read_text())
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1800,'height':1290})
    page.set_content('<meta charset="utf-8"><body style="margin:0"><svg id="scene" width="900" height="430"></svg></body>')
    page.add_script_tag(content=(ROOT/'dist/catalog/physics.js').read_text())
    for module in sorted((ROOT/'dist/modules/physics').glob('*.js')):
        page.add_script_tag(content=module.read_text())
    page.add_script_tag(content=(ROOT/'dist/modules/physics.js').read_text())
    report=page.evaluate('''cases=>{
      const checks=[],scene=document.querySelector('#scene');
      function draw(i,t){const c=cases[i],e=LAB_CATALOG.find(x=>x.id===c.id);scene.innerHTML=LAB_MODULES.physics.render(e,c.params,c.result,t);return scene.innerHTML;}
      function expect(value,message){if(!value)throw Error(message);checks.push(message);}
      function geometry(i,t){draw(i,t);const n=scene.cloneNode(true);n.querySelectorAll('text,title,desc').forEach(x=>x.remove());return n.innerHTML;}
      for(let i=0;i<cases.length;i++)for(const t of[0,.23,.61,1]){
        const svg=draw(i,t),doc=new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">'+svg+'</svg>','image/svg+xml');
        expect(!doc.querySelector('parsererror'),'SVG valid '+i+'/'+t);
        expect(!/NaN|undefined|Infinity/.test(svg),'finite coordinates '+i+'/'+t);
      }
      for(const i of[6,7,10,13])expect(new Set([0,.23,.61,1].map(t=>geometry(i,t))).size>1,'process has changing apparatus geometry '+i);
      expect(geometry(14,0)===geometry(14,1),'steady current does not fake spark movement');
      draw(9,1);expect(scene.textContent.includes('题设')&&scene.textContent.includes('不是任意浓度'),'mixture is labeled given observation rather than invented phase diagram');
      draw(11,1);expect(scene.textContent.includes('仍振动')&&scene.textContent.includes('没有本模型铃声'),'vacuum separates vibration from received sound');
      draw(12,1);expect(scene.textContent.includes('可听到铃声'),'air counterpart retains audible path');
      draw(8,1);expect(scene.textContent.includes('水已耗尽'),'dry vessel is not shown as liquid-temperature continuation');
      return {cases:cases.length,states:cases.length*4,assertions:checks.length};
    }''',cases)
    for page_index,indices in enumerate([[0,1,2,3,4,5],[6,7,8,9,10,11],[12,13,14,15]]):
        page.evaluate('''({cases,indices})=>{document.body.style.display='grid';document.body.style.gridTemplateColumns='900px 900px';document.body.innerHTML=indices.map(i=>{const c=cases[i],e=LAB_CATALOG.find(x=>x.id===c.id);return '<svg width="900" height="430">'+LAB_MODULES.physics.render(e,c.params,c.result,.61)+'</svg>'}).join('')}''',{'cases':cases,'indices':indices})
        page.screenshot(path=f'/tmp/classroom-review-{page_index}.png',full_page=True)
    print(json.dumps(report))
    browser.close()
