const hero = document.querySelector('.hero');
const picker = document.querySelector('[data-pick-wallpaper]');
const input = document.getElementById('wallpaper-file');
const reset = document.querySelector('[data-reset-wallpaper]');
const status = document.getElementById('wallpaper-status');

const maxBytes = 12 * 1024 * 1024;
const maxPixels = 24000000;
const maxEdge = 8192;
const displayEdge = 2048;

class ImageNotice extends Error {}
const invalid = () => new ImageNotice('请选择完整的 JPG、PNG 或 WebP 静态图片。');

function checkSize(width, height) {
  if (!width || !height) throw invalid();
  if (width > maxEdge || height > maxEdge || width * height > maxPixels) {
    throw new ImageNotice('图片过大，请选择 2400 万像素以内、单边不超过 8192 像素的图片。');
  }
}

// Inspect dimensions before asking the browser to allocate a decoded bitmap.
function inspectHeader(buffer) {
  const view = new DataView(buffer);
  const end = view.byteLength;
  if (end < 24) throw invalid();
  if (view.getUint32(0) === 0x89504e47 && view.getUint32(4) === 0x0d0a1a0a) {
    if (view.getUint32(8) !== 13 || view.getUint32(12) !== 0x49484452) throw invalid();
    checkSize(view.getUint32(16), view.getUint32(20));
    return 'image/png';
  }
  if (view.getUint16(0) === 0xffd8) {
    let offset = 2;
    while (offset + 4 <= end && view.getUint8(offset++) === 0xff) {
      while (offset < end && view.getUint8(offset) === 0xff) offset++;
      if (offset + 3 > end) break;
      const marker = view.getUint8(offset++);
      if (marker === 0xda || marker === 0xd9) break;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > end) break;
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        if (length < 8) break;
        checkSize(view.getUint16(offset + 5), view.getUint16(offset + 3));
        return 'image/jpeg';
      }
      offset += length;
    }
    throw invalid();
  }
  if (view.getUint32(0) === 0x52494646 && view.getUint32(8) === 0x57454250) {
    // Extended WebP has canvas dimensions in addition to the VP8/VP8L frame.
    const uint24 = p => view.getUint16(p, true) + view.getUint8(p + 2) * 65536;
    for (let p = 12; p + 8 <= end;) {
      const tag = view.getUint32(p);
      const length = view.getUint32(p + 4, true);
      const data = p + 8;
      if (data + length > end) break;
      if (tag === 0x56503858 && length >= 10) {
        if (view.getUint8(data) & 2) throw new ImageNotice('请选择静态图片，动态 WebP 无法设为背景。');
        checkSize(uint24(data + 4) + 1, uint24(data + 7) + 1);
      } else if (tag === 0x56503820 && length >= 10) {
        checkSize(view.getUint16(data + 6, true) & 0x3fff, view.getUint16(data + 8, true) & 0x3fff);
        return 'image/webp';
      } else if (tag === 0x5650384c && length >= 5) {
        const packed = view.getUint32(data + 1, true);
        checkSize((packed & 0x3fff) + 1, ((packed >>> 14) & 0x3fff) + 1);
        return 'image/webp';
      }
      p = data + length + (length % 2);
    }
  }
  throw invalid();
}

async function snapshot(file, current) {
  if (file.size > maxBytes) throw new ImageNotice('请选择 12 MB 以内的图片。');
  const type = inspectHeader(await file.arrayBuffer());
  if (!current()) return;
  // Ignore the filename and OS-provided MIME type. Only pass the validated encoding to the decoder.
  const raster = file.slice(0, file.size, type);
  let image;
  let localURL;
  try {
    if (typeof createImageBitmap === 'function') {
      image = await createImageBitmap(raster);
    } else {
      image = new Image();
      localURL = URL.createObjectURL(raster);
      image.src = localURL;
      await image.decode();
    }
    if (!current()) return;
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    checkSize(width, height);
    const ratio = Math.min(1, displayEdge / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    const ctx = canvas.getContext('2d', {alpha: false});
    ctx.fillStyle = '#eeeae1';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    if (image && image.close) image.close();
    if (localURL) URL.revokeObjectURL(localURL);
  }
}

function mount() {
  let version = 0;
  let pending = null;
  let busy = false;
  let applied = '';
  let messageTimer;
  let dragDepth = 0;

  function announce(message, transient = true) {
    clearTimeout(messageTimer);
    status.textContent = message;
    if (transient) messageTimer = setTimeout(() => { status.textContent = ''; }, 5500);
  }

  function apply(url, source) {
    const previous = applied;
    applied = url;
    if (url) hero.style.setProperty('--hero-photo', `url("${url}")`);
    else hero.style.removeProperty('--hero-photo');
    reset.hidden = !url;
    hero.dispatchEvent(new CustomEvent('wallpaperchange', {detail: {source}}));
    if (previous) URL.revokeObjectURL(previous);
  }

  // Keep just the newest pending drop. Only one decode and model invocation runs at a time.
  async function drain() {
    if (busy) return;
    busy = true;
    try {
      while (pending) {
        const {file, ticket} = pending;
        pending = null;
        const current = () => ticket === version;
        try {
          const canvas = await snapshot(file, current);
          if (!current()) continue;
          const {reviewImage} = await import('./image-review/review.js');
          if (!current()) continue;
          const review = await reviewImage(canvas);
          if (!current()) continue;
          if (review.unavailable) throw new ImageNotice('本机暂时无法检查图片，原背景已保留。');
          if (review?.allowed !== true) throw new ImageNotice('这张图片未通过检查，请换一张。');
          // Lossless export of exactly the opaque, static pixels that passed review.
          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
          if (!current()) continue;
          if (!blob) throw new Error('Canvas encoding failed');
          apply(URL.createObjectURL(blob), canvas);
          announce('背景已更换，本次打开主页期间有效。');
        } catch (error) {
          if (current()) announce(error instanceof ImageNotice ? error.message : '本机未能完成图片检查，原背景已保留。');
        }
      }
    } finally {
      busy = false;
    }
  }

  function choose(files) {
    version++;
    pending = null;
    if (files.length !== 1) { announce('请一次选择一张图片。'); return; }
    pending = {file: files[0], ticket: version};
    announce('正在本机检查图片…', false);
    drain();
  }

  function containsFiles(event) {
    return Array.from(event.dataTransfer?.types || []).includes('Files');
  }

  picker.hidden = false;
  picker.addEventListener('click', () => input.click());
  input.addEventListener('change', () => {
    if (input.files.length) choose(input.files);
    input.value = '';
  });
  reset.addEventListener('click', () => {
    version++;
    pending = null;
    apply('', null);
    picker.focus();
    announce('已恢复默认背景。');
  });
  document.addEventListener('dragenter', event => {
    if (!containsFiles(event)) return;
    event.preventDefault();
    dragDepth++;
    if (!document.querySelector('dialog[open]')) hero.classList.add('wallpaper-drop');
  });
  document.addEventListener('dragover', event => {
    if (!containsFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  });
  document.addEventListener('dragleave', () => {
    dragDepth = Math.max(0, dragDepth - 1);
    if (!dragDepth) hero.classList.remove('wallpaper-drop');
  });
  document.addEventListener('drop', event => {
    dragDepth = 0;
    hero.classList.remove('wallpaper-drop');
    if (!containsFiles(event)) return;
    event.preventDefault();
    if (!document.querySelector('dialog[open]')) choose(event.dataTransfer.files);
  });
}

if (hero && picker && input && reset && status && !window.watertubeIE) mount();
