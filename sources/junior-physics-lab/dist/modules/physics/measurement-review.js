/* SPDX-License-Identifier: AGPL-3.0-only
 * Apparatus for three measurement/contact tasks. Values and classifications come from Godot.
 */
(() => {
  'use strict';
  const c={ink:'#28485e',line:'#627d8c',blue:'#4688b0',red:'#b35e4c',gold:'#c29a4f'};
  const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[x]));
  const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const f=(v,d=3)=>v===null||v===undefined?'—':String(Number(Number(v).toFixed(d)));
  const text=(x,y,s,size=15,color=c.ink,anchor='start')=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}" font-family="Tahoma,SimSun,serif">${esc(s)}</text>`;
  const line=(x1,y1,x2,y2,color=c.line,width=2,dash='')=>`<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}"${dash?` stroke-dasharray="${dash}"`:''}/>`;
  const path=(d,fill='none',stroke=c.line,width=2)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
  const rect=(x,y,w,h,fill='#fff',stroke=c.line)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}"/>`;
  const circle=(x,y,r,fill='#d4dee2')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${c.line}" stroke-width="2"/>`;
  const panel=(x,y,w,h,title)=>rect(x,y,w,h,'#f4f4e6','#a5b3a5')+rect(x+1,y+1,w-2,27,'#dce6db','none')+text(x+12,y+20,title,15);
  const center=(x,y,s,size=15,color=c.ink)=>text(x,y,s,size,color,'middle');
  function gauge(x,y,value){
    const pointer=y+13+Math.min(6,Math.max(0,n(value)))/6*46;
    return rect(x,y,48,77,'#e8efef')+rect(x+7,y+9,34,57,'#f7f6df','#b5c0ad')
      +Array.from({length:7},(_,i)=>line(x+12,y+13+i*46/6,x+22,y+13+i*46/6,c.line,1)+text(x+25,y+16+i*46/6,i,7)).join('')
      +(value===null?'':line(x+7,pointer,x+22,pointer,c.red,3))+center(x+24,y+88,'N',10);
  }
  function weighing(p,r){
    const v=r.values,scale=5.2,surface=190,bottom=surface+n(v.bottomDepth)*scale,top=surface+n(v.topDepth)*scale,w=n(v.blockWidth)*18;
    let out=`<g data-measurement-scene="weighingDepth" data-bottom-depth="${v.bottomDepth}" data-pull="${v.apparentWeight}">`;
    out+=center(450,23,v.scenario==='forceFactors'?'保持一个条件相同，比较排液体积或液体密度的影响':'空气中称重 → 浸入液体 → 完全浸没后继续改变深度',19);
    out+=line(90,33,500,33,c.line,5)+gauge(136,37,v.weight)+line(160,114,160,160)+rect(160-w/2,160,w,52,'#aab8bf')+center(160,240,'空气中：'+f(v.weight)+' N',15);
    out+=path('M278 155V379Q278 390 290 390H509Q522 390 522 379V155','#f6faf9')+rect(281,surface,238,197,'#bcdbe8','none')+line(279,surface,521,surface,c.blue,2);
    out+=gauge(375,37,v.apparentWeight)+line(399,114,399,top,c.line,2,v.validSuspension?'':'5 4');
    out+=`<g opacity="${v.validSuspension?1:.55}">`+rect(399-w/2,top,w,52,'#a8b5bc')+'</g>';
    for(let depth=0;depth<=35;depth+=5){const y=surface+depth*scale;out+=line(532,y,546,y,c.line,1)+text(553,y+4,depth,11);}
    out+=text(534,172,'cm',12)+line(520,surface,570,surface,c.blue,1,'4 4')+center(402,408,v.fullySubmerged?'已浸没：只改变深度，排液体积不变':'部分浸入时：深度改变排液体积',13);
    out+=panel(602,60,267,306,'当前读数与对照')+text(620,110,'下表面深度 '+f(v.bottomDepth,1)+' cm',16)+text(620,144,'排液体积 '+f(v.displacedVolume,1)+' cm³',16)
      +text(620,179,'空气中 G = '+f(v.weight)+' N',16)+text(620,214,'液中 F拉 = '+f(v.apparentWeight)+' N',16)
      +text(620,249,'G − F拉 = '+(v.validSuspension?f(v.buoyantForce)+' N':'不能静止上悬'),16,c.blue)
      +text(620,285,v.validSuspension?'可在当前条件记录示数':'浮力超过重力，细线会松弛',14,v.validSuspension?c.ink:c.red)
      +text(620,322,v.scenario==='forceFactors'?'只改变一个因素；同时记录ρ液与V排':'固定物体与液体，再比较10、20、30 cm',11)
      +center(450,426,'同种静止液体，不触底不碰壁；图中虚线表示所选位置不能由上方细线静止保持。',11);
    return out+'</g>';
  }
  function archimedes(p,r){
    const v=r.values,surface=210+n(v.remainingHeadroom)*.3,bodyTop=surface-52*(1-n(v.fraction)),bodyWidth=n(v.blockWidth)*18,receivedHeight=Math.min(68,n(v.collectedVolume)*.5);
    let out=`<g data-measurement-scene="archimedesEvidence" data-valid="${v.validEvidence}" data-buoyant="${v.buoyantForce}" data-collected="${v.collectedWeight}">`;
    out+=center(450,25,'两条测量证据：G − F拉 与 G杯液 − G空杯',19);
    out+=line(92,41,489,41,c.line,5)+gauge(119,46,v.weight)+line(143,123,143,157)+rect(143-bodyWidth/2,157,bodyWidth,52,'#a9b6bd')+center(143,234,'空气中 G = '+f(v.weight)+' N',14);
    out+=path('M278 159V347Q278 358 290 358H507Q519 358 519 347V159','#f6faf9')+rect(281,surface,235,355-surface,'#bcdbe8','none')+line(280,surface,517,surface,c.blue,2);
    out+=gauge(367,46,v.apparentWeight)+line(391,123,391,bodyTop,c.line,2,v.validSuspension?'':'5 4')+`<g opacity="${v.validSuspension?1:.5}">`+rect(391-bodyWidth/2,bodyTop,bodyWidth,52,'#9aabb4')+'</g>';
    out+=path('M519 210H550L580 271','none',c.line,7)+line(516,210,539,210,c.blue,2)+center(466,181,'溢水口',12);
    out+=path('M565 271V343H699V271','#f7faf7')+rect(568,340-receivedHeight,128,receivedHeight,'#bcdbe8','none')+rect(553,348,159,47,'#bccfd0')+center(632,378,f(v.cupFilledWeight)+' N',17,c.blue);
    out+=path('M107 279V335H180V279','#f7faf7')+rect(88,348,111,47,'#bccfd0')+center(144,378,f(v.cupEmptyWeight)+' N',15,c.blue)+center(144,267,'先称空接水杯',13)+center(631,254,'再称杯与收到的液体',13);
    if(n(v.overflowVolume)>0)out+=line(554,224,570,252,c.blue,3);
    if(n(v.lossPercent)>0)out+=path('M558 228Q602 248 731 315','none',c.blue,2)+text(605,232,'收集有损失',12,c.red);
    out+=panel(735,65,151,302,'读数比较')+text(746,111,'G = '+f(v.weight)+' N',13)+text(746,150,'F拉 = '+f(v.apparentWeight)+' N',13)
      +text(746,191,'F浮 '+(v.validSuspension?f(v.buoyantForce):'—')+' N',14,c.blue)+text(746,232,'G收集 '+f(v.collectedWeight)+' N',14,c.blue)
      +text(746,275,v.validEvidence?'两条证据相等':'先核查操作条件',13,v.validEvidence?c.ink:c.red)+text(746,314,'V排 '+f(v.displacedVolume,1)+' cm³',12)
      +text(746,343,'V收到 '+f(v.collectedVolume,1)+' cm³',12)
      +center(450,418,'杯先装至溢水口并静置，完整收集；缺水或漏接使收到液体的重力偏小。',12);
    return out+'</g>';
  }
  function efficiency(p,r){
    const v=r.values,movingY=280-n(v.height)*100,freeY=170+n(v.ropeDistance)*70,loadY=movingY+43;
    let out=`<g data-measurement-scene="efficiencyMeasurement" data-efficiency="${v.efficiency}" data-measured-pull="${v.pull}">`;
    out+=center(450,29,'读取G、F、h、s，再计算机械效率；效率不是输入条件',19);
    out+=line(189,65,457,65,c.line,6)+line(370,65,370,110)+circle(370,110,35,'#c1d0d4')+circle(370,110,7,'#7e929b')+circle(300,movingY,35,'#c2b594')+circle(300,movingY,7,'#8e846c');
    out+=path(`M265 65V${movingY}Q300 ${movingY+70} 335 ${movingY}V110Q370 40 405 110V${freeY}`,'none','#aa8956',4);
    out+=line(300,movingY+35,300,loadY)+rect(272,loadY,56,45,'#a3b3bb')+center(300,loadY+28,f(v.load,1)+' N',12);
    out+=rect(387,freeY,36,51,'#e8efed')+line(405,freeY+8,405,freeY+38,c.red,4)+text(439,freeY+29,'F = '+f(v.pull,1)+' N',15);
    const initialY=323;out+=line(200,initialY,269,initialY,c.line,1,'4 4')+line(200,loadY,269,loadY,c.blue,1,'4 4')+line(214,loadY,214,initialY,c.blue,2)+text(85,loadY+25,'h = '+f(v.height,2)+' m',15,c.blue);
    out+=line(470,170,470,freeY,c.red,2)+line(460,170,480,170,c.red,2)+line(460,freeY,480,freeY,c.red,2)+text(486,(170+freeY)/2,'s = '+f(v.ropeDistance,2)+' m',13,c.red);
    out+=panel(620,76,254,279,'按测量记录计算')+text(638,128,'W有 = Gh = '+f(v.usefulWork)+' J',15)+text(638,167,'W总 = Fs = '+f(v.inputWork)+' J',15)
      +text(638,210,'数据比值 '+f(v.rawEfficiency,2)+' %',17,c.blue)+text(638,250,'有效效率 '+f(v.efficiency,2)+(v.efficiency===null?'':' %'),18,v.validMeasurement?c.blue:c.red)
      +text(638,290,v.geometryConsistent?'两绳段：s ≈ 2h':'位移不符合 s ≈ 2h',14,v.geometryConsistent?c.ink:c.red)
      +text(638,325,v.energyConsistent?'总功不少于有用功':'超过100%，需核查记录',14,v.energyConsistent?c.ink:c.red)
      +center(450,390,'下方输入来自同一次缓慢匀速提升；换载荷后应重新测量拉力与位移。',14)
      +center(450,420,'图示反映输入的测量记录；有误数据保留供检查，不自动改成正确答案。',12);
    return out+'</g>';
  }
  function contact(p,r){
    const v=r.values,gap=n(v.gapPixels),lower=219+gap,paper=v.separator==='paper',fresh=v.surface==='fresh';
    let out=`<g data-measurement-scene="contactAttraction" data-contact="${v.intimateContact}" data-joined="${v.joinedAfterRelease}">`;
    out+=center(450,30,'比较接触条件，并在撤去压紧力后观察',19)+line(133,71,526,71,c.line,6)+line(327,71,327,119);
    out+=rect(251,119,152,96,'#a7b6bd')+rect(251,lower,152,96,'#acb9be')+path('M251 119Q327 103 403 119M251 '+(lower+96)+'Q327 '+(lower+112)+' 403 '+(lower+96),'none','#6c838d',2);
    if(fresh)out+=line(252,215,402,215,'#ecf2ef',3)+line(252,lower,402,lower,'#ecf2ef',3);
    else if(v.surface==='rough')out+=path('M251 211l12 7 12-7 12 7 12-7 12 7 12-7 12 7 12-7 12 7 12-7 12 7 8-7','none','#6d7b82',3)+path(`M251 ${lower+3}l12-5 12 5 12-5 12 5 12-5 12 5 12-5 12 5 12-5 12 5 12-5 8 5`,'none','#6d7b82',3);
    else out+=rect(251,209,152,7,'#7c8d91','none')+rect(251,lower,152,7,'#7c8d91','none');
    if(paper)out+=rect(231,216,192,3,'#e3d1a5','#a89d7c')+text(436,221,'纸片',14);
    if(v.pressed)out+=line(181,120,181,175,c.red,4)+path('M172 162L181 175L190 162','none',c.red,4)+line(181,lower+96,181,lower+41,c.red,4)+path(`M172 ${lower+54}L181 ${lower+41}L190 ${lower+54}`,'none',c.red,4);
    out+=panel(581,107,281,231,'观察证据')+text(599,154,{fresh:'新鲜、清洁、平整',rough:'粗糙接触面',oxidized:'表面有氧化层'}[v.surface],17)
      +text(599,193,paper?'两铅面之间隔纸':'两铅面之间无隔层',16)+text(599,235,{apart:'接触前：保持间隙',pressed:'正在用外力压紧',released:'已撤去压紧外力'}[v.stage],16)
      +text(599,278,v.stage==='released'?(v.joinedAfterRelease?'仍结合：可观察引力证据':'未显示同样的结合'):'撤去外力后才检查是否结合',15,v.joinedAfterRelease?c.blue:c.ink)
      +center(450,382,'压紧时靠在一起不是充分证据；要比较撤去外力后的情况。',15)
      +center(450,416,'此处比较典型接触条件，不预测实际承载质量；铅材料只作屏幕模拟。',12);
    return out+'</g>';
  }
  window.LAB_PHYSICS_SCENES=window.LAB_PHYSICS_SCENES||{};
  window.LAB_PHYSICS_SCENES.measurementReview=(experiment,params,result)=>{
    const scenario=params.scenario||result?.values?.scenario;
    if(!result?.values)return center(450,210,'等待物理引擎返回装置状态',18);
    if(scenario==='weighingDepth')return weighing(params,result);
    if(scenario==='forceFactors')return weighing(params,result);
    if(scenario==='archimedesEvidence')return archimedes(params,result);
    if(scenario==='efficiencyMeasurement')return efficiency(params,result);
    if(scenario==='contactAttraction')return contact(params,result);
    return null;
  };
})();
