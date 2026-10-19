// The mesh surfaces — how this property joins the FlashyOS mesh as a node,
// not just a page.
//
// A property is ON the mesh when a stranger's agent can discover it and what it
// offers without being told: it serves the flashyos/1 HANDSHAKE (its org and
// the capabilities it carries) and the AAO CHARTER (the roles it declares).
// Both are served at /.well-known/, and both derive from ONE source —
// `flashyos.roles.json`, the charter — so the handshake can never advertise a
// capability the charter does not carry. That is the estate rule "two
// hand-written files disagree; one source cannot."
//
// The charter is the AAO document itself. The handshake is derived: its
// `capabilities` are the union of every role's `x-capability`, so a capability
// on the wire is always a role somebody is accountable for.
//
// This module is dependency-free (node: builtins only) and reads no network, so
// build-site.mjs stays offline. The AUTHORITATIVE conformance check runs
// against the live domain after deploy:
//   npx @flashyos/conformance <domain> --level 2
//
// It is part of the vendored generator set: another protocol repository copies
// this file unchanged beside build-site.mjs and points it at its own charter.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
/** The committed AAO charter, the single source of the mesh surfaces. */
export const CHARTER_PATH = join(ROOT, 'flashyos.roles.json');

export const MESH = 'flashyos/1';
export const AAO_VERSION = '0.1';
/** The AAO charter's spec fields; any other top-level key must be `x-` prefixed. */
export const SPEC_FIELDS = Object.freeze(['aao', 'name', 'slug', 'description', 'accountableTo', 'escalation', 'repositories', 'roles']);
/** The human-approval floor an agent's role may sit at. */
export const APPROVALS = Object.freeze(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
/** A role name is capped at 24 characters — the estate's recorded AAO rule. */
export const ROLE_NAME_MAX = 24;

/** Load the committed charter. */
export function loadCharter(path = CHARTER_PATH) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * Validate the AAO charter's shape. Throws on the first fault; returns it on
 * success. This is the offline half — the shape a grep-and-a-test can hold; the
 * live conformance run is what proves the domain actually SERVES it.
 */
export function validateCharter(c) {
  const fail = (m) => { throw new Error(`charter: ${m}`); };
  if (!c || typeof c !== 'object') fail('not an object');
  for (const k of Object.keys(c)) {
    if (!SPEC_FIELDS.includes(k) && !k.startsWith('x-')) fail(`top-level key "${k}" is neither a spec field nor x- prefixed`);
  }
  if (c.aao !== AAO_VERSION) fail(`aao must be "${AAO_VERSION}"`);
  for (const k of ['name', 'slug', 'description', 'accountableTo', 'escalation']) {
    if (typeof c[k] !== 'string' || !c[k].trim()) fail(`${k} is missing`);
  }
  if (!/^[a-z0-9-]+$/.test(c.slug)) fail('slug is not machine-safe');
  if (!Array.isArray(c.roles) || c.roles.length < 1) fail('a charter with no role is undeclared');

  const names = new Set();
  for (const [i, r] of c.roles.entries()) {
    const w = `role ${i}`;
    if (typeof r.name !== 'string' || !r.name.trim()) fail(`${w}: no name`);
    if (r.name.length > ROLE_NAME_MAX) fail(`role "${r.name}" is over ${ROLE_NAME_MAX} characters`);
    if (names.has(r.name)) fail(`duplicate role "${r.name}"`);
    names.add(r.name);
    if (typeof r.family !== 'string' || !/^[a-z-]+$/.test(r.family)) fail(`role "${r.name}": family is not a lowercase family name`);
    if (typeof r.purpose !== 'string' || r.purpose.length < 12) fail(`role "${r.name}": purpose is missing or too thin`);
    if (typeof r.measure !== 'string' || !r.measure.trim()) fail(`role "${r.name}": names no measure`);
    if (!Array.isArray(r.capabilities) || r.capabilities.length < 1) fail(`role "${r.name}": declares no capability`);
    if (!APPROVALS.includes(r.humanApprovalAtOrAbove)) fail(`role "${r.name}": humanApprovalAtOrAbove is not one of ${APPROVALS.join('/')}`);
    if ('x-capability' in r && !Array.isArray(r['x-capability'])) fail(`role "${r.name}": x-capability must be a list`);
  }
  // escalation must name a role that exists — an escalation path to nobody is
  // worse than none.
  if (!names.has(c.escalation)) fail(`escalation names "${c.escalation}", which is not a declared role`);
  return c;
}

/** The mesh capabilities: the union of every role's x-capability, sorted. */
export function capabilitiesOf(charter) {
  const set = new Set();
  for (const r of charter.roles ?? []) for (const cap of r['x-capability'] ?? []) set.add(cap);
  return [...set].sort();
}

/**
 * Derive the flashyos/1 handshake from the charter — capabilities and all — so
 * the two surfaces cannot disagree. `apiBase`/`webBase`/`appBase` default to the
 * estate's hosts; a caller may override for a test.
 */
export function handshakeFromCharter(charter, { apiBase = 'https://api.flashyos.com', webBase = 'https://flashyos.com', appBase = 'https://app.flashyos.com' } = {}) {
  return {
    mesh: MESH,
    org: { slug: charter.slug, name: charter.name, profile: `${appBase}/org/${charter.slug}` },
    capabilities: capabilitiesOf(charter),
    wants: `${apiBase}/api/v1/network/roadmap`,
    api: apiBase,
    join: `${webBase}/join`,
  };
}

/** The bytes served at /.well-known/flashyos-charter.json (the charter itself). */
export function charterJson(charter = validateCharter(loadCharter())) {
  return JSON.stringify(charter, null, 2) + '\n';
}

/** The bytes served at /.well-known/flashyos.json (the derived handshake). */
export function handshakeJson(charter = validateCharter(loadCharter())) {
  return JSON.stringify(handshakeFromCharter(charter), null, 2) + '\n';
}
