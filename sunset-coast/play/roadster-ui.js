import {installPanelDrag} from './panel-drag.js';
import {installControlSelectionGuard} from './touch-selection.js';
import {roadsterTrim,roadsterFlightLocked,toggleRoadsterAir,requestRoadsterManeuver} from './roadster-controls.js';
import {cycleRoadsterAero,roadsterAeroMode,roadsterAeroBrakeState,ROADSTER_AERO_LABELS} from './roadster-aero.js';
export const ROADSTER_BUTTONS=Object.freeze([
 ['forward','前进','W'],['back','后退','S'],['yawLeft','左转','A'],['yawRight','右转','D'],['left','左移','Q'],['right','右移','E'],
 ['up','上升','Shift'],['down','下降','B'],['airBrake','悬停刹停','Space'],
 ['pitchUp','抬头','↓'],['pitchDown','低头','↑'],['rollLeft','左滚','←'],['rollRight','右滚','→'],['stabilize','车身回正','X'],['boost','推进','Shift']
].map(Object.freeze));
export const FLIGHT_CONTROL_GROUPS=Object.freeze({
 motion:Object.freeze(['forward','back','yawLeft','yawRight']),
 lift:Object.freeze(['left','right','up','down','airBrake']),
 attitude:Object.freeze(['pitchUp','pitchDown','rollLeft','rollRight','stabilize'])
});
const CONTROL_SYMBOLS={forward:'↑',back:'↓',yawLeft:'↶',yawRight:'↷',left:'←',right:'→',up:'＋',down:'−',airBrake:'Ⅱ',pitchUp:'↗',pitchDown:'↘',rollLeft:'↶',rollRight:'↷',stabilize:'◎',boost:'↟'};
export function renderRoadsterConsole(){
 const button=id=>{const[,label,hint]=ROADSTER_BUTTONS.find(c=>c[0]===id);return `<button class="flight-command" type="button" data-roadster-control="${id}" aria-label="按住${label}"><span class="flight-command-symbol" aria-hidden="true">${CONTROL_SYMBOLS[id]}</span><span>${label}</span><kbd>${hint}</kbd></button>`;};
 return `<button id="roadster-details-toggle" class="flight-launcher" type="button" aria-expanded="false" aria-controls="flight-console-options"><span class="flight-status-dot" aria-hidden="true"></span><span id="flight-launcher-label">车辆选项</span><span aria-hidden="true">›</span></button>
 <section class="flight-console" aria-label="飞行控制面板" hidden>
  <header class="flight-panel-header"><div class="flight-panel-handle" data-flight-drag="console" aria-label="拖动飞行控制面板"><span class="flight-grip" aria-hidden="true">⠿</span><div><strong>飞行控制</strong><small id="roadster-telemetry"></small></div></div><button id="roadster-attitude-toggle" type="button" aria-expanded="false" aria-controls="flight-attitude">姿态</button><button id="flight-console-fold" type="button" aria-label="收起飞行动作" aria-expanded="true" aria-controls="flight-command-deck">收起</button></header>
  <div id="flight-console-options" class="flight-console-options" hidden><div class="flight-options-heading"><strong id="roadster-trim"></strong><button id="flight-options-close" type="button" aria-label="收起车辆选项">完成</button></div><p id="roadster-warning" role="status"></p><div class="flight-option-actions"><button id="roadster-air-toggle" type="button">空中模式 · T</button><button id="roadster-wing-toggle" type="button">公路模式 · Y</button><span class="flight-ground-actions">${button('boost')}${button('stabilize')}</span></div><div class="flight-maneuvers"><button id="roadster-vault" type="button" title="检查前方 20 米内的游戏碰撞体及落地区域">智能越障</button><button id="roadster-spin" type="button" title="检查可供车身完整翻滚的空间">一键转圈</button><button id="roadster-cancel" type="button">取消动作</button><span id="roadster-maneuver-status" role="status" aria-live="polite"></span></div><small class="flight-disclaimer">游戏设定 · 不代表真实车辆性能</small></div>
  <div id="flight-command-deck" class="flight-command-deck"><div class="flight-motion-row" role="group" aria-label="前进后退与转向">${FLIGHT_CONTROL_GROUPS.motion.map(button).join('')}</div><div class="flight-lift-row" role="group" aria-label="横向移动、高度与悬停">${FLIGHT_CONTROL_GROUPS.lift.map(button).join('')}</div></div>
 </section>
 <section id="flight-attitude" class="flight-attitude" aria-label="飞行姿态控制面板" hidden><header class="flight-panel-header"><div class="flight-panel-handle" data-flight-drag="attitude" aria-label="拖动姿态控制面板"><span class="flight-grip" aria-hidden="true">⠿</span><strong>姿态控制</strong></div><button id="flight-attitude-close" type="button" aria-label="收起姿态控制">收起</button></header><div class="flight-attitude-row" role="group" aria-label="俯仰、横滚与回正">${FLIGHT_CONTROL_GROUPS.attitude.map(button).join('')}</div></section>`;
}
export function installRoadsterUI(game){
 const root=document.createElement('section');root.id='roadster-controls';root.hidden=true;root.setAttribute('aria-label','Roadster 车辆与飞行控制');
 root.innerHTML=renderRoadsterConsole();document.body.append(root);
 const consolePanel=root.querySelector('.flight-console'),attitudePanel=root.querySelector('.flight-attitude');
 const consoleDrag=installPanelDrag(consolePanel,{handle:root.querySelector('[data-flight-drag="console"]')});
 const attitudeDrag=installPanelDrag(attitudePanel,{handle:root.querySelector('[data-flight-drag="attitude"]')});
 let folded=false;
 game.roadsterTouch={};const releases=[];
 const blocked=()=>game.paused||!game.inCar||game.transition||!roadsterTrim(game.vehicle)||game.ui.isPhoneOpen()||document.body.classList.contains('mobile-drawer-open');
 // Track pointers per action across duplicate stabilization buttons too.
 const actionPointers=new Map();
 for(const element of root.querySelectorAll('[data-roadster-control]')){
  installControlSelectionGuard(element,{continuous:true});const key=element.dataset.roadsterControl,ids=actionPointers.get(key)??new Set();actionPointers.set(key,ids);
  const release=event=>{ids.delete(event.pointerId);game.roadsterTouch[key]=ids.size>0;element.classList.toggle('is-pressed',ids.size>0);};
  element.addEventListener('pointerdown',event=>{event.preventDefault();if(blocked()||!game.physics?.ready)return;ids.add(event.pointerId);element.setPointerCapture(event.pointerId);game.roadsterTouch[key]=true;element.classList.add('is-pressed');game.manualTakeover?.();});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(type,release);
  releases.push(()=>{for(const id of ids)if(element.hasPointerCapture?.(id))element.releasePointerCapture(id);ids.clear();game.roadsterTouch[key]=false;element.classList.remove('is-pressed');});
 }
 game.clearRoadsterPointers=()=>releases.forEach(release=>release());
 const $=id=>document.getElementById(id),notify=result=>game.ui.toast(result.reason,result.ok?'':'error');
 const setDetails=open=>{if(open){attitudePanel.hidden=true;$('roadster-attitude-toggle').setAttribute('aria-expanded','false');}root.classList.toggle('roadster-details-open',open);$('roadster-details-toggle').setAttribute('aria-expanded',String(open));$('roadster-details-toggle').setAttribute('aria-label',open?'收起车辆选项':'展开车辆选项');game.clearRoadsterPointers();update();consoleDrag.reflow();};
 $('roadster-details-toggle').onclick=()=>{if(!blocked())setDetails(!root.classList.contains('roadster-details-open'));};
 $('flight-options-close').onclick=()=>setDetails(false);
 $('flight-console-fold').onclick=()=>{folded=!folded;if(!folded&&window.innerHeight<400&&window.innerWidth<=740){attitudePanel.hidden=true;$('roadster-attitude-toggle').setAttribute('aria-expanded','false');}game.clearRoadsterPointers();update();consoleDrag.reflow();};
 const setAttitude=open=>{if(open){root.classList.remove('roadster-details-open');if(window.innerHeight<400&&window.innerWidth<=740)folded=true;}attitudePanel.hidden=!open;$('roadster-attitude-toggle').setAttribute('aria-expanded',String(open));game.clearRoadsterPointers();update();if(open)attitudeDrag.reflow();};
 $('flight-attitude-close').onclick=()=>setAttitude(false);
 // Panel keyboard activation must not also actuate gameplay. Releases still clear held game keys.
 root.addEventListener('keydown',event=>{if(['Space','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.code))event.stopPropagation();});
 for(const action of ['vault','spin','cancel'])$('roadster-'+action).onclick=()=>{if(!blocked())notify(requestRoadsterManeuver(game,action));};
 $('roadster-air-toggle').onclick=()=>{if(!blocked())notify(toggleRoadsterAir(game));};
 $('roadster-wing-toggle').onclick=()=>{if(!blocked())cycleRoadsterAero(game.vehicle);};
 $('roadster-attitude-toggle').onclick=()=>{if(!blocked())setAttitude(attitudePanel.hidden);};
 window.addEventListener('keydown',event=>{if(event.repeat||blocked()||event.target?.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(event.target?.tagName))return;if(event.code==='KeyT'){event.preventDefault();notify(toggleRoadsterAir(game));}else if(event.code==='KeyY'){event.preventDefault();cycleRoadsterAero(game.vehicle);}else if((['ShiftLeft','ShiftRight'].includes(event.code)&&roadsterTrim(game.vehicle)!=='performance')||(event.code==='KeyX'&&roadsterTrim(game.vehicle)==='rocket'))game.manualTakeover?.();});
 let previousVehicle=null,lastManeuverNotice='';
 const update=()=>{
  const v=game.vehicle,trim=roadsterTrim(v),visible=!!trim&&game.inCar&&!game.aircraft?.active&&!game.flight?.active,air=visible&&roadsterFlightLocked(v);
  if(previousVehicle!==v||blocked()){game.clearRoadsterPointers();if(previousVehicle!==v){consoleDrag.reset();attitudeDrag.reset();folded=false;lastManeuverNotice='';root.classList.remove('roadster-details-open');$('roadster-details-toggle').setAttribute('aria-expanded','false');$('roadster-details-toggle').setAttribute('aria-label','展开车辆状态');attitudePanel.hidden=true;$('roadster-attitude-toggle').setAttribute('aria-expanded','false');}previousVehicle=v;}
  root.hidden=!visible;root.inert=blocked();document.body.classList.toggle('roadster-controls-active',visible&&!blocked());root.classList.toggle('roadster-overlay',blocked());root.classList.toggle('roadster-in-air',air);document.body.classList.toggle('roadster-air-active',air);
  const detailsOpen=root.classList.contains('roadster-details-open');
  consolePanel.hidden=!visible||(!air&&!detailsOpen);$('flight-console-options').hidden=!detailsOpen;
  $('flight-command-deck').hidden=!air||folded;$('flight-console-fold').hidden=!air;$('flight-console-fold').textContent=folded?'展开':'收起';$('flight-console-fold').setAttribute('aria-expanded',String(!folded));$('flight-console-fold').setAttribute('aria-label',folded?'展开飞行动作':'收起飞行动作');
  $('roadster-details-toggle').setAttribute('aria-expanded',String(detailsOpen));
  if(!air){attitudePanel.hidden=true;$('roadster-attitude-toggle').setAttribute('aria-expanded','false');}
  if(!visible)return;const s=v.roadsterState??{},ready=!!game.physics?.ready&&!game.physics.failed,aeroBraking=ready&&roadsterAeroBrakeState(v).active;
  root.classList.toggle('roadster-warning-active',!ready||!!s.warning||s.maneuver?.status==='rejected');
  $('flight-launcher-label').textContent=!ready||s.warning||s.maneuver?.status==='rejected'?'飞行状态 · 警告':s.maneuver?.status==='active'?'特技进行中':air?'飞行选项':aeroBraking?'气动制动 · 工作中':'车辆选项';
  $('roadster-trim').textContent='ROADSTER · '+trim.toUpperCase();
  const mode={air:'空中',landing:'缓降',recover:'回正',unpowered:'失去动力',road:'地面'}[s.mode]??'地面';
  $('roadster-telemetry').textContent=mode+(game.inCar&&game.cameraMode===1?'':' · '+Math.round(v.speed*3.6)+' km/h')+(air?' · 离地 '+(s.altitude??0).toFixed(1)+' m':'');
  $('roadster-warning').textContent=!ready?'Godot 未就绪：空中功能不可用':s.warning||(aeroBraking?'气动制动中 · 尾翼自动抬起增阻，松开刹车后恢复':trim==='rocket'?'T 起飞 / 缓降 · X 按住回正 · 地面刹车自动联动尾翼':trim==='thrust'?'按住 Shift + 油门推进 · 地面刹车自动联动尾翼':'地面刹车自动联动尾翼 · 气动制动随速度增强');
  $('roadster-air-toggle').hidden=trim!=='rocket';$('roadster-air-toggle').disabled=!ready;$('roadster-air-toggle').setAttribute('aria-pressed',String(v.roadsterRequest?.air===true));$('roadster-air-toggle').textContent=air?'缓降着陆 · T':'空中模式 · T';
  root.querySelector('.flight-maneuvers').hidden=trim!=='rocket';
  const maneuver=s.maneuver??{},notice=[maneuver.serial,maneuver.status,maneuver.reason].join(':');if(!blocked()&&['rejected','cancelled','complete'].includes(maneuver.status)&&notice!==lastManeuverNotice){lastManeuverNotice=notice;game.ui.toast(maneuver.reason,maneuver.status==='rejected'?'error':'');}
  const busy=v.roadsterRequest?.pending||maneuver.status==='active';for(const action of ['vault','spin'])$('roadster-'+action).disabled=!ready||busy;$('roadster-cancel').disabled=!ready||!busy;
  $('roadster-maneuver-status').dataset.code=maneuver.code??'';
  $('roadster-maneuver-status').textContent=maneuver.reason||(v.roadsterRequest?.pending?'正在检查空间…':'可行驶中启动 · 自动刹稳 · 新输入接管');
  const aero=roadsterAeroMode(v);$('roadster-wing-toggle').textContent=aeroBraking?'气动制动 · 自动':ROADSTER_AERO_LABELS[aero]+' · Y';$('roadster-wing-toggle').title='Y 切换公路 / 高下压力 / 低风阻；地面行车制动自动抬翼增阻，松开后恢复所选模式。运动与阻力为游戏近似，非量产参数';$('roadster-wing-toggle').dataset.aeroMode=aero;
  $('roadster-attitude-toggle').hidden=!air;
  for(const element of root.querySelectorAll('[data-roadster-control]')){element.disabled=!ready;element.hidden=element.dataset.roadsterControl==='boost'?trim==='performance':element.dataset.roadsterControl==='stabilize'?trim!=='rocket':false;}
 };
 game.roadsterUI={root,update,consoleDrag,attitudeDrag};update();return game.roadsterUI;
}
