#!/usr/bin/env node
// The generator. Renders all of site/ from the inputs beside it and nothing else:
// site.config.json, nav.json, canon.lock.json, flashyos.roles.json, the two
// record fragments, tally.json, the stack.json copy, content/*.json and brand/.
// It reads no network and uses no clock, so a rebuild of the same tree is
// byte-identical (test/build.test.mjs holds that). Nothing under site/ is
// hand-edited. Dependency-free: node: builtins only.
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCharter, validateCharter, handshakeJson, charterJson } from './mesh.mjs';
import { pages } from './pages.mjs';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const OUT = join(ROOT, 'site');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const json = (p) => JSON.parse(read(p));

export function loadInputs() {
  const cfg = json('site.config.json');
  const nav = json('nav.json');
  const lock = json('canon.lock.json');
  const charter = validateCharter(loadCharter(join(ROOT, 'flashyos.roles.json')));
  const directory = json('directory.fragment.json');
  const ritual = json('ritual.fragment.json');
  const tally = json('tally.json');
  const stack = json('.well-known/stack.json');
  const answers = json('content/answers.json').answers;
  const glossary = json('content/glossary.json').entries;
  const chapters = json('content/chapters.json');
  const reading = json('content/reading.json');
  const tokens = read('brand/tokens.css');
  return { cfg, nav, lock, charter, directory, ritual, tally, stack, answers, glossary, chapters, reading, tokens };
}

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** The term map, as the lock carries it. */
export function terms(lock) { return lock.facts['vocabulary.terms'].terms; }
export function termLink(lock, key) {
  const t = terms(lock).find((x) => x.key === key);
  if (!t) throw new Error(`term "${key}" is not in the lock`);
  return `<a href="${esc(t.canonical)}" rel="noopener">${esc(t.anchor)}</a>`;
}
/** Replace {{term-key}} in prose with the owner's link. */
export function cite(lock, s) { return s.replace(/\{\{([a-z0-9-]+)\}\}/g, (_, k) => termLink(lock, k)); }

export function provenance(cfg, lock) {
  const m = lock.facts['mesh.provenance'].value;
  const tpl = m.lines[cfg.kind];
  const [a, rest] = tpl.split('{parent}');
  const [b, c] = (rest ?? '').split('{network}');
  const parent = `<a href="${esc(cfg.parent.url)}" rel="noopener">${esc(cfg.parent.name)}</a>`;
  const net = `<a href="${esc(m.network.url)}" rel="noopener">${esc(m.network.anchor)}</a>`;
  const line = rest === undefined ? esc(tpl) : esc(a) + parent + (c === undefined ? esc(b) : esc(b) + net + esc(c));
  return `<div class="prov" role="note" aria-label="Provenance"><span class="dot" aria-hidden="true"></span><span>${line}</span><span class="sep" aria-hidden="true">·</span><a href="${esc(m.roadmap.url)}" rel="noopener">${esc(m.roadmap.anchor)}</a></div>`;
}
export function provenanceText(cfg, lock) {
  const m = lock.facts['mesh.provenance'].value;
  return m.lines[cfg.kind].replace('{parent}', cfg.parent.name).replace('{network}', m.network.name);
}

export function resolveHref(nav, lock, href) {
  if (href === 'canon:open.door') return lock.facts['open.door'].value.url;
  return href;
}
export function rowLabel(nav, lock, row) {
  if (row.href === 'canon:open.door') return lock.facts['open.door'].value.anchor;
  return row.label;
}

export function header(inputs) {
  const { cfg, nav, lock } = inputs;
  const doors = nav.doors.map((d) => `
      <details class="door"><summary>${esc(d.label)}</summary>
        <div class="menu"><p class="aud">${esc(d.audience)}</p><ul>
${d.rows.map((r) => `          <li><a href="${esc(resolveHref(nav, lock, r.href))}"${r.external ? ' rel="noopener"' : ''}>${esc(rowLabel(nav, lock, r))}${r.external ? ' <span aria-hidden="true">↗</span>' : ''}</a></li>`).join('\n')}
        </ul></div>
      </details>`).join('');
  return `<header class="top"><a class="skip" href="#main">Skip to content</a>
    <a class="brand" href="/" aria-label="${esc(cfg.name)}, home">${mark(28)}<span class="word">WEB4</span><span class="loz">GLOBAL</span></a>
    <nav class="doors" aria-label="Primary">${doors}
    </nav>
    <a class="cta" href="${esc(nav.cta.href)}">${esc(nav.cta.label)} <span aria-hidden="true">→</span></a>
  </header>`;
}

