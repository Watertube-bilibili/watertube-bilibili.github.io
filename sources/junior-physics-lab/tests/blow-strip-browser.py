"""Actual Chromium + exported Godot + page controls, never a physics mock.

Serve dist first. LAB_URL defaults to http://127.0.0.1:8767/.
BLOW_STRIP_BROWSER_OUTPUT controls reports and scene screenshots.
"""
# SPDX-License-Identifier: AGPL-3.0-only
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

base = os.environ.get('LAB_URL', 'http://127.0.0.1:8767/')
out = Path(os.environ.get('BLOW_STRIP_BROWSER_OUTPUT', '/tmp/blow-strip-browser'))
out.mkdir(parents=True, exist_ok=True)
with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),
                                 args=['--no-sandbox', '--enable-unsafe-swiftshader'])
    page = browser.new_page(viewport={'width': 1440, 'height': 1050})
    errors, failed, checks, observations = [], [], [], []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('response', lambda r: failed.append([r.status, r.url]) if r.status >= 400 and r.url.startswith(base) else None)
    page.goto(base)
    page.wait_for_function('window.GodotLab?.ready', timeout=60000)

    def select(lab_id):
        page.evaluate("id=>location.hash='lab='+id", lab_id)
        page.wait_for_function('id=>selected?.id===id&&ready', arg=lab_id, timeout=30000)

    def change(key, value, expected=None):
        # Numeric field path uses actual UI input listeners, debounce and RPC.
        page.locator(f'input[type=number][data-param="{key}"]').fill(str(value))
        page.wait_for_function('([k,v])=>ready&&params[k]===v&&result?.values[k]===v',
                               arg=[key, value if expected is None else expected], timeout=30000)

    def snapshot():
        state = page.evaluate('''()=>{
          const node=document.querySelector('[data-blow-strip]'),v=result.values;
          const expected=result.stripPoints.map((p,i)=>(i?'L':'M')+[235+1300*p[0],230-1300*p[1]].join(' ')).join(' ');
          return {speed:v.speed,density:v.density,tipY:v.tipY,rise:v.tipRise,q:v.dynamicPressure,
            lift:v.liftForce,solver:result.solver,points:result.stripPoints.length,
            d:node.getAttribute('d'),matches:node.getAttribute('d')===expected,
            tipMatches:Number(node.dataset.tipY)===v.tipY,
            rest:document.querySelector('[data-strip-rest]').getAttribute('d'),
            arrows:document.querySelectorAll('[data-strip-airflow]').length};
        }''')
        assert state['solver'].startswith('Godot scientific solver: finite-rotation'), state
        assert state['points'] == 49 and state['matches'] and state['tipMatches'], state
        observations.append({k: v for k, v in state.items() if k not in ('d', 'rest')})
        return state

    select('phy-blow-strip')
    assert not page.locator('#runBtn').is_visible()
    assert not page.locator('#pauseBtn').is_visible()
    assert not page.locator('#labTags .scope-partial').count()
    assert '未' in page.locator('#labScene').inner_text()
    checks.append('live mode retains immediate controls and displays model limitations')
    change('speed', 0)
    zero = snapshot()
    assert zero['tipY'] < 0 and zero['rise'] == 0 and zero['lift'] == 0
    assert zero['d'] == zero['rest'] and zero['arrows'] == 0
    page.locator('#labScene').screenshot(path=str(out/'scene-zero.png'))
    checks.append('zero speed gives gravity sag, matching reference and no false airflow')
    states = [zero]
    for speed in [2, 4, 6, 8, 10]:
        change('speed', speed)
        state = snapshot()
        assert state['tipY'] > states[-1]['tipY'] and state['arrows'] == 3
        assert state['rest'] == zero['rest']
        states.append(state)
        if speed in [4, 6, 10]:
            page.locator('#labScene').screenshot(path=str(out/f'scene-speed-{speed}.png'))
    assert len({s['d'] for s in states}) == 6
    checks.append('six observed speed conditions change actual Godot-derived geometry monotonically')
    # Exercise the real range control with keyboard, then rapid input cancellation.
    slider = page.locator('input[type=range][data-param="speed"]')
    slider.focus()
    slider.press('Home')
    page.wait_for_function('ready&&result.values.speed===0', timeout=30000)
    slider.press('ArrowRight')
    page.wait_for_function('ready&&result.values.speed===0.1', timeout=30000)
    assert snapshot()['rise'] > 0
    for value in ['9', '1', '7', '3']:
        page.locator('input[type=number][data-param="speed"]').fill(value)
    page.wait_for_function('ready&&result.values.speed===3&&params.speed===3', timeout=30000)
    assert snapshot()['speed'] == 3
    checks.append('range keyboard and rapid edits update the latest condition without stale shapes')
    change('speed', 6)
    density_states = []
    for density in [0, 0.5, 1.2, 2]:
        change('density', density)
        state = snapshot()
        if density == 0:
            assert state['lift'] == 0 and state['d'] == state['rest'] and state['arrows'] == 0
        if density_states:
            assert state['tipY'] > density_states[-1]['tipY']
        density_states.append(state)
    checks.append('density control changes lift and shape; zero medium produces no false load')
    change('speed', -5, expected=0)
    assert snapshot()['rise'] == 0
    change('speed', 100, expected=10)
    change('density', 1000, expected=2)
    maximum = snapshot()
    assert maximum['q'] == 100 and maximum['lift'] > 0
    change('density', -1, expected=0)
    assert snapshot()['d'] == zero['d']
    # Page schema and native solver both enforce the dedicated gas-model range.
    assert page.locator('input[type=number][data-param="density"]').get_attribute('max') == '2'
    checks.append('page clamps negative and excessive inputs to scientific model bounds')
    change('density', 1.2)
    change('speed', 0)
    assert snapshot()['d'] == zero['d']
    change('speed', 6)
    page.locator('#calculateBtn').click()
    page.wait_for_function("document.querySelector('#currentProcess .process-step')", timeout=5000)
    assert 'Cp' in page.locator('#currentProcess').inner_text()
    assert page.locator('#recordBadge').inner_text() == '1'
    page.locator('#recordsBtn').click()
    assert page.locator('#recordsTable tbody tr').count() == 1
    with page.expect_download() as download:
        page.locator('#exportRecords').click()
    assert download.value.suggested_filename.endswith('.csv')
    page.keyboard.press('Escape')
    page.locator('#resetBtn').click()
    page.wait_for_function('ready&&result?.stripPoints?.length', timeout=30000)
    assert snapshot()['speed'] == 2
    checks.append('return to zero, analysis, record, CSV export and reset preserve live experiment behavior')
    # Cancel a pending edit while navigating to other experiments.
    page.locator('input[type=number][data-param="speed"]').fill('1')
    select('phy-straw-spray')
    change('speed', 0)
    assert '没有吹气' in page.locator('#labScene').inner_text()
    assert not page.locator('[data-blow-strip]').count()
    select('phy-reflection-law')
    assert not page.locator('#runBtn').is_visible()
    select('phy-rolling-pendulum')
    assert page.evaluate('result.values.completedCycles') == 3
    assert page.evaluate('result.events.map(e=>e.kind)') == ['bottom', 'top'] * 3
    checks.append('navigation cancels pending strip work; spray, reflection and repaired rolling return still work')
    select('phy-blow-strip')
    change('speed', 6)
    page.set_viewport_size({'width': 390, 'height': 844})
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    # Simulate a touch-capable viewport separately from any claim of real device QA.
    mobile = browser.new_context(viewport={'width': 430, 'height': 932}, is_mobile=True, has_touch=True)
    touch = mobile.new_page()
    touch.goto(base+'#lab=phy-blow-strip')
    touch.wait_for_function("window.GodotLab?.ready&&selected?.id==='phy-blow-strip'&&ready", timeout=60000)
    touch.locator('input[type=range][data-param="speed"]').tap()
    touch.wait_for_function('ready&&result?.values.speed===params.speed', timeout=30000)
    assert touch.evaluate('result.values.speed') != 2
    assert touch.evaluate('document.documentElement.scrollWidth<=innerWidth')
    assert touch.locator('[data-blow-strip]').count() == 1
    touch.screenshot(path=str(out/'page-touch.png'), full_page=True)
    mobile.close()
    page.screenshot(path=str(out/'page-mobile.png'), full_page=True)
    page.set_viewport_size({'width': 1440, 'height': 1050})
    page.screenshot(path=str(out/'page-desktop.png'), full_page=True)
    checks.append('390px layout and 430px touch emulation work without horizontal overflow')
    assert not errors, errors
    assert not failed, failed
    report = {'browser': browser.version, 'checks': checks, 'observations': observations,
              'pageErrors': errors, 'failedRequests': failed,
              'scope': 'Actual headless Chromium, exported Godot 4.6.3 WASM and UI; software renderer and touch emulation. No Firefox, real phone or physical apparatus validation.'}
    (out/'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps(report, ensure_ascii=False))
    browser.close()
