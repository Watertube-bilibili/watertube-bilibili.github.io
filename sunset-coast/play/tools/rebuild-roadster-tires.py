#!/usr/bin/env python3
"""Compile the reviewed Roadster tire/body/force sources with official Godot 4.6.3.
Only whitelisted GDC/remap resources are replaced. Every other packed byte,
including the separately reviewed maneuver controller, must match its lockfile.
"""
import argparse, hashlib, importlib.util, json, os, pathlib, subprocess, tempfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
_spec=importlib.util.spec_from_file_location('roadster_packs',ROOT/'tools/rebuild-roadster-pack.py')
_packs=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(_packs)
read_pack,digest=_packs.read_pack,_packs.digest
TARGETS=('vehicle_body','roadster_forces','roadster_tires')
def mutable(name):
    return any(name==target+suffix for target in TARGETS for suffix in ('.gd','.gdc','.gd.remap'))
def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-pack',type=pathlib.Path,default=ROOT/'physics/neon-physics.pck')
    parser.add_argument('--source-dir',type=pathlib.Path,default=ROOT/'physics/source')
    parser.add_argument('--output',type=pathlib.Path,required=True)
    parser.add_argument('--recovery-only',action='store_true')
    parser.add_argument('--update-manifest',action='store_true')
    args=parser.parse_args()
    if args.update_manifest and (args.recovery_only or args.output.resolve()!=(ROOT/'physics/neon-physics.pck').resolve()):
        raise ValueError('Manifest update requires the full runtime output path')
    entries=read_pack(args.base_pack)
    preserved=json.loads((ROOT/'physics/source/tire-preserved-resources.json').read_text())
    actual={name:digest(value) for name,value in entries.items() if not mutable(name)}
    if actual!=preserved:raise ValueError('Non-tire native resources changed; review the new baseline before rebuilding')
    targets=TARGETS[:2] if args.recovery_only else TARGETS
    with tempfile.TemporaryDirectory(prefix='roadster-tire-pack-') as temporary:
        folder=pathlib.Path(temporary);project=folder/'compile';project.mkdir()
        env={**os.environ,**{f'XDG_{kind}_HOME':str(folder/kind.lower()) for kind in ('CONFIG','DATA','CACHE')}}
        version=subprocess.check_output(['godot','--version'],env=env,text=True).strip()
        if not version.startswith('4.6.3.stable.official.'):raise RuntimeError('Use installed official Godot 4.6.3: '+version)
        for name in targets:(project/(name+'.gd')).write_bytes((args.source_dir/(name+'.gd')).read_bytes())
        # Compile dependency resolution only; this compiled maneuver is never
        # copied into the output. The reviewed base-pack resource is retained.
        (project/'roadster_maneuver.gd').write_bytes((ROOT/'physics/source/roadster_maneuver.gd').read_bytes())
        (project/'project.godot').write_text('config_version=5\n[application]\nconfig/name="Roadster tire build"\n')
        (project/'export_presets.cfg').write_text('[preset.0]\nname="Web"\nplatform="Web"\nrunnable=true\nexport_filter="all_resources"\ninclude_filter=""\nexclude_filter=""\nscript_export_mode=2\n[preset.0.options]\nvariant/extensions_support=false\nvariant/thread_support=false\n')
        compiled=folder/'compiled.pck'
        result=subprocess.run(['godot','--headless','--path',str(project),'--export-pack','Web',str(compiled)],env=env,capture_output=True,text=True,timeout=60)
        if result.returncode or 'ERROR' in result.stdout+result.stderr:raise RuntimeError(result.stdout+result.stderr)
        generated=read_pack(compiled)
        for name in targets:
            entries.pop(name+'.gd',None)
            for suffix in ('.gdc','.gd.remap'):entries[name+suffix]=generated[name+suffix]
        resources=folder/'resources';resources.mkdir()
        for name,value in entries.items():
            path=resources/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(value)
        (resources/'entries.json').write_text(json.dumps(sorted(entries)))
        output=folder/'result.pck'
        result=subprocess.run(['godot','--headless','--script',str(ROOT/'tools/repack-roadster.gd'),'--',str(resources),str(output)],env=env,capture_output=True,text=True,timeout=30)
        if result.returncode or 'ERROR' in result.stdout+result.stderr:raise RuntimeError(result.stdout+result.stderr)
        if read_pack(output)!=entries:raise ValueError('Godot PCKPacker result differs from reviewed resources')
        args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_bytes(output.read_bytes())
    if args.update_manifest:
        manifest_path=ROOT/'physics/manifest.json';manifest=json.loads(manifest_path.read_text());payload=args.output.read_bytes()
        manifest['fileSizes']['./physics/neon-physics.pck']=len(payload)
        manifest['files']['neon-physics.pck']={'bytes':len(payload),'sha256':digest(payload)}
        for name in targets:manifest['projectSources'][name+'.gd']=digest((args.source_dir/(name+'.gd')).read_bytes())
        manifest['tireSourceRecovery']={'originalPackSha256':'58a961b55f569ed6a9c1850515b336efdae1b23f90300d33be7e57ced5ecbf9b','maneuverBaselinePackSha256':'e342962efc87d98adcec8258a81f039b3fb9b4f51e660f7dda00080f81cbdc26','preservedResources':'source/tire-preserved-resources.json','method':'Original-token source recovery; 60/120 Hz trajectory equivalence; official Godot 4.6.3 Web GDC export; whitelisted body/force/tire replacement'}
        manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
        # The separate maneuver builder must now preserve these reviewed tires.
        non_maneuver={name:digest(value) for name,value in entries.items() if name not in ('roadster_maneuver.gd','roadster_maneuver.gdc','roadster_maneuver.gd.remap')}
        (ROOT/'physics/source/preserved-resources.json').write_text(json.dumps(non_maneuver,indent=2,sort_keys=True)+'\n')
    print(json.dumps({'output':str(args.output),'bytes':args.output.stat().st_size,'sha256':digest(args.output.read_bytes()),'preservedResources':len(preserved),'compiledScripts':list(targets)}))
if __name__=='__main__':main()
