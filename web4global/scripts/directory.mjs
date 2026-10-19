#!/usr/bin/env node
// The directory/1 fragment, derived from the charter — one source, never typed.
//
//   node scripts/directory.mjs            writes directory.fragment.json
//
// Every agent node is a role the charter declares; every edge is `declares`
// from the organisation to that agent with the role's capabilities as scope.
// Nothing here asserts a chapter: a chapter files its own member-of edge from
// its own repository as PROPOSED, and a steward countersigns it there. A person
// appears only by their own assertion, so none is minted here.
//
// `asserted` is the date in site.config.json so the build is a deterministic
// function of the tree; expiry is derived (one year) and never accepted as input.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCharter, validateCharter } from './mesh.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const OUT = join(ROOT, 'directory.fragment.json');

export function fragmentFor(charter, cfg) {
  const asserted = cfg.asserted;
  const y = Number(asserted.slice(0, 4)) + 1;
  const expires = `${y}${asserted.slice(4)}`;
  const org = `org/${charter.slug}`;
  const stamp = { asserted, assertedBy: 'person/michael', expires, visibility: 'public' };
  const nodes = [
    { ...stamp, id: org, kind: 'Organization', name: charter.name, description: charter.description, url: `https://${cfg.domain}/` },
    ...charter.roles.map((r) => ({
      ...stamp,
      id: `agent/${charter.slug}-${r.name}`,
      kind: 'Agent',
      name: r.name,
      description: r.purpose,
    })),
  ];
  const edges = [
    // The accountable human — person/michael is an id another repository
    // (gda-group) already defines by that person's own assertion; it is
    // referenced here, never minted, hence `--external` on the check.
    { ...stamp, type: 'accountableFor', from: 'person/michael', to: org },
    ...charter.roles.map((r) => ({
      ...stamp,
      type: 'declares',
      from: org,
      to: `agent/${charter.slug}-${r.name}`,
      role: r.name,
      scope: r.capabilities,
    })),
  ];
  nodes.sort((a, b) => a.id.localeCompare(b.id));
  return { directory: '0.1', source: `repo/${charter.slug}`, generated: asserted, nodes, edges };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cfg = JSON.parse(readFileSync(join(ROOT, 'site.config.json'), 'utf8'));
  const charter = validateCharter(loadCharter(join(ROOT, 'flashyos.roles.json')));
  writeFileSync(OUT, JSON.stringify(fragmentFor(charter, cfg), null, 2) + '\n');
  console.log(`wrote ${OUT}`);
}
