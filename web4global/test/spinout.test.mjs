import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, walk, json } from './_helpers.mjs';

test('the directory is self-contained: no script or page imports or reads a path above its root', () => {
  for (const f of [...walk(join(ROOT, 'scripts'))].filter((f) => f.endsWith('.mjs'))) {
    const s = readFileSync(f, 'utf8');
    assert.ok(!/from\s+['"]\.\.\/\.\./.test(s) && !/join\(ROOT,\s*'\.\.'/.test(s), `${f} reaches above the repository root`);
  }
});

test('vercel.json serves the committed site/ without a build, with trailing slashes, and the deploy needs no install', () => {
  const v = json('vercel.json');
  assert.equal(v.outputDirectory, 'site');
  assert.equal(v.buildCommand, '');
  assert.equal(v.framework, null);
  assert.equal(v.trailingSlash, true);
  assert.ok(existsSync(join(ROOT, 'site', 'index.html')));
});

test('the spin-out is documented and the workflow travels with the directory', () => {
  const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
  assert.match(readme, /git subtree split/);
  assert.ok(existsSync(join(ROOT, '.github', 'workflows', 'ci.yml')));
  const ci = readFileSync(join(ROOT, '.github', 'workflows', 'ci.yml'), 'utf8');
  assert.ok(!/\bmain\b.*branches|branches:.*\bmain\b/.test(ci), 'a workflow never pins a literal branch');
  assert.match(ci, /npm run verify/);
  assert.ok(!/\[skip ci\]/.test(ci));
});
