// The served handshake and llms.txt say where this repository's source lives,
// and they say what site.config.json's `links.repo` says — the one place this
// repository already declares itself. The register comparison runs only when
// flashyos is checked out beside this repository (unknown, never passed, when
// it is not). This site carries no Organization JSON-LD, so there is no
// `sameAs` to hold; the FAQPage node is the only structured data it emits.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handshakeFromCharter, loadCharter, validateCharter } from '../scripts/mesh.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(join(ROOT, 'site.config.json'), 'utf8'));

test('the built handshake carries x-source from links.repo', () => {
  const doc = JSON.parse(readFileSync(join(ROOT, 'site', '.well-known', 'flashyos.json'), 'utf8'));
  assert.equal(doc['x-source'], cfg.links.repo);
});

test('the built llms.txt carries a Source: line from links.repo', () => {
  const line = readFileSync(join(ROOT, 'site', 'llms.txt'), 'utf8').split('\n').find((l) => l.startsWith('Source: '));
  assert.equal(line, `Source: ${cfg.links.repo}`);
});

test('a handshake derived without a source carries no x-source rather than a guess', () => {
  const charter = validateCharter(loadCharter());
  assert.equal('x-source' in handshakeFromCharter(charter), false);
  assert.equal(handshakeFromCharter(charter, { source: 'https://example.invalid/r' })['x-source'], 'https://example.invalid/r');
});

test('agrees with the estate register when flashyos is checked out beside this repository', (t) => {
  const p = join(ROOT, '..', 'flashyos', 'estate.register.json');
  if (!existsSync(p)) { t.diagnostic('UNKNOWN: no flashyos checkout beside this repository — the register was not compared'); return; }
  const row = JSON.parse(readFileSync(p, 'utf8')).rows.find((r) => r.slug === 'web4');
  if (!row) { t.diagnostic('UNKNOWN: the sibling flashyos checkout has no web4 row on its current branch'); return; }
  assert.equal(cfg.links.repo, row.url);
});
