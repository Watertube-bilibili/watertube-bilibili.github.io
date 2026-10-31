"""UI regression checks using the exported Godot runtime and actual catalog metadata.

Serve dist, then run LAB_URL=http://127.0.0.1:8767/ python tests/interaction-quality-browser.py.
"""
# SPDX-License-Identifier: AGPL-3.0-only
import json
import os
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get("LAB_URL", "http://127.0.0.1:8767/").rstrip("/") + "/"
OUT = Path(os.environ.get("LAB_TEST_OUTPUT", "/tmp/junior-lab-interaction-quality"))
OUT.mkdir(parents=True, exist_ok=True)


with sync_playwright() as pw:
    browser = pw.chromium.launch(
        headless=True,
        executable_path=os.environ.get("CHROMIUM_PATH", "/usr/bin/chromium"),
        args=["--no-sandbox", "--enable-unsafe-swiftshader"],
    )
    page = browser.new_page(viewport={"width": 1440, "height": 1100})
    errors, failures, passed = [], [], []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(BASE)
    page.wait_for_function("window.GodotLab?.ready", timeout=60000)
    page.wait_for_function("window.LAB_CATALOG?.length > 0")

    def open_lab(lab_id):
        page.evaluate("id => location.hash = 'lab=' + encodeURIComponent(id)", lab_id)
        page.wait_for_function(
            "id => selected?.id === id && ready && !document.querySelector('#stageNotice').offsetHeight",
            arg=lab_id,
            timeout=60000,
        )

    def change(key, value):
        control = page.locator(f'input[type="number"][data-param="{key}"]')
        control.fill(str(value))
        page.wait_for_function("ready && !document.querySelector('#stageNotice').offsetHeight", timeout=60000)

    def set_playhead(value):
        page.locator("#playhead").evaluate(
            "(el, value) => {el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));}", value
        )

    def check(name, action):
        try:
            action()
            passed.append(name)
        except Exception as error:
            failures.append({"test": name, "error": str(error)})
            page.screenshot(path=str(OUT / (str(len(failures)) + "-failure.png")), full_page=True)

    def metadata():
        invalid = page.evaluate("LAB_CATALOG.filter(e=>!['live','playback'].includes(e.interaction?.mode)).map(e=>e.id)")
        assert not invalid, invalid
        capability = page.evaluate("async()=>{const r=await GodotLab.evaluate('sound',{scenario:'airColumn',length_cm:20,amplitude:2});return {frequency:r.values.frequency,source:!!r.sourceGraph?.points?.length};}")
        assert capability["source"] and abs(capability["frequency"] - 425) < .001, "Exported engine lacks current sound solver"

    check("All experiments declare an interaction mode; exported engine is current", metadata)

    def live_controls():
        open_lab("phy-reflection-law")
        assert not page.locator("#runBtn").is_visible()
        assert not page.locator("#pauseBtn").is_visible()
        assert not page.locator("#playheadLabel").is_visible()
        assert page.locator("#calculateBtn").is_enabled()
        assert page.locator(".reading").count() > 0
        before = page.locator("#labScene path").evaluate_all("els=>els.map(el=>el.getAttribute('d'))")
        default_angle = page.locator('input[type="number"][data-param="angle"]').input_value()
        change("angle", 65 if float(default_angle) != 65 else 25)
        after = page.locator("#labScene path").evaluate_all("els=>els.map(el=>el.getAttribute('d'))")
        assert before != after, "Incidence angle must change the actual rays"
        page.locator("#resetBtn").click()
        page.wait_for_function("ready")
        assert page.locator('input[type="number"][data-param="angle"]').input_value() == default_angle

    check("Static optics changes immediately and restores default conditions", live_controls)

    def calculation():
        open_lab("phy-reflection-law")
        count = int(page.locator("#recordBadge").inner_text())
        start = time.monotonic()
        page.locator("#calculateBtn").click()
        assert page.locator("#calcProgress").is_visible()
        assert "正在努力计算中" in page.locator("#calcProgress").inner_text()
        page.wait_for_timeout(1050)
        assert page.locator("#calcProgress").is_visible()
        assert page.locator("#currentProcess").inner_text() == ""
        page.wait_for_function("!document.querySelector('#calcProgress').offsetHeight", timeout=5000)
        assert time.monotonic() - start >= 1.95
        assert page.locator("#currentProcess .process-step").count() > 0
        assert int(page.locator("#recordBadge").inner_text()) == count + 1
        page.locator("#calculateBtn").click()
        open_lab("phy-incline-speed")
        page.wait_for_timeout(2200)
        assert int(page.locator("#recordBadge").inner_text()) == count + 1, "Cancelled analysis wrote a stale record"
        assert page.locator("#currentProcess").inner_text() == ""

    check("Analysis progress waits, records once, and cancels cleanly on navigation", calculation)

    def manual_stopwatch():
        page.evaluate("location.hash='lab=phy-stopwatch-pulse-step'")
        page.locator('[data-timer-display]').wait_for(state='visible')
        assert not page.locator('#runBtn').is_visible()
        assert page.locator('#calculateBtn').is_disabled(), 'Manual timing has no measured value before recording'
        page.evaluate("""()=>{
          window.manualEngineCalls=0;
          window.originalManualEvaluate=GodotLab.evaluate;
          GodotLab.evaluate=function(...args){manualEngineCalls++;return originalManualEvaluate.apply(this,args);};
        }""")
        page.locator('[data-timer-action="start"]').click()
        page.wait_for_timeout(350)
        assert page.evaluate('manualEngineCalls') == 0, 'Stopwatch ticks must not request physics evaluations'
        page.locator('[data-timer-action="record"]').click()
        page.wait_for_function("ready && !document.querySelector('#calculateBtn').disabled", timeout=60000)
        assert page.evaluate('manualEngineCalls') == 1
        measured = page.evaluate('Number(result.values.indicated)')
        assert .25 <= measured <= 1.5, measured
        page.locator('[data-timer-action="reset"]').click()
        assert page.locator('#calculateBtn').is_disabled()
        page.locator('[data-timer-action="start"]').click()
        page.wait_for_timeout(150)
        open_lab('phy-reflection-law')
        assert page.locator('.manual-timer').count() == 0
        assert page.locator('#calculateBtn').is_enabled()
        page.evaluate('()=>{GodotLab.evaluate=originalManualEvaluate;}')

    check("Manual timing records real elapsed time and sends only the stopped value to Godot", manual_stopwatch)

    def ruler_controls_and_audio():
        open_lab("phy-ruler-pitch")
        assert page.locator("#runBtn").is_visible()
        assert page.locator('#sceneControls [data-param="length"]').count() == 2
        scene_box = page.locator(".apparatus-stage").bounding_box()
        controls_box = page.locator("#sceneControls").bounding_box()
        assert controls_box["y"] >= scene_box["y"] + scene_box["height"] - 2
        change("length", 5)
        short = page.evaluate("({frequency:result.values.frequency,tip:document.querySelector('[data-ruler-tip-x]').getAttribute('data-ruler-tip-x')})")
        change("length", 12)
        long = page.evaluate("({frequency:result.values.frequency,tip:document.querySelector('[data-ruler-tip-x]').getAttribute('data-ruler-tip-x')})")
        assert float(short["tip"]) < float(long["tip"])
        assert short["frequency"] > long["frequency"]
        change("length", 8)
        change("amplitude", 2)
        assert page.locator("#soundPreview").is_enabled()
        page.locator("#soundPreview").click()
        page.wait_for_function("LabAudio.state.playing")
        page.locator("#soundMuted").check()
        assert page.evaluate("!LabAudio.state.playing && LabAudio.state.muted")
        assert page.locator("#soundPreview").is_disabled()
        page.locator("#soundMuted").uncheck()
        page.locator("#soundVolume").evaluate("el=>{el.value=0;el.dispatchEvent(new Event('input',{bubbles:true}));}")
        assert page.locator("#soundPreview").is_disabled()
        page.locator("#soundVolume").evaluate("el=>{el.value=25;el.dispatchEvent(new Event('input',{bubbles:true}));}")
        assert page.locator("#soundPreview").is_enabled()
        page.screenshot(path=str(OUT / "ruler-controls.png"), full_page=True)

    check("Ruler length sits under the apparatus and controls geometry, pitch and audition", ruler_controls_and_audio)

    def pause_and_zero():
        open_lab("phy-ruler-pitch")
        page.locator("#runBtn").click()
        page.wait_for_timeout(250)
        page.locator("#pauseBtn").click()
        paused = page.locator("[data-ruler-beam]").get_attribute("points")
        progress = page.locator("#playhead").input_value()
        page.wait_for_timeout(300)
        assert page.locator("[data-ruler-beam]").get_attribute("points") == paused
        assert page.locator("#playhead").input_value() == progress
        assert not page.evaluate("LabAudio.state.playing")
        page.locator("#pauseBtn").click()
        page.wait_for_timeout(150)
        assert int(page.locator("#playhead").input_value()) > int(progress)
        change("amplitude", 0)
        assert page.locator("#soundPreview").is_disabled()
        page.locator("#runBtn").click()
        values = []
        for _ in range(4):
            page.wait_for_timeout(150)
            values.append(page.locator("[data-ruler-beam]").get_attribute("points"))
        assert len(set(values)) == 1, "Zero amplitude still moves the ruler"
        assert not page.evaluate("LabAudio.state.playing")
        page.locator("#resetBtn").click()
        assert page.locator("#playhead").input_value() == "0"

    check("Pausing freezes the apparatus and silence; zero amplitude remains still", pause_and_zero)

    def sound_conditions():
        open_lab("phy-bottle-xylophone")
        change("waterLevel", 0)
        empty = page.evaluate("({frequency:result.values.frequency,height:Number(document.querySelector('[data-bottle-water]').getAttribute('height'))})")
        change("waterLevel", 100)
        filled = page.evaluate("({frequency:result.values.frequency,height:Number(document.querySelector('[data-bottle-water]').getAttribute('height'))})")
        assert filled["height"] > empty["height"] and filled["frequency"] < empty["frequency"]
        open_lab("phy-piston-flute")
        change("length_cm", 10)
        short = page.evaluate("({frequency:result.values.frequency,width:Number(document.querySelector('[data-air-column]').getAttribute('width'))})")
        change("length_cm", 40)
        long = page.evaluate("({frequency:result.values.frequency,width:Number(document.querySelector('[data-air-column]').getAttribute('width'))})")
        assert long["width"] > short["width"] and abs(short["frequency"] / long["frequency"] - 4) < .001
        open_lab("phy-vacuum-bell")
        page.locator('select[data-param="medium"]').select_option("air")
        page.wait_for_function("ready")
        assert page.locator("#soundControls").is_visible() and page.locator("#soundPreview").is_enabled()
        page.locator('select[data-param="medium"]').select_option("vacuum")
        page.wait_for_function("ready")
        assert page.locator("#soundPreview").is_disabled()
        assert page.evaluate("result.sourceGraph.points.some(p=>Math.abs(p[1])>.1) && result.graph.points.every(p=>p[1]===0)")
        set_playhead(0)
        first = page.locator('[data-sound-vibrator="bell"]').get_attribute("cx")
        set_playhead(173)
        assert page.locator('[data-sound-vibrator="bell"]').get_attribute("cx") != first
        open_lab("phy-cup-telephone")
        page.locator('select[data-param="stringState"]').select_option("broken")
        page.wait_for_function("ready")
        assert page.locator('[data-string-state="broken"]').count() == 1
        assert page.evaluate("result.values.receivedAmplitude===0 && result.values.sourceAmplitude>0")
        assert page.locator("#soundPreview").is_disabled()
        open_lab("phy-soundproof-room")
        change("attenuation", 1)
        assert float(page.locator("[data-sound-meter]").get_attribute("width")) == 0
        assert page.locator("#soundPreview").is_disabled()

    check("Bottle, air-column, vacuum, telephone and insulation controls change the actual conditions", sound_conditions)

    def fast_navigation():
        page.evaluate("location.hash='lab=phy-pendulum-period'")
        page.wait_for_timeout(30)
        open_lab("phy-reflection-law")
        title = page.locator("#labTitle").inner_text()
        page.wait_for_timeout(1000)
        assert page.locator("#labTitle").inner_text() == title
        assert page.evaluate("selected.id==='phy-reflection-law' && result.model==='optics'")
        assert not page.locator("#runBtn").is_visible()
        assert page.locator("#calculateBtn").is_enabled()
        assert not page.evaluate("LabAudio.state.playing")

    check("An unfinished engine request cannot overwrite a later experiment", fast_navigation)

    def other_subjects():
        representatives = page.evaluate("['chemistry','biology'].flatMap(subject=>['live','playback'].map(mode=>LAB_CATALOG.find(e=>e.subject===subject&&e.interaction?.mode===mode)).filter(Boolean)).map(e=>({id:e.id,mode:e.interaction.mode}))")
        assert len(representatives) == 4
        for experiment in representatives:
            open_lab(experiment["id"])
            if experiment["mode"] == "live":
                assert not page.locator("#runBtn").is_visible(), experiment
                assert page.locator("#calculateBtn").is_enabled(), experiment
                assert page.locator(".reading").count() > 0, experiment
            else:
                assert page.locator("#runBtn").is_visible(), experiment
                assert page.locator("#calculateBtn").is_disabled(), experiment
                page.locator("#runBtn").click()
                set_playhead(1000)
                assert page.locator("#calculateBtn").is_enabled(), experiment

    check("Chemistry and biology honor their distinct interaction modes", other_subjects)
    if errors:
        failures.append({"test": "No uncaught page errors", "error": errors})
    report = {"passed": passed, "failures": failures, "pageErrors": errors}
    (OUT / "interaction-quality.json").write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print(json.dumps(report, ensure_ascii=False, indent=2))
    browser.close()
    assert not failures, failures
