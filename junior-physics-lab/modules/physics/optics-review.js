/* SPDX-License-Identifier: AGPL-3.0-only
 * Geometry comes from Godot. This module only maps model coordinates to SVG.
 */
(() => {
  'use strict';
  const C={ink:'#28485e',line:'#527286',blue:'#3a80ad',red:'#b95440',gold:'#b98d42',paper:'#f8fbfd'};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const f=(v,d=2)=>v==null?'—':Number(Number(v).toFixed(d)).toString();
  const text=(x,y,s,size=15,color=C.ink,anchor='middle')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}" font-family="Tahoma,SimSun,serif">${esc(s)}</text>`;
  const line=(x1,y1,x2,y2,c=C.line,w=2,dash='')=>`<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${c}" stroke-width="${w}" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
  const path=(d,c=C.line,w=2,fill='none',attrs='')=>`<path d="${d}" fill="${fill}" stroke="${c}" stroke-width="${w}" ${attrs}/>`;
  const rect=(x,y,w,h,fill=C.paper,stroke=C.line,attrs='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" ${attrs}/>`;
  const circle=(x,y,r,fill=C.paper,stroke=C.line,attrs='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" ${attrs}/>`;
  const arrow=(x1,y1,x2,y2,c=C.red,w=2)=>{const a=Math.atan2(y2-y1,x2-x1);return line(x1,y1,x2,y2,c,w)+path(`M${x2-7*Math.cos(a-.4)} ${y2-7*Math.sin(a-.4)}L${x2} ${y2}L${x2-7*Math.cos(a+.4)} ${y2-7*Math.sin(a+.4)}`,c,w);};
  const poly=(points,x,y,c,w=2,dash='')=>path(points.map((p,i)=>(i?'L':'M')+x(p[0])+' '+y(p[1])).join(' '),c,w,'none',dash?`stroke-dasharray="${dash}"`:'');

  function diffuse(r){
    let out=text(450,33,'逐处比较：入射角和反射角都相对局部法线',20);
    r.facets.forEach((facet,i)=>{
      const x=150+(i%3)*300,y=135+Math.floor(i/3)*170;
      out+=rect(x-135,y-80,270,157,'#f3f8fb','#bfd0da');
      const t=facet.tangent,n=facet.normal,d=facet.incoming,v=facet.reflected;
      out+=line(x-t[0]*60,y-t[1]*60,x+t[0]*60,y+t[1]*60,C.line,4);
      out+=line(x-n[0]*24,y-n[1]*24,x+n[0]*70,y+n[1]*70,'#9baeb9',1,'4 4');
      out+=arrow(x-d[0]*75,y-d[1]*75,x,y,C.red,2.4)+arrow(x,y,x+v[0]*75,y+v[1]*75,C.blue,2.4);
      out+=text(x,y+65,'i = '+f(facet.incidence,1)+'°；r = '+f(facet.reflection,1)+'°',15);
    });
    return out+text(450,415,'把表面倾斜幅度调为 0，比较各处反射方向',15);
  }
  function candle(x,base,height,lit,virtual=false){
    const h=height*6;
    let out=rect(x-7,base-h+8,14,h-8,virtual?'none':lit?'#d9ac78':'#e5d6b8',virtual?'#98acba':'#8c7758',virtual?'stroke-dasharray="4 3"':'');
    if(lit||virtual)out+=path(`M${x} ${base-h+8}Q${x-9} ${base-h+1} ${x} ${base-h-11}Q${x+9} ${base-h+1} ${x} ${base-h+8}Z`,virtual?'#98acba':'#b67b2e',1,virtual?'none':'#e9b458',virtual?'stroke-dasharray="3 3"':'');
    return out;
  }
  function mirror(r){
    const v=r.values,x=a=>450+a*4,y=a=>350-a*6;
    let out=text(450,34,'移动替代蜡烛，寻找像的位置',21)+line(450,72,450,365,C.blue,5)+line(456,72,456,365,'#b2cfdf',2);
    out+=text(450,62,'薄玻璃板',14)+line(125,350,775,350,'#8da5b4',1);
    for(const ray of r.rays){
      out+=poly([ray.object,ray.mirror,ray.eye],x,y,C.gold,1.7);
      out+=poly([ray.mirror,ray.image],x,y,'#9babb4',1.2,'5 4');
    }
    out+=candle(x(-v.objectDistance),350,v.height,true)+candle(x(v.imageDistance),350,v.height,false,true);
    out+=`<g data-mirror-second-distance="${v.secondDistance}">`+candle(x(v.secondDistance),350,v.height,false)+'</g>';
    if(v.screen)out+=rect(x(v.imageDistance)-4,242,8,108,'#ced8d4','#738d87')+text(x(v.imageDistance),226,'光屏上没有像',14,C.green||'#547b67');
    out+=circle(x(-40),y(v.eyeHeight),11,'#fff','#607a8b')+circle(x(-40)+3,y(v.eyeHeight),4,'#35576d','none')+text(x(-40),y(v.eyeHeight)-20,'观察位置',12);
    out+=text(x(-v.objectDistance),376,'点燃的物体',13)+text(x(v.secondDistance),395,'未点燃的替代蜡烛',13);
    out+=text(170,89,'物距 '+f(v.objectDistance)+' cm',16)+text(720,89,'替代蜡烛 '+f(v.secondDistance)+' cm',16);
    out+=text(450,418,v.matched?'位置重合；改变观察高度后继续检查':'尚未重合；调节镜后蜡烛的位置',16,v.matched?'#3c7b60':C.ink);
    return out;
  }
  function prism(r){
    const x=a=>450+a*110,y=a=>212+a*110,v=r.values;
    let out=text(450,32,'白光经过三棱镜：逐界面追踪光线',21)+text(450,65,'入射角 '+f(v.incidence,1)+'°；棱镜顶角 '+f(v.apex,1)+'°',15);
    out+=path(r.prismVertices.map((p,i)=>(i?'L':'M')+x(p[0])+' '+y(p[1])).join(' ')+'Z','#7898af',2.5,'#dbeaf2');
    out+='<defs><clipPath id="prism-ray-window"><rect x="80" y="82" width="740" height="260"/></clipPath></defs><g clip-path="url(#prism-ray-window)">';
    const incoming=r.rays[0].segments[0];out+=poly(incoming,x,y,'#7f919e',7)+poly(incoming,x,y,'#fff9dd',4);
    for(const ray of r.rays){
      for(const segment of ray.segments.slice(1))out+=poly(segment,x,y,ray.color,1.8);
    }
    out+='</g>';
    r.rays.forEach((ray,i)=>{const xx=125+i*130;out+=line(xx-24,365,xx+24,365,ray.color,4)+text(xx,389,ray.name+'光 '+(ray.deviation==null?'全反射':f(ray.deviation,1)+'°'),13);});
    return out+text(450,418,'折射率为本题给定值；图中列出直接出射偏向角',14);
  }
  function eye(r){
    const v=r.values,x=a=>460+a*10500,y=a=>220-a*26000,lensX=x(-v.lensGap),retinaX=x(v.retinaDistance);
    let out=text(450,32,'比较矫正前后：光线是否会聚到视网膜',21);
    out+=`<ellipse cx="550" cy="220" rx="120" ry="118" fill="#f1e7d8" stroke="#9b8c78" stroke-width="2"/>`;
    out+=path(`M${retinaX-10} 130Q${retinaX+10} 220 ${retinaX-10} 310`,C.red,4);
    out+=path('M460 155Q438 220 460 285Q482 220 460 155Z',C.blue,2,'#c1deeb');
    out+=line(115,220,820,220,'#a0b6c3',1,'5 4');
    if(v.withLens){
      const d=v.effectiveCorrectionPower<0?`M${lensX-10} 137Q${lensX+5} 220 ${lensX-10} 303H${lensX+10}Q${lensX-5} 220 ${lensX+10} 137Z`:v.effectiveCorrectionPower>0?`M${lensX} 137Q${lensX-24} 220 ${lensX} 303Q${lensX+24} 220 ${lensX} 137Z`:`M${lensX-3} 137H${lensX+3}V303H${lensX-3}Z`;
      out+=path(d,C.blue,2,'#d4e8f1');
    }else out+=rect(lensX-13,137,26,166,'none','#adbdc7','stroke-dasharray="5 4"');
    for(const ray of r.rays){
      out+=poly(ray.points.slice(0,4),x,y,C.gold,2);
      if(ray.points.length>4)out+=poly(ray.points.slice(3),x,y,'#bba77f',1.3,'4 4');
    }
    const fx=v.imageDistance==null?null:x(v.imageDistance);
    if(fx!=null&&fx<815&&fx>100)out+=circle(fx,220,4,v.focused?'#4e8b68':C.red,'none','data-eye-focus="true"');
    out+=text(180,105,'物距 '+f(v.objectDistance)+' m',15)+text(lensX,333,v.withLens?(v.effectiveCorrectionPower<0?'凹透镜':v.effectiveCorrectionPower>0?'凸透镜':'平光片')+' '+f(v.effectiveCorrectionPower)+' D':'未戴矫正镜',14);
    out+=text(460,358,'眼内等效透镜',13)+text(retinaX,333,'视网膜',14,C.red);
    out+=text(450,386,'模型像距 '+f(v.imageDistance*1000,2)+' mm：'+v.focusPosition,17,v.focused?'#427b60':C.ink);
    return out+text(450,415,'题设近轴模型；虚线为几何延长，不是个人配镜结论',13);
  }
  function cylinder(r){
    const v=r.values;
    let out=text(450,35,'圆柱水瓶：比较文字的宽度与高度',21)+text(450,76,'水平截面焦距 '+f(v.focal)+' cm；物距 '+f(v.objectDistance)+' cm',15);
    out+=text(220,235,'物理',36,'#37556b')+text(220,335,'原文字',16);
    out+=path('M520 105H630V147Q670 161 670 190V315Q670 338 650 338H500Q480 338 480 315V190Q480 161 520 147Z',C.line,3,'#dfeef4');
    out+='<defs><clipPath id="cylinder-window"><rect x="487" y="178" width="176" height="140"/></clipPath></defs>'+rect(488,177,174,143,'#b6d8e8','none');
    if(!v.atFocus){out+=`<g clip-path="url(#cylinder-window)"><g transform="translate(575 235) scale(${v.horizontalMagnification} 1)" data-cylinder-image="true">`+text(0,0,'物理',36,'#37556b')+'</g></g>';}
    else out+=text(575,235,'焦点处无有限清晰像',14);
    out+=text(575,365,'透过瓶的曲面比较',16)+text(450,395,'横向放大率 '+f(v.horizontalMagnification)+'；纵向放大率 1',17);
    return out+text(450,421,'薄柱透镜示意；超出瓶内视野的文字被窗口裁切',13);
  }
  function nearPoint(r){
    const v=r.values,paperX=260+v.observedDistance*9;
    let out=text(450,35,'记录本人观察到的最近清晰距离',21);
    out+=path('M155 142Q190 115 215 145L233 178L217 192L225 225Q210 250 176 245L165 283H115L130 213Q105 175 155 142Z','#8295a0',2,'#e2cbb1');
    out+=circle(202,170,5,'#3e6076','none');
    out+=rect(paperX-23,133,46,130,'#fffdf1','#9e927c','data-near-point-card="true"')+text(paperX,176,'物',24)+text(paperX,215,'理',24);
    out+=line(210,300,paperX,300,C.line,2)+line(210,289,210,311,C.line,2)+line(paperX,289,paperX,311,C.line,2)+text((210+paperX)/2,333,'本次记录 '+f(v.observedDistance)+' cm',20);
    out+=text(450,373,v.clear?'本人标记：最近仍能看清的位置':'本人标记：模糊；需要重新确认清晰位置',16,v.clear?'#48795f':C.red);
    return out+text(450,415,'图示不改变文字清晰度；距离须用实际尺子测量后填写',14);
  }
  function imagingBench(r){
    const v=r.values,x=a=>420+a*3,y=a=>230-a*12,sx=x(v.screenDistance);
    let out=text(450,34,'移动光屏寻找清晰像',21)+text(450,67,'物距 '+f(v.objectDistance)+' cm；屏距 '+f(v.screenDistance)+' cm；焦距 '+f(v.focal)+' cm',15);
    out+='<defs><clipPath id="imaging-bench-window"><rect x="70" y="85" width="760" height="260"/></clipPath></defs>';
    out+=line(80,230,820,230,'#a2b4c0',1,'5 4')+line(80,354,820,354,C.line,6);
    for(const pos of [-2*v.focal,-v.focal,v.focal,2*v.focal])out+=line(x(pos),224,x(pos),236,C.line,1)+text(x(pos),254,Math.abs(pos)===v.focal?'F':'2F',12);
    out+=path('M420 112Q395 230 420 340Q445 230 420 112Z',C.blue,2,'#c9e0ed');
    out+=rect(sx-4,110,8,230,'#d0d9d6','#82968d','data-optics-screen="true"');
    out+='<g clip-path="url(#imaging-bench-window)">';
    for(const ray of r.rays){out+=poly(ray.points,x,y,C.gold,1.8);if(ray.virtualExtension.length)out+=poly(ray.virtualExtension,x,y,'#8fa1b0',1.2,'4 4');}
    out+=arrow(x(-v.objectDistance),230,x(-v.objectDistance),y(v.height),C.red,5);
    if(v.focused)out+=arrow(sx,230,sx,y(v.imageHeight),'#537f64',5);
    else {const center=Math.max(120,Math.min(325,y(v.screenCenter))),radius=Math.max(7,Math.min(90,v.screenSpread*6));out+=`<ellipse cx="${sx}" cy="${center}" rx="9" ry="${radius}" fill="#dbb957" opacity=".5"/>`;}
    if(v.real===false&&!v.atFocus&&x(v.imageDistance)>75)out+=arrow(x(v.imageDistance),230,x(v.imageDistance),y(v.imageHeight),'#8ba2af',2);
    out+='</g>';
    const objectLabelX=Math.min(x(-v.objectDistance),370);
    if(objectLabelX!==x(-v.objectDistance))out+=line(x(-v.objectDistance),357,objectLabelX,365,'#8da5b4',1);
    out+=text(objectLabelX,380,'物体',14)+text(420,380,'凸透镜',14)+text(sx,397,'独立光屏',14);
    return out+text(450,423,v.focused?'找到清晰倒立像，可以记录当前屏距':v.atFocus?'物在焦点：出射光平行，无有限实像':v.real?'尚未对焦，继续移动光屏':'形成虚像，镜后光屏不能承接',15,v.focused?'#48795f':C.ink);
  }
  const scenes={'diffuse-reflection':diffuse,'plane-mirror':mirror,'prism-spectrum':prism,'myopia-correction':eye,'hyperopia-correction':eye,'bottle-lens':cylinder,'near-point':nearPoint,'convex-imaging':imagingBench};
  window.LAB_PHYSICS_SCENES ||= {};
  window.LAB_PHYSICS_SCENES.opticsReview=(e,p,r)=>{
    const render=scenes[(e.id||'').replace(/^phy-/,'')];if(!render)return null;
    if(!r?.values)return text(450,210,'正在准备光学装置',18);
    return render(r);
  };
})();
