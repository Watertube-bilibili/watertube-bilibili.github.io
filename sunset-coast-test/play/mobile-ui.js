/** Touch-first driving layout. Original control elements and handlers remain authoritative. */
import './game.js';
import {TOUCH_GEARS} from './touch-transmission.js';
import {syncMobileLockStatus} from './mobile-lock-status.js';

// Camera mode 1 is the actual interior view. cockpit-open is a separate car-computer panel.
export function syncCockpitSpeedHUD(game) {
  const interior = !!game.inCar && game.cameraMode === 1 && !game.aircraft?.active && !game.flight?.active;
  document.body.classList.toggle('interior-driving-view', interior);
  // Fail open: camera mode alone cannot prove instrument readability.
  // A renderer may supply this per-view check after device/occlusion validation.
  document.body.classList.toggle('cockpit-speed-readable', interior && game.isCockpitSpeedReadable?.() === true);
}

const game = window.game;
const $ = id => document.getElementById(id);
const mobile = matchMedia('(max-width: 768px), (max-width: 1024px) and (orientation: landscape) and (max-height: 500px)');
const touchLayout = () => game?.effectiveInputMode === 'touch' && !game.aircraft?.active && !game.isRoadsterFlying?.();
const compactLayout = () => mobile.matches || touchLayout();
const icon = path => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const icons = {
  phone: icon('<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4"/>'),
  view: icon('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'),
  close: icon('<path d="m6 6 12 12M6 18 18 6"/>'),
  map: icon('<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5ZM9 3v16m6-14v16"/>'),
  settings: icon('<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2" fill="currentColor"/><circle cx="16" cy="12" r="2" fill="currentColor"/><circle cx="10" cy="18" r="2" fill="currentColor"/>'),
};

