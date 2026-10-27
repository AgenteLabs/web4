# Contributing

This repository is a map, so a contribution is a correction to what it says, a clarification of how it says it, or a new row when a protocol reaches a new rung. It is not the place for protocol code — that goes in the protocol's own repository, and the map records it afterwards.

## Before you open anything

- Read the status line at the bottom of `README.md`. The map is a snapshot on a date; if you are correcting a status, you are moving that date too.
- Run `npm test`. It needs Node 22 and no install. It fails on a repo name that is not in the allowlist and on a README that does not end on the exact licence line.
- Check `AgenteLabs/stack.json`. It is the machine twin of the human table here, and a change to one is a change to both.

## What a good contribution looks like

**A map correction** says three things: what the map says, what is true, and how you know — a link to the repo, a commit, a served URL. "I believe it launched" is not a correction; "conformance-kit read `example.org/.well-known/intent.json` green on 2026-09-28, here is the run" is. Use the `map correction` issue template.

**A status change** is one commit: the row in `README.md`, the row in `stack.md`, the depth in `ARCHITECTURE.md` if the layer's shape changed, the date on the status line, and the allowlist in `test/links.test.mjs` if a repo was added. Then a matching change against `AgenteLabs/stack.json`.

**A new protocol** joins by the ladder in `docs/joining.md`. It appears on the map at rung 3 (wired into mesh-lint and conformance-kit) with status `draft`, and not before — a spec with no checker is not yet a row.

## What is refused

- A status of `public` or `launched` for any repo the estate licence register has not opened. Visibility is a fact about a GitHub setting and licence is a fact about the register; the map claims neither without reading it.
- A number with no source — an adoption count, an audience size, a "many". If no repository measures it, the map does not carry it.
- A second copy of `stack.json`'s data. The table is the human rendering; the twin is the data; there is no third thing.
- A licence chosen here. The estate register in `tools/estate-licences.mjs` in flashyos decides; this repository does not. It opened this repository as Apache-2.0 (holder Flashy Labs), so the committed `LICENSE` and the `package.json` `license` field reflect that decision — they do not make it, and neither is edited to say anything the register does not.
- A dependency. `package.json` has none and `npm test` runs with no install step.

## Vendoring this generator

The institutional front door is one config-driven, dependency-free generator, built here so the estate's other eight protocol repositories can serve the same door without forking it. A sibling copies exactly these files, unchanged, and brings its own inputs:

**Copied byte-identical (the generator set):**

- `scripts/build-site.mjs` — the generator itself
- `scripts/mesh.mjs` — the flashyos/1 handshake and AAO charter, derived from the charter
- `vendor-stack.mjs` — the `web4/1` checker (itself vendored from [stack.json](https://github.com/AgenteLabs/stack.json))
- `schema/site-config-1.json` — the `site-config/1` contract the generator validates its input against
- `brand/` — the whole Flashy brand kit, with its `MANIFEST.sha256`
- `estate-ring.json` — the live estate ring the footer links (vendored from flashyos)
- `vercel.json` — output directory `site`, no framework

Each carries a drift test that reports **unknown, never pass**, when the source checkout is absent. Change one of these in a sibling and you have forked the door; change it here and re-vendor.

**Brought by each repository (never copied):**

- `site.config.json` — everything property-specific, validated as `site-config/1`
- `.well-known/stack.json` — the byte-identical copy of the shared map
- `flashyos.roles.json` and `directory.fragment.json` — the repository's own charter and node
- `README.md` and `docs/` — the repository's own prose

The generator reads no network at build (`test/build.test.mjs` greps for it) and writes the whole of `site/`; nothing under `site/` is edited by hand.

## Prose

First sentences are the point. Say what a thing is before saying what it is not; say what is true before saying what is planned; and when a sentence starts "This document outlines", delete it and start with the next one.

## Commit messages

One change per commit, named for the map: `map: intent-spec reaches rung 3`, `status: bastion private-intended`, `docs: tighten the audit invariant`. A commit that changes what the map says and one that fixes a typo in how it says it are two commits.
