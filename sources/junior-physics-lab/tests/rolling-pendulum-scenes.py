"""SVG checks against an actual Godot rolling result, without a JS physics mock.

Generate: ROLLING_FIXTURE_PATH=/tmp/rolling-cases.json godot --headless --path godot --script ../tests/godot_rolling_pendulum.gd
Then: ROLLING_FIXTURE_PATH=/tmp/rolling-cases.json python tests/rolling-pendulum-scenes.py
The main integration suite separately verifies the exported engine and page UI.
"""
# SPDX-License-Identifier: AGPL-3.0-only
import json
import math
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
fixture = Path(os.environ.get('ROLLING_FIXTURE_PATH', '/tmp/rolling-default.json'))
result = json.loads(fixture.read_text())
if isinstance(result,list):
    result=next(item['result'] for item in result if item['name']=='default-three-returns')
assert result['solver'].startswith('Godot'), 'This test requires actual engine output'
assert result['values']['valid'] and result['events']
duration = result['rollingStates'][-1]['time']
states = result['rollingStates']
checks = [(0, states[0]), (1, states[-1])]
for event in result['events']:
    checks.append((event['time']/duration, event['post']))
for phase in ['descending', 'ascending']:
    for branch in [-1, 1]:
        candidates = [s for s in states if s['phase']==phase and s['branch']==branch]
        if candidates:
            selected=candidates[len(candidates)//2]
            checks.append((selected['time']/duration,selected))

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':1800,'height':1300})
    page.set_content('<meta charset="utf-8"><div id="gallery" style="display:grid;grid-template-columns:900px 900px;background:#e0ebf1"></div>')
    page.add_script_tag(path=str(root/'dist/modules/physics/rolling-pendulum.js'))
    gallery=[]
    for progress,expected in checks:
        rendered=page.evaluate('''([r,t])=>{
          const svg=LAB_PHYSICS_SCENES.rollingPendulum({id:'phy-rolling-pendulum'},{scenario:'rollingPendulum'},r,t);
          const documentSVG=new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 430">'+svg+'</svg>','image/svg+xml');
          if(documentSVG.querySelector('parsererror'))throw Error(documentSVG.querySelector('parsererror').textContent);
          const node=document.importNode(documentSVG.documentElement,true);document.body.append(node);
          const main=node.querySelector('[data-rolling-apparatus]'),disk=node.querySelector('[data-rolling-angle]');
          const data=Object.fromEntries([...main.attributes].map(a=>[a.name,a.value]));
          const energy=Object.fromEntries([...node.querySelectorAll('[data-energy]')].map(n=>[n.dataset.energy,{value:n.dataset.energyValue,width:Number(n.getAttribute('width'))}]));
          const outside=[...node.querySelectorAll('text')].filter(n=>{const b=n.getBBox();return b.x<0||b.y<0||b.x+b.width>900.1||b.y+b.height>430.1}).map(n=>n.textContent);
          const side=node.querySelector('[data-winding-side]');
          const answer={svg:node.outerHTML,data,energy,disk:disk.getAttribute('transform'),side:{branch:side.dataset.windingSide,x:Number(side.getAttribute('x1'))},outside};node.remove();return answer;
        }''',[result,progress])
        assert not rendered['outside'],rendered['outside']
        assert 'NaN' not in rendered['svg'] and 'undefined' not in rendered['svg'] and 'Infinity' not in rendered['svg']
        for key,field in [('position','position'),('velocity','velocity'),('angle','angle'),('omega','angularVelocity')]:
            assert math.isclose(float(rendered['data']['data-'+key]),expected[field],abs_tol=1e-8),(progress,key,rendered['data'],expected)
        assert int(rendered['data']['data-branch'])==expected['branch']
        assert rendered['side']['branch']==str(expected['branch'])
        assert rendered['side']['x']==(429 if expected['branch']==1 else 461)
        transform=rendered['disk'].replace('translate(','').replace(')','').replace(' rotate(',' ').split()
        assert math.isclose(float(transform[1]),123+expected['position']/result['values']['height']*185,abs_tol=1e-8)
        assert math.isclose(float(transform[2]),math.degrees(expected['angle']),abs_tol=1e-8)
        for key,bar in rendered['energy'].items():
            assert math.isclose(float(bar['value']),expected[key],abs_tol=1e-8)
            ratio=max(0,min(1,expected[key]/result['values']['initialPotential']))
            assert math.isclose(bar['width'],293*ratio,abs_tol=1e-6)
        if len(gallery)<8:gallery.append(rendered['svg'])
    page.evaluate('items=>document.querySelector("#gallery").innerHTML=items.join("")',gallery)
    page.screenshot(path='/tmp/rolling-pendulum-scenes.png',full_page=True)
    print(json.dumps({'actual_engine_states':len(checks),'event_post_states':len(result['events']),'svg_geometry_energy_direction_and_text_bounds':'passed','screenshot':'/tmp/rolling-pendulum-scenes.png'}))
    browser.close()
