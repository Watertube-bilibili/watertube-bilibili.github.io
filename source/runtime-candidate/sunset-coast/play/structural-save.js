// Bounded local-save format. No fragments, event handles, Object3D references or account data.
export const STRUCTURAL_SAVE_VERSION=1;
const record=o=>o&&typeof o==='object'&&!Array.isArray(o)&&(Object.getPrototypeOf(o)===Object.prototype||Object.getPrototypeOf(o)===null);
const keys=(o,list)=>record(o)&&Object.keys(o).length===list.length&&list.every(k=>Object.hasOwn(o,k));
const finite=(x,min,max)=>Number.isFinite(x)&&x>=min&&x<=max;
export function validateStructuralDamageRecord(d){
 if(d===null||d===undefined)return true; // Old saves are healthy structurally, never reconstructed from condition.
 if(!keys(d,['version','model','binding','offsets','beams','parts','energy','revision']))return false;
 if(d.version!==1||typeof d.model!=='string'||!d.model.length||d.model.length>96||typeof d.binding!=='string'||!/^s1-[a-f0-9]{16}$/.test(d.binding))return false;
 if(!Array.isArray(d.offsets)||d.offsets.length!==63||Array.from(d.offsets).some(v=>!Array.isArray(v)||v.length!==3||Array.from(v).some(x=>!finite(x,-.650001,.650001))||Math.hypot(...v)>.650001))return false;
 if(!Array.isArray(d.beams)||d.beams.length!==338||Array.from(d.beams).some(v=>!Array.isArray(v)||v.length!==2||typeof v[0]!=='boolean'||!finite(v[1],.000001,100)))return false;
 if(!Array.isArray(d.parts)||d.parts.length>32||Array.from(d.parts).some(v=>!keys(v,['id','stress','detached'])||typeof v.id!=='string'||!v.id.length||v.id.length>96||!finite(v.stress,0,1e12)||typeof v.detached!=='boolean')||new Set(d.parts.map(v=>v.id)).size!==d.parts.length)return false;
 return finite(d.energy,0,1e12)&&Number.isSafeInteger(d.revision)&&d.revision>=0&&d.revision<=1e9;
}
