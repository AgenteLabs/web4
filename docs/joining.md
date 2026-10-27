# How a new protocol joins

A protocol joins the stack by climbing a ladder with five rungs, in order, and it is called a business only from the top one. Each rung is a thing that exists and can be checked, never a milestone somebody declares.

```
5  Business        an accountable owner, a licence entry, a status on the map
4  One adopter     somebody outside the estate conforms, named
3  Wired in        mesh-lint and conformance-kit run its checker
2  Checker         a dependency-free checker refuses what the spec refuses
1  Spec            a written contract with a versioned id
```

## Rung 1 — the spec

Write the contract: what a conforming document or endpoint contains, what it refuses, and what a reader may conclude from it. Give it a versioned id in the estate's form — `<name>/<major>`, as in `intent/1` or `pay-policy/1` — and never the word "latest".

State the invariant as a refusal. "An agent should not make an intent public" is a guideline; "there is no parameter that sets visibility to public" is a spec. If the invariant cannot be written as something a caller has no way to do, the design is not finished.

Name the well-known surface if there is one (`/.well-known/<name>.json`, or a DNS record), and say what a reader learns from it that the reader could not learn from the party itself — a surface that only restates self-description is a page and not a protocol.

Put it in a repository named `<name>-spec` (or `<name>` when the repo is the spec, as [agentgraph](https://github.com/AgenteLabs/agentgraph) and [agentpay](https://github.com/AgenteLabs/agentpay) are). The repo is private at this rung and its status on the map is `draft`.

## Rung 2 — the dependency-free checker

Ship a checker beside the spec that imports `node:` builtins only, installs nothing, and refuses what the spec refuses. It runs as `node check.mjs <path-or-domain>` with no `npm install` before it, because a check that needs an install is a check that can quietly not run.

The checker is the spec's test suite. For every refusal the spec states, there is a fixture the checker rejects, and for every well-known surface, the checker can fetch a live domain and say whether the surface is served — served, not committed. The estate has written "valid charter, served nowhere the checker looks" up as closed three separate times; a checker that reads a file in a checkout and reports the domain conforms is how.

A checker that has to read a private implementation to decide what conforms has the dependency backwards. The spec is upstream.

## Rung 3 — wired into mesh-lint and conformance-kit

Register the checker with [conformance-kit](https://github.com/AgenteLabs/conformance-kit), so a single run against a domain exercises this protocol alongside every other, and with [mesh-lint](https://github.com/AgenteLabs/mesh-lint), so the document this protocol hands to the layer above it is linted at the boundary it crosses.

This is the rung where the protocol becomes part of the stack rather than a repo beside it: the one-query flow in [ARCHITECTURE.md](../ARCHITECTURE.md) gains a step, and the map gains a row with a contract id. The status is still `draft`.

The estate's own properties conform first. Every domain on the mesh that the protocol applies to serves the surface, and conformance-kit reads it green from the live domain. An estate that does not conform to its own protocol is asking an adopter to go first.

## Rung 4 — one independent adopter

Somebody outside the estate conforms, and is named. Their domain serves the surface; conformance-kit reads it; the map records who.

This is the gate on the word "standard". A `*-spec` repo is not called a standard, and is not made public, before this rung — the estate states that rule on its own roadmap pages, and the reason is that a protocol only the author speaks is an internal format with a version number. One adopter is the smallest number that proves the spec is readable by someone who did not write it, which is the only thing "spec" means.

At this rung, the launch happens, in this order: the licence register in flashyos records the spec repo as open-licensed with its copyright holder; then the repository goes public. The implementation, if there is one, stays private ([open-vs-private.md](open-vs-private.md)).

## Rung 5 — the business

Only now is it a business: an accountable owner, a licence entry, a row on the map whose status is no longer `draft`, and a product — private — that is the estate's own implementation. The status on the map records what the adopter conformed to and on what day, and the machine twin [stack.json](https://github.com/AgenteLabs/stack.json) carries the same.

## What the ladder refuses

- **Skipping to the product.** A service with no spec is an agent, and the estate does not own agents ([principles.md](principles.md), first principle).
- **A checker with an install step.** It will not be run by the adopter, and eventually not by us.
- **Calling `draft` anything else.** Until rung 4, the status is `draft`, whatever the code does. A status is a measurement, and "an adopter is close" is not one.
- **Manufacturing the adopter.** An estate property, a sibling brand, or a repository created to conform does not count. The adopter is independent or the rung is not climbed.
- **A launch with no register entry.** Visibility flips after the licence is declared, never before.

## Where a protocol is today

Every contract on the map is at rung 1, 2 or 3 — `draft` — or is planned and not yet at rung 1 (TrustGraph, AgentLedger). None has reached rung 4. That is the honest state, and the map says so rather than rounding up.
