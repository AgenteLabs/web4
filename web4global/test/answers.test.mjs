import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { SITE, json, htmlPages } from './_helpers.mjs';

const answers = json('content/answers.json').answers;
const words = (s) => s.trim().split(/\s+/).length;

test('every definition is one sentence of forty words or fewer, and every answer has a next step that resolves', () => {
  assert.ok(answers.length >= 10);
  for (const a of answers) {
    assert.ok(words(a.definition) <= 40, `${a.slug}: definition is ${words(a.definition)} words`);
    assert.ok(/[.]$/.test(a.definition));
    assert.ok(existsSync(join(SITE, a.next.href.replace(/^\//, ''), 'index.html')), `${a.slug}: next → ${a.next.href} missing`);
    assert.ok(a.paragraphs.length >= 2);
  }
});

test('an owned term renders DefinedTerm JSON-LD whose @id resolves to an element on the page; an unowned answer does not', () => {
  for (const a of answers) {
    const p = htmlPages().find((x) => x.path === `/answers/${a.slug}/`);
    const ld = [...p.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => JSON.parse(m[1]));
    const dt = ld.find((x) => x['@type'] === 'DefinedTerm');
    assert.ok(ld.some((x) => x['@type'] === 'FAQPage'), `${a.slug} lacks FAQPage`);
    if (a.owned) {
      assert.ok(dt, `${a.slug} is owned and renders no DefinedTerm`);
      assert.equal(dt.name, a.owned.term);
      const frag = dt['@id'].split('#')[1];
      assert.ok(p.html.includes(`id="${frag}"`), `${a.slug}: @id #${frag} resolves to nothing on the page`);
      assert.ok(existsSync(join(SITE, 'glossary', 'index.html')) && htmlPages().find((x) => x.path === '/glossary/').html.includes('id="set"'), 'DefinedTermSet @id must resolve');
    } else {
      assert.equal(dt, undefined, `${a.slug} is not owned and must not claim a DefinedTerm`);
    }
  }
});

test('owned terms do not collide with terms the estate map already owns', () => {
  const lock = json('canon.lock.json').facts['vocabulary.terms'].terms;
  const taken = new Set(lock.flatMap((t) => [t.term, ...t.aliases]).map((s) => s.toLowerCase()));
  for (const a of answers.filter((x) => x.owned)) for (const s of [a.owned.term, ...a.owned.aliases]) assert.ok(!taken.has(s.toLowerCase()), `${s} is owned elsewhere in the estate`);
});
