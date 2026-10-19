import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadCharter, validateCharter, handshakeFromCharter, ROLE_NAME_MAX } from '../scripts/mesh.mjs';
import { ROOT, SITE, json, sibling, unknown } from './_helpers.mjs';

const FAMILIES = ['growth', 'revenue', 'product', 'engineering', 'operations', 'data', 'finance', 'risk', 'governance', 'support'];
const charter = loadCharter(join(ROOT, 'flashyos.roles.json'));

test('the charter validates offline, names eight roles from the ten families, and escalates to a role that exists', () => {
  validateCharter(charter);
  assert.equal(charter.slug, 'web4-global');
  assert.equal(charter.roles.length, 8);
  for (const r of charter.roles) {
    assert.ok(FAMILIES.includes(r.family), `${r.name}: family ${r.family} is not one of the ten`);
    assert.ok(r.name.length <= ROLE_NAME_MAX);
    assert.match(r.measure, /as a share of/, `${r.name}: a measure is a ratio, never a count`);
  }
  assert.ok(charter.roles.some((r) => r.name === charter.escalation));
  assert.match(charter.description, /AAO expands to Agentic Autonomous Organization/);
});

test('the served handshake and charter are the ones derived from flashyos.roles.json', () => {
  const served = JSON.parse(readFileSync(join(SITE, '.well-known', 'flashyos.json'), 'utf8'));
  assert.deepEqual(served, handshakeFromCharter(charter));
  assert.deepEqual(JSON.parse(readFileSync(join(SITE, '.well-known', 'flashyos-charter.json'), 'utf8')), charter);
  assert.ok(served.capabilities.length > 0, 'a handshake advertising nothing is undiscoverable');
});

test('the real conformance suite reads the built site at level two (or UNKNOWN without flashyos beside this repo)', async (t) => {
  const fx = sibling('flashyos');
  const dist = fx && join(fx, 'packages', 'conformance', 'dist', 'index.js');
  if (!dist || !existsSync(dist)) return unknown(t, 'flashyos (packages/conformance/dist)');
  const { runConformance } = await import(pathToFileURL(dist).href);
  const fetchImpl = async (url) => {
    const f = join(SITE, new URL(url).pathname);
    if (!existsSync(f)) return new Response('404', { status: 404 });
    return new Response(readFileSync(f), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const r = await runConformance({ domain: json('site.config.json').domain, fetchImpl, maxLevel: 2, now: () => new Date('2026-10-19T00:00:00Z') });
  const failed = r.checks.filter((c) => c.status !== 'pass');
  assert.equal(failed.length, 0, failed.map((c) => `${c.question}: ${c.detail}`).join('\n'));
  assert.equal(r.level, 2);
  assert.equal(r.mark, false, 'L3 is read from the register; a site cannot award itself the mark');
});
