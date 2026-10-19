import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, SITE, walk } from './_helpers.mjs';

const BRAND = join(ROOT, 'brand');
const BOLT = 'M66 2 L18 68 H44 L34 118 L82 48 H54 Z';

test('every file in brand/ matches MANIFEST.sha256, and the manifest covers every file', () => {
  const lines = readFileSync(join(BRAND, 'MANIFEST.sha256'), 'utf8').trim().split('\n').map((l) => l.split(/\s+\.?\/?/));
  const listed = new Set();
  for (const [hash, rel] of lines) {
    const f = join(BRAND, rel);
    assert.ok(existsSync(f), `${rel} listed and missing`);
    assert.equal(createHash('sha256').update(readFileSync(f)).digest('hex'), hash, `${rel} drifted from the manifest`);
    listed.add(rel);
  }
  for (const f of walk(BRAND)) { const rel = f.slice(BRAND.length + 1); if (rel !== 'MANIFEST.sha256') assert.ok(listed.has(rel), `${rel} is not in the manifest`); }
});

test('the mark is the Four and never the bolt; Flare is the only accent in the tokens', () => {
  for (const f of walk(join(BRAND, 'assets'))) assert.ok(!readFileSync(f, 'utf8').includes(BOLT), `${f} carries the estate bolt`);
  const tokens = readFileSync(join(BRAND, 'tokens.css'), 'utf8');
  assert.match(tokens, /--w4-flare:\s*#FF4D3A/i);
  assert.match(tokens, /--w4-flare-deep:\s*#C82B1B/i);
  const accents = [...tokens.matchAll(/--w4-[a-z-]+:\s*(#[0-9A-Fa-f]{6})/g)].map((m) => m[1].toUpperCase());
  for (const estateAccent of ['#12E29B', '#5B8CFF', '#B084FF', '#FF8A4C', '#FFC93C', '#3ED8F0']) assert.ok(!accents.includes(estateAccent), `${estateAccent} is another property's accent`);
});

test('fonts are self-hosted: three families declared, each file served, no font CDN at runtime', () => {
  const css = readFileSync(join(SITE, 'assets', 'site.css'), 'utf8');
  for (const fam of ['Unbounded', 'Plus Jakarta Sans', 'JetBrains Mono']) assert.ok(css.includes(`font-family:'${fam}'`), `${fam} not declared`);
  for (const m of css.matchAll(/url\((\/assets\/fonts\/[^)]+)\)/g)) assert.ok(existsSync(join(SITE, m[1])), `${m[1]} is declared and not served`);
  for (const p of walk(SITE).filter((f) => f.endsWith('.html'))) assert.ok(!/fonts\.googleapis|fonts\.gstatic/.test(readFileSync(p, 'utf8')), `${p} loads a font CDN`);
});

test('the press kit serves the kit with its manifest, so a consumer can verify a copy', () => {
  for (const f of ['brand/MANIFEST.sha256', 'brand/tokens.css', 'brand/USAGE.md', 'assets/mark-flare.svg', 'assets/lockup-ink.svg', 'assets/lockup-paper.svg', 'assets/favicon.svg', 'assets/og-card.svg']) assert.ok(existsSync(join(SITE, f)), `${f} not served`);
});
