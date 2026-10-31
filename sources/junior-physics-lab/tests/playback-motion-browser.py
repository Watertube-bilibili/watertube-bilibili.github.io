"""Check that every declared playback changes apparatus geometry or material appearance.

This is an anti-placeholder screen, not a proof of scientific correctness: the
per-subject reviews and numerical assertions still determine the teaching scope.
"""
# SPDX-License-Identifier: AGPL-3.0-only
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

base = os.environ.get('LAB_URL', 'http://127.0.0.1:8767/')
output = Path(os.environ.get('LAB_MOTION_REPORT', '/tmp/lab-playback-motion.json'))
with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox', '--enable-unsafe-swiftshader'])
    page = browser.new_page()
    page.goto(base)
    page.wait_for_function('window.GodotLab?.ready', timeout=60000)
    report = page.evaluate('''async () => {
      const attributes = new Set(['d','x','y','x1','x2','y1','y2','cx','cy','r','rx','ry','width','height','points','transform','fill','stroke','opacity','fill-opacity','stroke-opacity','display','visibility','offset','stop-color','stop-opacity']);
      function geometry(svg) {
        const dom = new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">'+svg+'</svg>', 'image/svg+xml');
        if (dom.querySelector('parsererror')) throw Error('Invalid SVG');
        dom.querySelectorAll('text,tspan,title,desc,metadata').forEach(node => node.remove());
        return JSON.stringify([...dom.querySelectorAll('*')].map(node => [node.tagName, [...node.attributes].filter(a => attributes.has(a.name)).map(a => [a.name,a.value]).sort()]));
      }
      const report = [];
      for (const e of LAB_CATALOG.filter(e => e.interaction?.mode === 'playback')) {
        const p = {...e.modelParams, ...Object.fromEntries(e.controls.map(c => [c.key,c.value]))};
        try {
          const mod = LAB_MODULES[e.subject], r = await mod.simulate(e,p,1);
          const frames = [0,.19,.47,.73,1].map(t => geometry(mod.render(e,p,r,t)));
          report.push({id:e.id,subject:e.subject,distinctApparatusStates:new Set(frames).size,ok:new Set(frames).size>1});
        } catch (error) { report.push({id:e.id,ok:false,error:String(error)}); }
      }
      return report;
    }''')
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
    failures = [item for item in report if not item['ok']]
    print(json.dumps({'checkedPlayback':len(report),'unchangedOrFailed':failures,'report':str(output)},ensure_ascii=False))
    assert not failures, 'Declared playback with no apparatus/material change'
    browser.close()
