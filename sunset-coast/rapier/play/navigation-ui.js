import {navigationGuidance,navigationArrow,formatNavigationDistance} from './navigation-guidance.js';
import {drawWorldMap} from './map-ui.js';

const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function renderNavigationPhone(ui,places,icon){
 const g=ui.g,nav=navigationGuidance(g),ride=g.robotaxi?.active;
 const destination=nav.destination?.name??'目的地';
 $('phone-content').innerHTML=`<section class="navigation-app">
  <div class="navigation-app-heading"><span class="navigation-kicker">COAST MAPS</span><h3>${ride?'Robo Taxi 接送路线':nav.active?'这一程，去 '+esc(destination):'下一站，去哪里？'}</h3><p class="phone-subtitle">${ride?'接送路线实时同步 · 个人导航已保留':nav.active?esc(nav.mode):'沿着海岸，发现城市里的下一处风景。'}</p></div>
  ${nav.active?`<div class="navigation-summary" style="--nav-color:#a43c28"><span class="navigation-turn-icon" id="phone-nav-icon">${navigationArrow(nav.maneuver)}</span><div><strong id="phone-nav-distance">${esc(nav.turnText)}</strong><span id="phone-nav-instruction">${esc(nav.instruction)}</span></div><div class="navigation-total"><small>剩余路程</small><b id="phone-nav-remaining">${nav.remainingText}</b></div></div>`:''}
  <button class="navigation-map-preview" id="phone-full-map" aria-label="展开完整地图"><canvas id="phone-route-map" width="700" height="520" aria-hidden="true"></canvas><span>展开地图 <b>↗</b></span></button>
  ${ride?'<p class="phone-note">目的地：'+esc(g.robotaxi.destination?.name??destination)+'。更换接送目的地，请先取消本次接送。</p><button class="phone-action" id="phone-ride-details">查看接送 / 取消</button>':nav.active?`<div class="navigation-actions"><button class="phone-action" id="phone-pilot">${g.autopilot?'关闭辅助驾驶':'启动 VOLT Pilot'}</button><button class="secondary-action" id="phone-clear-nav">结束导航</button></div>`:''}
  ${!ride?`<details class="navigation-places" ${nav.active?'':'open'}><summary>${nav.active?'更换目的地':'探索目的地'}<span>${places.length} 个地点</span></summary><div class="navigation-place-grid">${places.map(p=>`<button class="navigation-place ${g.destination?.name===p.name?'selected':''}" data-place="${esc(p.id)}" ${g.job?'disabled':''}><span class="navigation-place-icon">${icon(p.icon)}</span><strong>${esc(p.name)}</strong><small>距你 ${formatNavigationDistance(Math.hypot(p.x-g.position.x,p.z-g.position.z))}</small></button>`).join('')}</div></details>`:''}
  ${g.job&&!ride?'<p class="phone-note">职业任务使用指定路线，完成或取消工作后可更换目的地。</p>':''}
  <p class="navigation-footnote">${ride?'接车路线与乘坐路线会自动切换。':'沿高亮路线行驶，偏离后会重新规划。辅助驾驶仍需保持关注。'}</p>
 </section>`;
 $('phone-full-map').onclick=()=>ui.openMap();
 drawWorldMap(ui,$('phone-route-map'),false);
 if(ride){$('phone-ride-details').onclick=()=>ui.renderPhone('rides');return;}
 for(const button of $('phone-content').querySelectorAll('[data-place]'))button.onclick=()=>{if(g.job){ui.toast('当前职业使用导航，请先取消工作');return;}g.setDestination(places.find(p=>p.id===button.dataset.place));ui.renderPhone('nav');};
 if(nav.active){
  $('phone-pilot').onclick=()=>{g.toggleAutopilot();ui.closePhone();};
  $('phone-clear-nav').disabled=!!g.job;
  $('phone-clear-nav').onclick=()=>{if(g.job){ui.toast('当前职业使用导航，请先取消工作');return;}if(g.clearDestination()===false)return;g.autopilot=false;ui.updateAll();ui.renderPhone('nav');};
 }
}

export function updateNavigationHUD(game){
 const button=$('mobile-route');if(!button)return;
 const nav=game.flight?.active||game.aircraft?.active?{active:false}:navigationGuidance(game);
 button.hidden=!nav.active||!!game.flight?.active||!!game.aircraft?.active;
 document.body.classList.toggle('navigation-active',!button.hidden);
 if(!nav.active)return;
 const put=(id,text)=>{const node=$(id);if(node&&node.textContent!==text)node.textContent=text;};
 if(game.ui?.phonePage==='nav'&&game.ui.isPhoneOpen?.()){
  put('phone-nav-distance',nav.turnText);put('phone-nav-instruction',nav.instruction);put('phone-nav-remaining',nav.remainingText);
  const phoneArrow=$('phone-nav-icon');if(phoneArrow&&phoneArrow.dataset.maneuver!==nav.maneuver){phoneArrow.innerHTML=navigationArrow(nav.maneuver);phoneArrow.dataset.maneuver=nav.maneuver;}
  drawWorldMap(game.ui,$('phone-route-map'),false);
 }
 put('mobile-route-title',nav.instruction);put('mobile-route-detail',nav.detail);put('mobile-route-distance',nav.turnText);
 button.style.setProperty('--nav-color','#f08a68');
 const arrow=$('mobile-route-icon');if(arrow.dataset.maneuver!==nav.maneuver){arrow.innerHTML=navigationArrow(nav.maneuver);arrow.dataset.maneuver=nav.maneuver;}
 button.setAttribute('aria-label',`${nav.mode}，${nav.turnText}，${nav.instruction}，${nav.detail}。打开导航详情`);
 // Announce a new maneuver once, not continuously changing metre counts.
 const announcement=$('navigation-announcement'),key=`${nav.view.kind}:${nav.destination.name}:${nav.maneuver}:${nav.instruction}`;
 if(announcement&&announcement.dataset.key!==key){announcement.textContent=`${nav.instruction}，${nav.turnText}`;announcement.dataset.key=key;}
}
