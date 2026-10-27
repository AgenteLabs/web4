# Architecture

Nine layers, one question each, composed so that a single query travels the whole stack and every layer only ever answers its own question. This file is the depth behind [stack.md](stack.md): for each layer, the question, what owns it, the invariant it enforces, the well-known surface where one exists, and whether it exists today or is planned. All repos are under `github.com/AgenteLabs`; statuses are as of 2026-09-28.

## The shape

```
 9  Audit           What happened?                     action-ledger/1   planned
 8  Commerce        How does value move?               pay-policy/1      spec draft
 7  Execution       How does it operate?               flashyos/1        private
 6  Representation  How is the org shown to machines?  aao/0.1           private
 5  Gateway         How do I connect to the old web?   agent/1, agent-dns/1   specs draft
 4  Trust           Should I deal with you?            trust/1, ritual/1 private
 3  Discovery       Who can accomplish this intent?    intent/1          spec draft
 2  Graph           What exists?                       graph/1           draft
 1  Identity        Who are you?                       delegation/1      spec draft
```

Lower layers answer questions higher layers assume. Trust assumes an identity and a graph to route over; commerce assumes a trust decision and an execution context; audit assumes everything below it happened and records that it did. No layer reaches down to change an answer a lower layer gave.

## Layer 1 — Identity: who are you?

