import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ROOT, htmlPages, walk, json } from './_helpers.mjs';

const sources = () => walk(ROOT).filter((f) => !/\/(site|node_modules|\.git)\//.test(f) && !f.endsWith('.woff2') && !f.endsWith('hygiene.test.mjs'));

test('no vendor or model name is anywhere in the tree, and no commit marker that would skip a render', () => {
  for (const f of sources()) {
    const s = readFileSync(f, 'utf8');
    assert.ok(!/\b(claude|anthropic|openai|gpt-?\d|gemini|copilot)\b/i.test(s), `${f} names a model vendor`);
    // vendored emitters legitimately write the marker into the refresh workflows they generate
    if (!/\/vendor-[a-z-]+\.mjs$/.test(f)) assert.ok(!/\[(skip ci|vercel skip)\]/.test(s), `${f} carries a skip marker`);
  }
});

test('nothing in the tree looks like a secret', () => {
  for (const f of sources()) {
    const s = readFileSync(f, 'utf8');
    assert.ok(!/(sk|ghp|github_pat|xox[abp]|AKIA)[A-Za-z0-9_-]{16,}/.test(s), `${f} may carry a credential`);
    assert.ok(!/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(s), `${f} carries a private key`);
  }
});

test('every page has a canonical, a description, Open Graph, JSON-LD, the llms.txt link and a skip link', () => {
  const domain = json('site.config.json').domain;
  for (const p of htmlPages()) {
    const path = p.path.endsWith('404.html') ? '/404' : p.path;
    assert.ok(p.html.includes(`<link rel="canonical" href="https://${domain}${path}">`), `${p.path} canonical`);
    assert.match(p.html, /<meta name="description" content="[^"]{40,}">/, `${p.path} description`);
    assert.ok(p.html.includes('property="og:title"') && p.html.includes('property="og:image"'), `${p.path} og`);
    assert.ok(p.html.includes('application/ld+json'), `${p.path} json-ld`);
    assert.ok(p.html.includes('href="/llms.txt"'), `${p.path} llms link`);
    assert.ok(p.html.includes('class="skip"') && p.html.includes('id="main"'), `${p.path} skip link`);
    assert.ok(p.html.includes('<html lang="en">'));
    assert.equal((p.html.match(/<h1[\s>]/g) ?? []).length, 1, `${p.path} must carry exactly one h1`);
  }
});

test('the entity descriptor and llms.txt carry the provenance line and the owned answers', () => {
  const ent = json('site/web4global.json');
  assert.equal(ent['@type'], 'Organization');
  assert.match(ent.provenance, /on the FlashyOS mesh$/);
  assert.ok(ent.answers.filter((a) => a.owned).length >= 5);
  const llms = readFileSync(`${ROOT}/site/llms.txt`, 'utf8');
  assert.match(llms, /^# Web4 Global/);
  assert.ok(llms.includes('/.well-known/flashyos-charter.json'));
  assert.ok(llms.includes('gda.group/answers/what-is-web-4'), 'llms.txt must point a model at the owner of Web 4');
});
