# SPDX-License-Identifier: AGPL-3.0-only
"""Render actual outputs from tests/godot_electrical_review.gd, never JS physics mocks."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[1]
cases=json.loads(Path('/tmp/electrical-review-cases.json').read_text())
with sync_playwright() as pw:
    b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1800,'height':1290})
    page.set_content('<meta charset="utf-8"><body style="margin:0;background:#f8fbfc"><svg id="scene" width="900" height="430"></svg></body>')
    page.add_script_tag(content=(ROOT/'dist/modules/physics/electrical-review.js').read_text())
    report=page.evaluate('''cases=>{
      const scene=document.querySelector('#scene'),render=LAB_PHYSICS_SCENES.electricalReview,checks=[];
      function draw(index,t=1){const c=cases[index];scene.innerHTML=render({model:c.result.model,modelParams:c.params},c.params,c.result,t);return c;}
      function expect(value,message){if(!value)throw Error(message);checks.push(message);}
      for(let i=0;i<cases.length;i++)for(const t of[0,.23,.61,1]){draw(i,t);const doc=new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">'+scene.innerHTML+'</svg>','image/svg+xml');expect(!doc.querySelector('parsererror'),'SVG XML '+i+'/'+t);for(const p of scene.querySelectorAll('path')){const box=p.getBBox();if(box.width>2000||box.height>2000)throw Error('Malformed coordinate interpolation '+i);}}
      draw(0);const p0=scene.querySelector('[data-meter-pointer]').getAttribute('d');expect(scene.querySelectorAll('path').length>=35,'analog meter has thirty minor divisions');
      draw(1);expect(scene.querySelector('[data-red-probe]').getAttribute('d').startsWith('M325 242'),'voltmeter positive lead goes to right high-potential load terminal');
      expect(scene.querySelector('[data-meter-pointer]').getAttribute('d')!==p0,'pointer follows actual/range response');
      draw(2);expect(scene.textContent.includes('反偏')&&scene.textContent.includes('超过')&&scene.textContent.includes('误串联'),'combined faults remain legible');
      draw(4);expect(scene.textContent.includes('20 Ω')&&scene.textContent.includes('内部电源'),'ohms mode uses isolated load with external supply open');
      draw(5);expect(scene.textContent.includes('—')&&!scene.textContent.includes('OL'),'floating voltmeter is not presented as an ohms OL reading');expect(scene.querySelector('[data-red-probe]').getAttribute('d').startsWith('M325 218'),'open probe is visibly detached');
      draw(6);expect(scene.querySelector('[data-compass-position]').getAttribute('transform')==='translate(555 155)','compass plot uses equal x/y units');
      draw(7);const coils=scene.querySelectorAll('[data-coil-turn]').length,forward=scene.querySelector('[data-current-direction]').getAttribute('d');
      draw(8);expect(scene.querySelector('[data-current-direction]').getAttribute('d')!==forward,'reversed crane current reverses directional arrow');
      draw(9);expect(scene.querySelectorAll('[data-coil-turn]').length===coils*2,'turns control changes drawn winding count');
      draw(10);expect(scene.querySelector('[data-core]').getAttribute('data-core')==='air','removing iron changes core geometry/style');
      draw(11);expect(scene.querySelector('[data-fuse-wire]').getAttribute('data-fused')==='true'&&scene.querySelector('[data-fuse-wire]').getAttribute('d').includes('M466'),'completed fuse visibly has a gap');
      draw(11,0);const initialColumn=Number(scene.querySelector('[data-fuse-thermometer]').getAttribute('height'));draw(11,.1);expect(Number(scene.querySelector('[data-fuse-thermometer]').getAttribute('height'))>initialColumn,'fuse sensible-heating stage changes temperature-column geometry');
      draw(12);expect(scene.querySelector('[data-fuse-wire]').getAttribute('data-fused')==='false','first arrival at melting point leaves wire intact');
      draw(13);expect(scene.querySelector('[data-fuse-wire]').getAttribute('data-fused')==='false'&&scene.textContent.includes('50%'),'latent-heat halfway state does not prematurely break wire');
      const fuse=cases[11].result.values,tm=(fuse.reachTime+fuse.breakTime)/2;draw(11,tm/10);expect(scene.querySelector('[data-fuse-wire]').getAttribute('data-fused')==='false','playhead interpolation respects actual event time');
      draw(14);expect(Number(scene.querySelector('[data-liquid-mass]').getAttribute('height'))===37.5,'half-kilogram water uses fixed two-kilogram tank scale');
      draw(15);expect(scene.textContent.includes('无液态水温读数')&&Number(scene.querySelector('[data-liquid-mass]').getAttribute('data-liquid-mass'))===0,'dry solar tank has neither liquid volume nor fictional water temperature');
      return {actualGodotCases:cases.length,renderStates:cases.length*4,checks};
    }''',cases)
    for i,indices in enumerate([[0,1,2,3,4,5],[6,7,8,9,10,11],[12,13,14,15]]):
        page.evaluate('''({cases,indices})=>{document.body.style.display='grid';document.body.style.gridTemplateColumns='1fr 1fr';document.body.innerHTML=indices.map(i=>{const c=cases[i];return '<svg width="900" height="430">'+LAB_PHYSICS_SCENES.electricalReview({model:c.result.model,modelParams:c.params},c.params,c.result,1)+'</svg>'}).join('')}''',{'cases':cases,'indices':indices})
        page.screenshot(path=f'/tmp/electrical-review-{i}.png',full_page=True)
    print(json.dumps({'actualGodotCases':report['actualGodotCases'],'renderStates':report['renderStates'],'assertions':len(report['checks'])},ensure_ascii=False))
    b.close()
