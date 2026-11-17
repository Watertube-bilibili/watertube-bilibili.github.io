/* Desk objects, drawn in native SVG. IDs are unique across the desktop, Dock and transitions. */
(() => {
  "use strict";

  const bounds = 'x1="0%" y1="0%" x2="85%" y2="100%"';
  const horizontal = 'x1="0%" y1="0%" x2="100%" y2="0%"';
  const vertical = 'x1="0%" y1="0%" x2="0%" y2="100%"';
  const names = {
    messages: "消息",
    photos: "相册",
    music: "音乐",
    weather: "天气",
    notes: "备忘录",
    clock: "时钟",
    calculator: "计算器",
    settings: "设置",
    glass: "玻璃工坊",
  };
  let serial = 0;

  function gradient(name, stops, direction = bounds) {
    return `<linearGradient id="@${name}" ${direction}>${stops.map(([position, color]) => `<stop offset="${position}%" stop-color="${color}"/>`).join("")}</linearGradient>`;
  }

  function radial(name, stops, center = 'cx="33%" cy="23%" r="87%"') {
    return `<radialGradient id="@${name}" ${center}>${stops.map(([position, color]) => `<stop offset="${position}%" stop-color="${color}"/>`).join("")}</radialGradient>`;
  }

  function line(x1, y1, x2, y2, color, width, opacity = 1) {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" opacity="${opacity}" stroke-linecap="round"/>`;
  }

  function icon(id, definitions, drawing) {
    const prefix = `os-art-${++serial}-`;
    const content = `<defs>${definitions}</defs>${drawing}`.replaceAll(
      "@",
      prefix,
    );
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 88" role="img" aria-label="${names[id]}">${content}</svg>`;
  }

  function messages() {
    const definitions =
      gradient("face", [
        [0, "#fbf6d9"],
        [46, "#e9dbac"],
        [100, "#baab83"],
      ]) +
      gradient("flap", [
        [0, "#fff9e6"],
        [66, "#f3e7c4"],
        [100, "#d5c399"],
      ]) +
      radial("wax", [
        [0, "#cc5743"],
        [70, "#a03c31"],
        [100, "#6c281f"],
      ]);
    return icon(
      "messages",
      definitions,
      `
      <g transform="rotate(-5 44 44)">
        <path d="M8 20 Q8 16 13 16 H74 Q79 16 79 21 V67 Q79 72 74 72 H13 Q8 72 8 67Z" fill="#74684f"/>
        <rect x="8" y="15" width="71" height="54" rx="4" fill="url(#@face)" stroke="#a9966b" stroke-width="1"/>
        <path d="m9 68 27-25m42 25L51 43" fill="none" stroke="#a89770" stroke-width="1.2"/>
        <path d="m10 67 25-23m42 23L52 44" fill="none" stroke="#fff9dc" stroke-width=".9"/>
        <path d="M9 18q0-2 3-2h62q4 0 4 2L48 47q-5 4-9 0Z" fill="#9c8e6e" transform="translate(0 2)"/>
        <path d="M9 18q0-2 3-2h62q4 0 4 2L48 46q-5 4-9 0Z" fill="url(#@flap)" stroke="#cab991" stroke-width=".7"/>
        <path d="M12 18h61m-60 2 27 24" fill="none" stroke="#fffcef" stroke-width="1.1" opacity=".8"/>
        <path d="M34 44q1-5 5-5 3-4 7-1 5 0 6 4 4 3 1 8-1 5-5 5-5 3-8 0-5 0-6-5-3-3 0-6Z" fill="#735236" opacity=".5" transform="translate(.8 2)"/>
        <path d="M34 44q1-5 5-5 3-4 7-1 5 0 6 4 4 3 1 8-1 5-5 5-5 3-8 0-5 0-6-5-3-3 0-6Z" fill="url(#@wax)"/>
        <circle cx="43.7" cy="47" r="6.2" fill="none" stroke="#792c25" stroke-width="1.25"/><circle cx="43.3" cy="46.4" r="6.2" fill="none" stroke="#e08a62" stroke-width=".65"/>
        <path d="m41.2 49.3 1.6-5.1 1.7 3.5 2.6-3.7" fill="none" stroke="#f2a578" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M12 61v3h4m55-43h4v4" fill="none" stroke="#fdf5d6" stroke-width="1"/>
      </g>`,
    );
  }

  function photos() {
    const definitions =
      gradient("paper", [
        [0, "#fffcef"],
        [68, "#f0e6d0"],
        [100, "#cebea4"],
      ]) +
      gradient(
        "sky",
        [
          [0, "#5a929e"],
          [55, "#a5c7b6"],
          [100, "#ecd7a2"],
        ],
        vertical,
      ) +
      gradient("mount", [
        [0, "#51757a"],
        [100, "#24494a"],
      ]) +
      gradient(
        "water",
        [
          [0, "#90b7ad"],
          [100, "#3d6d76"],
        ],
        vertical,
      );
    return icon(
      "photos",
      definitions,
      `
      <g transform="rotate(10 44 45)"><rect x="14" y="10" width="59" height="65" rx="2" fill="#8b7862"/><rect x="14" y="9" width="59" height="63" rx="2" fill="#d8c9ab"/><path d="M18 13h51v45H18z" fill="#947966"/><path d="m18 39 18-13 14 11 19-17v38H18Z" fill="#7c6259"/></g>
      <g transform="rotate(-8 43 46)"><rect x="10" y="15" width="63" height="64" rx="2.5" fill="#7e7663"/><rect x="10" y="13" width="63" height="64" rx="2.5" fill="url(#@paper)" stroke="#bdb39c" stroke-width=".8"/>
        <path d="M15 18h53v45H15Z" fill="url(#@sky)"/><circle cx="53" cy="29" r="6.5" fill="#f6dc9f"/>
        <path d="m15 46 15-21 16 22 8-8 14 13v6H15Z" fill="url(#@mount)"/><path d="m23 35 7-10 5 8-4-2-2 3-2-1Z" fill="#e1ebd7"/>
        <path d="m15 48 12-7 13 11 11-9 17 7v6H15Z" fill="#7c9381"/><path d="M15 50q12-2 21 2t32-1v12H15Z" fill="url(#@water)"/>
        <path d="M18 56h16m10 3h14m-4-6h10m-42 8h6" fill="none" stroke="#d1d8b9" stroke-width=".8" opacity=".8"/>
        <path d="M15 18h53v45H15Z" fill="none" stroke="#7d8977" stroke-width=".6"/>
        <path d="M16 15h50" stroke="#fffdf2" stroke-width="1.2"/>
      </g>`,
    );
  }

  function music() {
    const definitions =
      gradient("sleeve", [
        [0, "#b65645"],
        [48, "#a44436"],
        [100, "#672a28"],
      ]) +
      gradient("vinyl", [
        [0, "#20252a"],
        [25, "#3d4547"],
        [40, "#1a2022"],
        [62, "#303738"],
        [73, "#525955"],
        [84, "#29312f"],
        [100, "#111817"],
      ]) +
      radial("label", [
        [0, "#d6af7f"],
        [100, "#b77f57"],
      ]);
    const grooves = Array.from(
      { length: 10 },
      (_, i) =>
        `<circle cx="48" cy="38" r="${20 + i * 1.42}" fill="none" stroke="${i % 2 ? "#101715" : "#c2c1ad"}" stroke-width="${i % 2 ? 0.55 : 0.4}" opacity="${i % 2 ? 0.66 : 0.35}"/>`,
    ).join("");
    return icon(
      "music",
      definitions,
      `
      <g transform="rotate(-8 44 45)"><rect x="7" y="23" width="62" height="55" rx="2.5" fill="#6d302b"/>
      <circle cx="48" cy="39.4" r="34.5" fill="#141c1b"/><circle cx="48" cy="38" r="34" fill="url(#@vinyl)" stroke="#66706c" stroke-width=".8"/>${grooves}
      <circle cx="48" cy="38" r="13.2" fill="url(#@label)"/><circle cx="48" cy="38" r="10.6" fill="none" stroke="#633d36" stroke-opacity=".45" stroke-width=".6"/><path d="M38 36h20v4H38Z" fill="#99483b"/><circle cx="48" cy="38" r="2.45" fill="#242826" stroke="#f0cf99" stroke-width=".7"/>
      <path d="M7 28q0-3 3-3h9q4 19 21 25 16 6 29-3v28q0 2-3 2H10q-3 0-3-3Z" fill="url(#@sleeve)" stroke="#77352b" stroke-width=".8"/>
      <path d="M9 27h8q5 18 20 24 18 8 30 0" fill="none" stroke="#e09c7d" stroke-width="1.2"/>
      <path d="M13 67h18m-18 3h11" stroke="#efd0a6" stroke-width="1.6"/><path d="M58 65h6v6h-6z" fill="none" stroke="#edc4a0" stroke-width=".7"/>
      </g>`,
    );
  }

  function weather() {
    const definitions =
      radial("sun", [
        [0, "#ffe4a1"],
        [55, "#f4bd5c"],
        [100, "#dc843d"],
      ]) +
      gradient("ray", [
        [0, "#ffdc80"],
        [100, "#e4a44e"],
      ]) +
      gradient(
        "cloud",
        [
          [0, "#fffff5"],
          [46, "#f1f3e3"],
          [82, "#bfd4d2"],
          [100, "#92b2b9"],
        ],
        vertical,
      );
    const rays = Array.from(
      { length: 10 },
      (_, i) =>
        `<path d="M54 6v5" stroke="url(#@ray)" stroke-width="4" stroke-linecap="round" transform="rotate(${i * 36} 54 32)"/>`,
    ).join("");
    const cloud =
      "M20 71C10 71 5 66 6 57c.5-8 6-13 14-13 3-12 12-19 23-17 10 1 17 8 19 17 11 0 19 6 19 15 0 8-6 12-15 12Z";
    return icon(
      "weather",
      definitions,
      `${rays}<circle cx="54" cy="32" r="17.4" fill="#ae753d"/><circle cx="54" cy="31" r="17" fill="url(#@sun)" stroke="#d59d52" stroke-width=".6"/>
      <path d="M41 27q4-11 16-10" fill="none" stroke="#fff0b1" stroke-width="2" stroke-linecap="round"/>
      <path d="${cloud}" fill="#78999c" transform="translate(0 3)"/><path d="${cloud}" fill="url(#@cloud)" stroke="#a3bcbb" stroke-width=".9"/>
      <path d="M10 54q3-8 12-8 3-14 17-16 12-1 18 9" fill="none" stroke="#fffef1" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M17 68q13 1 28 1h20q8 0 11-5" fill="none" stroke="#b1c7c7" stroke-width="1.1"/>
    `,
    );
  }

  function notes() {
    const definitions =
      gradient("cover", [
        [0, "#c09a5e"],
        [54, "#a07948"],
        [100, "#6d5138"],
      ]) +
      gradient("paper", [
        [0, "#fffcdf"],
        [50, "#f5efd4"],
        [100, "#dbcda7"],
      ]) +
      gradient(
        "wire",
        [
          [0, "#56635f"],
          [22, "#e4e3c7"],
          [47, "#8b9588"],
          [75, "#515c52"],
          [100, "#c4c7ad"],
        ],
        horizontal,
      );
    const rings = [25, 36, 47, 58]
      .map(
        (x) =>
          `<ellipse cx="${x}" cy="17" rx="3.2" ry="2.8" fill="#83795e"/><path d="M${x - 2} 16V10c0-4 4-4 4 0v7" fill="none" stroke="url(#@wire)" stroke-width="3.3" stroke-linecap="round"/>`,
      )
      .join("");
    return icon(
      "notes",
      definitions,
      `
      <g transform="rotate(-4 43 45)"><rect x="15" y="11" width="58" height="68" rx="4" fill="#6a4f36"/><rect x="14" y="10" width="58" height="66" rx="3" fill="url(#@cover)"/>
        <path d="M18 12h51v60H18z" fill="#ada58c"/><path d="M17 11h52v59H17Z" fill="url(#@paper)"/>
        <path d="M19 71h49m-49 2h47" stroke="#e0d8bb" stroke-width="1"/>
        <path d="M17 11h52v14H17Z" fill="#eacb8a"/><path d="M17 24h52" stroke="#c5a770" stroke-width="1"/><path d="M23.8 26v41" stroke="#c18b7c" stroke-width=".8"/>
        ${[32, 39, 46, 53, 60].map((y) => line(19, y, 66.2, y, "#bec8ac", 0.8)).join("")}${rings}
        <g transform="rotate(34 64 48)"><path d="M61 25h6v40l-3 9-3-9Z" fill="#8b7859" opacity=".36" transform="translate(1.4 1.5)"/>
          <rect x="61" y="23" width="6" height="9" rx="2" fill="#bd7258"/><path d="M61 32h6v32h-6z" fill="#52675a"/><path d="M61 32h2v32h-2z" fill="#9aa17c"/><path d="M61 29h6v5h-6z" fill="url(#@wire)"/>
          <path d="m61 64 3 9 3-9-2 1-2-1Z" fill="#c6ab75"/><path d="m62.8 70 1.2 3.6 1.2-3.6Z" fill="#383a35"/></g>
      </g>`,
    );
  }

  function clock() {
    const definitions =
      gradient("bezel", [
        [0, "#edf1de"],
        [15, "#a6b1a7"],
        [40, "#6f8079"],
        [60, "#f0ecdb"],
        [78, "#9ba69b"],
        [100, "#57665e"],
      ]) +
      radial("dial", [
        [0, "#fffae7"],
        [78, "#f3ebd0"],
        [96, "#d2c8aa"],
        [100, "#9b9780"],
      ]);
    const ticks = Array.from(
      { length: 60 },
      (_, i) =>
        `<path d="M44 14v${i % 5 === 0 ? 4.5 : 1.8}" transform="rotate(${i * 6} 44 44)" stroke="#566057" stroke-width="${i % 5 === 0 ? 1.65 : 0.68}"/>`,
    ).join("");
    return icon(
      "clock",
      definitions,
      `
      <circle cx="44" cy="45.7" r="37.6" fill="#4f5b52"/><circle cx="44" cy="43.5" r="37" fill="url(#@bezel)" stroke="#59685f" stroke-width=".7"/>
      <circle cx="44" cy="43.5" r="33.15" fill="#71786a"/><circle cx="44" cy="44" r="31.6" fill="url(#@dial)"/>${ticks}
      <g font-family="Georgia,serif" fill="#48554d" font-size="9.3" text-anchor="middle"><text x="44" y="27">12</text><text x="66" y="47.3">3</text><text x="44" y="67.3">6</text><text x="22.5" y="47.3">9</text></g>
      <path d="m42 47 4-5-17-11-1 2Z" fill="#37463f"/><path d="m42.6 45.5 2.3 1.5 14.3-21.3-.9-1.1Z" fill="#43524b"/>
      <path d="M39.7 37 58 65.5" stroke="#b7513b" stroke-width="1.1" stroke-linecap="round"/><circle cx="44" cy="44" r="3" fill="#7c4937"/><circle cx="43.6" cy="43.5" r="1.6" fill="#d09571"/>
      <path d="M11.3 37A34 34 0 0 1 43 9" stroke="#f8f7e5" stroke-width="1.2" fill="none"/><path d="M76 51a33 33 0 0 1-22 24" fill="none" stroke="#4d5f53" stroke-width="1"/>
    `,
    );
  }

  function calculator() {
    const definitions =
      gradient("body", [
        [0, "#e6e3d1"],
        [48, "#c0c5b4"],
        [92, "#a1ab9a"],
        [100, "#869184"],
      ]) +
      gradient(
        "display",
        [
          [0, "#9aa988"],
          [22, "#afb999"],
          [100, "#d6d9b7"],
        ],
        vertical,
      ) +
      gradient(
        "key",
        [
          [0, "#ffffed"],
          [60, "#e6e5d2"],
          [100, "#c1c4ae"],
        ],
        vertical,
      ) +
      gradient(
        "red",
        [
          [0, "#c97755"],
          [100, "#a24c39"],
        ],
        vertical,
      );
    const rows = [
      ["7", "8", "9", "÷"],
      ["4", "5", "6", "×"],
      ["1", "2", "3", "+"],
    ];
    const keys = rows
      .map((row, i) =>
        row
          .map((label, j) => {
            const x = 17 + j * 14,
              y = 36 + i * 12;
            return `<rect x="${x}" y="${y + 1.9}" width="11.2" height="9.2" rx="2.2" fill="#778374"/><rect x="${x}" y="${y}" width="11.2" height="9.2" rx="2.2" fill="url(#@${j === 3 ? "red" : "key"})" stroke="${j === 3 ? "#935443" : "#b8bdab"}" stroke-width=".5"/><text x="${x + 5.6}" y="${y + 6.8}" fill="${j === 3 ? "#fff2d5" : "#36443d"}" font-size="6.8" font-family="Arial,sans-serif" text-anchor="middle">${label}</text>`;
          })
          .join(""),
      )
      .join("");
    return icon(
      "calculator",
      definitions,
      `
      <g transform="rotate(3 44 44)"><rect x="11" y="8.7" width="66" height="71.3" rx="7" fill="#667568"/><rect x="11" y="7" width="66" height="70" rx="7" fill="url(#@body)" stroke="#8e9a8e" stroke-width=".9"/>
      <path d="M14 25v-9q0-6 6-6h47" fill="none" stroke="#faf9e7" stroke-width="1.2"/><rect x="16" y="14" width="55" height="17.5" rx="3" fill="#7a8878"/>
      <rect x="17.5" y="15.6" width="52" height="14.5" rx="2" fill="url(#@display)"/><path d="M20 17h46" stroke="#77866e" stroke-width="1"/>
      <text x="66" y="26.9" font-family="monospace" text-anchor="end" font-size="9.8" letter-spacing=".9" fill="#374532">128.0</text>
      ${keys}<path d="M20 73h45" stroke="#f4efda" opacity=".5" stroke-width=".8"/></g>`,
    );
  }

  function gearPath(teeth, tip, root) {
    const vertices = [];
    for (let i = 0; i < teeth; i++) {
      for (const [step, radius] of [
        [-0.5, root],
        [-0.28, root],
        [-0.17, tip],
        [0.17, tip],
        [0.28, root],
      ]) {
        const angle = ((i + step) * 2 * Math.PI) / teeth - Math.PI / 2;
        vertices.push(
          `${(Math.cos(angle) * radius).toFixed(2)},${(Math.sin(angle) * radius).toFixed(2)}`,
        );
      }
    }
    return `M${vertices.join("L")}Z`;
  }

  function settings() {
    const definitions =
      gradient("steel", [
        [0, "#eef1e2"],
        [28, "#d1d8c9"],
        [45, "#9ba99c"],
        [58, "#d8ddcb"],
        [85, "#99a699"],
        [100, "#66786c"],
      ]) +
      gradient("brass", [
        [0, "#f3da9f"],
        [38, "#ba9d64"],
        [65, "#ddbe82"],
        [100, "#8a734e"],
      ]) +
      gradient("hub", [
        [0, "#899c8d"],
        [32, "#53665b"],
        [72, "#35473f"],
        [100, "#657263"],
      ]);
    const large = gearPath(11, 31.5, 26.3),
      small = gearPath(9, 16.8, 13.6);
    function wheel(path, metal, depth, r, h) {
      const cutout = ` M ${r} 0 A ${r} ${r} 0 1 0 ${-r} 0 A ${r} ${r} 0 1 0 ${r} 0Z`;
      return `<path d="${path + cutout}" fill-rule="evenodd" fill="${depth}" transform="translate(0 2.1)" stroke="${depth}" stroke-width="1.3" stroke-linejoin="round"/><path d="${path + cutout}" fill-rule="evenodd" fill="url(#@${metal})" stroke="${depth}" stroke-width=".7" stroke-linejoin="round"/><circle r="${h}" fill="none" stroke="#f0f1dc" stroke-width="1" opacity=".72"/><circle cy=".6" r="${r + 0.7}" fill="none" stroke="#68766a" stroke-width="1.5"/>`;
    }
    return icon(
      "settings",
      definitions,
      `
      <g transform="translate(37 46) rotate(-8)">${wheel(large, "steel", "#67776d", 8.9, 18.5)}
        <circle r="15.4" fill="url(#@hub)"/><circle r="10.3" fill="url(#@steel)"/><circle r="5.8" fill="#53665c"/><circle cy="1.3" r="4.4" fill="#829285"/>
        ${[0, 120, 240].map((angle) => `<path d="M-6-20q6-2 12 0" fill="none" stroke="#8b9a8e" stroke-width="2.9" stroke-linecap="round" transform="rotate(${angle})"/>`).join("")}
      </g>
      <g transform="translate(63 23) rotate(17)">${wheel(small, "brass", "#8c7857", 5, 9.1)}<circle r="4.8" fill="#6e725d"/><circle cy=".8" r="3.3" fill="#a99368"/></g>
    `,
    );
  }

  function glass() {
    const definitions =
      gradient("block", [
        [0, "#dae6dc"],
        [16, "#bcd9cd"],
        [45, "#8cb4ad"],
        [78, "#658f90"],
        [100, "#c1d8c6"],
      ]) +
      gradient("edge", [
        [0, "#e6eddb"],
        [26, "#cae2d4"],
        [49, "#9ac6c1"],
        [77, "#7eaaa9"],
        [100, "#c5dfcd"],
      ]) +
      gradient("red", [
        [0, "#e4aa90"],
        [40, "#cb7a67"],
        [100, "#a7524a"],
      ]) +
      gradient("teal", [
        [0, "#7eb4b0"],
        [52, "#609897"],
        [100, "#538080"],
      ]);
    return icon(
      "glass",
      definitions,
      `
      <g transform="rotate(-8 44 44)">
      <path d="M15 32q0-6 6-10L43 8q5-3 12 0l16 9q7 4 7 11v31q0 8-6 12L52 80q-5 2-12-.2L20 69q-6-3-6-10Z" fill="#496b6a"/>
      <path d="m17 27 27-17q4-2 9 0l18 9q5 2 5 7l-26 19-9-1Z" fill="url(#@edge)" stroke="#c6dbca" stroke-width="1"/>
      <path d="M15 29q1-5 6-2l23 13q5 3 5 9v25q0 5-5 4L20 65q-5-2-5-8Z" fill="url(#@block)" stroke="#9bbdb2" stroke-width=".9"/>
      <path d="m50 42 21-15q5-4 5 2v29q0 7-5 10L53 78q-4 2-4-3V49q0-4 1-7Z" fill="#80aaa4" stroke="#a4c9bf" stroke-width="1"/>
      <path d="m21 25 20-13 7 3-20 14Zm9 6 22-15 4 2-21 16Z" fill="#d9e9d9" opacity=".75"/>
      <path d="m20 43 9 5 10-8 5 3v10l-8 7-16-9Z" fill="url(#@red)"/>
      <path d="m51 52 9-7 9 3 5-4v9l-6 5-8-4-9 7Z" fill="#ca8b78" opacity=".89"/>
      <path d="m20 57 13 7 9-7 2 2v6l-8 7-16-9Z" fill="url(#@teal)"/>
      <path d="m52 66 9-6 10 1 3-3v5l-5 5-7-1-10 7Z" fill="#58918b"/>
      <path d="M18 40v-8q0-4 3-3l20 11m10 5 17-12m-23 19v20" fill="none" stroke="#f7fff0" stroke-width="1.65" stroke-linecap="round" opacity=".92"/>
      <path d="m17 55 1 6 8 5m46-36v10m-19 35 13-6" fill="none" stroke="#d7ecd7" stroke-width="1.1" opacity=".87"/>
      </g>`,
    );
  }

  window.appIcons = {
    messages,
    photos,
    music,
    weather,
    notes,
    clock,
    calculator,
    settings,
    glass,
  };

  window.uiIcon = (name) => {
    const paths = {
      play: '<path d="m7 4 14 8-14 8Z"/>',
      pause: '<path d="M6 4h4v16H6zm8 0h4v16h-4z"/>',
      next: '<path d="m4 5 12 7-12 7zm13-1h3v16h-3z"/>',
      prev: '<path d="m20 5-12 7 12 7zM4 4h3v16H4z"/>',
      sun: '<circle cx="12" cy="12" r="4" fill="#eed19b"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" fill="none" stroke="#eed19b" stroke-width="1.7" stroke-linecap="round"/>',
      cloud:
        '<path d="M5 19a5 5 0 0 1 0-10 7 7 0 0 1 13-2 6 6 0 0 1 0 12Z" fill="#e9efdc"/>',
      wifi: '<path d="M2 8q10-9 20 0M5 12q7-6 14 0m-11 4q4-3 8 0"/><circle cx="12" cy="20" r="1"/>',
      bluetooth: '<path d="m7 6 10 12-5 4V2l5 4L7 18"/>',
      airplane:
        '<path d="m12 2 2 8 7 5v2l-7-2v5l2 2-4-1-4 1 2-2v-5l-7 2v-2l7-5Z"/>',
      signal: '<path d="M4 20V15m5 5V11m5 9V7m5 13V3"/>',
      moon: '<path d="M20 15A9 9 0 0 1 9 3 9 9 0 1 0 20 15Z" fill="currentColor"/>',
      lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/>',
      heart:
        '<path d="M12 21 3 12C-3 4 7-1 12 6c5-7 15-2 9 6Z" fill="currentColor"/>',
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.sun}</svg>`;
  };
})();
