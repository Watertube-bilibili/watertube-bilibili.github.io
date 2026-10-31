/* SPDX-License-Identifier: AGPL-3.0-only
 * Sound apparatus views. Oscillation samples and acoustic values are supplied by Godot.
 */
(() => {
  'use strict';
  const C={ink:'#28485e',line:'#527286',blue:'#3a80ad',red:'#b95440',gold:'#b98d42',paper:'#f8fbfd'};
  const n=(x,d=0)=>Number.isFinite(Number(x))?Number(x):d;
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const f=(x,d=2)=>x==null?'—':Number(n(x).toFixed(d)).toString();
  const text=(x,y,s,size=16,color=C.ink,anchor='middle')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}" font-family="Tahoma,SimSun,serif">${esc(s)}</text>`;
  const line=(x1,y1,x2,y2,c=C.line,w=2)=>`<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${c}" stroke-width="${w}"/>`;
  const path=(d,c=C.line,w=2,fill='none',attrs='')=>`<path d="${d}" fill="${fill}" stroke="${c}" stroke-width="${w}" ${attrs}/>`;
  const rect=(x,y,w,h,fill=C.paper,stroke=C.line,attrs='')=>`<rect x="${x}" y="${y}" width="${Math.max(0,w)}" height="${Math.max(0,h)}" fill="${fill}" stroke="${stroke}" ${attrs}/>`;
  const circle=(x,y,r,fill=C.paper,stroke=C.line,attrs='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" ${attrs}/>`;
  const bench=()=>rect(100,339,700,12,'#b8c7d0')+line(105,337,795,337,C.line,3);

  function sourcePoints(r){return r.sourceGraph?.points||r.values?.sourcePoints||r.graph?.points||[];}
  function sample(points,time){
    if(!points.length)return 0;
    if(time<=n(points[0][0]))return n(points[0][1]);
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i];
      if(time<=n(b[0]))return n(a[1])+(n(b[1])-n(a[1]))*(time-n(a[0]))/Math.max(1e-9,n(b[0])-n(a[0]));
    }
    return n(points.at(-1)[1]);
  }
  // A common 24 ms observation interval, displayed slowly, preserves frequency comparisons.
  // Periodic display only repeats the sampled engine waveform; no oscillator is solved here.
  function displacement(r,p,t){
    if(n(r.values?.sourceAmplitude,r.values?.amplitude??p.amplitude)<=0)return 0;
    const points=sourcePoints(r),end=n(points.at(-1)?.[0]);
    return end>0?sample(points,(clamp(n(t),0,1)*24)%end):0;
  }
  function wave(r,x,y,w=270,h=90,received=false){
    const points=received?(r.graph?.points||[]):sourcePoints(r);
    let out=rect(x,y,w,h,'#f5f9fb','#a3bac9')+line(x+10,y+h/2,x+w-10,y+h/2,'#a8bdc9',1);
    if(points.length>1){
      const d=points.map((point,i)=>(i?'L':'M')+(x+10+i/(points.length-1)*(w-20))+' '+(y+h/2-clamp(n(point[1]),-12,12)*(h-14)/24)).join(' ');
      out+=path(d,received?C.gold:C.blue,2);
    }
    return out+text(x+w/2,y+h+21,received?'接收信号（相对量）':'振源波形（相对量）',13);
  }
  function meter(x,y,value,max,label){
    const level=value==null?0:clamp(n(value)/Math.max(.001,max),0,1);
    return rect(x,y,200,25,'#e2edf3')+rect(x+2,y+2,196*level,21,'#77a7c1','none',`data-sound-meter="${esc(label)}"`)+text(x+100,y+52,label+' '+f(value),15);
  }
  function rubber(e,p,r,t){
    const d=displacement(r,p,t)*5.5;
    return bench()+rect(150,210,350,127,'#cfb17b','#987949')+rect(175,195,35,19,'#9b7a4d')+rect(650,195,35,142,'#9b7a4d')+path(`M192 195Q430 ${195+d} 667 195`,C.red,5,'none','data-sound-vibrator="rubber"')+text(450,55,'拨动绷紧的橡皮筋',21)+text(450,95,'振幅为零时，橡皮筋保持静止',15)+text(450,389,'频率 '+f(r.values?.frequency)+' Hz；振动按相同比例慢放',16);
  }
  function speaker(e,p,r,t){
    const d=displacement(r,p,t),x=270+d*2.4,tip=640+d*4;
    return bench()+rect(150,140,135,195,'#9bb1bf')+circle(218,235,56,'#627f91')+path(`M195 200L${x} 180V290L195 270Z`,C.line,3,'#abc4d5','data-sound-vibrator="speaker"')+rect(622,278,36,59,'#e9dab7','#a39169')+path(`M640 278C615 269 628 246 ${tip} 227C${tip-4} 249 663 264 640 278Z`,'#bd7b2c',2,'#e8b04d','data-sound-flame="response"')+line(320,235,575,235,C.blue,2)+text(450,55,'扬声器使附近烛焰颤动',21)+text(450,95,'振幅 '+f(r.values?.amplitude,p.amplitude)+'；设为零可作对照',15)+text(450,389,'烛焰变化为放大的响应示意，说明声音能传递能量',15);
  }
  function amplitudeBall(e,p,r,t){
    const d=displacement(r,p,t)*2.5,bx=420+Math.abs(d)*2.1;
    return bench()+path(`M280 130L${280+d} 255Q325 290 ${370-d} 255L370 130`,C.line,12,'none','data-sound-vibrator="fork"')+line(325,278,325,337,C.line,12)+line(420,65,bx,215,C.gold,2)+circle(bx,225,12,'#e4bd79','#a8864f','data-sound-ball="response"')+text(450,42,'音叉振动与轻质小球',21)+wave(r,530,150,250,105)+text(450,389,'小球偏离为振动放大示意；实际碰撞过程不作定量测量',15);
  }
  function vacuum(e,p,r,t){
    const d=displacement(r,p,t)*2.5,medium=r.values?.medium||p.medium||'air',air=medium!=='vacuum';
    let out=bench()+path('M140 337V165C140 65 420 65 420 165V337Z',C.line,3,'#dfedf4')+rect(130,328,300,11,'#8ba5b6')+circle(280,190,39,'#dbbb69','#917747')+rect(246,225,68,85,'#b49653','#876d3c')+line(280,190,280+d,157,C.line,5)+circle(280+d,153,7,'#596f7a',C.line,'data-sound-vibrator="bell"');
    out+=text(450,43,'真空罩中的闹钟',21)+text(280,362,air?'罩内有介质':'罩内为真空',16)+wave(r,515,175,255,105,true)+text(450,403,air?'保持振源条件相同，介质可以传播声音':'闹钟仍振动；真空不能传播声音',16);
    if(air)for(let i=0;i<3;i++)out+=path(`M${445+i*17} 168Q${464+i*17} 220 ${445+i*17} 270`,C.blue,2);
    return out;
  }
  function bottle(e,p,r,t){
    const v=r.values||{},fraction=clamp(n(v.waterLevel,p.waterLevel??50)/100,0,1),waterTop=330-fraction*145,d=displacement(r,p,t)*1.3;
    const outline='M280 105H340V160Q385 175 385 215V313Q385 330 370 330H250Q235 330 235 313V215Q235 175 280 160Z';
    return bench()+`<g transform="translate(${d},0)" data-sound-vibrator="bottle"><defs><clipPath id="sound-bottle-water-clip"><path d="${outline}"/></clipPath></defs>`+path(outline,C.line,3,'#e2eff5')+`<g clip-path="url(#sound-bottle-water-clip)">`+rect(240,waterTop,140,330-waterTop,'#8fc7e0','none','data-bottle-water="level"')+'</g>'+line(280,107,340,107,C.line,4)+'</g>'+line(415,155,367,190,C.gold,9)+text(450,43,'敲击相同玻璃瓶，比较加水前后音调',20)+text(640,145,'水量比例 '+f(fraction*100,0)+'%',18)+text(640,185,'敲击频率 '+f(v.frequency,1)+' Hz',19)+wave(r,515,230,255,75)+text(450,389,'敲击时瓶与水共同振动；此页不用于解释吹瓶口',15);
  }
  function airColumn(e,p,r,t){
    const v=r.values||{},length=n(v.length_cm,p.length_cm??25)/100,x=225+clamp(length,.05,.5)/.5*420,d=displacement(r,p,t);
    return rect(175,175,595,100,'#b8cbd8')+rect(185,185,x-185,80,'#e0f0f7','none','data-air-column="length"')+rect(x,179,16,92,'#7e99ab')+rect(x+16,218,130,14,'#bda16d','#8b734f')+line(110,225,168,225,C.blue,3)+path(`M200 199Q${(200+x)/2} ${199+d*2} ${x-8} 199`,C.blue,2)+text(450,52,'推拉活塞，改变空气柱长度',21)+text(450,107,'空气柱长度 '+f(length,3)+' m；基频 '+f(v.frequency,1)+' Hz',18)+text(450,345,'开口端在左，活塞端封闭',16)+text(450,394,'管端条件相同时，空气柱越长，基频越低',16);
  }
  function telephone(e,p,r,t){
    const state=p.stringState||'tight',labels={tight:'拉紧',slack:'松弛',pinched:'捏住',broken:'断开'};
    let out=path('M120 130H245L225 260H140Z',C.line,3,'#ceb991')+path('M655 130H780L760 260H675Z',C.line,3,'#ceb991');
    const wire=state==='slack'?'M185 260Q450 370 717 260':state==='broken'?'M185 260L410 280M480 280L717 260':'M185 260H717';
    out+=path(wire,C.gold,3,'none',`data-string-state="${esc(state)}"`);
    if(state==='pinched')out+=path('M431 222V263Q449 276 467 263V222',C.line,3,'#dfc09d');
    out+=text(450,48,'纸杯棉线电话',21)+text(450,90,'棉线状态：'+(labels[state]||state),18)+text(185,312,'纸杯 A',17)+text(717,312,'纸杯 B',17)+text(450,374,state==='tight'?'保持相同声源，比较接收效果':'与拉紧状态比较，观察传声条件改变',16)+text(450,408,'此图比较传声条件，线的状态不能换算成固定分贝差',14);
    return out;
  }
  function insulation(e,p,r,t){
    const v=r.values||{},trans=n(v.transmission,p.transmission??(1-n(p.attenuation,.5))),received=v.receivedAmplitude??v.relativeReceived??null;
    let out=rect(160,105,360,235,'#b9a47d','#8d7953')+rect(180,125,320,195,'#e7dfc8','#a89c7a')+circle(340,222,51,'#f5e5bc','#a08b5d')+line(340,222,340,190,C.line,3)+line(340,222,365,228,C.line,3)+rect(490,126,10,194,'#7198ad','none',`data-sound-barrier="${trans}"`);
    out+=text(450,48,'隔声条件的对照',21)+text(450,81,'声源、房间和接收位置保持相同',15)+meter(585,185,received,10,'接收振幅')+text(450,382,'透过系数 '+f(trans)+'（理想对照条件）',16)+text(450,414,'系数用于比较传播中的减弱，不代表具体材料的实测性能',14);
    return out;
  }
  const scenes={'rubber-vibration':rubber,'speaker-candle':speaker,'amplitude-ball':amplitudeBall,'vacuum-bell':vacuum,'bottle-xylophone':bottle,'piston-flute':airColumn,'cup-telephone':telephone,'soundproof-room':insulation};
  window.LAB_PHYSICS_SCENES=window.LAB_PHYSICS_SCENES||{};
  window.LAB_PHYSICS_SCENES.soundReview=(e,p,r,t)=>{
    const key=p.variant||e.sceneVariant||(e.id||'').replace(/^phy-/,'');
    return scenes[key]?scenes[key](e,p,r,t):null;
  };
})();
