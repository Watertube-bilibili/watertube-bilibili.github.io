import {structuralDiagnosticsRequested,readStructuralDiagnostics} from './s-runtime.js';
const value=x=>x??'unknown';
export function formatStructuralDiagnostics(s){return [
 'Read-only S QA · not whole-vehicle acceptance',
 `Actual adapter bound: ${s.bound}`,
 `Bound profile: ${value(s.profile)}`,
 `Bound panels / vertices: ${value(s.boundPanels)} / ${value(s.boundVertices)}`,
 `Adapter vertices / excluded mirror vertices: ${value(s.adapterVertices)} / ${value(s.excludedMirrorVertices)}`,
 `Structural node max displacement (m): ${value(s.maxDisplacement)}`,
 `Broken beams / detached parts: ${value(s.brokenBeams)} / ${value(s.detachedParts)}`,
 `Structural revision: ${value(s.revision)}`,
 `Repair/rebind generation: ${value(s.repairRebindGeneration)}`,
 'Last damage attempt (may precede repair):',
 `  Received impulse source: ${value(s.lastContact?.impulseSource)}`,
 `  Received impulse: ${value(s.lastContact?.normalImpulse)}`,
 `  Structural accepted: ${value(s.lastContact?.accepted)}`,
 'manifold-normal-speed-loss = inherited estimate, NOT solver impulse.',
 'Node displacement is NOT measured visible mesh displacement.'
 ].join('\n');}
export function mountStructuralDiagnostics(game,{doc=globalThis.document,win=globalThis.window,schedule=globalThis.setInterval,cancel=globalThis.clearInterval}={}){
 if(!structuralDiagnosticsRequested())return null;
 const panel=doc.createElement('details'),summary=doc.createElement('summary'),body=doc.createElement('pre');
 summary.textContent='S structural QA (read only)';panel.open=false;
 panel.style.cssText='position:fixed;right:8px;top:72px;z-index:10000;max-width:min(450px,90vw);max-height:50vh;overflow:auto;background:rgba(10,18,25,.94);color:#e4f4ff;border:1px solid #8ab4cb;border-radius:6px;padding:8px;font:12px/1.5 monospace;pointer-events:auto';
 body.style.cssText='white-space:pre-wrap;margin:6px 0 0';panel.append(summary,body);doc.body.append(panel);
 // Prevent diagnostic keyboard interaction becoming driving/game shortcuts.
 const stop=e=>e.stopPropagation();panel.addEventListener('keydown',stop);panel.addEventListener('keyup',stop);
 let disposed=false;
 const dispose=()=>{if(disposed)return;disposed=true;cancel(timer);panel.remove();win.removeEventListener('pagehide',dispose);};
 const refresh=()=>{if(!structuralDiagnosticsRequested()){dispose();return;}if(disposed||!panel.open||doc.hidden)return;try{body.textContent=formatStructuralDiagnostics(readStructuralDiagnostics(game.vehicle));}catch{body.textContent='Structural diagnostics unavailable: unknown';}};
 // No per-frame scanning, no geometry writes, no timers while the gate is off.
 const timer=schedule(refresh,500);panel.addEventListener('toggle',refresh);win.addEventListener('pagehide',dispose,{once:true});
 return {dispose,panel,refresh};
}
