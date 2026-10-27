// Drift guard for the map.
//
// Every repository the map names lives in ONE allowlist, here. The test reads
// README.md and stack.md and fails on any repo name that is not in it — a
// `github.com/AgenteLabs/<name>` link with a typo, a backticked token that
// looks like a repo and is not one, a name that differs from the allowlist
// only by case (`rites-network` for `Rites-Network`). It also fails on a repo
// in the allowlist that the README never mentions, so the list cannot grow
// stale in the other direction, and on a README that does not end on the
// exact licence line.
//
// node: builtins only. No install step.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => readFileSync(join(ROOT, name), 'utf8');

/** Every repository the map names, under github.com/FlashyLabs. Add here first. */
export const REPOS = [
  // hub + twin
  'web4',
  'stack.json',
  // 1 identity
  'flashyid-spec',
  'flashyid',
  // 2 graph
  'agentgraph',
  'therealm',
  // 3 discovery
  'intent-spec',
  'intentmesh',
  // 4 trust
  'magician',
  'Rites-Network',
  // 5 gateway
  'agent-wellknown',
  'agent-dns',
  'bastion',
  // 6 representation
  'aao',
  // 7 execution
  'flashyos',
  'flashyos-spec',
  'flashyos-tools',
  'agentfile',
  // 8 commerce
  'agentpay',
  'flashyos-wdk',
  'flashy-rails',
  'flashy-ledger',
  'flashy-contracts',
  // 9 audit
  'chronicle',
  'flashy-network',
  // spanning
  'conformance-kit',
  'mesh-lint',
  'flashy-infra',
  // teaching
  'flashy-docs',
  'flashy-examples',
];

/** Named on the map and deliberately NOT repos yet. A repo appearing here is a bug. */
export const PLANNED = ['TrustGraph', 'AgentLedger'];

/** Backticked tokens in README.md / stack.md that are vocabulary, not repo names. */
const NOT_REPOS = new Set([
  'draft',
  'private',
  'private-intended',
  'planned',
  'public',
  'launched',
  // File tokens the README names in its Quick start, Layout and Conformance
  // sections — vocabulary, not repositories. A slash-bearing path (scripts/…,
  // .well-known/…) is out of scope by construction; these bare filenames are not.
  'site.config.json',
  'vendor-stack.mjs',
  'estate-ring.json',
  'flashyos.roles.json',
  'stack.md',
  'ARCHITECTURE.md',
]);

const LICENCE_LINE =
  'Licence: Apache-2.0, holder Flashy Labs. The estate licence register in flashyos `tools/estate-licences.mjs` is the authority; the full grant is in [LICENSE](LICENSE).';

const MAP_FILES = ['README.md', 'stack.md'];

