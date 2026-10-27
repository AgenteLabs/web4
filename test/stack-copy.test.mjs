// The served map is a BYTE-IDENTICAL copy of AgenteLabs/stack.json, and the
// checker is a byte copy of that repository's own. Both are pinned against the
// sibling checkout when it is beside this one, and reported UNKNOWN — never
// passed — when it is not. node: builtins only, no install.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate, lint, CONTRACT } from '../vendor-stack.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SIBLING = join(ROOT, '..', 'stack.json');
const readBin = (p) => readFileSync(p);

test('the served stack copy validates and lints clean against web4/1', () => {
  const doc = JSON.parse(readFileSync(join(ROOT, '.well-known', 'stack.json'), 'utf8'));
  assert.equal(doc.contract, CONTRACT);
  const v = validate(doc);
  assert.deepEqual(v.errors, [], 'stack copy does not validate');
  const l = lint(doc);
  assert.deepEqual(l.findings, [], 'stack copy has lint findings');
});

test('.well-known/stack.json is byte-identical to the sibling stack.json (or UNKNOWN)', () => {
  const src = join(SIBLING, 'stack.json');
  if (!existsSync(src)) {
    console.log('UNKNOWN: sibling stack.json checkout is absent; cannot verify the copy is current');
    return;
  }
  assert.equal(
    readBin(join(ROOT, '.well-known', 'stack.json')).toString('binary'),
    readBin(src).toString('binary'),
    '.well-known/stack.json has drifted from the sibling — re-copy it, never hand-edit',
  );
});

test('vendor-stack.mjs is byte-identical to the sibling checker (or UNKNOWN)', () => {
  const src = join(SIBLING, 'vendor-stack.mjs');
  if (!existsSync(src)) {
    console.log('UNKNOWN: sibling stack.json checkout is absent; cannot verify vendor-stack.mjs is current');
    return;
  }
  assert.equal(
    readBin(join(ROOT, 'vendor-stack.mjs')).toString('binary'),
    readBin(src).toString('binary'),
    'vendor-stack.mjs has drifted from canon — re-vendor, never edit',
  );
});
