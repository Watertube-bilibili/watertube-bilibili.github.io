/* SPDX-License-Identifier: AGPL-3.0-only
 * SVG instruments display Godot's material data and fluid calculations.
 */
(() => {
  'use strict';
  const C={ink:'#29495e',line:'#557487',blue:'#4386ad',water:'#90c6dc',gold:'#c29951',paper:'#f5f9fb'};
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const f=(n,d=2)=>n==null?'—':Number(Number(n).toFixed(d)).toString();
  const text=(x,y,s,size=15,color=C.ink,anchor='middle')=>`<text x="${x}" y="${y}" font-family="Tahoma,SimSun,serif" font-size="${size}" fill="${color}" text-anchor="${anchor}">${esc(s)}</text>`;
  const path=(d,c=C.line,w=2,fill='none',extra='')=>`<path d="${d}" stroke="${c}" stroke-width="${w}" fill="${fill}" ${extra}/>`;
  const line=(x1,y1,x2,y2,c=C.line,w=2,dash='')=>path(`M${x1} ${y1}L${x2} ${y2}`,c,w,'none',dash?`stroke-dasharray="${dash}"`:'');
  const rect=(x,y,w,h,fill=C.paper,stroke=C.line,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" ${extra}/>`;
  const circle=(x,y,r,fill=C.paper,stroke=C.line,extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" ${extra}/>`;
  const arrow=(x1,y1,x2,y2,c=C.blue,w=2)=>{const a=Math.atan2(y2-y1,x2-x1);return line(x1,y1,x2,y2,c,w)+path(`M${x2-7*Math.cos(a-.45)} ${y2-7*Math.sin(a-.45)}L${x2} ${y2}L${x2-7*Math.cos(a+.45)} ${y2-7*Math.sin(a+.45)}`,c,w);};
  function uTube(left,right,top,bottom,leftLevel,rightLevel){
    const bend=20,full=`M${left} ${top}V${bottom-bend}Q${left} ${bottom} ${left+bend} ${bottom}H${right-bend}Q${right} ${bottom} ${right} ${bottom-bend}V${top}`;
    const fluid=`M${left} ${leftLevel}V${bottom-bend}Q${left} ${bottom} ${left+bend} ${bottom}H${right-bend}Q${right} ${bottom} ${right} ${bottom-bend}V${rightLevel}`;
    return path(full,'#7693a6',22)+path(full,'#edf6f8',17)+path(fluid,C.water,13,'none',`data-u-liquid="true" data-left-level="${leftLevel}" data-right-level="${rightLevel}"`)+line(left-7,leftLevel,left+7,leftLevel,C.blue,2)+line(right-7,rightLevel,right+7,rightLevel,C.blue,2);
  }
  function series(r){
    const v=r.values;
    let out=text(450,34,'同一种材料：用五组样品比较质量与体积',21)+text(265,76,v.materialName+'；相同温度与状态',17);
    for(const sample of r.samples){
      const x=100+(sample.index-1)*85,w=sample.sideLength*15,depth=w*.22,selected=sample.index===v.sampleIndex;
      out+=`<g data-density-sample="${sample.index}" data-sample-volume="${sample.volume}">`;
      out+=rect(x-w/2,230-w,w,w,v.color,selected?'#b6812e':C.line,selected?'stroke-width="3"':'');
      out+=path(`M${x-w/2} ${230-w}l${depth} ${-depth}h${w}l${-depth} ${depth}Z`,C.line,1,'#cbd5dc');
      out+=path(`M${x+w/2} ${230-w}l${depth} ${-depth}v${w}l${-depth} ${depth}Z`,C.line,1,'#7e95a5');
      out+=text(x,257,'V '+f(sample.volume)+' cm³',12)+text(x,278,'m '+f(sample.mass)+' g',12);
      if(selected)out+=text(x,125,'当前样品',13,'#9a702d')+arrow(x,134,x,160,'#b88d3f',2);
      out+='</g>';
    }
    out+=rect(142,306,245,68,'#aabbc7')+rect(163,319,201,40,'#2c4653','#536f80')+text(264,347,f(v.mass)+' g',25,'#e5f1e6')+text(264,397,'当前样品体积 '+f(v.volume)+' cm³',15);
    const series=r.graph.series,maxX=Math.max(...series.flatMap(s=>s.points.map(p=>p[0]))),maxY=Math.max(...series.flatMap(s=>s.points.map(p=>p[1]))),x=a=>550+a/maxX*275,y=a=>310-a/maxY*190;
    out+=text(687,78,'m—V 多组数据',17)+line(550,105,550,310,C.line,2)+line(550,310,835,310,C.line,2);
    for(let i=0;i<=4;i++){out+=line(550,y(maxY*i/4),825,y(maxY*i/4),'#cfdae2',1)+text(540,y(maxY*i/4)+4,f(maxY*i/4,1),11,C.ink,'end')+text(x(maxX*i/4),332,f(maxX*i/4),11);}
    series.forEach((s,index)=>{const color=index===0?C.blue:C.gold;out+=path(s.points.map((p,i)=>(i?'L':'M')+x(p[0])+' '+y(p[1])).join(' '),color,2.3);for(const p of s.points.slice(1))out+=circle(x(p[0]),y(p[1]),3,color,'none');out+=line(560+index*145,365,590+index*145,365,color,3)+text(598+index*145,370,s.name,13,C.ink,'start');});
    return out+text(555,97,'m / g',12)+text(827,350,'V / cm³',12)+text(450,423,'数据由给定密度模型生成；先比较多组读数，再求 m/V',14);
  }
  function liquid(r){
    const v=r.values,probeY=140+v.depth*360,delta=v.heightDifference*140,leftLevel=245+delta/2,rightLevel=245-delta/2;
    let out=text(450,33,'探头方向、深度与液体密度分别比较',21)+text(255,77,'被测液体 ρ = '+f(v.density,0)+' kg/m³',16);
    out+=rect(112,140,276,209,'#b9d9e7','none')+path('M110 95V340Q110 350 120 350H380Q390 350 390 340V95',C.line,3)+line(113,140,387,140,C.blue,2)+text(162,127,'自由液面',13);
    out+=path(`M260 ${probeY}H435V95H560`,C.line,4)+text(435,81,'气路',12);
    out+=`<g transform="rotate(${v.probeAngle} 260 ${probeY})" data-probe-direction="${esc(v.probeDirection)}">`+circle(260,probeY,21,'#b2c0c9',C.line)+line(280,probeY-15,280,probeY+15,'#b25c4c',5)+line(254,probeY,273,probeY,C.line,2)+'</g>';
    out+=line(412,140,412,probeY,'#92774d',1)+line(402,140,422,140,'#92774d',1)+line(402,probeY,422,probeY,'#92774d',1)+text(465,(140+probeY)/2+5,'h '+f(v.depth)+' m',13);
    out+=uTube(560,695,95,368,leftLevel,rightLevel)+text(560,72,'接探头',13)+text(695,72,'通大气',13);
    out+=line(731,leftLevel,731,rightLevel,'#967e56',1)+line(720,leftLevel,742,leftLevel,'#967e56',1)+line(720,rightLevel,742,rightLevel,'#967e56',1);
    out+=text(790,224,'Δh',17)+text(790,254,f(v.headMillimeters,1)+' mm',16)+text(630,397,'U管示压液 ρ示 = '+f(v.manometerDensity,0)+' kg/m³',14);
    return out+text(260,390,'探头表压 '+f(v.liquidPressure,1)+' Pa',18)+text(450,424,'保持中心深度不变转动探头：压强与 U 管液面差不变',14);
  }
  function venturi(r){
    const v=r.values,half=50/v.diameterRatio,delta=v.heightDifference*650,leftLevel=296+delta/2,rightLevel=296-delta/2;
    let out=text(450,34,'同高宽窄管：比较两个流动位置的静压',21)+text(220,75,'宽段 v₁ = '+f(v.wideSpeed)+' m/s',16)+text(640,75,'窄段 v₂ = '+f(v.narrowSpeed)+' m/s',16);
    out+=path(`M80 90H280L440 ${140-half}H820V${140+half}H440L280 190H80Z`,C.line,3,'#d5e8f2','data-venturi-shape="true"')+line(80,140,820,140,'#9cb8c9',1,'5 4');
    if(v.wideSpeed>0)out+=arrow(135,120,135+v.wideSpeed*4,120,C.blue,3)+arrow(640,140-half/2,640+v.narrowSpeed*4,140-half/2,C.blue,3);
    out+=path('M220 140V216H340V231',C.line,3)+path('M610 140V216H520V231',C.line,3)+circle(220,140,5,'#fff',C.line)+circle(610,140,5,'#fff',C.line);
    out+=text(145,216,'同高侧壁取压口',12,C.ink,'end');
    out+=uTube(340,520,231,392,leftLevel,rightLevel);
    out+=text(205,294,'宽段比较基准',14)+text(205,323,'0 Pa',20)+text(690,270,'窄段相对宽段',14)+text(690,301,f(v.narrowRelativePressure,2)+' Pa',21);
    out+=line(562,leftLevel,562,rightLevel,C.gold,1.5)+line(551,leftLevel,573,leftLevel,C.gold,1.5)+line(551,rightLevel,573,rightLevel,C.gold,1.5)+text(702,345,'Δh = '+f(v.headMillimeters,2)+' mm',17);
    return out+text(450,424,'面积比 '+f(v.areaRatio)+'；ρ气 '+f(v.gasDensity)+'、ρ示 '+f(v.manometerDensity,0)+' kg/m³（两者不同）',14);
  }
  const renders={'phy-mass-volume':series,'phy-liquid-pressure':liquid,'phy-flow-pressure-sensors':venturi};
  window.LAB_PHYSICS_SCENES ||= {};
  window.LAB_PHYSICS_SCENES.fluidDensityReview=(e,p,r)=>{
    const render=renders[e.id];if(!render)return null;
    if(!r?.values)return text(450,210,'正在准备测量装置',18);
    return render(r);
  };
})();
