#!/usr/bin/env python3
"""Compile only vehicle_body using installed official Godot; preserve every other PCK resource.
The entire original runtime is retained separately, not reconstructed as a new game.
"""
import pathlib,importlib.util,tempfile,os,subprocess,json,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
sp=importlib.util.spec_from_file_location('pack',ROOT/'tools/rebuild-roadster-pack.py');m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
pack=ROOT/'physics/neon-physics.pck';entries=m.read_pack(pack)
preserved=json.loads((ROOT/'physics/source/wheel-preserved-resources.json').read_text())
assert {k:m.digest(v) for k,v in entries.items() if k not in ('vehicle_body.gd','vehicle_body.gdc','vehicle_body.gd.remap')}==preserved
with tempfile.TemporaryDirectory(prefix='coast-motorcycle-') as tmp:
    folder=pathlib.Path(tmp);project=folder/'compile';project.mkdir()
    env={**os.environ,**{f'XDG_{k}_HOME':str(folder/k.lower()) for k in ('CONFIG','DATA','CACHE')}}
    version=subprocess.check_output(['godot','--headless','--version'],env=env,text=True).strip()
    assert version.startswith('4.6.3.stable.official.')
    for name in ['vehicle_body','roadster_forces','roadster_tires','roadster_maneuver','roadster_air_reserve']:
        (project/(name+'.gd')).write_bytes((ROOT/'physics/source'/(name+'.gd')).read_bytes())
    (project/'project.godot').write_text('config_version=5\n[application]\nconfig/name="Native two-wheel motorcycle compiler"\n')
    (project/'export_presets.cfg').write_text('[preset.0]\nname="Web"\nplatform="Web"\nrunnable=true\nexport_filter="all_resources"\ninclude_filter=""\nexclude_filter=""\nscript_export_mode=2\n[preset.0.options]\nvariant/extensions_support=false\nvariant/thread_support=false\n')
    compiled=folder/'compiled.pck'
    r=subprocess.run(['godot','--headless','--path',str(project),'--export-pack','Web',str(compiled)],env=env,capture_output=True,text=True,timeout=60)
    if r.returncode or 'ERROR' in r.stdout+r.stderr:raise RuntimeError(r.stdout+r.stderr)
    generated=m.read_pack(compiled)
    for suffix in ('.gdc','.gd.remap'):entries['vehicle_body'+suffix]=generated['vehicle_body'+suffix]
    resources=folder/'resources';resources.mkdir()
    for name,data in entries.items():
        f=resources/name;f.parent.mkdir(parents=True,exist_ok=True);f.write_bytes(data)
    (resources/'entries.json').write_text(json.dumps(sorted(entries)))
    output=folder/'result.pck'
    r=subprocess.run(['godot','--headless','--script',str(ROOT/'tools/repack-roadster.gd'),'--',str(resources),str(output)],env=env,capture_output=True,text=True,timeout=30)
    if r.returncode or 'ERROR' in r.stdout+r.stderr:raise RuntimeError(r.stdout+r.stderr)
    assert m.read_pack(output)==entries
    pack.write_bytes(output.read_bytes())
manifest_path=ROOT/'physics/manifest.json';manifest=json.loads(manifest_path.read_text())
manifest['fileSizes']['./physics/neon-physics.pck']=pack.stat().st_size
manifest['files']['neon-physics.pck']={'bytes':pack.stat().st_size,'sha256':m.digest(pack.read_bytes())}
manifest['projectSources']['vehicle_body.gd']=m.digest((ROOT/'physics/source/vehicle_body.gd').read_bytes())
manifest['motorcycleBodyBuild']={'baselinePackSha256':'166265ac7c420134f2c7059fdc1fd9d168bc1d27f7002029a08b6071dec08cb3','method':'official 4.6.3 GDScript Web pack compiler, replace vehicle_body only','preservedResources':'source/wheel-preserved-resources.json','optIn':'kind=motorcycle; pre-existing structuralWheelDamage preserved'}
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'compiled':['vehicle_body.gdc','vehicle_body.gd.remap'],'preserved':len(preserved),'sha256':m.digest(pack.read_bytes()),'bytes':pack.stat().st_size}))
