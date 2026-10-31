# SPDX-License-Identifier: AGPL-3.0-only
"""Semantic regression checks for repaired biology drawings. No Godot mocks."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as pw:
    b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=b.new_page(viewport={'width':900,'height':430})
    page.set_content('<meta charset="utf-8"><body style="margin:0"><svg id="scene" width="900" height="430"></svg></body>')
    for file in ['catalog/biology.js','modules/biology.js']:
        page.add_script_tag(content=(ROOT/'dist'/file).read_text())
    report=page.evaluate('''()=>{
      const m=LAB_MODULES.biology, all=LAB_CATALOG, scene=document.querySelector('#scene'),checks=[];
      function show(id,changes={},t=1){const e=all.find(x=>x.id==='bio-'+id),p={...Object.fromEntries(e.controls.map(c=>[c.key,c.value])),...changes},r=m.simulate(e,p,1);scene.innerHTML=m.render(e,p,r,t);return {e,p,r};}
      function expect(x,message){if(!x)throw Error(message);checks.push(message);}
      const geometry=()=>[...scene.querySelectorAll('path,circle,ellipse,rect,line,g')].map(x=>x.outerHTML.replace(/<text[\\s\\S]*?<\\/text>/g,'')).join('');
      let variants=0;
      for(const e of all.filter(x=>!x.requiresPhysics)){
        const base=Object.fromEntries(e.controls.map(c=>[c.key,c.value])), ps=[base];
        for(const c of e.controls)for(const v of c.options?c.options.map(o=>o.value):[c.min,c.max])ps.push({...base,[c.key]:v});
        for(const p of ps){const r=m.simulate(e,p,1);scene.innerHTML=m.render(e,p,r,1);for(const node of scene.querySelectorAll('path')){const box=node.getBBox();if(!Number.isFinite(box.width)||box.width>2000||box.height>2000)throw Error(e.id+' malformed path: '+node.getAttribute('d'));}variants++;}
        if(e.interaction.mode==='playback'){const r=m.simulate(e,base,1);scene.innerHTML=m.render(e,base,r,0);const a=geometry();scene.innerHTML=m.render(e,base,r,1);expect(geometry()!==a,e.id+' default playback changes apparatus geometry');}
      }
      show('cell-division',{phase:'middle'});const middle=geometry();show('cell-division',{phase:'separate'});expect(geometry()!==middle,'division separates chromosomes rather than only relabeling');
      show('transpiration',{cover:'soil'});expect(scene.textContent.includes('蒸发混入'),'wet-soil bag acknowledges evaporation confound');const soil=geometry();show('transpiration',{cover:'leaves'});expect(geometry()!==soil,'bag boundary changes for wet-soil condition');
      show('microbe-distribution',{sample:'washed',colonies:7});const washed=scene.querySelectorAll('circle').length;show('microbe-distribution',{sample:'unwashed',colonies:7});expect(scene.querySelectorAll('circle').length===washed,'sampling label does not fabricate colony counts');
      show('dominance',{parent1:'AA',parent2:'Aa'});const cells=[...scene.querySelectorAll('text')].filter(n=>[168,243,318].includes(Number(n.getAttribute('y')))).map(n=>n.textContent);expect(cells.join(',')==='配子,A,A,A,AA,AA,a,Aa,Aa','Punnett grid cells agree with maternal/paternal row and column labels');
      show('mineral',{day:0,solution:'distilled'});const a=[...scene.querySelectorAll('path')].map(n=>n.getAttribute('d')).join();show('mineral',{day:0,solution:'soil'});expect([...scene.querySelectorAll('path')].map(n=>n.getAttribute('d')).join()===a,'corn groups share initial geometry at day zero');
      show('muscle',{angle:0});expect(scene.querySelectorAll('path')[1].getAttribute('d').includes('L310 370'),'zero-degree elbow is straight');
      show('first-aid',{scenario:'medicine'});expect(scene.textContent.includes('药品说明信息核对卡')&&!scene.textContent.includes('训练人偶示意'),'medicine uses a label-checking scene');
      show('daphnia',{beats:0});const noBeat=geometry();show('daphnia',{beats:0},0);expect(geometry()===noBeat,'zero-count Daphnia has no independent heartbeat animation');
      show('kidney',{substance:'glucose'});expect(scene.textContent.includes('全部重吸收'),'normal glucose fate is explicit');show('kidney',{substance:'urea'});expect(scene.textContent.includes('随尿液排出'),'urea exit is explicit');
      return {nonphysicsActivities:all.filter(x=>!x.requiresPhysics).length,variants,checks};
    }''')
    print(json.dumps(report,ensure_ascii=False,indent=2))
    (ROOT/'research/biology-quality-test-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    b.close()
