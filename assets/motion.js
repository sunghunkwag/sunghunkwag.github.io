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

  // The fallback preserves the same neural-network meaning without WebGL.
  function draw() {
    if (gpu) { gpu.draw(phase, pointer); return; }
    if (!ctx) return;
    ctx.clearRect(0,0,500,500);
    const layers=[3,5,5,2].map((count,l)=>Array.from({length:count},(_,i)=>({
      x:65+l*123+Math.sin(phase*.18)*3+pointer.x*4,
      y:228+(i-(count-1)/2)*46+Math.sin(phase*.28)*3
    })));
    ctx.lineWidth=1;
    for(let l=0;l<3;l++)for(const a of layers[l])for(const b of layers[l+1]){
      ctx.strokeStyle='rgba(220,220,220,.26)';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      const t=(phase*.12)%1;ctx.fillStyle='rgba(245,245,245,.8)';ctx.beginPath();ctx.arc(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,1.7,0,Math.PI*2);ctx.fill();
    }
    for(const node of layers.flat()){
      const shade=ctx.createRadialGradient(node.x-4,node.y-5,1,node.x,node.y,11);
      shade.addColorStop(0,'#ffffff');shade.addColorStop(1,'#555555');ctx.fillStyle=shade;
      ctx.beginPath();ctx.arc(node.x,node.y,11,0,Math.PI*2);ctx.fill();
    }
    ctx.strokeStyle='#777777';ctx.beginPath();ctx.moveTo(434,345);ctx.lineTo(434,390);ctx.lineTo(65,390);ctx.lineTo(65,345);ctx.stroke();
    ctx.beginPath();ctx.moveTo(59,354);ctx.lineTo(65,345);ctx.lineTo(71,354);ctx.stroke();
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
