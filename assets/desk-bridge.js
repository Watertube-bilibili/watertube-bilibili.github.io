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
  if (!nav || !CSS.supports('clip-path', "path(evenodd, 'M0 0H1V1Z')")) return null;
  const [first, second] = nav.querySelectorAll('.glass-control');
  const film = nav.querySelector('.glass-bridge-film');
  const rim = nav.querySelector('.glass-bridge-rim');
  const quiet = matchMedia('(prefers-reduced-motion: reduce), (prefers-reduced-transparency: reduce), (forced-colors: active)');
  const enabled = () => !quiet.matches && document.documentElement.dataset.glassTier !== 'lite';
  let holding = false, joinedAt = null, releasedAt = null, breakAt = null, frame = 0;
  let base, peer;

  function clearJoin() {
    joinedAt = breakAt = null;
    delete nav.dataset.bridgePhase;
    first.style.removeProperty('clip-path');
    second.style.removeProperty('clip-path');
    film.style.removeProperty('clip-path');
    rim.removeAttribute('d');
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
      if (!holding || gap > 4) return;
      joinedAt = now;
    }

    const radius = Math.min(a.r, b.r);
    const snapGap = radius * 1.22;
    const released = releasedAt === null ? 0 : clamp((now - releasedAt) / 135, 0, 1);
    const stretch = Math.max(released, clamp(gap / snapGap, 0, 1));
    if (holding && gap <= 4) breakAt = null;
    if (breakAt === null && (gap >= snapGap || released >= 1)) breakAt = now;
    const breaking = breakAt === null ? 0 : (now - breakAt) / 170;
    if (breaking >= 1) { clearJoin(); return; }

    const phase = breakAt !== null ? 'breaking' : (stretch > .22 ? 'stretching' : 'joined');
    if (nav.dataset.bridgePhase !== phase) nav.dataset.bridgePhase = phase;
    const growth = .32 + .68 * Math.min(1, (now - joinedAt) / 85);
    const retract = clamp((breaking - .25) / .75, 0, 1);
    const remaining = (1 - retract) ** 2;
    const width = radius * (.84 - .24 * stretch) * growth * (1 - .96 * retract);
    const neck = Math.max(.4, width * (.78 - .73 * stretch) * (1 - Math.min(1, breaking * 4)));
    const bx = ax + ux * distance;
    function point(x, y, rect = origin) {
      return (ax + ux*x - uy*y - rect.left).toFixed(2) + ' ' + (a.y + uy*x + ux*y - rect.top).toFixed(2);
    }
    // Repaint just the facing sectors. The rest of the capsule keeps its own lens.
    const seat = 1.7 * (1 - retract);
    function shoulders(y) {
      return [
        rimDepth(a, ax - uy*y, a.y + ux*y, ux, uy) - seat,
        distance - rimDepth(b, bx - uy*y, b.y + ux*y, -ux, -uy) + seat
      ];
    }
    const [at, bt] = shoulders(-width);
    const [ab, bb] = shoulders(width);
    const mid = (a.r + distance - b.r) / 2;
    function trim(button, rect, top, bottom, direction) {
      const p = (x, y) => point(x, y, rect);
      const cut = 'M' + p(top, -width) + 'L' + p(top + direction*90, -width) +
        'L' + p(bottom + direction*90, width) + 'L' + p(bottom, width) + 'Z';
      button.style.clipPath = "path(evenodd, 'M-120 -120H" + (rect.width+120) + 'V' +
        (rect.height+120) + "H-120Z " + cut + "')";
    }
    trim(first, rectA, at, ab, 1);
    trim(second, rectB, bt, bb, -1);

    // Draw each lobe from its upper shoulder around the tip to its lower shoulder.
    // The tips share a waist until pinch-off, then independently recoil to the rims.
    function lobe(top, bottom, face, dir) {
      const tip = face + (mid - face) * remaining;
      const topSpan = tip - top, bottomSpan = tip - bottom;
      const tipRadius = retract ? Math.min(2, width*.2) * Math.sin(Math.PI*retract) : neck;
      const upper = 'M' + point(top,-width) + 'C' + point(top+.23*topSpan,-width*.61) + ' ' +
        point(tip-.43*topSpan,-tipRadius) + ' ' + point(tip,-tipRadius);
      const nose = 'Q' + point(tip + dir*tipRadius,0) + ' ' + point(tip,tipRadius);
      const lower = 'C' + point(tip-.43*bottomSpan,tipRadius) + ' ' +
        point(bottom+.23*bottomSpan,width*.61) + ' ' + point(bottom,width);
      return { fill: upper + (retract ? nose : 'L'+point(tip,tipRadius)) + lower + 'Z',
        edge: upper + (retract ? nose : 'M'+point(tip,tipRadius)) + lower };
    }
    const left = lobe(at, ab, a.r, 1), right = lobe(bt, bb, distance-b.r, -1);
    film.style.clipPath = 'path("' + left.fill + right.fill + '")';
    rim.setAttribute('d', left.edge + right.edge);
    if (releasedAt !== null || breakAt !== null || now - joinedAt < 85) requestPaint();
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
      const intrusion = Math.min(0, gap + 2);
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
