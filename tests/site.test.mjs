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

test('Research note retains evidence limitations and pinned source links', () => {
  const html = read('research/attention-free-sequence-model/index.html');
  for (const section of ['results-table', 'mechanisms', 'limitations', 'reproduce']) assert.ok(ids(html).includes(section));
  assert.match(html, /does not report a new benchmark run or an independent replication/);
  assert.match(html, /ed1955973c10f6cfeef61a0139d9d13fc8d13812/);
  assert.match(html, /0\.9772/);
  assert.match(html, /97\.6%/);
  const csv = read('assets/data/attention-free-reported-results.csv').trim().split('\n').slice(1).map(r => r.split(','));
  assert.equal(csv.length, 4);
  for (const row of csv) assert.ok(Math.abs(Number(row[3]) - Number(row[1]) - Number(row[4])) < 0.001, row[0]);
  for (let col = 1; col <= 3; col++) assert.ok(Math.abs(csv.slice(0, 3).reduce((sum, row) => sum + Number(row[col]), 0) / 3 - Number(csv[3][col])) < 0.051);
});

test('Research content does not depend on a JavaScript reveal to be visible', () => {
  assert.doesNotMatch(read('assets/site.css'), /\.reveal\s*\{[^}]*opacity\s*:\s*0(?:\D|$)/);
  for (const file of indexable) assert.doesNotMatch(read(file), /<script(?! type="application\/ld\+json")/);
});

test('Homepage preserves both original and active Search Console verification tags', () => {
  const tokens = tags(read('index.html')).filter(t => t.name === 'google-site-verification').map(t => t.content);
  assert.ok(tokens.includes('VLRR7e_mlywf18lUX8r34llUfazIfXLyenjHkKhW1Kw'));
  assert.ok(tokens.includes('NF-4K5jGPvN4lWdqnNApFgtFtNAsVajT7kvSBKEvx50'));
});
