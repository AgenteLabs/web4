// The README's shape is load-bearing: a reader arriving cold gets the sections
// in a fixed order, the mark beside the title, a dated status, the licence line
// last, and every repo link inside the single allowlist. node: builtins only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPOS } from './links.test.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');

const SECTION_ORDER = [
  '## Quick start',
  '## The stack',
  '## What makes it different',
  '## Layout',
  '## Conformance',
  '## Where it sits — it is the map',
  '## Adopters',
  '## Links',
  '## Status',
];

test('the sections appear once, in the required order', () => {
  let last = -1;
  for (const h of SECTION_ORDER) {
    const at = readme.indexOf(`\n${h}\n`);
    assert.ok(at !== -1, `missing section heading: ${h}`);
    assert.ok(at > last, `section out of order: ${h}`);
    last = at;
  }
});

test('a one-sentence what-it-is precedes the first section', () => {
  const h1 = readme.indexOf('# Web 4 — start here');
  assert.equal(h1, 0, 'the H1 must be the first line');
  const firstSection = readme.indexOf('\n## Quick start\n');
  const intro = readme.slice(0, firstSection);
  assert.match(intro, /Web 4 is the agentic internet/, 'the intro sentence is missing');
});

test('the bolt mark sits beside the H1 and is a file the manifest covers', () => {
  assert.match(readme, /<img src="brand\/assets\/bolt-gold\.svg" width="48" alt="">/);
  const manifest = readFileSync(join(ROOT, 'brand', 'MANIFEST.sha256'), 'utf8');
  assert.match(manifest, /assets\/bolt-gold\.svg$/m, 'the bolt the README shows is not in the brand manifest');
});

test('the status line carries a date', () => {
  assert.match(
    readme,
    /^Status: the map is current as of \d{4}-\d{2}-\d{2}; statuses are per-repo and honest\./m,
  );
});

test('the licence line is the last line, exactly once', () => {
  const LICENCE_LINE =
    'Licence: Apache-2.0, holder Flashy Labs. The estate licence register in flashyos `tools/estate-licences.mjs` is the authority; the full grant is in [LICENSE](LICENSE).';
  assert.equal(readme.split(LICENCE_LINE).length - 1, 1, 'the licence line must appear exactly once');
  assert.equal(readme.trimEnd().split('\n').at(-1), LICENCE_LINE, 'the licence line must be last');
});

test('every FlashyLabs repo link in the README is in the allowlist', () => {
  const linked = [...readme.matchAll(/github\.com\/AgenteLabs\/([^\s)\/#"'`]+)/g)].map((m) => m[1]);
  assert.ok(linked.length > 0);
  const unknown = linked.filter((r) => !REPOS.includes(r));
  assert.deepEqual(unknown, [], `README links repos not in the allowlist: ${unknown.join(', ')}`);
});
