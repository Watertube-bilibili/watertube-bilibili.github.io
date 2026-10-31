"""Run against a served dist directory; uses actual Godot, never a physics mock."""
# SPDX-License-Identifier: AGPL-3.0-only
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
base=os.environ.get('LAB_URL','http://127.0.0.1:8000/')
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'])
 page=browser.new_page()
 page.goto(base)
 page.wait_for_function('window.GodotLab?.ready',timeout=60000)
 results=page.evaluate('''async()=>{
  const m=LAB_MODULES.chemistry,find=id=>LAB_CATALOG.find(e=>e.id==='chem-'+id),calls=[],near=(a,b)=>{if(Math.abs(a-b)>1e-8)throw Error(a+' != '+b)};
  const original=GodotLab.evaluate.bind(GodotLab);GodotLab.evaluate=async(model,params)=>{calls.push({model,params});return original(model,params)};
  let checked=0;const outputs=[];
  for(const p of [{acidVolume:20,baseVolume:20,temperature:25},{acidVolume:20,baseVolume:0,temperature:15},{acidVolume:50,baseVolume:60,temperature:35},{acidVolume:1,baseVolume:60,temperature:25}]){
   const e=find('neutralization');if(!e.requiresPhysics)throw Error('missing requiresPhysics');
   const r=await m.simulate(e,p,0),r1=await m.simulate(e,p,1),n=Math.min(p.acidVolume,p.baseVolume)*.0001,heat=n*57300,mass=(p.acidVolume+p.baseVolume)/1000;
   near(r.delta,heat/(4180*mass));near(r.temperature,p.temperature+heat/(4180*mass));near(r.salt,n*58.5);near(r.delta,r1.delta);if(!r.engine?.solver.startsWith('Godot'))throw Error('not engine backed');
   const svg=m.render(e,p,r,.5);if(/NaN|Infinity|undefined/.test(svg))throw Error('invalid SVG');outputs.push({id:e.id,params:p,delta:r.delta,temperature:r.temperature,pH:r.pH,engine:r.engine});checked++;
  }
  for(const p of [{demand:5,efficiency:50,fuel:'gas'},{demand:20,efficiency:95,fuel:'electric'},{demand:1,efficiency:20,fuel:'gas'}]){
   const e=find('fuel-survey'),r=await m.simulate(e,p,0);near(r.input,p.demand/(p.efficiency/100));near(r.loss,r.input-p.demand);if(!r.engine?.solver.startsWith('Godot'))throw Error('not engine backed');outputs.push({id:e.id,params:p,input:r.input,loss:r.loss,engine:r.engine});checked++;
  }
  for(const call of calls){if(call.model!=='thermal')throw Error('wrong engine family');if(call.params.scenario==='heat-input'&&('rise'in call.params||'temperature'in call.params))throw Error('JS precomputed heat result');if(call.params.scenario==='efficiency-input'&&('input'in call.params||'lost'in call.params))throw Error('JS precomputed efficiency result');}
  const co2=await m.simulate(find('co2'),{},0);near(co2.gasMass,.44);
  GodotLab.evaluate=original;return {checked,calls,outputs,prePlayFinalResult:co2.gasMass};
 }''')
 # Test the same page-controller entry point used when users open an experiment.
 for id in ['chem-neutralization','chem-fuel-survey','chem-co2']:
  page.evaluate('id=>location.hash="lab="+id',id)
  live=page.evaluate('id=>LAB_CATALOG.find(e=>e.id===id).interaction.mode==="live"',id)
  page.wait_for_function('live=>document.querySelector("#simulationStatus").textContent===(live?"可调整条件":"准备就绪")',arg=live,timeout=60000)
  if live:
   assert page.locator('#runBtn').is_hidden(),id
  else:
   assert page.locator('#runBtn').is_enabled(),id
   page.locator('#runBtn').click()
   page.wait_for_function('document.querySelector("#simulationStatus").textContent==="实验完成"',timeout=15000)
  text=page.locator('#readings').inner_text()
  assert 'NaN' not in text and len(text)>10
  if id=='chem-neutralization':assert '0.685' in text and '25.685' in text,text
  if id=='chem-fuel-survey':assert '10' in text and 'MJ' in text,text
  if id=='chem-co2':assert '0.44' in text,text
  results.setdefault('pageReadings',{})[id]=text
 browser.close()
(root/'research/chemistry-engine-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':'passed','engineCases':results['checked'],'engineCalls':len(results['calls']),'pageEntries':list(results['pageReadings']),'prePlayFinalResult':results['prePlayFinalResult']},ensure_ascii=False))
