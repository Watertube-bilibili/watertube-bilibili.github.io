/* SPDX-License-Identifier: AGPL-3.0-only
 * Original SVG apparatus. All motion is sampled from Godot trajectories.
 */
(() => {
  'use strict';
  const C = { ink: '#24435d', line: '#58738a', blue: '#3d82b4', red: '#b94e3f', gold: '#c69543', paper: '#fffdf3', steel: '#9aaebc' };
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const n = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const format = (value, digits = 3) => Number.isFinite(Number(value)) ? (Math.abs(Number(value)) < 1e-12 ? 0 : Number(value)).toLocaleString('zh-CN', { maximumFractionDigits: digits }) : '—';
  const text = (x, y, value, size = 15, color = C.ink, anchor = 'start') => `<text x="${x}" y="${y}" font-family="Tahoma,SimSun,serif" font-size="${size}" fill="${color}" text-anchor="${anchor}">${escape(value)}</text>`;
  const rect = (x, y, width, height, fill = '#fff', stroke = C.line) => `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" stroke="${stroke}"/>`;
  const line = (x1, y1, x2, y2, color = C.line, width = 2, dash = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
  const circle = (x, y, radius, fill = '#fff', stroke = C.line, width = 1.5) => `<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
  const path = (data, fill = 'none', stroke = C.line, width = 2) => `<path d="${data}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
  function arrow(x1, y1, x2, y2, color = C.blue) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    return line(x1, y1, x2, y2, color, 2.5) + path(`M${x2 - 8 * Math.cos(a - .45)} ${y2 - 8 * Math.sin(a - .45)}L${x2} ${y2}L${x2 - 8 * Math.cos(a + .45)} ${y2 - 8 * Math.sin(a + .45)}`, 'none', color, 2.5);
  }
  function box(x, y, width, height, title) {
    return rect(x, y, width, height, '#f3f7f8', '#9fb4c4') + rect(x + 1, y + 1, width - 2, 27, '#e0eaf0', 'none') + text(x + 12, y + 20, title, 13);
  }
  function pointAt(result, progress, initial) {
    const points = result?.trajectory ?? [];
    if (!points.length) {
      if (result?.solver) throw new Error('装置缺少 Godot 轨迹，不能播放模拟结果。');
      return initial;
    }
    const time = n(points.at(-1)[0]) * clamp(n(progress), 0, 1);
    const next = points.findIndex(point => n(point[0]) >= time);
    if (next <= 0) return points[Math.max(0, next)].map(Number);
    const before = points[next - 1], after = points[next];
    const fraction = (time - n(before[0])) / (n(after[0]) - n(before[0]));
    return before.map((value, index) => n(value) + (n(after[index]) - n(value)) * fraction);
  }

  function magnetic(params, result, progress) {
    const values = result.values ?? {}, state = pointAt(result, progress, [0, 0, 0, n(params.velocity, .5), 0, 0, 0]);
    const placement = values.placement ?? params.placement ?? 'side';
    const scale = 180, origin = { x: 112, y: 301 };
    const px = x => origin.x + n(x) * scale, py = y => origin.y + n(y) * scale;
    const x = px(state[1]), y = py(state[2]);
    const magnetX = n(values.magnetX, placement === 'front' ? 1 : .5), magnetY = n(values.magnetY, placement === 'front' ? 0 : -.35);
    let output = `<g data-review-kind="magnetDeflection" data-ball-x="${state[1]}" data-ball-y="${state[2]}">`;
    output += text(72, 49, '铁球与磁体 · 水平面俯视', 19) + text(72, 75, '蓝线记录铁球走过的实际轨迹', 13, '#607888');
    output += rect(65, 92, 560, 264, '#f5f8ed', '#aebcaa');
    for (let i = 0; i <= 5; i++) {
      const xx = px(i * .5);
      output += line(xx, 100, xx, 349, '#dce4d3', 1) + text(xx, 374, format(i * .5, 1), 11, '#667b6b', 'middle');
    }
    for (const yy of [-1, -.5, 0]) output += line(73, py(yy), 617, py(yy), '#dce4d3', 1);
    output += line(px(0), py(0), 615, py(0), '#99aa95', 1, '4 4') + text(595, 395, 'x / m', 12, '#667b6b');
    if (placement !== 'none') {
      const mx = px(magnetX), my = py(magnetY);
      output += circle(mx, my, 29, 'none', '#bca989', 1) + rect(mx - 23, my - 12, 23, 24, '#ba6255', '#795748') + rect(mx, my - 12, 23, 24, '#638eac', '#4a6d88');
      output += text(mx - 11, my + 5, 'N', 12, 'white', 'middle') + text(mx + 11, my + 5, 'S', 12, 'white', 'middle') + text(mx, my - 37, placement === 'front' ? '前方磁体' : '侧方磁体', 13, C.ink, 'middle');
    }
    const traveled = (result.trajectory ?? []).filter(point => n(point[0]) <= state[0]);
    const pathPoints = [...traveled, state].map(point => `${px(point[1])},${py(point[2])}`).join(' ');
    output += `<polyline points="${pathPoints}" fill="none" stroke="${C.blue}" stroke-width="2.5" data-magnetic-trace="true"/>`;
    output += circle(x, y, 11, C.steel, '#486276', 2) + circle(x - 3, y - 4, 3, '#e5eef2', 'none');
    if (Math.hypot(state[3], state[4]) > .00001) output += arrow(x, y, x + state[3] * 32, y + state[4] * 32, C.red);
    output += text(px(0), py(0) + 25, '释放点', 12, '#637d70', 'middle');
    output += box(649, 95, 208, 263, '当前位置与速度');
    output += text(666, 145, `t = ${format(state[0])} s`, 16) + text(666, 187, `x = ${format(state[1])} m`, 16) + text(666, 218, `y = ${format(state[2])} m`, 16);
    output += text(666, 263, `vx = ${format(state[3])} m/s`, 15) + text(666, 293, `vy = ${format(state[4])} m/s`, 15);
    output += text(666, 333, '上侧 y 为负；红箭头为速度', 11, '#687c8d');
    output += text(450, 420, '给定等效吸引力场；无水平摩擦，不模拟磁体接触。', 13, '#657b8b', 'middle');
    return output + '</g>';
  }

  function indentation(params, result, progress) {
    const values = result.values ?? {}, state = pointAt(result, progress, [0, 0, 0, 0, 0]);
    const height = n(values.height, n(params.height, .3)), finalDepth = n(values.depth), depth = Math.max(0, state[1] - height);
    const surface = 252, scale = 140, radius = 12, ballX = 295;
    const releaseY = surface - radius - height * scale, ballY = releaseY + state[1] * scale;
    const insetScale = finalDepth > 0 ? Math.min(80000, 65 / finalDepth) : 4000;
    const insetDepth = depth * insetScale;
    let output = `<g data-review-kind="indentation" data-indent-depth="${depth}" data-ball-y="${ballY}">`;
    output += text(72, 49, '钢珠落下 · 比较压入深度', 19) + text(72, 76, '相同介质条件下，改变释放高度作对照', 13, '#607888');
    output += line(162, releaseY + radius, 162, surface, C.blue, 1.5) + line(153, releaseY + radius, 171, releaseY + radius, C.blue) + line(153, surface, 171, surface, C.blue);
    output += text(141, (releaseY + radius + surface) / 2, `h=${format(height)} m`, 13, C.blue, 'end');
    output += circle(ballX, releaseY, radius, 'none', '#a3b8c5', 1) + line(ballX, releaseY + radius, ballX, surface, '#a6b6bf', 1, '4 4');
    output += path(`M85 ${surface}H${ballX - radius * 2}Q${ballX} ${surface + depth * scale * 2} ${ballX + radius * 2} ${surface}H570V370H85Z`, '#c8a279', '#937454', 2);
    for (let i = 0; i < 16; i++) output += line(100 + i * 29, 355, 109 + i * 29, 345, '#b58e66', 1);
    output += circle(ballX, ballY, radius, C.steel, '#4d687b', 2) + circle(ballX - 4, ballY - 5, 3.5, '#e9f0f3', 'none');
    output += text(93, 395, 'h：钢珠接触介质前下降的距离', 13, '#687c8d') + text(349, 232, '原表面', 12, '#8b6e4a');
    output += box(618, 95, 242, 288, '压痕局部观察');
    const ix = 739, iy = 171;
    output += path(`M640 ${iy}H${ix - 28}Q${ix} ${iy + insetDepth * 2} ${ix + 28} ${iy}H838V259H640Z`, '#d5b58f', '#a28662', 1.5);
    output += line(640, iy, 838, iy, '#8b9eab', 1, '4 4');
    if (depth > 0) output += line(810, iy, 810, iy + insetDepth, C.red, 2) + text(800, iy + insetDepth / 2 + 5, 'd', 14, C.red, 'end');
    output += text(739, 283, '局部按最终深度适配显示', 12, '#72808b', 'middle');
    output += text(637, 318, `当前深度 ${format(depth * 1000, 3)} mm`, 16) + text(637, 350, `给定阻力 ${format(values.resistance ?? params.resistance ?? 10)} N`, 15);
    output += text(450, 420, '压痕用于间接比较；恒阻力模型不等同于真实橡皮泥材料。', 13, '#657b8b', 'middle');
    return output + '</g>';
  }

  function solarFan(params, result, progress) {
    const values = result.values ?? {}, state = pointAt(result, progress, [0, 0, 0, 0]);
    const coverage = n(values.coverage, n(params.coverage, 100)), shadeWidth = 240 * (1 - coverage / 100);
    let output = `<g data-review-kind="solarFan" data-fan-angle="${state[1]}" data-fan-omega="${state[2]}">`;
    output += text(72, 49, '太阳能电池驱动小风扇', 19) + text(72, 76, '改变受光比例后，比较同一风扇从静止启动', 13, '#607888');
    output += circle(112, 122, 24, '#e8bd6c', '#b08b43', 2);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      output += line(112 + 31 * Math.cos(a), 122 + 31 * Math.sin(a), 112 + 42 * Math.cos(a), 122 + 42 * Math.sin(a), C.gold, 2);
    }
    output += rect(120, 188, 240, 120, '#426f93', '#2f5776');
    for (let i = 1; i < 6; i++) output += line(120 + i * 40, 188, 120 + i * 40, 308, '#9dc0d5', 1);
    for (let i = 1; i < 3; i++) output += line(120, 188 + i * 40, 360, 188 + i * 40, '#9dc0d5', 1);
    if (shadeWidth > 0) output += rect(120, 188, shadeWidth, 120, '#6b706b', '#464e4e');
    if (coverage > 0 && n(values.inputPower, n(params.power, 2)) > 0) output += arrow(152, 143, 225, 181, C.gold);
    output += line(180, 308, 170, 344, C.line, 4) + line(300, 308, 310, 344, C.line, 4) + rect(150, 344, 182, 9, '#a1b3bf', C.line);
    output += text(240, 380, `受光比例 ${format(coverage, 1)}%`, 16, C.ink, 'middle');
    output += path('M360 280H428V329H684V281M360 292H416V341H697V288', 'none', '#866748', 2);
    output += box(391, 99, 203, 157, '光 → 电 → 机械');
    output += text(407, 145, `受光 ${format(values.inputPower, 3)} W`, 15) + text(407, 181, `电输出 ${format(values.outputPower, 3)} W`, 15) + text(407, 220, `t = ${format(state[0])} s`, 15);
    output += line(707, 280, 707, 344, C.line, 10) + rect(656, 344, 102, 13, '#a5b9c6', C.line);
    output += circle(707, 211, 78, '#f4f8f8', '#6b879b', 2);
    output += `<g transform="rotate(${state[1]} 707 211)" data-fan-rotor="true">`;
    output += path('M707 211C679 194 656 145 688 151C724 157 724 183 707 211C740 197 783 208 765 232C741 257 720 238 707 211C707 245 681 286 664 259C648 228 683 220 707 211Z', '#86a9bd', '#53748b', 1.5) + '</g>';
    output += circle(707, 211, 62, 'none', '#aabcc5', 1) + circle(707, 211, 8, '#c1cfd7', C.line, 1.5);
    output += text(707, 120, '相同电机与负载', 14, C.ink, 'middle') + text(707, 380, `ω = ${format(state[2], 4)} rad/s`, 16, C.ink, 'middle');
    output += text(450, 420, '给定供电、平均转矩和负载模型；遮光后的新一轮从静止开始。', 13, '#657b8b', 'middle');
    return output + '</g>';
  }

  window.LAB_PHYSICS_SCENES ??= {};
  window.LAB_PHYSICS_SCENES.mechanicsReview = (_experiment, params, result = {}, progress = 0) => {
    if (params.scenario === 'magnetDeflection') return magnetic(params, result, progress);
    if (params.scenario === 'indentation') return indentation(params, result, progress);
    if (params.scenario === 'solarFan') return solarFan(params, result, progress);
    return null;
  };
})();
