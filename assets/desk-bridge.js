// A stadium is the set of points within one radius of its horizontal center segment.
// Measuring between those segments also handles diagonal drags and wrapped buttons.
function capsule(rect, dx = 0, dy = 0) {
  const r = rect.height / 2;
  return { left: rect.left + dx + r, right: rect.right + dx - r, y: rect.top + dy + r, r };
}

const clamp = (n, low, high) => Math.min(high, Math.max(low, n));

function contact(a, b) {
  const middle = (Math.max(a.left, b.left) + Math.min(a.right, b.right)) / 2;
  const ax = clamp(middle, a.left, a.right);
  const dx = clamp(middle, b.left, b.right) - ax;
  const dy = b.y - a.y;
  const distance = Math.hypot(dx, dy);
  return { ax, ux: dx / (distance || 1), uy: dy / (distance || 1), distance, gap: distance - a.r - b.r };
}

// Distance along a ray to the capsule rim at a given offset across the join.
function rimDepth(shape, x, y, ux, uy) {
  let low = 0, high = shape.right - shape.left + 2 * shape.r;
  for (let i = 0; i < 11; i++) {
    const t = (low + high) / 2;
    const px = x + ux * t;
    const dx = px - clamp(px, shape.left, shape.right);
    const dy = y + uy * t - shape.y;
    if (dx * dx + dy * dy < shape.r * shape.r) low = t;
    else high = t;
  }
  return low;
}

