# Open vs private

The rule is one sentence: **a `*-spec` repository becomes public and open-licensed at its protocol's launch; an implementation or a service stays private, always.** Everything below is what that sentence does and does not mean.

## The three things that are not the same thing

**Visibility** is whether a stranger can read the repository. It is a GitHub setting, per repository, and it is the only one of the three a `private` status on the map describes.

**Licence** is what a reader may do with what they read. It is declared once, for every repository in the estate, in the licence register in flashyos — never inside the repository itself, and never by a file dropped into the tree. A public repository with no licence is readable and not usable; a private repository can carry an open licence that nobody outside can yet exercise. Neither is a contradiction.

**Interoperability** is whether somebody else's software can speak the protocol. It depends on the spec being readable and on a checker existing that the other party can run — and on nothing else. A private implementation interoperates fine with a public spec; that is the entire design.

Conflating the three produces the two mistakes this file exists to prevent: calling a repo "open" because it is public (it may be unlicensed), and calling a protocol "closed" because its reference implementation is private (the spec is what you conform to, not the implementation).

## What goes public, and when

A `*-spec` repository — today [flashyid-spec](https://github.com/AgenteLabs/flashyid-spec), [intent-spec](https://github.com/AgenteLabs/intent-spec), [flashyos-spec](https://github.com/AgenteLabs/flashyos-spec), and the spec-shaped repos [agentgraph](https://github.com/AgenteLabs/agentgraph), [agent-wellknown](https://github.com/AgenteLabs/agent-wellknown), [agent-dns](https://github.com/AgenteLabs/agent-dns) and [agentpay](https://github.com/AgenteLabs/agentpay) — goes public **at that protocol's launch**, which is the top rung of the ladder in [joining.md](joining.md): spec, dependency-free checker, wired into mesh-lint and conformance-kit, one independent adopter. Not before.

At launch, two things happen in this order:

1. The licence register in flashyos records the repository as open-licensed, with its copyright holder.
2. The repository's visibility is flipped to public.

The order is deliberate. A public repository with no register entry is readable under no terms at all, which is worse for an adopter than a private one — they can see it and cannot use it. The register moves first so there is never a moment where the code is visible and the grant is unstated.

**None of the spec repositories is public today.** Every one is `draft` on the map, and the status will read `public` only when the register says so.

## What stays private

Implementations and services: [flashyid](https://github.com/AgenteLabs/flashyid), [intentmesh](https://github.com/AgenteLabs/intentmesh), [magician](https://github.com/AgenteLabs/magician), [Rites-Network](https://github.com/AgenteLabs/Rites-Network), [bastion](https://github.com/AgenteLabs/bastion), [aao](https://github.com/AgenteLabs/aao), [flashyos](https://github.com/AgenteLabs/flashyos), [flashyos-wdk](https://github.com/AgenteLabs/flashyos-wdk), [flashy-rails](https://github.com/AgenteLabs/flashy-rails), [flashy-ledger](https://github.com/AgenteLabs/flashy-ledger), [flashy-contracts](https://github.com/AgenteLabs/flashy-contracts). These stay private at every stage, including after the protocol they implement has launched.

Private is not a temporary state waiting for a reason to open. It is the answer to "which half is the business". An implementation may later be published for a reason somebody can name — but the default is never, and the map does not carry an "opening soon" status because that would be a promise about a decision not taken.

## The dependency direction

A spec repository may depend on nothing private. Its checker imports `node:` builtins only, so the adopter can run it without installing anything from the estate, and it never reads a private implementation to decide what conforms — the spec is upstream of the implementation, and if the implementation refuses something the spec allows, the spec is what needs a line, not the checker.

An implementation may depend on its spec's checker, and should: a private product proving conformance to its own public spec, in its own CI, is how the estate finds the spec drifting before an adopter does.

## Three questions to ask before changing a status

1. **Is it readable by a stranger?** That is visibility, and it is a fact about a GitHub setting — read the setting, not the last person who remembered.
2. **Under what terms?** That is licence, and the answer lives in the register in flashyos. If the register has no entry, the answer is "none", whatever the repository contains.
3. **Can somebody else's code speak it?** That is interoperability, and the answer is "yes" exactly when the spec is readable and the checker runs with no install. It has nothing to do with whether the implementation is visible.

A status on the map that answers one of these while claiming to answer another is the drift this file guards against, and a [map correction](../.github/ISSUE_TEMPLATE/map_correction.md) is how it gets fixed.
