# SPDX-License-Identifier: AGPL-3.0-only
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
cases=json.loads(Path('/tmp/spray-zero-cases.json').read_text())
with sync_playwright() as pw:
    b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    p=b.new_page()
    p.set_content('<meta charset="utf-8"><svg id="scene" width="900" height="430"></svg>')
    for f in ['dist/catalog/physics.js','dist/modules/physics.js']:p.add_script_tag(content=(root/f).read_text())
    result=p.evaluate('''cases=>{const scene=document.querySelector('#scene'),e=LAB_CATALOG.find(e=>e.id==='phy-straw-spray');let out=[];for(const c of cases){scene.innerHTML=LAB_MODULES.physics.render(e,c.params,c.result,1);out.push({speed:c.result.values.speed,drops:scene.querySelectorAll('circle').length,text:scene.textContent});}if(out[0].drops!==0||!out[0].text.includes('没有吹气'))throw Error('Zero flow still sprays');if(out[1].drops!==16)throw Error('Positive flow lost principle illustration');return out.map(({speed,drops})=>({speed,drops}));}''',cases)
    print(json.dumps({'actualGodotCases':2,'results':result}))
    b.close()
