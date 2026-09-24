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

  // An isometric bar-field fallback for browsers without WebGL.
  function draw() {
    if(gpu){gpu.draw(phase,pointer);return;}
    if(!ctx)return;
    ctx.clearRect(0,0,500,500);
    const project=(x,y,z)=>[250+(x-z)*31,325+(x+z)*14-y*61];
    const face=(points,fill)=>{ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.lineTo(...points[0]);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle='#a0a0a030';ctx.lineWidth=.6;ctx.stroke();};
    for(let row=0;row<8;row++)for(let col=0;col<8;col++){
      const x=(col-3.5)*.66,z=(row-3.5)*.66;
      const wave=.5+.5*Math.sin(x*1.25+z*.9-phase*.85),ripple=.5+.5*Math.cos(z*1.4-x*.7+phase*.58);
      const h=.24+1.55*wave*wave+.7*ripple,w=.23;
      const a=project(x-w,0,z+w),b=project(x+w,0,z+w),c=project(x+w,0,z-w);
      const at=project(x-w,h,z+w),bt=project(x+w,h,z+w),ct=project(x+w,h,z-w),dt=project(x-w,h,z-w);
      face([a,b,bt,at],'#929292');face([b,c,ct,bt],'#515151');face([at,bt,ct,dt],'#ededed');
    }
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
