// The site is generated, and these are the drift gates.
//
// The committed site/ is the output of scripts/build-site.mjs. A fresh build
// must reproduce it byte for byte; the generator must reach no network; every
// internal link must resolve; every page must be in the sitemap and llms.txt;
// and the FAQ page must carry parseable FAQPage structured data. node: builtins
// only, no install.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, statSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, relative, sep } from 'node:path';
import { posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../scripts/build-site.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(ROOT, 'site');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const read = (p) => readFileSync(p, 'utf8');
const relPosix = (base, p) => relative(base, p).split(sep).join('/');

// Build once into a temp directory; every test reads it.
const OUT = mkdtempSync(join(tmpdir(), 'web4-site-'));
build(OUT);
process.on('exit', () => rmSync(OUT, { recursive: true, force: true }));

const pages = walk(SITE).filter((p) => p.endsWith('.html'));

test('a fresh build reproduces the committed site byte for byte', () => {
  assert.ok(existsSync(SITE), 'site/ is not committed — run node scripts/build-site.mjs');
  for (const file of walk(SITE)) {
    const rel = relPosix(SITE, file);
    assert.ok(existsSync(join(OUT, rel)), `generator no longer writes ${rel}`);
    assert.equal(
      readFileSync(join(OUT, rel)).toString('binary'),
      readFileSync(file).toString('binary'),
      `${rel} drifted from the generator — edit scripts/build-site.mjs, never site/`,
    );
  }
  // And nothing extra: the generator's output set IS the committed set.
  assert.equal(walk(OUT).length, walk(SITE).length, 'the generator writes a different number of files than are committed');
});

test('the generator reaches no network at build', () => {
  for (const rel of ['scripts/build-site.mjs', 'scripts/mesh.mjs']) {
    const src = read(join(ROOT, rel));
    assert.doesNotMatch(src, /\bfetch\s*\(/, `${rel} calls fetch()`);
    assert.doesNotMatch(src, /node:https?/, `${rel} imports node:http(s)`);
    assert.doesNotMatch(src, /node:net\b/, `${rel} imports node:net`);
    assert.doesNotMatch(src, /from\s+['"]https?:/, `${rel} imports from a URL`);
    assert.doesNotMatch(src, /require\(\s*['"]https?['"]\s*\)/, `${rel} requires http(s)`);
  }
});

test('every internal link resolves to a generated page or file', () => {
  for (const p of pages) {
    const dir = posix.dirname(relPosix(SITE, p));
    for (const m of read(p).matchAll(/href="([^"]+)"/g)) {
      const href = m[1].split('#')[0].split('?')[0];
      if (!href || /^[a-z]+:/i.test(href)) continue; // skip absolute (https:, mailto:)
      let t = posix.normalize(posix.join(dir === '.' ? '' : dir, href)).replace(/\/$/, '');
      if (t === '' || t === '.') t = 'index.html';
      const ok = existsSync(join(SITE, t)) || existsSync(join(SITE, t, 'index.html'));
      assert.ok(ok, `${relPosix(SITE, p)} links ${href}, which the site does not serve`);
    }
  }
});

test('no page loads an external resource', () => {
  for (const p of pages) {
    const html = read(p);
    assert.doesNotMatch(html, /<script[^>]*\ssrc=/, `${p} loads an external script`);
    for (const tag of html.match(/<link[^>]+href="https?:[^>]*>/g) ?? []) {
      assert.ok(tag.includes('rel="canonical"'), `${p} loads an external resource: ${tag}`);
    }
    assert.doesNotMatch(html, /url\(\s*['"]?https?:/, `${p} loads an external asset via url()`);
    assert.doesNotMatch(html, /@import/, `${p} uses @import`);
    assert.doesNotMatch(html, /<img[^>]+src="https?:/, `${p} embeds an external image`);
  }
});

test('the bolt mark and the brand tokens are on every page', () => {
  const bolt = read(join(ROOT, 'brand', 'assets', 'bolt-white.svg')).match(/\sd="([^"]+)"/)[1];
  for (const p of pages) {
    const html = read(p);
    assert.ok(html.includes(bolt), `${p} does not carry the vendored bolt geometry`);
    assert.ok(html.includes('var(--accent)'), `${p} does not use the accent variable`);
    assert.ok(html.includes('--flashy-gold'), `${p} does not carry the brand tokens`);
  }
});

test('every page is in the sitemap and in llms.txt', () => {
  const sitemap = read(join(SITE, 'sitemap.xml'));
  const llms = read(join(SITE, 'llms.txt'));
  const base = 'https://agentelabs.github.io/web4/';
  for (const p of pages) {
    const rel = relPosix(SITE, p).replace(/index\.html$/, '').replace(/\/$/, '');
    const url = base + (rel ? `${rel}/` : '');
    assert.ok(sitemap.includes(`<loc>${url}</loc>`), `sitemap missing ${url}`);
    assert.ok(llms.includes(url), `llms.txt missing ${url}`);
  }
  assert.ok(existsSync(join(SITE, 'robots.txt')));
});

test('the FAQ page carries parseable FAQPage structured data', () => {
  const cfg = JSON.parse(read(join(ROOT, 'site.config.json')));
  const html = read(join(SITE, 'faq', 'index.html'));
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(m, 'no ld+json on the FAQ page');
  const data = JSON.parse(m[1]);
  assert.equal(data['@type'], 'FAQPage');
  assert.equal(data.mainEntity.length, cfg.faq.length);
  assert.deepEqual(
    data.mainEntity.map((q) => q.name),
    cfg.faq.map((f) => f.q),
    'the JSON-LD questions do not match the config',
  );
});

test('the machine surfaces are served', () => {
  for (const rel of [
    '.well-known/stack.json',
    '.well-known/flashyos.json',
    '.well-known/flashyos-charter.json',
    '.well-known/directory.json',
    'og-card.svg',
  ]) {
    assert.ok(existsSync(join(SITE, rel)), `site does not serve ${rel}`);
  }
  const og = read(join(SITE, 'og-card.svg'));
  assert.ok(og.includes('Web 4'), 'og-card has no title');
  const bolt = read(join(ROOT, 'brand', 'assets', 'bolt-white.svg')).match(/\sd="([^"]+)"/)[1];
  assert.ok(og.includes(bolt), 'og-card has no bolt');
});
