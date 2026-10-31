"""Real-clock checks of the standalone manual stopwatch; no engine or fake timers."""
# SPDX-License-Identifier: AGPL-3.0-only
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path=os.environ.get("CHROMIUM_PATH", "/usr/bin/chromium"), args=["--no-sandbox"])
    page = browser.new_page(viewport={"width": 850, "height": 400})
    page.set_content('<meta charset="utf-8"><div id="timer"></div>')
    page.add_script_tag(path=str(ROOT / "dist/manual-timer.js"))
    page.evaluate("""() => {
      window.ticks=[];window.stops=[];window.resets=0;
      window.timer=LabManualTimer.mount(document.querySelector('#timer'),{
        onTick:seconds=>ticks.push({seconds,at:performance.now()}),
        onStop:seconds=>stops.push(seconds),onReset:()=>resets++
      });
    }""")
    start = page.locator('[data-timer-action="start"]')
    pause = page.locator('[data-timer-action="pause"]')
    record = page.locator('[data-timer-action="record"]')
    reset = page.locator('[data-timer-action="reset"]')
    assert page.locator('[data-timer-display]').inner_text() == '00:00.00'
    assert pause.is_disabled() and record.is_disabled()
    start.click()
    page.wait_for_timeout(360)
    pause.click()
    paused = page.evaluate('timer.state.seconds')
    assert .25 <= paused <= .65, paused
    paused_display = page.locator('[data-timer-display]').inner_text()
    page.wait_for_timeout(320)
    assert page.evaluate('timer.state.seconds') == paused
    assert page.locator('[data-timer-display]').inner_text() == paused_display
    assert page.evaluate('stops.length') == 0, 'Pausing must not record a result'
    pause.click()
    page.wait_for_timeout(360)
    record.click()
    stopped = page.evaluate('timer.state.seconds')
    assert .60 <= stopped <= 1.10, stopped
    assert .25 <= stopped - paused <= .65, (paused, stopped)
    assert page.evaluate('stops') == [stopped]
    page.wait_for_timeout(180)
    assert page.evaluate('timer.state.seconds') == stopped
    assert record.is_disabled()
    gaps = page.evaluate('ticks.slice(1).map((tick,i)=>tick.at-ticks[i].at)')
    assert all(gap >= 99 for gap in gaps), gaps
    assert page.evaluate('stops.every(value=>Math.abs(value*100-Math.round(value*100))<1e-7)')
    reset.click()
    assert page.locator('[data-timer-display]').inner_text() == '00:00.00'
    assert page.evaluate('resets') == 1
    assert page.evaluate('timer.state.phase') == 'idle'
    start.click()
    page.wait_for_timeout(5150)
    assert page.evaluate('timer.state.phase') == 'running', 'Manual timing must not stop at five seconds'
    long_reading = page.evaluate('timer.state.seconds')
    assert long_reading >= 5.1, long_reading
    assert page.evaluate('stops.length') == 1
    page.screenshot(path='/tmp/manual-timer-running.png')
    page.evaluate('LabManualTimer.dispose()')
    count = page.evaluate('ticks.length')
    page.wait_for_timeout(220)
    assert page.evaluate('ticks.length') == count
    assert page.evaluate('stops.length') == 1, 'Disposal must not save an unwanted result'
    assert page.locator('#timer').inner_html() == ''
    page.evaluate("""() => {
      window.next=LabManualTimer.mount(document.querySelector('#timer'));
      next.dispose();next.dispose();LabManualTimer.dispose();
    }""")
    print(json.dumps({'pausedSeconds':paused,'recordedSeconds':stopped,'continuedPastFiveSeconds':long_reading,'tickCount':count,'passed':True}))
    browser.close()
