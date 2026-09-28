import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://sunghunkwag.github.io';
const read = path => readFileSync(resolve(root, path), 'utf8');
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') return [];
    const path = resolve(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}
const pages = walk(root).filter(path => path.endsWith('.html')).map(path => relative(root, path).split(sep).join('/'));
const indexable = pages.filter(path => path !== '404.html');
const canonicalFor = file => origin + '/' + file.replace(/index\.html$/, '');
const tags = html => [...html.matchAll(/<(?:meta|link)\b[^>]*>/g)].map(m => Object.fromEntries([...m[0].matchAll(/([\w:-]+)="([^"]*)"/g)].map(a => [a[1], a[2]])));
const ids = html => [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);

test('English documents have semantic landmarks, unique IDs, and one H1', () => {
  for (const file of pages) {
    const html = read(file);
    assert.match(html, /<html lang="en">/, file);
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, file);
    assert.equal((html.match(/<main(?:\s|>)/g) || []).length, 1, file);
    assert.equal(new Set(ids(html)).size, ids(html).length, file);
  }
});

test('All indexable pages have unique titles/descriptions and correct canonicals', () => {
  const titles = new Set(), descriptions = new Set();
  for (const file of indexable) {
    const html = read(file), meta = tags(html);
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = meta.find(t => t.name === 'description')?.content;
    assert.ok(title && description, file);
    assert.ok(!titles.has(title) && !descriptions.has(description), file + ': duplicate metadata');
    titles.add(title); descriptions.add(description);
    assert.deepEqual(meta.filter(t => t.rel === 'canonical').map(t => t.href), [canonicalFor(file)], file);
    assert.ok(!meta.some(t => /^(robots|googlebot)$/i.test(t.name || '') && /noindex/i.test(t.content)), file);
    assert.equal(meta.find(t => t.property === 'og:url')?.content, canonicalFor(file), file);
    assert.equal(meta.find(t => t.name === 'google-site-verification')?.content, 'VLRR7e_mlywf18lUX8r34llUfazIfXLyenjHkKhW1Kw', file);
  }
});

test('Internal navigation, downloads, styles, icons and fragments resolve', () => {
  for (const file of pages) {
    for (const [, href] of read(file).matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(mailto:|tel:|data:)/.test(href)) continue;
      const url = new URL(href, canonicalFor(file));
      if (url.origin !== origin) continue;
      let target = resolve(root, '.' + decodeURIComponent(url.pathname));
      assert.ok(target === root || target.startsWith(root + sep), href);
      assert.ok(existsSync(target), file + ': ' + href);
      if (statSync(target).isDirectory()) target = resolve(target, 'index.html');
      assert.ok(existsSync(target), file + ': ' + href);
      if (url.hash) assert.ok(ids(readFileSync(target, 'utf8')).includes(decodeURIComponent(url.hash.slice(1))), file + ': ' + href);
    }
  }
});

test('Sitemap covers exactly the canonical indexable pages; crawling stays open', () => {
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  assert.deepEqual(urls.sort(), indexable.map(canonicalFor).sort());
  assert.equal(new Set(urls).size, urls.length);
  assert.match(read('robots.txt'), /Sitemap: https:\/\/sunghunkwag\.github\.io\/sitemap\.xml/);
  assert.doesNotMatch(read('robots.txt'), /^Disallow:\s*\/\s*$/mi);
  assert.ok(tags(read('404.html')).some(t => t.name === 'robots' && /noindex/.test(t.content)));
});

