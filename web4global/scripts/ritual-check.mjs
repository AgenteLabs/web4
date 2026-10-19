#!/usr/bin/env node
// Validates the committed ritual/1 fragment with the vendored checker.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkFragment } from '../vendor-ritual.mjs';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const f = JSON.parse(readFileSync(join(ROOT, 'ritual.fragment.json'), 'utf8'));
const problems = checkFragment(f);
if (problems.length) { console.error(`ritual/1: refused —\n  ${problems.join('\n  ')}`); process.exit(1); }
console.log(`ritual/1 ok — ${f.liturgies.length} liturgies, ${f.observances.length} observances`);
