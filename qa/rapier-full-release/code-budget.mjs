import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
const root=process.cwd(),out=process.argv[2];
if(!out)throw Error('Output JSON path required');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const source=p=>fs.readFileSync(path.join(root,p));
function dependencies(entries,kind){
 const seen=new Set(),edges=[],pending=[];
 for(const file of entries){const text=source(file).toString();for(const tag of text.matchAll(/<script\b[^>]*type=["']module["'][^>]*>/gi)){const spec=tag[0].match(/\bsrc=["']([^"']+)/)?.[1];if(spec)pending.push(path.posix.normalize(path.posix.join(path.posix.dirname(file),spec.split('?')[0])));}}
 const wasm=new Set();
 while(pending.length){const file=pending.pop();if(seen.has(file))continue;seen.add(file);const text=source(file).toString();const module=new vm.SourceTextModule(text,{identifier:file});
  const specs=[...module.dependencySpecifiers,...[...text.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g)].map(m=>m[1])];
  for(const spec of specs){if(!spec.startsWith('.'))throw Error('Review external dependency '+spec+' from '+file);const to=path.posix.normalize(path.posix.join(path.posix.dirname(file),spec.split('?')[0]));edges.push({from:file,to});pending.push(to);}
  for(const match of text.matchAll(/new\s+URL\(\s*["']([^"']+\.wasm)["']\s*,\s*import\.meta\.url\s*\)/g))wasm.add(path.posix.normalize(path.posix.join(path.posix.dirname(file),match[1])));
 }
 const extras=[];
 if(kind==='godot'){
  const base='sunset-coast/play/physics/';
  // Explicit non-module Engine loader: Game -> prepareGodotEngine -> neon-physics.js -> wasm, worklets, PCK.
  for(const name of ['neon-physics.js','neon-physics.audio.position.worklet.js','neon-physics.audio.worklet.js'])seen.add(base+name);
  wasm.add(base+'neon-physics.wasm.gz');extras.push(base+'neon-physics.pck');
 }
 const measure=(file,type)=>{const stored=source(file),raw=file.endsWith('.gz')?zlib.gunzipSync(stored):stored;return{file,type,storedBytes:stored.length,rawBytes:raw.length,gzip9Bytes:zlib.gzipSync(raw,{level:9,mtime:0}).length,sha256:hash(stored)};};
 const records=[...[...seen].sort().map(f=>measure(f,'JS')),...[...wasm].sort().map(f=>measure(f,'WASM'))];
 const total=records.reduce((a,r)=>({rawBytes:a.rawBytes+r.rawBytes,gzip9Bytes:a.gzip9Bytes+r.gzip9Bytes}),{rawBytes:0,gzip9Bytes:0});
 return{entries,records,edges,total,additionalEnginePack:extras.map(f=>measure(f,'PCK'))};
}
const report={scope:'Reconstructed full reachable JS+WASM resource budget, including all literal lazy imports; unique files once, per-file gzip level9. NOT measured network transfer/startup time. Original baseline legacy homepage+formal Godot play vs current complete-city Rapier chooser+play. GLB/textures/fonts/CSS/HTML excluded from JS+WASM; new high-detail people/bikes are additional content, so not an equal-asset total-game claim. Godot explicitly loaded worklets included conservatively; engine PCK separate.',baseline:dependencies(['sunset-coast/legacy.html','sunset-coast/play/index.html'],'godot'),rapier:dependencies(['sunset-coast/index.html','sunset-coast/rapier/play/index.html'],'rapier')};
fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({baseline:report.baseline.total,rapier:report.rapier.total,baselineFiles:report.baseline.records.length,rapierFiles:report.rapier.records.length}));
