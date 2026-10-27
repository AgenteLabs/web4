#!/usr/bin/env node
// The institutional front door — generated, never hand-edited.
//
// ONE dependency-free, config-driven generator. It reads `site.config.json`
// (contract site-config/1, schema/site-config-1.json), the repository's own
// `.well-known/stack.json` copy, its AAO charter and the vendored brand kit,
// and writes the whole of `site/`. Everything property-specific lives in those
// inputs, so this SCRIPT is vendored UNCHANGED across the estate's protocol
// repositories — the eight siblings copy build-site.mjs, scripts/mesh.mjs,
// vendor-stack.mjs, schema/site-config-1.json and brand/, bring their own
// config, charter, stack copy and README, and get the same door
// (CONTRIBUTING.md, "Vendoring this generator").
//
//   node scripts/build-site.mjs            build into site/
//   node scripts/build-site.mjs <out>      build into <out> (the drift test's path)
//
// Two promises this file keeps structurally:
//   - node: builtins only, and ZERO network at build. No network calls at all —
//     test/build.test.mjs greps this source and mesh.mjs and fails on either.
//   - The nine-layer table is RENDERED FROM the stack.json copy, never typed;
//     the served machine files are byte copies of their sources, so the page
//     and the file it describes cannot disagree.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handshakeJson, charterJson } from './mesh.mjs';
import { validate as validateStack } from '../vendor-stack.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const OUT = process.argv[2] ?? join(ROOT, 'site');

export const CONTRACT = 'site-config/1';

/* ─────────────────────────── config ─────────────────────────── */

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isNonEmptyString = (v) => typeof v === 'string' && v.length > 0;

/**
 * The schema/site-config-1.json rules, in code (no JSON-Schema library is
 * allowed here). Returns { valid, errors:[{path,message}] }. A generator that
 * validates its own input cannot render a broken door from a broken config.
 */
export function validateConfig(cfg) {
  const errors = [];
  const e = (path, message) => errors.push({ path, message });
  if (!isObject(cfg)) return { valid: false, errors: [{ path: '$', message: 'config must be an object' }] };

  const REQUIRED = ['property', 'domain', 'title', 'pitch', 'layer', 'contract', 'accent', 'refusals', 'faq', 'links'];
  const KNOWN = new Set(REQUIRED);
  for (const k of REQUIRED) if (!(k in cfg)) e(`$.${k}`, 'is required');
  for (const k of Object.keys(cfg)) if (!KNOWN.has(k) && !k.startsWith('x-')) e(`$.${k}`, 'unknown key (only x- extensions allowed)');

  if ('property' in cfg && !(typeof cfg.property === 'string' && /^[a-z][a-z0-9.-]*$/.test(cfg.property))) e('$.property', 'must be a machine-safe slug');
  if ('domain' in cfg && cfg.domain !== null && !(typeof cfg.domain === 'string' && /^[a-z0-9.-]+$/.test(cfg.domain))) e('$.domain', 'must be a domain or null');
  for (const k of ['title', 'pitch', 'layer']) if (k in cfg && !isNonEmptyString(cfg[k])) e(`$.${k}`, 'must be a non-empty string');
  if ('contract' in cfg && !(typeof cfg.contract === 'string' && /^[a-z0-9-]+\/[0-9.]+$/.test(cfg.contract))) e('$.contract', 'must match <slug>/<version>');
  if ('accent' in cfg && !(typeof cfg.accent === 'string' && /^--flashy-[a-z]+$/.test(cfg.accent))) e('$.accent', 'must be a --flashy-* token name');

  if ('refusals' in cfg) {
    if (!Array.isArray(cfg.refusals) || cfg.refusals.length === 0) e('$.refusals', 'must be a non-empty array');
    else cfg.refusals.forEach((r, i) => {
      if (!isObject(r)) return e(`$.refusals[${i}]`, 'must be an object');
      if (!isNonEmptyString(r.title)) e(`$.refusals[${i}].title`, 'must be a non-empty string');
      if (!isNonEmptyString(r.body)) e(`$.refusals[${i}].body`, 'must be a non-empty string');
      for (const k of Object.keys(r)) if (!['title', 'body'].includes(k) && !k.startsWith('x-')) e(`$.refusals[${i}].${k}`, 'unknown key');
    });
  }
  if ('faq' in cfg) {
    if (!Array.isArray(cfg.faq) || cfg.faq.length === 0) e('$.faq', 'must be a non-empty array');
    else cfg.faq.forEach((f, i) => {
      if (!isObject(f)) return e(`$.faq[${i}]`, 'must be an object');
      if (!isNonEmptyString(f.q)) e(`$.faq[${i}].q`, 'must be a non-empty string');
      if (!isNonEmptyString(f.a)) e(`$.faq[${i}].a`, 'must be a non-empty string');
      for (const k of Object.keys(f)) if (!['q', 'a'].includes(k) && !k.startsWith('x-')) e(`$.faq[${i}].${k}`, 'unknown key');
    });
  }
  if ('links' in cfg) {
    if (!isObject(cfg.links)) e('$.links', 'must be an object');
    else {
      for (const k of ['hub', 'spec', 'repo']) {
        if (!(k in cfg.links)) e(`$.links.${k}`, 'is required');
        else if (!(typeof cfg.links[k] === 'string' && /^https:\/\/[^\s]+$/.test(cfg.links[k]))) e(`$.links.${k}`, 'must be an https:// URL');
      }
      for (const k of Object.keys(cfg.links)) if (!['hub', 'spec', 'repo'].includes(k) && !k.startsWith('x-')) e(`$.links.${k}`, 'unknown key');
    }
  }
  return { valid: errors.length === 0, errors };
}