export function createGlassBridge(nav) {
  if (!nav) return null;
  const [first, second] = nav.querySelectorAll('.glass-control');
  const svg = nav.querySelector('.glass-bridge');
  const surface = svg.querySelector('.water-surface');
  const highlight = svg.querySelector('.water-glint');
  const quiet = matchMedia('(prefers-reduced-motion: reduce), (prefers-reduced-transparency: reduce), (forced-colors: active)');
  const enabled = () => !quiet.matches && document.documentElement.dataset.glassTier !== 'lite';
  let holding = false, joinedAt = null, releasedAt = null, breakAt = null, frame = 0;
  let base, peer, lastGap, lastTime, speed = 0;

  function clearJoin() {
    joinedAt = breakAt = null;
    delete nav.dataset.bridgePhase;
    for (const button of [first, second]) {
      button.style.removeProperty('--water-cut');
      button.style.removeProperty('--wet-rim');
    }
    surface.removeAttribute('d');
    highlight.removeAttribute('d');
    svg.style.visibility = 'hidden';
  }

  function stop() {
    holding = false;
    releasedAt = null;
    cancelAnimationFrame(frame);
    frame = 0;
    clearJoin();
  }

  function requestPaint() {
    if (!frame) frame = requestAnimationFrame(paint);
  }

  function paint(now) {
    frame = 0;
    if (!enabled()) { stop(); return; }
    const rectA = first.getBoundingClientRect(), rectB = second.getBoundingClientRect();
    const origin = nav.getBoundingClientRect();
    const a = capsule(rectA), b = capsule(rectB);
    const { ax, ux, uy, distance, gap } = contact(a, b);
    if (joinedAt === null) {
      if (!holding || gap > 1) return;
      joinedAt = lastTime = now;
      lastGap = gap;
      speed = 0;
    }

    const dt = Math.max(1, now - lastTime);
    speed += ((gap - lastGap) / dt - speed) * (1 - Math.exp(-dt / 30));
    lastGap = gap;
    lastTime = now;

    const radius = Math.min(a.r, b.r);
    // A fast pull carries a little more water. Releasing lets the joint drain.
    let limit = radius * .6 + clamp(speed * 10, 0, 4);
    if (!holding) limit *= 1 - .58 * clamp((now - releasedAt) / 95, 0, 1);
    if (holding && gap <= 1) breakAt = null;
    if (breakAt === null && gap >= limit) breakAt = now;
    const recoil = breakAt === null ? 0 : clamp((now - breakAt) / 100, 0, 1);
    if (recoil >= 1) { clearJoin(); return; }

    const phase = breakAt !== null ? 'breaking' : gap > 2.5 ? 'stretching' : 'joined';
    if (nav.dataset.bridgePhase !== phase) nav.dataset.bridgePhase = phase;
    const stretch = clamp(gap / limit, 0, 1);
    const wetting = .35 + .65 * (1 - Math.exp(-(now - joinedAt) / 28));
    const neck = Math.max(.16, radius * .25 * (1 - stretch) ** 1.35 * wetting);
    // The concave meniscus is tangent to the circular endcaps. Solving for its
    // radius gives the contact width and an arc that narrows continuously.
    const halfDistance = radius + clamp(gap, -.45, limit) / 2;
    const curvature = Math.max(.15, (halfDistance ** 2 + neck ** 2 - radius ** 2) / (2 * (radius - neck)));
    const contactWidth = radius * (curvature + neck) / (radius + curvature);
    const remaining = (1 - recoil) ** 2;
    const width = clamp(contactWidth, .8, radius * .40) * (1 - recoil * .97);
    const seam = (a.r + distance - b.r) / 2;
    const bx = ax + ux * distance;
    const verts = [];
    function point(x, y) {
      const px = ax + ux * x - uy * y - origin.left;
      const py = a.y + uy * x + ux * y - origin.top;
      verts.push([px, py]);
      return px.toFixed(2) + ' ' + py.toFixed(2);
    }
    function shoulder(y, side) {
      const left = side === 1;
      const depth = rimDepth(left ? a : b, (left ? ax : bx) - uy * y,
        (left ? a.y : b.y) + ux * y, ux * side, uy * side);
      return (left ? 0 : distance) + side * (depth - .65 * remaining);
    }

    // Soften only the small bit of rim submerged in the joint. Its circular
    // cut stays local even when the two capsules meet along a flat side.
    function soften(button, rect, face, dir) {
      const outside = radius * .36;
      const cx = ax + ux * (face + dir * outside) - rect.left;
      const cy = a.y + uy * (face + dir * outside) - rect.top;
      const cut = Math.hypot(outside + width * width / (2 * radius), width);
      const mask = 'radial-gradient(circle at ' + cx.toFixed(2) + 'px ' + cy.toFixed(2) +
        'px, transparent ' + (cut - 1).toFixed(2) + 'px, black ' + (cut + .65).toFixed(2) + 'px)';
      button.style.setProperty('--water-cut', mask);
      // Submerged glass stops catching light along its former perimeter.
      const faceX = ax + ux * face - rect.left, faceY = a.y + uy * face - rect.top;
      button.style.setProperty('--wet-rim', 'radial-gradient(circle at ' + faceX.toFixed(2) + 'px ' +
        faceY.toFixed(2) + 'px, transparent ' + (width * .77).toFixed(2) +
        'px, black ' + (width * 1.55).toFixed(2) + 'px)');
    }
    soften(first, rectA, a.r, 1);
    soften(second, rectB, distance - b.r, -1);

    function side(face, dir) {
      const top = shoulder(-width, dir);
      const bottom = shoulder(width, dir);
      const reach = Math.min(Math.max(0, (seam - face) * dir), limit * .5);
      const tip = recoil ? face + dir * reach * remaining : seam;
      const tipWidth = breakAt === null ? neck : Math.min(neck, .65) * remaining;
      const cap = tip + dir * Math.min(reach * remaining, 1.1) * Math.sin(Math.PI * recoil);
      const grip = (x) => x + .28 * (tip - x);
      const tangent = (x) => tip + .48 * (x - tip);
      return {
        top: point(top, -width), bottom: point(bottom, width),
        upper: [point(grip(top), -.70 * width), point(tangent(top), -tipWidth), point(tip, -tipWidth)],
        lower: [point(tangent(bottom), tipWidth), point(grip(bottom), .70 * width), point(bottom, width)],
        tipBottom: point(tip, tipWidth), nose: point(cap, 0),
        inner: point(face - dir * (width * .85 + .9) * (1 - recoil), 0)
      };
    }
    const left = side(a.r, 1), right = side(distance - b.r, -1);
    function curve(points) { return 'C' + points.join(' '); }
    function tail(lobe) {
      return 'M' + lobe.top + curve(lobe.upper) + 'Q' + lobe.nose + ' ' + lobe.tipBottom +
        curve(lobe.lower) + 'Q' + lobe.inner + ' ' + lobe.top + 'Z';
    }
    let fill, glint;
    if (breakAt === null) {
      // One surface with a continuous tangent across the waist, no middle seam.
      glint = 'M' + left.top + curve(left.upper) + curve([right.upper[1], right.upper[0], right.top]);
      fill = glint + 'Q' + right.inner + ' ' + right.bottom +
        curve([right.lower[1], right.lower[0], right.tipBottom]) + curve(left.lower) +
        'Q' + left.inner + ' ' + left.top + 'Z';
    } else {
      fill = tail(left) + tail(right);
      glint = 'M' + left.top + curve(left.upper) + 'M' + right.top + curve(right.upper);
    }

    // The SVG viewport only encloses the actual droplets. Nothing paints the
    // button row, including during the frame in which the shape disappears.
    const xs = verts.map(p => p[0]), ys = verts.map(p => p[1]);
    const x = Math.floor(Math.min(...xs)) - 1, y = Math.floor(Math.min(...ys)) - 1;
    const w = Math.ceil(Math.max(...xs)) + 1 - x, h = Math.ceil(Math.max(...ys)) + 1 - y;
    svg.setAttribute('viewBox', [x, y, w, h].join(' '));
    svg.style.left = x + 'px'; svg.style.top = y + 'px';
    svg.style.width = w + 'px'; svg.style.height = h + 'px';
    surface.setAttribute('d', fill);
    highlight.setAttribute('d', glint);
    svg.style.visibility = 'visible';
    if (!holding || breakAt !== null || now - joinedAt < 110) requestPaint();
  }

  quiet.addEventListener?.('change', stop);
  new MutationObserver(() => {
    if (!enabled() && (holding || joinedAt !== null)) stop();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-glass-tier'] });
  window.addEventListener('resize', stop);
  window.addEventListener('pagehide', stop);
  return {
    begin(button, rect, x, y) {
      if (button !== first && button !== second) return;
      stop();
      if (!enabled()) return;
      holding = true;
      base = capsule(rect, -x, -y);
      peer = button === first ? second : first;
    },
    move(x, y) {
      if (!holding) return [x, y];
      const target = { ...base, left: base.left+x, right: base.right+x, y: base.y+y };
      const { ux, uy, gap } = contact(target, capsule(peer.getBoundingClientRect()));
      // The glass compresses at contact; the two labels keep their own space.
      const intrusion = Math.min(0, gap + .45);
      requestPaint();
      return [x + intrusion*ux, y + intrusion*uy];
    },
    end(cancelled) {
      if (!holding) return;
      holding = false;
      if (cancelled || joinedAt === null) { stop(); return; }
      releasedAt = performance.now();
      requestPaint();
    }
  };
}
