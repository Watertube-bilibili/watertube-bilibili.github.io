/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
  'use strict';
  const C={ink:'#294f6b',line:'#55788f',blue:'#487fa3',red:'#ad5744',gold:'#c69646'};
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n=(x,d=0)=>Number.isFinite(Number(x))?Number(x):d;
  const f=(x,d=2)=>x==null?'—':String(Number(n(x).toFixed(d)));
  const text=(x,y,s,size=16,color=C.ink)=>`<text x="${x}" y="${y}" text-anchor="middle" font-family="Tahoma,SimSun,serif" font-size="${size}" fill="${color}">${esc(s)}</text>`;
  const path=(d,color=C.line,width=3,fill='none',attrs='')=>`<path d="${d}" fill="${fill}" stroke="${color}" stroke-width="${width}" ${attrs}/>`;
  const rect=(x,y,w,h,fill='#f6fafc',stroke=C.line,attrs='')=>`<rect x="${x}" y="${y}" width="${Math.max(0,w)}" height="${Math.max(0,h)}" fill="${fill}" stroke="${stroke}" ${attrs}/>`;
  const circle=(x,y,r,fill='#f8fbfc',stroke=C.line)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}"/>`;
  function stateAt(states,t){
    if(!states?.length)return {};
    const target=Math.max(0,Math.min(1,t))*n(states.at(-1).time),last=states.at(-1);
    if(target>=n(last.time))return last;
    for(let i=1;i<states.length;i++){
      const a=states[i-1],b=states[i];if(target>n(b.time))continue;
      if(target===n(b.time))return b;
      const q=(target-n(a.time))/(n(b.time)-n(a.time)||1);
      return Object.fromEntries(Object.keys(a).map(k=>[k,typeof a[k]==='number'&&typeof b[k]==='number'?a[k]+(b[k]-a[k])*q:a[k]]));
    }
    return states[0];
  }
  function meter(e,p,r){
    const v=r?.values||{},s=p.scenario,mode=v.mode||p.mode||(s==='ammeterPractice'?'I':'V'),series=(v.connection||p.connection)==='series',digital=s==='multimeterPractice',open=v.terminal==='open',on=v.energized!==false;
    const positive=series?250:325,negative=series?310:235,y=series?145:242,red=v.terminal==='reversed'?negative:positive,black=v.terminal==='reversed'?positive:negative;
    let out=text(450,39,digital?'数字多用电表 · 挡位与表笔练习':'电表使用 · 先接线，再选量程',22);
    // Battery positive is at the top. Across the lower load, its RIGHT end is at higher potential.
    out+=path('M120 145H430V315H325M235 315H120V257M120 205V145')+rect(235,302,90,26,'#e8d7ae')+text(280,367,'待测电阻 '+f(v.resistance??p.resistance)+' Ω',15);
    out+=path('M120 205V218M105 218H135M111 232H129M120 232V257')+text(94,218,'＋',14)+text(94,239,'－',14)+text(74,276,f(v.voltage??p.voltage)+' V',15);
    if(!on){out+=rect(116,180,8,24,'#fff','none')+path('M120 203L137 184',C.red,2)+text(192,207,'外部电源断开',13);}
    if(series){
      out+=rect(247,125,66,40,'#fff','none')+path('M247 145H255M305 145H313')+circle(280,145,25)+text(280,152,mode==='I'?'A':mode==='R'?'Ω':'V',18);
      if(open)out+=rect(245,140,12,10,'#fff','none')+path('M244 145L253 134',C.red,2);
    }else{
      out+=path(open?'M235 315V242H255M305 242H318M325 260V315':'M235 315V242H255M305 242H325V315',C.blue)+circle(280,242,25)+text(280,249,mode==='I'?'A':mode==='R'?'Ω':'V',18);
      if(open)out+=path('M318 242L337 252',C.red,2);
    }
    if(mode==='R')out+=text(282,95,on?'先断开电源，再跨接元件两端':series?'电阻挡串接在断开的回路中：OL':'电阻挡跨接待测元件，内部电源测量',13,on?C.red:C.ink);
    out+=path(`M${red} ${open?y-24:y}Q470 95 558 290`,C.red,2,'none','data-red-probe="true"')+path(`M${black} ${y}Q470 365 746 290`,C.line,2,'none','data-black-probe="true"');
    if(open)out+=circle(red,y-24,4,'#fff',C.red);
    out+=rect(515,103,295,205,'#c5d2dc')+rect(533,120,259,143,digital?'#c0d1bc':'#fffced');
    if(digital){
      const display=v.display&&v.display!=='number'?v.display:v.actual==null?'—':f(v.actual,3)+' '+(v.unit||'');
      out+=text(663,192,display,display.length>7?22:31,'#354c39')+text(663,235,'当前挡位 '+mode,16);
    }else{
      const cx=663,cy=238,R=104;
      for(let i=0;i<=30;i++){const a=(-150+i*4)*Math.PI/180,x=cx+Math.cos(a)*R,Y=cy+Math.sin(a)*R;out+=path(`M${x} ${Y}L${cx+Math.cos(a)*(R-(i%5===0?9:5))} ${cy+Math.sin(a)*(R-(i%5===0?9:5))}`,C.line,1.5);if(i%10===0)out+=text(cx+Math.cos(a)*(R-26),cy+Math.sin(a)*(R-26)+4,f(n(v.range,p.range)*i/30),12);}
      const a=(-150+120*n(v.needleRatio))*Math.PI/180;
      out+=path(`M${cx} ${cy}L${cx+Math.cos(a)*91} ${cy+Math.sin(a)*91}`,C.red,3,'none','data-meter-pointer="true"')+circle(cx,cy,5,C.gold)+text(cx,170,mode==='I'?'A':'V',22);
    }
    out+=circle(558,285,8,C.red)+circle(746,285,8,C.ink)+text(558,336,mode==='I'?(digital?'A插孔':'＋ / A'):'＋ / VΩ',14)+text(746,336,'－ / COM',14);
    // Long fault combinations remain visible without crossing the edges of the 900px stage.
    const status=String(v.status||'选择接法、接线柱与量程，检查示数');
    out+=text(450,390,status.slice(0,49),13,v.valid?C.ink:C.red);
    if(status.length>49)out+=text(450,412,status.slice(49,98),13,C.red);
    return out;
  }
  function compass(e,p,r){
    const v=r?.values||{},pole=v.pole||p.pole||'N';
    let out=text(450,36,'移动小磁针，探测磁体外部磁场',22);
    for(const a of v.fieldVectors||[]){const x=450+a.x*70,y=225-a.y*70,angle=-a.angle;out+=`<g transform="translate(${x} ${y}) rotate(${angle})">`+path('M-16 0H16m-6-4 6 4-6 4','#91acbd',1.5)+'</g>';}
    out+=rect(408,207,42,36,pole==='N'?'#6587a2':'#b66555')+rect(450,207,42,36,pole==='N'?'#b66555':'#6587a2')+text(429,231,pole==='N'?'S':'N',18,'#fff')+text(471,231,pole==='N'?'N':'S',18,'#fff');
    const x=450+n(v.x,p.x)*70,y=225-n(v.y,p.y)*70;
    out+=`<g transform="translate(${x} ${y})" data-compass-position="true">`+circle(0,0,29,'#fffce8')+(v.valid?`<g transform="rotate(${-n(v.angle)})">`+path('M-23 0L0-7V7Z',C.blue,1,C.blue)+path('M23 0L0-7V7Z',C.red,1,C.red)+'</g>':text(0,5,'移出',12))+circle(0,0,3,C.gold)+'</g>';
    out+=path('M130 115H195m-7-4 7 4-7 4M130 115V65m-4 7 4-7 4 7',C.line,1.5)+text(207,120,'+x',13)+text(130,58,'+y',13);return out+text(450,405,'红端为N端；调换磁极后，同一位置的指向反转',15);
  }
  function crane(e,p,r){
    const v=r?.values||{},held=!!v.held,loadHeight=14+n(v.load,p.load)*.14,y=held?251:354-loadHeight,iron=v.core==='iron',current=n(v.current,p.current),turns=n(v.turns,p.turns),count=Math.max(2,Math.round(turns/10)),active=Math.abs(current)>0;
    let out=text(450,38,'电磁起重装置 · 比较吸力与载荷',22)+path('M220 345V95H500V142',C.line,12);
    out+=path('M408 240V167Q408 138 440 138H515Q547 138 547 167V240',iron?C.line:'#bbc8d0',iron?20:3,'none',iron?'data-core="iron"':'data-core="air" stroke-dasharray="6 5"');
    for(let i=0;i<count;i++)out+=path(`M396 ${158+i*77/Math.max(1,count-1)}q16-7 32 0`,active?C.gold:'#a9b2b7',3,'none','data-coil-turn="true"');
    if(active){out+=text(380,248,current>0?'N':'S',16,current>0?C.red:C.blue)+text(576,248,current>0?'S':'N',16,current>0?C.blue:C.red);const sign=current>0?1:-1;out+=path(`M365 ${191-sign*23}V${191+sign*23}m-5 ${-sign*8} 5 ${sign*8} 5 ${-sign*8}`,C.gold,2,'none','data-current-direction="true"');}
    out+=rect(385,y,185,loadHeight,'#91a6b4')+path('M135 360H660',C.line,6)+text(700,137,iron?'铁芯':'空心线圈',18)+text(700,172,'载荷 '+f(v.load??p.load)+' g',19)+text(700,215,'重力 '+f(v.weight,3)+' N',17)+text(700,254,'题设吸力 '+f(v.force,5)+' N',17)+text(700,300,held?'可以托住':'不能托住',20,held?C.blue:C.red)+text(700,338,turns+' 匝（线圈图按比例简化）',13);
    if(n(v.force)>0)out+=path(`M480 ${y-5}v-35m-5 8 5-8 5 8`,C.red,2,'none','data-attraction-arrow="true"');
    return out+text(450,390,'固定绕向：正电流左端为N；反向只换极性，吸引软铁方向不变',14)+text(450,413,'气隙、截面积与材料参数为题设；实际吸力需测量',13);
  }
  function fuse(e,p,r,t){
    const v=r?.values||{},state=stateAt(v.heatingStates,t),hot=!!state.reachedMelting,broken=!!state.fused,fraction=n(state.meltedFraction),current=broken?0:n(v.givenCurrent,p.current);
    let out=text(450,38,'不同材料细丝 · 升温、熔化与断开',22)+path('M160 210V310H740V210',C.line,3)+rect(423,294,54,33,'#cedce7')+text(450,353,'断前设定 '+f(v.givenCurrent??p.current)+' A；当前电流 '+f(current)+' A',16)+rect(130,182,65,56,'#bdac87')+rect(705,182,65,56,'#bdac87');
    const d=broken?'M190 210H434M466 210H710':'M190 210H710';
    out+=path(d,hot?'#d7753c':C.line,Math.max(2,n(v.diameter,p.diameter)*13),'none',`data-fuse-wire="true" data-fused="${broken}"`);
    if(broken)out+=circle(434,215,5,'#d7753c')+circle(466,215,5,'#d7753c');
    out+=rect(205,84,490,62,'#fff4cf','#c3aa6d')+text(450,110,broken?'完成熔化后断开：不再产生焦耳热':hot?'熔化吸热中：未断丝，仍有电流':'升温阶段：细丝保持接通',17)+text(450,134,'模型熔化比例 '+f(fraction*100,1)+'%；时间 '+f(state.time,2)+' s',14)+text(450,266,'当前 '+f(state.temperature??20,1)+' ℃；给定熔点 '+f(v.meltingPoint,0)+' ℃',18);
    const temperatureFraction=Math.max(0,Math.min(1,(n(state.temperature,20)-20)/Math.max(1,n(v.meltingPoint,180)-20)));out+=rect(810,160,14,155,'#fff8e4')+rect(813,309-140*temperatureFraction,8,6+140*temperatureFraction,C.red,'none','data-fuse-thermometer="true"')+circle(817,321,11,C.red)+text(817,144,'熔点',13)+text(817,351,'20℃',12);return out+text(450,402,'题设在全段熔化后断开；到熔点不等于立即断丝',14);
  }
  function solar(e,p,r,t){
    const v=r?.values||{},state=stateAt(v.thermalStates,t),dry=!!state.dry,temperature=state.temperature==null?null:n(state.temperature,p.initial??20),remaining=Math.max(0,n(state.remainingMass,v.mass??p.mass??.5)),fraction=Math.min(1,remaining/2);
    let out=text(450,38,'太阳能热水装置 · 量热与温升',22)+circle(170,125,43,'#efcc77','#ad914d');
    for(let i=0;i<7;i++)out+=path(`M${210+i*6} ${135+i*11}L${330+i*7} ${205+i*9}`,C.gold,2);
    out+=path('M290 315L440 194H525L375 315Z',C.line,3,'#537a92')+path('M485 215H580V182M390 302H580V295',C.red,5)+rect(580,128,162,207,'#e2eff5')+rect(584,328-150*fraction,154,150*fraction,'#87b7d1','none',`data-liquid-mass="${remaining}"`)+text(661,365,'液态水 '+f(remaining,3)+' kg',16)+path('M584 178H595M584 253H595',C.line,1)+text(615,172,'2 kg',11)+text(615,247,'1 kg',11)+rect(760,135,13,184,'#fff9e8');
    if(!dry&&temperature!=null)out+=rect(763,310-temperature*1.55,7,temperature*1.55,C.red,'none')+circle(766.5,317,13,C.red)+text(790,105,f(temperature,1)+' ℃',18);
    else out+=text(735,104,'无液态水温读数',16,C.red);
    return out+text(450,395,dry?'水已全部汽化；停止水温预测，不把后续能量继续记入水吸热':'改变水量、初温、功率和时间，比较升温与沸腾',14)+text(450,418,'模型时间 '+f(state.time,1)+' s；水已吸热 '+f(state.absorbedEnergy,0)+' J',13);
  }
  window.LAB_PHYSICS_SCENES=window.LAB_PHYSICS_SCENES||{};
  window.LAB_PHYSICS_SCENES.electricalReview=(e,p,r,t)=>{
    const s=p.scenario||e.modelParams?.scenario;
    if(['ammeterPractice','voltmeterPractice','multimeterPractice'].includes(s))return meter(e,{...e.modelParams,...p},r);
    if(s==='compassMap')return compass(e,p,r);
    if(s==='craneLoad')return crane(e,p,r);
    if(s==='fuseCompare')return fuse(e,p,r,t);
    if(e.model==='energy'&&s==='solarWater')return solar(e,p,r,t);
    return null;
  };
})();
