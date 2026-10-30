// Original game interface layouts derived from the existing vehicle catalog/body types.
const designs={
 s:['split','LONG RANGE','#a6cfca'],x:['wide','DUAL MOTOR','#76aaa0'],r:['sport','PERFORMANCE','#e79b91'],cybr:['utility','ALL TERRAIN','#b2bec4'],
 m:['compact','CITY EDITION','#c6d69f'],nomad:['utility','TRAIL AWD','#bfb18b'],gt:['touring','GRAND TOURING','#d0a786'],vela:['wide','EXECUTIVE','#d3be9d'],
 estate:['touring','TOURING AWD','#a4bdcf'],apex:['sport','STRADA','#e4a58b'],aria:['lounge','GRAND LOUNGE','#c5b4d1'],coupe:['classic','HERITAGE','#cdd0b7'],
 c800:['lounge','SOVEREIGN · 2+2+2','#d8c8ac'],s800:['wide','GRAND HORIZON · 2+2','#cad1df'],v6:['utility','DAILY VAN · 2+2+2','#e4bd85'],q3:['compact','CITY POP','#e0b16f'],
 t9:['touring','CROSS TOURING','#91b2a2'],h4:['compact','SURF','#8bcfc1'],w8:['touring','COAST LINER','#9cbcd8'],b7:['utility','RIDGE','#d6ac7f'],k2:['sport','ARC','#d999ae'],
 y9:['lounge','GRAND TOUR · 2+2+2','#a8c5c4'],vision:['wide','LUCENT VISION','#b5c7da']
};
export const COCKPIT_MODEL_DESIGNS=Object.freeze(designs);
export function cockpitProfile(model={}){
 if(model.id==='semi')return{id:'semi',name:'SEMI · 货运座舱',emblem:'T',layout:'semi',edition:'四接地点物理原型',accent:'#bfcbd5',pilot:'Semi Pilot',display:'semi'};
 const id=model.id??'unknown',roadster=id.startsWith('roadster'),g9=id==='g9',d=designs[id]??['split',model.trim??'DRIVE','#a6cfca'];
 return{id,name:g9?'G9 · 山野座舱':roadster?'ROADSTER · 驾驶中心':`${model.name??'SUNRISE COAST'} · DRIVE`,emblem:g9?'G9':roadster?'R':(model.name??'S').charAt(0),
 layout:g9?'g9':roadster?'roadster':d[0],edition:g9?'WILDERNESS LUXURY':roadster?(model.roadsterTrim??model.trim??'PERFORMANCE'):d[1],
 accent:g9?'#87aa96':roadster?'#bbc9d8':d[2],pilot:g9?'G9 辅助驾驶':roadster?'Roadster Pilot':`${model.name??'SUNRISE COAST'} Pilot`,display:g9?'g9':roadster?'roadster':'vehicle'};
}
