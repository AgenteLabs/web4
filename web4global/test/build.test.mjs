import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { build } from '../scripts/build.mjs';
import { SITE, walk } from './_helpers.mjs';

test('a fresh build is byte-identical to the committed site/ (edit the inputs, never site/)', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'w4g-'));
  try {
    const written = build(tmp);
    const committed = walk(SITE).map((p) => relative(SITE, p)).sort();
    assert.deepEqual(written, committed, 'the set of files differs — run node scripts/build.mjs and commit');
    for (const rel of written) {
      assert.ok(readFileSync(join(tmp, rel)).equals(readFileSync(join(SITE, rel))), `${rel} drifted — run node scripts/build.mjs and commit`);
    }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});

test('package.json declares no dependency, and never will', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.devDependencies, undefined);
});
