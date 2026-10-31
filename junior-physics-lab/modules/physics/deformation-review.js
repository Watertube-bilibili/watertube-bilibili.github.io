/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
  'use strict';
  const label=(x,y,s,size=17)=>`<text x="${x}" y="${y}" text-anchor="middle" font-family="Tahoma,SimSun,serif" font-size="${size}" fill="#32566f">${s}</text>`;
  const path=(d,c='#52758c',w=3,fill='none')=>`<path d="${d}" stroke="${c}" stroke-width="${w}" fill="${fill}"/>`;
  function specimen(x,height,width,clay){
    if(clay){const w=70*width,top=330-height;return path(`M${x-w} 330V${top+8}Q${x-w} ${top} ${x-w+8} ${top}H${x+w-8}Q${x+w} ${top} ${x+w} ${top+8}V330Z`,'#9c774a',2,'#c7a77b')+path(`M${x-w+4} ${top+9}Q${x} ${top+22} ${x+w-4} ${top+9}`,'#aa8759',1);}
    const bottom=160+height,points=Array.from({length:15},(_,i)=>`${x+(i%2?23:-23)} ${160+i*height/14}`).join('L');
    return path(`M${x-70} 140H${x+70}`,undefined,7)+path(`M${x} 140V160L${points}L${x} ${bottom}V${bottom+20}`,undefined,3)+path(`M${x-25} ${bottom+20}H${x+25}`,'#af7845',5);
  }
  window.LAB_PHYSICS_SCENES ||= {};
  window.LAB_PHYSICS_SCENES.deformationReview=(e,p,r)=>{
    if(e.id!=='phy-deformation')return null;
    const v=r?.values||{},clay=(v.material||p.material)==='clay',height=Number(v.height??.05)*2200,width=Number(v.widthRatio??1),stage=v.stage||p.stage||'loaded';
    if(r?.solver&&(v.height===undefined||v.widthRatio===undefined||v.force===undefined))throw Error('形变模型缺少 Godot 几何或外力数据。');
    let out=`<g data-deformation-material="${clay?'clay':'spring'}" data-deformation-height="${v.height??.05}" data-deformation-width-ratio="${width}" data-deformation-force="${v.force??0}">`;
    out+=label(450,42,'加载与卸载 · 比较形状是否恢复',22)+label(450,69,'每次设定最大力，代表一次全新试样的加载试验',13)+label(245,111,'初始试样')+label(655,111,stage==='unloaded'?'完全卸载后':'最大加载时')+`<g data-deformation-specimen="initial">${specimen(245,110,1,clay)}</g><g data-deformation-specimen="current">${specimen(655,height,width,clay)}</g>`;
    if(clay)out+=path('M110 333H790','#6b879a',6);
    if(Number(v.force)>0){const start=clay?290-height:180+height+2,end=start+40;out+=`<g data-deformation-force-arrow="true" data-force-direction="down">`+path(`M655 ${start}V${end}M646 ${end-13}L655 ${end}L664 ${end-13}`,'#b55f43',3)+label(706,(start+end)/2+5,`${Number(v.force).toFixed(1)} N`,14)+'</g>';}
    out+=label(450,390,clay?'保持最大力不变再卸载，比较残余形变':'在给定弹性范围内，卸载恢复原长',16);
    return out+'</g>';
  };
})();
