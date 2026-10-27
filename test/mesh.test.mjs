// The mesh surfaces derive from ONE source — flashyos.roles.json — so the
// handshake can never advertise a capability the charter does not carry.
// node: builtins only, no install.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadCharter, validateCharter, capabilitiesOf, handshakeFromCharter,
  charterJson, handshakeJson, MESH,
} from '../scripts/mesh.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

test('the committed charter validates', () => {
  assert.doesNotThrow(() => validateCharter(loadCharter()));
});

test('handshake capabilities are the sorted union of every role x-capability', () => {
  const charter = validateCharter(loadCharter());
  const expected = [...new Set(charter.roles.flatMap((r) => r['x-capability'] ?? []))].sort();
  assert.deepEqual(capabilitiesOf(charter), expected);
  assert.deepEqual(handshakeFromCharter(charter).capabilities, expected);
  // No capability on the wire that no role is accountable for.
  const declared = new Set(charter.roles.flatMap((r) => r['x-capability'] ?? []));
  for (const cap of capabilitiesOf(charter)) assert.ok(declared.has(cap), `${cap} is on the wire but in no role`);
});

test('the handshake carries the charter org, not a second copy', () => {
  const charter = validateCharter(loadCharter());
  const hs = handshakeFromCharter(charter);
  assert.equal(hs.mesh, MESH);
  assert.equal(hs.org.slug, charter.slug);
  assert.equal(hs.org.name, charter.name);
});

test('charterJson round-trips the charter exactly', () => {
  const charter = validateCharter(loadCharter());
  assert.deepEqual(JSON.parse(charterJson()), charter);
});

test('the served mesh files are the derived bytes', () => {
  // The build passes site.config.json's `links.repo` as the handshake's source
  // (test/source.test.mjs holds that), so the derivation here does too.
  const cfg = JSON.parse(read('site.config.json'));
  assert.equal(read('site/.well-known/flashyos.json'), handshakeJson(undefined, { source: cfg.links.repo }));
  assert.equal(read('site/.well-known/flashyos-charter.json'), charterJson());
});

test('the served directory.json is the committed fragment byte for byte', () => {
  assert.equal(read('site/.well-known/directory.json'), read('directory.fragment.json'));
});
