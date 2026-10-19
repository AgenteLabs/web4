import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { SITE, json, htmlPages } from './_helpers.mjs';

const nav = json('nav.json');
const lock = json('canon.lock.json');
const resolves = (href) => existsSync(join(SITE, href.replace(/^\//, ''), 'index.html')) || existsSync(join(SITE, href.replace(/^\//, '')));
const ROW_CAP = 12;

test('every internal row in the registry resolves to a page the build wrote', () => {
  for (const d of nav.doors) for (const r of d.rows) {
    if (r.external) continue;
    assert.match(r.href, /^\/.*\/$/, `${r.href} must be an absolute path with a trailing slash`);
    assert.ok(resolves(r.href), `${d.label} › ${r.label} → ${r.href} answers nothing`);
  }
  assert.ok(resolves(nav.cta.href));
});

test('an external row points at an estate host, by allowlist', () => {
  for (const d of nav.doors) for (const r of d.rows) {
    if (!r.external) continue;
    const href = r.href === 'canon:open.door' ? lock.facts['open.door'].value.url : r.href;
    assert.ok(nav.externalHosts.includes(new URL(href).hostname), `${href} is not an allowlisted host`);
  }
});

test('five doors, each within the row cap, each with an audience', () => {
  assert.equal(nav.doors.length, 5);
  for (const d of nav.doors) { assert.ok(d.rows.length <= ROW_CAP); assert.ok(d.audience.length > 8); }
});

test('every machine surface the footer lists is a file the build wrote', () => {
  for (const m of nav.machine) assert.ok(existsSync(join(SITE, m.path.replace(/^\//, ''))), `${m.path} is listed and not served`);
});

test('header, footer and machine band render every registry row on every page', () => {
  for (const p of htmlPages()) {
    for (const d of nav.doors) for (const r of d.rows) {
      const href = r.href === 'canon:open.door' ? lock.facts['open.door'].value.url : r.href;
      const n = p.html.split(`href="${href}"`).length - 1;
      assert.ok(n >= 2, `${p.path}: ${href} should appear in header and footer (found ${n})`);
    }
    for (const m of nav.machine) assert.ok(p.html.includes(`href="${m.path}"`), `${p.path} lacks machine link ${m.path}`);
    assert.ok(p.html.includes('aria-label="Provenance"') && p.html.includes('on the FlashyOS mesh'), `${p.path} lacks the provenance bar`);
  }
});

test('no page links an internal path that does not exist', () => {
  for (const p of htmlPages()) {
    for (const m of p.html.matchAll(/href="(\/[^"#?]*)/g)) {
      const href = m[1];
      assert.ok(resolves(href), `${p.path} links ${href}, which the build did not write`);
    }
  }
});

test("the sitemap lists every page and robots points at it", async () => {
  const sm = json.bind(null); void sm;
  const xml = (await import('node:fs')).readFileSync(join(SITE, 'sitemap.xml'), 'utf8');
  for (const p of htmlPages()) {
    if (p.path.endsWith('404.html')) continue;
    assert.ok(xml.includes(`<loc>https://web4.global${p.path}</loc>`), `${p.path} missing from sitemap`);
  }
  assert.match((await import('node:fs')).readFileSync(join(SITE, 'robots.txt'), 'utf8'), /Sitemap: https:\/\/web4\.global\/sitemap\.xml/);
});
