import {installControlSelectionGuard} from './touch-selection.js';
import {AIRCRAFT_CONTROLS} from './flyable-aircraft.js';

export function installAircraftUI(game){
 const root=document.createElement('section');root.id='aircraft-controls';root.hidden=true;root.setAttribute('aria-label','飞机驾驶控制');
 const button=id=>{const control=AIRCRAFT_CONTROLS.find(c=>c.id===id);return `<button type="button" data-aircraft-control="${id}" aria-label="${control.label}"><span>${control.label}</span><kbd>${control.hint}</kbd></button>`;};
 root.innerHTML=`<div class="aircraft-readout"><strong>SUNRISE AERO · SC-11</strong><span id="aircraft-telemetry"></span><span id="aircraft-condition"></span><span id="aircraft-warning" role="status"></span></div><div class="aircraft-utility"><button id="aircraft-flaps" type="button">襟翼 0%</button><button id="aircraft-return" type="button">回到跑道</button><button id="aircraft-exit" type="button">下机</button></div><div class="aircraft-left"><div class="aircraft-pitch">${button('pitchUp')}${button('pitchDown')}</div><div class="aircraft-roll">${button('rollLeft')}${button('rollRight')}</div><div class="aircraft-yaw">${button('yawLeft')}${button('yawRight')}</div></div><div class="aircraft-right">${button('throttleUp')}${button('throttleDown')}${button('brake')}</div><div class="aircraft-help">收轮刹 → 加油门 → 约 140 km/h 轻抬头。降落前收油门、放襟翼。<br>W/S 俯仰 · A/D 滚转 · Q/E 方向舵 · Shift/Ctrl 油门 · 空格轮刹 · Enter 下机</div>`;
 document.body.append(root);game.aircraftTouch={};const releases=[];
 for(const element of root.querySelectorAll('[data-aircraft-control]')){
  installControlSelectionGuard(element,{continuous:true});const ids=new Set(),key=element.dataset.aircraftControl;
  const release=event=>{ids.delete(event.pointerId);game.aircraftTouch[key]=ids.size>0;element.classList.toggle('is-pressed',ids.size>0);};
  element.addEventListener('pointerdown',event=>{event.preventDefault();if(!game.aircraft?.active||game.paused||game.ui.isPhoneOpen())return;ids.add(event.pointerId);element.setPointerCapture(event.pointerId);game.aircraftTouch[key]=true;element.classList.add('is-pressed');});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(event,release);
  releases.push(()=>{ids.clear();game.aircraftTouch[key]=false;element.classList.remove('is-pressed');});
 }
 game.clearAircraftPointers=()=>releases.forEach(release=>release());
 const run=fn=>{const result=fn();if(!result.ok||result.reason)game.ui.toast(result.reason,result.ok?'':'error');game.save(false);};
 document.getElementById('aircraft-exit').onclick=()=>run(()=>game.aircraft.exit());
 document.getElementById('aircraft-return').onclick=()=>run(()=>game.aircraft.resetAtRunway({explicit:true}));
 document.getElementById('aircraft-flaps').onclick=()=>{const service=game.aircraft;service.setControls({...service.controls,flaps:service.controls.flaps>.5?0:1});};
 const update=()=>{
  const active=!!game.aircraft?.active,status=game.aircraft?.status;root.hidden=!active;document.body.classList.toggle('aircraft-active',active);
  if(!active)return;const visible=!game.paused&&!game.ui.isPhoneOpen();root.classList.toggle('aircraft-overlay',!visible);root.inert=!visible;
  document.getElementById('aircraft-telemetry').textContent=Math.round(status.speed*3.6)+' km/h · 离地 '+Math.round(status.altitude)+' m · 油门 '+Math.round(status.throttle*100)+'%';
  document.getElementById('aircraft-condition').textContent='机况 '+Math.round(status.condition)+'% · 电量 '+Math.round(status.battery)+'%';
  document.getElementById('aircraft-warning').textContent=status.condition<=0?'动力损坏：着陆维修或回到跑道':status.stalled?'失速：减小抬头角度，增加空速':status.detail??'';
  document.getElementById('aircraft-flaps').textContent='襟翼 '+Math.round(status.flaps*100)+'%';
  document.getElementById('aircraft-exit').disabled=!status.canExit;
 };
 game.aircraftUI={update};update();return game.aircraftUI;
}
