/* Progressive motion: all research content and the SVG remain usable without JS. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const figure = document.querySelector('.hero-figure');
  const canvas = document.querySelector('.manifold-canvas');
  const control = document.querySelector('.motion-toggle');
  let paused = reduced.matches;
  let frame = 0, lastTime = 0, phase = 0, visible = true;
  let pointer = { x: 0, y: 0 }, target = { x: 0, y: 0 };
  let gpu = null;
  try { gpu = canvas && window.createResearchSculpture?.(canvas); } catch { /* Keep fallback. */ }
  let ctx = null;
  try { if (!gpu) ctx = canvas?.getContext('2d', { alpha: true }); } catch { /* Keep SVG. */ }

  // A Clifford torus in four dimensions, rotated in XW and YZ planes,
  // then perspective-projected through 3D into the canvas.
  function project(u, v, t) {
    let x = Math.cos(u), y = Math.sin(u), z = Math.cos(v), w = Math.sin(v);
    const a = t * .23, b = t * .17 + .55;
    [x, w] = [x * Math.cos(a) - w * Math.sin(a), x * Math.sin(a) + w * Math.cos(a)];
    [y, z] = [y * Math.cos(b) - z * Math.sin(b), y * Math.sin(b) + z * Math.cos(b)];
    const depth4 = 2.8 / (2.8 - w * .65);
    x *= depth4; y *= depth4; z *= depth4;
    const yaw = .42 + t * .075 + pointer.x * .3, pitch = -.5 + pointer.y * .25;
    [x, z] = [x * Math.cos(yaw) + z * Math.sin(yaw), -x * Math.sin(yaw) + z * Math.cos(yaw)];
    [y, z] = [y * Math.cos(pitch) - z * Math.sin(pitch), y * Math.sin(pitch) + z * Math.cos(pitch)];
    const depth3 = 4.6 / (4.6 - z * .4);
    return { x: 250 + x * 108 * depth3, y: 250 + y * 108 * depth3, z };
  }
  function draw() {
    if (gpu) { gpu.draw(phase, pointer); return; }
    if (!ctx) return;
    ctx.clearRect(0, 0, 500, 500);
    const glow = ctx.createRadialGradient(250, 250, 12, 250, 250, 228);
    glow.addColorStop(0, 'rgba(126,174,151,.13)'); glow.addColorStop(1, 'rgba(126,174,151,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, 500, 500);
    ctx.strokeStyle = 'rgba(173,193,175,.12)'; ctx.lineWidth = .75;
    ctx.setLineDash([2, 8]); ctx.beginPath(); ctx.arc(250, 250, 220, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]); ctx.beginPath(); ctx.arc(250, 250, 194, 0, Math.PI * 2); ctx.stroke();
    const curves = [];
    for (let family = 0; family < 2; family++) {
      const count = family ? 12 : 26;
      for (let ring = 0; ring < count; ring++) {
        const points = [];
        for (let step = 0; step <= 64; step++) {
          const fixed = ring / count * Math.PI * 2, moving = step / 64 * Math.PI * 2;
          points.push(project(family ? moving : fixed, family ? fixed : moving, phase));
        }
        curves.push({ points, family, depth: points.reduce((n, p) => n + p.z, 0) / points.length });
      }
    }
    curves.sort((a, b) => a.depth - b.depth);
    for (const { points, family, depth } of curves) {
      const alpha = Math.max(.13, Math.min(.75, .36 + depth * .17));
      ctx.strokeStyle = family ? `rgba(192,211,180,${alpha * .65})` : `rgba(209,190,149,${alpha})`;
      ctx.lineWidth = family ? .65 : .9;
      ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
    }
    for (let i = 0; i < 7; i++) {
      const p = project(i * .897 + phase * .22, i * 1.37 + phase * .33, phase);
      ctx.beginPath(); ctx.fillStyle = 'rgba(218,213,174,.12)'; ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.fillStyle = '#dfd6b3'; ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2); ctx.fill();
    }
    ctx.font = '9px Consolas, monospace'; ctx.fillStyle = '#b7c5b7';
    ctx.fillText('GENERATE', 71, 67); ctx.fillText('EVALUATE', 367, 383); ctx.fillText('REFINE', 81, 427);
    ctx.fillStyle = '#c8b58e';
    for (const [x, y] of [[61, 64], [357, 380], [71, 424]]) { ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill(); }
  }
  function stop() { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
  function tick(time) {
    frame = 0;
    if (paused || !visible || document.hidden) { lastTime = 0; return; }
    const delta = lastTime ? Math.min((time - lastTime) / 1000, .05) : 0;
    lastTime = time; phase += delta;
    pointer.x += (target.x - pointer.x) * Math.min(1, delta * 5);
    pointer.y += (target.y - pointer.y) * Math.min(1, delta * 5);
    draw(); frame = requestAnimationFrame(tick);
  }
  function start() { if ((gpu || ctx) && !frame && !paused && visible && !document.hidden) frame = requestAnimationFrame(tick); }
  const entranceAnimations = new Set();
  function state() {
    document.documentElement.classList.toggle('motion-paused', paused);
    if (control) { control.textContent = paused ? 'Play motion' : 'Pause motion'; control.setAttribute('aria-pressed', String(paused)); }
    if (paused) { stop(); entranceAnimations.forEach(a => a.finish()); entranceAnimations.clear(); } else start();
  }
  if (gpu || ctx) {
    const resize = () => {
      const size = Math.max(1, Math.round(canvas.getBoundingClientRect().width * Math.min(devicePixelRatio || 1, 1.75)));
      if (gpu) gpu.resize(size);
      else { canvas.width = canvas.height = size; ctx.setTransform(size / 500, 0, 0, size / 500, 0, 0); }
      draw();
    };
    resize(); figure.classList.add('has-manifold');
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener('resize', resize, { passive: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting; visible ? start() : stop();
    }, { rootMargin: '80px' }).observe(figure);
    figure.addEventListener('pointermove', event => {
      if (!finePointer.matches || paused) return;
      const r = figure.getBoundingClientRect();
      target = { x: (event.clientX - r.left) / r.width * 2 - 1, y: (event.clientY - r.top) / r.height * 2 - 1 };
    }, { passive: true });
    figure.addEventListener('pointerleave', () => { target = { x: 0, y: 0 }; });
    control.hidden = false; control.addEventListener('click', () => { paused = !paused; state(); });
  }
  reduced.addEventListener('change', event => { paused = event.matches; state(); });
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  state();

  // Animate only when an element enters view. The underlying content is never hidden.
  if ('IntersectionObserver' in window && Element.prototype.animate) {
    const elements = document.querySelectorAll('.hero-copy > *, .thesis-card, .topic-card, .section-heading, .log-group > article, .research-section h2, .support h2, .stat');
    const reveal = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        reveal.unobserve(entry.target);
        if (paused) continue;
        const animation = entry.target.animate([
          { opacity: .15, transform: 'translateY(28px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 950, delay: Number(entry.target.dataset.motionOrder || 0) * 65, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
        entranceAnimations.add(animation); animation.finished.then(() => entranceAnimations.delete(animation)).catch(() => entranceAnimations.delete(animation));
      }
    }, { threshold: .07 });
    elements.forEach((element, i) => { element.dataset.motionOrder = String(i % 3); reveal.observe(element); });
  }

  // A compositor-only reading-progress line; scrolling itself stays native.
  const progress = document.querySelector('.reading-progress');
  let scrollFrame = 0;
  const updateProgress = () => {
    scrollFrame = 0;
    const distance = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.transform = `scaleX(${distance > 0 ? Math.min(1, Math.max(0, scrollY / distance)) : 0})`;
  };
  window.addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateProgress); }, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true }); updateProgress();
})();
