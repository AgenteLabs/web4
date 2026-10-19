#!/usr/bin/env node
// The chapter survey — the only thing allowed to put a chapter count on a page.
//
//   node scripts/chapters-survey.mjs            print the reading
//   node scripts/chapters-survey.mjs --write    also write tally.json
//
// Reads content/chapters.json (the register), fetches each chapter's domain the
// way a stranger would — cache-busted, no cache — and reads the handshake, the
// charter, the ritual fragment and whether the page carries the provenance bar.
// Each chapter is classified `served`, `broken`, or one of the three
// uncountable states vendor-reachability.mjs names; a ratio is computed only
// over the chapters actually read. Unread is never zero. A register with no
// chapter yields an honest empty tally, and the home page renders that.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classify, classifyStatus, UNCOUNTABLE } from './vendor-reachability.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const TALLY = join(ROOT, 'tally.json');
const SURFACES = ['/.well-known/flashyos.json', '/.well-known/flashyos-charter.json', '/.well-known/ritual.json'];

async function fetchText(url, fetchImpl) {
  const bust = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
  try {
    const res = await fetchImpl(bust, { headers: { 'cache-control': 'no-cache' }, redirect: 'follow' });
    const c = classifyStatus(res.status);
    if (c) return { state: c.state, detail: c.why };
    if (!res.ok) return { state: 'broken', detail: `HTTP ${res.status}` };
    return { state: 'served', body: await res.text() };
  } catch (err) {
    const c = classify(err);
    return { state: c.state, detail: c.why };
  }
}

export async function surveyChapter(ch, fetchImpl = globalThis.fetch) {
  const base = `https://${ch.domain}`;
  const page = await fetchText(`${base}/`, fetchImpl);
  if (page.state !== 'served') return { ...ch, state: page.state, detail: page.detail };
  const surfaces = {};
  for (const p of SURFACES) {
    const r = await fetchText(base + p, fetchImpl);
    surfaces[p] = r.state === 'served' ? (safeJson(r.body) ? 'served' : 'broken') : r.state;
  }
  const chrome = /aria-label="Provenance"/.test(page.body) && /on the FlashyOS mesh/.test(page.body);
  const allServed = Object.values(surfaces).every((s) => s === 'served');
  const unread = Object.values(surfaces).some((s) => UNCOUNTABLE.has(s));
  const state = unread ? 'ambiguous' : allServed && chrome ? 'served' : 'broken';
  return { ...ch, state, surfaces, chrome };
}
function safeJson(s) { try { JSON.parse(s); return true; } catch { return false; } }

export function summarise(rows, surveyed) {
  const listed = rows.length;
  const read = rows.filter((r) => !UNCOUNTABLE.has(r.state));
  const served = read.filter((r) => r.state === 'served').length;
  const broken = read.length - served;
  const unread = rows.filter((r) => UNCOUNTABLE.has(r.state)).map((r) => ({ domain: r.domain, state: r.state }));
  return {
    survey: 'web4-chapters/1', surveyed, listed, read: read.length, served, broken, unread,
    ratio: read.length ? Number((served / read.length).toFixed(3)) : null,
    chapters: rows.map((r) => ({ slug: r.slug, city: r.city, region: r.region, domain: r.domain, state: r.state })),
  };
}

export async function survey(fetchImpl = globalThis.fetch, now = new Date()) {
  const reg = JSON.parse(readFileSync(join(ROOT, 'content', 'chapters.json'), 'utf8'));
  const rows = [];
  for (const ch of reg.chapters) rows.push(await surveyChapter(ch, fetchImpl));
  return summarise(rows, now.toISOString().slice(0, 10));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const t = await survey();
  console.log(JSON.stringify(t, null, 2));
  if (process.argv.includes('--write')) { writeFileSync(TALLY, JSON.stringify(t, null, 2) + '\n'); console.log(`wrote ${TALLY}`); }
}
