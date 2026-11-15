/* SPDX-License-Identifier: AGPL-3.0-only
 * Presentation only. Coordinates and loads come from the Godot strip solver.
 */
(() => {
  'use strict';
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const text=(x,y,s,size=16)=>`<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" fill="#29495e">${esc(s)}</text>`;
  const fmt=(n,d=2)=>Number(n).toFixed(d);
  const xy=p=>[235+1300*p[0],230-1300*p[1]];
  const curve=points=>points.map((p,i)=>(i?'L':'M')+xy(p).join(' ')).join(' ');
  function render(e,p,r) {
    if(e.id!=='phy-blow-strip')return null;
    if(!r?.stripPoints?.length)return text(450,210,'正在计算纸条弯曲平衡…');
    const v=r.values,points=r.stripPoints;
    let out=text(450,30,'向纸条上方吹气：比较同一纸条的平衡形态',21)
      +'<path d="M125 230H235" stroke="#7a8c97" stroke-width="14"/>'
      +text(170,265,'水平夹持端',15)
      +`<path data-strip-rest="true" d="${curve(r.restStripPoints)}" fill="none" stroke="#a5b5bd" stroke-width="3" stroke-dasharray="6 5"/>`
      +`<path data-blow-strip="true" data-tip-y="${v.tipY}" data-tip-rise="${v.tipRise}" d="${curve(points)}" fill="none" stroke="#446b86" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
    // Arrows follow the supplied centreline solely as a qualitative flow cue.
    if(v.speed>0&&v.density>0)for(const i of [2,16,30]) {
      const a=xy(points[i]),b=xy(points[i+10]);a[1]-=20;b[1]-=20;
      const angle=Math.atan2(b[1]-a[1],b[0]-a[0]);
      out+=`<path data-strip-airflow="true" d="M${a}L${b}M${b[0]-8*Math.cos(angle-.45)} ${b[1]-8*Math.sin(angle-.45)}L${b}L${b[0]-8*Math.cos(angle+.45)} ${b[1]-8*Math.sin(angle+.45)}" fill="none" stroke="#4386ad" stroke-width="2.5"/>`;
    }
    out+=text(665,100,v.speed===0?'无气流：只有自重下垂':v.density===0?'无介质对照：上举载荷为零':'稳定送气：观察纸条逐渐抬起',18)
      +text(665,143,`流速 ${fmt(v.speed,1)} m/s；气体密度 ${fmt(v.density,1)} kg/m³`)
      +text(665,185,`动压 q＝${fmt(v.dynamicPressure)} Pa`)
      +text(665,222,`估算压差 Cp·q＝${fmt(v.pressureDrop,3)} Pa`)
      +text(665,265,`相对无气流抬升 ${fmt(v.tipRise*1000,1)} mm`)
      +text(665,308,'实线：当前；虚线：无气流自重对照',15)
      +text(450,385,'均布等效载荷＋有限转角弹性条；Cp 与纸材常数为教学题设',15)
      +text(450,414,'只比较稳定条件下的平衡形态；未模拟真实流场、颤振、两纸靠近或瞬态过程',14);
    return out;
  }
  window.LAB_PHYSICS_SCENES=window.LAB_PHYSICS_SCENES||{};
  window.LAB_PHYSICS_SCENES.blowStrip=render;
})();
