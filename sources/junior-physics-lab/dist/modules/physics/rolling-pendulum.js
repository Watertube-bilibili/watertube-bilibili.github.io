/* SPDX-License-Identifier: AGPL-3.0-only
 * Rolling-pendulum apparatus. Position, rotation and energy come from Godot.
 */
(() => {
  'use strict';
  const C={ink:'#294f6a',line:'#54778d',blue:'#4b88ae',gold:'#bd8b3e',red:'#b45c47',green:'#64866b'};
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const finite=x=>typeof x==='number'&&Number.isFinite(x);
  const f=(x,d=3)=>finite(x)?String(Number(x.toFixed(d))):'—';
  const text=(x,y,s,size=15,color=C.ink,anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" fill="${color}" font-family="Tahoma,SimSun,serif">${esc(s)}</text>`;
  const line=(x1,y1,x2,y2,c=C.line,w=2,attrs='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" ${attrs}/>`;
  const rect=(x,y,w,h,fill='#f6fafc',stroke=C.line,attrs='')=>`<rect x="${x}" y="${y}" width="${Math.max(0,w)}" height="${Math.max(0,h)}" fill="${fill}" stroke="${stroke}" ${attrs}/>`;
  const circle=(x,y,r,fill='#eef5f8',stroke=C.line,w=2)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`;
  const path=(d,c=C.line,w=2,fill='none',attrs='')=>`<path d="${d}" stroke="${c}" stroke-width="${w}" fill="${fill}" ${attrs}/>`;

  // Upper-bound search makes equal-time impulse states right-continuous.
  // Pre-event and post-event states must never be blended into a false slow turn.
  function sampleAt(states,progress){
    if(!Array.isArray(states)||!states.length)return null;
    const target=states.at(-1).time*Math.max(0,Math.min(1,Number(progress)||0)),epsilon=16*Number.EPSILON*Math.max(1,states.at(-1).time);
    let low=0,high=states.length;
    while(low<high){const mid=(low+high)>>1;if(states[mid].time<=target+epsilon)low=mid+1;else high=mid;}
    const a=states[Math.max(0,low-1)],b=states[low];
    if(!b||b.time<=a.time||a.branch!==b.branch)return {...a,time:target};
    const q=Math.max(0,Math.min(1,(target-a.time)/(b.time-a.time))),state={...a,time:target};
    for(const key of ['position','velocity','angle','angularVelocity','potentialEnergy','translationEnergy','rotationEnergy','mechanicalEnergy','energyLost','tension']){
      if(finite(a[key])&&finite(b[key]))state[key]=a[key]+(b[key]-a[key])*q;
    }
    return state;
  }

  function energyPanel(state,initial,error){
    let out=rect(520,78,330,306,'#f2f7fa','#9fb6c6')+rect(521,79,328,31,'#dcebf4','none')+text(685,100,'能量 / J · 以最低点为势能零点',14);
    const rows=[['重力势能','potentialEnergy',C.blue],['平动动能','translationEnergy',C.gold],['转动动能','rotationEnergy',C.green],['累计损失','energyLost',C.red]];
    rows.forEach(([label,key,color],i)=>{
      const y=130+i*45,value=state?.[key],ratio=finite(value)&&initial>0?Math.max(0,Math.min(1,value/initial)):0;
      out+=text(535,y,label,13,C.ink,'start')+text(830,y,f(value,4),14,C.ink,'end');
      out+=rect(535,y+8,295,10,'#dce6eb','#b1c1cb')+rect(536,y+9,293*ratio,8,color,'none',`data-energy="${key}" data-energy-value="${finite(value)?value:''}"`);
    });
    return out+text(535,331,'机械能 '+f(state?.mechanicalEnergy,4)+' J',14,C.ink,'start')+text(535,351,'初始能量 '+f(initial,4)+' J',13,C.ink,'start')+text(535,373,'本次积分误差（另列） '+f(error,5)+' J',12,C.line,'start');
  }

  function apparatus(state,height){
    const position=state?.position??0,angle=state?.angle??0,omega=state?.angularVelocity??0,branch=state?.branch??1;
    const y=123+(height>0?Math.max(0,Math.min(1,position/height)):0)*185;
    let out=line(90,70,455,70,C.line,7)+line(205,72,205,y,C.gold,2)+line(355,72,355,y,C.gold,2);
    out+=line(165,y,395,y,C.line,12)+line(165,y-2,395,y-2,'#a8bcc9',4);
    out+=`<g transform="translate(280 ${y}) rotate(${angle*180/Math.PI})" data-rolling-angle="${angle}">`+circle(0,0,48,'#b9cbd6')+circle(0,0,35,'#d9e5eb','#89a3b4',1)+line(0,0,42,0,C.gold,5)+circle(0,0,9,'#8ea7b7')+'</g>';
    if(Math.abs(omega)>1e-10){
      const arc=omega>0?'M27 -48A55 55 0 0 1 52 19m-9-8 9 8 3-12':'M52 19A55 55 0 0 0 27 -48m-1 12 1-12 12 3';
      out+=`<g transform="translate(280 ${y})" data-rotation-direction="${Math.sign(omega)}">`+path(arc,C.red,2.3)+'</g>';
    }
    if(Math.abs(state?.velocity??0)>1e-10){const up=state.velocity<0;out+=path(`M115 ${y+(up?28:-28)}V${y+(up?-28:28)}m-7 ${up?9:-9} 7 ${up?-9:9} 7 ${up?9:-9}`,C.blue,2.5);}
    out+=line(90,308,455,308,'#9ab0c0',1,'stroke-dasharray="5 4"')+text(95,329,'最低位置',12,C.line,'start');
    // End view of one axle: the string switches its tangent side at the bottom.
    const side=branch===-1?1:-1,x=445+side*16;
    out+=rect(405,155,80,94,'#f5f9fb','#adc1ce')+text(445,173,'轴端视图',12)+circle(445,207,16,'#acc1cf')+line(x,183,x,224,C.gold,3,`data-winding-side="${branch}"`)+text(445,241,branch===1?'原绕线侧':'反卷绕线侧',10);
    return out;
  }

  function render(e,p,r,progress){
    if(p.scenario!=='rollingPendulum'&&e.id!=='phy-rolling-pendulum')return null;
    const v=r?.values||{},valid=v.valid!==false;
    if(r?.solver&&valid&&(!Array.isArray(r.rollingStates)||!r.rollingStates.length))throw Error('滚摆缺少Godot往返过程状态。');
    const state=valid?sampleAt(r?.rollingStates,progress):null,height=Number(v.height??p.height??.5);
    let out=text(450,35,'滚摆往返：下降、反卷上升与能量',22);
    out+=`<g data-rolling-apparatus="true" data-time="${state?.time??0}" data-position="${state?.position??0}" data-velocity="${state?.velocity??0}" data-angle="${state?.angle??0}" data-omega="${state?.angularVelocity??0}" data-branch="${state?.branch??1}" data-phase="${esc(state?.phase||'ready')}">`+apparatus(state,height)+'</g>';
    if(!valid){
      out+=rect(520,92,330,245,'#fff4d9','#c5a25a')+text(685,125,'当前参数不支持反卷捕获近似',17,'#8b6331');
      out+=text(685,166,'需要 I ≥ mr²；I = mr² 时收紧停摆',14)+text(685,200,'请增大转动惯量，或减小质量、轴半径',13)+text(685,240,'未生成假定的反向轨迹',14);
      return out+text(450,390,'当前只显示未释放装置；参数范围判断由Godot给出。',15);
    }
    out+=energyPanel(state,Number(v.initialPotential??0),v.energyBalanceError);
    const atEnd=state&&state.time>=r.rollingStates.at(-1).time;
    const phase=atEnd&&v.stopReason==='resolution-limit'?'达到分辨限：截停观察，仍保留末态':{descending:'下降：势能转化为两种动能',ascending:'反卷上升：动能转化为势能',turning:'上升顶点：两种速度瞬间为0',stopped:v.stopReason==='capture-stop'?'收紧后停摆：两种速度为0':'本次观察结束'}[state?.phase]||'设置条件后释放滚摆';
    out+=text(280,365,phase,15)+text(450,398,'t = '+f(state?.time)+' s；向下位移 '+f(state?.position)+' m；速度 '+f(state?.velocity)+' m/s；角速度 '+f(state?.angularVelocity)+' rad/s',14);
    return out+text(450,419,'绳侧与轴半径作放大示意；下端收紧按瞬时约束捕获处理，能量损失不等于真实器材标定。',13);
  }
  window.LAB_PHYSICS_SCENES ||= {};
  window.LAB_PHYSICS_SCENES.rollingPendulum=render;
})();
