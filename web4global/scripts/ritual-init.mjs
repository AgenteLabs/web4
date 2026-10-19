#!/usr/bin/env node
// Creates ritual.fragment.json ONCE, through the vendored kit, so the calendar
// is honest by construction: two liturgies, zero observances. It refuses to
// overwrite — an observance is appended by observe(), never by regeneration.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emptyFragment, addLiturgy } from '../vendor-ritual.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'ritual.fragment.json');
if (existsSync(OUT)) { console.error(`${OUT} exists; observances are appended, never regenerated`); process.exit(1); }
const charter = JSON.parse(readFileSync(join(ROOT, 'flashyos.roles.json'), 'utf8'));
let f = emptyFragment(`org/${charter.slug}`);
f = addLiturgy(f, {
  id: 'build-night', title: 'Build night', cadence: 'monthly',
  rite: ['open the table: what is on it tonight', 'ship or get a step closer, one thing each', 'close: each person says what shipped, in a sentence, on the page', 'record the observance with the page as evidence', 'a second party witnesses with evidence of its own', 'the lead consecrates'],
  published_by: 'person/michael', since: f.generated,
});
f = addLiturgy(f, {
  id: 'chapter-survey', title: 'The chapter survey', cadence: 'weekly',
  rite: ['fetch every listed chapter, cache-busted', 'read the handshake, the charter, the ritual fragment and the chrome', 'classify each as served, broken, unreachable, ambiguous or refused', 'compute ratios over what was read and nothing else', 'publish the tally with its date'],
  published_by: 'person/michael', since: f.generated,
});
writeFileSync(OUT, JSON.stringify(f, null, 2) + '\n');
console.log(`wrote ${OUT}`);
