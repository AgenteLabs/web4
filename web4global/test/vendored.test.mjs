import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, json, sibling, unknown } from './_helpers.mjs';

const same = (a, b) => readFileSync(a).equals(readFileSync(b));

test('vendored files are byte-identical to their canonical sources (or UNKNOWN)', (t) => {
  const fx = sibling('flashyos');
  if (!fx) return unknown(t, 'flashyos');
  for (const [here, there] of [
    ['vendor-ritual.mjs', 'packages/ritual/vendor-ritual.mjs'],
    ['vendor-check-directory.mjs', 'packages/directory/vendor-check-directory.mjs'],
    ['scripts/vendor-reachability.mjs', 'tools/reachability.mjs'],
  ]) {
    const src = join(fx, there);
    assert.ok(existsSync(src), `${there} missing in flashyos`);
    assert.ok(same(join(ROOT, here), src), `${here} drifted from flashyos/${there} — re-vendor, never edit`);
  }
});

test('mesh.mjs and the stack.json copy match the web4 map repository (or UNKNOWN)', (t) => {
  const w4 = sibling('web4');
  if (!w4 || !existsSync(join(w4, 'scripts', 'mesh.mjs'))) return unknown(t, 'web4');
  assert.ok(same(join(ROOT, 'scripts', 'mesh.mjs'), join(w4, 'scripts', 'mesh.mjs')), 'scripts/mesh.mjs drifted');
  assert.ok(same(join(ROOT, '.well-known', 'stack.json'), join(w4, '.well-known', 'stack.json')), '.well-known/stack.json drifted');
});

test('the canon lock carries what the owners publish (or UNKNOWN)', (t) => {
  const fx = sibling('flashyos');
  if (!fx) return unknown(t, 'flashyos');
  const lock = json('canon.lock.json');
  const src = JSON.parse(readFileSync(join(fx, 'apps/marketing/src/lib/terms.data.json'), 'utf8'));
  for (const mine of lock.facts['vocabulary.terms'].terms) {
    const theirs = src.terms.find((x) => x.key === mine.key);
    assert.ok(theirs, `${mine.key} is no longer in the owner's map`);
    for (const k of ['term', 'aliases', 'owner', 'canonical', 'anchor']) assert.deepEqual(mine[k], theirs[k], `${mine.key}.${k} drifted`);
  }
  const lineage = readFileSync(join(fx, 'apps/marketing/src/lib/lineage.ts'), 'utf8');
  const m = lock.facts['mesh.provenance'].value;
  for (const line of Object.values(m.lines)) assert.ok(lineage.includes(`'${line}'`), `mesh.provenance line “${line}” drifted`);
  assert.ok(lineage.includes(`url: '${m.network.url}'`) && lineage.includes(`url: '${m.roadmap.url}'`));
});