export function mark(h = 24, cls = '') {
  return `<svg class="mark ${cls}" width="${Math.round(h * 100 / 120)}" height="${h}" viewBox="0 0 100 120" aria-hidden="true"><path d="M70 12 L22 80 H88 M70 12 V108" fill="none" stroke="currentColor" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><circle cx="70" cy="12" r="8" fill="currentColor"/><circle cx="22" cy="80" r="8" fill="currentColor"/><circle cx="88" cy="80" r="8" fill="currentColor"/><circle cx="70" cy="108" r="8" fill="currentColor"/></svg>`;
}

export function footer(inputs) {
  const { cfg, nav, lock } = inputs;
  const cols = nav.doors.map((d) => `<div class="col"><h2>${esc(d.label)}</h2><ul>${d.rows.map((r) => `<li><a href="${esc(resolveHref(nav, lock, r.href))}"${r.external ? ' rel="noopener"' : ''}>${esc(rowLabel(nav, lock, r))}</a></li>`).join('')}</ul></div>`).join('');
  const machine = nav.machine.map((m) => `<a href="${esc(m.path)}" title="${esc(m.what)}">${esc(m.path)}</a>`).join('<span aria-hidden="true"> · </span>');
  const open = lock.facts['open.door'].value;
  return `<footer class="foot">
    <div class="cols">${cols}</div>
    <div class="band machine" aria-label="Machine surfaces"><span class="eyebrow">Machine surfaces</span><p>${machine}<span aria-hidden="true"> · </span><a href="${esc(open.url)}" rel="noopener">${esc(open.anchor)} ↗</a></p></div>
    <div class="band stamp"><p>${esc(cfg.name)} is a ${esc(cfg.holder)} property. ${esc(provenanceText(cfg, lock))}. ${termLink(lock, 'web-4')} is defined by GDA Group; this site links the definition and never restates it. Apache-2.0 on the generator and the kit; <a href="${esc(cfg.repository)}" rel="noopener">source</a>.</p><p class="mono">${esc(cfg.statusLine)}</p></div>
  </footer>`;
}

