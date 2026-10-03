/* Digital Innovators — quote stream + entry field. No dependencies. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const KEY = 'fi-voices';
  const html = document.documentElement;

  /* ---------- data ---------- */
  const mine = (() => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } })();
  const voices = [...window.VOICES, ...mine.map(v => ({ ...v, city: 'You', mine: true }))];

  const initials = n => n.trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase();
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function makeCard(v) {
    const el = document.createElement('article');
    el.className = 'card' + (v.mine ? ' mine' : '');
    el.dataset.city = v.city;
    const pic = v.img
      ? `<img class="card__pic" src="assets/img/speakers/${v.img}.png" alt="" loading="lazy" decoding="async" width="52" height="52">`
      : `<span class="card__pic initials" aria-hidden="true">${esc(initials(v.name || '?'))}</span>`;
    if (v.post) el.classList.add('has-post');
    const media = v.post ? `<figure class="card__media"><img data-src="assets/img/posts/${v.post}" alt="" loading="lazy" decoding="async"></figure>` : '';
    const more = '';
    el.innerHTML = media + `<span class="card__city">${esc(v.city)}</span>
      <div class="card__who">${pic}<div><div class="card__name">${esc(v.name)}</div>${v.role ? `<div class="card__role">${esc(v.role)}</div>` : ''}</div></div>
      <p class="card__q${v.kind === 'session' ? ' session' : ''}">${v.kind === 'session' ? '<span class="card__tag">Session · ' + esc(v.city) + '</span>' : ''}${esc(v.quote)}</p>` + (v.hook ? `<p class="card__hook">${esc(v.hook)}</p>` : '') + more;
    el._voice = v;
    return el;
  }

  /* ---------- counter ---------- */
  const countEl = $('#count');
  let total = voices.length;
  function tickCount(to, ms = 1500) {
    const from = +countEl.textContent || 0, t0 = performance.now();
    const step = t => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      countEl.textContent = Math.round(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  /* ---------- river ---------- */
  const river = $('#river'), colsEl = $('#cols');
  const NCOL = 3;
  const cols = [];
  const GAP = () => parseFloat(getComputedStyle($('.col__track')).rowGap) || 24;
  (function buildRiver() {
    // balance columns by text length, longest first
    const sorted = [...voices].sort((a, b) => b.quote.length - a.quote.length);
    const buckets = Array.from({ length: NCOL }, () => ({ len: 0, items: [] }));
    sorted.forEach(v => { const b = buckets.reduce((m, x) => x.len < m.len ? x : m); b.items.push(v); b.len += v.quote.length + 180; });
    // shuffle inside each column so cities mix
    buckets.forEach(b => b.items.sort(() => Math.random() - .5));
    const speeds = [11, -8, 13], par = [.26, -.16, .34];
    buckets.forEach((b, i) => {
      const col = document.createElement('div'); col.className = 'col';
      const track = document.createElement('div'); track.className = 'col__track';
      const c1 = document.createElement('div'); c1.className = 'track-copy';
      const c2 = document.createElement('div'); c2.className = 'track-copy';
      b.items.forEach(v => { c1.appendChild(makeCard(v)); c2.appendChild(makeCard(v)); });
      track.append(c1, c2); col.appendChild(track); colsEl.appendChild(col);
      cols.push({ el: col, track, c1, c2, speed: speeds[i], par: par[i], H: 0, offset: Math.random() * 600, riders: [], pending: [] });
    });
  })();

  function measure() { cols.forEach(c => { c.H = c.c2.offsetTop - c1Top(c); }); }
  const c1Top = c => c.c1.offsetTop;
  addEventListener('resize', measure);
  addEventListener('load', measure);
  measure();
  if ('ResizeObserver' in window) { const ro = new ResizeObserver(measure); cols.forEach(c => ro.observe(c.c1)); }
  else { setTimeout(measure, 800); setTimeout(measure, 3000); }

  let calm = 0, calmTarget = 0;   // 1 = user is typing, river slows and dims
  let lastT = performance.now(), lastScroll = scrollY;
  const pointer = { x: innerWidth / 2, y: innerHeight / 2, t: 0 };
  let frame = 0, lastBlur = 0;

  function loop(t) {
    const dt = Math.min(.05, (t - lastT) / 1000); lastT = t;
    const ds = scrollY - lastScroll; lastScroll = scrollY;
    calm += (calmTarget - calm) * Math.min(1, dt * 2.2);
    const vh = innerHeight;
    // the whole stream blurs and dims as the page scrolls past the hero
    const bl = Math.max(0, Math.min(1, (scrollY - vh * .12) / (vh * .7)));
    if (Math.abs(bl - lastBlur) > .004) { lastBlur = bl; river.style.filter = bl > 0 ? `blur(${(bl * 16).toFixed(1)}px)` : ''; if (html.classList.contains('ready')) river.style.opacity = (1 - bl * .6).toFixed(3); }
    cols.forEach(c => {
      if (!c.H) return;
      c.offset += c.speed * dt * (1 - calm * .72) + ds * c.par;
      const m = ((c.offset % c.H) + c.H) % c.H;
      c.track.style.transform = `translate3d(0,${-m.toFixed(2)}px,0)`;
      // voices added by visitors join the loop once the seam between the copies is off screen
      while (c.pending.length && m < c.H - vh - 320) { const el = c.pending.shift(); c.c1.appendChild(el); c.c2.appendChild(el.cloneNode(true)); measure(); }
      // riders: freshly added voices that enter from the bottom and join the loop once off-screen
      for (let i = c.riders.length - 1; i >= 0; i--) {
        const r = c.riders[i];
        const age = (t - r.t0) / 1000;
        const boost = r.boost * (1 - Math.pow(1 - Math.max(0, Math.min(1, age / 2.6)), 3));
        // hold the card in place under the field for a while, then let it drift with the stream
        if (age < 9) r.o0 = c.offset;
        const y = r.startY - boost - (c.offset - r.o0);
        r.el.style.transform = `translate3d(0,${y.toFixed(2)}px,0)`;
        if (age > 16) r.el.classList.remove('fresh');
        if ((y + r.h < -60 || y > vh + 60) && m < c.H - vh - r.h - 80) {
          // fold into both copies below the visible window, no visible jump
          c.c1.appendChild(r.el.firstElementChild.cloneNode(true));
          c.c2.appendChild(r.el.firstElementChild.cloneNode(true));
          c.H += r.h + GAP();
          r.el.remove(); c.riders.splice(i, 1);
        }
      }
    });
    // pointer proximity: cards near the cursor regain colour
    if (fine && (frame++ % 2 === 0) && t - pointer.t < 2500) {
      const R = 360;
      river.querySelectorAll('.card').forEach(card => {
        const b = card.getBoundingClientRect();
        if (b.bottom < 0 || b.top > vh) { if (card.dataset.near) { card.style.setProperty('--near', 0); card.dataset.near = ''; } return; }
        const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
        const d = Math.hypot(cx - pointer.x, cy - pointer.y);
        const near = Math.pow(Math.max(0, 1 - d / R), 1.6) * (1 - calm * .8);
        if (near > .01 || card.dataset.near) { card.style.setProperty('--near', near.toFixed(3)); card.dataset.near = near > .01 ? '1' : ''; }
      });
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  addEventListener('pointermove', e => {
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.t = performance.now();
    html.style.setProperty('--mx', e.clientX + 'px'); html.style.setProperty('--my', e.clientY + 'px');
  }, { passive: true });

  /* ---------- archive grid ---------- */
  const grid = $('#grid');
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  function addToGrid(v, first) {
    const el = makeCard(v);
    first ? grid.prepend(el) : grid.appendChild(el);
    io.observe(el); return el;
  }
  // own voices first, then the leaders in a mixed order
  [...voices].sort((a, b) => (b.mine ? 1 : 0) - (a.mine ? 1 : 0) || Math.random() - .5).forEach(v => addToGrid(v));

  $('#filters').addEventListener('click', e => {
    const chip = e.target.closest('.chip'); if (!chip) return;
    $('#filters .on')?.classList.remove('on'); chip.classList.add('on');
    const city = chip.dataset.city;
    const posts = grid.classList.contains('posts');
    grid.querySelectorAll('.card').forEach(c => {
      const byCity = !!city && c.dataset.city !== city; c.classList.toggle('hide-city', byCity);
      const noPost = posts && !(c._voice && (c._voice.post || c._voice.ig));
      c.classList.toggle('hide', byCity || noPost); if (!byCity) c.classList.add('in');
    });
  });

  /* ---------- posts view + lightbox ---------- */
  const BRAND_KW = "Footprint Intelligence";
  const lb = $('#lb');
  function openPost(v) {
    const m = $('#lbMedia'); m.innerHTML = '';
    if (v.ig) { const f = document.createElement('iframe'); f.src = `https://www.instagram.com/reel/${v.ig}/embed/`; f.loading = 'lazy'; f.allow = 'autoplay; encrypted-media'; m.appendChild(f); }
    else if (v.post) { const i = document.createElement('img'); i.src = `assets/img/posts/${v.post}`; i.alt = `Speaker card of ${v.name}`; m.appendChild(i); }
    $('#lbName').textContent = v.name; $('#lbRole').textContent = v.role || '';
    const hk = $('#lbHook'); hk.className = 'lb__hook'; hk.textContent = v.hook || v.quote || '';
    const q = encodeURIComponent(`"${v.name}" ${BRAND_KW}`);
    $('#lbLinks').innerHTML = `<a href="https://www.linkedin.com/search/results/content/?keywords=${q}" target="_blank" rel="noopener">Find the post on LinkedIn ↗</a>` +
      (v.ig ? `<a href="https://www.instagram.com/reel/${v.ig}/" target="_blank" rel="noopener">Open on Instagram ↗</a>` : '');
    lb.hidden = false; document.body.style.overflow = 'hidden';
  }
  function closePost() { lb.hidden = true; document.body.style.overflow = ''; $('#lbMedia').innerHTML = ''; }
  lb.addEventListener('click', e => { if (e.target.closest('[data-close]')) closePost(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !lb.hidden) closePost(); });
  grid.addEventListener('click', e => {
    const card = e.target.closest('.card'); if (!card || !card._voice) return;
    if (e.target.closest('[data-post]') || grid.classList.contains('posts')) { if (card._voice.post || card._voice.ig) openPost(card._voice); }
  });
  $('#view').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $('#view .on')?.classList.remove('on'); b.classList.add('on');
    const posts = b.dataset.view === 'posts';
    grid.classList.toggle('posts', posts);
    if (posts) grid.querySelectorAll('.card__media img[data-src]').forEach(i => { i.src = i.dataset.src; i.removeAttribute('data-src'); });
    grid.querySelectorAll('.card').forEach(c => { const noPost = posts && !(c._voice && (c._voice.post || c._voice.ig)); c.classList.toggle('hide', c.classList.contains('hide-city') || noPost); });
  });

  /* ---------- intro timeline ---------- */
  const seen = sessionStorage.getItem('fi-seen');
  const scale = reduce ? 0 : seen ? .3 : 1;
  const timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms * scale));
  const line = $('#line'), h1 = $('#h1');
  const GLYPHS = '#%&/()=?*+<>{}[]ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const chars = [];
  h1.querySelectorAll('.w').forEach(w => {
    const word = w.dataset.word;
    [...word].forEach(ch => { const s = document.createElement('span'); s.className = 'c'; s.textContent = ch; s.dataset.ch = ch; w.appendChild(s); chars.push(s); });
  });

  function scramble(s, i) {
    if (scale === 0) { s.classList.add('on'); return; }
    let n = 0; s.classList.add('on', 'hot');
    const iv = setInterval(() => {
      n++; s.textContent = n < 9 ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)] : s.dataset.ch;
      if (n >= 9) { clearInterval(iv); setTimeout(() => s.classList.remove('hot'), 420 + i * 10); }
    }, 42);
    timers.push(iv);
  }

  function finish() {
    timers.forEach(clearTimeout); timers.forEach(clearInterval);
    line.classList.add('go', 'tiny');
    chars.forEach(s => { s.textContent = s.dataset.ch; s.classList.add('on'); s.classList.remove('hot'); });
    ['#eyebrow', '#sub', '#lead', '#ask'].forEach(s => $(s).classList.add('in'));
    html.classList.add('ready'); $('#skip').classList.remove('show');
    countEl.textContent = total;
    startGhost();
    sessionStorage.setItem('fi-seen', '1');
  }

  if (scale === 0) { finish(); }
  else {
    at(200, () => line.classList.add('go'));
    at(900, () => $('#skip').classList.add('show'));
    at(1500, () => { $('#eyebrow').classList.add('in'); line.classList.add('tiny'); });
    chars.forEach((s, i) => at(1600 + i * 75, () => scramble(s, i)));
    at(3200, () => $('#sub').classList.add('in'));
    at(3800, () => html.classList.add('ready'));
    at(4200, () => $('#lead').classList.add('in'));
    at(4500, () => { $('#ask').classList.add('in'); tickCount(total, 1800); });
    at(5600, () => { startGhost(); $('#skip').classList.remove('show'); sessionStorage.setItem('fi-seen', '1'); });
  }
  $('#skip').addEventListener('click', finish);
  addEventListener('keydown', e => { if (e.key === 'Escape' && !html.classList.contains('ready')) finish(); });

  /* ---------- ghost placeholder typewriter ---------- */
  const ghostText = $('#ghostText');
  const prompts = [
    'The future of corporate sustainability is…',
    'Beyond reporting, sustainability will…',
    'In five years, every sustainability leader will…',
    'What matters most now is…'
  ];
  let ghostOn = false;
  function startGhost() {
    if (ghostOn) return; ghostOn = true;
    if (reduce) { ghostText.textContent = prompts[0]; return; }
    let p = 0, i = 0, del = false;
    const tick = () => {
      if (ask.classList.contains('has') || document.activeElement === q && q.value) { setTimeout(tick, 400); return; }
      const s = prompts[p];
      if (!del) { i++; ghostText.textContent = s.slice(0, i); if (i >= s.length) { del = true; setTimeout(tick, 2600); return; } setTimeout(tick, 38 + Math.random() * 70); }
      else { i--; ghostText.textContent = s.slice(0, i); if (i <= 0) { del = false; p = (p + 1) % prompts.length; setTimeout(tick, 500); return; } setTimeout(tick, 22); }
    };
    setTimeout(tick, 300);
  }

  /* ---------- the tool: fields on the left, the live poster on the right ---------- */
  const ask = $('#ask'), q = $('#q'), nameI = $('#name'), roleI = $('#role'), send = $('#send'), len = $('#len');
  const live = new window.LivePoster();
  const previewCanvas = $('#previewCanvas'), previewCtx = previewCanvas.getContext('2d');
  let photo = null, exporting = false, idleT;
  const readForm = () => ({ quote: q.value.trim().replace(/\s+/g, ' '), name: nameI.value.trim(), role: roleI.value.trim(), photo, photoZoom: parseFloat($('#zoomInput').value) || 1 });
  const rebuild = () => live.setData(readForm());
  function syncField() {
    const n = q.value.trim().length;
    ask.classList.toggle('has', n > 0);
    len.textContent = `${q.value.length} / 420`;
    send.disabled = !(n >= 12 && nameI.value.trim().length >= 2);
    q.style.height = 'auto'; q.style.height = Math.max(96, q.scrollHeight) + 'px';
    rebuild();
  }
  function typing() {
    ask.classList.add('typing'); river.classList.add('calm'); calmTarget = 1;
    clearTimeout(idleT); idleT = setTimeout(() => { ask.classList.remove('typing'); river.classList.remove('calm'); calmTarget = 0; }, 3500);
  }
  [q, nameI, roleI].forEach(el => { ['input', 'keyup', 'change'].forEach(ev => el.addEventListener(ev, () => { syncField(); typing(); })); el.addEventListener('focus', typing); });
  q.addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !send.disabled) ask.requestSubmit(); });
  $('#zoomInput').addEventListener('input', rebuild);
  $('#panInput').addEventListener('input', () => live.setFraming(parseFloat($('#panInput').value)));
  [...document.querySelectorAll('.fields > *')].forEach((el, i) => el.style.setProperty('--i', i));
  syncField();

  // the live preview, drawn every frame while it is on screen
  let previewVisible = true;
  new IntersectionObserver(es => es.forEach(e => { previewVisible = e.isIntersecting; })).observe(previewCanvas);
  (function tick() { requestAnimationFrame(tick); if (!previewVisible || exporting) return; previewCtx.drawImage(live.renderAt(), 0, 0); })();
  live.ready.then(rebuild);
  // the poster assembles itself layer by layer the moment the tool deals in
  let introStarted = false;
  const startIntro = () => { if (introStarted || !ask.classList.contains('in')) return; introStarted = true; live.ready.then(() => { rebuild(); if (!reduce) live.beginIntro(); }); };
  new MutationObserver(startIntro).observe(ask, { attributes: true, attributeFilter: ['class'] }); startIntro();

  /* ---------- photo: upload, camera, drop, drag ---------- */
  const uploadBtn = $('#uploadBtn'), webcamBtn = $('#webcamBtn'), fileInput = $('#fileInput'), cameraInput = $('#cameraInput'), photoThumb = $('#photoThumb');
  function setPhoto(source) {
    photo = source; uploadBtn.classList.add('has-photo'); uploadBtn.querySelector('span').textContent = 'Change Photo';
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    const iw = source.naturalWidth || source.width, ih = source.naturalHeight || source.height, side = Math.min(iw, ih);
    x.drawImage(source, (iw - side) / 2, (ih - side) / 2, side, side, 0, 0, 128, 128);
    photoThumb.src = c.toDataURL(); photoThumb.hidden = false; $('#sliders').hidden = false; $('#panInput').value = -0.25; rebuild();
  }
  function readImage(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) return reject(new Error('not an image'));
      const fr = new FileReader(); fr.onerror = () => reject(new Error('read failed'));
      fr.onload = () => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error('decode failed')); img.src = fr.result; };
      fr.readAsDataURL(file);
    });
  }
  const acceptFile = f => { if (!f) return; readImage(f).then(setPhoto).catch(() => {}); };
  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => { acceptFile(fileInput.files?.[0]); fileInput.value = ''; });
  cameraInput.addEventListener('change', () => { acceptFile(cameraInput.files?.[0]); cameraInput.value = ''; });
  $('#cardOverlay').addEventListener('click', e => { const act = e.target.closest('.card-cta')?.dataset.act; if (act === 'upload') uploadBtn.click(); else if (act === 'camera') webcamBtn.click(); });
  {
    const dialog = $('#webcamDialog'), video = $('#camVideo'); let stream = null;
    const stop = () => { stream?.getTracks().forEach(t => t.stop()); stream = null; video.srcObject = null; };
    webcamBtn.addEventListener('click', async () => {
      if (matchMedia('(pointer: coarse)').matches) return cameraInput.click();
      try { stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false }); } catch { return; }
      video.srcObject = stream; dialog.showModal();
    });
    $('#camShoot').addEventListener('click', () => {
      if (!video.videoWidth) return;
      const vw = video.videoWidth, vh = video.videoHeight; let cw = vh * .75, ch = vh; if (cw > vw) { cw = vw; ch = vw / .75; }
      const c = document.createElement('canvas'); c.width = 900; c.height = 1200; const x = c.getContext('2d');
      x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(video, (vw - cw) / 2, (vh - ch) / 2, cw, ch, 0, 0, c.width, c.height);
      stop(); dialog.close(); setPhoto(c);
    });
    $('#camCancel').addEventListener('click', () => { stop(); dialog.close(); });
    dialog.addEventListener('cancel', stop);
  }
  {
    const at = e => { const r = previewCanvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * previewCanvas.width, y: (e.clientY - r.top) / r.height * previewCanvas.height }; };
    const overCard = p => { const c = live.card; return p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h; };
    const overlay = $('#cardOverlay'); const showOverlay = on => overlay.classList.toggle('is-on', on);
    overlay.addEventListener('pointerover', () => showOverlay(true));
    let drag = null;
    previewCanvas.addEventListener('pointerdown', e => { const p = at(e); if (!overCard(p) || !photo) return; drag = p; previewCanvas.setPointerCapture(e.pointerId); previewCanvas.style.cursor = 'grabbing'; e.preventDefault(); });
    previewCanvas.addEventListener('pointermove', e => {
      const p = at(e);
      if (drag) { live.nudgePhoto(p.x - drag.x, p.y - drag.y); drag = p; $('#panInput').value = live.pan.y; }
      else { const on = overCard(p); previewCanvas.style.cursor = on && photo ? 'grab' : 'default'; showOverlay(on); }
    });
    const release = () => { drag = null; previewCanvas.style.cursor = 'default'; };
    previewCanvas.addEventListener('pointerup', release); previewCanvas.addEventListener('pointercancel', release);
    previewCanvas.parentElement.addEventListener('pointerleave', () => showOverlay(false));
    const card = previewCanvas.parentElement; const hasFile = e => [...(e.dataTransfer?.types || [])].includes('Files');
    const setDrop = on => { overlay.classList.toggle('is-drop', on); live.dropActive = on; if (on) showOverlay(true); };
    for (const ev of ['dragenter', 'dragover']) card.addEventListener(ev, e => { if (!hasFile(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDrop(true); });
    card.addEventListener('dragleave', e => { if (!card.contains(e.relatedTarget)) { setDrop(false); showOverlay(false); } });
    card.addEventListener('drop', e => { if (!hasFile(e)) return; e.preventDefault(); setDrop(false); acceptFile(e.dataTransfer.files?.[0]); });
    for (const ev of ['dragend', 'drop', 'dragexit']) document.addEventListener(ev, () => { setDrop(false); showOverlay(false); });
    addEventListener('blur', () => setDrop(false));
    for (const ev of ['dragover', 'drop']) document.addEventListener(ev, e => { if (!card.contains(e.target)) e.preventDefault(); });
  }

  /* ---------- format + background: the poster tool's picker, same lists, same effects ---------- */
  const modeInputs = [...document.querySelectorAll('input[name="mode"]')], segmented = $('#segmented'), bgField = $('#bgField'), bgThumbs = $('#bgThumbs');
  const currentMode = () => modeInputs.find(i => i.checked)?.value || 'image';
  let bgIndex = 0, videoIndex = 0, thumbsKey = null;
  const currentIndex = () => currentMode() === 'video' ? videoIndex : bgIndex;
  const markChecked = () => { const a = currentIndex(); [...bgThumbs.children].forEach((t, i) => t.setAttribute('aria-checked', String(i === a))); };
  async function renderThumbs() {
    const { bgs, clips } = await live.lists; const mode = currentMode();
    if (mode === thumbsKey) return markChecked(); thumbsKey = mode;
    const list = mode === 'video' ? clips.map(c => ({ label: c.label, thumb: c.poster ? `${window.POSTER_BRAND.videoDir}/${c.poster}` : null }))
                                  : bgs.map(b => ({ label: b.label, thumb: `${window.POSTER_BRAND.bgDir}/${b.file}` }));
    $('#bgFieldLabel').textContent = mode === 'video' ? 'Clip' : 'Background';
    bgField.hidden = list.length < 2; bgThumbs.replaceChildren(); if (list.length < 2) return;
    list.forEach((item, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'thumb'; b.setAttribute('role', 'radio'); b.title = item.label;
      if (item.thumb) { const img = document.createElement('img'); img.src = item.thumb; img.alt = item.label; img.loading = 'lazy'; b.append(img); }
      const cap = document.createElement('span'); cap.textContent = item.label; b.append(cap);
      b.addEventListener('click', () => { if (currentIndex() === i) return; if (currentMode() === 'video') { videoIndex = i; live.setClip(i); } else { bgIndex = i; live.setBackground(i); } markChecked(); });
      bgThumbs.append(b);
    });
    markChecked();
  }
  const syncMode = () => {
    const mode = currentMode(); segmented.dataset.mode = mode; live.setMode(mode);
    for (const g of document.querySelectorAll('.acts')) g.hidden = g.dataset.for !== mode;
    renderThumbs();
  };
  modeInputs.forEach(i => i.addEventListener('change', syncMode));
  // a pointer heading for "Video" already fetches the clip, so the switch does not land on a still
  $('#segVideo').addEventListener('pointerenter', () => { live.setClip(videoIndex); if (currentMode() !== 'video') live.video?.pause(); }, { once: true });
  live.lists.then(() => { renderThumbs(); if (!live.clips.length) $('#segVideo').hidden = true; });

  /* ---------- export: PNG, one full loop as MP4 (WebM where there is no encoder), or a GIF ---------- */
  const exporters = () => window.EXPORTERS ? Promise.resolve(window.EXPORTERS) : new Promise(res => addEventListener('exporters-ready', () => res(window.EXPORTERS), { once: true }));
  const statusEls = [$('#exportStatus'), $('#exportStatus2')];
  const setStatus = msg => statusEls.forEach(el => { el.hidden = !msg; el.textContent = msg || ''; });
  const allBtns = () => [...document.querySelectorAll('.acts .cta')];
  async function run(button, job) {
    if (exporting) return; exporting = true; const label = button.innerHTML; allBtns().forEach(b => b.disabled = true);
    try { setStatus(null); await live.ready; live.skipIntro(); rebuild(); const X = await exporters(); await job(X, p => { button.textContent = `Rendering… ${Math.round(p * 100)}%`; }); }
    catch (err) { console.error(err); setStatus(`Export failed: ${err.message}`); }
    finally { button.innerHTML = label; allBtns().forEach(b => b.disabled = false); live.resume(); exporting = false; }
  }
  const make = { png: X => X.toPng(live), gif: (X, p) => X.toGif(live, p), mp4: (X, p) => X.hasMp4() ? X.toMp4(live, p) : X.toWebm(live, p) };
  const extFor = (X, kind) => kind === 'mp4' && !X.hasMp4() ? 'webm' : kind;
  const saveJob = kind => async (X, p) => { if (kind === 'mp4' && !X.hasMp4()) setStatus('This browser has no MP4 encoder — exporting WebM instead.'); X.download(await make[kind](X, p), window.posterFileName(readForm(), extFor(X, kind))); };
  const shareJob = kind => async (X, p) => {
    const blob = await make[kind](X, p); const v = readForm(); const name = window.posterFileName(v, extFor(X, kind));
    const how = await X.shareFile(blob, name, window.posterCaption(v)); if (how === 'shared' || how === 'cancelled') return; X.download(blob, name);
  };
  for (const sfx of ['', '2']) {
    $('#dlBtn' + sfx).addEventListener('click', e => run(e.currentTarget, saveJob('png')));
    $('#mp4Btn' + sfx).addEventListener('click', e => run(e.currentTarget, saveJob('mp4')));
    $('#gifBtn' + sfx).addEventListener('click', e => run(e.currentTarget, saveJob('gif')));
  }
  exporters().then(X => { if (!X.canShareFiles()) return;
    for (const [id, kind] of [['#shareBtn', 'png'], ['#shareBtn2', 'png'], ['#shareMp4Btn', 'mp4'], ['#shareMp4Btn2', 'mp4']]) { const b = $(id); b.hidden = false; b.addEventListener('click', e => run(e.currentTarget, shareJob(kind))); } });

  /* ---------- submit: the voice joins the stream and the perspectives ---------- */
  ask.addEventListener('submit', e => {
    e.preventDefault();
    if (send.disabled) return;
    const f = readForm(); const v = { name: f.name, role: f.role, quote: f.quote, ts: Date.now() };
    mine.push(v); try { localStorage.setItem(KEY, JSON.stringify(mine)); } catch {}
    const voice = { ...v, city: 'You', mine: true };
    total++; tickCount(total, 900);
    addToGrid(voice, true).classList.add('in');
    visibleCol().pending.push(makeCard(voice));
    $('#thanksH').textContent = `${v.name.split(' ')[0]}, your voice is in the stream.`;
    ask.classList.add('sent'); $('#hero').classList.add('sent');
    $('#fields').hidden = true; $('#sentBox').hidden = false;
    const slot = $('#sentSlot'); slot.innerHTML = ''; const card = makeCard(voice); card.classList.add('fresh'); slot.appendChild(card);
    if (!reduce) card.animate([{ opacity: 0, transform: 'translateY(34px)' }, { opacity: 1, transform: 'none' }], { duration: 900, easing: 'cubic-bezier(.16,1,.3,1)' });
    live.skipIntro(); rebuild();
  });
  $('#again').addEventListener('click', () => {
    ask.classList.remove('sent', 'has'); $('#hero').classList.remove('sent'); $('#fields').hidden = false; $('#sentBox').hidden = true;
    q.value = ''; syncField(); setTimeout(() => q.focus(), 300);
  });
  function visibleCol() {
    const vis = cols.filter(c => c.el.offsetParent !== null && c.el.getBoundingClientRect().width > 0);
    return vis[Math.min(1, vis.length - 1)] || cols[0];
  }

  /* ---------- keep river crisp when tab returns ---------- */
  document.addEventListener('visibilitychange', () => { lastT = performance.now(); lastScroll = scrollY; });
})();