**Owns it:** [flashyid-spec](https://github.com/AgenteLabs/flashyid-spec) (contract `delegation/1`, draft) is the spec; [flashyid](https://github.com/AgenteLabs/flashyid) (private) is the implementation — an OIDC provider plus a grant kernel for delegated authority.

**Invariant:** delegation is attenuation, never inheritance. A grant may only ever carry a subset of the granter's scopes; a child can never hold authority its parent lacks. Enforcement runs before minting: the gate that says ALLOW, DENY or ESCALATE exists before anything mints authority, because identity nothing checks is theatre. Assertions bind subject to holder — verify the chain, not just the signature.

**Well-known surface:** none declared by the spec yet. The implementation is an OIDC provider, so standard OIDC discovery and a JWKS are what a relying party reads today; whether `delegation/1` adds a surface of its own is a spec decision still open.

**Exists / planned:** the spec is draft; the implementation exists and is private.

## Layer 2 — Graph: what exists?

**Owns it:** [agentgraph](https://github.com/AgenteLabs/agentgraph) (contract `graph/1`, draft), built out from the [therealm](https://github.com/AgenteLabs/therealm) `realm/1` registry — the universal graph of organisations, agents, surfaces and relations that every other layer resolves names against.

**Invariant:** every edge cites a source; no self-attestation. An organisation can declare what it is, but an edge between two parties exists because a source outside the party it favours says so. A graph built from self-description is a directory of claims, and this layer refuses to be one.

**Well-known surface:** none of its own yet. The graph is fed from the surfaces the other layers publish (the AAO manifest, the intent and ritual documents, the agent record) and cites them as sources.

**Exists / planned:** `realm/1` in therealm exists; `graph/1` in agentgraph is draft.

## Layer 3 — Discovery: who can accomplish this intent?

**Owns it:** [intent-spec](https://github.com/AgenteLabs/intent-spec) (contract `intent/1`, draft), extracted from the live implementation [intentmesh](https://github.com/AgenteLabs/intentmesh) (private). Discovery is by intent, not by keyword: a party publishes what it wants and what it can do, and the mesh matches on that.

**Invariant:** visibility has no override; expiry is computed, never input. There is no parameter that makes a private intent public — an agent cannot call something that does not exist. Expiry derives from a renewal date the publisher sets; any spelling of "expires" in the input is refused, so nothing can be kept alive by asserting that it is.

**Well-known surface:** `/.well-known/intent.json` — the intent document a party publishes at its own domain.

**Exists / planned:** the implementation is live and private; the spec is being extracted from it and is draft. The spec follows the implementation here on purpose — it documents behaviour that already refuses, rather than proposing behaviour that might.

## Layer 4 — Trust: should I deal with you?

**Owns it:** three things, deliberately separate.

- **Routing** — [magician](https://github.com/AgenteLabs/magician) (contract `trust/1`, private): trust routing and consent-gated introductions with sealed outcomes. A request to cross a relationship lands proposed; only the owner of the edge consents; an introduction needs every hop.
- **Standing** — [Rites-Network](https://github.com/AgenteLabs/Rites-Network) (contract `ritual/1`, private): where a party stands on a ladder, and how it climbs.
- **Portable attestation** — TrustGraph: a trust statement that travels with the party rather than living in one routing graph. Planned, not yet a repo.

**Invariant:** standing comes from what others assert; the ladder is climbed by transition, never by assertion. Nothing a party does alone moves its standing — authority is what others say, and the measured figure counts only sealed outcomes. Every figure carries a register (measured, asserted, estimated), and a combination is as weak as its weakest input.

**Well-known surface:** `/.well-known/ritual.json` — a party's standing document.

**Exists / planned:** routing and standing exist and are private; TrustGraph is planned. The one-query flow names TrustGraph as the "should I" step because portable attestation is what a stranger can check; until it exists, the answer to "should I" is read from routing and standing directly.

## Layer 5 — Gateway: how do I connect to the old web?

**Owns it:** two open specs and one commercial service.

- [agent-wellknown](https://github.com/AgenteLabs/agent-wellknown) (contract `agent/1`, draft): how a domain says it has an agent and how to reach it.
- [agent-dns](https://github.com/AgenteLabs/agent-dns) (contract `agent-dns/1`, draft): the same statement in DNS, for a resolver that never fetches a page.
- [bastion](https://github.com/AgenteLabs/bastion) (private-intended): the service that fronts an existing web property with an agent gateway that speaks both.

**Invariant:** the protocol is vendor-neutral; the product implements it. Nothing in `agent/1` or `agent-dns/1` names bastion, and a competitor's gateway conforming to both is a success of the layer, not a threat to it.

**Well-known surface:** `/.well-known/agent` — the agent record at a domain.

**Exists / planned:** both specs are draft; bastion is intended to be private once it is a product.

## Layer 6 — Representation: how is the org shown to machines?

**Owns it:** [aao](https://github.com/AgenteLabs/aao) (contract `aao/0.1`, private) — the Agentic Autonomous Organisation manifest and its seven-question conformance. An AAO charter declares the organisation's roles and what each may do; the handshake a stranger reads derives its capabilities from those roles, never restating them.

**Invariant:** one manifest per organisation, and conformance is answered by a checker against what the domain actually serves — a valid charter served nowhere the checker looks is not conformance. This is the estate's most-relearned lesson: every property once held a valid charter and served it in no place a stranger would read.

**Well-known surface:** `/.well-known/flashyos.json` — the mesh handshake, with capabilities derived from the charter.

**Exists / planned:** exists, private, at contract version 0.1 — the only sub-1 contract on the map, because the seven questions are still settling.

## Layer 7 — Execution: how does it operate?

**Owns it:** [flashyos](https://github.com/AgenteLabs/flashyos) (private), the operating layer the estate's organisations run on, with [flashyos-spec](https://github.com/AgenteLabs/flashyos-spec) (the written contract), [flashyos-tools](https://github.com/AgenteLabs/flashyos-tools) (the instruments) and [agentfile](https://github.com/AgenteLabs/agentfile) (how an agent is declared to the OS).

**Invariant:** agents suggest; humans consent. An agent proposes work and a person approves it, at every level of autonomy. The consent gate is structural — there is no path that constructs an approved action directly.

**Well-known surface:** `/.well-known/flashyos.json`, shared with Representation: the handshake says both how the organisation is represented and that it runs on the mesh.

**Exists / planned:** exists, private.

## Layer 8 — Commerce: how does value move?

**Owns it:** [agentpay](https://github.com/AgenteLabs/agentpay) (contract `pay-policy/1`, draft) is the spec for what an agent may spend under what policy. It sits over the wallet stack [flashyos-wdk](https://github.com/AgenteLabs/flashyos-wdk) and the rails — [flashy-rails](https://github.com/AgenteLabs/flashy-rails) (settlement and the consent gate), [flashy-ledger](https://github.com/AgenteLabs/flashy-ledger) (the append-only multi-asset engine where the money invariants live) and [flashy-contracts](https://github.com/AgenteLabs/flashy-contracts) (on-chain) — all private.

**Invariant:** money is Minor integer units; a child policy only narrows; a human gate on money is mandatory. Every amount is a whole number of minor units, never a float and never a bigint mixed with one. A delegated spending policy can cap lower, expire sooner or restrict purpose — never widen. And no value leaves a holder without a consent token bound to that exact draft: an agent may draft, only a human executes.

**Well-known surface:** none of its own yet; a pay policy is expected to travel with the identity grant (layer 1) and the agent record (layer 5) rather than at a separate path. That is a spec decision still open in `pay-policy/1`.

**Exists / planned:** the spec is draft; the wallet stack and rails exist and are private.

## Layer 9 — Audit: what happened?

**Owns it:** AgentLedger, contract `action-ledger/1` — planned, not yet a repo. It generalizes the sealed-receipt pattern of [chronicle](https://github.com/AgenteLabs/chronicle): an action produces a receipt, the receipt is hashed over canonical bytes, and the hash is what a stranger checks. The consumer is the notary log in [flashy-network](https://github.com/AgenteLabs/flashy-network), which folds content-free leaves from every source into one append-only transparency log.

**Invariant:** append-only; a correction supersedes, never edits. A wrong record stays in the log and a later record says it was wrong. A leaf reveals that an action of a kind happened at a time, and never who — the hash is over a non-identifying projection.

**Well-known surface:** none for `action-ledger/1` yet. The pattern it generalizes already exists: a source serves a content-free notary fragment and the consumer folds it.

**Exists / planned:** chronicle and the notary log exist; AgentLedger is planned.

## Composition: how the layers hand off

One query, end to end, and what crosses each boundary:

1. **FlashyID → AgentGraph.** An identity, with a chain of attenuated grants. The graph resolves the identity to a node and never widens what the grant carries.
2. **AgentGraph → IntentMesh.** A set of nodes and sourced edges. Discovery matches intents only among parties the graph says exist.
3. **IntentMesh → TrustGraph.** Candidates who can. Trust answers whether to, from others' assertions about them — never from the candidate's own.
4. **TrustGraph → agent-dns / agent-wellknown / Bastion.** A party worth dealing with. Gateway resolves how to reach it, on the old web if that is where it lives.
5. **Gateway → AAO.** A reachable domain. Representation says what that organisation is, and which roles may do what.
6. **AAO → FlashyOS.** A charter. Execution runs the work under it, with a human consenting at the gate.
7. **FlashyOS → AgentPay / WDK.** Work that costs something. Commerce moves value under a policy that only narrows, through a gate only a human passes.
8. **AgentPay → AgentLedger.** A settled action. Audit records that it happened, sealed and append-only, and the notary log makes the record checkable by a stranger.

Two rules hold at every boundary. **Downward reads only:** a layer reads the layer below it and never writes to it — the ledger cannot change a trust decision, trust cannot mint an identity. **Absence is labelled, never rendered as zero:** a layer that cannot read its input says so, because an unreadable graph rendered as an empty one is a claim about the network made from a fact about one process.

## Tooling across layers

- [conformance-kit](https://github.com/AgenteLabs/conformance-kit) runs every protocol's dependency-free checker, against a checkout or a live domain. It is what the spec-first ladder ([docs/joining.md](docs/joining.md)) wires a new protocol into.
- [mesh-lint](https://github.com/AgenteLabs/mesh-lint) lints the documents one layer hands the next, so a contract change is caught at the boundary it crosses.
- [flashy-infra](https://github.com/AgenteLabs/flashy-infra) holds the reusable CI every estate repository calls.

Teaching lives in [flashy-docs](https://github.com/AgenteLabs/flashy-docs) and [flashy-examples](https://github.com/AgenteLabs/flashy-examples).

## What exists and what is planned

| Exists (private unless noted) | Draft spec | Planned, not a repo |
|---|---|---|
| flashyid, intentmesh, magician, Rites-Network, aao, flashyos, flashyos-spec, flashyos-tools, agentfile, flashyos-wdk, flashy-rails, flashy-ledger, flashy-contracts, chronicle, flashy-network, therealm, conformance-kit, mesh-lint, flashy-infra, flashy-docs, flashy-examples | flashyid-spec, agentgraph, intent-spec, agent-wellknown, agent-dns, agentpay | TrustGraph, AgentLedger; bastion is private-intended and not yet a product |

Nothing on this map is public or launched today. The machine-readable form of this table is [stack.json](https://github.com/AgenteLabs/stack.json), served at `/.well-known/stack.json`; when the two disagree, the fix is a [map correction](.github/ISSUE_TEMPLATE/map_correction.md) filed against whichever is stale, and never a second copy.