const linkedRepos = (text) =>
  [...text.matchAll(/github\.com\/AgenteLabs\/([^\s)\/#"'`]+)/g)].map((m) => m[1]);

// A backticked token with no slash and no whitespace: `flashyid`, `stack.json`,
// `draft`. Contract ids (`intent/1`) and paths (`/.well-known/stack.json`)
// carry a slash and are out of scope by construction.
const backtickedTokens = (text) =>
  [...text.matchAll(/`([^`\s\/]+)`/g)].map((m) => m[1]);

test('the allowlist has no duplicates and no case-collisions', () => {
  const lower = REPOS.map((r) => r.toLowerCase());
  assert.equal(new Set(lower).size, REPOS.length, 'duplicate repo in REPOS');
  for (const p of PLANNED) {
    assert.ok(!lower.includes(p.toLowerCase()), `${p} is PLANNED and must not also be a repo`);
  }
});

for (const file of MAP_FILES) {
  const text = read(file);

  test(`${file}: every github.com/AgenteLabs link names a repo in the allowlist`, () => {
    const seen = linkedRepos(text);
    assert.ok(seen.length > 0, `${file} links no FlashyLabs repository`);
    const unknown = seen.filter((r) => !REPOS.includes(r));
    assert.deepEqual(unknown, [], `unknown repo link(s) in ${file}: ${unknown.join(', ')}`);
  });

  test(`${file}: every backticked repo-shaped token is a repo, planned, or known vocabulary`, () => {
    const unknown = backtickedTokens(text).filter(
      (t) => !REPOS.includes(t) && !PLANNED.includes(t) && !NOT_REPOS.has(t),
    );
    assert.deepEqual(unknown, [], `unrecognised token(s) in ${file}: ${unknown.join(', ')}`);
  });

  test(`${file}: no repo name differs from the allowlist only by case`, () => {
    const exact = new Set(REPOS);
    const byLower = new Map(REPOS.map((r) => [r.toLowerCase(), r]));
    const candidates = [...linkedRepos(text), ...backtickedTokens(text)];
    const nearMisses = candidates.filter(
      (t) => !exact.has(t) && byLower.has(t.toLowerCase()),
    );
    assert.deepEqual(
      nearMisses,
      [],
      `case near-miss in ${file}: ${nearMisses.map((t) => `${t} (want ${byLower.get(t.toLowerCase())})`).join(', ')}`,
    );
  });

  test(`${file}: no planned protocol is linked as though it were a repo`, () => {
    const linked = linkedRepos(text).map((r) => r.toLowerCase());
    for (const p of PLANNED) {
      assert.ok(!linked.includes(p.toLowerCase()), `${p} is planned, not a repo, and must not be linked in ${file}`);
    }
  });
}

test('README.md mentions every repo in the allowlist', () => {
  const readme = read('README.md');
  const linked = new Set(linkedRepos(readme));
  const missing = REPOS.filter((r) => r !== 'web4' && !linked.has(r));
  assert.deepEqual(missing, [], `repos in the allowlist the README never links: ${missing.join(', ')}`);
});

test('README.md and stack.md name the same set of repos', () => {
  const a = new Set(linkedRepos(read('README.md')));
  const b = new Set(linkedRepos(read('stack.md')));
  const onlyReadme = [...a].filter((r) => !b.has(r));
  const onlyStack = [...b].filter((r) => !a.has(r));
  assert.deepEqual({ onlyReadme, onlyStack }, { onlyReadme: [], onlyStack: [] });
});

test('README.md carries the exact licence line, once, as its last line', () => {
  const readme = read('README.md');
  const occurrences = readme.split(LICENCE_LINE).length - 1;
  assert.equal(occurrences, 1, 'the licence line must appear exactly once');
  const lines = readme.trimEnd().split('\n');
  assert.equal(lines.at(-1), LICENCE_LINE, 'the licence line must be the last line of README.md');
});

test('README.md carries the status line with a date', () => {
  const readme = read('README.md');
  assert.match(
    readme,
    /^Status: the map is current as of \d{4}-\d{2}-\d{2}; statuses are per-repo and honest\./m,
  );
});

test('the map claims no repo is public or launched', () => {
  // Statuses are "draft", "private", "private-intended" or "planned" until the
  // estate licence register opens a repo and an adopter is named. This test
  // is the thing to change, deliberately, on that day — not to delete.
  for (const file of MAP_FILES) {
    const text = read(file);
    const rows = text.split('\n').filter((l) => /^\|\s*\d+\s*\|/.test(l));
    assert.ok(rows.length >= 9, `${file} should carry nine numbered layer rows`);
    for (const row of rows) {
      const cells = row.split('|').map((c) => c.trim());
      const status = cells[6] ?? '';
      assert.ok(status.length > 0, `empty status in ${file}: ${row}`);
      assert.doesNotMatch(status, /\b(public|launched|live)\b/i, `unsubstantiated status in ${file}: ${status}`);
    }
  }
});

test('package.json is dependency-free, private, ESM, Node 22', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.name, '@flashylabs/web4');
  assert.equal(pkg.private, true);
  assert.equal(pkg.type, 'module');
  // Node 22 treats a bare directory argument to --test as a file and fails to
  // find it; a quoted glob is expanded by Node itself, so it works in any shell.
  assert.equal(pkg.scripts.test, 'node --test "test/**/*.test.mjs"');
  assert.equal(pkg.engines.node, '>=22');
  for (const key of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    assert.equal(pkg[key], undefined, `${key} must not exist`);
  }
  // The estate register in flashyos (tools/estate-licences.mjs) is the authority
  // and names this repository Apache-2.0; the package.json field reflects that
  // decision, it does not make it.
  assert.equal(pkg.license, 'Apache-2.0', 'package.json must reflect the register: Apache-2.0');
});

test('the Apache-2.0 LICENSE is present and names the holder', () => {
  // The estate register in flashyos opened this repository as Apache-2.0,
  // holder Flashy Labs, so the full grant must be committed and carry that
  // holder. The register remains the authority; this file is its expression.
  const licence = read('LICENSE');
  assert.match(licence, /Apache License/, 'LICENSE is not the Apache License');
  assert.match(licence, /Version 2\.0/, 'LICENSE is not version 2.0');
  assert.match(licence, /Copyright 2026 Flashy Labs/, 'LICENSE does not name the holder (Flashy Labs)');
});
