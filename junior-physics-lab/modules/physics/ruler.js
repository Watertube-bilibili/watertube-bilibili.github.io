/* SPDX-License-Identifier: AGPL-3.0-only */
/* Steel-ruler apparatus. Scientific values and deformation samples come from Godot. */
(() => {
  'use strict';
  const C = {ink:'#27485f',line:'#547286',blue:'#34749d',red:'#bb5945',gold:'#c18b34',paper:'#f8fbfd'};
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const format = (value, digits = 2) => value == null || !Number.isFinite(Number(value)) ? '—' : Number(Number(value).toFixed(digits)).toString();
  const text = (x,y,value,size=15,fill=C.ink,anchor='start') => `<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" text-anchor="${anchor}" font-family="Tahoma,Microsoft YaHei,sans-serif">${escape(value)}</text>`;
  const line = (x1,y1,x2,y2,stroke=C.line,width=2,dash='') => `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${stroke}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
  const rect = (x,y,width,height,fill,stroke=C.line,radius=0) => `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${stroke}"/>`;
  const circle = (x,y,r,fill,stroke=C.line) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}"/>`;

  function arrow(x1,y1,x2,y2,color=C.red,width=3) {
    const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy);
    if (len<.01) return '';
    const ux=dx/len,uy=dy/len;
    const left=[x2-ux*10-uy*5,y2-uy*10+ux*5];
    const right=[x2-ux*10+uy*5,y2-uy*10-ux*5];
    return line(x1,y1,x2,y2,color,width)+`<path d="M${left}L${x2} ${y2}L${right}Z" fill="${color}"/>`;
  }

  // Interpolate only samples supplied by the engine; do not reconstruct vibration physics here.
  function at(points, x) {
    if (!Array.isArray(points) || points.length===0) return 0;
    if (x<=number(points[0][0])) return number(points[0][1]);
    for (let i=1;i<points.length;i++) {
      const a=points[i-1],b=points[i];
      if (x<=number(b[0])) {
        const span=number(b[0])-number(a[0]);
        const proportion=span>0 ? (x-number(a[0]))/span : 0;
        return number(a[1])+(number(b[1])-number(a[1]))*proportion;
      }
    }
    return number(points[points.length-1][1]);
  }

  function panel(x,y,width,height,title) {
    return rect(x,y,width,height,'#f0f7fb','#93b0c4',3)
      +rect(x+1,y+1,width-2,26,'#d7e8f3','none',2)
      +text(x+12,y+19,title,14);
  }

  function support(edge,base) {
    const left=edge-270;
    return rect(left,base+5,270,18,'#d6ba88','#94734b')
      +rect(left+25,base+23,22,110,'#b89564','#94734b')
      +rect(edge-39,base+23,22,110,'#b89564','#94734b')
      +line(left+10,base+11,edge-8,base+11,'#ebd5ad',2)
      +text(left+15,base-8,'桌面',15,'#876b40')
      +rect(edge-67,base+23,61,13,'#96aaba','#506c80',3)
      +rect(edge-67,base-22,61,15,'#becdd7','#506c80',3)
      +line(edge-43,base-55,edge-43,base+30,'#637f91',7)
      +circle(edge-43,base-55,10,'#9eb3c2','#506c80')
      +line(edge-58,base-55,edge-28,base-55,'#506c80',4);
  }

  function steel(points) {
    const upper=points.map(([x,y])=>`${x},${y-4}`);
    const lower=[...points].reverse().map(([x,y])=>`${x},${y+4}`);
    return `<polygon data-ruler-beam="true" points="${upper.concat(lower).join(' ')}" fill="#bdced9" stroke="#4f7188" stroke-width="1.8"/>`
      +`<polyline points="${points.map(([x,y])=>`${x},${y-2}`).join(' ')}" fill="none" stroke="#e9f4fa" stroke-width="1.2"/>`;
  }

  function dimension(x1,x2,y,label,color=C.blue) {
    const labelX=Math.max((x1+x2)/2,x1+112);
    return line(x1,y-7,x1,y+7,color,1.5)+line(x2,y-7,x2,y+7,color,1.5)
      +arrow(x1+12,y,x1,y,color,1.2)+arrow(x2-12,y,x2,y,color,1.2)
      +line(x1+8,y,x2-8,y,color,1.2)
      +rect(labelX-111,y+10,222,28,'#f4f9fc','#b5cbd9',2)
      +text(labelX,y+30,label,15,color,'middle');
  }

  function fixedWave(result,progress,seconds) {
    const points=result?.graph?.points || [];
    const x=90,y=78,width=460,height=91;
    const plotLeft=x+19,plotRight=x+width-18,mid=y+49;
    const maxMs=seconds*1000;
    const stride=Math.max(1,Math.floor(points.length/300));
    const waveform=points.filter((_,i)=>i%stride===0||i===points.length-1).map(([ms,mm])=>[plotLeft+clamp(number(ms)/maxMs,0,1)*(plotRight-plotLeft),mid-number(mm)*4]);
    let out=panel(x,y,width,height,'同一时间窗：观察振动次数与幅度');
    out+=line(plotLeft,mid,plotRight,mid,'#97b4c8',1);
    out+=line(plotLeft,mid-20,plotLeft,mid+20,'#97b4c8',1);
    if (waveform.length>1) out+=`<polyline data-ruler-wave="true" points="${waveform.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${C.blue}" stroke-width="1.5"/>`;
    const cursor=plotLeft+progress*(plotRight-plotLeft);
    out+=line(cursor,mid-20,cursor,mid+20,C.gold,1.5);
    out+=text(plotLeft,y+84,'0 ms',11,C.ink)
      +text(plotRight,y+84,format(maxMs,0)+' ms',11,C.ink,'end')
      +text(plotRight,y+19,'位移 / mm',11,C.ink,'end');
    return out;
  }

  function pitch(experiment,params,result,progress) {
    if (result?.solver && (!result.displayTrajectory?.length || !result.shape?.length)) {
      throw new Error('钢尺振动模型未返回轨迹与振型。');
    }
    const v=result?.values || {};
    const length=number(v.length,number(params.length,8));
    const amplitude=number(v.amplitude,number(params.amplitude,2));
    const seconds=number(v.displaySeconds,.05);
    const elapsed=seconds*progress;
    const displacement=at(result?.displayTrajectory,elapsed);
    const profile=Array.isArray(result?.shape) && result.shape.length ? result.shape : [[0,0],[1,0]];
    const edge=360,base=238,pixelsPerCm=20,amplitudeScale=8;
    const tip=edge+length*pixelsPerCm;
    const points=profile.map(([fraction,shapeValue])=>[edge+number(fraction)*length*pixelsPerCm,base+number(shapeValue)*displacement*amplitudeScale]);
    const tipY=base+displacement*amplitudeScale;
    let out=`<g data-ruler-kind="pitch" data-ruler-length-cm="${length}" data-ruler-tip-x="${tip}" data-ruler-tip-y="${tipY}">`;
    out+=text(450,37,'钢尺伸出长度与音调',23,C.ink,'middle')
      +fixedWave(result,progress,seconds)
      +panel(603,78,216,91,'振动频率')
      +text(711,134,format(v.frequency,2)+' Hz',25,C.blue,'middle')
      +text(711,156,amplitude===0?'未拨动，没有振动':v.frequency==null?'改变长度后开始实验':v.audible?'通常可听范围内':'低于通常可听范围',13,C.ink,'middle');
    out+=support(edge,base)
      +rect(edge-150,base-4,150,8,'#bdced9','#4f7188')
      +line(edge-148,base-8,edge-140,base+8,'#f8fbfd',4)
      +line(edge-136,base-8,edge-128,base+8,'#f8fbfd',4)
      +line(edge,base,tip,base,'#9db2bf',1,'5 4')
      +steel(points);
    for (let cm=0;cm<=length+.00001;cm++) {
      const xx=edge+cm*pixelsPerCm;
      const yy=base+at(profile,cm/length)*displacement*amplitudeScale;
      out+=line(xx,yy-3,xx,yy+(cm%2===0?3:1),'#69869a',1);
    }
    out+=circle(tip,tipY,3.4,C.red,C.red)
      +line(edge,base+12,edge,314,'#91adc1',1,'4 4')
      +line(tip,base+Math.max(10,amplitude*amplitudeScale+10),tip,314,'#91adc1',1,'4 4')
      +dimension(edge,tip,315,'伸出长度 L = '+format(length,1)+' cm');
    out+=text(190,390,'夹紧处不动，自由端振动',14,C.ink,'middle')
      +text(570,390,'拨动幅度 '+format(amplitude,1)+' mm · 当前位移 '+format(displacement,2)+' mm',14,C.ink,'middle')
      +text(450,419,'统一 '+format(number(experiment.playSeconds,5)/seconds,0)+' 倍慢动作；图中振幅放大显示，波形横轴始终为 '+format(seconds*1000,0)+' ms',13,C.ink,'middle')
      +'</g>';
    return out;
  }

  function force(_experiment,params,result) {
    if (result?.solver && !result.deflectionProfile?.length) {
      throw new Error('钢尺受力模型未返回形变曲线。');
    }
    const v=result?.values || {};
    const length=number(v.length,number(params.length,20));
    const loadPosition=number(v.loadPosition,number(params.position,15));
    const magnitude=number(v.force,number(params.force,.3));
    const direction=number(v.direction,number(params.direction,1))>=0 ? 1 : -1;
    const profile=Array.isArray(result?.deflectionProfile) && result.deflectionProfile.length ? result.deflectionProfile : [[0,0],[length,0]];
    const edge=290,base=210,pixelsPerCm=20,deflectionScale=4;
    const end=edge+length*pixelsPerCm;
    const points=profile.map(([cm,mm])=>[edge+number(cm)*pixelsPerCm,base+number(mm)*deflectionScale]);
    const loadX=edge+loadPosition*pixelsPerCm;
    const loadY=base+at(profile,loadPosition)*deflectionScale;
    const tipY=base+at(profile,length)*deflectionScale;
    let out=`<g data-ruler-kind="force" data-ruler-load-x="${loadX}" data-ruler-load-y="${loadY}" data-ruler-tip-y="${tipY}">`;
    out+=text(450,37,'钢尺弯曲：比较力的三要素',23,C.ink,'middle')
      +text(450,66,'每次只改变大小、方向、作用点中的一个',15,C.ink,'middle')
      +support(edge,base)
      +rect(edge-105,base-4,105,8,'#bdced9','#4f7188')
      +line(edge,base,end,base,'#95adbc',1.5,'6 4')
      +steel(points);
    for (let cm=0;cm<=length+.00001;cm+=2) {
      const xx=edge+cm*pixelsPerCm,yy=base+at(profile,cm)*deflectionScale;
      out+=line(xx,yy-3,xx,yy+3,'#69869a',1);
    }
    out+=circle(loadX,loadY,4.5,C.red,C.red);
    if (magnitude>0) out+=arrow(loadX,loadY,loadX,loadY+direction*(38+magnitude*35),C.red,3);
    const labelY=loadY+direction*(52+magnitude*35)+(direction<0?-4:15);
    out+=text(loadX+14,labelY,'F = '+format(magnitude,2)+' N',16,C.red)
      +line(edge,base+10,edge,339,'#91adc1',1,'4 4')
      +line(loadX,Math.max(base,loadY)+12,loadX,339,'#91adc1',1,'4 4')
      +dimension(edge,loadX,340,'作用点 a = '+format(loadPosition,1)+' cm');
    out+=panel(722,106,153,152,'末端挠度大小')
      +text(798,157,format(v.deflection==null ? null : Math.abs(number(v.deflection)),3)+' mm',20,C.blue,'middle')
      +text(798,190,'拉力方向：'+(direction>0?'向下':'向上'),14,C.ink,'middle')
      +text(798,218,'固定伸出 '+format(length,0)+' cm',13,C.ink,'middle')
      +text(798,242,'虚线：未受力位置',12,C.ink,'middle');
    out+=line(end+13,base,end+13,tipY,C.gold,1.5)
      +line(end+7,base,end+19,base,C.gold,1.5)
      +line(end+7,tipY,end+19,tipY,C.gold,1.5)
      +text(450,419,'形变按同一固定比例放大显示；曲线由物理模型返回，不能据图中像素读取毫米',13,C.ink,'middle')
      +'</g>';
    return out;
  }

  window.LAB_PHYSICS_SCENES=window.LAB_PHYSICS_SCENES || {};
  window.LAB_PHYSICS_SCENES.ruler=(experiment,params,result,progress=0) => experiment.model==='sound'
    ? pitch(experiment,params,result,clamp(number(progress),0,1))
    : force(experiment,params,result);
})();