export function shell(inputs, page) {
  const { cfg, lock } = inputs;
  const base = `https://${cfg.domain}`;
  const url = base + page.path;
  const title = page.path === '/' ? cfg.title : `${page.title} — ${cfg.name}`;
  const ld = [
    { '@context': 'https://schema.org', '@type': 'WebPage', '@id': url, url, name: title, description: page.desc, isPartOf: { '@type': 'WebSite', '@id': `${base}/#website`, url: base, name: cfg.name }, publisher: { '@id': `${base}/#org` } },
    ...(page.jsonld ?? []),
  ];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(page.desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="${esc(cfg.name)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(page.desc)}"><meta property="og:url" content="${esc(url)}"><meta property="og:image" content="${base}/assets/og-card.svg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="text/plain" href="/llms.txt" title="llms.txt">
<link rel="stylesheet" href="/assets/site.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body class="${page.path === '/' ? 'home' : ''}">
${provenance(cfg, lock)}
${header(inputs)}
<main id="main">
${page.body}
</main>
${footer(inputs)}
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
export function css(tokens) {
  return `${tokens}
@font-face{font-family:'Unbounded';font-weight:700;font-display:swap;src:url(/assets/fonts/unbounded-700-latin.woff2) format('woff2')}
@font-face{font-family:'Plus Jakarta Sans';font-weight:400;font-display:swap;src:url(/assets/fonts/jakarta-400-latin.woff2) format('woff2')}
@font-face{font-family:'Plus Jakarta Sans';font-weight:500;font-display:swap;src:url(/assets/fonts/jakarta-500-latin.woff2) format('woff2')}
@font-face{font-family:'Plus Jakarta Sans';font-weight:600;font-display:swap;src:url(/assets/fonts/jakarta-600-latin.woff2) format('woff2')}
@font-face{font-family:'JetBrains Mono';font-weight:400;font-display:swap;src:url(/assets/fonts/jbmono-400-latin.woff2) format('woff2')}
@font-face{font-family:'JetBrains Mono';font-weight:500;font-display:swap;src:url(/assets/fonts/jbmono-500-latin.woff2) format('woff2')}
:root{--bg:var(--w4-paper);--bg2:var(--w4-paper-panel);--fg:var(--w4-ink);--soft:#5C5C58;--line:var(--w4-line-paper);--acc:var(--w4-flare-deep);--acc-ink:var(--w4-flare);--max:72rem;--measure:66ch}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:var(--w4-ink);--bg2:var(--w4-ink-panel);--fg:var(--w4-paper);--soft:var(--w4-soft);--line:var(--w4-line);--acc:var(--w4-flare)}}
:root[data-theme="dark"]{--bg:var(--w4-ink);--bg2:var(--w4-ink-panel);--fg:var(--w4-paper);--soft:var(--w4-soft);--line:var(--w4-line);--acc:var(--w4-flare)}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--fg);font:400 17px/1.55 var(--w4-font-body);padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right)}
a{color:inherit;text-decoration-color:var(--acc);text-decoration-thickness:1px;text-underline-offset:.15em}a:hover{color:var(--acc)}
:focus-visible{outline:2px solid var(--acc);outline-offset:3px}
h1,h2,h3{text-wrap:balance;margin:0 0 .5rem}
h1{font:700 clamp(2.4rem,6vw,4.5rem)/var(--w4-display-leading) var(--w4-font-display);letter-spacing:var(--w4-display-tracking);text-transform:uppercase}
h2{font:600 1.5rem/1.2 var(--w4-font-body);letter-spacing:-.01em}
h3{font:600 1.1rem/1.3 var(--w4-font-body)}
p,li{max-width:var(--measure)}
.eyebrow,.mono,code,kbd,pre{font-family:var(--w4-font-mono)}
.eyebrow{font-size:.75rem;letter-spacing:var(--w4-eyebrow-tracking);text-transform:uppercase;color:var(--soft);display:block;margin-bottom:.75rem}
.mono{font-size:.85rem;color:var(--soft)}
pre{background:var(--bg2);border:1px solid var(--line);padding:1rem 1.25rem;overflow-x:auto;font-size:.9rem;line-height:1.5;max-width:100%}
code{font-size:.92em;background:var(--bg2);padding:.1em .35em;border-radius:3px}pre code{background:none;padding:0}
.wrap{max-width:var(--max);margin:0 auto;padding:0 16px}
.skip{position:absolute;left:-999px;top:0}.skip:focus{left:16px;top:8px;background:var(--bg);padding:.5rem 1rem;z-index:10}
/* provenance bar */
.prov{display:flex;gap:.6rem;align-items:center;flex-wrap:wrap;font:500 .78rem/1.3 var(--w4-font-mono);letter-spacing:.02em;padding:.45rem 16px;background:var(--bg2);border-bottom:1px solid var(--line);color:var(--soft)}
.prov a{color:var(--fg)}.prov .dot{width:.5rem;height:.5rem;border-radius:50%;background:var(--acc);display:inline-block}.prov .sep{opacity:.6}
/* header */
.top{display:flex;align-items:center;gap:1rem;padding:.9rem 16px;border-bottom:1px solid var(--line);position:relative;flex-wrap:wrap}
.brand{display:inline-flex;align-items:center;gap:.5rem;text-decoration:none;color:var(--fg)}
.brand .mark{color:var(--acc)}
.brand .word{font:700 1.05rem/1 var(--w4-font-display);letter-spacing:-.02em}
.brand .loz{font:700 .62rem/1 var(--w4-font-display);letter-spacing:.06em;background:var(--acc);color:var(--bg);padding:.35em .6em;border-radius:999px}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .brand .loz{color:var(--w4-ink)}}
:root[data-theme="dark"] .brand .loz{color:var(--w4-ink)}
.doors{display:flex;gap:.25rem;flex-wrap:wrap;margin-left:auto}
.door{position:relative}.door summary{list-style:none;cursor:pointer;padding:.45rem .7rem;border-radius:6px;font-weight:500;font-size:.95rem}
.door summary::-webkit-details-marker{display:none}.door summary::after{content:" ▾";font-size:.7em;color:var(--soft)}
.door[open] summary{background:var(--bg2)}
.door .menu{position:absolute;top:100%;left:0;min-width:17rem;background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:.9rem 1rem;z-index:5;box-shadow:0 12px 32px rgba(0,0,0,.12)}
.door .aud{margin:0 0 .5rem;font:500 .72rem/1.3 var(--w4-font-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--soft)}
.door ul{list-style:none;margin:0;padding:0}.door li a{display:block;padding:.3rem 0;text-decoration:none;font-size:.95rem}.door li a:hover{color:var(--acc)}
.cta{text-decoration:none;font-weight:600;font-size:.92rem;padding:.5rem .9rem;border:1.5px solid var(--acc);border-radius:999px;color:var(--fg);white-space:nowrap}
.cta:hover{background:var(--acc);color:var(--bg)}
@media (max-width:880px){.doors{order:3;width:100%;margin-left:0}.door .menu{position:static;box-shadow:none;border:0;border-left:2px solid var(--line);border-radius:0;padding:.4rem 0 .4rem 1rem}}
/* content */
main{display:block}
.hero{padding:clamp(3rem,8vw,6rem) 16px 2.5rem;max-width:var(--max);margin:0 auto}
.hero p.dek{font-size:1.25rem;max-width:40rem;margin:1.25rem 0 0}
.hero .status{margin-top:2rem;display:inline-flex;gap:.6rem;align-items:center;border:1px solid var(--line);border-radius:999px;padding:.4rem .9rem .4rem .6rem;font:500 .78rem/1.3 var(--w4-font-mono)}
.hero .status b{color:var(--acc);font-weight:500}
.hero .four{width:min(100%,220px);color:var(--acc);display:block;margin:0 0 2rem}
.hero .four path{stroke-dasharray:260;stroke-dashoffset:260;animation:draw var(--w4-connect-duration) var(--w4-connect-easing) .25s forwards}
.hero .four circle{opacity:0;animation:pop 160ms ease-out forwards}
.hero .four circle:nth-of-type(2){animation-delay:60ms}.hero .four circle:nth-of-type(3){animation-delay:120ms}.hero .four circle:nth-of-type(4){animation-delay:180ms}
@keyframes draw{to{stroke-dashoffset:0}}@keyframes pop{to{opacity:1}}
@media (prefers-reduced-motion:reduce){.hero .four path,.hero .four circle{animation:none;stroke-dashoffset:0;opacity:1}}
section.block{padding:2.75rem 16px;border-top:1px solid var(--line)}
section.block>div{max-width:var(--max);margin:0 auto}
.grid{display:grid;gap:1.25rem;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))}
.card{border:1px solid var(--line);border-radius:10px;padding:1.25rem;background:var(--bg)}
.card h3{margin-bottom:.4rem}.card p{font-size:.95rem;color:var(--soft);margin:0}.card a.more{display:inline-block;margin-top:.75rem;font-weight:500;font-size:.92rem}
.page{max-width:var(--max);margin:0 auto;padding:2.5rem 16px 3rem}
.page .lede{font-size:1.2rem;max-width:40rem}
.page h2{margin-top:2.25rem}
table{border-collapse:collapse;width:100%;font-size:.95rem}th,td{text-align:left;padding:.6rem .75rem;border-bottom:1px solid var(--line);vertical-align:top}th{font:500 .72rem/1.3 var(--w4-font-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--soft)}
.tablewrap{overflow-x:auto}
.num{font-variant-numeric:tabular-nums}
.empty{border:1px dashed var(--line);border-radius:10px;padding:1.25rem 1.5rem;color:var(--soft);max-width:var(--measure)}
.empty b{color:var(--fg);font-weight:600}
.defn{font-size:1.25rem;font-weight:500;border-left:3px solid var(--acc);padding:.25rem 0 .25rem 1.1rem;margin:1.5rem 0;max-width:40rem}
.next{display:inline-block;margin-top:2rem;font-weight:600;border:1.5px solid var(--acc);border-radius:999px;padding:.55rem 1.1rem;text-decoration:none}
.next:hover{background:var(--acc);color:var(--bg)}
.swatches{display:flex;gap:.75rem;flex-wrap:wrap}.sw{width:7.5rem;border:1px solid var(--line);border-radius:8px;overflow:hidden;font-size:.75rem}.sw div{height:3.5rem}.sw p{margin:0;padding:.4rem .5rem;font-family:var(--w4-font-mono)}
.steps{counter-reset:s;list-style:none;padding:0;margin:0}.steps li{counter-increment:s;padding:.9rem 0 .9rem 3rem;position:relative;border-top:1px solid var(--line)}.steps li::before{content:counter(s,decimal-leading-zero);position:absolute;left:0;top:1rem;font:500 .8rem/1 var(--w4-font-mono);color:var(--acc)}
.lockup{display:block;max-width:34rem;width:100%;border:1px solid var(--line);border-radius:10px}
/* footer */
.foot{border-top:1px solid var(--line);margin-top:3rem}
.foot .cols{max-width:var(--max);margin:0 auto;padding:2.5rem 16px;display:grid;gap:2rem 1.5rem;grid-template-columns:repeat(auto-fit,minmax(10rem,1fr))}
.foot .col h2{font:500 .72rem/1.3 var(--w4-font-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--soft);margin-bottom:.6rem}
.foot .col ul{list-style:none;margin:0;padding:0}.foot .col li{font-size:.92rem;padding:.2rem 0}.foot .col a{text-decoration:none}.foot .col a:hover{text-decoration:underline}
.band{border-top:1px solid var(--line)}.band>*{max-width:var(--max);margin:0 auto;padding:1.1rem 16px}
.band.machine p{font-family:var(--w4-font-mono);font-size:.78rem;line-height:1.9;max-width:none;margin:0;word-break:break-word}
.band.machine .eyebrow{padding:1.1rem 16px 0;margin:0 auto}
.band.stamp p{font-size:.85rem;color:var(--soft);max-width:none;margin:0}
.band.stamp .mono{margin-top:.5rem;font-size:.78rem}
`;
}

// ---------------------------------------------------------------------------
function walk(dir, acc = []) {
  for (const n of readdirSync(dir)) { const p = join(dir, n); statSync(p).isDirectory() ? walk(p, acc) : acc.push(p); }
  return acc;
}

export function build(out = OUT) {
  const inputs = loadInputs();
  const { cfg, nav, lock, charter, directory, ritual, tally, stack, answers, tokens } = inputs;
  const base = `https://${cfg.domain}`;
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const written = [];
  const put = (rel, bytes) => { const p = join(out, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, bytes); written.push(rel); };

  // pages
  const all = pages(inputs);
  const seen = new Set();
  for (const page of all) {
    if (seen.has(page.path)) throw new Error(`two pages at ${page.path}`);
    seen.add(page.path);
    const rel = page.path === '/404' ? '404.html' : join(page.path.replace(/^\//, ''), 'index.html');
    put(rel, shell(inputs, page));
  }

  // assets
  put('assets/site.css', css(tokens));
  for (const f of ['favicon.svg', 'og-card.svg', 'lockup-ink.svg', 'lockup-paper.svg', 'mark-ink.svg', 'mark-paper.svg', 'mark-flare.svg']) put(`assets/${f}`, readFileSync(join(ROOT, 'brand', 'assets', f)));
  for (const f of readdirSync(join(ROOT, 'brand', 'fonts'))) put(`assets/fonts/${f}`, readFileSync(join(ROOT, 'brand', 'fonts', f)));
  put('brand/tokens.css', tokens);
  put('brand/MANIFEST.sha256', read('brand/MANIFEST.sha256'));
  put('brand/USAGE.md', read('brand/USAGE.md'));

  // machine surfaces — every path nav.machine lists is written here
  put('.well-known/flashyos.json', handshakeJson(charter));
  put('.well-known/flashyos-charter.json', charterJson(charter));
  put('.well-known/directory.json', JSON.stringify(directory, null, 2) + '\n');
  put('.well-known/ritual.json', JSON.stringify(ritual, null, 2) + '\n');
  put('.well-known/stack.json', readFileSync(join(ROOT, '.well-known', 'stack.json')));
  put('tally.json', JSON.stringify(tally, null, 2) + '\n');
  put('web4global.json', JSON.stringify(entity(inputs), null, 2) + '\n');
  put('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
  const urls = all.filter((p) => p.path !== '/404').map((p) => `  <url><loc>${base}${p.path}</loc><lastmod>${cfg.asserted}</lastmod></url>`).join('\n');
  put('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  put('llms.txt', llms(inputs, all));
  put('llms-full.txt', llmsFull(inputs, all));

  for (const m of nav.machine) {
    const rel = m.path.replace(/^\//, '');
    if (!written.includes(rel)) throw new Error(`nav.machine lists ${m.path} but the build wrote no such file`);
  }
  return written.sort();
}

function plain(s) { return s.replace(/\{\{([a-z0-9-]+)\}\}/g, (_, k) => k.replace(/-/g, ' ')).replace(/<[^>]+>/g, ''); }

export function entity(inputs) {
  const { cfg, lock, charter, answers } = inputs;
  const base = `https://${cfg.domain}`;
  return {
    '@context': 'https://schema.org', '@type': 'Organization', '@id': `${base}/#org`, name: cfg.name, url: base, logo: `${base}/assets/mark-flare.svg`,
    description: cfg.description, parentOrganization: { '@type': 'Organization', name: cfg.parent.name, url: cfg.parent.url },
    sameAs: [cfg.repository], knowsAbout: terms(lock).map((t) => ({ '@type': 'DefinedTerm', name: t.term, url: t.canonical })),
    capabilities: JSON.parse(handshakeJson(charter)).capabilities,
    roles: charter.roles.map((r) => ({ name: r.name, family: r.family, purpose: r.purpose })),
    answers: answers.map((a) => ({ question: a.question, url: `${base}/answers/${a.slug}/`, definition: a.definition, owned: Boolean(a.owned) })),
    provenance: provenanceText(cfg, lock), status: cfg.status, asserted: cfg.asserted,
  };
}

export function llms(inputs, all) {
  const { cfg, lock, nav, answers } = inputs;
  const base = `https://${cfg.domain}`;
  const t = (k) => { const x = terms(lock).find((y) => y.key === k); return `${x.anchor} (${x.canonical})`; };
  return `# ${cfg.name}

> ${cfg.description}

${provenanceText(cfg, lock)}. Holder: ${cfg.holder}. Accountable: ${cfg.accountableTo}. Status: ${cfg.statusLine}

## What this site owns
${answers.filter((a) => a.owned).map((a) => `- ${a.owned.term}: ${base}/answers/${a.slug}/ — ${a.definition}`).join('\n')}

## Terms this site says and does not own (one owner per term; linked, never restated)
- ${t('web-4')} — the era this community builds for, defined by GDA Group.
- ${t('agentic-internet')}, ${t('agentic-autonomous-organization')}, ${t('aao-stack')}, ${t('agentic-network')} — FlashyOS.

## Pages
${all.filter((p) => p.path !== '/404').map((p) => `- ${base}${p.path} — ${p.desc}`).join('\n')}

## Machine surfaces
${nav.machine.map((m) => `- ${base}${m.path} — ${m.what}`).join('\n')}

## Rules a reader can rely on
- No figure on this site is typed: the chapter count is whatever the survey (${base}/tally.json) last read, with its date.
- Agents suggest; humans consent. No chapter is listed, no edge countersigned and no observance consecrated by a machine.
- A chapter publishes no member's contact details. A person appears in the directory only by their own assertion.
`;
}

export function llmsFull(inputs, all) {
  const { cfg, answers, glossary, lock } = inputs;
  const base = `https://${cfg.domain}`;
  const a = answers.map((x) => `## ${x.question}\n${base}/answers/${x.slug}/\n\n${x.definition}\n\n${x.paragraphs.map(plain).join('\n\n')}\n`).join('\n');
  const g = glossary.map((e) => e.owned ? `- ${e.term}: ${base}/answers/${e.owned}/` : e.href ? `- ${e.term}: ${base}${e.href} — ${e.where}` : `- ${e.term} — owned by ${e.owner}: ${terms(lock).find((t) => t.key === e.says[0]).canonical} — ${e.where}`).join('\n');
  return `# ${cfg.name} — every answer in full\n\n${provenanceText(cfg, lock)}.\n\n${a}\n## Glossary of links\n${g}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const w = build();
  console.log(`wrote ${w.length} files to ${relative(process.cwd(), OUT) || '.'}`);
}
