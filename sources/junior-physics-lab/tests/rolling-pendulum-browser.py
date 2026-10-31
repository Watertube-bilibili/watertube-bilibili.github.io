"""Actual exported Godot -> page controls -> SVG rolling-pendulum regression.

Serve dist first. LAB_URL defaults to http://127.0.0.1:8767/.
This test never replaces the physical solver with a generated trajectory.
"""
# SPDX-License-Identifier: AGPL-3.0-only
import json,os,time
from pathlib import Path
from playwright.sync_api import sync_playwright

base=os.environ.get('LAB_URL','http://127.0.0.1:8767/')
output=Path(os.environ.get('ROLLING_BROWSER_REPORT','/tmp/rolling-browser-report.json'))
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
 page=browser.new_page(viewport={'width':1440,'height':1050});errors=[];failed=[];checks=[]
 page.on('pageerror',lambda error:errors.append(str(error)))
 page.on('response',lambda r:failed.append([r.status,r.url]) if r.status>=400 and r.url.startswith(base) else None)
 page.goto(base)
 page.wait_for_function('GodotLab.ready',timeout=60000)
 page.evaluate("location.hash='lab=phy-rolling-pendulum'")
 page.wait_for_function("selected?.id==='phy-rolling-pendulum'&&ready",timeout=30000)
 assert page.locator('#runBtn').is_enabled()
 assert not page.locator('#labTags .scope-partial').count()
 summary=page.evaluate("({solver:result.solver,cycles:result.values.completedCycles,events:result.events.map(e=>e.kind),states:result.rollingStates.length})")
 assert summary['solver'].startswith('Godot RigidBody2D') and summary['cycles']==3 and summary['states']>100,summary
 assert summary['events']==['bottom','top']*3,summary
 checks.append('actual exported rigid-body solver completes three bottom/top pairs')
 page.locator('#runBtn').click();page.wait_for_timeout(300);page.locator('#pauseBtn').click()
 frozen=page.locator('#labScene').inner_html();page.wait_for_timeout(180)
 assert page.locator('#labScene').inner_html()==frozen and page.locator('#simulationStatus').inner_text()=='已暂停'
 page.locator('#pauseBtn').click();page.wait_for_timeout(180)
 assert page.locator('#labScene').inner_html()!=frozen
 page.locator('#pauseBtn').click()
 checks.append('pause freezes real apparatus and continue resumes')
 # Pick the middle of a genuine ascent. Match SVG state to neighboring engine
 # samples using the page's actual thousand-step playback slider.
 observed=page.evaluate('''()=>{
  const bottom=result.events[0],top=result.events[1],target=(bottom.time+top.time)/2;
  const el=document.querySelector('#playhead');el.value=Math.round(target/result.values.duration*1000);el.dispatchEvent(new Event('input',{bubbles:true}));
  const time=progress*result.values.duration,s=result.rollingStates;
  let i=0;while(i+1<s.length&&s[i+1].time<=time)i++;
  const a=s[i],b=s[i+1],q=b?(time-a.time)/(b.time-a.time):0;
  const expected=a.position+(b?b.position-a.position:0)*q;
  const node=document.querySelector('[data-rolling-apparatus]');
  return {expected,shown:Number(node.dataset.position),v:Number(node.dataset.velocity),omega:Number(node.dataset.omega),branch:Number(node.dataset.branch),loss:Number(document.querySelector('[data-energy="energyLost"]').dataset.energyValue)};
 }''')
 assert abs(observed['shown']-observed['expected'])<1e-9 and observed['v']<0 and observed['omega']>0 and observed['branch']==-1 and observed['loss']>0,observed
 checks.append('ascent shows actual Godot displacement, same axial rotation direction and accounted loss')
 page.locator('#playhead').evaluate("el=>{el.value=1000;el.dispatchEvent(new Event('input',{bubbles:true}));}")
 assert page.locator('#simulationStatus').inner_text()=='本次往返观察结束'
 assert page.locator('#calculateBtn').is_enabled()
 page.locator('#calculateBtn').click();page.wait_for_timeout(1100)
 assert page.locator('#calcProgress').is_visible()
 page.wait_for_function("!document.querySelector('#calcProgress').offsetHeight",timeout=5000)
 assert page.locator('#currentProcess .process-step').count()>=4
 checks.append('complete observation exposes worked analysis with existing progress/record behavior')
 def change(key,value):
  page.locator(f'input[type=number][data-param="{key}"]').fill(str(value))
  page.wait_for_function('([key,value])=>ready&&params[key]===value',arg=[key,value],timeout=30000)
 change('cycles',1)
 assert page.evaluate('result.values.completedCycles')==1
 change('cycles',5)
 assert page.evaluate('result.values.completedCycles')==5
 checks.append('cycle count re-evaluates the engine instead of replaying an old fixed path')
 change('mass',1);change('radius',.015);change('inertia',.00002)
 assert page.evaluate('result.values.valid') is False
 assert page.locator('#runBtn').is_disabled() and page.locator('#playhead').is_disabled()
 assert '需要 I ≥ mr²' in page.locator('#labScene').text_content()
 page.locator('#resetBtn').click()
 assert page.locator('#runBtn').is_disabled()
 change('inertia',.001)
 assert page.locator('#runBtn').is_enabled() and page.evaluate('result.values.valid') is True
 checks.append('invalid capture domain disables playback through reset and recovers after a valid edit')
 page.locator('#resetBtn').click()
 assert page.evaluate('progress')==0 and page.locator('#calculateBtn').is_disabled()
 page.locator('input[type=number][data-param="height"]').fill('0.7')
 page.evaluate("location.hash='lab=phy-reflection-law'")
 page.wait_for_function("selected?.id==='phy-reflection-law'&&ready",timeout=30000)
 page.wait_for_timeout(500)
 assert page.evaluate('selected.id')=='phy-reflection-law' and not page.locator('#runBtn').is_visible()
 checks.append('reset and parameter-change/navigation cancel stale work without changing live experiments')
 page.set_viewport_size({'width':390,'height':844})
 page.evaluate("location.hash='lab=phy-rolling-pendulum'")
 page.wait_for_function("selected?.id==='phy-rolling-pendulum'&&ready",timeout=30000)
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.screenshot(path='/tmp/rolling-page-mobile.png',full_page=True)
 page.set_viewport_size({'width':1440,'height':1050})
 page.screenshot(path='/tmp/rolling-page-desktop.png',full_page=True)
 assert not errors,errors
 assert not failed,failed
 report={'checks':checks,'initialRun':summary,'pageErrors':errors,'failedRequests':failed,'scope':'Actual browser and exported Godot model; no physical apparatus validation.'}
 output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report,ensure_ascii=False))
 browser.close()
