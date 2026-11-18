/**
 * Keep the HUD inside the browser's hardware-safe rectangle, optionally enlarged
 * with a selected device profile for browsers that do not expose display cutouts.
 */
const KEY = 'watertube-ridgebound-device-layout-v1';
const SIDES = ['auto', 'left', 'right'];
const CUTOUTS = new Set(['none', 'punch', 'notch', 'island', 'pill']);
const EDGES = ['top', 'right', 'bottom', 'left'];
const DEFAULT = {profile:'auto', side:'auto', padding:0};

function settings() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (!saved || typeof saved !== 'object') return {...DEFAULT};
    const profile = typeof saved.profile === 'string' ? saved.profile : DEFAULT.profile;
    return {
      profile,
      side: SIDES.includes(saved.side) ? saved.side : DEFAULT.side,
      padding: Number.isFinite(saved.padding) ? Math.round(Math.min(32, Math.max(0, saved.padding))) : 0,
    };
  } catch {
    return {...DEFAULT};
  }
}

function parseModels(data) {
  if (data?.version !== 1 || !Array.isArray(data.models)) throw new Error('地图游戏设备预设格式无效');
  const models = new Map();
  for (const model of data.models.slice(0, 500)) {
    if (!model || typeof model.id !== 'string' || !model.id || model.id === 'auto'
        || typeof model.label !== 'string' || !model.label || !CUTOUTS.has(model.cutout)
        || !Number.isFinite(model.top) || model.top < 0 || model.top > .17
        || !Number.isFinite(model.bottom) || model.bottom < 0 || model.bottom > .17) continue;
    models.set(model.id, model);
  }
  return models;
}

export function createDeviceLayout() {
  const profile = document.getElementById('device-profile');
  const side = document.getElementById('cutout-side');
  const padding = document.getElementById('device-padding');
  const output = document.getElementById('device-padding-value');
  const status = document.getElementById('device-layout-status');
  if (!profile || !side || !padding || !output || !status) return {contains:() => true};

  const root = document.documentElement;
  const probe = document.createElement('div');
  probe.className = 'safe-area-probe';
  probe.setAttribute('aria-hidden', 'true');
  document.body.append(probe);
  const screenOrientation = window.screen.orientation;
  const preferences = settings();
  side.value = preferences.side;
  padding.value = String(preferences.padding);

  let models = new Map();
  let clientModel = '';
  let failed = false;
  let pending = 0;
  let insets = {top:0, right:0, bottom:0, left:0};

  function apply() {
    const css = getComputedStyle(probe);
    const hardware = Object.fromEntries(EDGES.map(edge => [
      edge, Math.max(0, parseFloat(css.getPropertyValue('padding-' + edge)) || 0),
    ]));
    const landscape = matchMedia('(orientation: landscape)').matches;
    const angle = ((Number(screenOrientation?.angle ?? window.orientation ?? 0) % 360) + 360) % 360;
    const nativeSide = Math.abs(hardware.left - hardware.right) > 2
      ? (hardware.left > hardware.right ? 'left' : 'right') : '';
    const guessedSide = nativeSide || (angle === 270 || screenOrientation?.type === 'landscape-secondary' ? 'right' : 'left');
    const cutoutSide = preferences.side === 'auto' ? guessedSide : preferences.side;
    const model = models.get(preferences.profile === 'auto' && !Object.values(hardware).some(Boolean)
      ? clientModel : preferences.profile);
    const shortEdge = Math.min(window.innerWidth, window.innerHeight);
    const estimate = {top:0, right:0, bottom:0, left:0};
    if (model) {
      const cutout = model.cutout === 'none' ? 0 : Math.ceil(model.top * shortEdge);
      const gestureBar = Math.ceil(model.bottom * shortEdge);
      if (landscape) {
        estimate[cutoutSide] = cutout;
        estimate.bottom = gestureBar;
      } else if (angle === 180 || screenOrientation?.type === 'portrait-secondary') {
        estimate.bottom = cutout;
        estimate.top = gestureBar;
      } else {
        estimate.top = cutout;
        estimate.bottom = gestureBar;
      }
    }
    for (const edge of EDGES) {
      root.style.setProperty('--device-' + edge, estimate[edge] + 'px');
      insets[edge] = Math.max(hardware[edge], estimate[edge]) + preferences.padding;
    }
    root.style.setProperty('--device-padding', preferences.padding + 'px');
    side.disabled = !landscape;
    output.textContent = preferences.padding + ' px';
    const caption = model
      ? (preferences.profile === 'auto' ? '已识别 ' + model.label : '使用 ' + model.label + ' 预设')
      : (failed ? '设备列表未加载，仍按系统安全区避让' : '按系统安全区避让');
    const margins = EDGES.map((edge, i) => ['上','右','下','左'][i] + ' ' + Math.round(insets[edge]));
    status.textContent = caption + '。' + margins.join(' · ') + ' px';
  }

  function schedule() {
    if (pending) return;
    pending = requestAnimationFrame(() => {
      pending = 0;
      apply();
    });
  }

  function update() {
    preferences.profile = models.has(profile.value) ? profile.value : 'auto';
    preferences.side = SIDES.includes(side.value) ? side.value : 'auto';
    preferences.padding = Math.min(32, Math.max(0, Number(padding.value) || 0));
    apply();
    try { localStorage.setItem(KEY, JSON.stringify(preferences)); } catch {}
  }

  profile.addEventListener('change', update);
  side.addEventListener('change', update);
  padding.addEventListener('input', update);
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  window.addEventListener('pageshow', schedule);
  window.visualViewport?.addEventListener('resize', schedule);
  screenOrientation?.addEventListener?.('change', schedule);
  apply();

  async function loadProfiles() {
    try {
      const response = await fetch(new URL('./device-profiles.json?v=3786079387bedfbd', import.meta.url));
      if (!response.ok) throw new Error(String(response.status));
      models = parseModels(await response.json());
      for (const model of models.values()) {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = model.label;
        profile.append(option);
      }
      if (!models.has(preferences.profile)) preferences.profile = 'auto';
      profile.value = preferences.profile;
      profile.disabled = !models.size;
      apply();
    } catch {
      failed = true;
      apply();
      return;
    }
    // Android Chromium can expose an exact model. Other browsers stay on hardware insets.
    try {
      const info = await navigator.userAgentData?.getHighEntropyValues?.(['model']);
      const normalize = value => value.toLowerCase().replace(/[^a-z0-9]/g, '');
      const reported = normalize(info?.model || '');
      if (!reported) return;
      for (const model of models.values()) {
        if (normalize(model.id) !== reported && normalize(model.label) !== reported) continue;
        clientModel = model.id;
        apply();
        break;
      }
    } catch {}
  }

  void loadProfiles();
  return {
    contains(x, y, radius = 0) {
      return x - radius >= insets.left && x + radius <= window.innerWidth - insets.right
        && y - radius >= insets.top && y + radius <= window.innerHeight - insets.bottom;
    },
  };
}
