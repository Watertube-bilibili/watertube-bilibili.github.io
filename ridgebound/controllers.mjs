const STORAGE_KEY = 'watertube-ridgebound-controls-v1';
const FIELDS = {steer:'转向', throttle:'油门', brake:'刹车', reverse:'倒车', clutch:'离合器'};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const $ = id => document.getElementById(id);
const emptyInput = () => ({throttle:0, reverse:0, steer:0, brake:false, brakeValue:0, clutch:0, reel:false});

function browserPads() {
  try { return Array.from(navigator.getGamepads?.() || []).filter(pad => pad?.connected !== false && pad); }
  catch { return []; }
}

function savedSettings() {
  const settings = {bindings:{}, rumble:true};
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!value || typeof value !== 'object') return settings;
    settings.rumble = value.rumble !== false;
    for (const key of Object.keys(FIELDS)) {
      const binding = value.bindings?.[key];
      if (!binding || typeof binding.deviceId !== 'string' || !['axis','button'].includes(binding.type)) continue;
      const min = clamp(finite(binding.min, -1), -1, 1), max = clamp(finite(binding.max, 1), -1, 1);
      if (max - min < .01 || !Number.isInteger(binding.index) || binding.index < 0 || binding.index > 255) continue;
      settings.bindings[key] = {
        deviceId:binding.deviceId, deviceIndex:finite(binding.deviceIndex, -1), type:binding.type,
        index:binding.index, min, max, center:clamp(finite(binding.center, (min+max)/2), min, max),
        invert:binding.invert === true, deadzone:clamp(finite(binding.deadzone, .02), 0, .4)
      };
    }
  } catch {}
  return settings;
}

