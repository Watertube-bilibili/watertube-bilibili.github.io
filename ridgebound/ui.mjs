const $ = id => document.getElementById(id);
const seconds = n => `${Math.floor(n / 60).toString().padStart(2, '0')}:${Math.floor(n % 60).toString().padStart(2, '0')}`;

export function createUI(actions = {}) {
  const input = {throttle:0, reverse:0, steer:0, brake:false, reel:false};
  const keys = new Set();
  const pointers = new Map();
  let playing = false, paused = false, toastTimer, latestState, lastFocus;
  let compactWinch = false, winchExpanded = true, suppressedReel = false;
  const touchLayout = window.matchMedia('(pointer: coarse), (max-width: 900px)');
  const pauseDialog = $('pauseDialog'), victoryDialog = $('victoryDialog'), garageDialog = $('garage');
  let garageState = {coins:0,snowTires:false,snowUnlocked:false,region:'forest'};
  const call = name => actions[name]?.();
  function syncInput() {
    const held = name => [...pointers.values()].some(v => v.name === name);
    const has = (...codes) => codes.some(code => keys.has(code));
    const active = playing && !paused && !document.querySelector('dialog[open]');
    input.throttle = active && (has('KeyW','ArrowUp') || held('throttle')) ? 1 : 0;
    input.reverse = active && (has('KeyS','ArrowDown') || held('reverse')) ? 1 : 0;
    input.steer = active ? Number(has('KeyD','ArrowRight') || held('right')) - Number(has('KeyA','ArrowLeft') || held('left')) : 0;
    input.brake = active && (has('Space') || held('brake'));
    input.reel = active && !suppressedReel && (has('KeyF') || held('reel'));
  }
  function resetInput() {
    suppressedReel = false;
    keys.clear();
    pointers.forEach(({el}) => el.classList.remove('held'));
    pointers.clear();
    syncInput();
  }
  function toast(message) {
    clearTimeout(toastTimer);
    $('toast').textContent = message;
    $('toast').classList.add('visible');
    toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 3600);
  }
  function closePause() {
    paused = false;
    if (pauseDialog.open) pauseDialog.close();
    if (playing) call('resume');
    lastFocus?.focus?.();
  }
  function setPaused(value) {
    paused = value;
    resetInput();
    if (value) {
      if (victoryDialog.open) victoryDialog.close();
      if (!pauseDialog.open) {lastFocus = document.activeElement; pauseDialog.showModal();}
      $('pause-title').textContent = playing ? '在山野，慢一点。' : '启程之前。';
      $('resume').childNodes[0].textContent = playing ? '继续旅程' : '回到山野';
      $('dialog-recover').hidden = !playing;
    } else if (pauseDialog.open) pauseDialog.close();
  }
  function setPlaying(value) {
    playing = value;
    document.body.classList.toggle('playing',value);
    if (value && $('loading')) $('loading').hidden = true;
    if (pauseDialog.open) pauseDialog.close();
    if (victoryDialog.open) victoryDialog.close();
    if (garageDialog.open) garageDialog.close();
    paused = false;
    resetInput();
  }
  function releaseReel() {
    if (keys.has('KeyF')) suppressedReel = true;
    keys.delete('KeyF');
    for (const [id,held] of [...pointers]) {
      if (held.name !== 'reel') continue;
      pointers.delete(id);
      held.el.classList.remove('held');
      try { if (held.el.hasPointerCapture(id)) held.el.releasePointerCapture(id); } catch {}
    }
    syncInput();
  }
  function renderWinchLayout() {
    document.body.classList.toggle('compact-winch',compactWinch);
    document.body.classList.toggle('winch-expanded',compactWinch && winchExpanded);
    $('winch-panel').hidden = compactWinch && !winchExpanded;
    $('winch-toggle').hidden = !compactWinch;
    $('winch-close').hidden = !compactWinch;
    $('winch-toggle').setAttribute('aria-expanded',String(winchExpanded));
    $('winch-toggle').setAttribute('aria-label',winchExpanded?'收起绞盘控制':'展开绞盘控制');
  }
  function setWinchExpanded(value) {
    winchExpanded = value;
    if (!value) releaseReel();
    renderWinchLayout();
  }
  function syncWinchLayout(cameraMode) {
    const camera = Number(cameraMode) || 0;
    document.body.dataset.camera = String(camera);
    const nextCompact = camera === 2 && touchLayout.matches;
    if (nextCompact && !compactWinch) {winchExpanded = false; releaseReel();}
    if (!nextCompact) winchExpanded = true;
    compactWinch = nextCompact;
    renderWinchLayout();
  }
  touchLayout.addEventListener('change',()=>syncWinchLayout(latestState?.cameraMode));
  $('winch-toggle').addEventListener('click',()=>setWinchExpanded(!winchExpanded));
  $('winch-close').addEventListener('click',()=>{setWinchExpanded(false);$('winch-toggle').focus({preventScroll:true});});
  $('start').addEventListener('click', () => {if (!$('start').disabled) call('start');});
  $('pause').addEventListener('click', () => {call('pause'); setPaused(true);});
  $('help').addEventListener('click', () => {if (playing) call('pause'); setPaused(true);});
  $('resume').addEventListener('click', closePause);
  $('close-dialog').addEventListener('click', closePause);
  pauseDialog.addEventListener('cancel', event => {event.preventDefault(); closePause();});
  $('dialog-recover').addEventListener('click', () => {closePause(); call('recover');});
  $('recover').addEventListener('click', () => call('recover'));
  $('lowgear').addEventListener('click', () => call('toggleGear'));
  $('awd').addEventListener('click', () => call('toggleAWD'));
  $('winch').addEventListener('click', () => call('winch'));
  $('detach').addEventListener('click', () => call('detach'));
  $('camera').addEventListener('click', () => call('camera'));
  $('controller-settings').addEventListener('click',()=>call('controllerSettings'));
  $('dialog-controllers').addEventListener('click',()=>{pauseDialog.close();call('controllerSettings');});
  $('dialog-camera').addEventListener('click',()=>{closePause();call('camera');});
  $('dialog-photo').addEventListener('click',()=>call('photo'));
  $('dialog-fullscreen').addEventListener('click',()=>$('fullscreen').click());
  $('repair').addEventListener('click',()=>call('repair'));
  $('garage-button').addEventListener('click', () => call('garage'));
  $('buyTires').addEventListener('click', () => call('buyTires'));
  function closeGarage() {garageDialog.close();paused=false;resetInput();if(playing)call('resume');}
  $('close-garage').addEventListener('click',closeGarage);
  $('garage-resume').addEventListener('click',closeGarage);
  garageDialog.addEventListener('cancel',event => {event.preventDefault();closeGarage();});
  $('forestMap').addEventListener('click',() => {garageDialog.close();paused=false;call('forestMap');});
  $('snowMap').addEventListener('click',() => {garageDialog.close();paused=false;call('snowMap');});
  $('discover-snow').addEventListener('click',() => {victoryDialog.close();paused=false;call('snowMap');});
  $('photo').addEventListener('click', () => call('photo'));
  $('audio').addEventListener('click', () => call('audio'));
  $('fullscreen').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else toast('此浏览器暂不支持全屏，请横屏体验');
    } catch {toast('暂时无法全屏，请尝试横屏体验');}
  });
  $('restart').addEventListener('click', () => {victoryDialog.close(); paused=false; call('restart');});
  $('victory-continue').addEventListener('click', () => {victoryDialog.close(); paused=false;call('resume');});
  victoryDialog.addEventListener('cancel', event => {event.preventDefault();victoryDialog.close();paused=false;call('resume');});
  for (const el of document.querySelectorAll('[data-control]')) {
    el.addEventListener('pointerdown', event => {
      if (!playing || paused || el.disabled) return;
      event.preventDefault();
      try {el.setPointerCapture(event.pointerId);} catch {}
      pointers.set(event.pointerId,{name:el.dataset.control,el});
      el.classList.add('held');
      syncInput();
    });
    const release = event => {
      const held = pointers.get(event.pointerId);
      pointers.delete(event.pointerId);
      if (held && ![...pointers.values()].some(v => v.el === held.el)) held.el.classList.remove('held');
      syncInput();
    };
    el.addEventListener('pointerup',release);
    el.addEventListener('pointercancel',release);
    el.addEventListener('lostpointercapture',release);
    el.addEventListener('contextmenu',event => event.preventDefault());
  }
  const movement = new Set(['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyF']);
  const shortcuts = {KeyE:'winch',KeyQ:'detach',KeyL:'toggleGear',KeyX:'toggleAWD',KeyC:'camera',KeyR:'recover',KeyT:'repair'};
  window.addEventListener('keydown', event => {
    if (event.code === 'Escape' && playing && !victoryDialog.open && !garageDialog.open && !$('controllerDialog')?.open) {
      event.preventDefault();
      if (event.repeat) return;
      if(paused) closePause(); else {call('pause'); setPaused(true);}
      return;
    }
    if (!playing || paused || document.querySelector('dialog[open]')) return;
    if (movement.has(event.code) || shortcuts[event.code]) event.preventDefault();
    if (movement.has(event.code) && !(event.code === 'KeyF' && suppressedReel)) {keys.add(event.code);syncInput();}
    if (!event.repeat && shortcuts[event.code]) call(shortcuts[event.code]);
  });
  window.addEventListener('keyup', event => {keys.delete(event.code);if(event.code==='KeyF')suppressedReel=false;syncInput();});
  window.addEventListener('blur', resetInput);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {resetInput();if(playing && !paused && !victoryDialog.open){call('pause');setPaused(true);}}
  });
  const surfaces = {trail:'林间土路',mud:'泥泞路段',water:'浅水',grass:'山野草地',rock:'岩石坡面',snow:'积雪路面',ice:'冰面'};
  function update(state, extra = {}) {
    latestState = state;
    syncWinchLayout(state.cameraMode);
    const kmh = Math.round(Math.abs(state.speed || 0) * 3.6);
    $('speed').textContent = String(kmh).padStart(2,'0');
    setDamage(state.damage,state.repairAvailable);
    $('speed-bar').style.width = `${Math.min(kmh/42*100,100)}%`;
    $('gear-display').textContent = state.speed < -.2 ? 'R · 倒车' : state.lowGear ? 'L · 低速' : 'D · 自动';
    $('surface').textContent = surfaces[state.surface] || '山野草地';
    $('pitch').textContent = `${Math.round(Math.abs(state.pitch || 0) * 180/Math.PI)}°`;
    $('traction-dot').style.background = state.slip > .45 || state.surface === 'water' ? '#dfa45e' : '#b0ce98';
    $('awd').classList.toggle('active',!!state.awd);
    $('awd').setAttribute('aria-pressed',String(!!state.awd));
    $('lowgear').classList.toggle('active',!!state.lowGear);
    $('lowgear').setAttribute('aria-pressed',String(!!state.lowGear));
    $('checkpoint-count').textContent = `${String(state.checkpoint || 0).padStart(2,'0')} / 04`;
    $('journey-progress').style.width = `${Math.min((state.checkpoint || 0)/4*100,100)}%`;
    $('target-name').textContent = state.completed ? '旅程已完成' : extra.targetName || '下一处路标';
    $('target-distance').textContent = state.completed ? '✓' : `${Math.round(extra.targetDistance || 0)} m`;
    $('altitude').textContent = `海拔 ${Math.round(extra.altitude ?? (state.y || 0))} m`;
    const yaw = ((extra.heading ?? state.yaw ?? 0) * 180/Math.PI % 360 + 360) % 360;
    $('heading').textContent = ['N','NE','E','SE','S','SW','W','NW'][Math.round(yaw/45)%8];
    $('mission-hint').textContent = state.completed ? '自由探索，享受山野' : state.stuck > 3 ? '试试低速挡，或用绞盘借力' : '沿着山路，寻找下一个路标';
    const connected = !!state.winch;
    $('winch-toggle-status').textContent = connected ? '已连接' : '待命';
    $('winch-toggle').classList.toggle('connected',connected);
    document.querySelector('.winch-panel').classList.toggle('connected',connected);
    $('winch-status').textContent = connected ? `${Math.max(0,state.winch.length || 0).toFixed(1)} m` : '待命';
    $('winch-action').textContent = connected ? '已连接' : '连接锚点';
    $('winch-hint').textContent = connected ? input.reel ? '收绳中 · 保持油门可辅助脱困' : '已连接 · 按住收绳，拉动车辆' : '靠近树木，连接锚点';
    $('reel').disabled = !connected;
    $('detach').disabled = !connected;
    $('tension-bar').style.width = connected ? `${Math.min(100,Math.max(0,(state.winch.tension || 0)*100))}%` : '0%';
  }
  function showVictory(state = latestState) {
    resetInput();paused=true;
    if(pauseDialog.open) pauseDialog.close();
    $('discover-snow').hidden = state?.region === 'snow';
    $('result-time').textContent=seconds(state?.time || 0);
    $('result-distance').textContent=`${Math.round(state?.distance || 0)} m`;
    if(!victoryDialog.open) victoryDialog.showModal();
  }
  function setAudio(enabled) {
    $('audio-icon').setAttribute('href',enabled?'#i-sound':'#i-mute');
    $('audio').setAttribute('aria-pressed',String(enabled));
    $('audio').setAttribute('aria-label',enabled?'关闭声音':'开启声音');
    $('audio').title=enabled?'关闭声音':'开启声音';
  }
  function showGarage() {
    resetInput();paused=true;
    if (pauseDialog.open) pauseDialog.close();
    if (victoryDialog.open) victoryDialog.close();
    updateGarage(garageState);
    if (!garageDialog.open) garageDialog.showModal();
  }
  function updateGarage(data) {
    garageState = {...garageState,...data};
    const {coins,snowTires,snowUnlocked,region} = garageState;
    $('coinBalance').textContent = Math.floor(coins);
    $('buyTires').disabled = snowTires || coins < 180;
    $('buyTires').innerHTML = snowTires ? '已装配<small>SNOW GRIP</small>' : '◇ 180<small>装配雪地胎</small>';
    $('buyTires').classList.toggle('purchased',!!snowTires);
    $('snowMap').disabled = !snowUnlocked;
    $('snowMap').classList.toggle('locked',!snowUnlocked);
    $('snowMap').classList.toggle('selected',region === 'snow');
    $('forestMap').classList.toggle('selected',region !== 'snow');
    $('snow-lock').textContent = snowUnlocked ? '已解锁 · 普通胎也可进入' : '完成山林路线后解锁';
    $('garage-note').textContent = snowUnlocked && !snowTires ? '雪线已解锁，普通胎也可进入。雪地胎可改善冰雪抓地力。' : snowTires ? '雪地胎已就绪。去探索更高处的风景。' : '每抵达一个路标，获得 60 枚游戏金币。';
    document.querySelector('.map-title > span').textContent = region === 'snow' ? '珠峰雪线' : '松风谷';
  }
  function setDamage(damage={},repairAvailable=false) {
    for(const [key,id]of [['body','body-health'],['tires','tires-health'],['suspension','suspension-health']]){const integrity=Math.max(0,Math.min(100,damage?.[key]??100));$(id).textContent=Math.round(integrity)+'%';$(id).classList.toggle('damaged',integrity<65);}
    $('repair').disabled=!repairAvailable;
    $('repair').hidden=!repairAvailable;
    $('repair').textContent='小屋维修 (T)';
  }
  function setReady(ready,message) {
    $('start').disabled=!ready;
    $('start').setAttribute('aria-busy',String(!ready));
    if($('loading')){ $('loading').hidden=!!ready; if(message && $('loading').lastChild) $('loading').lastChild.textContent=message; }
  }
  return {input,update,setReady,setDamage,setPlaying,toast,showGarage,updateGarage,showWinchTargets(value){$('anchor-instruction').hidden=!value;},showVictory,setAudio,setPaused,resetInput};
}
