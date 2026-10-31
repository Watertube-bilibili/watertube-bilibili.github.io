# SPDX-License-Identifier: AGPL-3.0-only
"""The three biology crossovers must use the real Godot WebAssembly engine."""
from playwright.sync_api import sync_playwright
import os,json
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
    page=browser.new_page()
    page.goto(os.environ.get('LAB_URL','http://127.0.0.1:8767/'))
    page.wait_for_function('window.GodotLab?.ready',timeout=60000)
    result=page.evaluate('''async()=>{const m=LAB_MODULES.biology,out=[];async function run(id,changes={}){const e=LAB_CATALOG.find(x=>x.id===id),p={...Object.fromEntries(e.controls.map(c=>[c.key,c.value])),...changes};const r=await m.simulate(e,p,1);if(!r.engine)throw Error(id+' missing Godot provenance');return {e,p,r};}
      let a=await run('bio-food-energy',{waterMass:50,rise:20,foodMass:1});if(Math.abs(a.r.q-4200)>.01||Math.abs(a.r.energy-4.2)>.01)throw Error('calorimetry conversion');out.push({id:a.e.id,heatJ:a.r.q,energyKJPerGram:a.r.energy,engine:a.r.engine});
      a=await run('bio-reaction',{distance:20});if(Math.abs(a.r.time-Math.sqrt(.4/9.8))>.005)throw Error('ruler time');const svg0=m.render(a.e,a.p,a.r,0),svg1=m.render(a.e,a.p,a.r,1);if(!svg0.includes('data-falling-ruler="0"')||!svg1.includes('data-falling-ruler="20"'))throw Error('ruler trajectory rendering');out.push({id:a.e.id,time:a.r.time,points:a.r.trajectory.length,engine:a.r.engine});
      a=await run('bio-eye',{eye:'myopia',correction:'none',distance:'far'});if(!(a.r.focusPosition<0))throw Error('myopia focus');const original=a.r.focusPosition;const near=await run('bio-eye',{eye:'normal',correction:'none',distance:'near'});const far=await run('bio-eye',{eye:'normal',correction:'none',distance:'far'});if(m.render(near.e,near.p,near.r,1)===m.render(far.e,far.p,far.r,1))throw Error('near-object adjustment');a=await run('bio-eye',{eye:'myopia',correction:'concave',distance:'far'});if(Math.abs(a.r.focusPosition)>.02)throw Error('concave correction');out.push({id:a.e.id,uncorrectedFocus:original,correctedFocus:a.r.focusPosition,engine:a.r.engine});return out;}''')
    print(json.dumps(result,ensure_ascii=False,indent=2))
    browser.close()
