import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SITE = join(ROOT, 'site');
export const json = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
export function walk(dir, acc = []) {
  for (const n of readdirSync(dir)) { const p = join(dir, n); statSync(p).isDirectory() ? walk(p, acc) : acc.push(p); }
  return acc;
}
export const htmlPages = () => walk(SITE).filter((p) => p.endsWith('.html')).map((p) => ({ path: '/' + relative(SITE, p).replace(/index\.html$/, ''), file: p, html: readFileSync(p, 'utf8') }));
export const text = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
/** A sibling checkout, or null. Tests that compare against one report UNKNOWN rather than passing when it is absent. */
export const sibling = (name) => { for (const c of [join(ROOT, '..', '..', name), join(ROOT, '..', name)]) if (existsSync(c)) return c; return null; };
export const unknown = (t, what) => { t.diagnostic(`UNKNOWN — ${what} is not checked out beside this repository; drift not checked, not passed`); };
