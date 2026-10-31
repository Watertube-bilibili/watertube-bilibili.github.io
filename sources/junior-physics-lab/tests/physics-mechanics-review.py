"""Verify SVG apparatus against real engine fixtures.

Generate first:
APPARATUS_FIXTURE_PATH=/tmp/mechanics-review-fixtures.json godot --headless \
  --path godot --script ../tests/godot_apparatus_review.gd
Then run this file. No Web export or live server is required.
"""
import json
import math
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = Path(os.environ.get("APPARATUS_FIXTURE_PATH", "/tmp/mechanics-review-fixtures.json"))


def sample_at(points, progress):
    target = points[-1][0] * progress
    for index, point in enumerate(points):
        if point[0] >= target:
            if index == 0:
                return point
            before = points[index - 1]
            fraction = (target - before[0]) / (point[0] - before[0])
            return [a + (b - a) * fraction for a, b in zip(before, point)]
    return points[-1]


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox"])
    page = browser.new_page(viewport={"width": 1800, "height": 1300})
    page.set_content('<meta charset="utf-8"><body style="margin:0;background:#d5e0e8"><div id="gallery" style="display:grid;grid-template-columns:900px 900px"></div>')
    page.add_script_tag(path=str(ROOT / "dist/modules/physics/mechanics-review.js"))
    fixtures = json.loads(FIXTURES.read_text())
    count = 0
    gallery = []
    for fixture in fixtures:
        params, result = fixture["params"], fixture["result"]
        for progress in [0, .25, .5, 1]:
            rendered = page.evaluate("""([params,result,progress])=>{
              const s=LAB_PHYSICS_SCENES.mechanicsReview({},params,result,progress);
              const source=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 430">${s}</svg>`;
              const doc=new DOMParser().parseFromString(source,'image/svg+xml');
              if(doc.querySelector('parsererror')) throw Error(doc.querySelector('parsererror').textContent);
              const node=document.importNode(doc.documentElement,true);document.body.append(node);
              const badText=[...node.querySelectorAll('text')].filter(t=>{const b=t.getBBox();return b.x<0||b.y<0||b.x+b.width>900.1||b.y+b.height>430.1}).map(t=>t.textContent);
              const data=Object.fromEntries([...node.querySelector('[data-review-kind]').attributes].map(a=>[a.name,a.value]));
              node.remove();return {source,data,badText};
            }""", [params, result, progress])
            assert not rendered["badText"], (params, progress, rendered["badText"])
            assert "NaN" not in rendered["source"] and "Infinity" not in rendered["source"]
            state = sample_at(result["trajectory"], progress)
            attributes = rendered["data"]
            if params["scenario"] == "magnetDeflection":
                assert math.isclose(float(attributes["data-ball-x"]), state[1], abs_tol=1e-10)
                assert math.isclose(float(attributes["data-ball-y"]), state[2], abs_tol=1e-10)
            elif params["scenario"] == "indentation":
                expected = max(0, state[1] - result["values"]["height"])
                assert math.isclose(float(attributes["data-indent-depth"]), expected, abs_tol=1e-10)
            else:
                assert math.isclose(float(attributes["data-fan-angle"]), state[1], abs_tol=1e-10)
                assert math.isclose(float(attributes["data-fan-omega"]), state[2], abs_tol=1e-10)
            if progress == 1 and (params in [{"scenario": "magnetDeflection", "placement": "side"}, {"scenario": "indentation"}, {"scenario": "solarFan"}] or params.get("coverage") == 0 or params.get("resistance") == 30 or params.get("strength") == .2):
                gallery.append(rendered["source"])
            count += 1
    assert page.evaluate("LAB_PHYSICS_SCENES.mechanicsReview({}, {scenario:'unrelated'}, {}, 0)===null")
    missing = page.evaluate("""()=>{try{LAB_PHYSICS_SCENES.mechanicsReview({}, {scenario:'magnetDeflection'}, {solver:'Godot'}, .5);return false}catch(e){return /Godot/.test(e.message)}}""")
    assert missing, "A calculated result must not silently fabricate a motion path"
    page.evaluate("items=>document.querySelector('#gallery').innerHTML=items.map(s=>`<div style=\"background:#fffdf3;border:1px solid #819aac\">${s}</div>`).join('')", gallery)
    page.screenshot(path="/tmp/mechanics-review-scenes.png", full_page=True)
    print(f"PASS: {count} real-trajectory SVG states, finite coordinates, XML parsing, text bounds, and module dispatch")
    browser.close()