test('Structured data is valid JSON with resolvable local entity references', () => {
  for (const file of indexable) {
    const schemas = [...read(file).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.equal(schemas.length, 1, file);
    const schema = JSON.parse(schemas[0][1]);
    assert.equal(schema['@context'], 'https://schema.org');
    const graphIds = new Set(schema['@graph'].map(n => n['@id']));
    assert.equal(graphIds.size, schema['@graph'].length, file);
    const visit = value => {
      if (!value || typeof value !== 'object') return;
      if (Object.keys(value).length === 1 && value['@id']) assert.ok(graphIds.has(value['@id']), file + ': ' + value['@id']);
      Object.values(value).forEach(visit);
    };
    visit(schema);
    assert.ok(schema['@graph'].some(n => n['@type'] === 'WebPage' && n.url === canonicalFor(file)), file);
  }
});

test('Withdrawn attention-free work is gone from every page, the sitemap and the assets', () => {
  assert.ok(!existsSync(resolve(root, 'research/attention-free-sequence-model')));
  for (const path of ['assets/data/attention-free-reported-results.csv', 'assets/citations/attention-free-sequence-model.json', 'assets/citations/attention-free-sequence-model.bib']) assert.ok(!existsSync(resolve(root, path)), path);
  for (const file of [...pages, 'sitemap.xml']) assert.doesNotMatch(read(file), /attention-free|neural architecture search|sequence length 64/i, file);
});

test('Gated self-improvement is the featured result, shown with its nulls, its limits and the retraction', () => {
  const home = read('index.html');
  const featured = home.match(/<article class="reveal featured-project">([\s\S]*?)<\/article>/g) || [];
  assert.equal(featured.length, 1);
  assert.match(featured[0], /gated-self-improvement/);
  assert.match(featured[0], /\+1\.52/);
  assert.match(featured[0], /Pre&#8209;registered/);
  assert.match(featured[0], /not significant/);
  assert.match(featured[0], /does not keep growing/);
  assert.ok(home.indexOf('featured-project') < home.indexOf('github.com/sunghunkwag/rsi-bench"'), 'featured card comes first');
  const failures = home.slice(home.indexOf('id="failures"'), home.indexOf('id="support"'));
  assert.match(failures, /\+1\.55 tasks per seed/, 'the retracted headline stays in the failure log');
  assert.equal((failures.match(/class="status bad"/g) || []).length, 3, 'three retractions');
  assert.match(read('research/index.html'), /<span class="topic-number">01 \/ RESEARCH NOTE<\/span><h3><a href="\/research\/gated-self-improvement\/">/);
  const note = read('research/gated-self-improvement/index.html');
  assert.match(note, /The headline is retracted/);
  assert.match(note, /holds steady rather than growing/);
  assert.match(note, /Process control beyond ranking is not established/);
  for (const file of pages) assert.doesNotMatch(read(file), /Kaggle/i, file + ': the retracted run environments stay off the site');
});

test('Research content does not depend on a JavaScript reveal to be visible', () => {
  assert.doesNotMatch(read('assets/site.css'), /\.reveal\s*\{[^}]*opacity\s*:\s*0(?:\D|$)/);
  for (const file of indexable) {
    const scripts = [...read(file).matchAll(/<script([^>]*)>/g)].map(m => m[1]);
    assert.ok(scripts.every(s => s.includes('type="application/ld+json"') || ((s.includes('src="/assets/motion.js') || s.includes('src="/assets/sculpture.js') || s.includes('src="/assets/charts.js')) && s.includes('defer'))), file);
    const html = read(file);
    for (const figure of html.matchAll(/<figure class="viz[^"]*" data-viz="(\w+)"([^>]*)>/g)) assert.match(figure[2], /\bhidden\b/, file + ': figures stay hidden until the script renders them');
    if (html.includes('data-viz=')) assert.match(html, /src="\/assets\/charts\.js[^"]*" defer/, file);
  }
  assert.doesNotMatch(read('assets/site.css'), /(?:\.reveal|\[data-motion[^]*?)\s*\{[^}]*visibility\s*:\s*hidden/);
});

test('Homepage preserves both original and active Search Console verification tags', () => {
  const tokens = tags(read('index.html')).filter(t => t.name === 'google-site-verification').map(t => t.content);
  assert.ok(tokens.includes('VLRR7e_mlywf18lUX8r34llUfazIfXLyenjHkKhW1Kw'));
  assert.ok(tokens.includes('NF-4K5jGPvN4lWdqnNApFgtFtNAsVajT7kvSBKEvx50'));
});

test('Public identity remains the project rather than its owner', () => {
  const heading = read('index.html').match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  assert.equal(heading, 'Intelligence Research Project');
  for (const file of indexable) {
    assert.doesNotMatch(read(file), /Sung Hun Kwag/i, file);
    assert.match(read(file), /"@type": "ResearchProject"/, file);
  }
});

test('RSI guide defines the term, cites sources, and links the project evidence', () => {
  const html = read('research/recursive-self-improvement/index.html');
  for (const section of ['definition', 'history', 'status', 'testing', 'experiments', 'faq', 'references']) assert.ok(ids(html).includes(section), section);
  assert.match(html, /<title>Recursive Self-Improvement \(RSI\)/);
  assert.match(html, /"@type": "DefinedTerm"/);
  assert.match(html, /arxiv\.org\/abs\/2607\.07663/);
  for (const note of ['/research/gated-self-improvement/', '/research/rsi-bench/']) assert.ok(html.includes('href="' + note), note);
  for (const file of ['index.html', 'research/index.html', 'research/rsi-bench/index.html', 'research/gated-self-improvement/index.html']) {
    assert.ok(read(file).includes('href="/research/recursive-self-improvement/'), file + ' links to the RSI guide');
  }
  for (const [, ref] of html.matchAll(/href="#(ref-[\w-]+)"/g)) assert.ok(ids(html).includes(ref), ref);
});

test('Citations identify the correct note and reported results retain their contrasts', () => {
  for (const slug of ['rsi-bench', 'gated-self-improvement']) {
    const url = origin + '/research/' + slug + '/';
    const citation = JSON.parse(read('assets/citations/' + slug + '.json'))[0];
    assert.equal(citation.URL, url);
    assert.deepEqual(citation.author, [{ literal: 'Intelligence Research Project' }]);
    assert.ok(read('assets/citations/' + slug + '.bib').includes(url));
    assert.ok(ids(read('research/' + slug + '/index.html')).includes('cite'));
  }
  const [head, ...rows] = read('assets/data/gated-rsi-reported-results.csv').trim().split(/\r?\n/).map(row => row.split(','));
  assert.deepEqual(head, ['experiment', 'hypothesis', 'contrast', 'metric', 'n', 'mean', 'ci_low', 'ci_high', 'p', 'p_type', 'verdict', 'source_revision']);
  assert.deepEqual(rows.map(r => r[0] + ' ' + r[1]), ['v3 H1', 'v3 H2', 'v3 H3', 'v3 H4', 'v2 H1', 'v2 H2', 'v1-audit retraction', 'v1-audit retraction']);
  assert.deepEqual(rows.map(r => Number(r[5])), [1.523, 1.777, 0.253, 0.05, 0.397, -0.08, -0.7, -0.59]);
  assert.deepEqual(rows.map(r => r[10]), ['supported', 'supported', 'null', 'null', 'supported', 'null', 'retracted', 'retracted']);
  assert.ok(rows.every(r => r.length === head.length && r[11] === '8e69e9f3149db5310e7571b6f5ef5a2a422d69ae'));
  const note = read('research/gated-self-improvement/index.html');
  const signed = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(2);
  for (const r of rows.slice(0, 4)) {
    assert.ok(note.includes('<td>' + signed(Number(r[5])) + '</td><td>[' + signed(Number(r[6])) + ', ' + signed(Number(r[7])) + ']</td>'), 'note table matches CSV for ' + r[1]);
  }
  assert.match(read('research/rsi-bench/index.html'), /Missing is not zero/);
  assert.match(read('research/rsi-bench/index.html'), /does not claim a clickable backlink/);
});

test('Figure script compiles, uses textContent only and keeps a table beside every figure', () => {
  const source = read('assets/charts.js');
  new Function(source);
  assert.doesNotMatch(source, /innerHTML|insertAdjacentHTML|document\.write/);
  for (const file of indexable) {
    const html = read(file);
    for (const [, kind] of html.matchAll(/data-viz="(\w+)"/g)) {
      assert.match(source, new RegExp('\\b' + kind + '\\b'), file + ': unknown figure ' + kind);
      if (kind === 'estimates') assert.match(html, /<table>/, file + ': figure needs its table view');
    }
  }
});

test('Every page offers a direct email route to support the research', () => {
  for (const file of indexable) {
    const html = read(file);
    assert.match(html, /href="mailto:sunghunkwag@gmail\.com\?subject=[^"]*Support/i, file + ': support email');
  }
  const home = read('index.html');
  assert.match(home, /class="support-ways"/);
  assert.equal((home.match(/class="support-way"/g) || []).length, 3);
  for (const file of indexable.filter(f => f.startsWith('research/'))) assert.match(read(file), /class="band band-dark support-strip"/, file);
  for (const file of indexable) assert.doesNotMatch(read(file), /laptop|\bGPU\b|\$2,900|3,500|hardware/i, file + ': support is research funding, with no hardware or target amount');
});
