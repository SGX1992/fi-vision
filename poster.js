window.POSTER_BRAND = {
  accent: '#00EB62', font: 'Poppins,"Helvetica Neue",Inter,Helvetica,Arial,sans-serif', serif: 'Tinos',
  bgDir: 'assets/img/bg', videoDir: 'assets/video', wordmark: 'assets/img/fi-wordmark.png', markW: 190,
  placeholder: 'assets/img/placeholder-photo.jpg',
  headline: 'I BELIEVE', eyebrow: 'My quote for the future', url: 'vision.footprint-intelligence.com',
  quotePlaceholder: 'Your quote for the future of corporate sustainability goes here.',
  captionLine: 'My quote for the future of corporate sustainability, shared on vision.footprint-intelligence.com',
  hashtags: '#FootprintLeaders #Sustainability #BeyondReporting', filePrefix: 'footprint-vision'
};

/* Live poster, ported from share.ddxconference.com (ddx-badge/assets/js/poster.js + brand.js):
   same 1080×1350 layout, same build-in choreography (each layer gets a window in the intro and
   fades up while sliding into place), same letter-by-letter name reveal, same photo card with
   drag-to-pan, same scrim and multiply brand wash. The "city" slot carries the quote instead. */
(() => {
  const B = window.POSTER_BRAND;
  const W = 1080, H = 1350;
  const FONT = B.font, WHITE = '#FFFFFF', ACCENT = B.accent, DISPLAY = 700;
  const INTRO_MS = 5000, NAME_REVEAL_MS = 420, BG_FADE_MS = 650, STILL_LOOP = 8;
  const CUE = {
    background: [0.00, 0.34], headline: [0.20, 0.46], card: [0.34, 0.62], eyebrow: [0.56, 0.72],
    quote: [0.64, 0.84], name: [0.74, 0.92], role: [0.80, 0.96], footer: [0.86, 1.00], tint: [0.40, 1.00],
  };
  const L = {
    side: 76, headline: B.headline, headMaxW: 936, headTrack: -0.038, headOverlap: 0.2,
    /* The photo is a small card here: the quote is the point of this poster, so it gets the room. */
    card: { w: 300, h: 340, r: 22, y: 272 },
    eyebrowGap: -58, eyebrowMaxW: 640, eyebrowCap: 30,
    quoteGap: 150, quoteMaxW: 928, quoteMax: 72, quoteMin: 30,
    nameGap: 92, nameMaxW: 760, nameCap: 46, nameTrack: -0.028,
    roleGap: 40, roleMaxW: 780, roleCap: 24, roleTrack: 0.16, roleTone: 0.34,
    tintStrength: 0.30, footBase: 1274, footSize: 22, footTrack: 0.42, footTone: 0.45, markW: B.markW || 150,
  };
  L.card.x = (W - L.card.w) / 2; L.card.bottom = L.card.y + L.card.h;

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const cue = (name, t) => { const [a, b] = CUE[name]; return t >= 1 ? 1 : easeOut(clamp((t - a) / (b - a), 0, 1)); };
  const loadImg = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });

  function trackedWidth(c, text, size, weight, em, font = FONT) {
    c.font = `${weight} ${size}px ${font}`; const extra = size * em; let w = 0; const ch = [...text];
    ch.forEach((x, i) => { w += c.measureText(x).width; if (i < ch.length - 1) w += extra; }); return w;
  }
  function fitSize(c, text, maxW, weight, em, cap = Infinity, font = FONT) {
    if (!text) return 0; const w = trackedWidth(c, text, 100, weight, em, font); return Math.min(cap, w ? (100 * maxW) / w : cap);
  }
  function drawTracked(c, text, x, y, size, weight, em, align = 'left', font = FONT) {
    c.font = `${weight} ${size}px ${font}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    const total = trackedWidth(c, text, size, weight, em, font);
    let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x; const extra = size * em;
    for (const ch of text) { c.fillText(ch, cx, y); cx += c.measureText(ch).width + extra; } return total;
  }
  function drawTrackedReveal(c, text, x, y, size, weight, em, align, progress, from = 0) {
    c.font = `${weight} ${size}px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    const total = trackedWidth(c, text, size, weight, em);
    let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x; const extra = size * em;
    const chars = [...text]; const moving = Math.max(1, chars.length - from); const span = .55; const step = moving > 1 ? (1 - span) / (moving - 1) : 0;
    const base = c.globalAlpha;
    chars.forEach((ch, i) => {
      let eased = 1;
      if (i >= from) { const p = clamp((progress - (i - from) * step) / span, 0, 1); eased = 1 - Math.pow(1 - p, 3); }
      if (eased > 0) { c.globalAlpha = base * eased; c.fillText(ch, cx, y + (1 - eased) * size * .22); }
      cx += c.measureText(ch).width + extra;
    });
    c.globalAlpha = base;
  }
  function capHeight(c, size, weight) { c.font = `${weight} ${size}px ${FONT}`; const m = c.measureText('H'); return m.actualBoundingBoxAscent || size * .72; }
  function mixHex(a, b, t) { const v = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const [ar, ag, ab] = v(a), [br, bg, bb] = v(b); const to = x => Math.round(x).toString(16).padStart(2, '0'); return `#${to(ar + (br - ar) * t)}${to(ag + (bg - ag) * t)}${to(ab + (bb - ab) * t)}`; }
  function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function wrap(c, text, maxW) { const words = text.split(/\s+/), lines = []; let line = ''; words.forEach(w => { const t = line ? line + ' ' + w : w; if (c.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }); if (line) lines.push(line); return lines; }
  function paintCover(c, img, zoom, alpha) {
    if (!img || alpha <= 0) return; const iw = img.videoWidth || img.naturalWidth || img.width, ih = img.videoHeight || img.naturalHeight || img.height; if (!iw) return;
    const s = Math.max(W / iw, H / ih) * zoom, dw = iw * s, dh = ih * s; const prev = c.globalAlpha; c.globalAlpha = prev * alpha;
    c.drawImage(img, (W - dw) / 2, (H - dh) * .42, dw, dh); c.globalAlpha = prev;
  }
  function layer(c, p, rise, body) {
    if (p <= 0) return; if (p >= 1) return body();
    c.save(); c.globalAlpha = p; c.translate(0, (1 - p) * rise); body(); c.restore();
  }
  /* Backgrounds come from the two manifests, same shape as the poster tool: only the chosen clip is
     ever fetched (they are megabytes each); the picker shows the poster stills instead. */
  const manifest = dir => fetch(`${dir}/manifest.json`).then(r => r.ok ? r.json() : {}).catch(() => ({}))
    .then(m => (Array.isArray(m._shared) ? m._shared : []).filter(x => x && typeof x.file === 'string'));
  const videoCache = new Map();
  function loadVideo(src) {
    if (videoCache.has(src)) return videoCache.get(src);
    const pr = new Promise(res => {
      const v = document.createElement('video'); v.src = src; v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
      v.addEventListener('canplay', () => res(v), { once: true });
      v.addEventListener('error', () => { console.warn(`no background video at ${src}`); res(null); }, { once: true });
    });
    videoCache.set(src, pr); return pr;
  }
  /* Exports have to land on an exact frame, so they seek rather than watch the clip play. A seek to the
     time it is already at fires no `seeked`, hence the timeout. */
  const seek = (video, t) => new Promise(res => {
    if (Math.abs(video.currentTime - t) < 1e-3) return res(); let done = false;
    const finish = () => { if (done) return; done = true; video.removeEventListener('seeked', finish); res(); };
    video.addEventListener('seeked', finish); setTimeout(finish, 400); video.currentTime = t;
  });
  const sharedPrefix = (a = '', b = '') => { const n = Math.min(a.length, b.length); let i = 0; while (i < n && a[i] === b[i]) i++; return i; };

  class LivePoster {
    constructor() {
      this.canvas = document.createElement('canvas'); this.canvas.width = W; this.canvas.height = H;
      this.ctx = this.canvas.getContext('2d');
      this.data = { quote: '', name: '', role: '', photo: null, photoZoom: 1 };
      this.pan = { x: 0, y: -0.25 };
      this.introStart = 0; this.nameAt = 0; this.nameFrom = 0; this.dropActive = false;
      this.bg = null; this.bgPrev = null; this.bgFade = 0; this.wordmark = null; this.placeholder = null;
      this.mode = 'image'; this.bgIndex = 0; this.videoIndex = 0; this.video = null; this.videoKey = '';
      this.bgs = []; this.clips = []; this.bgLoad = 0;
      this.lists = Promise.all([manifest(B.bgDir), manifest(B.videoDir)]).then(([bgs, clips]) => {
        this.bgs = bgs.length ? bgs : [{ file: 'neutral-1.png', label: 'Ember' }]; this.clips = clips; return { bgs: this.bgs, clips: this.clips };
      });
      const firstBg = this.lists.then(() => loadImg(`${B.bgDir}/${this.bgs[0].file}`));
      this.ready = Promise.all([firstBg, loadImg(B.wordmark), loadImg(B.placeholder),
        document.fonts.load(`italic 400 54px ${B.serif}`).catch(() => {}), document.fonts.load(`700 150px ${FONT}`).catch(() => {}), document.fonts.load(`500 24px ${FONT}`).catch(() => {}), document.fonts.load(`600 34px ${FONT}`).catch(() => {})])
        .then(([bg, wm, ph]) => { this.bg = bg; this.wordmark = wm; this.placeholder = ph; });
    }
    get card() { return L.card; }
    /* Picker API. The background swap crossfades (the new still rises through the old one); the clip is
       fetched on first use and only runs while it is the active layer. */
    async setBackground(i) {
      await this.lists; i = clamp(i | 0, 0, this.bgs.length - 1); if (i === this.bgIndex && this.bg) return;
      this.bgIndex = i; const token = ++this.bgLoad; const img = await loadImg(`${B.bgDir}/${this.bgs[i].file}`);
      if (token !== this.bgLoad || !img) return;
      if (this.bg && this.bg !== img) { this.bgPrev = this.bg; this.bgFade = performance.now(); }
      this.bg = img;
    }
    async setClip(i) {
      await this.lists; if (!this.clips.length) return; i = clamp(i | 0, 0, this.clips.length - 1); this.videoIndex = i;
      const src = `${B.videoDir}/${this.clips[i].file}`; if (this.videoKey === src && this.video) { this.resume(); return; }
      const v = await loadVideo(src); if (this.videoIndex !== i) return;
      if (this.video && this.video !== v) this.video.pause();
      this.video = v; this.videoKey = src; this.resume();
    }
    async setMode(mode) {
      this.mode = mode === 'video' ? 'video' : 'image';
      if (this.mode === 'video') await this.setClip(this.videoIndex); else this.video?.pause();
    }
    get loopSeconds() { const d = this.mode === 'video' ? this.video?.duration : 0; return Number.isFinite(d) && d > 0.2 ? d : STILL_LOOP; }
    async prepare(seconds) { if (this.mode !== 'video' || !this.video) return; this.video.pause(); await seek(this.video, seconds % this.loopSeconds); }
    resume() { if (this.mode === 'video') this.video?.play().catch(() => {}); }
    drawBackground(c, zoom) {
      if (this.mode === 'video' && this.video && this.video.readyState >= 2) return paintCover(c, this.video, 1, 1);
      let p = 1;
      if (this.bgFade) { p = clamp((performance.now() - this.bgFade) / BG_FADE_MS, 0, 1); if (p >= 1) { this.bgFade = 0; this.bgPrev = null; } }
      if (this.bgPrev && p < 1) paintCover(c, this.bgPrev, zoom, 1);
      paintCover(c, this.bg, zoom, p);
    }
    beginIntro() { this.introStart = performance.now(); }
    skipIntro() { this.introStart = 0; this.nameAt = 0; this.nameFrom = 0; }
    get introT() { if (!this.introStart) return 1; const t = (performance.now() - this.introStart) / INTRO_MS; if (t >= 1) { this.introStart = 0; return 1; } return t; }
    setData(d) {
      if (this.data.photo !== d.photo) this.pan = { x: 0, y: -0.25 };
      if ((this.data.name || '') !== (d.name || '')) { this.nameFrom = sharedPrefix((this.data.name || '').toUpperCase(), (d.name || '').toUpperCase()); this.nameAt = performance.now(); }
      this.data = { ...this.data, ...d };
    }
    photoRect() {
      const p = this.data.photo || this.placeholder; if (!p) return null;
      const iw = p.naturalWidth || p.width, ih = p.naturalHeight || p.height;
      const scale = Math.max(L.card.w / iw, L.card.h / ih) * (this.data.photo ? (this.data.photoZoom || 1) : 1);
      const dw = iw * scale, dh = ih * scale, slackX = (dw - L.card.w) / 2, slackY = (dh - L.card.h) / 2;
      return { img: p, dw, dh, slackX, slackY, x: L.card.x - slackX + clamp(this.pan.x, -1, 1) * slackX, y: L.card.y - slackY + clamp(this.pan.y, -1, 1) * slackY };
    }
    nudgePhoto(dx, dy) { const r = this.photoRect(); if (!r || !this.data.photo) return; if (r.slackX > .5) this.pan.x = clamp(this.pan.x + dx / r.slackX, -1, 1); if (r.slackY > .5) this.pan.y = clamp(this.pan.y + dy / r.slackY, -1, 1); }
    setFraming(y) { this.pan.y = clamp(y, -1, 1); }

    renderAt() {
      const c = this.ctx, d = this.data, t = this.introT;
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      layer(c, cue('background', t), 0, () => {
        const bgp = cue('background', t);
        this.drawBackground(c, 1 + (1 - bgp) * .06);
        c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(0, 0, W, H);
        let g = c.createLinearGradient(0, 0, 0, H * .30); g.addColorStop(0, 'rgba(0,0,0,.50)'); g.addColorStop(.5, 'rgba(0,0,0,.16)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H * .30);
        const fadeTop = H * .28, fadeEnd = H * .60;
        g = c.createLinearGradient(0, fadeTop, 0, fadeEnd); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, 'rgba(0,0,0,.62)'); g.addColorStop(1, 'rgba(0,0,0,1)'); c.fillStyle = g; c.fillRect(0, fadeTop, W, fadeEnd - fadeTop);
        c.fillStyle = '#000'; c.fillRect(0, fadeEnd - 1, W, H - fadeEnd + 1);
      });
      layer(c, cue('headline', t), 20, () => {
        const size = fitSize(c, L.headline, L.headMaxW, DISPLAY, L.headTrack); const cap = capHeight(c, size, DISPLAY);
        c.fillStyle = WHITE; drawTracked(c, L.headline, W / 2, L.card.y + cap * L.headOverlap, size, DISPLAY, L.headTrack, 'center');
      });
      { const p = cue('card', t); const { x, y, w, h, r } = L.card;
        if (p > 0) { c.save(); c.globalAlpha = p;
          if (p < 1) { const k = .94 + .06 * p; c.translate(x + w / 2, y + h / 2); c.scale(k, k); c.translate(-(x + w / 2), -(y + h / 2)); }
          roundRect(c, x, y, w, h, r); c.clip(); c.fillStyle = '#14161A'; c.fillRect(x, y, w, h);
          const pr = this.photoRect(); if (pr) c.drawImage(pr.img, pr.x, pr.y, pr.dw, pr.dh);
          if (this.dropActive) { roundRect(c, x, y, w, h, r); c.strokeStyle = ACCENT; c.lineWidth = 8; c.stroke(); }
          const g = c.createLinearGradient(0, y + h * .42, 0, y + h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.45, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,1)');
          c.fillStyle = g; c.fillRect(x, y, w, h); c.restore(); } }
      const eyebrow = B.eyebrow.toUpperCase();
      layer(c, cue('eyebrow', t), 12, () => { c.fillStyle = ACCENT; drawTracked(c, eyebrow, W / 2, L.card.bottom - L.eyebrowGap, fitSize(c, eyebrow, L.eyebrowMaxW, 600, .24, L.eyebrowCap), 600, .24, 'center'); });
      const placeholderQ = !d.quote; const text = `“${(d.quote || B.quotePlaceholder).trim()}”`;
      const role = (d.role || '').toUpperCase(); const placeholderN = !d.name; const name = (d.name || 'Your name').toUpperCase();
      const quoteTop = L.card.bottom + L.quoteGap, limit = L.footBase - 84;
      let size = L.quoteMax, lines, lh, nameY, roleY;
      for (;;) {
        c.font = `italic 400 ${size}px ${B.serif}`; lines = wrap(c, text, L.quoteMaxW); lh = size * 1.18;
        nameY = quoteTop + (lines.length - 1) * lh + L.nameGap; roleY = nameY + L.roleGap;
        if ((role ? roleY : nameY) <= limit || size <= L.quoteMin) break; size -= 2;
      }
      layer(c, cue('quote', t), 18, () => { c.fillStyle = placeholderQ ? mixHex(WHITE, '#000000', .52) : WHITE; c.font = `italic 400 ${size}px ${B.serif}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; lines.forEach((l, i) => c.fillText(l, W / 2, quoteTop + i * lh)); });
      const nameSize = fitSize(c, name, L.nameMaxW, 700, L.nameTrack, L.nameCap);
      let reveal = 1; if (this.nameAt) { reveal = (performance.now() - this.nameAt) / NAME_REVEAL_MS; if (reveal >= 1) { this.nameAt = 0; this.nameFrom = 0; reveal = 1; } }
      layer(c, cue('name', t), 14, () => {
        c.fillStyle = placeholderN ? mixHex(WHITE, '#000000', .52) : WHITE;
        if (reveal < 1) drawTrackedReveal(c, name, W / 2, nameY, nameSize, 700, L.nameTrack, 'center', reveal, this.nameFrom);
        else drawTracked(c, name, W / 2, nameY, nameSize, 700, L.nameTrack, 'center');
      });
      if (role) layer(c, cue('role', t), 12, () => { c.fillStyle = mixHex(WHITE, '#000000', L.roleTone); drawTracked(c, role, W / 2, roleY, fitSize(c, role, L.roleMaxW, 500, L.roleTrack, L.roleCap), 500, L.roleTrack, 'center'); });
      layer(c, cue('footer', t), 14, () => {
        c.fillStyle = mixHex(ACCENT, '#FFFFFF', L.footTone); drawTracked(c, B.url.toUpperCase(), L.side, L.footBase, L.footSize, 400, L.footTrack, 'left');
        const wm = this.wordmark; if (wm) { const w = L.markW, h = w * wm.naturalHeight / wm.naturalWidth; c.drawImage(wm, W - L.side - w, L.footBase - h * .78, w, h); }
      });
      { const p = cue('tint', t); if (p > 0) { const end = mixHex('#FFFFFF', ACCENT, L.tintStrength * p);
        const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#FFFFFF'); g.addColorStop(.32, mixHex('#FFFFFF', end, .22)); g.addColorStop(1, end);
        c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore(); } }
      return this.canvas;
    }
  }

  window.LivePoster = LivePoster;
  window.posterCaption = v => `“${v.quote}”\n\n— ${v.name}${v.role ? ', ' + v.role : ''}\n\n${B.captionLine}\n${B.hashtags}`;
  window.posterBlob = c => new Promise(res => c.toBlob(res, 'image/png'));
  window.posterFileName = (v, ext = 'png') => `${B.filePrefix}-${(v.name || 'me').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'me'}.${ext}`;
})();
