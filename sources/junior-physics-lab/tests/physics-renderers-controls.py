"""Verify meaningful visual control bindings and real-result SVG text bounds."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import os
root=Path(__file__).resolve().parents[1];base=os.environ.get('LAB_TEST_URL','http://127.0.0.1:8782')
cases=[('phy-simple-circuit','scenario','ohm','open'),('phy-freezing-mixture','stage','before','cooled'),('phy-alcohol-bag','progress',0,1),('phy-iodine-sublimation','progress',0,1),('phy-gas-diffusion','time',0,10),('phy-radio-tuning','receiverFrequency',99,100),('phy-radio-tuning','bandwidth',.1,10),('phy-coil-torque','angle',0,90),('phy-dc-motor-project','current',0,1),('phy-thermal-conductivity','initial',20,80),('phy-thermal-conductivity','temperature2',20,80),('phy-convex-imaging','height',1,10),('phy-stone-density','initialVolume',10,80),('phy-gradient-saline-ray','height',.1,2),('phy-magnetic-poles','pole2','N','S'),('phy-rgb-mixture','blue',0,255),('phy-home-circuit-design','switch1',0,1),('phy-periscope','stage',0,2),('phy-retroreflector','stage',0,2)]
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']);p=b.new_page()
 p.route(base+'/__physics-controls.html',lambda route:route.fulfill(status=200,content_type='text/html; charset=utf-8',body='<meta charset="utf-8"><svg id="scene" width="900" height="430" viewBox="0 0 900 430"></svg>'))
 p.goto(base+'/__physics-controls.html');p.add_script_tag(url=base+'/engine/loader.js');[p.add_script_tag(url=base+'/modules/physics/'+scene.name) for scene in sorted((root/'dist/modules/physics').glob('*.js'))];p.add_script_tag(url=base+'/modules/physics.js');p.add_script_tag(url=base+'/catalog/physics.js');p.wait_for_function('GodotLab.ready',timeout=60000)
 for experiment,key,a,z in cases:
  result=p.evaluate('async([id,key,a,z])=>{const e=LAB_CATALOG.find(e=>e.id===id);const defaults=Object.fromEntries(e.controls.map(c=>[c.key,c.value]));const renders=[];for(const value of[a,z]){const p={...defaults,[key]:value};const r=await LAB_MODULES.physics.simulate(e,p);renders.push(LAB_MODULES.physics.render(e,p,r,.5));}return renders[0]!==renders[1];}',[experiment,key,a,z])
  assert result,(experiment,key,'control changes have no visible effect');print(experiment,key,'PASS',flush=True)
 bounds=p.evaluate('async()=>{const errors=[];for(const e of LAB_CATALOG){if(e.subject!=="physics")continue;const p=Object.fromEntries(e.controls.map(c=>[c.key,c.value]));const r=await LAB_MODULES.physics.simulate(e,p);const svg=document.querySelector("#scene");svg.innerHTML=LAB_MODULES.physics.render(e,p,r,.5);for(const text of svg.querySelectorAll("text")){const b=text.getBBox(),m=text.getCTM();const pts=[[b.x,b.y],[b.x+b.width,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(m));if(pts.some(p=>p.x< -1||p.y< -1||p.x>901||p.y>431))errors.push({id:e.id,text:text.textContent,pts:pts.map(p=>[p.x,p.y])});}}return errors;}')
 assert not bounds,bounds
 print('PASS 19 visual control comparisons and 182 actual-result SVG text bounds')
 b.close()
