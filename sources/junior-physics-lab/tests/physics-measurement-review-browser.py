"""Render the five measurement tasks using results produced by the real native Godot solver."""
# SPDX-License-Identifier: AGPL-3.0-only
import json, subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
subprocess.run(['godot','--headless','--path','godot','--script','../tests/godot_physics_measurement_review.gd'],cwd=root,check=True)
result_path=root/'research/physics-measurement-review-results.json'
results=json.loads(result_path.read_text())
names=['air','full','deeper','impossible','efficiency','invalidEfficiency','contact','paper','pressing','archimedes','underfilled','lost','floatingEvidence','factor']
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1820,'height':1000})
    page.set_content('<body style="display:grid;grid-template-columns:900px 900px;gap:8px;background:#d4e1e4;margin:0"></body>')
    page.add_script_tag(path=str(root/'dist/modules/physics/measurement-review.js'))
    review=page.evaluate('''data=>{
      const bad=[],scenes={};
      for(const [name,r]of data){
        const host=document.createElement('div'),svg=LAB_PHYSICS_SCENES.measurementReview({}, {scenario:r.values.scenario},r);
        if(/NaN|undefined|Infinity/.test(svg))throw Error(name+' invalid SVG');
        host.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="900" height="430" viewBox="0 0 900 430">'+svg+'</svg>';
        document.body.append(host);scenes[name]=svg.replace(/<text[\\s\\S]*?<\\/text>/g,'');
        for(const t of host.querySelectorAll('text')){const b=t.getBBox();if(b.x<0||b.y<0||b.x+b.width>900||b.y+b.height>430)bad.push({name,text:t.textContent,box:[b.x,b.y,b.width,b.height]});}
      }
      for(const [a,b]of [['full','deeper'],['contact','paper'],['contact','pressing'],['archimedes','underfilled'],['archimedes','lost'],['archimedes','floatingEvidence']])if(scenes[a]===scenes[b])throw Error('apparatus must differ: '+a+' / '+b);
      return {textOverflow:bad,scenes:Object.keys(scenes),geometryComparisons:6};
    }''',[[name,results['cases'][name]]for name in names])
    page.screenshot(path=str(root/'research/physics-measurement-review-scenes.png'),full_page=True)
    browser.close()
assert not review['textOverflow'],review['textOverflow']
results['svgReview']=review
result_path.write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'nativeChecks':results['checks'],'svgScenes':len(names),'geometryComparisons':6,'overflow':review['textOverflow']},ensure_ascii=False))