if (game?.ui) {
  const lockStatus = document.createElement('div');
  lockStatus.id = 'mobile-lock-status'; lockStatus.hidden = true;
  lockStatus.setAttribute('role', 'status'); lockStatus.setAttribute('aria-live', 'polite'); lockStatus.setAttribute('aria-atomic', 'true');
  document.querySelector('.drive-hud')?.append(lockStatus);
  const root = document.createElement('div');
  root.id = 'mobile-ui';
  root.innerHTML = `
    <div id="mobile-pedal-signals" role="group" aria-label="转向灯快捷操作" hidden>
      <button id="mobile-pedal-signal-left" type="button" aria-label="切换左转向灯" aria-pressed="false">${icon('<path d="m10 5-7 7 7 7M3 12h18"/>')}<span>左灯</span></button>
      <button id="mobile-pedal-signal-right" type="button" aria-label="切换右转向灯" aria-pressed="false">${icon('<path d="m14 5 7 7-7 7M3 12h18"/>')}<span>右灯</span></button>
    </div>
    <div id="mobile-gears" role="group" aria-label="行驶挡位" hidden>
      <button id="mobile-gear-p" type="button" aria-label="P 驻车挡" aria-pressed="false">P</button>
      <button id="mobile-gear-r" type="button" aria-label="R 倒车挡" aria-pressed="false">R</button>
      <button id="mobile-gear-n" type="button" aria-label="N 空挡" aria-pressed="false">N</button>
      <button id="mobile-gear-d" type="button" aria-label="D 前进挡" aria-pressed="true">D</button>
    </div>
    <button id="mobile-tools-toggle" type="button" aria-label="展开左侧操作" aria-expanded="false" aria-controls="mobile-driving-tools">${icons.settings}<span>操作</span></button>
    <section id="mobile-driving-tools" aria-label="左侧操作" hidden>
      <header><span>驾驶操作</span><button id="mobile-tools-pin" type="button" aria-label="固定操作面板" aria-pressed="false">固定</button><button id="mobile-tools-close" type="button" aria-label="收起左侧操作">${icons.close}</button></header>
      <div id="mobile-secondary-driving" role="group" aria-label="其他驾驶操作"></div>
      <button id="mobile-pilot" type="button" aria-pressed="false"><span>辅助驾驶</span><small id="mobile-pilot-state">待命</small></button>
      <button id="mobile-surround-camera" type="button" aria-pressed="false" hidden>360 · 场景环视</button>
      <button id="mobile-vehicle-tools" type="button" hidden>车辆操作</button>
      <div id="mobile-signals" role="group" aria-label="车辆灯光">
        <button id="mobile-signal-left" type="button" aria-label="切换左转向灯" aria-pressed="false">${icon('<path d="m10 5-7 7 7 7M3 12h18"/>')}左灯</button>
        <button id="mobile-hazards" type="button" aria-label="切换危险警告灯" aria-pressed="false">${icon('<path d="m12 3 10 18H2L12 3ZM12 9v5m0 3h.01"/>')}双闪</button>
        <button id="mobile-signal-right" type="button" aria-label="切换右转向灯" aria-pressed="false">${icon('<path d="m14 5 7 7-7 7M3 12h18"/>')}右灯</button>
      </div>
      <div id="mobile-tools-shortcuts"></div>
    </section>
    <nav class="mobile-quick-actions" id="mobile-quick-actions" aria-label="常用操作">
      <button id="mobile-view" type="button" aria-label="切换驾驶视角" title="切换视角">${icons.view}<span>视角</span></button>
      <button id="mobile-phone" type="button" aria-label="打开游戏手机" title="游戏手机">${icons.phone}<span>手机</span></button>
    </nav>
    <button id="mobile-route" class="mobile-route" type="button" hidden aria-label="打开当前任务或导航详情"><span id="mobile-route-icon" class="navigation-hud-icon">${icons.map}</span><span class="navigation-hud-copy"><strong id="mobile-route-title"></strong><small id="mobile-route-detail"></small></span><span class="navigation-hud-distance" id="mobile-route-distance"></span><span class="mobile-route-arrow" aria-hidden="true">›</span></button>
`;
  document.body.append(root);
  // Navigation is shared by desktop and phone layouts; menu controls stay mobile-only.
  document.body.append($('mobile-route'));
  const announcement=document.createElement('span');announcement.id='navigation-announcement';announcement.className='navigation-sr-only';announcement.setAttribute('role','status');announcement.setAttribute('aria-live','polite');document.body.append(announcement);

  let toolsOpen = false;
  const pinKey = 'sunset-coast-test.tools-pinned.v1';
  let toolsPinned = false, windowActive = true;
  try { toolsPinned = localStorage.getItem(pinKey) === 'true'; } catch { /* Private browsing can deny storage. */ }
  function setPinned(value) {
    toolsPinned = value;
    try { localStorage.setItem(pinKey, String(value)); } catch { /* Keep this session usable. */ }
    $('mobile-tools-pin').setAttribute('aria-pressed', String(value));
    $('mobile-tools-pin').setAttribute('aria-label', value ? '取消固定操作面板' : '固定操作面板');
    $('mobile-tools-pin').textContent = value ? '已固定' : '固定';
  }
  function dismissTools(restoreFocus = false) { setPinned(false); setTools(false, restoreFocus); }
  function closeRoutineTools() { if (!toolsPinned) setTools(false); }
  setPinned(toolsPinned);
  let compactControlsInstalled = false;
  let lastDrivingState = game.inCar;
  const originalPositions = new Map();
  const pedalGroup = $('touch-go').parentElement || document.querySelector?.('.touch-actions');
  const rememberPosition = node => {
    if (node && !originalPositions.has(node)) originalPositions.set(node, { parent: node.parentElement, next: node.nextSibling });
  };
  // Reparenting preserves each production listener, pointer set and accessible ID.
  // Reverse/gentle stay held inputs; they do not become toggles or synthesized keys.
  for (const id of ['touch-handbrake', 'touch-reverse', 'touch-gentle', 'touch-enter', 'mobile-quick-actions']) rememberPosition($(id));
  function cancelTouchHolds() {
    const heldFlight = game.aircraft?.active ? { ...game.aircraft.controls } : null;
    game.resetControls();
    if (heldFlight) game.aircraft.setControls?.({ throttle: heldFlight.throttle, flaps: heldFlight.flaps, brake: heldFlight.brake });
  }
  function setTools(open, restoreFocus = false) {
    if (open && (!touchLayout() || overlayOpen || game.paused || game.transition)) return;
    if (toolsOpen === open) return;
    toolsOpen = open;
    if (open) {
      $('roadster-controls')?.classList.remove('roadster-details-open');
      $('roadster-details-toggle')?.setAttribute('aria-expanded', 'false');
      $('roadster-details-toggle')?.setAttribute('aria-label', '展开车辆状态');
    }
    document.body.classList.toggle('mobile-tools-open', open);
    $('mobile-tools-toggle').setAttribute('aria-expanded', String(open));
    $('mobile-tools-toggle').setAttribute('aria-label', open ? '收起左侧操作' : '展开左侧操作');
    $('mobile-driving-tools').hidden = !open;
    cancelTouchHolds();
    if (restoreFocus) $('mobile-tools-toggle').focus({ preventScroll: true });
  }
  function syncControlPlacement() {
    const enabled = touchLayout();
    document.body.classList.toggle('mobile-controls-v2', enabled);
    if (enabled === compactControlsInstalled) return;
    setTools(false);
    cancelTouchHolds();
    compactControlsInstalled = enabled;
    if (enabled) {
      pedalGroup?.append($('touch-handbrake'));
      $('mobile-secondary-driving').append($('touch-reverse'), $('touch-gentle'), $('touch-enter'));
      $('mobile-tools-shortcuts').append($('mobile-quick-actions'));
      $('touch-steering').setAttribute('aria-label', '驾驶方向');
      pedalGroup?.setAttribute('aria-label', '油门、刹车与手刹');
    } else {
      for (const [node, { parent, next }] of originalPositions) {
        if (parent) parent.insertBefore(node, next?.parentElement === parent ? next : null);
      }
      $('touch-steering').setAttribute('aria-label', '驾驶方向与手刹');
      pedalGroup?.setAttribute('aria-label', '驾驶与步行操作');
    }
  }
  $('mobile-tools-toggle').onclick = () => toolsOpen ? dismissTools() : setTools(true);
  $('mobile-tools-pin').onclick = () => setPinned(!toolsPinned);
  $('mobile-tools-close').onclick = () => dismissTools(true);
  $('roadster-details-toggle')?.addEventListener('click', () => setTools(false));
  $('mobile-surround-camera').onclick = () => { closeRoutineTools(); game.vehicleCameras?.toggleSurround(); };
  $('mobile-vehicle-tools').onclick = () => { setTools(false); $('roadster-details-toggle')?.click(); };
  $('mobile-pilot').onclick = () => { closeRoutineTools(); $('autopilot-btn').click(); };
  const signalsAllowed = () => game.inCar && !game.paused && !game.transition && !game.ui.isPhoneOpen() && !$('modal').open && !game.aircraft?.active && !game.flight?.active && !game.robotaxi?.passenger;
  for (const gear of TOUCH_GEARS) {
    const button = $('mobile-gear-' + gear.toLowerCase());
    button.onclick = () => { if (signalsAllowed()) game.selectTouchGear?.(gear); syncStatus(); };
    button.addEventListener('keydown', event => { if (event.code === 'Space' || event.code === 'Enter') event.stopPropagation(); });
    for (const type of ['contextmenu', 'selectstart', 'dragstart']) button.addEventListener(type, event => event.preventDefault());
  }
  $('mobile-signal-left').onclick = () => { if (signalsAllowed()) game.setTurnSignal?.('left'); syncStatus(); };
  $('mobile-signal-right').onclick = () => { if (signalsAllowed()) game.setTurnSignal?.('right'); syncStatus(); };
  $('mobile-hazards').onclick = () => { if (signalsAllowed()) game.setHazards?.(!game.vehicle?.lightState?.hazards); syncStatus(); };
  // Fixed shortcuts never reparent a held control or reset another thumb's input.
  const signalShortcuts = $('mobile-pedal-signals');
  const steeringPointers = new Set(), signalPointers = new Set();
  let signalHideTimer = null;
  const clearSignalTimer = () => { clearTimeout(signalHideTimer); signalHideTimer = null; };
  function clearSignalShortcuts() {
    clearSignalTimer(); steeringPointers.clear();
    const released = [...signalPointers]; signalPointers.clear();
    for (const id of released) for (const side of ['left', 'right']) {
      const button = $('mobile-pedal-signal-' + side);
      if (button.hasPointerCapture?.(id)) button.releasePointerCapture(id);
    }
    signalShortcuts.hidden = true;
  }
  function scheduleSignalHide() {
    clearSignalTimer();
    if (!steeringPointers.size && !signalPointers.size) {
      // Grace period lets the other thumb reach a lamp after steering ends.
      signalHideTimer = setTimeout(() => { signalShortcuts.hidden = true; }, 1200);
    }
  }
  game.clearButtonPointers?.push(clearSignalShortcuts);
  for (const side of ['left', 'right']) {
    const steering = $('touch-' + side), shortcut = $('mobile-pedal-signal-' + side);
    steering.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !touchLayout() || !signalsAllowed()) return;
      clearSignalTimer(); steeringPointers.add(event.pointerId); signalShortcuts.hidden = false;
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      for (const [button, owners] of [[steering, steeringPointers], [shortcut, signalPointers]]) {
        button.addEventListener(type, event => {
          if (!owners.delete(event.pointerId)) return;
          if (type !== 'pointerup' && !steeringPointers.size && !signalPointers.size) clearSignalShortcuts();
          else scheduleSignalHide();
        });
      }
    }
    shortcut.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !signalsAllowed()) return;
      clearSignalTimer(); signalPointers.add(event.pointerId);
      shortcut.setPointerCapture(event.pointerId);
    });
    shortcut.addEventListener('keydown', event => {
      if (event.code === 'Space' || event.code === 'Enter') event.stopPropagation();
    });
    shortcut.onclick = () => { if (signalsAllowed()) game.setTurnSignal?.(side); syncStatus(); };
    for (const type of ['contextmenu', 'selectstart', 'dragstart']) shortcut.addEventListener(type, event => event.preventDefault());
  }

  // A side utility panel is not a modal: reverse/soft brake must still combine
  // with steering and pedals. The full menu below keeps its original modal lock.
  $('mobile-driving-tools').addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !toolsOpen) return;
    event.preventDefault(); event.stopImmediatePropagation(); dismissTools(true);
  });
  let overlayOpen = false;
  const controls = $('mobile-controls');

  $('mobile-phone').onclick = () => { setTools(false); $('phone-btn').click(); };
  $('mobile-view').onclick = () => { closeRoutineTools(); $('camera-btn').click(); syncCockpitSpeedHUD(game); };
  $('mobile-route').onclick = () => game.ui.openPhone('nav');
  $('mobile-route').addEventListener('keydown',event=>{
    if(!['Space','Enter'].includes(event.code))return;
    event.preventDefault();event.stopPropagation();
    if(!event.repeat)$('mobile-route').click();
  });

  function syncOverlay() {
    const next = !$('phone').hidden || $('modal').open;
    if (next !== overlayOpen) {
      overlayOpen = next;
      document.body.classList.toggle('mobile-panel-open', next);
      if (next) { setTools(false); game.resetControls(); }
    }
    controls.inert = compactLayout() && (next);
    $('mobile-driving-tools').inert = next;
  }
  const overlays = new MutationObserver(syncOverlay);
  overlays.observe($('phone'), { attributes: true, attributeFilter: ['hidden'] });
  overlays.observe($('modal'), { attributes: true, attributeFilter: ['open'] });
  // The main UI updates the same classes synchronously on entry / exit. Mirror
  // the state here as well for loaded saves and explicit mobile UI refreshes.
  function syncDrivingControls() {
    syncControlPlacement();
    syncCockpitSpeedHUD(game);
    if (lastDrivingState !== game.inCar) { setTools(false); lastDrivingState = game.inCar; }
    const walking = !game.inCar;
    document.body.classList.toggle('mobile-driving', !walking);
    document.body.classList.toggle('mobile-walking', walking);
    $('joystick').hidden = !walking;
    $('touch-steering').hidden = walking;
    for (const id of ['touch-gentle', 'touch-handbrake']) $(id).hidden = walking;
  }
  const walkingControls = new MutationObserver(syncDrivingControls);
  walkingControls.observe($('touch-brake'), { attributes: true, attributeFilter: ['hidden'] });

  const put = (id, value) => { if ($(id).textContent !== value) $(id).textContent = value; };
  function syncStatus() {
    syncDrivingControls();
    syncMobileLockStatus(game, lockStatus, document.body);
    game.ui.updateNavigation();
    $('mobile-pilot').hidden = !game.inCar || !!game.aircraft?.active || !!game.flight?.active || !!game.robotaxi?.passenger;
    $('mobile-pilot').setAttribute('aria-pressed', String(!!game.autopilot));
    put('mobile-pilot-state', $('pilot-label').textContent || (game.autopilot ? '已开启' : '待命'));
    const vehicleControls = $('roadster-controls');
    $('mobile-vehicle-tools').hidden = !game.inCar || !vehicleControls || vehicleControls.hidden;
    const vehicleWarning = !!vehicleControls && !vehicleControls.hidden && vehicleControls.classList.contains('roadster-warning-active');
    $('mobile-tools-toggle').classList.toggle('has-vehicle-warning', vehicleWarning);
    put('mobile-vehicle-tools', vehicleWarning ? '车辆操作 · 警告' : '车辆操作');
    const lights = game.vehicle?.lightState;
    const signalsAvailable = !!game.inCar && !game.aircraft?.active && !game.flight?.active && !game.robotaxi?.passenger;
    $('mobile-signals').hidden = !signalsAvailable;
    if (!touchLayout() || !signalsAllowed()) clearSignalShortcuts();
    for (const side of ['left', 'right']) {
      for (const prefix of ['mobile-signal-', 'mobile-pedal-signal-']) {
        $(prefix + side).disabled = !signalsAllowed() || typeof game.setTurnSignal !== 'function';
        $(prefix + side).setAttribute('aria-pressed', String(lights?.turnSignal === side));
      }
    }
    $('mobile-hazards').disabled = !signalsAllowed() || typeof game.setHazards !== 'function';
    $('mobile-hazards').setAttribute('aria-pressed', String(!!lights?.hazards));
    if ((game.paused || game.transition)) setTools(false);
    const gearVisible = touchLayout() && signalsAvailable && !game.isRoadsterFlying?.();
    $('mobile-gears').hidden = !gearVisible || !signalsAllowed();
    const gear = game.getTouchGear?.() ?? 'D';
    for (const value of TOUCH_GEARS) {
      const button = $('mobile-gear-' + value.toLowerCase());
      button.disabled = !gearVisible || !signalsAllowed();
      button.setAttribute('aria-pressed', String(gear === value));
    }
    $('mobile-gears').setAttribute('aria-label', game.autopilot ? '行驶挡位 · 点击接管辅助驾驶' : '行驶挡位 · ' + gear);
    if (toolsPinned && windowActive && !document.hidden && !overlayOpen && !game.paused && !game.transition && !$('roadster-controls')?.classList.contains('roadster-details-open')) setTools(true);

  }

  function onViewportChange() {
    // Visual viewport height is reduced by Safari chrome and by the on-screen keyboard.
    const view = window.visualViewport;
    document.documentElement.style.setProperty('--mobile-vh', `${Math.round(view?.height || innerHeight)}px`);
    document.documentElement.style.setProperty('--mobile-vtop', `${Math.round(view?.offsetTop || 0)}px`);
    if (touchLayout() || compactControlsInstalled) cancelTouchHolds();
    syncControlPlacement();
    syncOverlay();
  }
  mobile.addEventListener('change', onViewportChange);
  window.visualViewport?.addEventListener('resize', onViewportChange);
  window.visualViewport?.addEventListener('scroll', onViewportChange);
  window.addEventListener('resize', onViewportChange);
  window.addEventListener('focus', () => { windowActive = true; syncStatus(); });
  window.addEventListener('blur', () => { windowActive = false; setTools(false); game.resetControls(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { setTools(false); game.resetControls(); } });
  const inputModeChanges = new MutationObserver(() => { syncControlPlacement(); syncOverlay(); });
  inputModeChanges.observe(document.body, { attributes: true, attributeFilter: ['data-input-mode'] });
  // Only compact, low-frequency labels are mirrored; no extra render loop or WebGL canvas.
  setInterval(() => { if (!document.hidden) syncStatus(); }, 250);
  onViewportChange();
  syncStatus();
  document.body.classList.add('mobile-ui-ready');
  window.sunsetMobileUI = { closeTools: () => setTools(false), sync: () => { syncOverlay(); syncStatus(); } };
}
