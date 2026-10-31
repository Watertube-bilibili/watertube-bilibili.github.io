# SPDX-License-Identifier: AGPL-3.0-only
"""Add reviewed catalog scenarios to the engine's public control schema."""
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
script = "const fs=require('fs'),vm=require('vm'),window={};vm.runInNewContext(fs.readFileSync('dist/catalog/physics.js','utf8'),{window});process.stdout.write(JSON.stringify(window.LAB_CATALOG));"
records = json.loads(subprocess.check_output(['node', '-e', script], cwd=root))
path = root / 'godot/model-schema.json'
schema = json.loads(path.read_text())
added = []
for entry in records:
    model = entry['model']
    scenario = entry.get('modelParams', {}).get('scenario')
    definition = schema['models'][model]
    if scenario and scenario not in definition['scenarios']:
        definition['scenarios'].append(scenario)
        definition.setdefault('scenarioControls', {})[scenario] = entry['controls']
        added.append(model + '/' + scenario)
text = json.dumps(schema, ensure_ascii=False, indent=2) + '\n'
path.write_text(text)
(root / 'dist/engine/model-schema.json').write_text(text)
print('Added reviewed model scenarios:', ', '.join(added) or 'none')
