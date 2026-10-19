# web4.global — the community's front door

A dependency-free generated site. `scripts/build.mjs` renders all of `site/`
from `site.config.json`, `nav.json`, `canon.lock.json`, the charter, the two
record fragments, `tally.json`, the served `stack.json` copy, `content/` and
`brand/`. It reads no network and no clock; `test/build.test.mjs` fails a
byte of drift between a fresh build and the committed `site/`. Edit an input,
rebuild, commit both. Never edit `site/`.

## What makes this directory different

**It is built to leave.** It lives inside the `web4` repository today and is
positioned to become `FlashyLabs/web4-global` by `git subtree split`
(README, *Spinning this out*). So nothing here reaches above its own root:
`test/spinout.test.mjs` fails a script that imports `../../`, the workflow is
at `.github/workflows/ci.yml` inside this directory, and `vercel.json` serves
the committed `site/` with an empty build command. The three tests that
compare vendored files against sibling checkouts report UNKNOWN when the
siblings are absent, never pass.

**One registry.** `nav.json` is the header's five doors, the footer's five
columns, the machine-surfaces band, the sitemap and `llms.txt`.
`test/nav.test.mjs` fails a row no page answers, an external row off the host
allowlist, and a machine path the build did not write.

**The charter is the source.** `flashyos.roles.json` (eight roles, eight of
the ten families, every measure a ratio) is served as the charter, derives the
handshake's capabilities (`scripts/mesh.mjs`, vendored from web4), derives the
directory fragment (`scripts/directory.mjs`), and renders the governance
table. `test/charter.test.mjs` runs flashyos's real conformance suite over the
built `site/` through an injected fetch and expects level two — offline proof
that the files are right, never a claim about the live domain.

**A count is a measurement.** `scripts/chapters-survey.mjs` fetches every
chapter in `content/chapters.json`, classifies each through the vendored
reachability module, and writes `tally.json`; the home page, `/chapters/` and
`/tally/` render that file. `test/figures.test.mjs` fails a page carrying a
population figure the tally or the charter did not produce. The register is
empty until a founding chapter reaches L2 on its own domain and the steward
approves it; the pages say so in those words.

**Terms are linked, never restated.** Prose writes `{{term-key}}`; the
generator renders the owner's canonical and anchor from `canon.lock.json`.
`test/terms.test.mjs` fails a page that says a locked term (or an alias)
without linking its owner, and any source file that types a canonical URL the
lock carries. The answers this property OWNS (Web 4 developer, agentic
developer, Web 4 community, Web 4 chapter, build night, Web 4 hackathon, Web4
Global) carry `DefinedTerm` JSON-LD whose `@id` resolves to an element on the
page; `test/answers.test.mjs` checks that and that no owned term collides with
the estate map.

**The brand is a manifest.** `brand/MANIFEST.sha256` covers every file,
including the six self-hosted woff2 files; `test/brand.test.mjs` verifies each
hash, refuses the estate bolt path and any sibling's accent, and fails a page
that loads a font CDN.

## Commands

```bash
npm run verify     # build + check + test; what CI runs
node scripts/directory.mjs            # re-derive the directory fragment after a charter change
node scripts/chapters-survey.mjs --write   # take a reading; commit tally.json
```

## Rules

- **Re-vendor, never edit** `vendor-ritual.mjs`, `vendor-check-directory.mjs`,
  `scripts/vendor-reachability.mjs`, `scripts/mesh.mjs`, `.well-known/stack.json`.
- **No secret in a file.** `test/hygiene.test.mjs` scans for credential shapes
  and model-vendor names.
- **A commit that changes what a page renders never carries a CI-skip or deploy-skip marker in its subject.** Those markers are for emitters' refresh commits; `test/hygiene.test.mjs` refuses them in the tree.
- **`main` is not necessarily the default branch.** Ask:
  `git symbolic-ref --short refs/remotes/origin/HEAD`.
- **Report what happened, including when it is worse than expected.**
