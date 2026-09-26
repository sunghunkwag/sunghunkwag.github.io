/* Interactive research figures. Progressive enhancement: every value shown here is
   also in the page's table or text, which stays visible without JavaScript.
   Dependency-free; labels are inserted with textContent only. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const C = { a: '#bb8733', b: '#3b8fc7', g1: '#6f7c75', g2: '#8d9a92' };
  const svg = (tag, attrs = {}, parent) => {
    const node = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (parent) parent.appendChild(node);
    return node;
  };
  const text = (parent, x, y, value, cls, anchor = 'start') => {
    const node = svg('text', { x, y, class: cls, 'text-anchor': anchor }, parent);
    node.textContent = value;
    return node;
  };
  const num = s => Number(String(s).replace('−', '-').match(/[-+]?\d+(\.\d+)?/)?.[0]);
  const ease = t => 1 - Math.pow(1 - t, 4);
  function tween(ms, fn, done) {
    if (reduced) { fn(1); done?.(); return; }
    let start = 0;
    const step = now => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / ms);
      fn(ease(t));
      if (t < 1) requestAnimationFrame(step); else done?.();
    };
    requestAnimationFrame(step);
  }
  function onView(node, fn, threshold = .35) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { io.disconnect(); fn(); }
    }, { threshold });
    io.observe(node);
  }
  function tooltip(host) {
    const tip = document.createElement('div');
    tip.className = 'viz-tip'; tip.hidden = true;
    const value = document.createElement('strong'), label = document.createElement('span');
    tip.append(value, label); host.appendChild(tip);
    return {
      show(x, y, v, l) {
        value.textContent = v; label.textContent = l; tip.hidden = false;
        const w = host.clientWidth, tw = tip.offsetWidth;
        tip.style.left = Math.max(4, Math.min(w - tw - 4, x - tw / 2)) + 'px';
        tip.style.top = Math.max(0, y - tip.offsetHeight - 14) + 'px';
      },
      hide() { tip.hidden = true; }
    };
  }
  function bindTip(target, tip, host, getValue, getLabel) {
    const place = () => {
      const h = host.getBoundingClientRect(), r = target.getBoundingClientRect();
      tip.show(r.left + r.width / 2 - h.left, r.top - h.top, getValue(), getLabel());
    };
    target.addEventListener('pointerenter', place);
    target.addEventListener('focus', place);
    target.addEventListener('pointerleave', () => tip.hide());
    target.addEventListener('blur', () => tip.hide());
  }
  function legend(host, items) {
    const list = document.createElement('ul');
    list.className = 'viz-legend';
    for (const item of items) {
      const li = document.createElement('li'), key = document.createElement('i');
      key.className = 'key key-' + item.shape; key.style.background = item.color;
      li.append(key, document.createTextNode(item.label)); list.appendChild(li);
    }
    host.appendChild(list);
  }
  function responsive(figure, render) {
    const plot = figure.querySelector('.viz-plot');
    let width = 0, animated = false;
    const draw = () => {
      const w = Math.round(plot.clientWidth);
      if (!w || w === width) return;
      width = w; plot.querySelector('svg')?.remove();
      render(plot, w, animated);
    };
    figure.hidden = false; draw();
    if ('ResizeObserver' in window) new ResizeObserver(draw).observe(plot);
    return () => { animated = true; };
  }

  /* 1. Matched-compute contrasts: a lollipop plot around zero, two environments. */
  function contrasts(figure) {
    const table = figure.closest('section').querySelector('table');
    const rows = [...table.tBodies[0].rows].map(tr => ({
      label: tr.cells[0].dataset.short || tr.cells[0].textContent,
      full: tr.cells[0].textContent,
      local: num(tr.cells[1].textContent), localP: tr.cells[1].textContent.split(';')[1]?.trim() || '',
      kaggle: num(tr.cells[2].textContent), kaggleP: tr.cells[2].textContent.split(';')[1]?.trim() || ''
    }));
    const plot = figure.querySelector('.viz-plot');
    legend(figure.querySelector('.viz-head'), [
      { label: 'Local runs, n = 40', color: C.a, shape: 'dot' },
      { label: 'Kaggle runs, n = 60', color: C.b, shape: 'square' }
    ]);
    const tip = tooltip(plot);
    let progress = reduced ? 1 : 0, marks = [];
    const setProgress = p => { progress = p; marks.forEach(m => m(p)); };
    const markDone = responsive(figure, (host, w) => {
      const narrow = w < 620, labelW = narrow ? 0 : 250, rowH = narrow ? 78 : 64, top = 8;
      const x0 = labelW + 16, x1 = w - 16, h = top + rows.length * rowH + 44;
      const s = svg('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}`, role: 'img', 'aria-label': 'Differences in tasks solved per seed, by contrast and environment' }, host);
      const x = v => x0 + (v + 2.5) / 5 * (x1 - x0);
      for (const t of [-2, -1, 0, 1, 2]) {
        svg('line', { x1: x(t), x2: x(t), y1: top, y2: h - 36, class: t === 0 ? 'viz-zero' : 'viz-grid' }, s);
        text(s, x(t), h - 18, (t > 0 ? '+' : t < 0 ? '−' : '') + Math.abs(t), 'viz-tick', 'middle');
      }
      text(s, x1, h - 2, 'favours first arm →', 'viz-axis', 'end');
      text(s, x0, h - 2, '← favours second arm', 'viz-axis');
      marks = [];
      rows.forEach((row, i) => {
        const y = top + i * rowH + (narrow ? 34 : rowH / 2);
        if (narrow) text(s, x0, top + i * rowH + 16, row.label, 'viz-label');
        else text(s, labelW, y + 4, row.label, 'viz-label', 'end');
        for (const [key, color, dy, p, env] of [['local', C.a, -8, row.localP, 'Local, n = 40'], ['kaggle', C.b, 8, row.kaggleP, 'Kaggle, n = 60']]) {
          const v = row[key], cy = y + dy;
          const stem = svg('line', { x1: x(0), x2: x(0), y1: cy, y2: cy, stroke: color, class: 'viz-stem' }, s);
          const mark = key === 'local'
            ? svg('circle', { cx: x(0), cy, r: 5.5, fill: color, class: 'viz-mark' }, s)
            : svg('rect', { x: x(0) - 5, y: cy - 5, width: 10, height: 10, rx: 1.5, fill: color, class: 'viz-mark' }, s);
          const hit = svg('circle', { cx: x(v), cy, r: 14, class: 'viz-hit', tabindex: 0, role: 'button',
            'aria-label': `${row.full}, ${env}: ${v > 0 ? '+' : ''}${v} tasks, ${p}` }, s);
          bindTip(hit, tip, host, () => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(2)} tasks`, () => `${env} · ${p || 'reported'}`);
          const update = t => {
            const px = x(v * t);
            stem.setAttribute('x2', px);
            if (key === 'local') mark.setAttribute('cx', px); else mark.setAttribute('x', px - 5);
          };
          marks.push(update); update(progress);
        }
      });
    });
    onView(figure, () => tween(1500, setProgress, markDone));
  }

  /* 2. Task-level accuracy: grouped bars, the discovered model emphasised. */
  function accuracy(figure) {
    const table = figure.closest('section').querySelector('table');
    const rows = [...table.tBodies[0].rows].map(tr => ({ task: tr.cells[0].textContent, t: num(tr.cells[1].textContent), a: num(tr.cells[2].textContent), d: num(tr.cells[3].textContent) }));
    const series = [['t', 'Transformer', C.g1], ['a', 'AFN v3 (hand-designed)', C.g2], ['d', 'Discovered model', C.a]];
    legend(figure.querySelector('.viz-head'), series.map(([, label, color]) => ({ label, color, shape: 'bar' })));
    const plot = figure.querySelector('.viz-plot'), tip = tooltip(plot);
    let progress = reduced ? 1 : 0, bars = [];
    const setProgress = p => { progress = p; bars.forEach(b => b(p)); };
    const markDone = responsive(figure, (host, w) => {
      const narrow = w < 620, labelW = narrow ? 0 : 170, bar = 10, gap = 2, groupH = narrow ? 70 : 52;
      const x0 = labelW + 14, x1 = w - 58, h = rows.length * groupH + 34;
      const s = svg('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}`, role: 'img', 'aria-label': 'Reported accuracy by task and model' }, host);
      const x = v => x0 + v / 100 * (x1 - x0);
      for (const t of [0, 25, 50, 75, 100]) {
        svg('line', { x1: x(t), x2: x(t), y1: 0, y2: h - 26, class: t ? 'viz-grid' : 'viz-zero' }, s);
        text(s, x(t), h - 8, t + '%', 'viz-tick', 'middle');
      }
      bars = [];
      rows.forEach((row, i) => {
        const gy = i * groupH + (narrow ? 22 : 8);
        if (narrow) text(s, x0, gy - 8, row.task, 'viz-label');
        else text(s, labelW, gy + 20, row.task, 'viz-label' + (/mean/i.test(row.task) ? ' strong' : ''), 'end');
        series.forEach(([key, label, color], j) => {
          const y = gy + j * (bar + gap), v = row[key];
          const rect = svg('path', { fill: color, class: 'viz-bar' }, s);
          const hit = svg('rect', { x: x0, y: y - 3, width: x(v) - x0 + 8, height: bar + 6, class: 'viz-hit', tabindex: 0, role: 'button', 'aria-label': `${row.task}, ${label}: ${v}%` }, s);
          bindTip(hit, tip, host, () => v.toFixed(1) + '%', () => `${label} · ${row.task}`);
          const value = key === 'd' ? text(s, x(0), y + bar - 1, '', 'viz-value') : null;
          const update = t => {
            const end = x(v * t), r = Math.min(4, Math.max(0, end - x0));
            rect.setAttribute('d', `M${x0},${y}H${end - r}Q${end},${y} ${end},${y + r}V${y + bar - r}Q${end},${y + bar} ${end - r},${y + bar}H${x0}Z`);
            if (value) { value.setAttribute('x', end + 6); value.textContent = (v * t).toFixed(1) + '%'; }
          };
          bars.push(update); update(progress);
        });
      });
    });
    onView(figure, () => tween(1400, setProgress, markDone));
  }

  /* 3. What the aggregate can hide: an interactive six-axis calculator. */
  function aggregate(figure) {
    const axes = ['Self-modification depth', 'Improvement trajectory', 'Operator discovery', 'Meta-adaptation', 'Safety and stability', 'Goal generation'];
    const presets = {
      'Worked example': { v: [.8, .8, .8, .8, .8, .2], on: [1, 1, 1, 1, 1, 1] },
      'Drop the weak axis': { v: [.8, .8, .8, .8, .8, .2], on: [1, 1, 1, 1, 1, 0] },
      'Balanced': { v: [.7, .7, .7, .7, .7, .7], on: [1, 1, 1, 1, 1, 1] }
    };
    const state = { v: [...presets['Worked example'].v], on: [...presets['Worked example'].on] };
    const plot = figure.querySelector('.viz-plot');
    const controls = document.createElement('div'); controls.className = 'agg-controls';
    const readout = document.createElement('div'); readout.className = 'agg-readout';
    const chips = document.createElement('div'); chips.className = 'agg-presets';
    for (const name of Object.keys(presets)) {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = name;
      b.addEventListener('click', () => { const p = presets[name]; animateTo(p.v, p.on); sync(); });
      chips.appendChild(b);
    }
    const inputs = axes.map((axis, i) => {
      const row = document.createElement('div'); row.className = 'agg-row';
      const box = document.createElement('input'); box.type = 'checkbox'; box.checked = true; box.id = 'agg-on-' + i;
      const name = document.createElement('label'); name.htmlFor = 'agg-range-' + i; name.textContent = axis;
      const range = document.createElement('input'); range.type = 'range'; range.min = '0.05'; range.max = '1'; range.step = '0.05'; range.id = 'agg-range-' + i;
      range.setAttribute('aria-label', axis + ' score');
      box.setAttribute('aria-label', axis + ' supplied');
      const out = document.createElement('output'); out.htmlFor = range.id;
      range.addEventListener('input', () => { state.v[i] = Number(range.value); render(); });
      box.addEventListener('change', () => { state.on[i] = box.checked ? 1 : 0; render(); });
      row.append(box, name, range, out); controls.appendChild(row);
      return { box, range, out, row };
    });
    const meter = (label, cls) => {
      const wrap = document.createElement('div'); wrap.className = 'agg-meter ' + cls;
      const head = document.createElement('div'), name = document.createElement('span'), value = document.createElement('strong');
      name.textContent = label; head.append(name, value);
      const track = document.createElement('div'), fill = document.createElement('i'); track.appendChild(fill);
      wrap.append(head, track); readout.appendChild(wrap);
      return { value, fill };
    };
    const arith = meter('Arithmetic mean', 'is-context'), harm = meter('Harmonic mean (RSI-Bench composite)', 'is-score');
    const note = document.createElement('p'); note.className = 'agg-note'; readout.appendChild(note);
    const W = 300, R = 112, cx = 150, cy = 142;
    const radar = svg('svg', { viewBox: '-58 0 416 290', class: 'agg-radar', role: 'img', 'aria-label': 'Six-axis score profile' });
    const angle = i => -Math.PI / 2 + i * Math.PI / 3;
    const pt = (i, v) => [cx + Math.cos(angle(i)) * R * v, cy + Math.sin(angle(i)) * R * v];
    for (const ring of [.25, .5, .75, 1]) svg('polygon', { points: axes.map((_, i) => pt(i, ring).join(',')).join(' '), class: 'viz-grid' }, radar);
    const spokes = axes.map((axis, i) => {
      svg('line', { x1: cx, y1: cy, x2: pt(i, 1)[0], y2: pt(i, 1)[1], class: 'viz-grid' }, radar);
      const [lx, ly] = pt(i, 1.17);
      return text(radar, lx, ly + 4, axis.split(' ')[0], 'viz-tick', Math.abs(lx - cx) < 8 ? 'middle' : lx > cx ? 'start' : 'end');
    });
    const shape = svg('polygon', { class: 'agg-shape' }, radar);
    const dots = axes.map(() => svg('circle', { r: 4.5, class: 'agg-dot' }, radar));
    let shown = [...state.v], shownOn = [...state.on];
    function draw() {
      const live = axes.map((_, i) => i).filter(i => shownOn[i] > .5);
      shape.setAttribute('points', live.map(i => pt(i, shown[i]).join(',')).join(' '));
      dots.forEach((d, i) => { const [x, y] = pt(i, shown[i]); d.setAttribute('cx', x); d.setAttribute('cy', y); d.style.opacity = shownOn[i] > .5 ? 1 : 0; });
      spokes.forEach((s, i) => s.classList.toggle('muted', shownOn[i] < .5));
    }
    function animateTo(v, on) {
      const from = [...shown];
      state.v = [...v]; state.on = [...on]; shownOn = [...on];
      tween(600, t => { shown = from.map((f, i) => f + (v[i] - f) * t); draw(); });
    }
    function sync() {
      inputs.forEach(({ box, range, out, row }, i) => {
        range.value = String(state.v[i]); box.checked = !!state.on[i]; out.textContent = state.v[i].toFixed(2);
        row.classList.toggle('is-off', !state.on[i]); range.disabled = !state.on[i];
      });
      const live = state.v.filter((_, i) => state.on[i]);
      const a = live.reduce((s, x) => s + x, 0) / live.length, h = live.length / live.reduce((s, x) => s + 1 / x, 0);
      arith.value.textContent = live.length ? a.toFixed(4) : '—'; harm.value.textContent = live.length ? h.toFixed(4) : '—';
      arith.fill.style.transform = `scaleX(${live.length ? a : 0})`; harm.fill.style.transform = `scaleX(${live.length ? h : 0})`;
      const missing = state.on.length - live.length;
      note.textContent = missing
        ? `${missing} axis ${missing > 1 ? 'scores are' : 'score is'} missing and skipped, not scored as zero. Compare only complete, matched score vectors.`
        : !live.length ? 'Supply at least one axis to compute a score.'
        : a - h < .005 ? 'With balanced scores, the two means agree.'
        : `The weakest axis pulls the harmonic mean ${((a - h) * 100).toFixed(1)} points below the arithmetic mean.`;
    }
    function render() { shown = [...state.v]; shownOn = [...state.on]; draw(); sync(); }
    plot.append(chips, controls, radar, readout);
    figure.hidden = false;
    shown = state.v.map(() => .05); draw(); sync();
    onView(figure, () => animateTo(state.v, state.on));
  }

  /* 4. The compute-matched control: two arms, the same budget, only one recursive. */
  function compute(figure) {
    legend(figure.querySelector('.viz-head'), [
      { label: 'Five recursive rounds', color: C.a, shape: 'bar' },
      { label: 'One round, five times the compute', color: C.b, shape: 'bar' }
    ]);
    const plot = figure.querySelector('.viz-plot');
    let run = 0, visible = false, raf = 0, elements = null;
    responsive(figure, (host, w) => {
      const narrow = w < 560, x0 = 0, x1 = w, laneH = 26, h = 184;
      const s = svg('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}`, role: 'img', 'aria-label': 'Both arms spend 62,500 candidate evaluations; only the first refits its search prior between rounds' }, host);
      const yA = 58, yB = 138, seg = (x1 - x0 - 4 * 8) / 5;
      text(s, x0, 18, narrow ? 'Five recursive rounds' : 'Five recursive rounds \u00b7 12,500 evaluations each', 'viz-label');
      if (!narrow) text(s, x1, 18, 'arcs: the search prior is refit', 'viz-axis', 'end');
      text(s, x0, yB - 12, narrow ? 'One round at 5\u00d7 compute' : 'One round \u00b7 62,500 evaluations', 'viz-label');
      const aFills = [], refits = [];
      for (let i = 0; i < 5; i++) {
        const x = x0 + i * (seg + 8);
        svg('rect', { x, y: yA, width: seg, height: laneH, rx: 3, class: 'lane-track' }, s);
        aFills.push(svg('rect', { x, y: yA, width: 0, height: laneH, rx: 3, fill: C.a }, s));
        text(s, x + 8, yA + 17, 'R' + (i + 1), 'lane-tag');
        if (i < 4) {
          const from = x + seg - 10, to = x + seg + 18;
          refits.push(svg('path', { d: `M${from},${yA - 3} C${from + 4},${yA - 22} ${to - 4},${yA - 22} ${to},${yA - 3}`, class: 'refit' }, s));
        }
      }
      svg('rect', { x: x0, y: yB, width: x1 - x0, height: laneH, rx: 3, class: 'lane-track' }, s);
      const bFill = svg('rect', { x: x0, y: yB, width: 0, height: laneH, rx: 3, fill: C.b }, s);
      text(s, x0 + 8, yB + 17, 'R1 \u00d7 5', 'lane-tag');
      const budget = text(s, x1, h - 2, '', 'viz-value', 'end');
      elements = { aFills, refits, bFill, seg, x0, x1, budget };
      paint(reduced ? 1 : 0);
    });
    function paint(t) {
      if (!elements) return;
      const { aFills, refits, bFill, seg, x0, x1, budget } = elements;
      const total = t * 5;
      aFills.forEach((f, i) => f.setAttribute('width', Math.max(0, Math.min(1, total - i)) * seg));
      refits.forEach((r, i) => r.classList.toggle('on', total >= i + 1));
      bFill.setAttribute('width', t * (x1 - x0));
      budget.textContent = Math.round(t * 62500).toLocaleString('en-US') + ' / 62,500 candidate evaluations per arm';
    }
    const cycle = now => {
      raf = 0;
      if (!visible) return;
      if (!run) run = now;
      const t = ((now - run) % 7000) / 5200;
      paint(Math.min(1, t));
      raf = requestAnimationFrame(cycle);
    };
    if (reduced) { paint(1); return; }
    let inView = false;
    const update = () => { visible = inView && !document.hidden; if (visible && !raf) raf = requestAnimationFrame(cycle); };
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => { inView = entries[0].isIntersecting; update(); }, { threshold: .2 }).observe(figure);
    else { inView = true; update(); }
    document.addEventListener('visibilitychange', update);
  }

  /* 5. The recursive loop: an outer task loop and an inner improver loop, both in motion. */
  function loop(figure) {
    const plot = figure.querySelector('.viz-plot');
    let dots = [], visible = false, raf = 0;
    responsive(figure, (host, w) => {
      const h = Math.min(320, Math.max(250, w * .42)), cx = w / 2, cy = h / 2 + 4;
      const rx = w < 700 ? w * .42 : Math.min(w * .3, 300), ry = h * .36, irx = rx * .5, iry = ry * .5;
      const s = svg('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}`, role: 'img', 'aria-label': 'An outer loop solves and evaluates tasks; an inner loop changes the process that makes changes' }, host);
      const outer = svg('ellipse', { cx, cy, rx, ry, class: 'loop-path' }, s);
      const inner = svg('ellipse', { cx, cy, rx: irx, ry: iry, class: 'loop-path inner' }, s);
      const narrow = w < 700;
      const nodes = narrow
        ? [['Propose', -Math.PI / 2], ['Evaluate', 0], ['Keep or roll back', Math.PI / 2], ['Next round', Math.PI]]
        : [['Propose a change', -Math.PI / 2], ['Evaluate on held-out tasks', 0], ['Keep or roll back', Math.PI / 2], ['Next round starts here', Math.PI]];
      for (const [label, a] of nodes) {
        const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry, side = Math.abs(Math.cos(a)) > .5;
        svg('circle', { cx: x, cy: y, r: 4, class: 'loop-node' }, s);
        if (side && !narrow) text(s, x + Math.sign(Math.cos(a)) * 14, y + 4, label, 'viz-label', Math.cos(a) > 0 ? 'start' : 'end');
        else if (side) text(s, x, y - 12, label, 'viz-label', Math.cos(a) > 0 ? 'end' : 'start');
        else text(s, x, Math.sin(a) > 0 ? y + 22 : y - 12, label, 'viz-label', 'middle');
      }
      text(s, cx, cy - 4, 'The improver', 'loop-core', 'middle');
      text(s, cx, cy + 14, 'is itself revised', 'viz-axis', 'middle');
      dots = [
        { el: svg('circle', { r: 5, class: 'loop-dot' }, s), rx, ry, speed: .22, phase: 0 },
        { el: svg('circle', { r: 4, class: 'loop-dot inner' }, s), rx: irx, ry: iry, speed: -.34, phase: 1.3 }
      ];
      dots.forEach(d => { d.cx = cx; d.cy = cy; });
      place(0);
      void outer; void inner;
    });
    function place(t) {
      for (const d of dots) {
        const a = d.phase + t * d.speed * Math.PI * 2;
        d.el.setAttribute('cx', d.cx + Math.cos(a) * d.rx); d.el.setAttribute('cy', d.cy + Math.sin(a) * d.ry);
      }
    }
    if (reduced) return;
    let start = 0;
    const tick = now => { raf = 0; if (!visible) return; if (!start) start = now; place((now - start) / 1000); raf = requestAnimationFrame(tick); };
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
    }).observe(figure);
  }

  const kinds = { contrasts, accuracy, aggregate, compute, loop };
  document.querySelectorAll('[data-viz]').forEach(figure => {
    try { kinds[figure.dataset.viz]?.(figure); }
    catch (error) { figure.hidden = true; console.warn('Figure unavailable; the table remains.', error); }
  });
})();
