# The stack — reference table

The nine layers of the Web 4 stack, one question each, with the repos that own the answer, the contract they speak, the invariant they enforce, and an honest status per repo. The README carries the short form of this table; this file is the standalone reference, and the machine-readable twin is [stack.json](https://github.com/AgenteLabs/stack.json), served at `/.well-known/stack.json`.

All repos are under `github.com/AgenteLabs`. Statuses are as of 2026-09-28.

| # | Layer | Question | Repos | Contract | Status | Invariant |
|---|---|---|---|---|---|---|
| 1 | Identity | Who are you? | spec [flashyid-spec](https://github.com/AgenteLabs/flashyid-spec); implementation [flashyid](https://github.com/AgenteLabs/flashyid) | `delegation/1` | spec draft; implementation private | Delegation is attenuation, never inheritance. |
| 2 | Graph | What exists? | [agentgraph](https://github.com/AgenteLabs/agentgraph), built out from the [therealm](https://github.com/AgenteLabs/therealm) `realm/1` registry | `graph/1` | draft | Every edge cites a source; no self-attestation. |
| 3 | Discovery | Who can accomplish this intent? | spec [intent-spec](https://github.com/AgenteLabs/intent-spec), extracted from the live implementation [intentmesh](https://github.com/AgenteLabs/intentmesh) | `intent/1` | spec draft; implementation private | Visibility has no override; expiry is computed, never input. |
| 4 | Trust | Should I deal with you? | routing [magician](https://github.com/AgenteLabs/magician); standing [Rites-Network](https://github.com/AgenteLabs/Rites-Network); portable attestation TrustGraph | `trust/1`, `ritual/1` | routing private; standing private; TrustGraph planned, not yet a repo | Standing comes from what others assert; the ladder is climbed by transition, never by assertion. |
| 5 | Gateway | How do I connect to the old web? | open specs [agent-wellknown](https://github.com/AgenteLabs/agent-wellknown) and [agent-dns](https://github.com/AgenteLabs/agent-dns); commercial service [bastion](https://github.com/AgenteLabs/bastion) | `agent/1`, `agent-dns/1` | specs draft; service private-intended | The protocol is vendor-neutral; the product implements it. |
| 6 | Representation | How is the org shown to machines? | [aao](https://github.com/AgenteLabs/aao) — the AAO manifest and seven-question conformance | `aao/0.1` | private | One manifest per organisation; conformance is answered, not asserted. |
| 7 | Execution | How does it operate? | [flashyos](https://github.com/AgenteLabs/flashyos) (private; its public face is [flashyos.com](https://flashyos.com)), with [flashyos-spec](https://github.com/AgenteLabs/flashyos-spec), [flashyos-tools](https://github.com/AgenteLabs/flashyos-tools), [agentfile](https://github.com/AgenteLabs/agentfile) | `flashyos/1` | private | Agents suggest; humans consent. |
| 8 | Commerce | How does value move? | spec [agentpay](https://github.com/AgenteLabs/agentpay) over the wallet stack [flashyos-wdk](https://github.com/AgenteLabs/flashyos-wdk) and the rails [flashy-rails](https://github.com/AgenteLabs/flashy-rails), [flashy-ledger](https://github.com/AgenteLabs/flashy-ledger), [flashy-contracts](https://github.com/AgenteLabs/flashy-contracts) | `pay-policy/1` | spec draft; wallet and rails private | Money is Minor integer units; a child policy only narrows; a human gate on money is mandatory. |
| 9 | Audit | What happened? | AgentLedger, generalizing the sealed-receipt pattern of [chronicle](https://github.com/AgenteLabs/chronicle); consumer is the notary log in [flashy-network](https://github.com/AgenteLabs/flashy-network) | `action-ledger/1` | planned | Append-only; a correction supersedes, never edits. |

The two invariants without a stated source above (Representation, Execution) are read off the estate's own doctrine rather than a contract clause, and a [map correction](.github/ISSUE_TEMPLATE/map_correction.md) is the right way to tighten them.

## Spanning the layers

| Role | Repo | What it does |
|---|---|---|
| Conformance runner | [conformance-kit](https://github.com/AgenteLabs/conformance-kit) | Runs every protocol's dependency-free checker against a live domain or a checkout |
| Interop lint | [mesh-lint](https://github.com/AgenteLabs/mesh-lint) | Lints the surfaces one layer hands the next, so a contract change is caught where it lands |
| Shared reusable CI | [flashy-infra](https://github.com/AgenteLabs/flashy-infra) | The reusable workflows every estate repository calls |

## Teaching

| Repo | What it is |
|---|---|
| [flashy-docs](https://github.com/AgenteLabs/flashy-docs) | The written guide to the stack |
| [flashy-examples](https://github.com/AgenteLabs/flashy-examples) | Worked examples, one per layer boundary |

## The flow of one query

FlashyID (who am I) → AgentGraph (what exists) → IntentMesh (who can) → TrustGraph (should I) → agent-dns / agent-wellknown / Bastion (how to connect) → AAO (how represented) → FlashyOS (how it operates) → AgentPay / WDK (how value moves) → AgentLedger (what happened).

## Reading a status

- **draft** — a spec exists and is being written against; the contract id may still change.
- **private** — the repo exists and is not public. Private says nothing about licence; see [docs/open-vs-private.md](docs/open-vs-private.md).
- **private-intended** — the repo is meant to stay private once it exists as a product.
- **planned** — named in the architecture and not yet a repo. Nothing serves it; nothing depends on it yet.

No repo on this map is public or launched today. The day one is, its status here changes, and [stack.json](https://github.com/AgenteLabs/stack.json) changes with it.
