/* Tech Text for the headline — a vanilla port of React Bits' TechText (MIT, DavidHDev/react-bits):
   once the intro has set the letters, a canvas takes over the <h1>. The letter under the pointer
   turns into a dashed vector outline inside a gliding selection frame with blinking specks and a
   size label, letters can be dragged off the baseline and spring back, and while the pointer is
   away a slow sweep walks the reveal across the wordmark. The DOM letters stay in place (opacity 0)
   so layout, screen readers and the sent-state resize keep working; the canvas re-measures them. */
(() => {
  const LABEL_FONT = '10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  const SPRING = 320, DAMPING = 22, PAD_X = 80, PAD_Y = 56;
  const approach = (c, t, dt, s) => c + (t - c) * (1 - Math.exp(-dt / s));
  const hexToRgb = hex => { let h = String(hex || '').trim().replace('#', ''); if (h.length === 3) h = h.replace(/./g, c => c + c); const n = parseInt(h.slice(0, 6), 16); return Number.isNaN(n) ? [255, 255, 255] : [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const rgba = (hex, a) => { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };
  const noise = (...v) => { let h = 2166136261; for (const x of v) { h = Math.imul(h ^ (x | 0), 16777619); h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; } return (h >>> 0) / 4294967296; };
  const signed = v => (v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '0');

  function mount(h1, opts = {}) {
    if (h1.dataset.tech) return;
    h1.dataset.tech = '1';
    const s = { color: '#ffffff', accent: '#ffffff', dashLength: 4, dashGap: 2, strokeWidth: 1.5, specks: 15, speed: 1, sweep: true, draggable: true, labels: true, ...opts };
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = document.createElement('canvas'); canvas.className = 'tech'; canvas.setAttribute('aria-hidden', 'true');
    h1.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let width = 1, height = 1, dpr = 1, raf = 0, last = performance.now(), visible = true, layoutKey = '';
    let glyphs = [], clock = 0, pulse = 0, placed = false, dragging = -1, bounds = null;
    const pointer = { x: 0, y: 0, inside: false }, grab = { x: 0, y: 0 }, lens = { x: 0, y: 0 };
    const frame = { x1: 0, y1: 0, x2: 0, y2: 0, alpha: 0, index: -1 };

    const fontOf = () => { const cs = getComputedStyle(h1); return { font: `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, size: parseFloat(cs.fontSize), lineHeight: parseFloat(cs.lineHeight) }; };
    const setFont = (c, font) => { c.font = font; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; };

    const sprite = (font, glyph, stroke) => {
      const pad = Math.ceil(s.strokeWidth * 2 + 4);
      const left = glyph.box.x1 - pad, top = glyph.box.y1 - pad, w = glyph.box.x2 - glyph.box.x1 + pad * 2, h = glyph.box.y2 - glyph.box.y1 + pad * 2;
      const image = document.createElement('canvas'); image.width = Math.max(1, Math.ceil(w * dpr)); image.height = Math.max(1, Math.ceil(h * dpr));
      const c = image.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, -left * dpr, -top * dpr); setFont(c, font);
      if (stroke) {
        c.lineJoin = 'round'; c.lineWidth = s.strokeWidth * 2; c.lineCap = 'butt'; c.strokeStyle = s.color;
        c.setLineDash([Math.max(1, s.dashLength), Math.max(1, s.dashGap)]); c.strokeText(glyph.char, glyph.x, glyph.baseline); c.setLineDash([]);
        c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; c.fillText(glyph.char, glyph.x, glyph.baseline); c.globalCompositeOperation = 'source-over';
      } else { c.fillStyle = s.color; c.fillText(glyph.char, glyph.x, glyph.baseline); }
      return { image, left, top };
    };

    /* The DOM letters are the layout: each .c span's rect gives the pen position, the line box the baseline. */
    const ensureLayout = () => {
      const r = h1.getBoundingClientRect(); const f = fontOf();
      const key = [r.width, r.height, f.font, dpr, s.color].join('|');
      if (key === layoutKey && glyphs.length) return;
      layoutKey = key;
      width = Math.max(1, r.width + PAD_X * 2); height = Math.max(1, r.height + PAD_Y * 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      const probe = ctx; probe.setTransform(1, 0, 0, 1, 0, 0); setFont(probe, f.font);
      const fm = probe.measureText('H'); const fontAsc = fm.fontBoundingBoxAscent || f.size * .9, fontDesc = fm.fontBoundingBoxDescent || f.size * .2;
      const previous = glyphs; glyphs = []; bounds = null;
      h1.querySelectorAll('.w').forEach(w => {
        const wr = w.getBoundingClientRect();
        const baseline = wr.top - r.top + PAD_Y + (wr.height - (fontAsc + fontDesc)) / 2 + fontAsc;
        w.querySelectorAll('.c').forEach(span => {
          const char = span.dataset.ch || span.textContent; if (!char.trim()) return;
          const sr = span.getBoundingClientRect(); const gx = sr.left - r.left + PAD_X;
          const own = probe.measureText(char);
          const base = { char, x: gx, baseline, box: { x1: gx - own.actualBoundingBoxLeft, y1: baseline - own.actualBoundingBoxAscent, x2: gx + own.actualBoundingBoxRight, y2: baseline + own.actualBoundingBoxDescent } };
          const kept = previous[glyphs.length];
          glyphs.push({ ...base, offset: kept?.char === char ? kept.offset : { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, outline: 0, fill: sprite(f.font, base, false), dashes: sprite(f.font, base, true) });
          bounds = bounds ? { left: Math.min(bounds.left, base.box.x1), right: Math.max(bounds.right, base.box.x2), top: Math.min(bounds.top, base.box.y1), bottom: Math.max(bounds.bottom, base.box.y2) }
                          : { left: base.box.x1, right: base.box.x2, top: base.box.y1, bottom: base.box.y2 };
        });
      });
      dragging = -1; frame.index = -1;
    };

    const glyphAt = (x, y) => {
      let best = -1, bestD = Infinity;
      glyphs.forEach((g, i) => {
        const x1 = g.box.x1 + g.offset.x, x2 = g.box.x2 + g.offset.x, y1 = g.box.y1 + g.offset.y - 24, y2 = g.box.y2 + g.offset.y + 24;
        if (y < y1 || y > y2) return;
        const d = x < x1 ? x1 - x : x > x2 ? x - x2 : 0; if (d < bestD) { bestD = d; best = i; }
      });
      return bestD < 28 ? best : -1;
    };
    const blit = (target, art, dx, dy) => target.drawImage(art.image, Math.round((art.left + dx) * dpr), Math.round((art.top + dy) * dpr));
    const crisp = v => (Math.round(v * dpr) + .5) / dpr;
    const perimeterPoint = (distance, w, h) => {
      let d = ((distance % (2 * (w + h))) + 2 * (w + h)) % (2 * (w + h));
      if (d < w) return [frame.x1 + d, frame.y1, 0, -1]; d -= w;
      if (d < h) return [frame.x2, frame.y1 + d, 1, 0]; d -= h;
      if (d < w) return [frame.x2 - d, frame.y2, 0, 1]; d -= w;
      return [frame.x1, frame.y2 - d, -1, 0];
    };
    const drawSpecks = a => {
      const w = frame.x2 - frame.x1, h = frame.y2 - frame.y1; if (w < 2 || h < 2) return;
      const perimeter = 2 * (w + h), seed = frame.index + 1, grid = 3;
      for (let k = 0; k < s.specks; k++) {
        const period = .5 + noise(seed, k, 11) * 1.2; const t = pulse / period + noise(seed, k, 17); const cycle = Math.floor(t), life = t - cycle; if (life > .7) continue;
        const [px, py, nx, ny] = perimeterPoint(noise(seed, k, cycle) * perimeter, w, h);
        const pick = noise(seed, k, cycle, 2); const size = pick < .46 ? 2 : pick < .7 ? 3 : pick < .84 ? 5 : pick < .94 ? 8 : 11; const large = size >= 8;
        const out = (large ? 9 : 4) + Math.floor(noise(seed, k, cycle, 1) * 5) * grid;
        const x = frame.x1 + Math.round((px + nx * out - frame.x1) / grid) * grid, y = frame.y1 + Math.round((py + ny * out - frame.y1) / grid) * grid;
        const tone = noise(seed, k, cycle, 3); const blink = life < .06 || (life > .32 && life < .36) ? .35 : 1;
        const alpha = a * (large ? .3 + .4 * tone : .3 + .6 * tone) * blink; const left = Math.round(x - size / 2), top = Math.round(y - size / 2);
        if (tone < .26 || (large && tone < .78)) { ctx.strokeStyle = rgba(s.accent, alpha); ctx.strokeRect(left + .5, top + .5, size, size); if (large && tone > .5) { ctx.fillStyle = rgba(s.accent, alpha); ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2); } }
        else { ctx.fillStyle = rgba(s.accent, alpha); ctx.fillRect(left, top, size, size); }
      }
      for (let j = 0; j < 2; j++) { const head = (pulse * .42 * s.speed + j * .5) * perimeter;
        for (let i = 0; i < 4; i++) { const [x, y] = perimeterPoint(head - i * 6, w, h); const size = i === 0 ? 3 : 2; ctx.fillStyle = rgba(s.accent, a * [.95, .55, .32, .16][i]); ctx.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size); } }
    };
    const drawFrame = () => {
      const g = glyphs[frame.index]; if (!g || frame.alpha < .01) return; const a = frame.alpha;
      const x1 = crisp(frame.x1), y1 = crisp(frame.y1), x2 = crisp(frame.x2), y2 = crisp(frame.y2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const moved = Math.hypot(g.offset.x, g.offset.y);
      if (moved > 1) { const hx = (g.box.x1 + g.box.x2) / 2, hy = (g.box.y1 + g.box.y2) / 2;
        ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + g.offset.x, hy + g.offset.y); ctx.setLineDash([3, 4]); ctx.lineWidth = 1; ctx.strokeStyle = rgba(s.accent, .45 * a); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.rect(Math.round(hx) - 2, Math.round(hy) - 2, 4, 4); ctx.fillStyle = rgba(s.accent, .7 * a); ctx.fill(); }
      ctx.beginPath(); ctx.rect(x1, y1, x2 - x1, y2 - y1); ctx.lineWidth = 1; ctx.strokeStyle = rgba(s.accent, .5 * a); ctx.stroke();
      ctx.beginPath(); for (const [cx, cy] of [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]) ctx.rect(Math.round(cx) - 2, Math.round(cy) - 2, 5, 5); ctx.fillStyle = rgba(s.accent, .95 * a); ctx.fill();
      if (s.specks > 0) { ctx.lineWidth = 1; drawSpecks(a); }
      if (!s.labels) return;
      ctx.font = LABEL_FONT; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillStyle = rgba(s.accent, .62 * a);
      const label = moved > 1 ? `${signed(Math.round(g.offset.x))}, ${signed(Math.round(-g.offset.y))}` : `${g.char}  ${Math.round(g.box.x2 - g.box.x1)} × ${Math.round(g.box.y2 - g.box.y1)}`;
      ctx.fillText(label, Math.round(frame.x1), Math.round(frame.y1) - 7);
    };

    const tick = now => {
      raf = 0;
      const dt = Math.min(.05, Math.max(.001, (now - last) / 1000)); last = now;
      ensureLayout(); if (!bounds) return;
      const sweeping = s.sweep && !reduced && !pointer.inside && dragging < 0;
      if (sweeping) clock += dt * s.speed; pulse += dt;
      let tx = pointer.x, ty = pointer.y;
      if (sweeping) { tx = bounds.left + (bounds.right - bounds.left) * (.5 - .5 * Math.cos(clock * .45)); ty = bounds.top + (bounds.bottom - bounds.top) * (.45 + .1 * Math.sin(clock * .8)); }
      const active = pointer.inside || sweeping || dragging >= 0;
      if (active && !placed) { lens.x = tx; lens.y = ty; }
      if (active) { const lag = pointer.inside ? .05 : .22; lens.x = approach(lens.x, tx, dt, lag); lens.y = approach(lens.y, ty, dt, lag); }
      placed = active;
      let moving = false;
      glyphs.forEach((g, i) => {
        if (i === dragging) { g.offset.x = approach(g.offset.x, pointer.x - grab.x, dt, .03); g.offset.y = approach(g.offset.y, pointer.y - grab.y, dt, .03); g.velocity.x = g.velocity.y = 0; moving = true; return; }
        const { offset, velocity } = g;
        if (Math.abs(offset.x) < .05 && Math.abs(offset.y) < .05 && Math.hypot(velocity.x, velocity.y) < .5) { offset.x = offset.y = velocity.x = velocity.y = 0; return; }
        velocity.x += (-SPRING * offset.x - DAMPING * velocity.x) * dt; velocity.y += (-SPRING * offset.y - DAMPING * velocity.y) * dt;
        offset.x += velocity.x * dt; offset.y += velocity.y * dt; moving = true;
      });
      const focus = dragging >= 0 ? dragging : active ? glyphAt(lens.x, lens.y) : -1;
      if (focus >= 0) { const g = glyphs[focus];
        const bx1 = g.box.x1 + g.offset.x - 6, by1 = g.box.y1 + g.offset.y - 6, bx2 = g.box.x2 + g.offset.x + 6, by2 = g.box.y2 + g.offset.y + 6;
        if (frame.index < 0 || frame.alpha < .02) { frame.x1 = bx1; frame.y1 = by1; frame.x2 = bx2; frame.y2 = by2; }
        const glide = focus === dragging ? .02 : .08;
        frame.x1 = approach(frame.x1, bx1, dt, glide); frame.y1 = approach(frame.y1, by1, dt, glide); frame.x2 = approach(frame.x2, bx2, dt, glide); frame.y2 = approach(frame.y2, by2, dt, glide);
        frame.index = focus; }
      frame.alpha = approach(frame.alpha, focus >= 0 ? 1 : 0, dt, .1);
      glyphs.forEach((g, i) => { const target = i === focus && i !== dragging ? 1 : 0; g.outline = approach(g.outline, target, dt, .09); if (Math.abs(g.outline - target) > .002) moving = true; else g.outline = target; });
      if (s.draggable) h1.style.cursor = dragging >= 0 ? 'grabbing' : focus >= 0 && pointer.inside ? 'grab' : '';

      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const g of glyphs) { const moved = Math.hypot(g.offset.x, g.offset.y); if (moved > 1) { ctx.globalAlpha = Math.min(1, moved / 24) * .55; blit(ctx, g.dashes, 0, 0); ctx.globalAlpha = 1; } }
      for (const g of glyphs) {
        if (g.outline < .999) { ctx.globalAlpha = 1 - g.outline; blit(ctx, g.fill, g.offset.x, g.offset.y); }
        if (g.outline > .001) { ctx.globalAlpha = g.outline; blit(ctx, g.dashes, g.offset.x, g.offset.y); }
        ctx.globalAlpha = 1;
      }
      drawFrame();
      const settling = moving || (frame.alpha > .01 && frame.alpha < .99);
      if ((active || settling) && visible) raf = requestAnimationFrame(tick);
    };
    const wake = () => { if (raf || !visible) return; last = performance.now(); raf = requestAnimationFrame(tick); };

    const locate = e => { const r = h1.getBoundingClientRect(); pointer.x = e.clientX - r.left + PAD_X; pointer.y = e.clientY - r.top + PAD_Y; };
    canvas.addEventListener('pointermove', e => { locate(e); pointer.inside = true; wake(); }, { passive: true });
    canvas.addEventListener('pointerenter', e => { locate(e); pointer.inside = true; wake(); }, { passive: true });
    canvas.addEventListener('pointerleave', () => { if (dragging >= 0) return; pointer.inside = false; wake(); }, { passive: true });
    canvas.addEventListener('pointerdown', e => {
      locate(e); pointer.inside = true;
      if (s.draggable && (e.pointerType !== 'mouse' || e.button === 0)) { const i = glyphAt(pointer.x, pointer.y); if (i >= 0) { dragging = i; grab.x = pointer.x - glyphs[i].offset.x; grab.y = pointer.y - glyphs[i].offset.y; canvas.setPointerCapture?.(e.pointerId); } }
      wake();
    }, { passive: true });
    const up = e => { if (dragging >= 0) { dragging = -1; canvas.releasePointerCapture?.(e.pointerId); const r = canvas.getBoundingClientRect(); pointer.inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; } wake(); };
    canvas.addEventListener('pointerup', up, { passive: true }); canvas.addEventListener('pointercancel', up, { passive: true });

    const resize = () => { dpr = Math.min(devicePixelRatio || 1, 2); layoutKey = ''; wake(); };
    new ResizeObserver(resize).observe(h1);
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; wake(); }).observe(h1);
    h1.addEventListener('transitionrun', resize); h1.addEventListener('transitionend', resize);
    // the sent-state resize transitions the font for a second: re-measure every frame until it settles
    let settleUntil = 0; const settle = () => { settleUntil = performance.now() + 1300; const loop = () => { layoutKey = ''; wake(); if (performance.now() < settleUntil) requestAnimationFrame(loop); }; loop(); };
    new MutationObserver(settle).observe(h1.closest('.hero') || h1, { attributes: true, attributeFilter: ['class'] });

    document.fonts?.ready.then(resize);
    resize(); ensureLayout(); tick(performance.now());
    h1.classList.add('tech');
  }
  window.TechText = { mount };
})();
