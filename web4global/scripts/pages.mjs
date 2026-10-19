// Every page, as data plus a body. Prose that says an estate term another
// property owns writes {{term-key}} and the generator renders the owner's link;
// test/terms.test.mjs fails a page that says a term and does not link its owner.
// No figure is typed here: counts come from tally.json and the fragments.
import { esc, cite, termLink, mark } from './build.mjs';

const P = (lock, s) => cite(lock, s);

export function pages(inputs) {
  const { cfg, nav, lock, charter, ritual, tally, stack, answers, glossary, chapters, reading } = inputs;
  const base = `https://${cfg.domain}`;
  const t = (k) => termLink(lock, k);
  const out = [];
  const page = (path, title, desc, body, jsonld) => out.push({ path, title, desc, body, jsonld });
  const sect = (eyebrow, h, inner) => `<section class="block"><div>${eyebrow ? `<span class="eyebrow">${esc(eyebrow)}</span>` : ''}${h ? `<h2>${h}</h2>` : ''}${inner}</div></section>`;
  const simple = (eyebrow, h1, lede, inner) => `<article class="page"><span class="eyebrow">${esc(eyebrow)}</span><h1>${esc(h1)}</h1>${lede ? `<p class="lede">${lede}</p>` : ''}${inner}</article>`;
  const empty = (b, rest) => `<div class="empty"><p><b>${b}</b> ${rest}</p></div>`;
  const tallyLine = tally.listed === 0
    ? `No chapter is listed yet. Three founding seats are open; a chapter appears here only after it reaches L2 on its own domain and a steward approves its charter.`
    : `${tally.served} of ${tally.read} chapters read served correctly on ${tally.surveyed}; ${tally.unread.length} could not be read and are not counted.`;

  // ---- home ---------------------------------------------------------------
  page('/', cfg.name, cfg.description, `
<div class="hero">
  <svg class="four" viewBox="0 0 100 120" aria-hidden="true"><path d="M70 12 L22 80 H88 M70 12 V108" fill="none" stroke="currentColor" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><circle cx="70" cy="12" r="8" fill="currentColor"/><circle cx="22" cy="80" r="8" fill="currentColor"/><circle cx="88" cy="80" r="8" fill="currentColor"/><circle cx="70" cy="108" r="8" fill="currentColor"/></svg>
  <span class="eyebrow">The global community of agentic developers</span>
  <h1>Build for Web&nbsp;4. Together.</h1>
  <p class="dek">${P(lock, 'Web4 Global is where developers building for {{web-4}} meet in their own cities, ship at monthly build nights, follow one builder track, and run their community the way they build their agents: on the FlashyOS mesh, with a public charter, a public calendar, and a human who answers.')}</p>
  <p class="status"><b>${esc(cfg.status.toUpperCase())}</b> <span>${esc(tallyLine)}</span></p>
</div>
${sect('Five doors', 'Who arrives, and what they can do in ninety seconds', `<div class="grid">${nav.doors.map((d) => `<div class="card"><h3>${esc(d.label)}</h3><p>${esc(d.audience)}.</p><a class="more" href="${esc(d.rows[0].href)}">${esc(d.rows[0].label)} →</a></div>`).join('')}</div>`)}
${sect('How it works', 'A chapter is an organisation, not a row', `<p>${P(lock, 'Each chapter runs on its own domain with its own charter and its own accountable lead, and files a consented membership edge to Web4 Global. Each build night is an observance a second party witnesses and a person consecrates. The number of chapters on this site is whatever the survey last read, with its date. Those three mechanisms are the whole design, and every one of them is a format the {{agentic-network}} already enforces for organisations.')}</p>
<div class="grid"><div class="card"><h3>Chapters</h3><p>Listed only at conformance level two on their own domain. Conformance is the onboarding.</p><a class="more" href="/chapters/">The chapters →</a></div><div class="card"><h3>Build nights</h3><p>Monthly. Recorded, witnessed, consecrated. A night nobody witnessed moves nothing.</p><a class="more" href="/events/">This month →</a></div><div class="card"><h3>The tally</h3><p>Read by a fetch, never typed. Unread is reported by name and never counted as zero.</p><a class="more" href="/tally/">The tally →</a></div></div>`)}
${sect('What a member does', 'Three things, in order', `<ol class="steps"><li><strong>Join a chapter</strong> in your city, or apply to found one where there is none.</li><li><strong>Come to a build night</strong> and ship one thing for the stack: an agent that is discoverable, a charter a stranger can check, a record that re-verifies.</li><li><strong>Follow the builder track</strong>, certified by flashy.academy, from a first handshake to level two on your own domain.</li></ol><p><a class="next" href="${esc(nav.cta.href)}">${esc(nav.cta.label)} →</a></p>`)}
${sect('Proof', 'Everything this site claims, a program can read', `<p>${P(lock, 'This community is itself an {{agentic-autonomous-organization}}: eight roles, each one standing job, each with a measure that is a ratio, each escalating to a steward who is a person. The charter, the directory and the calendar are served where a checker reads them, and the footer of every page links them.')}</p><p><a href="/machine-access/">Machine access →</a> · <a href="/governance/">Governance →</a></p>`)}
`, [{ '@context': 'https://schema.org', '@type': 'Organization', '@id': `${base}/#org`, name: cfg.name, url: base, logo: `${base}/assets/mark-flare.svg`, description: cfg.description, parentOrganization: { '@type': 'Organization', name: cfg.parent.name, url: cfg.parent.url }, sameAs: [cfg.repository] }]);

  // ---- build ---------------------------------------------------------------
  page('/start/', 'Start here', 'The shortest path from nothing to a discoverable, chartered organisation on the mesh, for a developer on their first visit.', simple('Build', 'Start here', P(lock, 'You are building for {{web-4}}. The fastest way to start is to make the thing you are building legible to another organisation’s agent, and the mesh has one command for that.'), `
<ol class="steps">
<li><strong>Read the layer your work answers.</strong> The stack has nine layers and each answers one question. <a href="/stack/">The stack →</a></li>
<li><strong>Join the mesh in one command.</strong> It writes a charter, a handshake and a directory fragment for your organisation and tells you whether you reached level two. <a href="/start/mesh-node/">Mesh node →</a></li>
<li><strong>Serve it on your own domain and check it live.</strong> Committed is not served. <a href="/start/conformance/">Reach L2 →</a></li>
<li><strong>Find your chapter.</strong> People doing this on the same evening every month. <a href="/chapters/">Chapters →</a></li>
</ol>
<h2>Where the tools live</h2>
<p>Every package this community points at is catalogued once by its owner at <a href="https://flashy.tools" rel="noopener">flashy.tools</a>, and every open spec is listed at ${(() => { const o = lock.facts['open.door'].value; return `<a href="${esc(o.url)}" rel="noopener">${esc(o.anchor)}</a>`; })()}. This site links them and keeps no second catalogue.</p>`));

  const layerRows = stack.layers.map((L) => `<tr><td><strong>${esc(L.name)}</strong></td><td>${esc(L.question)}</td><td>${L.repos.map((r) => `<a href="${esc(r.url)}" rel="noopener">${esc(r.name)}</a> <span class="mono">${esc(r.kind)}${r.contract ? ` · ${esc(r.contract)}` : ''} · ${esc(r.status)} · ${esc(r.visibility)}</span>`).join('<br>')}</td></tr>`).join('');
  page('/stack/', 'The stack, nine layers', 'The nine-layer Web 4 stack, one question per layer, with the repository that owns each answer and its status, rendered from the served stack.json.', simple('Build', 'The stack', P(lock, `Nine layers, one question each. This table is rendered from the <a href="/.well-known/stack.json">stack.json</a> copy this site serves (contract ${esc(stack.contract)}, generated ${esc(stack.generated)}); where the page and the file disagree, the file is the truth. The map’s home is <a href="${esc(stack.hub)}" rel="noopener">FlashyLabs/web4</a>, and the era it maps is {{web-4}}. The <code>aao</code> repository on it is the specification an {{agentic-autonomous-organization}} is written against.`), `
<p class="mono">${esc(stack.principle)}</p>
<div class="tablewrap"><table><thead><tr><th>Layer</th><th>Question</th><th>Repositories · kind · status · visibility</th></tr></thead><tbody>${layerRows}</tbody></table></div>
<p>${P(lock, 'Statuses are the map’s own, per repository, on the date above. No repository on the map is a released standard today, and this page will not say one is until the map does. The account of what ships at each layer, with what is live, is the {{aao-stack}} page.')}</p>`));

  page('/start/mesh-node/', 'Join the mesh in one command', 'One command writes a charter, a handshake, a directory fragment and a workflow for your organisation, then runs the real validators and reports whether level two is reached.', simple('Build', 'Join the mesh in one command', 'The on-ramp is a published package. Run it against the domain you control and the email of the person who will answer for the organisation.', `
<pre><code>npm create @flashyos/mesh-node -- yourdomain.example --email you@example.org
#  writes flashyos.roles.json (the charter), .well-known/flashyos.json (the handshake),
#  a directory fragment and a mesh.yml workflow, then verifies L2 against the files it wrote</code></pre>
<h2>What it writes, and why each file exists</h2>
<ul>
<li><strong>The charter.</strong> Your roles, each with a purpose, a measure and a human-approval floor, and the person who answers. Role names stay within twenty-four characters and families come from a closed list of ten.</li>
<li><strong>The handshake.</strong> The <code>flashyos/1</code> document a stranger’s agent reads first. Its capabilities are derived from the charter, so the two cannot disagree.</li>
<li><strong>The directory fragment.</strong> Your organisation and its agents as nodes, with consented edges and an expiry on every row.</li>
<li><strong>The workflow.</strong> Runs the conformance check on every push, against the live domain, because committed is not served.</li>
</ul>
<h2>Then serve it</h2>
<p>Deploy so that <code>/.well-known/flashyos.json</code> and <code>/.well-known/flashyos-charter.json</code> answer on your domain, and run the live check. <a href="/start/conformance/">Reach L2 →</a></p>
<p class="mono">Confirm the package resolves in your environment before relying on it; this site links the published tooling and vendors none of it.</p>`));

  page('/start/conformance/', 'Reach L2', 'The three conformance levels, what each proves, the command that checks a live domain, and the three exit codes.', simple('Build', 'Reach L2', P(lock, 'Three levels. Two are offline and self-claimed; one is read from the register and carries the mark. The suite is the one the {{agentic-network}} publishes and the hosted check at flashyos.com imports the same package, so there is no second grader.'), `
<div class="tablewrap"><table><thead><tr><th>Level</th><th>What it proves</th><th>How it is read</th></tr></thead><tbody>
<tr><td><strong>L1 Discoverable</strong></td><td>A valid <code>flashyos/1</code> handshake at <code>/.well-known/flashyos.json</code>.</td><td>offline · self-claimed</td></tr>
<tr><td><strong>L2 Chartered</strong></td><td>${P(lock, 'Plus an {{agentic-autonomous-organization}} charter at <code>/.well-known/flashyos-charter.json</code> passing every static question.')}</td><td>offline · self-claimed</td></tr>
<tr><td><strong>L3 Accountable</strong></td><td>Plus who authorised each agent, whether it can be revoked, and what it did.</td><td>from the register · carries the mark</td></tr>
</tbody></table></div>
<pre><code>npx @flashyos/conformance yourdomain.example --level 2
# exit 0  the level is met
# exit 1  a check at that level failed
# exit 2  the run could not reach a verdict</code></pre>
<p>Exit code two exists because a suite that exits green on “could not tell” is how green ticks stop meaning anything. Run it in CI against the live domain, not the checkout.</p>
<h2>Where this site stands</h2>
<p>${esc(cfg.name)} serves its handshake and charter at the paths above and its charter passes the static questions offline (the suite holds that). The authoritative reading is against <code>${esc(cfg.domain)}</code> after deploy, and this page will not claim a level the live check has not returned. <a href="/governance/">The charter →</a></p>`));

  page('/build/examples/', 'Examples and kits', 'Worked examples a developer can copy: this site’s own charter, directory and ritual fragments, and the chapter kit that generates a chapter.', simple('Build', 'Examples and kits', 'The best example is a real one. Every file below is served by this site, generated from one source, and checked by the same validators a chapter runs.', `
<div class="grid">
<div class="card"><h3>A community charter</h3><p>Eight roles across eight of the ten families, each with a ratio for a measure. The handshake’s capabilities are derived from it.</p><a class="more" href="/.well-known/flashyos-charter.json">flashyos-charter.json →</a></div>
<div class="card"><h3>A directory fragment</h3><p>The organisation, its accountable human and its agents, with <code>declares</code> edges scoped to each role’s capabilities. Sorted, dated, expiring.</p><a class="more" href="/.well-known/directory.json">directory.json →</a></div>
<div class="card"><h3>A ritual calendar</h3><p>Two liturgies and no observance yet, which is what honest looks like before the first build night.</p><a class="more" href="/.well-known/ritual.json">ritual.json →</a></div>
<div class="card"><h3>The chapter kit</h3><p>One command on top of the mesh-node on-ramp. Writes a chapter’s site, charter, edge and calendar; cannot countersign or consecrate.</p><a class="more" href="/chapters/start/">Start a chapter →</a></div>
<div class="card"><h3>The survey</h3><p>How a count becomes a measurement: fetch, classify, compute over what was read.</p><a class="more" href="/tally/">The tally →</a></div>
<div class="card"><h3>This site</h3><p>Dependency-free generator, byte-identical rebuild test, nav registry every page renders from. Apache-2.0.</p><a class="more" href="${esc(cfg.repository)}" rel="noopener">Source ↗</a></div>
</div>`));

  // ---- chapters ------------------------------------------------------------
  const chapterList = chapters.chapters.length
    ? `<div class="tablewrap"><table><thead><tr><th>City</th><th>Region</th><th>Domain</th><th>Survey</th></tr></thead><tbody>${chapters.chapters.map((c) => { const s = tally.chapters.find((x) => x.slug === c.slug); return `<tr><td>${esc(c.city)}</td><td>${esc(c.region)}</td><td><a href="https://${esc(c.domain)}/" rel="noopener">${esc(c.domain)}</a></td><td class="mono">${esc(s?.state ?? 'not yet surveyed')}</td></tr>`; }).join('')}</tbody></table></div>`
    : empty('No chapter is listed yet.', `${esc(chapters.founding.seats)} founding seats are open since ${esc(chapters.founding.since)}. A chapter appears here on the survey after it reaches L2 on its own domain and a steward approves its charter; nothing on this page is typed by hand.`);
  page('/chapters/', 'All chapters, by region', 'Every Web4 Global chapter, read from the chapter register and the latest survey. A chapter is listed only at conformance level two on its own domain.', simple('Chapters', 'Chapters', P(lock, 'A chapter is a city’s agentic developers as an organisation on the mesh: its own domain, its own charter, its own lead, and a consented membership edge to Web4 Global. <a href="/answers/what-is-a-web-4-chapter/">What a chapter is →</a>'), `
${chapterList}
<h2>Founding seats</h2>
<p>What a founding chapter needs, in full:</p>
<ul>${chapters.founding.requires.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
<p><a class="next" href="/chapters/start/">Start a chapter →</a></p>
<p class="mono">Survey last read ${esc(tally.surveyed)}: ${esc(tally.listed)} listed, ${esc(tally.read)} read, ${esc(tally.served)} served. <a href="/tally/">The tally</a>.</p>`));

  page('/chapters/start/', 'Start a chapter', 'How to found a Web4 Global chapter: the requirements, the one-command kit, what it writes, what it refuses, and how the steward approves.', simple('Chapters', 'Start a chapter', 'Three founding seats are open. The requirements are the same for every applicant, and the kit does the mechanical half.', `
<h2>Requirements</h2>
<ul>${chapters.founding.requires.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
<h2>The kit</h2>
<pre><code>npm create @flashyos/mesh-node -- yourcity.web4.global --email lead@example.org
#  the generic node: charter, handshake, directory fragment, workflow, then the L2 check
#  the chapter kit adds: site.config.json for the shared generator, the member-of edge
#  filed as PROPOSED, the build-night liturgy, and the brand kit with its manifest</code></pre>
<p>A chapter cannot edit the kit’s copy of the brand, cannot mark its own edge countersigned, and cannot consecrate its own observance. None of those has a parameter, which is how the rule is enforced rather than requested.</p>
<h2>Approval</h2>
<ol class="steps"><li>Run the kit on a domain you control and reach L2 there.</li><li>Adopt the code of conduct in your chapter’s charter. <a href="/governance/">Governance →</a></li><li>Write to the accountable address with your domain, your city and your build night. The steward reviews the charter.</li><li>If approved, the steward countersigns the membership edge and the chapter appears on the next survey.</li></ol>
<p class="mono">Contact: ${esc(cfg.accountableTo)}. The chapter kit as a packaged command is in build; until it ships, the generic on-ramp plus the four files above, done by hand with the steward, is the path.</p>`));

  page('/chapters/leads/', 'Chapter leads', 'Who leads each chapter, by their own public assertion in the directory. Nobody is listed here who has not asserted themselves.', simple('Chapters', 'Chapter leads', 'A lead is a person who can be asked why. They appear here only by their own assertion, as a person/ id in their chapter’s directory fragment; this site never types a name or an address.', `
${chapters.chapters.length ? '' : empty('No lead is listed yet,', 'because no chapter is. When the first founding chapter is approved, its lead appears here from its directory fragment, with whatever they chose to assert and nothing else.')}
<h2>What a lead does</h2>
<ul><li>Opens and closes the monthly build night, and consecrates its observance once a second party has witnessed it.</li><li>Keeps the chapter at L2 on its own domain. A chapter that drops below it leaves the list on the next survey.</li><li>Holds the keys to the chapter’s own repository and site. Web4 Global holds none of them.</li><li>Enforces the code of conduct locally and escalates to the steward.</li></ul>`));

  const consecrated = ritual.observances.filter((o) => o.state === 'consecrated');
  page('/events/', 'Build nights, this month', 'Upcoming and recent build nights across the chapters, derived from consecrated observances in the merged ritual calendars. A night nobody witnessed does not appear.', simple('Chapters', 'Build nights', P(lock, 'The calendar is derived, not edited. A build night appears here when its chapter recorded it, a second party witnessed it with evidence of its own, and the lead consecrated it. <a href="/answers/what-is-a-build-night/">What a build night is →</a>'), `
${consecrated.length ? `<ul>${consecrated.map((o) => `<li><span class="mono">${esc(o.at.slice(0, 10))}</span> ${esc(o.liturgy)} — <a href="${esc(o.evidence)}" rel="noopener">evidence</a></li>`).join('')}</ul>` : empty('No build night has been consecrated yet.', `The calendar this site serves carries ${esc(ritual.liturgies.length)} liturgies and ${esc(ritual.observances.length)} observances. The first night appears here the day a chapter records one, another party witnesses it and the lead consecrates it; nothing is scheduled by hand on this page.`)}
<h2>The liturgies</h2>
<div class="tablewrap"><table><thead><tr><th>Liturgy</th><th>Cadence</th><th>Rite</th></tr></thead><tbody>${ritual.liturgies.map((l) => `<tr><td><strong>${esc(l.title)}</strong><br><span class="mono">${esc(l.id)}</span></td><td>${esc(l.cadence)}</td><td><ol>${l.rite.map((r) => `<li>${esc(r)}</li>`).join('')}</ol></td></tr>`).join('')}</tbody></table></div>
<p class="mono">Served at <a href="/.well-known/ritual.json">/.well-known/ritual.json</a>, contract ritual/1.</p>`));

  // ---- learn ---------------------------------------------------------------
  page('/answers/', 'Answers', 'Every question this site answers in one sentence under forty words, with the owned terms marked. Terms owned elsewhere are linked, never restated.', simple('Learn', 'Answers', P(lock, 'One sentence first, under forty words, then the account. A term another property owns is linked to its owner on the line it is said; where a definition below says AAO, it means an {{agentic-autonomous-organization}} as FlashyOS defines it.'), `
<div class="grid">${answers.map((a) => `<div class="card"><h3><a href="/answers/${esc(a.slug)}/">${esc(a.question)}</a></h3><p>${esc(a.definition)}</p>${a.owned ? `<p class="mono">owned term · ${esc(a.owned.term)}</p>` : ''}</div>`).join('')}</div>`));

  for (const a of answers) {
    const url = `${base}/answers/${a.slug}/`;
    const ld = [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: a.question, acceptedAnswer: { '@type': 'Answer', text: a.definition } }] }];
    if (a.owned) ld.push({ '@context': 'https://schema.org', '@type': 'DefinedTerm', '@id': `${url}#term`, name: a.owned.term, alternateName: a.owned.aliases, description: a.definition, url, inDefinedTermSet: { '@type': 'DefinedTermSet', '@id': `${base}/glossary/#set`, name: `${cfg.name} glossary`, url: `${base}/glossary/` } });
    page(`/answers/${a.slug}/`, a.question, a.definition, `<article class="page"><span class="eyebrow">Answers${a.owned ? ' · owned term' : ''}</span><h1>${esc(a.question)}</h1><p class="defn" id="term">${esc(a.definition)}</p>${a.paragraphs.map((p) => `<p>${P(lock, p)}</p>`).join('')}<p><a class="next" href="${esc(a.next.href)}">${esc(a.next.label)} →</a></p></article>`, ld);
  }

  page('/glossary/', 'Glossary', 'A glossary of links: every term this community says, pointing at the page that owns it. Only terms this property owns are defined here.', simple('Learn', 'Glossary', 'A glossary of links, not of definitions. One owner per term across the estate; a term owned elsewhere is linked with the owner’s anchor and one line saying what you will find there.', `
<div class="tablewrap"><table id="set"><thead><tr><th>Term</th><th>Where it is defined</th><th>What you will find</th></tr></thead><tbody>${glossary.map((e) => {
    if (e.owned) { const a = answers.find((x) => x.slug === e.owned); return `<tr><td><strong>${esc(e.term)}</strong></td><td><a href="/answers/${esc(a.slug)}/">${esc(cfg.domain)}</a> <span class="mono">owned here</span></td><td>${esc(a.definition)}</td></tr>`; }
    if (e.href) return `<tr><td><strong>${esc(e.term)}</strong></td><td><a href="${esc(e.href)}">${esc(cfg.domain)}</a></td><td>${esc(e.where)}</td></tr>`;
    return `<tr><td><strong>${esc(e.term)}</strong></td><td>${t(e.says[0])} <span class="mono">${esc(e.owner)}</span></td><td>${esc(e.where)}</td></tr>`;
  }).join('')}</tbody></table></div>`));

  page('/learn/reading/', 'Reading list', 'What a developer here is pointed at: the definition of the era, the infrastructure account, the stack, the organisation category, and the proof surfaces. Every entry is a live page.', simple('Learn', 'Reading list', 'Pointed at, not summarised. Every entry is a page that exists today and is owned by the property that wrote it.', reading.sections.map((s) => `<h2>${esc(s.title)}</h2><ul>${s.items.map((i) => { const url = i.term ? lock.facts['vocabulary.terms'].terms.find((x) => x.key === i.term).canonical : i.url; return `<li><a href="${esc(url)}"${url.startsWith('http') ? ' rel="noopener"' : ''}>${esc(i.title)}</a> <span class="mono">${esc(i.host)}</span><br>${esc(i.why)}</li>`; }).join('')}</ul>`).join('')));

  // ---- programs ------------------------------------------------------------
  page('/programs/hackathons/', 'Hackathons', 'What a Web 4 hackathon is here: run through the mesh, with intents filed, work settled and receipts sealed. Dates, prizes and sponsors appear only once signed.', simple('Programs', 'Hackathons', P(lock, 'A hackathon here ends with a settlement, not a slide deck. <a href="/answers/what-is-a-web-4-hackathon/">What a Web 4 hackathon is →</a>'), `
${empty('No hackathon is scheduled.', 'The first is planned for the second phase of the rollout, after founding chapters are at L2 to host it and the settlement surfaces are live to seal it. A date appears here when a person has committed to it and the terms are signed.')}
<h2>How one will run</h2>
<ol class="steps"><li>A chapter hosts; Web4 Global files the initiative on the mesh.</li><li>Each team’s work is an intent, offered and accepted with consent on both sides.</li><li>Completion is a sealed receipt a stranger can re-verify afterwards.</li><li>Judging happens, and is not the only evidence.</li></ol>
<p><a href="/programs/sponsor/">Sponsor →</a></p>`));

  page('/programs/sponsor/', 'Sponsor a chapter', 'How a sponsor supports a chapter or an event, and the rule that no sponsorship is announced before its terms are signed.', simple('Programs', 'Sponsor a chapter', 'Sponsorship pays for rooms, food and prizes in a city, and nothing on this site names a sponsor until the terms are signed.', `
<h2>What sponsorship buys</h2>
<ul><li>A chapter’s venue and build-night costs for a stated period.</li><li>An event: a hackathon’s prizes or a build night’s room.</li><li>Acknowledgement on the chapter’s page and the event’s record, with the terms linked.</li></ul>
<h2>What it does not buy</h2>
<ul><li>A say in what members build, what the glossary says, or which chapters are listed.</li><li>Member data. There is none to sell; a person appears only by their own assertion.</li><li>A logo beside the mark. A chapter page carries the lockup and its city line and nothing else.</li></ul>
<p class="mono">Enquiries to ${esc(cfg.accountableTo)}. The partnerships role (<a href="/governance/">charter</a>) drafts terms; a person signs.</p>`));

  page('/programs/enterprise/', 'Enterprise chapters', 'A company runs an internal chapter on the same kit: same charter shape, same build nights, same conformance, inside its own domain.', simple('Programs', 'Enterprise chapters', 'An enterprise chapter is a chapter whose members share an employer and whose domain is that employer’s. Everything else is the same.', `
<ul><li>Same kit, same charter shape, same monthly liturgy. The company’s own agents observe; its own lead consecrates.</li><li>Its membership edge to Web4 Global is consented like any other, and its listing can be <code>private</code> in the directory so the company appears to its own people and to nobody else.</li><li>It reaches L2 on its own domain, which is also how its board learns what its agents may do.</li></ul>
<p>${P(lock, 'An enterprise chapter is the shortest path from a company that builds with agents to a company that is an {{agentic-autonomous-organization}} in form as well as in practice: the charter the chapter needs is the charter the company needs.')}</p>
<p class="mono">Enquiries to ${esc(cfg.accountableTo)}.</p>`));

  page('/programs/grants/', 'Grants and bounties', 'How grants and bounties will be filed and settled on the mesh, and the honest state today: none is open.', simple('Programs', 'Grants and bounties', 'A bounty here is an intent on the mesh with a stated reward and a sealed receipt on completion, so what was paid for is a record rather than a tweet.', `
${empty('No grant or bounty is open.', 'When one is, it is filed as an intent, listed here from that record, and closed by the receipt. Nothing on this page is typed by hand.')}`));

  page('/jobs/', 'Job board', 'Roles for agentic developers, posted by organisations on the mesh. Honest state today: no listing.', simple('Programs', 'Job board', 'A listing here is posted by an organisation that serves its own charter, so a candidate can read what the agents they will work beside are allowed to do.', `
${empty('No listing yet.', 'Listings open with the first chapters. An organisation posts by filing the role in its own directory fragment; this page renders the merge and types nothing.')}`));

  // ---- community -----------------------------------------------------------
  page('/principles/', 'Principles', 'The rules this community holds itself to, each one enforced by a format or a test rather than by good intentions.', simple('Community', 'Principles', 'Each principle below is enforced somewhere a reader can check. A principle that is only a sentence is one an agent can be prompted past.', `
<ol class="steps">
<li><strong>Agents suggest; humans consent.</strong> No edge is countersigned and no observance consecrated by a machine; there is no parameter for it.</li>
<li><strong>Unread is never zero.</strong> A chapter that could not be fetched is reported by name and enters no ratio. <a href="/tally/">The tally</a>.</li>
<li><strong>One owner per term.</strong> ${P(lock, 'This site says {{web-4}} and links GDA Group’s page; it never restates the definition. A test fails a page that says a term and does not link its owner.')}</li>
<li><strong>Committed is not served.</strong> Conformance is checked against the live domain. The checkout proves nothing about what a stranger receives.</li>
<li><strong>No figure is typed.</strong> Every count on this site comes from a file a tool wrote, with a date, and a method a reader can re-run.</li>
<li><strong>No member data.</strong> A person appears only by their own assertion. No email, no handle, ever, and not hashed either.</li>
<li><strong>Chapters hold their own keys.</strong> A chapter’s site deploys from the chapter’s own repository; Web4 Global cannot edit it.</li>
<li><strong>Refuse rather than warn.</strong> A validator that warns is a rule nobody reads. The kits refuse, and the refusal is a record.</li>
</ol>`));

  const roleRows = charter.roles.map((r) => `<tr><td><strong>${esc(r.name)}</strong><br><span class="mono">${esc(r.family)}</span></td><td>${esc(r.purpose)}</td><td>${esc(r.measure)}</td><td class="mono">${esc(r.humanApprovalAtOrAbove)}</td></tr>`).join('');
  page('/governance/', 'Governance and code of conduct', 'How Web4 Global is run: the charter’s eight roles with their measures and approval floors, who answers, how escalation works, and the code of conduct every chapter adopts.', simple('Community', 'Governance', P(lock, `${esc(cfg.name)} is an {{agentic-autonomous-organization}}. The table below is rendered from the charter served at <a href="/.well-known/flashyos-charter.json">/.well-known/flashyos-charter.json</a>; it is not a second copy. Every role escalates to <strong>${esc(charter.escalation)}</strong>, and the organisation is accountable to <span class="mono">${esc(charter.accountableTo)}</span>.`), `
<div class="tablewrap"><table><thead><tr><th>Role · family</th><th>Purpose</th><th>Measure</th><th>Human approval at or above</th></tr></thead><tbody>${roleRows}</tbody></table></div>
<p class="mono">${esc(charter.roles.length)} roles are ${esc(charter.roles.length)} agents. The organisation’s plan tier must admit that many before the first mint; that is a person’s decision, signed, and recorded in the register.</p>
<h2>Code of conduct</h2>
<p>Every chapter adopts this in its own charter. It is short because each line has a mechanism behind it.</p>
<ol class="steps">
<li><strong>Be the kind of colleague a stranger’s agent can verify.</strong> Say what you did, link the evidence, and let it be checked.</li>
<li><strong>No harassment, no discrimination, no intimidation</strong>, in a room or on a call or in a record. The integrity role refuses the publication and records the refusal.</li>
<li><strong>Consent before contact.</strong> Nobody’s address or handle is shared, scraped or stored. A person is in the directory only because they put themselves there.</li>
<li><strong>Attribute.</strong> A definition belongs to its owner. Link it; do not copy it.</li>
<li><strong>Report to the chapter lead, or to the accountable address.</strong> Every report is resolved with a recorded outcome, and that ratio is the integrity role’s measure.</li>
</ol>
<h2>How a decision is made</h2>
<p>The steward approves chapter charters and changes to this page; nothing joins the list without a person’s yes. Chapters earn seats in governance as their consecrated record grows, in the third phase of the rollout, and the rule for that will be published here before it is used.</p>`));

  page('/tally/', 'The tally', 'The chapter survey’s last reading: how many chapters are listed, how many were read, how many served correctly, and which could not be read. Never computed over what was not read.', simple('Community', 'The tally', 'The only place a chapter count comes from. A fetch, cache-busted, of every listed chapter; each classified; a ratio over what was read and nothing else.', `
<div class="tablewrap"><table><tbody>
<tr><th>Surveyed</th><td class="num">${esc(tally.surveyed)}</td></tr>
<tr><th>Listed</th><td class="num">${esc(tally.listed)}</td></tr>
<tr><th>Read</th><td class="num">${esc(tally.read)}</td></tr>
<tr><th>Served correctly</th><td class="num">${esc(tally.served)}</td></tr>
<tr><th>Broken</th><td class="num">${esc(tally.broken)}</td></tr>
<tr><th>Could not be read</th><td class="num">${esc(tally.unread.length)}${tally.unread.length ? ` — ${tally.unread.map((u) => `${esc(u.domain)} (${esc(u.state)})`).join(', ')}` : ''}</td></tr>
<tr><th>Ratio</th><td class="num">${tally.ratio === null ? 'none — nothing read' : esc(tally.ratio)}</td></tr>
</tbody></table></div>
<h2>Method</h2>
<p>For each chapter in the register the survey fetches the home page, the handshake, the charter and the ritual fragment on the chapter’s own domain, with a cache-busting query and no-cache headers. A chapter is <em>served</em> when all four answer and the page carries the provenance bar; <em>broken</em> when something answered wrongly; and <em>unreachable</em>, <em>ambiguous</em> or <em>refused</em> when the runner could not say, which is a fact about the runner and is never counted against the chapter.</p>
<p class="mono">Machine form: <a href="/tally.json">/tally.json</a>. The script is <code>scripts/chapters-survey.mjs</code> in the <a href="${esc(cfg.repository)}" rel="noopener">repository</a>; re-run it and you get the same shape.</p>`));

  page('/machine-access/', 'Machine access', 'Every machine-readable surface this property serves, what each is for, and the rule that each is a file the footer of every page links.', simple('Community', 'Machine access', 'An agent reads these before it reads a page. Every path below is a file this site serves, and the footer of every page links the same list from the same registry.', `
<div class="tablewrap"><table><thead><tr><th>Path</th><th>What it is</th></tr></thead><tbody>${nav.machine.map((m) => `<tr><td><a href="${esc(m.path)}"><code>${esc(m.path)}</code></a></td><td>${esc(m.what)}</td></tr>`).join('')}</tbody></table></div>
<h2>Contracts</h2>
${P(lock, `<ul><li><code>flashyos/1</code> — the handshake. <code>aao 0.1</code> — the charter, the document that makes an organisation an {{agentic-autonomous-organization}} to a reader. <code>directory 0.1</code> — the fragment. <code>ritual/1</code> — the calendar. <code>web4/1</code> — the stack map. <code>web4-chapters/1</code> — the tally.</li>`)}<li>The conformance check: <code>npx @flashyos/conformance ${esc(cfg.domain)} --level 2</code>.</li></ul>
<p>${P(lock, 'The handshake’s capabilities are derived from the charter so the two cannot disagree; the directory names the organisation’s agents and the human who answers; the calendar is honest about having no observance yet. This is what it looks like for a community to be legible to the {{agentic-network}} before it is legible to a search engine.')}</p>`));

  page('/brand/', 'Press kit', 'The Web4 Global mark, lockups, colours and the rules for using them, with the manifest a consumer verifies against. Chapters carry the lockup and a city line; no chapter makes a logo.', simple('Community', 'Press kit', 'The mark is the Four: four nodes joined by edges, read as the numeral. It is never redrawn. The files below are the kit; the manifest is how you check your copy is the kit.', `
<img class="lockup" src="/assets/lockup-ink.svg" alt="Web4 Global lockup on ink" width="760" height="200">
<img class="lockup" src="/assets/lockup-paper.svg" alt="Web4 Global lockup on paper" width="760" height="200" style="margin-top:1rem">
<h2>Colours</h2>
<div class="swatches"><div class="sw"><div style="background:#08090A"></div><p>Ink #08090A</p></div><div class="sw"><div style="background:#F5F5F3;border-bottom:1px solid var(--line)"></div><p>Paper #F5F5F3</p></div><div class="sw"><div style="background:#FF4D3A"></div><p>Flare #FF4D3A</p></div><div class="sw"><div style="background:#C82B1B"></div><p>Flare-deep #C82B1B</p></div><div class="sw"><div style="background:#9A9A94"></div><p>Soft #9A9A94</p></div></div>
<h2>Rules</h2>
<ul><li>The Four is never redrawn, re-angled, filled, outlined or given a second colour. Minimum 16px, clear space of half its height.</li><li>Ink on paper or paper on ink. Flare is the only accent, never a background, never a gradient. Text in the accent on paper uses Flare-deep.</li><li>Display type is Unbounded 700, uppercase, at or above 36px. Everything under that is Plus Jakarta Sans. Eyebrows, chapter lines and timestamps are JetBrains Mono.</li><li>A chapter is <code>WEB4 GLOBAL · CITY</code> in mono under the lockup. A chapter may not make a logo.</li><li>${P(lock, 'The site never defines {{web-4}}; it links GDA Group’s definition with that anchor.')}</li></ul>
<h2>Files</h2>
<ul><li><a href="/assets/mark-ink.svg">mark-ink.svg</a> · <a href="/assets/mark-paper.svg">mark-paper.svg</a> · <a href="/assets/mark-flare.svg">mark-flare.svg</a></li><li><a href="/assets/lockup-ink.svg">lockup-ink.svg</a> · <a href="/assets/lockup-paper.svg">lockup-paper.svg</a></li><li><a href="/assets/favicon.svg">favicon.svg</a> · <a href="/assets/og-card.svg">og-card.svg</a></li><li><a href="/brand/tokens.css">tokens.css</a> · <a href="/brand/USAGE.md">USAGE.md</a> · <a href="/brand/MANIFEST.sha256">MANIFEST.sha256</a></li></ul>
<pre><code>sha256sum -c MANIFEST.sha256   # every line OK, or your copy has drifted</code></pre>`));

  page('/404', 'Not found', 'This page does not exist on web4.global.', simple('404', 'Not found', 'There is no page at this address. The five doors above reach every page there is, and <a href="/sitemap.xml">the sitemap</a> lists them all.', ''));

  return out;
}
