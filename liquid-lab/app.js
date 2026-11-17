(() => {
  "use strict";
  const $ = (s, p = document) => p.querySelector(s),
    $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const escape = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const { read, write: save } = StudioStorage;
  const apps = [
    { id: "messages", name: "消息" },
    { id: "photos", name: "相册" },
    { id: "music", name: "音乐" },
    { id: "weather", name: "天气" },
    { id: "notes", name: "备忘录" },
    { id: "clock", name: "时钟" },
    { id: "calculator", name: "计算器" },
    { id: "settings", name: "设置" },
    { id: "glass", name: "玻璃工坊" },
  ];
  const wallpapers = [
    {
      id: "lake",
      name: "湖山清晨",
      src: "assets/wallpaper-lake.jpg",
      tint: 0,
      shade: 0.3,
    },
    {
      id: "peaks",
      name: "雪峰",
      src: "assets/wallpaper-peaks.jpg",
      tint: 0,
      shade: 0.27,
    },
    {
      id: "tide",
      name: "潮汐",
      src: "assets/wallpaper-tide.jpg",
      tint: 0,
      shade: 0.24,
    },
    {
      id: "amber",
      name: "琥珀暮色",
      src: "assets/wallpaper.svg",
      tint: 0,
      shade: 0,
    },
    {
      id: "ocean",
      name: "深海蓝",
      src: "assets/wallpaper.svg",
      tint: 1,
      shade: 0,
    },
    {
      id: "rose",
      name: "玫瑰灰",
      src: "assets/wallpaper.svg",
      tint: 2,
      shade: 0,
    },
  ];
  $("#wallpaperSwatches").innerHTML = wallpapers
    .map(
      (w) =>
        `<button class="swatch" data-wall="${w.id}" style="background-image:url('${w.src}')" aria-label="${w.name}" title="${w.name}"></button>`,
    )
    .join("");
  const icon = (id) => `<span class="app-icon">${appIcons[id]()}</span>`;
  const screen = $("#screen"),
    layer = $("#appLayer"),
    home = $("#homeScreen");
  $("#desktopGrid").innerHTML = apps
    .map(
      (a) =>
        `<button class="desktop-tile" data-open="${a.id}" aria-label="打开${a.name}">${icon(a.id)}<span>${a.name}</span></button>`,
    )
    .join("");
  $("#dock").innerHTML = ["messages", "notes", "music", "settings"]
    .map(
      (id) =>
        `<button data-open="${id}" aria-label="打开${apps.find((a) => a.id === id).name}">${icon(id)}</button>`,
    )
    .join("");
  const settings = StudioStorage.loadPreferences(wallpapers);
  let renderedWallpaper = null;
  let launchIcon = null,
    controlSession = null,
    controlBackdrop = null,
    islandSpring = null;
  let active = null,
    nav = [{}],
    panel = null,
    tasks = false,
    locked = false,
    anim = null,
    labRenderer = null,
    clockTab = "stopwatch";
  let notes = read("notes", [
    {
      id: 1,
      title: "把日子过得慢一点",
      body: "周末的三件小事\n\n去湖边走走。\n听一张完整的唱片。\n把窗台的植物浇透。",
      time: "今天",
    },
    {
      id: 2,
      title: "关于这个小小的桌面",
      body: "一些熟悉的东西，也可以有新的手感。\n\n试试从左边缘滑动返回，再试试中途松手。\n你的笔记会自动保存在这台设备。",
      time: "昨天",
    },
    {
      id: 3,
      title: "灵感随手记",
      body: "温润的金属、略微泛黄的纸，以及不抢眼的细节。",
      time: "星期五",
    },
  ]);
  const contacts = [
    {
      id: "lin",
      name: "林间",
      initial: "L",
      intro: "周末去湖边走走？听说那边的秋色很好。",
    },
    {
      id: "studio",
      name: "设计小组",
      initial: "D",
      intro: "新的材质实验，记得分享一下手感。",
    },
    {
      id: "self",
      name: "文件传输助手",
      initial: "F",
      intro: "可以在这里给自己留句话。",
    },
  ];
  let chats = read(
    "chats",
    Object.fromEntries(
      contacts.map((c) => [c.id, [{ text: c.intro, mine: false }]]),
    ),
  );
  let favorites = read("favorites", []),
    photosFilter = "all",
    cityIndex = 0;
  const calculator = LiquidApplications.createCalculator();
  const cities = [
    {
      name: "杭州",
      temp: 22,
      desc: "晴",
      hi: 24,
      lo: 16,
      humidity: 62,
      wind: 8,
    },
    {
      name: "上海",
      temp: 20,
      desc: "多云",
      hi: 22,
      lo: 17,
      humidity: 70,
      wind: 12,
    },
    {
      name: "北京",
      temp: 12,
      desc: "晴",
      hi: 15,
      lo: 5,
      humidity: 38,
      wind: 16,
    },
    {
      name: "成都",
      temp: 18,
      desc: "多云",
      hi: 21,
      lo: 14,
      humidity: 78,
      wind: 5,
    },
  ];
  const photoNames = [
    "山居清晨",
    "远山来信",
    "林间光影",
    "旷野微风",
    "青色山丘",
    "潮汐之间",
  ];
  const tracks = [
    {
      title: "Low Tide",
      sub: "海岸线 · 合成器随想",
      duration: 184,
      notes: [130.81, 164.81, 196, 261.63, 220, 164.81, 146.83, 196],
    },
    {
      title: "Paper Moon",
      sub: "纸月亮 · 夜色小品",
      duration: 156,
      notes: [146.83, 174.61, 220, 293.66, 261.63, 220, 174.61, 130.81],
    },
    {
      title: "Slow Sunday",
      sub: "慢星期日 · 午后片段",
      duration: 210,
      notes: [110, 164.81, 220, 261.63, 329.63, 261.63, 196, 164.81],
    },
  ];
  let song = 0,
    playing = false,
    musicTime = 0,
    volume = 0.55;
  let islandExpanded = false,
    islandMode = "music",
    islandTimeout;
  const player = createMusicPlayer(tracks, {
    volume,
    onChange(state, reason) {
      song = state.index;
      playing = state.playing;
      musicTime = state.position;
      volume = state.volume;
      if (reason === "track") {
        if (active === "music" && panel) refreshPanel();
        const title = $("[data-control-track]");
        if (title) title.textContent = tracks[song].title;
      }
      if (reason === "play" || reason === "pause") islandMode = "music";
      if (["play", "pause", "track"].includes(reason)) {
        syncMusic();
        updateIsland();
      }
    },
    onError: toast,
  });
  let stopwatch = { running: false, start: 0, elapsed: 0, laps: [] },
    timer = { running: false, end: 0, remaining: 300, total: 300 },
    toastJob,
    volumeJob;
  function toast(text) {
    $("#phoneToast").textContent = text;
    $("#phoneToast").classList.add("visible");
    clearTimeout(toastJob);
    toastJob = setTimeout(
      () => $("#phoneToast").classList.remove("visible"),
      2300,
    );
  }
  function motion(text) {
    $("#motionReadout").textContent = text;
    setTimeout(
      () => ($("#motionReadout").textContent = "弹簧动效已就绪"),
      1900,
    );
  }
  window.addEventListener("studio:storage-unavailable", () => {
    toast("本机存储不可用，本次修改仅在当前页面保留");
  });
  function persistSettings() {
    save("settings", settings);
  }
  function applyWallpaper() {
    const w = wallpapers.find((w) => w.id === settings.wall) || wallpapers[0];
    if (renderedWallpaper === w.id) return;
    renderedWallpaper = w.id;
    screen.dataset.wallpaper = w.id;
    const base = $("#wallpaperBase");
    base.src = w.src;
    screen.style.setProperty("--selected-wallpaper", "url(" + w.src + ")");
    base.style.filter = `brightness(${1 - w.shade * 0.7})`;
    controlBackdrop = null;
    const ready = window.setWallpaperSource?.(w.src) || Promise.resolve();
    ready.then(() => {
      if (renderedWallpaper === w.id) {
        glassRenderer.update({ tint: w.tint, shade: w.shade });
        requestAnimationFrame(() => {
          if (controlSession) {
            const session = controlSession;
            captureBackdrop().then((shot) => {
              if (controlSession === session) session.glass.setSource?.(shot);
            });
          } else queueBackdrop();
        });
      }
    });
  }
  function applySettings() {
    applyWallpaper();
    const wallpaper =
      wallpapers.find((item) => item.id === settings.wall) || wallpapers[0];
    const opticalSettings = {
      strength: settings.refraction / 100,
      depth: settings.depth / 100,
      liquid: Number(settings.material === "liquid"),
      highlight: Number(settings.highlight),
    };
    document.documentElement.style.setProperty("--speed", settings.speed);
    document.body.classList.toggle("frost", settings.material === "frost");
    screen.classList.toggle("night", settings.night);
    for (const [key, value] of [
      ["material", settings.material],
      ["wall", settings.wall],
    ]) {
      for (const button of $$("[data-" + key + "]")) {
        const selected = button.dataset[key] === value;
        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      }
    }
    for (const key of ["refraction", "depth"]) {
      $("#" + key).value = settings[key];
      $("#" + key + "Value").value = settings[key] + "%";
    }
    $("#highlightToggle").classList.toggle("on", settings.highlight);
    $("#highlightToggle").setAttribute(
      "aria-checked",
      String(settings.highlight),
    );
    glassRenderer.update({
      ...opticalSettings,
      tint: wallpaper.tint,
      shade: wallpaper.shade,
    });
    controlSession?.glass?.update(opticalSettings);
    labRenderer?.update(opticalSettings);
  }

  applySettings();
  // Geometry, content and icon artwork are separate layers; content never stretches into an icon.
  const { clamp, smooth } = LiquidMotion;
  function spring(
    element,
    from,
    to,
    { duration = 570, bounce = 0.8, velocity } = {},
  ) {
    const keys = Object.keys(to),
      start = [],
      end = [];
    for (const k of keys) {
      if (k === "transform") {
        start.push(...from[k]);
        end.push(...to[k]);
      } else {
        start.push(from[k]);
        end.push(to[k]);
      }
    }
    const h = LiquidMotion.spring({
      from: start,
      to: end,
      velocity,
      stiffness: 350 * (570 / duration),
      damping: Math.max(20, 36 * bounce),
      speed: settings.speed,
      update(values) {
        let i = 0;
        for (const k of keys) {
          if (k === "transform") {
            element.style.transform = `translate(${values[i++]}px,${values[i++]}px) scale(${values[i++]},${values[i++]})`;
          } else if (k === "borderRadius")
            element.style.borderRadius = values[i++] + "px";
          else element.style[k] = values[i++];
        }
      },
    });
    return h;
  }
  const windowHistory = LiquidWindows.createRecentWindows([
    "notes",
    "music",
    "photos",
  ]);
  const surfaces = LiquidWindows.createWindowSurfaces({
    screen,
    width: 354,
    height: 786,
    getSpeed: () => settings.speed,
  });
  const {
    full: FULL_RECT,
    animate: appRectMotion,
    reset: finishPanelMotion,
  } = surfaces;

  function homeIconRect(id, element = launchIcon) {
    const icon = element?.isConnected
      ? element
      : $(`.desktop-tile[data-open="${id}"] .app-icon`);
    // Use the untransformed layout as the home screen may still be springing back.
    const width = icon.offsetWidth || 61;
    let x = 0,
      y = 0;
    for (let node = icon; node && node !== screen; node = node.offsetParent) {
      x += node.offsetLeft;
      y += node.offsetTop;
    }
    return [x, y, width, icon.offsetHeight || width, width * 0.23];
  }
  function screenRect(element) {
    return surfaces.measure(element, 26);
  }
  function surfaceMarkup(id, view) {
    return `<div class="app-content">${render(id, view)}</div><div class="app-morph-icon" aria-hidden="true">${icon(id)}</div>`;
  }
  function pulseIcon(el) {
    if (!el?.isConnected) return;
    el.style.opacity = "1";
    el.animate(
      [
        { transform: "scale(.92,1.07)" },
        { transform: "scale(1.045,.975)", offset: 0.32 },
        { transform: "scale(.99,1.01)", offset: 0.64 },
        { transform: "scale(1)" },
      ],
      { duration: 460 * settings.speed, easing: "ease-out" },
    );
    glassRenderer.impulse?.(0.8);
  }
  function closeToHome(from, velocity) {
    if (!active || !panel) return;
    capture();
    cleanupLab();
    const old = panel,
      id = active,
      targetIcon =
        launchIcon || $(`.desktop-tile[data-open="${id}"] .app-icon`),
      destination = homeIconRect(id, targetIcon);
    anim?.cancel();
    active = null;
    panel = null;
    nav = [{}];
    home.classList.remove("behind");
    home.style.transform = "";
    home.style.filter = "";
    setStatus();
    if (targetIcon) targetIcon.style.opacity = "0";
    const h = appRectMotion(old, from || surfaces.pose(old), destination, {
      morph: true,
      velocity,
      stiffness: 310,
      damping: 28,
    });
    anim = h;
    h.finished
      .then(() => {
        old.remove();
        pulseIcon(targetIcon);
        queueBackdrop();
        if (anim === h) anim = null;
      })
      .catch(() => {
        old.remove();
        if (targetIcon) targetIcon.style.opacity = "1";
      });
    motion("内容收拢 · 图标无缝接续");
  }
  function closeOverlay({ immediate = false } = {}) {
    if (controlSession) {
      if (immediate) {
        destroyControl();
        return;
      }
      settleControl(false);
      return;
    }
    $("#systemOverlay").innerHTML = "";
  }

  function setStatus() {
    screen.classList.toggle("has-app", !!active && !tasks && !locked);
    screen.classList.toggle(
      "light-app",
      !!active &&
        !["music", "weather", "glass"].includes(active) &&
        !(active === "photos" && nav.at(-1).detail !== undefined) &&
        !tasks &&
        !locked &&
        !controlSession,
    );
  }
  function cleanupLab() {
    labRenderer?.destroy();
    labRenderer = null;
  }
  function buildPanel(id, view = {}) {
    const el = document.createElement("section");
    el.className = `app-panel ${id}-panel ${["music", "glass"].includes(id) ? "dark" : ""} ${id === "photos" && view.detail !== undefined ? "photo-detail" : ""} ${id === "glass" ? "lab-app" : ""}`;
    el.dataset.app = id;
    el.setAttribute("aria-label", apps.find((a) => a.id === id).name);
    el.innerHTML = surfaceMarkup(id, view);
    return el;
  }
  function capture() {
    windowHistory.remember(active, nav, panel);
  }
  function attachPanel() {
    cleanupLab();
    if (active === "glass") setupLab();
    if (active === "notes" && nav.at(-1).detail) {
      const n = notes.find((n) => n.id === nav.at(-1).detail);
      if (n) {
        $("#noteTitle", panel).value = n.title;
        $("#noteBody", panel).value = n.body;
      }
    }
    if (active === "messages" && nav.at(-1).detail) {
      const m = $(".chat-messages", panel);
      m.scrollTop = m.scrollHeight;
    }
    updateLive();
  }
  let switcherFade = null;

  function stopSwitcherFade() {
    switcherFade?.cancel();
    switcherFade = null;
  }

  function fadeOutSwitcher() {
    const backdrop = $("#tasksLayer");
    backdrop.classList.add("visible");
    backdrop.style.pointerEvents = "none";
    screen.classList.add("task-transition");
    const fade = backdrop.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 360 * settings.speed,
      easing: "ease-out",
    });
    switcherFade = fade;
    fade.finished
      .then(() => {
        if (fade !== switcherFade || tasks) return;
        backdrop.classList.remove("visible");
        backdrop.style.pointerEvents = "";
        screen.classList.remove("task-transition");
        switcherFade = null;
      })
      .catch(() => {});
  }

  function openApp(id, { source = null, fromTask = null } = {}) {
    if (!apps.some((app) => app.id === id)) return;
    const fromSwitcher = Boolean(tasks && fromTask);
    const taskBounds = fromTask && screenRect($(".task-preview", fromTask));
    closeOverlay({ immediate: true });
    collapseIsland();
    if (locked) unlock();
    capture();
    anim?.cancel();
    cleanupLab();
    hideTasks(false);
    if (fromSwitcher) fadeOutSwitcher();

    $$(".desktop-tile .app-icon,.dock .app-icon").forEach(
      (el) => (el.style.opacity = "1"),
    );
    const sourceButton = source?.closest("[data-open]");
    launchIcon =
      sourceButton?.querySelector(".app-icon") ||
      $(`.desktop-tile[data-open="${id}"] .app-icon`);
    const origin = taskBounds || homeIconRect(id);
    active = id;
    nav = fromTask ? windowHistory.restore(id) : [{}];
    windowHistory.focus(id);
    const current = buildPanel(id, nav.at(-1));
    panel = current;
    layer.replaceChildren(current);
    home.classList.add("behind");
    setStatus();
    const openingIcon = launchIcon;
    if (!fromTask && openingIcon) openingIcon.style.opacity = "0";
    const flight = appRectMotion(current, origin, FULL_RECT, {
      morph: !fromTask,
      stiffness: 345,
      damping: 31,
    });
    anim = flight;
    flight.finished
      .then(() => {
        if (current !== panel || anim !== flight) return;
        finishPanelMotion(current);
        anim = null;
        if (openingIcon) openingIcon.style.opacity = "1";
        queueBackdrop();
      })
      .catch(() => {});
    attachPanel();
    motion(fromTask ? "后台卡片连续展开" : "打开应用");
  }

  function goHome({ instant = false } = {}) {
    closeOverlay({ immediate: true });
    collapseIsland();
    if (tasks) {
      hideTasks();
      return;
    }
    if (!active) return;
    if (!instant) {
      closeToHome(surfaces.pose(panel));
      return;
    }
    anim?.cancel();
    capture();
    cleanupLab();
    active = null;
    panel = null;
    nav = [{}];
    layer.replaceChildren();
    home.classList.remove("behind");
    setStatus();
  }

  function navigate(view, backward = false) {
    if (!active) return;
    if (backward && nav.length < 2) {
      goHome();
      return;
    }
    const outgoing = panel;
    const lastFrame = surfaces.interrupt(outgoing);
    cleanupLab();
    if (backward) nav.pop();
    else nav.push(view);
    const incoming = buildPanel(active, nav.at(-1));
    panel = incoming;
    if (backward) layer.insertBefore(incoming, outgoing);
    else layer.append(incoming);
    outgoing.inert = true;
    const timing = { stiffness: 345, damping: 34 };
    const enter = appRectMotion(
      incoming,
      [backward ? -90 : 354, 0, 354, 786, 0],
      FULL_RECT,
      timing,
    );
    anim = enter;
    enter.finished
      .then(() => {
        if (panel !== incoming || anim !== enter) return;
        finishPanelMotion(incoming);
        anim = null;
        queueBackdrop();
      })
      .catch(() => {});
    const exit = appRectMotion(
      outgoing,
      lastFrame,
      [backward ? 354 : -90, 0, 354, 786, 0],
      timing,
    );
    exit.finished.then(
      () => outgoing.remove(),
      () => outgoing.remove(),
    );
    attachPanel();
    setStatus();
  }

  function back() {
    if ($("#guide").open) {
      $("#guide").close();
      return;
    }
    if (islandExpanded) {
      collapseIsland();
      return;
    }
    if ($("#systemOverlay").children.length) {
      closeOverlay();
      return;
    }
    if (tasks) {
      hideTasks();
      return;
    }
    if (locked) {
      unlock();
      return;
    }
    if (nav.length > 1) navigate(null, true);
    else goHome();
  }
  function showTasks({ fromRect, velocity } = {}) {
    if (tasks) return;
    stopSwitcherFade();
    if (locked) unlock();
    closeOverlay({ immediate: true });
    collapseIsland();
    capture();
    cleanupLab();
    const current = panel;
    const start = fromRect || surfaces.pose(current);
    anim?.cancel();
    anim = null;
    tasks = true;
    setStatus();
    home.classList.add("behind");
    const backdrop = $("#tasksLayer");
    const track = $("#tasksTrack");
    backdrop.classList.add("visible");
    backdrop.style.opacity = "1";
    backdrop.style.pointerEvents = "";
    track.replaceChildren();
    const recents = windowHistory.list();
    if (!recents.length)
      track.innerHTML =
        '<div class="empty-state">没有后台应用<br>点击空白处回到桌面</div>';
    for (const [index, id] of recents.entries()) {
      const card = document.createElement("div");
      card.className = "task-card";
      card.dataset.task = id;
      const name = apps.find((app) => app.id === id).name;
      card.innerHTML = `<div class="task-label">${icon(id)}${name}</div><div class="task-preview"></div>`;
      const snapshot = windowHistory.preview(id) || buildPanel(id);
      snapshot.removeAttribute("aria-label");
      snapshot
        .querySelectorAll("[id]")
        .forEach((el) => el.removeAttribute("id"));
      snapshot.inert = true;
      $(".task-preview", card).append(snapshot);
      track.append(card);
      wireTask(card);
      if (!current || id !== active) {
        const enter = spring(
          card,
          { transform: [25 + index * 14, 35, 0.94, 0.94], opacity: 0 },
          { transform: [0, 0, 1, 1], opacity: 1 },
          { duration: 620, bounce: 0.82 },
        );
        card.addEventListener("pointerdown", () => enter.cancel(), {
          once: true,
        });
        enter.finished
          .then(() => card.removeAttribute("style"))
          .catch(() => card.removeAttribute("style"));
      }
    }
    track.scrollLeft = 0;
    if (current) {
      const destination = $(`.task-card[data-task="${active}"] .task-preview`);
      if (destination) {
        destination.style.opacity = "0";
        screen.classList.add("task-transition");
        current.style.visibility = "";
        const flight = appRectMotion(current, start, screenRect(destination), {
          velocity,
          stiffness: 270,
          damping: 30,
        });
        anim = flight;
        flight.finished
          .then(() => {
            if (anim !== flight || !tasks) return;
            destination.style.opacity = "1";
            current.style.visibility = "hidden";
            screen.classList.remove("task-transition");
            anim = null;
          })
          .catch(() => {});
      }
    }
    motion("最近使用的应用");
  }

  function hideTasks(returnHome = true) {
    stopSwitcherFade();
    tasks = false;
    screen.classList.remove("task-transition");
    const backdrop = $("#tasksLayer");
    backdrop.classList.remove("visible");
    backdrop.style.pointerEvents = "";
    if (panel) finishPanelMotion(panel);
    if (returnHome) {
      active = null;
      panel = null;
      nav = [{}];
      layer.replaceChildren();
      home.classList.remove("behind");
      queueBackdrop();
    }
    setStatus();
  }
  function wireTask(card) {
    const id = card.dataset.task;
    const track = $("#tasksTrack");
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute(
      "aria-label",
      "切换到" + apps.find((app) => app.id === id).name,
    );
    LiquidGestures.bindTaskCard({
      card,
      track,
      screen,
      getSpeed: () => settings.speed,
      open: () => openApp(id, { fromTask: card }),
      close() {
        if (id === "music" && playing) toggleMusic();
        windowHistory.remove(id);
        card.remove();
        if (!windowHistory.list().length)
          track.innerHTML =
            '<div class="empty-state">后台已清空<br>点击空白处回到桌面</div>';
        motion("已关闭应用");
      },
    });
  }

  function render(id, view = {}) {
    return LiquidApplications.render(id, view, {
      notes,
      favorites,
      photoNames,
      photosFilter,
      contacts,
      chats,
      cities,
      cityIndex,
      tracks,
      song,
      playing,
      musicTime,
      likedSongs: read("likedSongs", []),
      calcValue: calculator.value,
      calcLast: calculator.history,
      clockTab,
      stopwatch,
      timer,
      formatStopwatch,
      settings,
      wallpapers,
    });
  }

  function refreshPanel() {
    if (!active) return;
    cleanupLab();
    panel.innerHTML = surfaceMarkup(active, nav.at(-1));
    attachPanel();
    setStatus();
  }
  function setupLab() {
    const canvas = $("#labCanvas", panel),
      box = $("#labDemo", panel),
      lens = $("#labLens", panel);
    if (!canvas) return;
    const tex = document.createElement("canvas");
    tex.width = 640;
    tex.height = 520;
    const ctx = tex.getContext("2d");
    let pattern = "grid";
    const photo = new Image();
    photo.src = "assets/photo-0.jpg";
    function drawTexture() {
      const g = ctx.createLinearGradient(0, 0, 640, 520);
      g.addColorStop(0, "#195058");
      g.addColorStop(0.7, "#c4a36e");
      g.addColorStop(1, "#334c3b");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 640, 520);
      if (pattern === "photo" && photo.complete)
        ctx.drawImage(photo, 0, 0, 640, 520);
      if (pattern === "grid") {
        ctx.strokeStyle = "#e5e6bb55";
        ctx.lineWidth = 1;
        for (let i = 0; i < 640; i += 32) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, 520);
          ctx.stroke();
        }
        for (let i = 0; i < 520; i += 32) {
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(640, i);
          ctx.stroke();
        }
      }
      ctx.fillStyle = "#eff0cf";
      ctx.textAlign = "center";
      ctx.font = "bold 116px Georgia";
      ctx.fillText(pattern === "type" ? "Aa Bb" : "liquid.", 320, 290);
      ctx.font = "15px monospace";
      ctx.fillStyle = "#eff0cf88";
      ctx.fillText("LIGHT THROUGH A DIFFERENT LENS", 320, 338);
      labRenderer?.refresh();
    }
    drawTexture();
    labRenderer = createOptics(canvas, tex, (cr) => {
      const r = lens.getBoundingClientRect();
      return [
        {
          x: r.left - cr.left + r.width / 2,
          y: r.top - cr.top + r.height / 2,
          w: r.width,
          h: r.height,
          r: 30 * (cr.width / 318),
        },
      ];
    });
    applySettings();
    lens.style.background = "transparent";
    lens.style.backdropFilter = "none";
    lens.style.webkitBackdropFilter = "none";
    lens.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      lens.setPointerCapture(e.pointerId);
      const r = box.getBoundingClientRect(),
        lr = lens.getBoundingClientRect(),
        offset = [e.clientX - lr.left, e.clientY - lr.top];
      function move(e) {
        const scale = r.width / box.clientWidth,
          x = Math.max(
            -20,
            Math.min(
              box.clientWidth - lens.clientWidth + 20,
              (e.clientX - r.left - offset[0]) / scale,
            ),
          ),
          y = Math.max(
            -20,
            Math.min(
              box.clientHeight - lens.clientHeight + 20,
              (e.clientY - r.top - offset[1]) / scale,
            ),
          );
        lens.style.left = x + "px";
        lens.style.top = y + "px";
        lens.setAttribute(
          "aria-valuenow",
          String(Math.round((x / box.clientWidth) * 100)),
        );
        labRenderer.update({ light: [e.clientX - r.left, e.clientY - r.top] });
      }
      function stop() {
        lens.removeEventListener("pointermove", move);
        lens.removeEventListener("pointerup", stop);
        lens.removeEventListener("pointercancel", stop);
      }
      lens.addEventListener("pointermove", move);
      lens.addEventListener("pointerup", stop);
      lens.addEventListener("pointercancel", stop);
    });
    lens.addEventListener("keydown", (e) => {
      if (!e.key.startsWith("Arrow")) return;
      e.preventDefault();
      let x = parseFloat(lens.style.left) || 85,
        y = parseFloat(lens.style.top) || 75;
      if (e.key === "ArrowLeft") x -= 10;
      if (e.key === "ArrowRight") x += 10;
      if (e.key === "ArrowUp") y -= 10;
      if (e.key === "ArrowDown") y += 10;
      lens.style.left =
        Math.max(0, Math.min(box.clientWidth - lens.clientWidth, x)) + "px";
      lens.style.top =
        Math.max(0, Math.min(box.clientHeight - lens.clientHeight, y)) + "px";
    });
    $$("[data-pattern]", panel).forEach((b) =>
      b.addEventListener("click", () => {
        pattern = b.dataset.pattern;
        $$("[data-pattern]", panel).forEach((x) =>
          x.classList.toggle("active", x === b),
        );
        drawTexture();
      }),
    );
    photo.onload = () => {
      if (pattern === "photo") drawTexture();
    };
  }
  function formatTime(sec) {
    sec = Math.max(0, Math.floor(sec));
    return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
  }
  function formatStopwatch(ms) {
    const cent = Math.floor(ms / 10);
    return (
      String(Math.floor(cent / 6000)).padStart(2, "0") +
      ":" +
      String(Math.floor(cent / 100) % 60).padStart(2, "0") +
      "." +
      String(cent % 100).padStart(2, "0")
    );
  }
  function toggleMusic() {
    return player.toggle();
  }

  function chooseTrack(index) {
    player.select(index);
  }

  function syncMusic() {
    if (active === "music" && panel) {
      $(".record-stage", panel)?.classList.toggle("playing", playing);
      const b = $(".play-main", panel);
      if (b) {
        b.innerHTML = uiIcon(playing ? "pause" : "play");
        b.setAttribute("aria-label", playing ? "暂停" : "播放");
      }
    }
    $$("[data-island-play],[data-control-play]").forEach(
      (b) => (b.innerHTML = uiIcon(playing ? "pause" : "play")),
    );
    $("#island").classList.toggle(
      "active",
      playing || musicTime > 0 || timer.running,
    );
  }
  function animateIsland(open) {
    const el = $("#island");
    islandSpring?.cancel();
    const from = el._islandPose || [108, 31, 13, 22],
      to = open
        ? [322, 161, 12, 32]
        : [el.classList.contains("active") ? 139 : 108, 31, 13, 22];
    el.style.transition = "none";
    const h = LiquidMotion.spring({
      from,
      to,
      stiffness: open ? 320 : 390,
      damping: open ? 27 : 32,
      speed: settings.speed,
      update: (pose) => {
        el._islandPose = pose;
        el.style.width = pose[0] + "px";
        el.style.height = pose[1] + "px";
        el.style.top = pose[2] + "px";
        el.style.borderRadius = pose[3] + "px";
      },
    });
    islandSpring = h;
  }
  function expandIsland(mode) {
    if (mode) islandMode = mode;
    if (!playing && !timer.running && musicTime === 0 && !mode)
      islandMode = "music";
    islandExpanded = true;
    $("#island").classList.add("expanded");
    renderIsland();
    animateIsland(true);
    clearTimeout(islandTimeout);
    islandTimeout = setTimeout(collapseIsland, 13000);
    motion("灵动岛 · 弹性展开");
  }
  function collapseIsland() {
    if (!islandExpanded) return;
    islandExpanded = false;
    $("#island").classList.remove("expanded");
    animateIsland(false);
    clearTimeout(islandTimeout);
  }

  function renderIsland() {
    const t = tracks[song];
    $("#islandExpanded").innerHTML =
      islandMode === "timer"
        ? `<span class="island-song"><span style="font-size:35px;color:#d5b77e">◷</span><span><b>${timer.running ? "倒计时进行中" : timer.remaining <= 0 ? "时间到了" : "计时器已暂停"}</b><small>专注眼前这一刻。</small></span></span><span class="island-actions"><b id="islandTimer" style="font:28px monospace;color:#d5b77e">${formatTime(timer.remaining)}</b><span data-island-open="clock" style="font-size:10px">打开计时器 ↗</span></span>`
        : `<span class="island-song"><span class="island-cover"></span><span><b>${t.title}</b><small>${t.sub}</small></span></span><span class="island-progress"><i id="islandProgress" style="width:${(musicTime / t.duration) * 100}%"></i></span><span class="island-actions"><small id="islandElapsed">${formatTime(musicTime)} / ${formatTime(t.duration)}</small><span data-island-open="music" style="font-size:10px;margin-left:auto;margin-right:20px">留声机 ↗</span><span data-island-play style="display:block;width:22px;height:22px">${uiIcon(playing ? "pause" : "play")}</span></span>`;
  }
  function updateIsland() {
    $("#island").classList.toggle(
      "active",
      playing || musicTime > 0 || timer.running,
    );
    if (islandExpanded) renderIsland();
    else animateIsland(false);
  }
  function setVolume(value) {
    player.setVolume(value);
    $("#volumeHud i").style.height = volume * 100 + "%";
    $("#volumeHud").classList.add("visible");
    clearTimeout(volumeJob);
    volumeJob = setTimeout(
      () => $("#volumeHud").classList.remove("visible"),
      1600,
    );
  }

  function chime() {
    if (settings.sound) player.chime();
  }

  function toggleStopwatch() {
    if (stopwatch.running) {
      stopwatch.elapsed += performance.now() - stopwatch.start;
      stopwatch.running = false;
    } else {
      stopwatch.start = performance.now();
      stopwatch.running = true;
    }
    refreshPanel();
  }
  function toggleTimer() {
    if (timer.running) {
      timer.remaining = Math.max(0, (timer.end - Date.now()) / 1000);
      timer.running = false;
    } else {
      const min = Number(
          $("#timerMinutes", panel)?.value ?? Math.floor(timer.remaining / 60),
        ),
        sec = Number($("#timerSeconds", panel)?.value ?? timer.remaining % 60);
      if (
        !Number.isFinite(min) ||
        !Number.isFinite(sec) ||
        min < 0 ||
        min > 99 ||
        sec < 0 ||
        sec > 59
      ) {
        toast("请输入 0–99 分钟和 0–59 秒");
        return;
      }
      timer.remaining = Math.floor(min * 60 + sec);
      if (timer.remaining <= 0) {
        toast("先设置一个计时时长");
        return;
      }
      timer.total = timer.remaining;
      timer.end = Date.now() + timer.remaining * 1000;
      timer.running = true;
      islandMode = "timer";
      expandIsland("timer");
    }
    updateIsland();
    if (active === "clock") refreshPanel();
  }
  const clockFormat = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const dateFormat = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  function updateLive() {
    const now = new Date();
    const displayedTime = clockFormat.format(now);
    const displayedDate = dateFormat.format(now);
    for (const element of [$("#statusTime"), $("#homeClock"), $("#lockTime")]) {
      if (element && element.textContent !== displayedTime)
        element.textContent = displayedTime;
    }
    for (const element of [$("#homeDate"), $("#lockDate")]) {
      if (element.textContent !== displayedDate)
        element.textContent = displayedDate;
    }
    musicTime = player.state.position;

    if (timer.running) {
      timer.remaining = Math.max(0, (timer.end - now.getTime()) / 1000);
      if (timer.remaining === 0) {
        timer.running = false;
        expandIsland("timer");
        chime();
        toast("计时结束");
        if (active === "clock") refreshPanel();
      }
    }
    if (active === "clock" && panel) {
      const elapsed =
        stopwatch.elapsed +
        (stopwatch.running ? performance.now() - stopwatch.start : 0);
      const watch = $("#stopwatchDisplay", panel);
      if (watch) watch.textContent = formatStopwatch(elapsed);
      if (timer.running) {
        const minutes = $("#timerMinutes", panel);
        const seconds = $("#timerSeconds", panel);
        const remaining = Math.ceil(timer.remaining);
        if (minutes) minutes.value = Math.floor(remaining / 60);
        if (seconds) seconds.value = remaining % 60;
      }
      const second = now.getUTCSeconds() + now.getMilliseconds() / 1000;
      const minute = now.getUTCMinutes() + second / 60;
      const hour = ((now.getUTCHours() + 8) % 12) + minute / 60;
      for (const [id, angle] of [
        ["secondHand", second * 6],
        ["minuteHand", minute * 6],
        ["hourHand", hour * 30],
      ]) {
        $("#" + id, panel)?.setAttribute(
          "transform",
          `rotate(${angle} 100 100)`,
        );
      }
    }
    if (active === "music" && panel) {
      const seek = $("#musicSeek", panel);
      if (seek && !seek.matches(":active")) seek.value = musicTime;
      const elapsed = $("#musicElapsed", panel);
      if (elapsed) elapsed.textContent = formatTime(musicTime);
    }
    if (islandExpanded) {
      const countdown = $("#islandTimer");
      const progress = $("#islandProgress");
      const elapsed = $("#islandElapsed");
      if (countdown)
        countdown.textContent = formatTime(Math.ceil(timer.remaining));
      if (progress)
        progress.style.width = (musicTime / tracks[song].duration) * 100 + "%";
      if (elapsed)
        elapsed.textContent =
          formatTime(musicTime) + " / " + formatTime(tracks[song].duration);
    }
  }
  function liveTick() {
    updateLive();
    const delay = active === "clock" && stopwatch.running ? 40 : 250;
    setTimeout(liveTick, document.hidden ? 1000 : delay);
  }
  setTimeout(liveTick, 250);

  function calc(key) {
    calculator.press(key);
    if (!panel || active !== "calculator") return;
    const output = $("#calcResult", panel);
    if (!output) return;
    output.textContent = calculator.value;
    output.style.fontSize = calculator.value.length > 10 ? "32px" : "48px";
    $("#calcHistory", panel).textContent = calculator.history || " ";
  }
  const evaluate = LiquidApplications.evaluate;
  function sendMessage() {
    const input = $("#messageText", panel),
      text = input?.value.trim();
    if (!text) return;
    const id = nav.at(-1).detail;
    chats[id] ??= [];
    chats[id].push({ text, mine: true });
    save("chats", chats);
    input.value = "";
    appendBubble(text, true);
    if (id !== "self")
      setTimeout(() => {
        const response = /你好|hi|hello/i.test(text)
          ? "你好呀。今天过得怎么样？"
          : /周末|湖|走走/.test(text)
            ? "好呀，就这么说定了。记得带上相机。"
            : /玻璃|设计|动画/.test(text)
              ? "细节决定手感。再试试慢放，看看转场怎么衔接。"
              : /谢谢/.test(text)
                ? "不用客气，下次再聊。"
                : "收到，记下了。慢慢来，不着急。";
        chats[id].push({ text: response, mine: false });
        save("chats", chats);
        if (active === "messages" && nav.at(-1).detail === id)
          appendBubble(response, false);
        else toast(contacts.find((c) => c.id === id).name + " 发来一条消息");
      }, 850);
  }
  function appendBubble(text, mine) {
    const box = $(".chat-messages", panel),
      b = document.createElement("div");
    b.className = "bubble" + (mine ? " mine" : "");
    b.textContent = text;
    box.append(b);
    b.animate(
      [
        { transform: "translateY(12px) scale(.9)", opacity: 0 },
        { transform: "none", opacity: 1 },
      ],
      { duration: 300, easing: "ease-out" },
    );
    box.scrollTop = box.scrollHeight;
  }
  let backdropJob = null,
    backdropRequest = 0,
    pendingBackdrop = null;
  const connectionStates = {
    wifi: true,
    bluetooth: true,
    airplane: false,
    signal: true,
  };
  let screenBrightness = 100;
  function sceneKey() {
    return active
      ? [active, JSON.stringify(nav.at(-1))].join(":")
      : "home:" + settings.wall;
  }
  function fallbackBackdrop() {
    const canvas = document.createElement("canvas");
    canvas.width = 354;
    canvas.height = 786;
    const ctx = canvas.getContext("2d");
    const wallpaper = $("#wallpaperBase");
    if (wallpaper?.naturalWidth) {
      const scale = Math.max(
        canvas.width / wallpaper.naturalWidth,
        canvas.height / wallpaper.naturalHeight,
      );
      const w = wallpaper.naturalWidth * scale,
        h = wallpaper.naturalHeight * scale;
      ctx.drawImage(
        wallpaper,
        (canvas.width - w) / 2,
        (canvas.height - h) / 2,
        w,
        h,
      );
    }
    const backdrop = $("#optics");
    ctx.drawImage(backdrop._fallbackCanvas || backdrop, 0, 0, 354, 786);
    if (active && panel) {
      const background = getComputedStyle(panel).backgroundColor;
      if (
        background &&
        background !== "transparent" &&
        background !== "rgba(0, 0, 0, 0)"
      ) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, 354, 786);
      }
    }
    return canvas;
  }
  function captureBackdrop() {
    const key = sceneKey();
    if (pendingBackdrop?.key === key) return pendingBackdrop.promise;
    if (!window.html2canvas) return Promise.resolve(fallbackBackdrop());
    const request = ++backdropRequest;
    const excluded = new Set([
      "systemOverlay",
      "island",
      "phoneToast",
      "volumeHud",
      "tasksLayer",
    ]);
    const promise = html2canvas(screen, {
      scale: 1,
      width: 354,
      height: 786,
      backgroundColor: null,
      logging: false,
      useCORS: true,
      ignoreElements: (el) =>
        excluded.has(el.id) ||
        el.matches(".status-bar,.home-gesture,.control-pull-zone,.edge-zone"),
      onclone(doc) {
        const phone = doc.getElementById("phone");
        if (phone) phone.style.transform = "none";
        doc.getElementById("screen")?.classList.remove("control-open");
        const home = doc.getElementById("homeScreen");
        if (home)
          Object.assign(home.style, {
            transition: "none",
            transform: "none",
            filter: "none",
            opacity: "1",
          });
        doc.querySelectorAll("#appLayer .app-panel").forEach((app) => {
          Object.assign(app.style, {
            transform: "none",
            borderRadius: "0",
            visibility: "visible",
          });
          const content = app.querySelector(".app-content");
          if (content)
            Object.assign(content.style, {
              transform: "none",
              filter: "none",
              opacity: "1",
            });
          app.querySelector(".app-morph-icon")?.remove();
        });
      },
    })
      .then((canvas) => {
        if (request === backdropRequest) controlBackdrop = { key, canvas };
        return canvas;
      })
      .catch(() => fallbackBackdrop())
      .finally(() => {
        if (request === backdropRequest) pendingBackdrop = null;
      });
    pendingBackdrop = { key, promise };
    return promise;
  }
  function queueBackdrop() {
    clearTimeout(backdropJob);
    backdropJob = setTimeout(() => {
      if (!controlSession && !tasks) captureBackdrop();
    }, 180);
  }
  function showControl({ interactive = false } = {}) {
    if (controlSession) {
      if (!interactive) settleControl(true);
      return;
    }
    collapseIsland();
    const source =
      controlBackdrop?.key === sceneKey()
        ? controlBackdrop.canvas
        : fallbackBackdrop();
    const session = new ControlSheet(
      $("#systemOverlay"),
      {
        title: tracks[song].title,
        playing,
        connections: connectionStates,
        brightness: screenBrightness,
        volume: Math.round(volume * 100),
        ...settings,
      },
      source,
    );
    controlSession = session;
    screen.classList.add("control-open");
    setStatus();
    captureBackdrop().then((shot) => {
      if (session === controlSession) session.glass.setSource(shot);
    });
    if (!interactive) settleControl(true);
    motion("控制中心");
  }
  function setControlProgress(value, velocity = 0) {
    controlSession?.paint(value, velocity);
  }
  function settleControl(open, velocity = 0) {
    const session = controlSession;
    if (!session) return;
    session.settle(open, velocity, settings.speed, () => {
      if (session !== controlSession) return;
      if (open) session.paint(1);
      else destroyControl();
    });
  }
  function destroyControl() {
    const session = controlSession;
    if (!session) return;
    controlSession = null;
    session.destroy();
    screen.classList.remove("control-open");
    setStatus();
  }

  function showSearch() {
    collapseIsland();
    $("#systemOverlay").innerHTML =
      `<section class="search-overlay"><input class="search-input" id="appSearch" placeholder="搜索应用" aria-label="搜索应用"><div id="searchResults"></div><button data-act="overlay-close" style="display:block;margin:18px auto;font-size:11px">取消</button></section>`;
    filterApps("");
    $("#appSearch").focus();
  }
  function filterApps(q) {
    $("#searchResults").innerHTML =
      apps
        .filter((a) => a.name.includes(q) || a.id.includes(q.toLowerCase()))
        .map(
          (a) =>
            `<button class="search-result" data-open="${a.id}">${icon(a.id)}${a.name}<span>↗</span></button>`,
        )
        .join("") ||
      '<div class="empty-state" style="color:#ced9c1">没有找到这个应用</div>';
  }
  function lock() {
    closeOverlay();
    collapseIsland();
    locked = true;
    $("#lockScreen").classList.add("visible");
    setStatus();
  }
  function unlock() {
    locked = false;
    $("#lockScreen").classList.remove("visible");
    setStatus();
    motion("屏幕已解锁");
  }
  // All controls route through a small, explicit action table.
  const actions = {
    back,
    "new-note": () => {
      const n = { id: Date.now(), title: "", body: "", time: "今天" };
      notes.unshift(n);
      save("notes", notes);
      navigate({ detail: n.id });
      setTimeout(() => {
        if (active === "notes" && nav.at(-1).detail === n.id)
          $("#noteTitle", panel)?.focus();
      }, 250);
    },
    "delete-note": () => {
      notes = notes.filter((n) => n.id !== nav.at(-1).detail);
      save("notes", notes);
      navigate(null, true);
      toast("笔记已删除");
    },
    "photo-filter": () => {
      photosFilter = photosFilter === "all" ? "favorites" : "all";
      refreshPanel();
    },
    "photo-prev": () => {
      nav[nav.length - 1] = { detail: (nav.at(-1).detail + 5) % 6 };
      refreshPanel();
    },
    "photo-next": () => {
      nav[nav.length - 1] = { detail: (nav.at(-1).detail + 1) % 6 };
      refreshPanel();
    },
    favorite: () => {
      const i = nav.at(-1).detail;
      favorites = favorites.includes(i)
        ? favorites.filter((x) => x !== i)
        : [...favorites, i];
      save("favorites", favorites);
      refreshPanel();
    },
    "download-photo": () => {
      const i = nav.at(-1).detail,
        a = document.createElement("a");
      a.href = `assets/photo-${i}.jpg`;
      a.download = photoNames[i] + ".jpg";
      a.click();
      toast("照片已下载");
    },
    "music-play": toggleMusic,
    "music-next": () => chooseTrack(song + 1),
    "music-prev": () => chooseTrack(song - 1),
    "music-favorite": () => {
      let ids = read("likedSongs", []);
      const liked = ids.includes(song);
      ids = liked ? ids.filter((i) => i !== song) : [...ids, song];
      save("likedSongs", ids);
      refreshPanel();
      toast(liked ? "已取消收藏" : "已收藏这首音乐");
    },
    "calc-copy": async () => {
      try {
        await navigator.clipboard.writeText(calculator.value);
        toast("已复制 " + calculator.value);
      } catch {
        toast("结果：" + calculator.value);
      }
    },
    "stopwatch-toggle": toggleStopwatch,
    "stopwatch-lap": () => {
      if (stopwatch.running)
        stopwatch.laps.unshift(
          stopwatch.elapsed + performance.now() - stopwatch.start,
        );
      else {
        stopwatch.elapsed = 0;
        stopwatch.laps = [];
      }
      refreshPanel();
    },
    "timer-toggle": toggleTimer,
    "timer-reset": () => {
      timer = { running: false, end: 0, remaining: 300, total: 300 };
      updateIsland();
      refreshPanel();
    },
    about: () => navigate({ about: true }),
    "open-guide": () => $("#guide").showModal(),
    "overlay-close": closeOverlay,
    night: () => {
      settings.night = !settings.night;
      applySettings();
      persistSettings();
      if ($("#ccNightLabel"))
        $("#ccNightLabel").textContent = settings.night ? "已开启" : "已关闭";
      controlSession?.glass?.impulse(0.8);
    },
    mute: () => {
      settings.sound = !settings.sound;
      persistSettings();
      if ($("#ccSoundLabel"))
        $("#ccSoundLabel").textContent = settings.sound ? "已开启" : "已静音";
      controlSession?.glass?.impulse(0.8);
    },
    lock,
  };
  document.addEventListener("click", (e) => {
    if (window.suppressClickUntil > performance.now()) return;
    const open = e.target.closest("[data-open]");
    if (open) {
      if (open.dataset.open === "clock" && open.closest(".control-center"))
        clockTab = "timer";
      openApp(open.dataset.open, { source: open });
      return;
    }
    const a = e.target.closest("[data-act]");
    if (a && actions[a.dataset.act]) {
      actions[a.dataset.act]();
      return;
    }
    const note = e.target.closest("[data-note]");
    if (note) {
      navigate({ detail: Number(note.dataset.note) });
      return;
    }
    const photo = e.target.closest("[data-photo]");
    if (photo) {
      navigate({ detail: Number(photo.dataset.photo) });
      panel.classList.add("photo-detail");
      return;
    }
    const contact = e.target.closest("[data-contact]");
    if (contact) {
      navigate({ detail: contact.dataset.contact });
      return;
    }
    const city = e.target.closest("[data-city]");
    if (city) {
      cityIndex = Number(city.dataset.city);
      const place = cities[cityIndex];
      $(".weather-peek b").textContent = place.temp + "°";
      $(".weather-peek small").textContent = place.desc + " · " + place.name;
      $(".sun-mini").innerHTML = uiIcon(place.desc === "晴" ? "sun" : "cloud");
      refreshPanel();
      return;
    }
    const track = e.target.closest("[data-track]");
    if (track) {
      chooseTrack(Number(track.dataset.track));
      return;
    }
    const c = e.target.closest("[data-calc]");
    if (c) {
      calc(c.dataset.calc);
      return;
    }
    const ct = e.target.closest("[data-clocktab]");
    if (ct) {
      clockTab = ct.dataset.clocktab;
      refreshPanel();
      return;
    }
    const setting = e.target.closest("[data-setting]");
    if (setting) {
      const k = setting.dataset.setting;
      settings[k] = !settings[k];
      persistSettings();
      applySettings();
      refreshPanel();
      return;
    }
    const wall = e.target.closest("[data-wall]");
    if (wall) {
      settings.wall = wall.dataset.wall;
      applySettings();
      persistSettings();
      $$("[data-wall]").forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(b.dataset.wall === settings.wall),
        ),
      );
      return;
    }
    const mat = e.target.closest("[data-material]");
    if (mat) {
      settings.material = mat.dataset.material;
      applySettings();
      persistSettings();
      return;
    }
    const conn = e.target.closest("[data-connect]");
    if (conn) {
      const on = conn.classList.toggle("on");
      connectionStates[conn.dataset.connect] = on;
      conn.setAttribute("aria-pressed", String(on));
      controlSession?.glass?.impulse(1.15);
      toast(
        conn.getAttribute("aria-label") +
          (conn.classList.contains("on") ? "已开启（模拟）" : "已关闭（模拟）"),
      );
      return;
    }
    if (e.target.closest("[data-control-play]")) {
      toggleMusic();
      return;
    }
  });
  document.addEventListener("input", (e) => {
    const el = e.target;
    if (el.id === "refraction" || el.id === "depth" || el.dataset.labSlider) {
      const k = el.dataset.labSlider || el.id;
      settings[k] = Number(el.value);
      applySettings();
      persistSettings();
      if (panel && $("#labRefractionValue", panel))
        $("#labRefractionValue", panel).value = settings.refraction + "%";
      if (panel && $("#labDepthValue", panel))
        $("#labDepthValue", panel).value = settings.depth + "%";
    }
    if (el.id === "noteTitle" || el.id === "noteBody") {
      const n = notes.find((n) => n.id === nav.at(-1).detail);
      if (n) {
        n.title = $("#noteTitle", panel).value;
        n.body = $("#noteBody", panel).value;
        n.time = "今天";
        save("notes", notes);
      }
    }
    if (el.id === "appSearch") filterApps(el.value.trim());
    if (el.id === "musicSeek") player.seek(Number(el.value));
    if (el.id === "controlVolume") {
      setVolume(Number(el.value) / 100);
      if ($("#volumeFill")) $("#volumeFill").style.height = el.value + "%";
      controlSession?.glass?.impulse(0.12);
    }
    if (el.id === "brightness") {
      screenBrightness = Number(el.value);
      if ($("#brightnessFill"))
        $("#brightnessFill").style.height = el.value + "%";
      screen.style.setProperty("--screen-brightness", Number(el.value) / 100);
    }
  });
  document.addEventListener("change", (e) => {
    if (e.target.id === "motionSpeed") {
      settings.speed = Number(e.target.value);
      applySettings();
      persistSettings();
      toast("动效速度已调整");
    }
    if (e.target.id === "materialSelect") {
      settings.material = e.target.value;
      applySettings();
      persistSettings();
    }
  });
  document.addEventListener("submit", (e) => {
    if (e.target.id === "chatForm") {
      e.preventDefault();
      sendMessage();
    }
  });
  $("#island").addEventListener("click", (e) => {
    e.stopPropagation();
    if (window.suppressClickUntil > performance.now()) return;
    if (e.target.closest("[data-island-play]")) {
      toggleMusic();
      renderIsland();
      return;
    }
    const open = e.target.closest("[data-island-open]");
    if (open) {
      if (open.dataset.islandOpen === "clock") clockTab = "timer";
      openApp(open.dataset.islandOpen);
      return;
    }
    if (islandExpanded) collapseIsland();
    else expandIsland(timer.running ? "timer" : "music");
  });
  $("#guideBtn").onclick = () => $("#guide").showModal();
  $("#closeGuide").onclick = () => $("#guide").close();
  $("#startExploring").onclick = () => $("#guide").close();
  $("#guide").addEventListener("click", (e) => {
    if (e.target === $("#guide")) {
      const r = $("#guide").getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        $("#guide").close();
    }
  });
  $("#demoTasks").onclick = () => showTasks();
  $("#demoIsland").onclick = () => expandIsland("music");
  $("#controlBtn").onclick = () => showControl();
  $("#searchBtn").onclick = showSearch;
  $("#powerKey").onclick = () => (locked ? unlock() : lock());
  $("#lockScreen").onclick = unlock;
  $("#volumeUp").onclick = () => setVolume(volume + 0.1);
  $("#volumeDown").onclick = () => setVolume(volume - 0.1);
  $("#actionKey").onclick = () => {
    settings.sound = !settings.sound;
    persistSettings();
    toast(settings.sound ? "提示音已开启" : "静音模式");
  };
  $("#highlightToggle").onclick = () => {
    settings.highlight = !settings.highlight;
    applySettings();
    persistSettings();
  };
  $("#clearTasks").onclick = () => {
    if (playing) toggleMusic();
    windowHistory.clear();
    $("#tasksTrack").innerHTML =
      '<div class="empty-state" style="color:#cbd8b9">后台已清空<br>点击空白处回到桌面</div>';
    toast("后台应用已清空");
  };
  $("#tasksLayer").addEventListener("click", (e) => {
    if (e.target.id === "tasksLayer" || e.target.id === "tasksTrack")
      hideTasks();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      back();
      return;
    }
    if (e.target.matches("input,textarea,select") || $("#guide").open) return;
    if (e.key.toLowerCase() === "h") {
      e.preventDefault();
      if (locked) unlock();
      else goHome();
    }
    if (e.key.toLowerCase() === "m") {
      e.preventDefault();
      tasks ? hideTasks() : showTasks();
    }
    if (active === "calculator") {
      const k =
        { Enter: "=", Backspace: "AC", "*": "×", "/": "÷", "-": "−" }[e.key] ||
        e.key;
      if (/^[\d.+%=]$/.test(k) || ["AC", "×", "÷", "−"].includes(k)) {
        e.preventDefault();
        calc(k);
      }
    }
  });

  function beginGesture(g) {
    if (g.type === "control") {
      if (controlSession) {
        controlSession.animation?.cancel();
        g.startProgress = controlSession.progress;
      } else showControl({ interactive: true });
      return;
    }
    if (!panel || tasks) return;
    g.owner = panel;
    g.startRect = surfaces.interrupt(panel);
    if (g.type === "home" && launchIcon) launchIcon.style.opacity = "1";
    if (g.type !== "edge") return;
    if (nav.length > 1) {
      g.previous = buildPanel(active, nav.at(-2));
      g.previous.inert = true;
      g.previous.style.transform = "translateX(-90px)";
      layer.insertBefore(g.previous, panel);
    } else home.classList.remove("behind");
  }

  function dragGesture(g) {
    if (g.type === "control" && controlSession) {
      const p = g.startProgress + g.dy / 300;
      setControlProgress(
        Math.max(0, p > 1 ? 1 + (p - 1) * 0.18 : p),
        g.vy / 0.3,
      );
      return;
    }
    if (!panel || panel !== g.owner || tasks) return;
    if (g.type === "home") {
      const pose = LiquidGestures.homeFrame(g.dx, g.dy, g.startRect);
      surfaces.draw(panel, pose);
      home.classList.remove("behind");
      const progress = clamp(-g.dy / 350);
      home.style.transform = `scale(${0.945 + progress * 0.055})`;
      home.style.filter = `blur(${(1 - progress) * 2}px)`;
    } else if (g.type === "edge") {
      const dx = Math.max(0, g.dx),
        progress = clamp(dx / 354);
      const [x, y, w, h, r] = g.startRect;
      surfaces.draw(panel, [
        x + dx,
        y + progress * 10,
        w,
        h - progress * 20,
        Math.max(r, progress * 25),
      ]);
      panel.style.boxShadow = "-12px 0 30px #0002";
      if (g.previous)
        g.previous.style.transform = `translateX(${-90 + progress * 90}px)`;
    }
  }

  function settleHomeGesture(g, cancelled) {
    const current = panel;
    const frame = surfaces.pose(current);
    const velocity = LiquidGestures.frameVelocity(g);
    switch (LiquidGestures.homeDestination(g, cancelled)) {
      case "tasks":
        showTasks({ fromRect: frame, velocity });
        return;
      case "home":
        closeToHome(frame, velocity);
        return;
    }
    home.classList.add("behind");
    const flight = appRectMotion(current, frame, FULL_RECT, {
      velocity,
      stiffness: 330,
      damping: 28,
    });
    anim = flight;
    flight.finished
      .then(() => {
        if (current === panel) finishPanelMotion(current);
        if (anim === flight) anim = null;
      })
      .catch(() => {});
  }

  function settleEdgeGesture(g, cancelled) {
    const old = panel;
    const previous = g.previous;
    const dx = Math.max(0, g.dx);
    const complete = !cancelled && dx + g.vx * 100 > 125;
    if (!previous && complete) {
      closeToHome(surfaces.pose(old), [g.vx * 1000, 0, 0, 0, 0]);
      return;
    }
    const target = complete ? [380, 8, 354, 770, 24] : FULL_RECT;
    const flight = appRectMotion(old, surfaces.pose(old), target, {
      velocity: [g.vx * 1000, 0, 0, 0, 0],
      stiffness: 310,
      damping: 32,
    });
    anim = flight;
    if (!previous) home.classList.add("behind");
    if (previous) {
      appRectMotion(
        previous,
        [-90 + clamp(dx / 354) * 90, 0, 354, 786, 0],
        complete ? FULL_RECT : [-90, 0, 354, 786, 0],
      );
      if (complete) {
        nav.pop();
        panel = previous;
        previous.inert = false;
        attachPanel();
        setStatus();
      }
    }
    const discard = complete ? old : previous;
    flight.finished
      .then(() => {
        discard?.remove();
        if (anim !== flight) return;
        anim = null;
        if (panel) finishPanelMotion(panel);
        queueBackdrop();
      })
      .catch(() => {
        discard?.remove();
      });
  }

  LiquidGestures.bind({
    screen,
    width: 354,
    height: 786,
    readState: () => ({
      app: active,
      tasks,
      locked,
      control: controlSession,
      overlay: $("#systemOverlay").childElementCount,
      pose: surfaces.pose(panel),
    }),
    begin: beginGesture,
    drag: dragGesture,
    release(g, cancelled) {
      home.style.transform = "";
      home.style.filter = "";
      if (g.type === "control" && controlSession) {
        const open = cancelled
          ? g.startProgress > 0.5
          : controlSession.progress + g.vy * 0.3 > 0.36;
        settleControl(open, clamp(g.vy / 0.3, -5, 5));
        return;
      }
      if (locked) {
        if (!cancelled && g.dy < -40) unlock();
        return;
      }
      if (tasks) {
        if (!cancelled && g.type === "home" && g.dy < -30) hideTasks();
        return;
      }
      if (!panel || panel !== g.owner) {
        g.previous?.remove();
        return;
      }
      if (g.type === "home") settleHomeGesture(g, cancelled);
      if (g.type === "edge") settleEdgeGesture(g, cancelled);
    },
    tap(g) {
      if (g.type !== "home") return;
      window.suppressClickUntil = performance.now() + 300;
      if (locked) unlock();
      else goHome();
    },
  });
  screen.addEventListener("contextmenu", (e) => e.preventDefault());
  // A deliberately small inspection API for nonvisual functional checks.
  window.LiquidLab = {
    open: openApp,
    home: goHome,
    back,
    tasks: showTasks,
    calc,
    evaluate,
    control: showControl,
    getState: () => ({
      control: controlSession
        ? {
            progress: controlSession.progress,
            velocity: controlSession.velocity,
          }
        : null,
      pose: panel ? surfaces.pose(panel) : null,
      active,
      nav: JSON.parse(JSON.stringify(nav)),
      tasks,
      notes: JSON.parse(JSON.stringify(notes)),
      favorites: [...favorites],
      settings: { ...settings },
      playing,
      timer: { ...timer },
      recents: windowHistory.list(),
    }),
  };
  updateLive();
  queueBackdrop();
})();
