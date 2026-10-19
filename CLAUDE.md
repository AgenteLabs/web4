# web4 — the human front door to the stack

The map of the Web 4 stack (`README.md`, `stack.md`, `ARCHITECTURE.md`), the estate's doctrine (`docs/`), and the rule for how a protocol joins (`docs/joining.md`) — rendered into an institutional front door by one dependency-free, config-driven generator. The repository holds no protocol code, but it is not prose-only: `scripts/build-site.mjs` generates the whole of `site/`, `vendor-stack.mjs` is the `web4/1` checker that validates the served map, and `test/` is the drift suite that pins both.

## What makes this repository different

**The map is the product; the site is generated from it.** Nothing here runs a protocol. `scripts/build-site.mjs` renders all of `site/` from `site.config.json` (validated as `site-config/1` against `schema/site-config-1.json`), the served `.well-known/stack.json` copy, the AAO charter and the vendored brand kit. It reads no network at build and writes every file under `site/`; nothing under `site/` is hand-edited. The other eight protocol repositories vendor this generator unchanged (`CONTRIBUTING.md`).

**The nine-layer table is rendered from data, never typed.** The site's table is read from the `.well-known/stack.json` copy this repository serves, so the page and the machine twin cannot disagree.

**The machine twin is stack.json, and it lives elsewhere.** `FlashyLabs/stack.json`, served at `/.well-known/stack.json`, is the machine-readable form of the table. This repository links to it and serves a byte-identical copy; it never grows a second copy of that data.

**Statuses are honest and per-repo.** Every row in the stack table carries the status of that repo on the date in the README's status line — `draft`, `private`, `private-intended` or `planned`. No repo on the map is public or launched today, and the map never says one is until the estate licence register in flashyos has opened it and an independent adopter is named (`docs/joining.md`). "Nearly" is not a status. When a status moves, change the date on the status line in the same commit.

**Repo names are a test, not a habit.** `test/links.test.mjs` holds the single allowlist of every repository the map names, checks every `github.com/FlashyLabs/<name>` link and every backticked repo token in `README.md` and `stack.md` against it, and checks the README ends on the exact licence line. Adding a repo to the map means adding it to the allowlist in the same commit; a typo fails `npm test`.

**No fabricated numbers.** No adoption claims, no counts of organisations or agents, no "millions". A figure appears here only when a named repository measures it and this file can say which.

## Commands

```bash
npm test                                             # node --test "test/**/*.test.mjs" — dependency-free, Node 22, no install step
node scripts/build-site.mjs                          # regenerate site/ from site.config.json + the inputs
node vendor-stack.mjs check .well-known/stack.json   # the served map validates against web4/1
```

There is no framework and no dependency. `package.json` has no `dependencies` key and must stay that way. `site/` is generated output that Vercel serves (`vercel.json`); `test/build.test.mjs` fails if a fresh build drifts from the committed `site/` by a byte, so edit the generator and its inputs, never `site/`.

## Vendored files — re-vendor, never hand-edit

`vendor-stack.mjs` (the `web4/1` checker), `schema/site-config-1.json`, `brand/`, and `estate-ring.json` are byte-identical copies from their canonical sources (`FlashyLabs/stack.json`, flashyos). Each carries a drift test that reports **unknown, never pass**, when the source checkout is absent. `estate-ring.json` is the live estate ring the footer links, vendored from `flashyos/apps/marketing/src/lib/estateRing.ts`; `test/estate-ring.test.mjs` compares it row-for-row against that source. Regenerate a vendored file from its source — never hand-edit it.

## Editing the map

- A new layer or repo: add the row to `README.md` and `stack.md`, the depth to `ARCHITECTURE.md`, the name to the allowlist in `test/links.test.mjs`, and bump the date on the status line. Then file the same change against `FlashyLabs/stack.json`, and re-copy `.well-known/stack.json`.
- A status change: same date bump, same twin update. Never `public` or `launched` unless the register and the adopter exist.
- A correction: `.github/ISSUE_TEMPLATE/map_correction.md` is the form. It asks what the map says, what is true, and how you know.
- Anything that changes what a page renders (the map, the config, the ring, the brand): rebuild `site/` in the same commit, and do not carry `[skip ci]` / `[vercel skip]`.

## web4global/ — the community site, built to leave

`web4global/` is web4.global, the Web4 Global community's institutional site: its own generator, charter, record fragments, brand kit, tests, workflow and `vercel.json`, self-contained by test and positioned to become `FlashyLabs/web4-global` by `git subtree split` (its README says how). Nothing in it imports this repository; `.github/workflows/web4global.yml` runs its gate here until the split. Read `web4global/CLAUDE.md` before touching it.

## House rules — true in every repository in this estate

**`main` is not necessarily the default branch.** Ask, every time: `git symbolic-ref --short refs/remotes/origin/HEAD`.

**Say which branch you measured.** Reading the working tree tells you about your checkout, not the repository.

**Re-vendor before you trust a vendored change.** Files named `vendor-*.mjs` are byte-identical copies; a stale copy disagrees silently.

**No secret in a file, a repo, or an artifact.** Secret Manager only.

**The licence is declared once**, in `tools/estate-licences.mjs` in flashyos — the authority. It opened this repository as Apache-2.0 (holder Flashy Labs); the committed `LICENSE` and the `package.json` `license` field reflect that decision, they do not make it.

**A generated file is regenerated, never hand-edited.**

**Report what happened, including when it is worse than expected.**
