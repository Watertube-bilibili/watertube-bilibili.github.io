import {installPanelLayout} from './panel-layout.js';
import {installControlSelectionGuard} from './touch-selection.js';
import {roadsterTrim,roadsterFlightLocked,toggleRoadsterAir,cycleRoadsterWing,requestRoadsterManeuver} from './roadster-controls.js';
import {cycleRoadsterAero,roadsterAeroMode,ROADSTER_AERO_LABELS} from './roadster-aero.js';
export const ROADSTER_BUTTONS=Object.freeze([
 ['forward','前进','W'],['back','后退','S'],['yawLeft','左转','A'],['yawRight','右转','D'],['left','左移','Q'],['right','右移','E'],
 ['up','上升','Shift'],['down','下降','B'],['airBrake','悬停刹停','Space'],
 ['pitchUp','抬头','↓'],['pitchDown','低头','↑'],['rollLeft','左滚','←'],['rollRight','右滚','→'],['stabilize','车身回正','X'],['boost','推进','Shift']
].map(Object.freeze));
export function installRoadsterUI(game){
 const root=document.createElement('section');root.id='roadster-controls';root.hidden=true;root.setAttribute('aria-label','Roadster 配置控制');
 const button=id=>{const[,label,hint]=ROADSTER_BUTTONS.find(c=>c[0]===id);return `<button type="button" data-roadster-control="${id}" aria-label="按住${label}">${label}<kbd>${hint}</kbd></button>`;};
 root.innerHTML=`<div class="roadster-status"><strong id="roadster-trim"></strong><span id="roadster-telemetry"></span><span id="roadster-warning" role="status"></span><small>游戏设定 · 不代表真实车辆性能</small><div class="roadster-utility"><button id="roadster-details-toggle" type="button" aria-expanded="false" aria-label="展开车辆控制">车辆</button><button id="roadster-air-toggle" type="button">空中模式 · T</button><button id="roadster-wing-toggle" type="button">公路模式 · Y</button><button id="roadster-attitude-toggle" type="button" aria-expanded="false">姿态控制</button><span class="roadster-ground">${button('boost')}${button('stabilize')}</span></div><div class="roadster-maneuvers"><button id="roadster-vault" type="button" title="检查前方 20 米内的游戏碰撞体及落地区域">智能越障</button><button id="roadster-spin" type="button" title="检查可供车身完整翻滚的空间">一键转圈</button><button id="roadster-cancel" type="button">取消动作</button><span id="roadster-maneuver-status" role="status" aria-live="polite"></span></div></div><div class="roadster-flight-left">${['forward','back','yawLeft','yawRight','left','right'].map(button).join('')}</div><div class="roadster-flight-right">${['up','down','airBrake'].map(button).join('')}</div><div class="roadster-attitude" hidden>${['pitchUp','pitchDown','rollLeft','rollRight','stabilize'].map(button).join('')}</div>`;
 document.body.append(root);
 const status=root.querySelector(".roadster-status");
 const statusHandle=document.createElement("div");statusHandle.className="vehicle-panel-dragbar";statusHandle.textContent="⠿ 车辆控制";status.prepend(statusHandle);
 installPanelLayout(status,{id:"roadster-status",handle:statusHandle,minWidth:180,minHeight:120,enabled:()=>root.classList.contains("roadster-details-open")});
 game.roadsterTouch={};const releases=[];
 const blocked=()=>game.paused||!game.inCar||game.transition||!roadsterTrim(game.vehicle)||game.ui.isPhoneOpen()||document.body.classList.contains('mobile-drawer-open');
 // Track pointers per action across duplicate stabilization buttons too.
 const actionPointers=new Map();
 for(const element of root.querySelectorAll('[data-roadster-control]')){
  installControlSelectionGuard(element,{continuous:true});const key=element.dataset.roadsterControl,ids=actionPointers.get(key)??new Set();actionPointers.set(key,ids);
  const release=event=>{ids.delete(event.pointerId);game.roadsterTouch[key]=ids.size>0;element.classList.toggle('is-pressed',ids.size>0);};
  element.addEventListener('pointerdown',event=>{event.preventDefault();if(blocked()||!game.physics?.ready)return;ids.add(event.pointerId);element.setPointerCapture(event.pointerId);game.roadsterTouch[key]=true;element.classList.add('is-pressed');game.manualTakeover?.();});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(type,release);
  releases.push(()=>{ids.clear();game.roadsterTouch[key]=false;element.classList.remove('is-pressed');});
 }
 game.clearRoadsterPointers=()=>releases.forEach(release=>release());
 const $=id=>document.getElementById(id),notify=result=>game.ui.toast(result.reason,result.ok?'':'error');
 $('roadster-details-toggle').onclick=()=>{if(blocked())return;const open=!root.classList.contains('roadster-details-open');root.classList.toggle('roadster-details-open',open);$('roadster-details-toggle').setAttribute('aria-expanded',String(open));$('roadster-details-toggle').setAttribute('aria-label',open?'收起车辆状态':'展开车辆状态');};
 for(const action of ['vault','spin','cancel'])$('roadster-'+action).onclick=()=>{if(!blocked())notify(requestRoadsterManeuver(game,action));};
 $('roadster-air-toggle').onclick=()=>{if(!blocked())notify(toggleRoadsterAir(game));};
 $('roadster-wing-toggle').onclick=()=>{if(!blocked())cycleRoadsterAero(game.vehicle);};
 $('roadster-attitude-toggle').onclick=()=>{if(blocked())return;const panel=root.querySelector('.roadster-attitude');panel.hidden=!panel.hidden;$('roadster-attitude-toggle').setAttribute('aria-expanded',String(!panel.hidden));game.clearRoadsterPointers();};
 window.addEventListener('keydown',event=>{if(event.repeat||blocked()||event.target?.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(event.target?.tagName))return;if(event.code==='KeyT'){event.preventDefault();notify(toggleRoadsterAir(game));}else if(event.code==='KeyY'){event.preventDefault();cycleRoadsterAero(game.vehicle);}else if((['ShiftLeft','ShiftRight'].includes(event.code)&&roadsterTrim(game.vehicle)!=='performance')||(event.code==='KeyX'&&roadsterTrim(game.vehicle)==='rocket'))game.manualTakeover?.();});
 let previousVehicle=null,lastManeuverNotice='';
 const update=()=>{
  const v=game.vehicle,trim=roadsterTrim(v),visible=!!trim&&game.inCar&&!game.aircraft?.active&&!game.flight?.active,air=visible&&roadsterFlightLocked(v);
  if(previousVehicle!==v||blocked()){game.clearRoadsterPointers();if(previousVehicle!==v){lastManeuverNotice='';root.classList.remove('roadster-details-open');$('roadster-details-toggle').setAttribute('aria-expanded','false');$('roadster-details-toggle').setAttribute('aria-label','展开车辆状态');root.querySelector('.roadster-attitude').hidden=true;$('roadster-attitude-toggle').setAttribute('aria-expanded','false');}previousVehicle=v;}
  root.hidden=!visible;root.inert=blocked();document.body.classList.toggle('roadster-controls-active',visible&&!blocked());root.classList.toggle('roadster-overlay',blocked());root.classList.toggle('roadster-in-air',air);document.body.classList.toggle('roadster-air-active',air);
  if(!visible)return;const s=v.roadsterState??{},ready=!!game.physics?.ready&&!game.physics.failed;
  root.classList.toggle('roadster-warning-active',!ready||!!s.warning||s.maneuver?.status==='rejected');
  $('roadster-details-toggle').textContent=!ready||s.warning||s.maneuver?.status==='rejected'?'警告':s.maneuver?.status==='active'?'特技':'车辆';
  $('roadster-trim').textContent='ROADSTER · '+trim.toUpperCase();
  const mode={air:'空中',landing:'缓降',recover:'回正',unpowered:'失去动力',road:'地面'}[s.mode]??'地面';
  $('roadster-telemetry').textContent=mode+(game.inCar&&game.cameraMode===1?'':' · '+Math.round(v.speed*3.6)+' km/h')+(air?' · 离地 '+(s.altitude??0).toFixed(1)+' m':'');
  $('roadster-warning').textContent=!ready?'Godot 未就绪：空中功能不可用':s.warning||(trim==='rocket'?'T 起飞 / 缓降 · X 按住回正':trim==='thrust'?'按住 Shift + 油门推进':'主动尾翼 · 地面下压力');
  $('roadster-air-toggle').hidden=trim!=='rocket';$('roadster-air-toggle').disabled=!ready;$('roadster-air-toggle').setAttribute('aria-pressed',String(v.roadsterRequest?.air===true));$('roadster-air-toggle').textContent=air?'缓降着陆 · T':'空中模式 · T';
  root.querySelector('.roadster-maneuvers').hidden=trim!=='rocket';
  const maneuver=s.maneuver??{},notice=[maneuver.serial,maneuver.status,maneuver.reason].join(':');if(!blocked()&&['rejected','cancelled','complete'].includes(maneuver.status)&&notice!==lastManeuverNotice){lastManeuverNotice=notice;game.ui.toast(maneuver.reason,maneuver.status==='rejected'?'error':'');}
  const busy=v.roadsterRequest?.pending||maneuver.status==='active';for(const action of ['vault','spin'])$('roadster-'+action).disabled=!ready||busy;$('roadster-cancel').disabled=!ready||!busy;
  $('roadster-maneuver-status').dataset.code=maneuver.code??'';
  $('roadster-maneuver-status').textContent=maneuver.reason||(v.roadsterRequest?.pending?'正在检查空间…':'可行驶中启动 · 自动刹稳 · 新输入接管');
  const aero=roadsterAeroMode(v);$('roadster-wing-toggle').textContent=ROADSTER_AERO_LABELS[aero]+' · Y';$('roadster-wing-toggle').title='切换公路 / 高下压力 / 低风阻；外观运动为参考视频重建，尺寸未经测量';$('roadster-wing-toggle').dataset.aeroMode=aero;
  $('roadster-attitude-toggle').hidden=!air;
  for(const element of root.querySelectorAll('[data-roadster-control]')){element.disabled=!ready;element.hidden=element.dataset.roadsterControl==='boost'?trim==='performance':element.dataset.roadsterControl==='stabilize'?trim!=='rocket':false;}
 };
 game.roadsterUI={root,update};update();return game.roadsterUI;
}
