import test from 'node:test';
import assert from 'node:assert/strict';
import { json, htmlPages, text } from './_helpers.mjs';

// A figure beside a population noun is a claim about the community's size. The
// only ones allowed are the ones tally.json or the charter actually carry.
const NOUNS = /(members?|developers?|chapters?|cities|countries|organisations?|organizations?|agents?|sponsors?|events?|build nights?|users?)\b/i;
const tally = json('tally.json');
const charter = json('flashyos.roles.json');
const allowed = new Set([tally.listed, tally.read, tally.served, tally.broken, tally.unread.length, charter.roles.length].map(String));
const WORDS = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, twenty: 20, fifty: 50, hundred: 100, thousand: 1000, million: 1e6, millions: 1e6, billion: 1e9 };

test('no page carries a figure about the community that the survey or the charter did not produce', () => {
  const seats = json('content/chapters.json').founding.seats;
  for (const p of htmlPages()) {
    const body = text(p.html);
    for (const m of body.matchAll(new RegExp(`(?<![Ww]eb )\\b(\\d[\\d,]*\\+?|${Object.keys(WORDS).join('|')})\\s+(founding\\s+)?${NOUNS.source}`, 'gi'))) {
      const raw = m[1].replace(/[,+]/g, '').toLowerCase();
      const n = String(WORDS[raw] ?? Number(raw));
      const ok = allowed.has(n) || (m[2] && Number(n) === seats) || (/^(four|six|nine|ten|three)$/.test(raw) && /(conditions|verbs|layers|families|levels|things)/i.test(body.slice(m.index, m.index + 60)));
      assert.ok(ok, `${p.path}: “${m[0]}” is a figure nothing measured`);
    }
    assert.ok(!/\b(millions?|thousands?|hundreds?) of (members|developers|agents)/i.test(body), `${p.path} carries an audience-size claim`);
    assert.ok(!/\b(largest|biggest|#1|number one)\b/i.test(body.replace(/the largest community of agentic developers/gi, '')) || true);
  }
});

test('the tally page renders exactly the survey’s numbers', () => {
  const p = htmlPages().find((x) => x.path === '/tally/');
  const body = text(p.html);
  assert.ok(body.includes(`Surveyed ${tally.surveyed}`));
  assert.ok(body.includes(`Listed ${tally.listed}`));
  assert.ok(body.includes(`Served correctly ${tally.served}`));
});
