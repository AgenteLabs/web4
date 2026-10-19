import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fragmentFor } from '../scripts/directory.mjs';
import { loadCharter, validateCharter } from '../scripts/mesh.mjs';
import { checkFragment } from '../vendor-ritual.mjs';
import { ROOT, SITE, json } from './_helpers.mjs';

const cfg = json('site.config.json');

test('directory.fragment.json is exactly what the emitter derives from the charter, and the vendored checker admits it', () => {
  const charter = validateCharter(loadCharter(join(ROOT, 'flashyos.roles.json')));
  assert.deepEqual(json('directory.fragment.json'), fragmentFor(charter, cfg), 'run node scripts/directory.mjs');
  const out = execFileSync('node', [join(ROOT, 'vendor-check-directory.mjs'), join(ROOT, 'directory.fragment.json'), '--external', 'person/michael'], { encoding: 'utf8' });
  assert.match(out, /0 problem\(s\)/);
});

test('the directory names an accountable human and no person it did not assert', () => {
  const d = json('directory.fragment.json');
  assert.ok(d.edges.some((e) => e.type === 'accountableFor' && e.to === 'org/web4-global'));
  assert.equal(d.nodes.filter((n) => n.kind === 'Person').length, 0, 'a person appears only by their own assertion, in their own fragment');
  for (const n of d.nodes) for (const k of Object.keys(n)) assert.ok(!/mail|phone|handle|telegram/i.test(k), `${n.id} carries contact data`);
  for (const n of d.nodes) assert.ok(n.expires > n.asserted);
});

test('the ritual calendar validates, belongs to this organisation, and claims no observance it did not record', () => {
  const f = json('ritual.fragment.json');
  assert.deepEqual(checkFragment(f), []);
  assert.equal(f.subject, 'org/web4-global');
  assert.ok(f.liturgies.some((l) => l.id === 'build-night' && l.cadence === 'monthly'));
  for (const o of f.observances) assert.ok(['performed', 'witnessed', 'consecrated', 'void'].includes(o.state));
  for (const o of f.observances.filter((o) => o.state === 'consecrated')) assert.match(o.consecration?.by ?? '', /^person\//);
});

test('the served copies are byte-identical to the committed fragments', () => {
  for (const [src, dst] of [['directory.fragment.json', '.well-known/directory.json'], ['ritual.fragment.json', '.well-known/ritual.json'], ['tally.json', 'tally.json'], ['.well-known/stack.json', '.well-known/stack.json']]) {
    assert.ok(readFileSync(join(ROOT, src)).equals(readFileSync(join(SITE, dst))), `${dst} drifted from ${src}`);
  }
});
