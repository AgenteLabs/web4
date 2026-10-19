import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, json, htmlPages, text, walk } from './_helpers.mjs';

const lock = json('canon.lock.json');
const terms = lock.facts['vocabulary.terms'].terms;
const said = (body, s) => new RegExp(`(^|[^A-Za-z0-9])${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^A-Za-z0-9]|$)`, 'i').test(body);

test('a page that says a term another property owns links that owner on the same page', () => {
  const strings = terms.flatMap((t) => [t.term, ...t.aliases].map((s) => ({ key: t.key, s })));
  for (const p of htmlPages()) {
    const body = text(p.html);
    for (const t of terms) {
      // "AAO stack" is the aao-stack term, not the AAO term: strip every longer
      // string another term owns before asking whether this one is said.
      const mine = [t.term, ...t.aliases];
      const longer = strings.filter((x) => x.key !== t.key && mine.some((m) => x.s.length > m.length && x.s.toLowerCase().includes(m.toLowerCase())));
      let b = body;
      for (const x of longer) b = b.split(new RegExp(x.s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')).join(' ');
      const says = mine.some((s) => said(b, s));
      if (!says) continue;
      assert.ok(p.html.includes(`href="${t.canonical}"`), `${p.path} says “${t.term}” and does not link ${t.canonical}`);
    }
  }
});

test('no canonical URL from the lock is typed into a source file — it is rendered from the lock', () => {
  const files = [...walk(join(ROOT, 'scripts')), ...walk(join(ROOT, 'content'))].filter((f) => /\.(mjs|json)$/.test(f));
  for (const f of files) {
    const s = readFileSync(f, 'utf8');
    for (const t of terms) assert.ok(!new RegExp(t.canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![A-Za-z0-9/._-])').test(s), `${f} types ${t.canonical}; use {{${t.key}}} or termLink`);
  }
});

test('the glossary names a term it does not own with its owner and a line about where to read, never a definition', () => {
  const g = json('content/glossary.json').entries;
  for (const e of g) {
    if (e.owned) { assert.ok(json('content/answers.json').answers.some((a) => a.slug === e.owned), `${e.term} owned→ ${e.owned} has no answer`); continue; }
    if (e.href) continue;
    assert.equal(e.says.length, 1, `${e.term} must name exactly the term it is`);
    const t = terms.find((x) => x.key === e.says[0]);
    assert.ok(t, `${e.term} cites unknown key ${e.says[0]}`);
    assert.equal(e.owner, t.owner);
    assert.ok(e.where.length < 220, `${e.term}: “where” is long enough to be a definition`);
  }
});

test('the retired AAO slug appears nowhere', () => {
  for (const f of walk(ROOT).filter((f) => !f.includes('/node_modules/') && !f.endsWith('terms.test.mjs') && /\.(mjs|json|html|txt|md)$/.test(f))) {
    assert.ok(!readFileSync(f, 'utf8').includes('/concepts/ai-autonomous-organization'), `${f} names the retired slug`);
  }
});
