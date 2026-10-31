# SPDX-License-Identifier: AGPL-3.0-only
"""Prove each cross-subject physical model calls the real running Godot engine."""
import json, os
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--enable-unsafe-swiftshader'])
 page=b.new_page()
 page.goto(os.environ.get('LAB_URL','http://127.0.0.1:8000/'))
 page.wait_for_function('GodotLab.ready',timeout=60000)
 results=page.evaluate("""async()=>{
 const original=GodotLab.evaluate.bind(GodotLab),calls=[];
 GodotLab.evaluate=async(m,p)=>{const r=await original(m,p);if(!r.solver.startsWith('Godot'))throw Error('not real engine');calls.push({model:m,scenario:p.scenario,solver:r.solver});return r;};
 const out=[];
 for(const e of LAB_CATALOG.filter(e=>e.requiresPhysics&&e.subject!=='physics')){
  const n=calls.length,params={...e.modelParams,...Object.fromEntries(e.controls.map(c=>[c.key,c.value]))};
  const r=await LAB_MODULES[e.subject].simulate(e,params,1);
  if(calls.length===n)throw Error('No engine call: '+e.id);
  if(!r.readings.length)throw Error('No readings: '+e.id);
  out.push({id:e.id,calls:calls.slice(n),readings:r.readings});
 }
 GodotLab.evaluate=original;if(out.length!==5)throw Error('Expected five cross-subject models');return out;
 }""")
 print(json.dumps(results,ensure_ascii=False))
 b.close()
