// One current interface entrypoint. No independent mobile menu or synthetic clicks.
export const PHONE_HOME_GROUPS=Object.freeze([
 ['出行与探索',[['nav','地图导航','map'],['rides','Robo Taxi','car'],['flights','机场旅行','map'],['jobs','城市工作','job']]],
 ['车辆与驾驶',[['garage','我的车库','car'],['cockpit','车机与实时感知','pilot','action'],['sensor','车载摄像头','view','action'],['assist','驾驶辅助设置','settings','action']]],
 ['角色与生活',[['characters','切换角色','user'],['inventory','随身物品','shield'],['bank','账户钱财','bank']]],
 ['游戏与进度',[['save','存档管理','save'],['sound','游戏声音','volume','action'],['recenter','视角归位','view','action'],['settings','设置与关于','settings','action']]]
]);
export const PHONE_PAGES=Object.freeze(['home','nav','jobs','garage','save','cheats','bank','characters','inventory','rides','flights']);
export function renderPhoneHome(ui,{icon,escape:esc,character=''}={}){
 const g=ui.g;
 const item=([id,label,symbol,kind])=>`<button class="interface-launch" type="button" ${kind==='action'?'data-phone-action':'data-page'}="${id}"${id==='sound'?` aria-pressed="${!!g.audio?.enabled}"`:''}><span class="interface-symbol">${icon(symbol)}</span><span>${label}${id==='sound'?`<small>${g.audio?.enabled?'已开启':'已静音'}</small>`:''}</span><span aria-hidden="true">›</span></button>`;
 return `<section class="interface-home"><h3>你的旅程</h3><p class="phone-subtitle">${esc(character)} · ${esc(g.clockString?.()??'')}</p><div class="interface-home-status"><span>余额<strong>$ ${Math.floor(g.money).toLocaleString()}</strong></span><span>当前车辆<strong>${esc(g.vehicle?.model?.name??'步行探索')}</strong></span></div>${PHONE_HOME_GROUPS.map(([title,items])=>`<section class="interface-app-group"><h4>${title}</h4><div class="interface-app-items">${items.map(item).join('')}${title==='游戏与进度'&&ui.cheatsUnlocked?item(['cheats','开发者终端','cheat']):''}</div></section>`).join('')}<div class="phone-now"><b>${g.job?esc(g.job.title):'自由探索'}</b>${g.job?esc(g.job.stages[g.job.stage]?.name??''): '选择工作、探索地图，或继续驾驶。'}</div></section>`;
}
export function activatePhoneAction(ui,action,document=globalThis.document){
 const g=ui.g;
 if(action==='settings'){ui.openSettings();return true;}
 if(action==='assist'){ui.openAssistSettings();return true;}
 if(action==='sound'){ui.toggleAudio();ui.renderPhone('home');return true;}
 if(action==='cockpit'){
  if(!g.inCar){ui.toast('请先进入车辆');return true;}
  ui.closePhone();g.cockpit?.toggle();return true;
 }
 if(action==='sensor'){
  if(!g.inCar){ui.toast('请先进入车辆');return true;}
  const panel=document.getElementById('sensor-panel');if(!panel)return true;
  ui.closePhone();ui.previewSensor=panel.hidden;panel.hidden=!panel.hidden;g.sensorClock=1;return true;
 }
 if(action==='recenter'){ui.closePhone();g.recenterCamera();return true;}
 return false;
}