/* ─────────────────────────── brand ─────────────────────────── */

/** token name -> hex, parsed from the vendored brand/tokens.css. */
export function parseTokens(css) {
  const map = {};
  for (const m of css.matchAll(/(--flashy-[a-z]+)\s*:\s*(#[0-9A-Fa-f]{3,8})\s*;/g)) map[m[1]] = m[2];
  return map;
}

/** The bolt outline geometry, read from the vendored kit — never re-drawn. */
export function boltGeometry(svg) {
  const vb = svg.match(/viewBox="([^"]+)"/);
  const d = svg.match(/<path[^>]*\sd="([^"]+)"/);
  if (!vb || !d) throw new Error('brand bolt SVG is not the shape build-site expects');
  return { viewBox: vb[1], d: d[1] };
}

/* ─────────────────────────── html helpers ─────────────────────────── */

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* ─────────────────────────── the build ─────────────────────────── */

export function build(out = OUT) {
  // ── inputs ──
  const cfg = JSON.parse(readFileSync(join(ROOT, 'site.config.json'), 'utf8'));
  const cfgCheck = validateConfig(cfg);
  if (!cfgCheck.valid) {
    throw new Error(`site.config.json is not a valid ${CONTRACT} document:\n  ${cfgCheck.errors.map((x) => `${x.path} ${x.message}`).join('\n  ')}`);
  }

  const stackBytes = readFileSync(join(ROOT, '.well-known', 'stack.json'));
  const stack = JSON.parse(stackBytes.toString('utf8'));
  const stackCheck = validateStack(stack);
  if (!stackCheck.valid) {
    throw new Error(`.well-known/stack.json is not a valid ${stack.contract ?? 'web4/1'} document:\n  ${stackCheck.errors.map((x) => `${x.path} ${x.code} ${x.message}`).join('\n  ')}`);
  }

  const tokens = parseTokens(readFileSync(join(ROOT, 'brand', 'tokens.css'), 'utf8'));
  const accentHex = tokens[cfg.accent];
  if (!accentHex) throw new Error(`accent "${cfg.accent}" names no token in brand/tokens.css`);
  const bolt = boltGeometry(readFileSync(join(ROOT, 'brand', 'assets', 'bolt-white.svg'), 'utf8'));

  const ring = JSON.parse(readFileSync(join(ROOT, 'estate-ring.json'), 'utf8')).properties;
  const tokensCss = readFileSync(join(ROOT, 'brand', 'tokens.css'), 'utf8');

  const base = cfg.domain ? `https://${cfg.domain}/` : `https://agentelabs.github.io/${cfg.property}/`;
  const canonicalFor = (slug) => base + (slug ? `${slug}/` : '');

  // ── the shared chrome ──
  const boltSvg = (size) =>
    `<svg class="bolt" viewBox="${bolt.viewBox}" width="${size}" height="${Math.round((size * 120) / 100)}" role="img" aria-label="Flashy bolt"><path d="${bolt.d}" fill="var(--accent)"/></svg>`;

  const NAV = [
    { slug: '', label: 'Home' },
    { slug: 'stack', label: 'The stack' },
    { slug: 'principles', label: 'Principles' },
    { slug: 'joining', label: 'Joining' },
    { slug: 'why', label: 'Why' },
    { slug: 'faq', label: 'FAQ' },
  ];
  const linkTo = (prefix, slug) => (slug ? `${prefix}${slug}/` : prefix || './');

  const css = `${tokensCss}
:root{--accent:var(${cfg.accent});--accent-hex:${accentHex};
  --ground:var(--flashy-paper);--ink:var(--flashy-ink);--panel:#EDEDEA;--line:#D8D8D3;--soft:#55554F;}
@media (prefers-color-scheme:dark){:root{--ground:var(--flashy-ink);--ink:var(--flashy-paper);--panel:var(--flashy-ink-panel);--line:#22242700;--line:#242629;--soft:#A6A6A0;}}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--ground);color:var(--ink);
  font:16.5px/1.62 var(--flashy-font-body)}
.wrap{max-width:52rem;margin:0 auto;padding:0 1rem 4rem}
a{color:inherit;text-decoration:underline;text-decoration-color:var(--accent);text-underline-offset:2px}
a:hover{color:var(--accent)}
h1{font-family:var(--flashy-font-display);font-weight:400;text-transform:uppercase;
  letter-spacing:var(--flashy-display-tracking);line-height:var(--flashy-display-leading);
  font-size:clamp(2rem,6vw,3.2rem);margin:0 0 1rem}
h2{font-size:1.35rem;font-weight:700;margin:2.6rem 0 .6rem}
h3{font-size:1.05rem;font-weight:700;margin:1.4rem 0 .3rem}
p{margin:0 0 1rem}
.eyebrow{font-family:var(--flashy-font-mono);font-size:.68rem;letter-spacing:var(--flashy-eyebrow-tracking);
  text-transform:uppercase;color:var(--accent);margin:0 0 .7rem}
.dek{font-size:1.15rem;color:var(--soft);max-width:40rem}
code{font-family:var(--flashy-font-mono);font-size:.85em;background:var(--panel);border:1px solid var(--line);border-radius:4px;padding:.05em .3em}
pre{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:8px;padding:.85rem 1rem;overflow-x:auto;margin:1.1rem 0}
pre code{border:0;background:none;padding:0;font-size:.82rem}
table{border-collapse:collapse;width:100%;font-size:.9rem}
.tw{overflow-x:auto;margin:1.2rem 0}
th{font-family:var(--flashy-font-mono);font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;color:var(--soft);text-align:left;font-weight:500;padding:.45rem .7rem .45rem 0;border-bottom:1px solid var(--line);vertical-align:bottom}
td{padding:.5rem .7rem;border-bottom:1px solid var(--line);vertical-align:top}
td:first-child,th:first-child{padding-left:0}
.num{font-family:var(--flashy-font-mono);color:var(--accent)}
.tag{font-family:var(--flashy-font-mono);font-size:.62rem;letter-spacing:.06em;text-transform:uppercase;border:1px solid var(--line);border-radius:999px;padding:.08rem .45rem;white-space:nowrap;color:var(--soft)}
.rule{border-left:3px solid var(--accent);padding:.1rem 0 .1rem 1rem;margin:1.4rem 0}
.rule h3{margin:0 0 .3rem}
.rule p{margin:0;color:var(--soft);font-size:.96rem}
ol.ladder{list-style:none;margin:1.2rem 0;padding:0;counter-reset:rung}
ol.ladder li{counter-increment:rung;border-top:1px solid var(--line);padding:.9rem 0 .9rem 2.4rem;position:relative}
ol.ladder li::before{content:counter(rung);position:absolute;left:0;top:.9rem;font-family:var(--flashy-font-mono);color:var(--accent);font-size:1.1rem}
ol.ladder .who{font-family:var(--flashy-font-mono);font-size:.65rem;letter-spacing:.08em;text-transform:uppercase;color:var(--soft);display:block}
.pieces{list-style:none;margin:1.2rem 0;padding:0}
.pieces li{border-top:1px solid var(--line);padding:.7rem 0;display:flex;gap:.8rem;align-items:baseline;flex-wrap:wrap}
.pieces .l{font-family:var(--flashy-font-mono);font-size:.65rem;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);min-width:8rem}
.head{border-bottom:1px solid var(--line)}
.head .in{max-width:52rem;margin:0 auto;padding:.8rem 1rem;display:flex;align-items:center;gap:.7rem;flex-wrap:wrap}
.wordmark{display:flex;align-items:center;gap:.5rem;text-decoration:none;color:var(--ink);font-weight:800;letter-spacing:-.01em}
.nav{display:flex;gap:.95rem;flex-wrap:wrap;margin-left:auto}
.nav a{font-family:var(--flashy-font-mono);font-size:.72rem;letter-spacing:.04em;text-transform:uppercase;color:var(--soft);text-decoration:none}
.nav a:hover,.nav a[aria-current]{color:var(--accent)}
.hero{padding:3rem 0 1.5rem}
.foot{border-top:1px solid var(--line);margin-top:3.5rem}
.foot .in{max-width:52rem;margin:0 auto;padding:1.6rem 1rem 2.4rem}
.foot h4{font-family:var(--flashy-font-mono);font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;color:var(--soft);margin:0 0 .5rem;font-weight:500}
.ring{display:flex;flex-wrap:wrap;gap:.35rem .9rem;margin:0 0 1.2rem}
.ring a{font-size:.8rem;color:var(--soft);text-decoration:none}
.ring a:hover{color:var(--accent)}
.foot-line{font-family:var(--flashy-font-mono);font-size:.68rem;color:var(--soft);line-height:1.8;border-top:1px solid var(--line);padding-top:1rem}`;

  function shell({ slug, title, desc, body, jsonld }) {
    const prefix = slug ? '../' : '';
    const canonical = canonicalFor(slug);
    const nav = NAV.map((n) =>
      `<a href="${linkTo(prefix, n.slug)}"${n.slug === slug ? ' aria-current="page"' : ''}>${esc(n.label)}</a>`,
    ).join('\n      ');
    const ringLinks = ring
      .map((r) => `<a href="https://${esc(r.domain)}" rel="noopener">${esc(r.name)}</a>`)
      .join('\n');
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Web 4">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${base}og-card.svg">
<meta name="twitter:card" content="summary_large_image">
<style>${css}</style>${jsonld ? `\n<script type="application/ld+json">${jsonld}</script>` : ''}
</head>
<body>
<header class="head"><div class="in">
  <a class="wordmark" href="${linkTo(prefix, '')}">${boltSvg(22)}<span>Web 4</span></a>
  <nav class="nav" aria-label="Primary">
      ${nav}
  </nav>
</div></header>
<main><div class="wrap">
${body}
</div></main>
<footer class="foot"><div class="in">
<h4>The estate</h4>
<div class="ring">
${ringLinks}
</div>
<p class="foot-line">${esc(cfg.contract)} · a Gord &amp; Flashy estate stack · the machine twin is
<a href="${esc(cfg.links.spec)}" rel="noopener">stack.json</a>, served at
<a href="${prefix}.well-known/stack.json">/.well-known/stack.json</a> ·
<a href="${linkTo(prefix, 'faq')}">FAQ</a> · <a href="${prefix}llms.txt">llms.txt</a><br>
No repository on the map is public or launched today; a status is a measurement, not a promise.
This site makes zero external requests. Licence: Apache-2.0, holder Flashy Labs, per the estate register in flashyos.</p>
</div></footer>
</body>
</html>
`;
  }

  /* ── page bodies ── */

  // A repository GitHub reports as private is linked — the map is of what
  // exists — and SAID to be private beside the link, read from the same
  // stack.json row, so a reader is not sent to a 404 without warning.
  const privateTag = (r) => (r.visibility === 'private' ? ' <span class="tag">private</span>' : '');
  const repoLink = (r) => `<a href="${esc(r.url)}" rel="noopener">${esc(r.name)}</a>${privateTag(r)}`;

  const layerRows = stack.layers
    .map((L, i) => {
      const repos = L.repos
        .map((r) => (r.url ? repoLink(r) : `${esc(r.name)} <span class="tag">planned</span>`))
        .join(', ');
      const contracts = [...new Set(L.repos.map((r) => r.contract).filter(Boolean))].join(', ') || '—';
      return `<tr><td class="num">${i + 1}</td><td>${esc(cap(L.name))}</td><td>${esc(L.question)}</td><td>${repos}</td><td><code>${esc(contracts)}</code></td></tr>`;
    })
    .join('\n');

  const indexBody = (pfx) => `
<div class="hero">
  ${boltSvg(56)}
  <p class="eyebrow">${esc(cfg.contract)} · ${esc(cfg.layer)}</p>
  <h1>${esc(cfg.title)}</h1>
  <p class="dek">${esc(cfg.pitch)}</p>
</div>

<p>This repository is the human front door to that stack — for anyone who needs the whole thing
legible in ninety seconds. It holds no protocol code: the map, the
<a href="${linkTo(pfx, 'principles')}">principles</a>, and the rule for
<a href="${linkTo(pfx, 'joining')}">how a protocol joins</a>. The machine-readable twin is
<a href="${esc(cfg.links.spec)}" rel="noopener">stack.json</a>, served at
<a href="${pfx}.well-known/stack.json">/.well-known/stack.json</a>; this page renders the human table
and never duplicates that file's data.</p>

<h2>The stack</h2>
<p>Nine layers, each answering one question, composed so a single query travels the whole stack.
The standalone reference is <a href="${linkTo(pfx, 'stack')}">the stack page</a>; the table below is
rendered from the <a href="${pfx}.well-known/stack.json">stack.json</a> copy this repository serves —
the figures are never typed into this page.</p>
<div class="tw"><table>
<thead><tr><th>#</th><th>Layer</th><th>Question</th><th>Repos</th><th>Contract</th></tr></thead>
<tbody>
${layerRows}
</tbody>
</table></div>
<p><strong>Principle:</strong> ${esc(stack.principle)}</p>

<h2>Where to go next</h2>
<ul>
<li><a href="${linkTo(pfx, 'stack')}">The stack</a> — every layer, its question, its repos and its status.</li>
<li><a href="${linkTo(pfx, 'principles')}">Principles</a> — the five refusals the estate builds by.</li>
<li><a href="${linkTo(pfx, 'joining')}">Joining</a> — the five-rung ladder a protocol climbs to become a standard.</li>
<li><a href="${linkTo(pfx, 'why')}">Why we built it</a> — the argument, layer by layer.</li>
<li><a href="${linkTo(pfx, 'faq')}">FAQ</a> — six honest answers.</li>
</ul>`;

  const stackDetail = stack.layers
    .map((L, i) => {
      const repos = L.repos
        .map((r) => {
          const name = r.url ? repoLink(r) : esc(r.name);
          const bits = [r.kind, r.status, r.contract].filter(Boolean).map(esc).join(' · ');
          return `<tr><td>${name}</td><td>${bits}</td></tr>`;
        })
        .join('\n');
      return `<h3><span class="num">${i + 1}</span> ${esc(cap(L.name))} — <span style="font-weight:400">${esc(L.question)}</span></h3>
<div class="tw"><table><tbody>
${repos}
</tbody></table></div>`;
    })
    .join('\n');

  const spanning = (list, heading) =>
    `<h3>${esc(heading)}</h3><div class="tw"><table><tbody>
${list.map((r) => `<tr><td>${r.url ? repoLink(r) : esc(r.name)}</td><td>${[r.kind, r.status].filter(Boolean).map(esc).join(' · ')}</td></tr>`).join('\n')}
</tbody></table></div>`;

  const stackBody = (pfx) => `
<div class="hero">
  <p class="eyebrow">${esc(stack.contract)} · measured ${esc(stack.generated)}</p>
  <h1>The stack</h1>
  <p class="dek">Nine layers, one question each, with the repositories that own the answer and an
  honest status per repository. Rendered from the served
  <a href="${pfx}.well-known/stack.json">stack.json</a>; where the two disagree, the file is the truth
  and this page is stale.</p>
</div>
<p><strong>Principle:</strong> ${esc(stack.principle)}</p>
${stackDetail}
${spanning(stack.tooling, 'Spanning the layers')}
${spanning(stack.teaching, 'Teaching')}
<p>Statuses are per-repository and honest: <code>draft</code> (a spec being written against),
<code>private</code> (a repository that exists and is not public), <code>private-intended</code>
(meant to stay private once it is a product) and <code>planned</code> (named, not yet a repository).
A repository tagged <span class="tag">private</span> is one GitHub reported as not public on the
measured date: its link is kept, because the map is of what exists, and it resolves only for someone
with access. No repository is public or launched today.</p>`;

  const principlesBody = (pfx) => `
<div class="hero">
  <p class="eyebrow">Doctrine, not aspiration</p>
  <h1>Principles</h1>
  <p class="dek">Five principles govern what the estate builds and what it refuses to build. Each is
  enforced somewhere by a test, a gate, or the absence of a parameter — phrased as a refusal,
  because a guideline is a sentence an agent can be prompted past and a missing parameter is not.</p>
</div>
${cfg.refusals.map((r, i) => `<div class="rule"><h3><span class="num">${i + 1}</span> ${esc(r.title)}</h3><p>${esc(r.body)}</p></div>`).join('\n')}`;

  const LADDER = [
    { who: 'Rung 1 — the spec', body: 'A written contract with a versioned id in the estate’s form (<code>name/major</code>), stating what a conforming document contains, what it refuses, and what a reader may conclude. The invariant is phrased as something a caller has no way to do.' },
    { who: 'Rung 2 — the dependency-free checker', body: 'A checker beside the spec that imports node: builtins only, installs nothing, and refuses what the spec refuses. A check that needs an install is a check that can quietly not run.' },
    { who: 'Rung 3 — wired into mesh-lint and conformance-kit', body: 'The checker is registered so one run exercises this protocol alongside every other, and the document it hands the layer above is linted at the boundary it crosses. This is the rung where a repo becomes part of the stack. The status is still draft.' },
    { who: 'Rung 4 — one independent adopter', body: 'Somebody outside the estate conforms, and is named; their domain serves the surface and conformance-kit reads it. This is the gate on the word "standard" — a spec repo is not made public before it, because a protocol only its author speaks is an internal format with a version number.' },
    { who: 'Rung 5 — the business', body: 'An accountable owner, a licence entry, a private implementation, and a status on the map that is no longer draft. The launch order is fixed: the estate register records the spec repo as open-licensed, then the repository goes public.' },
  ];

  const joiningBody = (pfx) => `
<div class="hero">
  <p class="eyebrow">Spec → checker → wired in → one adopter → business</p>
  <h1>How a protocol joins</h1>
  <p class="dek">A protocol joins the stack by climbing a ladder with five rungs, in order, and it is
  called a business only from the top one. Each rung is a thing that exists and can be checked, never
  a milestone somebody declares.</p>
</div>
<ol class="ladder">
${LADDER.map((r) => `<li><span class="who">${esc(r.who)}</span><p>${r.body}</p></li>`).join('\n')}
</ol>
<h2>What the ladder refuses</h2>
<div class="rule"><h3>Skipping to the product</h3><p>A service with no spec is an agent, and the estate does not own agents.</p></div>
<div class="rule"><h3>Manufacturing the adopter</h3><p>An estate property, a sibling brand, or a repository created to conform does not count. The adopter is independent or the rung is not climbed.</p></div>
<div class="rule"><h3>Calling draft anything else</h3><p>Until rung 4 the status is draft, whatever the code does. "An adopter is close" is not a measurement.</p></div>
<p>Every contract on the map is at rung 1, 2 or 3 today, or is planned and not yet at rung 1. None
has reached rung 4 — that is the honest state, and the map says so rather than rounding up.</p>`;

  const whyBody = (pfx) => `
<div class="hero">
  <p class="eyebrow">The argument, layer by layer</p>
  <h1>Why we built it</h1>
  <p class="dek">Agents are starting to act on organisations’ behalf, and the first questions one
  asks about a counterparty — who are you, what exists, who can, should I, how do I reach you, how
  are you represented, how do you operate, how does value move, what happened — have no
  machine-readable answer anywhere on the web. Each layer is the answer to one of them.</p>
</div>
<p>The founder’s case for each layer is being written. The pieces below are <strong>planned</strong>
— named here, and linked only once each is published, because a link to something that does not
exist yet is the one dishonest thing a map of honest statuses cannot carry.</p>
<ul class="pieces">
${stack.layers.map((L) => `<li><span class="l">${esc(cap(L.name))}</span><span>Why ${esc(cap(L.name))}: ${esc(L.question)}</span> <span class="tag">planned</span></li>`).join('\n')}
</ul>
<p>Until then, the depth lives in the map itself: <a href="${linkTo(pfx, 'stack')}">the stack</a>, the
<a href="${linkTo(pfx, 'principles')}">principles</a>, and the
<a href="${esc(cfg.links.repo)}" rel="noopener">repository</a>’s architecture notes.</p>`;

  const faqJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: cfg.faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  });

  const faqBody = (pfx) => `
<div class="hero">
  <p class="eyebrow">Six honest answers</p>
  <h1>Frequently asked</h1>
  <p class="dek">The questions a stranger asks first, answered in a couple of sentences each. This
  page carries FAQPage structured data so an agent reads the same answers a person does.</p>
</div>
${cfg.faq.map((f) => `<div class="rule"><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`).join('\n')}`;

  /* ── og card (bolt + title), standalone SVG: resolve the accent to a hex ── */
  const ogCard = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="${esc(cfg.title)}">
<rect width="1200" height="630" fill="${tokens['--flashy-ink']}"/>
<g transform="translate(96 150) scale(2.1)"><path d="${bolt.d}" fill="${accentHex}"/></g>
<text x="360" y="300" font-family="Archivo Black, Arial Black, sans-serif" font-size="96" fill="${tokens['--flashy-paper']}">Web 4</text>
<text x="360" y="372" font-family="JetBrains Mono, monospace" font-size="34" fill="${accentHex}">${esc(cfg.contract)}</text>
<text x="360" y="430" font-family="Plus Jakarta Sans, sans-serif" font-size="30" fill="${tokens['--flashy-paper']}">The agentic internet, as open protocols.</text>
</svg>
`;

  /* ── emit ── */
  rmSync(out, { recursive: true, force: true });
  const put = (rel, body) => {
    const full = join(out, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
  };

  const PAGES = [
    { slug: '', title: cfg.title, desc: cfg.pitch, body: indexBody },
    { slug: 'stack', title: `The stack — Web 4`, desc: 'Nine layers, one question each, with the repositories that own the answer and an honest status per repository. Rendered from the served stack.json.', body: stackBody },
    { slug: 'principles', title: `Principles — Web 4`, desc: 'Five principles the estate builds by, each phrased as a refusal and enforced by a test, a gate, or the absence of a parameter.', body: principlesBody },
    { slug: 'joining', title: `How a protocol joins — Web 4`, desc: 'The five-rung ladder a protocol climbs to become a standard: spec, dependency-free checker, wired into mesh-lint and conformance-kit, one independent adopter, business.', body: joiningBody },
    { slug: 'why', title: `Why we built it — Web 4`, desc: 'The argument for the stack, layer by layer. The founder pieces are planned and named here until they are published.', body: whyBody },
    { slug: 'faq', title: `FAQ — Web 4`, desc: 'What is Web 4, is it the AAO Stack, which parts are live, why the split of open spec and private product, can an agent join without an account, and who defines the terms.', body: faqBody, jsonld: faqJsonLd },
  ];

  const written = [];
  for (const p of PAGES) {
    const rel = p.slug ? join(p.slug, 'index.html') : 'index.html';
    const prefix = p.slug ? '../' : '';
    put(rel, shell({ ...p, body: p.body(prefix) }));
    written.push(rel);
  }

  // og card + robots
  put('og-card.svg', ogCard);
  put('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${base}sitemap.xml\n`);
  written.push('og-card.svg', 'robots.txt');

  // sitemap
  const urls = PAGES.map((p) => canonicalFor(p.slug));
  put('sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
  written.push('sitemap.xml');

  // llms.txt — absolute URLs, machines resolve nothing relative
  put('llms.txt', `# Web 4 — ${cfg.contract}, the agentic internet as open protocols
# ${cfg.pitch}
# The human front door to the stack: the map, the principles, and how a protocol joins.
# No repository on the map is public or launched today; this site makes zero external requests.

## Pages
- ${canonicalFor('')} — the pitch and the nine-layer table, rendered from stack.json.
- ${canonicalFor('stack')} — every layer, its question, its repositories and its status.
- ${canonicalFor('principles')} — the five refusals the estate builds by.
- ${canonicalFor('joining')} — the five-rung ladder a protocol climbs to become a standard.
- ${canonicalFor('why')} — the argument for the stack, layer by layer.
- ${canonicalFor('faq')} — six honest answers, with FAQPage structured data.

## Machine surfaces (byte copies of their sources)
- ${base}.well-known/stack.json — the ${stack.contract} machine twin of the map.
- ${base}.well-known/flashyos.json — the flashyos/1 mesh handshake, derived from the AAO charter.
- ${base}.well-known/flashyos-charter.json — the AAO charter this org is provisioned from.
- ${base}.well-known/directory.json — this org's directory/1 node.

The machine twin is maintained at ${cfg.links.spec}; this repository is ${cfg.links.repo}.
`);
  written.push('llms.txt');

  // ── machine surfaces ──
  // stack.json, byte-for-byte: the page rendered its table from THIS file.
  put(join('.well-known', 'stack.json'), stackBytes);
  written.push('.well-known/stack.json');

  // The mesh surfaces: the flashyos/1 handshake and the AAO charter it derives
  // from, plus this org's directory/1 node — all from one source
  // (flashyos.roles.json), so they cannot disagree. "Committed is not served":
  // the authoritative check is `npx @flashyos/conformance <domain> --level 2`.
  put(join('.well-known', 'flashyos.json'), handshakeJson());
  put(join('.well-known', 'flashyos-charter.json'), charterJson());
  written.push('.well-known/flashyos.json', '.well-known/flashyos-charter.json');

  // The directory/1 fragment, already committed and complete, served at the
  // projection name the estate merge reads. Byte copy of the committed file.
  const dir = join(ROOT, 'directory.fragment.json');
  if (existsSync(dir)) {
    put(join('.well-known', 'directory.json'), readFileSync(dir));
    written.push('.well-known/directory.json');
  }

  return written;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const written = build();
  console.log(`web4: wrote ${written.length} files to ${OUT}`);
}
