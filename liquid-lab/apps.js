/* Application views own their markup. The window manager only supplies a route and mounts the result. */
(() => {
  "use strict";

  function escape(value) {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return String(value ?? "").replace(
      /[&<>"']/g,
      (character) => entities[character],
    );
  }

  function header(title, action = "", detail = false) {
    if (detail) {
      return `<header class="app-header detail-header">
        <button class="back-button" data-act="back">返回</button>
        <strong>${escape(title)}</strong>${action || "<span></span>"}
      </header>`;
    }
    return `<header class="app-header"><h2>${escape(title)}</h2>${action || "<span></span>"}</header>`;
  }

  function actionButton(action, label, attrs = "") {
    return `<button data-act="${action}" ${attrs}>${label}</button>`;
  }

  function time(seconds) {
    const whole = Math.max(0, Math.floor(seconds));
    return Math.floor(whole / 60) + ":" + String(whole % 60).padStart(2, "0");
  }

  function notesView(view, state) {
    if (view.detail != null) {
      return (
        header("备忘录", actionButton("delete-note", "删除"), true) +
        `
        <div class="note-editor">
          <input id="noteTitle" aria-label="笔记标题" placeholder="标题">
          <textarea id="noteBody" aria-label="笔记内容" placeholder="开始书写…"></textarea>
          <small class="saved-label" id="savedLabel">已自动保存到本机</small>
        </div>`
      );
    }
    const rows = state.notes
      .map((note) => {
        const preview = note.body.split("\n").filter(Boolean).join(" ");
        return `<button class="note-card" data-note="${note.id}">
        <b>${escape(note.title || "无标题")}</b>
        <small><time>${escape(note.time)}</time>${escape(preview)}</small>
      </button>`;
      })
      .join("");
    return (
      header("备忘录", actionButton("new-note", "＋ 新建")) +
      `
      <div class="app-scroll notes-index">
        <p class="app-context">所有笔记 <span>${state.notes.length} 则</span></p>
        <div class="notes-list">${rows || '<p class="empty-state">还没有笔记，点右上角新建。</p>'}</div>
      </div>`
    );
  }

  function photosView(view, state) {
    if (view.detail != null) {
      const index = view.detail;
      const liked = state.favorites.includes(index);
      return (
        header(state.photoNames[index], "", true) +
        `
        <img class="photo-detail-image" src="assets/photo-${index}.jpg" alt="${state.photoNames[index]}">
        <div class="photo-description">${String(index + 1).padStart(2, "0")} / ${String(state.photoNames.length).padStart(2, "0")}</div>
        <div class="photo-toolbar">
          ${actionButton("photo-prev", "‹", 'aria-label="上一张"')}
          ${actionButton("favorite", liked ? "♥" : "♡", `aria-label="收藏照片" aria-pressed="${liked}" class="${liked ? "liked" : ""}"`)}
          ${actionButton("download-photo", "↓", 'aria-label="下载照片"')}
          ${actionButton("photo-next", "›", 'aria-label="下一张"')}
        </div>`
      );
    }
    const all = state.photosFilter === "all";
    const indices = state.photoNames
      .map((_, i) => i)
      .filter((i) => all || state.favorites.includes(i));
    const pictures = indices
      .map(
        (index) => `
      <button data-photo="${index}" aria-label="查看${state.photoNames[index]}">
        <img src="assets/photo-${index}.jpg" alt="${state.photoNames[index]}" loading="lazy">
        <span class="photo-name">${state.photoNames[index]}</span>
        ${state.favorites.includes(index) ? '<span class="photo-favorite">♥</span>' : ""}
      </button>`,
      )
      .join("");
    return (
      header(
        "相册",
        actionButton("photo-filter", all ? "我的收藏" : "全部照片"),
      ) +
      `
      <div class="app-scroll photo-index"><p class="app-context">${all ? "山野之间" : "我的收藏"} <span>${indices.length} 张照片</span></p>
      <div class="photos-grid">${pictures}</div>
      ${pictures ? "" : '<p class="empty-state">打开一张照片，轻触爱心即可收藏。</p>'}</div>`
    );
  }

  function messagesView(view, state) {
    if (view.detail) {
      const contact = state.contacts.find(
        (person) => person.id === view.detail,
      );
      const bubbles = (state.chats[contact.id] || [])
        .map(
          (message) =>
            `<div class="bubble ${message.mine ? "mine" : ""}">${escape(message.text)}</div>`,
        )
        .join("");
      return (
        header(
          contact.name,
          '<small class="chat-mode">本地对话</small>',
          true,
        ) +
        `
        <div class="chat-messages">${bubbles}</div>
        <form class="chat-input" id="chatForm">
          <input id="messageText" placeholder="输入消息…" aria-label="消息内容" autocomplete="off">
          <button type="submit" aria-label="发送">↑</button>
        </form>`
      );
    }
    const people = state.contacts
      .map(
        (person) => `
      <button class="chat-row" data-contact="${person.id}">
        <span class="avatar">${person.initial}</span>
        <div><b>${person.name}</b><small>${escape(state.chats[person.id]?.at(-1)?.text || person.intro)}</small></div>
        <span class="chat-time" aria-hidden="true">›</span>
      </button>`,
      )
      .join("");
    return (
      header("消息") +
      `<div class="app-scroll message-index">
      <p class="app-context">会话 <span>${state.contacts.length} 个</span></p>${people}
      <p class="app-disclosure">模拟对话在本机自动回复。</p></div>`
    );
  }

  function weatherView(view, state) {
    const city = state.cities[state.cityIndex];
    const cities = state.cities
      .map(
        (place, index) => `
      <button data-city="${index}" aria-pressed="${index === state.cityIndex}" class="${index === state.cityIndex ? "active" : ""}">${place.name}</button>`,
      )
      .join("");
    const now = new Date();
    const localHour = Number(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Shanghai",
        hour: "2-digit",
        hourCycle: "h23",
      }).format(now),
    );
    const weekday = new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Shanghai",
      weekday: "short",
    });
    const hours = [0, 1, 2, 1, 0]
      .map(
        (
          delta,
          index,
        ) => `<div>${index ? ((localHour + index) % 24) + "时" : "现在"}
      ${uiIcon(index % 3 === 2 ? "cloud" : "sun")}<b>${city.temp + delta}°</b></div>`,
      )
      .join("");
    const days = Array.from(
      { length: 5 },
      (_, index) => `<div class="forecast-row">
      <span>${index ? weekday.format(new Date(now.getTime() + index * 86400000)) : "今天"}</span>
      ${uiIcon(index % 2 ? "cloud" : "sun")}<span>${city.lo + (index % 3)}°</span><i class="bar"></i><span>${city.hi - (index % 3)}°</span>
    </div>`,
    ).join("");
    return (
      header("天气") +
      `<div class="app-scroll weather-scroll">
      <div class="city-picker">${cities}</div>
      <div class="weather-hero"><h3>${city.name}</h3><div class="temperature">${city.temp}°</div>
        <p>${city.desc}</p><small>最高 ${city.hi}°　最低 ${city.lo}°</small></div>
      <section class="weather-card glass"><small>逐小时预报</small><div class="hourly">${hours}</div></section>
      <section class="weather-card glass"><small>未来五天</small>${days}</section>
      <div class="weather-metrics"><div class="weather-card glass"><small>湿度</small>${city.humidity}%</div>
        <div class="weather-card glass"><small>风速</small>${city.wind} <small class="inline-unit">km/h</small></div></div>
      <p class="app-disclosure">示例天气数据</p></div>`
    );
  }

  function musicView(view, state) {
    const track = state.tracks[state.song];
    const list = state.tracks
      .map(
        (song, index) => `
      <button class="music-track ${index === state.song ? "active" : ""}" data-track="${index}">
        <span class="track-no">${String(index + 1).padStart(2, "0")}</span>${song.title}<small>${time(song.duration)}</small>
      </button>`,
      )
      .join("");
    return (
      header(
        "留声机",
        actionButton(
          "music-favorite",
          state.likedSongs.includes(state.song) ? "已收藏" : "收藏",
        ),
      ) +
      `
      <div class="app-scroll music-scroll">
        <div class="record-stage ${state.playing ? "playing" : ""}"><div class="vinyl"><div class="vinyl-label"></div></div><div class="tonearm"></div></div>
        <div class="song-meta"><h3 id="songTitle">${track.title}</h3><p id="songSubtitle">${track.sub}</p></div>
        <div class="music-progress"><input id="musicSeek" type="range" min="0" max="${track.duration}" value="${state.musicTime}" aria-label="播放进度">
          <div class="music-times"><span id="musicElapsed">${time(state.musicTime)}</span><span id="musicDuration">${time(track.duration)}</span></div></div>
        <div class="music-controls">${actionButton("music-prev", uiIcon("prev"), 'aria-label="上一首"')}
          ${actionButton("music-play", uiIcon(state.playing ? "pause" : "play"), `class="play-main" aria-label="${state.playing ? "暂停" : "播放"}"`)}
          ${actionButton("music-next", uiIcon("next"), 'aria-label="下一首"')}</div>
        <div class="music-list">${list}</div></div>`
    );
  }

  function calculatorView(view, state) {
    const operators = ["÷", "×", "−", "+"];
    const keys = [
      "AC",
      "±",
      "%",
      "÷",
      "7",
      "8",
      "9",
      "×",
      "4",
      "5",
      "6",
      "−",
      "1",
      "2",
      "3",
      "+",
      "0",
      ".",
      "=",
    ]
      .map((key) => {
        const type = operators.includes(key)
          ? "operator"
          : { "=": "equal", 0: "zero" }[key] || "";
        return `<button data-calc="${key}" class="${type}">${key}</button>`;
      })
      .join("");
    return (
      header("计算器", actionButton("calc-copy", "复制")) +
      `
      <div class="calc-display"><div class="calc-history" id="calcHistory">${escape(state.calcLast || " ")}</div>
        <div class="calc-result" id="calcResult">${escape(state.calcValue)}</div></div><div class="calc-keys">${keys}</div>`
    );
  }

  const clockFace = (() => {
    const marks = Array.from({ length: 60 }, (_, index) => {
      const major = index % 5 === 0;
      return `<path d="M100 9v${major ? 9 : 3}" transform="rotate(${index * 6} 100 100)" stroke="${major ? "#444139" : "#a6a197"}" stroke-width="${major ? 1.8 : 1}"/>`;
    }).join("");
    return `<div class="analog-clock"><svg viewBox="0 0 200 200" aria-hidden="true">${marks}
      <g fill="#514d46" font-size="16" text-anchor="middle" font-family="Georgia,serif"><text x="100" y="38">12</text><text x="164" y="106">3</text><text x="100" y="172">6</text><text x="36" y="106">9</text></g>
      <g stroke-linecap="round"><path id="hourHand" d="M100 104V61" stroke="#393936" stroke-width="5"/>
      <path id="minuteHand" d="M100 110V30" stroke="#393936" stroke-width="3"/>
      <path id="secondHand" d="M100 117V24" stroke="#af483b" stroke-width="1.4"/></g>
      <circle cx="100" cy="100" r="4" fill="#af483b"/></svg></div>`;
  })();

  function clockView(view, state) {
    const isWatch = state.clockTab === "stopwatch";
    const tabs = [
      ["stopwatch", "秒表"],
      ["timer", "计时器"],
    ]
      .map(
        ([id, name]) =>
          `<button data-clocktab="${id}" aria-pressed="${id === state.clockTab}" class="${id === state.clockTab ? "active" : ""}">${name}</button>`,
      )
      .join("");
    const watch = state.stopwatch;
    const timer = state.timer;
    let body;
    if (isWatch) {
      const laps = watch.laps
        .map(
          (value, index) =>
            `<div><span>计次 ${watch.laps.length - index}</span><span>${state.formatStopwatch(value)}</span></div>`,
        )
        .join("");
      body = `<div class="stopwatch-readout" id="stopwatchDisplay">00:00.00</div>
        <div class="clock-actions">${actionButton("stopwatch-lap", watch.running ? "计次" : "复位")}
          ${actionButton("stopwatch-toggle", watch.running ? "暂停" : "开始", 'class="start"')}</div>
        <div class="laps" id="laps">${laps}</div>`;
    } else {
      const remaining = Math.ceil(timer.remaining);
      const disabled = timer.running ? "disabled" : "";
      body = `<div class="timer-inputs">
        <input id="timerMinutes" type="number" min="0" max="99" aria-label="分钟" value="${Math.floor(remaining / 60)}" ${disabled}><span>:</span>
        <input id="timerSeconds" type="number" min="0" max="59" aria-label="秒" value="${remaining % 60}" ${disabled}></div>
        <div class="clock-actions">${actionButton("timer-reset", "取消")}
          ${actionButton("timer-toggle", timer.running ? "暂停" : "开始", 'class="start"')}</div>`;
    }
    return (
      header("时钟") +
      `<div class="clock-tabs">${tabs}</div><div class="app-scroll clock-scroll">${clockFace}${body}</div>`
    );
  }

  function settingsView(view, state) {
    if (view.about) {
      return (
        header("关于", "", true) +
        `<div class="app-scroll settings-scroll">
        <section class="settings-profile"><span class="profile-seal">L</span><div><b>Liquid Lab</b><small>交互模拟器</small></div></section>
        <div class="list-group"><div class="list-row">应用<span>9 个</span></div><div class="list-row">数据存储<span>当前浏览器</span></div>
        <div class="list-row">音频<span>Web Audio</span></div><div class="list-row">玻璃渲染<span>WebGL</span></div></div>
        <p class="app-disclosure">此模拟器为独立界面设计习作。风景照片来自 Unsplash，消息与天气使用示例数据。</p></div>`
      );
    }
    const prefs = state.settings;
    const switches = [
      ["night", "深色外观"],
      ["highlight", "动态高光"],
      ["sound", "提示音"],
    ]
      .map(
        ([key, label]) => `
      <div class="list-row"><span>${label}</span><button class="toggle ${prefs[key] ? "on" : ""}" data-setting="${key}" role="switch" aria-label="${label}" aria-checked="${Boolean(prefs[key])}"></button></div>`,
      )
      .join("");
    const options = (pairs, value) =>
      pairs
        .map(
          ([id, label]) =>
            `<option value="${id}" ${String(id) === String(value) ? "selected" : ""}>${label}</option>`,
        )
        .join("");
    const wallpapers = state.wallpapers
      .map(
        (paper) => `
      <button class="wallpaper-thumb ${prefs.wall === paper.id ? "selected" : ""}" data-wall="${paper.id}" aria-label="${paper.name}" aria-pressed="${prefs.wall === paper.id}" style="background-image:url('${paper.src}')">
        <span>${paper.name}</span></button>`,
      )
      .join("");
    return (
      header("设置") +
      `<div class="app-scroll settings-scroll">
      <h3 class="section-label">显示与声音</h3><div class="list-group">${switches}
        <div class="list-row"><label for="motionSpeed">动效速度</label><select id="motionSpeed">${options(
          [
            [0.65, "轻快"],
            [1, "自然"],
            [1.7, "慢放观察"],
          ],
          prefs.speed,
        )}</select></div>
        <div class="list-row"><label for="materialSelect">玻璃材质</label><select id="materialSelect">${options(
          [
            ["liquid", "液态玻璃"],
            ["frost", "经典毛玻璃"],
          ],
          prefs.material,
        )}</select></div>
      </div><h3 class="section-label">桌面与锁屏壁纸</h3><div class="settings-wallpapers">${wallpapers}</div>
      <div class="list-group">
        <button class="list-row" data-act="open-guide">手势指南 <span class="chevron">›</span></button>
        <button class="list-row" data-act="about">关于 Liquid Lab <span class="chevron">›</span></button></div></div>`
    );
  }

  function glassView(view, state) {
    const prefs = state.settings;
    const sliders = [
      ["refraction", "折射强度", 0, "labRefractionValue"],
      ["depth", "光学厚度", 5, "labDepthValue"],
    ]
      .map(
        ([key, label, min, id]) => `
      <label class="slider-label">${label} <output id="${id}">${prefs[key]}%</output>
        <input data-lab-slider="${key}" type="range" min="${min}" max="100" value="${prefs[key]}" aria-label="${label}"></label>`,
      )
      .join("");
    return (
      header("玻璃工坊") +
      `<div class="app-scroll lab-scroll">
      <div class="lab-demo" id="labDemo"><canvas id="labCanvas"></canvas>
        <div class="lab-lens" id="labLens" aria-label="拖动透镜" role="slider" tabindex="0" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"></div></div>
      <p class="lab-copy">拖动透镜观察折射</p><div class="lab-patterns"><button class="active" data-pattern="grid">网格</button>
        <button data-pattern="type">文字</button><button data-pattern="photo">照片</button></div>${sliders}</div>`
    );
  }

  const operationKeys = Object.freeze({
    "×": "*",
    "÷": "/",
    "−": "-",
    "+": "+",
  });
  const operandPattern = "(-?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[+-]?\\d+)?)";
  const expressionPattern = new RegExp(
    "^" + operandPattern + "([+*/-])" + operandPattern + "$",
    "i",
  );

  function evaluate(expression) {
    const parts = expressionPattern.exec(expression);
    if (!parts) return "错误";
    const left = Number(parts[1]);
    const right = Number(parts[3]);
    if (parts[2] === "/" && right === 0) return "无法除以零";
    const operation = {
      "+": () => left + right,
      "-": () => left - right,
      "*": () => left * right,
      "/": () => left / right,
    };
    const value = operation[parts[2]]();
    return Number.isFinite(value)
      ? String(Number(value.toPrecision(11)))
      : "超出范围";
  }

  function createCalculator() {
    let display = "0";
    let history = "";
    let left = "";
    let pending = "";
    let fresh = true;

    function clear() {
      display = "0";
      history = left = pending = "";
      fresh = true;
    }

    function press(key) {
      if (key === "AC") return clear();
      if (/^[0-9.]$/.test(key)) {
        if (fresh) display = "";
        if ((key === "." && display.includes(".")) || display.length >= 13)
          return;
        display = (display === "0" && key !== "." ? "" : display) + key;
        if (display === ".") display = "0.";
        fresh = false;
        return;
      }
      if (!Number.isFinite(Number(display))) return;
      if (key === "±" || key === "%") {
        display = String(
          key === "±" ? -Number(display) : Number(display) / 100,
        );
        fresh = false;
        return;
      }
      if (key === "=" && pending) {
        history = left + " " + pending + " " + display + " =";
        display = evaluate(left + operationKeys[pending] + display);
        left = pending = "";
        fresh = true;
        return;
      }
      if (Object.hasOwn(operationKeys, key)) {
        if (pending && !fresh)
          display = evaluate(left + operationKeys[pending] + display);
        pending = key;
        left = display;
        history = left + " " + key;
        fresh = true;
      }
    }
    return {
      press,
      get value() {
        return display;
      },
      get history() {
        return history;
      },
    };
  }

  const views = Object.freeze({
    notes: notesView,
    photos: photosView,
    messages: messagesView,
    weather: weatherView,
    music: musicView,
    calculator: calculatorView,
    clock: clockView,
    settings: settingsView,
    glass: glassView,
  });

  window.LiquidApplications = Object.freeze({
    render(id, route, state) {
      const view = views[id];
      if (!view) throw new RangeError("Unknown application: " + id);
      return view(route, state);
    },
    createCalculator,
    evaluate,
    formatTime: time,
  });
})();
