import test from 'node:test';
import assert from 'node:assert/strict';
import { summarise, surveyChapter } from '../scripts/chapters-survey.mjs';
import { json } from './_helpers.mjs';

const ok = (body, type = 'application/json') => () => new Response(body, { status: 200, headers: { 'content-type': type } });
const page = '<html><body><div role="note" aria-label="Provenance">A Gord Holdings company on the FlashyOS mesh</div></body></html>';
const fake = (map) => async (url) => { const p = new URL(url).pathname; if (map[p] instanceof Error) throw map[p]; return map[p] ? map[p]() : new Response('nf', { status: 404 }); };

test('unread is never zero: an unreachable chapter is named and enters no ratio', () => {
  const t = summarise([{ slug: 'a', domain: 'a.example', state: 'served' }, { slug: 'b', domain: 'b.example', state: 'unreachable' }, { slug: 'c', domain: 'c.example', state: 'broken' }], '2026-10-19');
  assert.equal(t.listed, 3); assert.equal(t.read, 2); assert.equal(t.served, 1); assert.equal(t.broken, 1);
  assert.deepEqual(t.unread, [{ domain: 'b.example', state: 'unreachable' }]);
  assert.equal(t.ratio, 0.5);
});

test('nothing read means no ratio, not a zero', () => {
  const t = summarise([{ slug: 'a', domain: 'a.example', state: 'refused' }], '2026-10-19');
  assert.equal(t.ratio, null); assert.equal(t.read, 0); assert.equal(t.served, 0);
  assert.equal(summarise([], '2026-10-19').ratio, null);
});

test('a chapter is served only when all four surfaces answer and the page carries the bar', async () => {
  const good = { '/': ok(page, 'text/html'), '/.well-known/flashyos.json': ok('{}'), '/.well-known/flashyos-charter.json': ok('{}'), '/.well-known/ritual.json': ok('{}') };
  assert.equal((await surveyChapter({ slug: 'x', domain: 'x.example' }, fake(good))).state, 'served');
  assert.equal((await surveyChapter({ slug: 'x', domain: 'x.example' }, fake({ ...good, '/.well-known/ritual.json': ok('not json') }))).state, 'broken');
  assert.equal((await surveyChapter({ slug: 'x', domain: 'x.example' }, fake({ ...good, '/': ok('<html>no bar</html>', 'text/html') }))).state, 'broken');
  const conn = Object.assign(new Error('getaddrinfo ENOTFOUND'), { code: 'ENOTFOUND' });
  const r = await surveyChapter({ slug: 'x', domain: 'x.example' }, fake({ '/': conn }));
  assert.ok(['unreachable', 'ambiguous', 'refused'].includes(r.state), r.state);
});

test('the committed tally is the shape the survey writes and names every registered chapter', () => {
  const t = json('tally.json'); const reg = json('content/chapters.json');
  assert.equal(t.survey, 'web4-chapters/1');
  assert.match(t.surveyed, /^\d{4}-\d{2}-\d{2}$/);
  assert.deepEqual(t.chapters.map((c) => c.slug).sort(), reg.chapters.map((c) => c.slug).sort());
  assert.equal(t.listed, reg.chapters.length);
  assert.ok(t.read <= t.listed && t.served <= t.read);
});
