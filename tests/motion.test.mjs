import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/motion.js', import.meta.url), 'utf8');
function browser({ reduced = false, canvasAvailable = true } = {}) {
  const callbacks = new Map(), observers = [], listeners = {};
  let next = 0, strokes = [], paths = [];
  const ctx = {
    clearRect() { strokes = []; paths = []; },
    createRadialGradient: () => ({ addColorStop() {} }),
    fillRect() {}, setLineDash() {}, beginPath() {}, arc() {}, fill() {}, fillText() {}, setTransform() {},
    moveTo(x, y) { paths.push([x,y]); }, lineTo(x, y) { paths.push([x,y]); }, stroke() { strokes.push(paths.length); }
  };
  const events = () => ({ listeners: {}, addEventListener(name, fn) { this.listeners[name] = fn; } });
  const classes = new Set();
  const classList = { add: name => classes.add(name), toggle(name, value) { value ? classes.add(name) : classes.delete(name); } };
  const figure = { ...events(), classList, getBoundingClientRect: () => ({ left: 0, top: 0, width: 500, height: 500 }) };
  const canvas = { getContext: () => canvasAvailable ? ctx : null, getBoundingClientRect: () => ({ width: 500 }) };
  const control = { ...events(), hidden: true, textContent: '', setAttribute(name, value) { this[name] = value; } };
  const progress = { style: {} };
  const media = { ...events(), matches: reduced };
  const document = {
    ...events(), hidden: false, documentElement: { classList, scrollHeight: 3000 },
    querySelector: s => ({ '.hero-figure':figure, '.manifold-canvas':canvas, '.motion-toggle':control, '.reading-progress':progress })[s],
    querySelectorAll: () => []
  };
  class IntersectionObserver { constructor(fn) { this.fn = fn; observers.push(this); } observe() {} unobserve() {} }
  const context = { document, matchMedia: q => q.includes('reduced') ? media : { matches:true },
    requestAnimationFrame: fn => { callbacks.set(++next, fn); return next; },
    cancelAnimationFrame: id => callbacks.delete(id), devicePixelRatio: 2, innerHeight: 1000, scrollY: 0,
    IntersectionObserver, ResizeObserver: class { observe() {} }, Element: function() {} };
  context.window = { IntersectionObserver, ResizeObserver: context.ResizeObserver, addEventListener: (name, fn) => listeners[name] = fn };
  vm.runInNewContext(source, context);
  return { control, document, media, figure, observers, callbacks, classes,
    points: () => paths, strokes: () => strokes,
    step(time) { const pending = [...callbacks.values()]; callbacks.clear(); pending.forEach(fn => fn(time)); }
  };
}

test('Network fallback renders finite geometry and changes over successive frames', () => {
  const b = browser();
  assert.equal(b.control.hidden, false);
  assert.ok(b.strokes().length > 20);
  const first = JSON.stringify(b.points());
  for (let frame=0; frame<90; frame++) b.step(frame * 16.67);
  assert.notEqual(JSON.stringify(b.points()), first);
  assert.ok(b.points().every(p => p.every(n => Number.isFinite(n) && n > 0 && n < 500)));
});
test('Pause freezes the rendered frame; resume starts exactly one loop', () => {
  const b = browser(); b.step(1); b.step(17);
  b.control.listeners.click(); const frozen = JSON.stringify(b.points());
  assert.equal(b.callbacks.size, 0); assert.equal(b.control.textContent, 'Play motion');
  b.step(100); assert.equal(JSON.stringify(b.points()), frozen);
  b.control.listeners.click(); assert.equal(b.callbacks.size, 1);
});
test('Offscreen and background tabs stop animation work', () => {
  const b = browser();
  b.observers[0].fn([{ isIntersecting:false }]); assert.equal(b.callbacks.size, 0);
  b.observers[0].fn([{ isIntersecting:true }]); assert.equal(b.callbacks.size, 1);
  b.document.hidden = true; b.document.listeners.visibilitychange(); assert.equal(b.callbacks.size, 0);
  b.document.hidden = false; b.document.listeners.visibilitychange(); assert.equal(b.callbacks.size, 1);
});
test('Reduced motion starts with a still illustration and can react to preference changes', () => {
  const b = browser({ reduced:true });
  assert.equal(b.callbacks.size, 0); assert.equal(b.control.textContent, 'Play motion');
  b.media.listeners.change({ matches:false }); assert.equal(b.callbacks.size, 1);
  b.media.listeners.change({ matches:true }); assert.equal(b.callbacks.size, 0);
});
test('An unavailable canvas keeps the SVG fallback and does not start a loop', () => {
  const b = browser({ canvasAvailable:false });
  assert.equal(b.control.hidden, true); assert.equal(b.classes.has('has-manifold'), false);
  assert.equal(b.callbacks.size, 0);
});