/** Gamepad input and optional same-origin Windows DirectInput bridge. Call sample every frame, including while paused. */
export function createControllers({toast = () => {}, onAction = () => {}} = {}) {
  const localBridge = ['127.0.0.1','localhost'].includes(location.hostname) && location.port === '8766';
  const settings = savedSettings();
  const dialog = $('controllerDialog'), rows = new Map(), lastButtons = new Map(), feedbackFailed = new Set();
  let capture = null, lastDeviceText = null, lastUi = 0, lastRumble = 0;
  let bridgePads = [], bridgeSeen = -Infinity, bridgeBusy = false, bridgePoll = -Infinity, bridgeFeedback = -Infinity;
  let bridgeForce = false, bridgeStrength = .35, bridgeStatus = {available:false, armed:false, status:''};

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); }
    catch { toast('无法保存控制设置，本次仍然可用'); }
  }
  function pollBridge() {
    const now = performance.now();
    if (!localBridge || bridgeBusy || now - bridgePoll < 50) return;
    bridgePoll = now; bridgeBusy = true;
    fetch('/api/input', {cache:'no-store', signal:AbortSignal.timeout(700)})
      .then(response => { if (!response.ok) throw new Error('bridge'); return response.json(); })
      .then(data => {
        bridgeSeen = performance.now();
        bridgeStatus = {available:!!data.ffb?.available, armed:!!data.ffb?.armed, status:String(data.ffb?.status || '')};
        bridgePads = (Array.isArray(data.devices) ? data.devices : [])
          .filter(device => device.connected !== false && typeof device.id === 'string')
          .map((device, index) => ({
            id:device.id.startsWith('di:') ? device.id : 'di:'+device.id, index:-100-index,
            name:String(device.name || device.id), mapping:'directinput', forceFeedback:!!device.forceFeedback,
            axes:(Array.isArray(device.axes) ? device.axes : []).map(value => clamp(finite(value), -1, 1)),
            buttons:(Array.isArray(device.buttons) ? device.buttons : []).map(value => ({value:clamp(finite(value), 0, 1), pressed:finite(value) > .5}))
          }));
      })
      .catch(() => { bridgePads = []; bridgeStatus = {available:false, armed:false, status:'桥接未连接'}; })
      .finally(() => { bridgeBusy = false; });
  }
  function devices() {
    return [...browserPads(), ...(performance.now() - bridgeSeen < 500 ? bridgePads : [])];
  }
  function deviceFor(binding, pads) {
    return pads.find(pad => pad.index === binding.deviceIndex && pad.id === binding.deviceId)
      || pads.find(pad => pad.id === binding.deviceId);
  }
  function raw(binding, pad) {
    const source = binding.type === 'button' ? pad.buttons[binding.index]?.value : pad.axes[binding.index];
    return source === undefined || !Number.isFinite(Number(source)) ? null : Number(source);
  }
  function normalize(value, binding, key) {
    const min = finite(binding.min, -1), max = finite(binding.max, 1), deadzone = clamp(finite(binding.deadzone), 0, .4);
    let result;
    if (key === 'steer') {
      const center = clamp(finite(binding.center, (min+max)/2), min+.001, max-.001);
      result = value < center ? (value-center)/Math.max(.001, center-min) : (value-center)/Math.max(.001, max-center);
      result = clamp(result, -1, 1) * (binding.invert ? -1 : 1);
      return Math.abs(result) <= deadzone ? 0 : Math.sign(result)*(Math.abs(result)-deadzone)/(1-deadzone);
    }
    result = clamp((value-min)/Math.max(.001,max-min), 0, 1);
    if (binding.invert) result = 1-result;
    return result <= deadzone ? 0 : (result-deadzone)/(1-deadzone);
  }
  function getValue(key, pads, standardPad) {
    const binding = settings.bindings[key];
    if (binding) {
      const pad = deviceFor(binding, pads);
      if (!pad) return 0;
      const value = raw(binding,pad);
      return value === null ? 0 : normalize(value,binding,key);
    }
    if (!standardPad) return 0;
    if (key === 'steer') return normalize(finite(standardPad.axes[0]), {min:-1,max:1,center:0,deadzone:.08}, key);
    const index = {throttle:7,brake:6,reverse:1}[key];
    return index === undefined ? 0 : clamp(finite(standardPad.buttons[index]?.value), 0, 1);
  }
  function sample() {
    pollBridge();
    const pads = devices(), standardPad = pads.find(pad => pad.mapping === 'standard');
    if (capture) observe(pads);
    const result = {
      throttle:getValue('throttle',pads,standardPad), reverse:getValue('reverse',pads,standardPad),
      steer:getValue('steer',pads,standardPad), brakeValue:getValue('brake',pads,standardPad), brake:false,
      clutch:getValue('clutch',pads,standardPad), reel:!!standardPad?.buttons[4]?.pressed
    };
    result.brake = result.brakeValue > .06;
    const now = performance.now();
    if (now-lastUi > 90) {lastUi = now; updatePanel(pads,result);}
    const blocked = !!document.querySelector('dialog[open]');
    const pauseOnly = $('pauseDialog')?.open && !dialog?.open && !$('garage')?.open && !$('victoryDialog')?.open;
    const mapping = {0:'toggleGear',2:'winch',3:'camera',5:'detach',8:'recover',9:'pause',10:'toggleAWD'};
    const currentKeys = new Set();
    for (const pad of pads) {
      if (pad.mapping !== 'standard') continue;
      for (const [index,action] of Object.entries(mapping)) {
        const key = pad.id+':'+pad.index+':'+index, down = !!pad.buttons[index]?.pressed;
        currentKeys.add(key);
        if (down && !lastButtons.get(key)) {
          if (!blocked) onAction(action);
          else if (action === 'pause' && pauseOnly) onAction('resume');
        }
        lastButtons.set(key,down);
      }
    }
    for (const key of lastButtons.keys()) if (!currentKeys.has(key)) lastButtons.delete(key);
    return blocked || document.hidden ? emptyInput() : result;
  }
  function bindingLabel(binding,pads) {
    if (!binding) return '标准手柄自动映射';
    const pad = deviceFor(binding,pads);
    return `${pad?'已连接':'未连接'} · ${binding.type==='axis'?'轴':'按钮'} ${binding.index} · ${pad?.name || binding.deviceId}`;
  }
  function fillRow(key) {
    const row = rows.get(key), binding = settings.bindings[key];
    if (!row) return;
    row.summary.textContent = bindingLabel(binding,devices());
    row.details.hidden = !binding;
    if (!binding) return;
    row.min.value = Number(binding.min.toFixed(3)); row.max.value = Number(binding.max.toFixed(3));
    row.invert.checked = !!binding.invert; row.deadzone.value = binding.deadzone || 0;
  }
  function updatePanel(pads,values) {
    if (!dialog?.open) return;
    const hasBridge = localBridge && performance.now()-bridgeSeen < 500;
    const bridgeText = !localBridge ? '普通网页不提供方向盘扭矩接口。请下载 Windows 启动器，用本地桥接连接设备。'
      : hasBridge ? `${bridgeStatus.available?'已找到力反馈设备':'未找到可用力反馈设备'}${bridgeStatus.armed?' · 扭矩输出中':''}${bridgeStatus.status?' · '+bridgeStatus.status:''}`
      : '正在连接 Windows 方向盘桥接。请确认启动器仍在运行。';
    if ($('bridge-status')) $('bridge-status').textContent = bridgeText;
    if ($('wheel-feedback')) $('wheel-feedback').disabled = !localBridge;
    const deviceText = pads.map(pad => `${pad.name || pad.id} (${pad.axes.length} 轴 / ${pad.buttons.length} 键)`).join('\n');
    if (deviceText !== lastDeviceText) {
      lastDeviceText = deviceText;
      $('connected-devices').textContent = deviceText || '尚未检测到设备。连接手柄、方向盘或踏板后，按一下设备按钮。浏览器需要设备支持 Gamepad API。';
      for (const key of Object.keys(FIELDS)) fillRow(key);
    }
    for (const [key,row] of rows) {
      const value = key === 'brake' ? values.brakeValue : values[key];
      row.bar.style.width = `${clamp(key==='steer'?(value+1)/2:value,0,1)*100}%`;
      row.value.textContent = Math.round(value*100)+'%';
    }
    if (capture) $('capture-status').textContent = `正在监听「${FIELDS[capture.key]}」… ${Math.max(0,Math.ceil((capture.until-performance.now())/1000))} 秒。${capture.key==='steer'?'向左右打满方向，再回正。':'完全踩下目标踏板，再松开。'}`;
  }
  function observe(pads) {
    for (const pad of pads) {
      const snapshot = capture.baseline.get(pad.id+':'+pad.index);
      if (!snapshot) continue;
      for (const type of ['axis','button']) {
        if (capture.key === 'steer' && type === 'button') continue;
        const values = type === 'axis' ? pad.axes : pad.buttons.map(button => button.value);
        values.forEach((rawValue,index) => {
          const value = finite(rawValue), initial = finite((type==='axis'?snapshot.axes:snapshot.buttons)[index]);
          const key = pad.id+':'+pad.index+':'+type+':'+index;
          let item = capture.observed.get(key);
          if (!item) {
            item = {deviceId:pad.id,deviceIndex:pad.index,type,index,min:initial,max:initial,baseline:initial,peak:initial,delta:0};
            capture.observed.set(key,item);
          }
          item.min = Math.min(item.min,value); item.max = Math.max(item.max,value);
          const delta = Math.abs(value-initial);
          if (delta > item.delta) {item.delta = delta; item.peak = value;}
        });
      }
    }
    if (performance.now() < capture.until) return;
    const best = [...capture.observed.values()].sort((a,b) => (b.max-b.min)-(a.max-a.min))[0], key = capture.key;
    capture = null;
    if (!best || best.delta < .25) {
      $('capture-status').textContent = '未识别到明显操作。请点击监听，再完整踩下踏板或转动方向盘。'; return;
    }
    if (key === 'steer' && (best.baseline-best.min < .15 || best.max-best.baseline < .15)) {
      $('capture-status').textContent = '转向行程不完整。请先回正，再重新监听：向左打满、向右打满，最后回正。'; return;
    }
    settings.bindings[key] = {
      deviceId:best.deviceId,deviceIndex:best.deviceIndex,type:best.type,index:best.index,
      min:best.min,max:best.max,center:best.baseline,invert:key!=='steer' && best.peak<best.baseline,deadzone:key==='steer'?.05:.02
    };
    save(); fillRow(key);
    $('capture-status').textContent = `「${FIELDS[key]}」已绑定。检查实时条；方向相反可勾选反转，行程不准可修改最小 / 最大值。`;
    toast(FIELDS[key]+'已绑定');
  }
  function listen(key) {
    const pads = devices();
    if (!pads.length) {toast('先连接设备，并按一下设备按钮'); return;}
    capture = {
      key,until:performance.now()+6000,
      baseline:new Map(pads.map(pad => [pad.id+':'+pad.index,{axes:[...pad.axes],buttons:pad.buttons.map(button=>button.value)}])),observed:new Map()
    };
    $('capture-status').textContent = `正在监听「${FIELDS[key]}」… 请只操作这一个控制，完成完整行程。`;
  }
  function closeSettings() {capture = null; dialog?.close(); onAction('resume');}
  if (dialog) {
    const container = $('binding-rows'); container.replaceChildren();
    for (const [key,label] of Object.entries(FIELDS)) {
      const row = document.createElement('section'); row.className = 'binding-row'; row.dataset.binding = key;
      row.innerHTML = `<div class="binding-header"><strong>${label}${key==='clutch'?'<small>选填 · 输入预留</small>':''}</strong><output aria-label="${label}实时输入">0%</output><button type="button">监听绑定</button><button class="binding-clear" type="button" aria-label="清除${label}绑定">清除</button></div><p class="binding-summary"></p><div class="binding-meter"><i></i></div><div class="binding-details" hidden><label>最小值<input type="number" min="-1" max="1" step="0.01" aria-label="${label}最小输入值"></label><label>最大值<input type="number" min="-1" max="1" step="0.01" aria-label="${label}最大输入值"></label><label>死区<input type="number" min="0" max="0.4" step="0.01" aria-label="${label}死区"></label><label class="invert-label"><input type="checkbox">反转</label></div>`;
      const numbers = row.querySelectorAll('input[type=number]');
      const entry = {element:row,summary:row.querySelector('.binding-summary'),details:row.querySelector('.binding-details'),bar:row.querySelector('.binding-meter i'),value:row.querySelector('output'),min:numbers[0],max:numbers[1],deadzone:numbers[2],invert:row.querySelector('input[type=checkbox]')};
      rows.set(key,entry); container.append(row);
      row.querySelector('button').addEventListener('click',()=>listen(key));
      row.querySelector('.binding-clear').addEventListener('click',()=>{delete settings.bindings[key]; save(); fillRow(key);});
      for (const input of row.querySelectorAll('input')) input.addEventListener('change',()=>{
        const binding = settings.bindings[key]; if (!binding) return;
        const min = clamp(finite(entry.min.value,-1),-1,1), max = clamp(finite(entry.max.value,1),-1,1);
        if (max-min < .01) {toast('最大值必须比最小值大至少 0.01'); fillRow(key); return;}
        Object.assign(binding,{min,max,center:clamp(binding.center,min+.001,max-.001),invert:entry.invert.checked,deadzone:clamp(finite(entry.deadzone.value),0,.4)});
        save();
      });
      fillRow(key);
    }
    $('close-controllers').addEventListener('click',closeSettings);
    $('controller-done').addEventListener('click',closeSettings);
    dialog.addEventListener('cancel',event=>{event.preventDefault();closeSettings();});
    $('rumble-enabled').checked = settings.rumble;
    $('rumble-enabled').addEventListener('change',event=>{settings.rumble=event.target.checked;save();});
    $('test-rumble').addEventListener('click',async()=>{
      let supported = false;
      for (const pad of devices()) if (pad.vibrationActuator?.playEffect) {
        try {await pad.vibrationActuator.playEffect('dual-rumble',{duration:220,strongMagnitude:.25,weakMagnitude:.5});supported=true;} catch {}
      }
      toast(supported?'已发送设备震动测试':'设备或浏览器未提供震动接口');
    });
  }
  function sendBridgeFeedback(payload,keepalive=false) {
    if (!localBridge) return;
    fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive}).catch(()=>{});
  }
  function stopFeedback() {
    sendBridgeFeedback({enabled:false},true);
    for (const pad of browserPads()) pad.vibrationActuator?.reset?.().catch?.(()=>{});
  }
  if ($('wheel-feedback')) {
    $('wheel-feedback').disabled = !localBridge;
    $('wheel-feedback').addEventListener('change',event=>{
      bridgeForce = localBridge && event.target.checked;
      if (!bridgeForce) stopFeedback();
    });
    $('wheel-strength').disabled = !localBridge;
    $('wheel-strength').addEventListener('input',event=>{
      bridgeStrength = clamp(finite(event.target.value)/100,0,.6);
      $('wheel-strength-label').textContent = Math.round(bridgeStrength*100)+'%';
    });
  }
  addEventListener('gamepadconnected',()=>{lastDeviceText=null;toast('检测到控制器，可在控制设置中绑定踏板');});
  addEventListener('gamepaddisconnected',()=>{lastButtons.clear();lastDeviceText=null;toast('控制器已断开，已释放输入');});
  addEventListener('blur',stopFeedback);
  addEventListener('pagehide',stopFeedback);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopFeedback();});
  function updateFeedback(state={}) {
    const now = performance.now(), blocked = !!document.querySelector('dialog[open]') || document.hidden || state.paused === true || state.playing === false;
    if (localBridge && now-bridgeFeedback >= 110) {
      bridgeFeedback = now;
      const pads = devices(), selected = settings.bindings.steer?.deviceId;
      const wheel = pads.find(pad=>pad.id===selected && pad.forceFeedback) || pads.find(pad=>pad.forceFeedback);
      sendBridgeFeedback({
        enabled:bridgeForce && !blocked && !!wheel && bridgeStatus.available,
        deviceId:wheel?.id,strength:bridgeStrength,steer:clamp(finite(state.steer),-1,1),speed:finite(state.speed),
        slip:clamp(finite(state.slip),0,1),impact:clamp(finite(state.impact),0,1),
        suspension:clamp(1-finite(state.damage?.suspension,100)/100,0,1)
      });
    }
    if (!settings.rumble || blocked || now-lastRumble < 110) return;
    lastRumble = now;
    const severity = clamp(finite(state.impact),0,1), rough = state.surface==='rock'?.12:state.surface==='mud'?.07:0;
    const magnitude = Math.max(severity,Math.abs(finite(state.speed))>.6?rough:0);
    if (magnitude < .02) return;
    for (const pad of browserPads()) {
      if (feedbackFailed.has(pad.id) || !pad.vibrationActuator?.playEffect) continue;
      try {Promise.resolve(pad.vibrationActuator.playEffect('dual-rumble',{duration:100,strongMagnitude:Math.min(.65,magnitude),weakMagnitude:Math.min(.45,magnitude*.7)})).catch(()=>feedbackFailed.add(pad.id));}
      catch {feedbackFailed.add(pad.id);}
    }
  }
  return {
    sample,updateFeedback,
    openSettings(){if(!dialog)return;lastDeviceText=null;for(const key of Object.keys(FIELDS))fillRow(key);if(!dialog.open)dialog.showModal();pollBridge();updatePanel(devices(),emptyInput());},
    status(){return {
      devices:devices().map(pad=>({id:pad.id,index:pad.index,axes:pad.axes.length,buttons:pad.buttons.length,standard:pad.mapping==='standard',rumble:!!pad.vibrationActuator?.playEffect})),
      bindings:structuredClone(settings.bindings),listening:capture?.key||null,
      forceFeedback:localBridge?{bridge:true,enabled:bridgeForce,strength:bridgeStrength,available:bridgeStatus.available,armed:bridgeStatus.armed,status:bridgeStatus.status}
        :{bridge:false,enabled:false,available:false,status:'浏览器只提供设备输入与兼容设备震动；真实扭矩需 Windows 启动器'}
    };}
  };
}
