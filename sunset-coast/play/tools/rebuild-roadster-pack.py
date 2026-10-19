#!/usr/bin/env python3
"""Compile only the maneuver with official Godot Web export, then repack.
No export template, guessed token bytecode, or edits to other compiled scripts.
"""
import argparse, hashlib, json, os, pathlib, struct, subprocess, tempfile
ROOT = pathlib.Path(__file__).resolve().parents[1]
def digest(data):
    return hashlib.sha256(data).hexdigest()
def read_pack(path):
    data = pathlib.Path(path).read_bytes()
    magic, version, major, minor, patch, flags, base, directory = struct.unpack_from('<4sIIIIIQQ', data)
    if (magic, version, major, minor, patch, flags) != (b'GDPC', 3, 4, 6, 3, 2):
        raise ValueError('Expected unencrypted Godot 4.6.3 PCK v3')
    count, = struct.unpack_from('<I', data, directory)
    cursor = directory + 4
    entries = {}
    for _ in range(count):
        length, = struct.unpack_from('<I', data, cursor)
        cursor += 4
        name = data[cursor:cursor + length].rstrip(b'\0').decode('utf-8')
        cursor += length
        offset, size = struct.unpack_from('<QQ', data, cursor)
        cursor += 16
        expected_md5 = data[cursor:cursor + 16]
        cursor += 16
        entry_flags, = struct.unpack_from('<I', data, cursor)
        cursor += 4
        if entry_flags or name.startswith('/') or '..' in pathlib.PurePosixPath(name).parts or name in entries:
            raise ValueError('Unsupported or unsafe pack entry: ' + name)
        value = data[base + offset:base + offset + size]
        if len(value) != size or hashlib.md5(value).digest() != expected_md5:
            raise ValueError('Pack integrity mismatch: ' + name)
        entries[name] = value
    return entries

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-pack', type=pathlib.Path, default=ROOT/'physics/neon-physics.pck')
    parser.add_argument('--source', type=pathlib.Path, default=ROOT/'physics/source/roadster_maneuver.gd')
    parser.add_argument('--output', type=pathlib.Path, required=True)
    parser.add_argument('--update-manifest', action='store_true')
    args = parser.parse_args()
    if args.update_manifest and args.output.resolve() != (ROOT/'physics/neon-physics.pck').resolve():
        raise ValueError('--update-manifest requires the runtime PCK output path')
    entries = read_pack(args.base_pack)
    for name in ['roadster_maneuver.gdc', 'roadster_maneuver.gd.remap', 'roadster_maneuver.gd']:
        entries.pop(name, None)
    preserved = json.loads((ROOT/'physics/source/preserved-resources.json').read_text())
    actual = {name:digest(value) for name,value in entries.items()}
    if actual != preserved:
        raise ValueError('Non-maneuver resources changed; stop and review the new native baseline')
    with tempfile.TemporaryDirectory(prefix='roadster-pack-') as tmp:
        folder = pathlib.Path(tmp)
        env = {**os.environ, 'XDG_CONFIG_HOME':str(folder/'config'), 'XDG_DATA_HOME':str(folder/'data'), 'XDG_CACHE_HOME':str(folder/'cache')}
        version = subprocess.check_output(['godot', '--version'], text=True, env=env).strip()
        if not version.startswith('4.6.3.stable.official.'):
            raise RuntimeError('Use installed official Godot 4.6.3, got ' + version)
        project = folder/'compile'
        project.mkdir()
        (project/'roadster_maneuver.gd').write_bytes(args.source.read_bytes())
        (project/'project.godot').write_text('config_version=5\n[application]\nconfig/name="Roadster maneuver build"\n')
        (project/'export_presets.cfg').write_text('[preset.0]\nname="Web"\nplatform="Web"\nrunnable=true\nexport_filter="all_resources"\ninclude_filter=""\nexclude_filter=""\nscript_export_mode=2\n[preset.0.options]\nvariant/extensions_support=false\nvariant/thread_support=false\n')
        compiled = folder/'compiled.pck'
        export = subprocess.run(['godot', '--headless', '--path', str(project), '--export-pack', 'Web', str(compiled)], capture_output=True, text=True, env=env, timeout=45)
        if export.returncode or 'ERROR' in export.stdout+export.stderr:
            raise RuntimeError(export.stdout+export.stderr)
        generated = read_pack(compiled)
        for name in ['roadster_maneuver.gdc', 'roadster_maneuver.gd.remap']:
            entries[name] = generated[name]
        for name,value in entries.items():
            path = folder/name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(value)
        (folder/'entries.json').write_text(json.dumps(sorted(entries)))
        output = folder/'result.pck'
        env = {**os.environ, 'XDG_CONFIG_HOME':str(folder/'config'), 'XDG_DATA_HOME':str(folder/'data'), 'XDG_CACHE_HOME':str(folder/'cache')}
        result = subprocess.run(['godot', '--headless', '--script', str(ROOT/'tools/repack-roadster.gd'), '--', str(folder), str(output)], capture_output=True, text=True, env=env, timeout=30)
        if result.returncode or 'ERROR' in result.stdout+result.stderr:
            raise RuntimeError(result.stdout+result.stderr)
        if read_pack(output) != entries:
            raise ValueError('Godot PCKPacker output differs from expected resources')
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_bytes(output.read_bytes())
    if args.update_manifest:
        path = ROOT/'physics/manifest.json'
        manifest = json.loads(path.read_text())
        payload = args.output.read_bytes()
        manifest['fileSizes']['./physics/neon-physics.pck'] = len(payload)
        manifest['files']['neon-physics.pck'] = {'bytes':len(payload), 'sha256':digest(payload)}
        manifest['projectSources']['roadster_maneuver.gd'] = digest(args.source.read_bytes())
        manifest['maneuverSourceRecovery'] = {'originalPackSha256':'58a961b55f569ed6a9c1850515b336efdae1b23f90300d33be7e57ced5ecbf9b', 'source':'source/roadster_maneuver.gd', 'preservedResources':'source/preserved-resources.json', 'method':'Godot-token recovery; official Godot 4.6.3 Web export compiles GDScript; PCKPacker replaces only maneuver GDC/remap; legacy vault/spin trajectory equivalence'}
        path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps({'output':str(args.output), 'bytes':args.output.stat().st_size, 'sha256':digest(args.output.read_bytes()), 'preservedResources':len(preserved)}))
if __name__ == '__main__':
    main()
