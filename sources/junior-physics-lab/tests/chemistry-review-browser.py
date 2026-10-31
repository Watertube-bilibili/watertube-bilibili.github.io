"""Audit chemistry scenes in Chromium, with the real Godot engine for thermal crossovers."""
# SPDX-License-Identifier: AGPL-3.0-only
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path='/usr/bin/chromium', headless=True,
        args=['--no-sandbox', '--enable-unsafe-swiftshader'])
    page = browser.new_page(viewport={'width': 1820, 'height': 1000})
    page.goto(os.environ.get('LAB_URL', 'http://127.0.0.1:8767/'))
    page.wait_for_function('window.LAB_MODULES?.chemistry && window.GodotLab?.ready', timeout=90000)
    result = page.evaluate('''async () => {
      const entries=LAB_CATALOG.filter(e=>e.subject==='chemistry'), m=LAB_MODULES.chemistry;
      const host=document.createElement('div');document.body.append(host);
      const rows=[],overflow=[];
      for(const e of entries){
        const r=await m.simulate(e,{},1),frames=[];
        for(const u of [0,.35,.8,1]){
          const svg=m.render(e,{},r,u);
          if(/NaN|undefined|Infinity/.test(svg))throw Error(e.id+' invalid scene');
          host.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 430" width="900" height="430">'+svg+'</svg>';
          for(const t of host.querySelectorAll('text')){const b=t.getBBox();if(b.x<0||b.y<0||b.x+b.width>901||b.y+b.height>431)overflow.push({id:e.id,u,text:t.textContent,box:[b.x,b.y,b.width,b.height]});}
          frames.push(svg.split('<rect x="610"')[0].replace(/<text[\\s\\S]*?<\\/text>/g,'').replace(/data-stage="[^"]*"/g,''));
        }
        if(e.interaction.mode==='playback' && new Set(frames).size===1)throw Error(e.id+' has no visual process');
        rows.push({id:e.id,mode:e.interaction.mode,frames:frames.length,engine:r.engine?.solver||null});
      }
      host.remove();return {rows,overflow};
    }''')
    screenshots = [
        ('chem-catalyst', .45), ('chem-air-oxygen', 1), ('chem-hardness', 1),
        ('chem-salt-purify', .5), ('chem-neutralization', .5), ('chem-measure', 1),
        ('chem-protein', 1), ('chem-plastic', 1), ('chem-metal-displacement', .5),
        ('chem-airtight', .8), ('chem-atom-model', 1), ('chem-oxygen-design', 1)
    ]
    page.evaluate('''async entries => {
      document.body.innerHTML='';document.body.style.cssText='display:grid;grid-template-columns:900px 900px;gap:8px;background:#c5d1cc;margin:0';
      for(const [id,u] of entries){const e=LAB_CATALOG.find(x=>x.id===id),p=id==='chem-protein'?{need:'burn'}:id==='chem-plastic'?{need:'heat'}:id==='chem-hardness'?{water:'hard'}:{};
        const r=await LAB_MODULES.chemistry.simulate(e,p,1),host=document.createElement('div');
        host.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 430" width="900" height="430">'+LAB_MODULES.chemistry.render(e,p,r,u)+'</svg>';document.body.append(host);
      }
    }''', screenshots)
    page.screenshot(path=str(root/'research/chemistry-review-scenes.png'), full_page=True)
    browser.close()
(root/'research/chemistry-review-browser-results.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
print(json.dumps({'scenes':len(result['rows']),'frames':len(result['rows'])*4,'overflow':result['overflow']},ensure_ascii=False))
assert not result['overflow'], 'SVG text outside the viewBox'
