#!/usr/bin/env node
// ritual/1 — the vendored validator and transition kit, dependency-free.
//
// Copied byte-identical into any repository that keeps a rite calendar. It
// imports nothing but `node:` builtins so it runs before an install, which is
// how every record format in this estate travels.
//
// The estate keeps two tenses: backlog/1 is the future and shipped/1 is the
// past. ritual/1 is the missing present tense — the recurring, witnessed,
// consequence-bearing act, happening now, on a rhythm a stranger can check.
//
// Four refusals are the whole reason this exists as code rather than as a
// document. Each is enforced in the validator AND in the transition function,
// because a caller that builds a fragment in memory and never validates it
// must still be unable to break the rule:
//
//   1. Agents observe; humans consecrate. A performer is an agent/ acting
//      for an org/ or person/ who answers; a consecration names a person/
//      and nothing else. There is no code path by which an agent approves
//      an observance into consequence.
//
//   2. Unwitnessed practice moves nothing. An observance reaches witnessed
//      only when a party who is neither the performer nor its principal
//      signs with a basis of their OWN — a copy of the performer's evidence
//      is a citation loop, not a witness. Consecration of the unwitnessed
//      is refused outright.
//
//   3. An observance carries no value and no standing. No money words, no
//      amounts, no scores. Accrual belongs to reward/1 and standing to the
//      engines that own it; keeping them out of this format means the
//      coupling has to be *written* by somebody rather than merely permitted.
//
//   4. The log is append-only. A correction is a new observance that
//      supersedes the old one; nothing is edited, nothing is deleted.
//
// Usage — the whole join kit, in the one file that travels:
//   node vendor-ritual.mjs init --subject org/you --person person/you
//   node vendor-ritual.mjs liturgy <fragment.json> --id daily-office --title "The Daily Office" --cadence daily --rite "step one|step two" --by person/you
//   node vendor-ritual.mjs observe <fragment.json> --id o1 --liturgy daily-office --performer agent/you-ci --for org/you --evidence https://…
//   node vendor-ritual.mjs witness <fragment.json> <observance-id> --by org/them --basis https://…
//   node vendor-ritual.mjs consecrate <fragment.json> <observance-id> --by person/you
//   node vendor-ritual.mjs check <fragment.json | https://domain>
//   node vendor-ritual.mjs metrics <fragment.json>
//
// `check https://domain` fetches /.well-known/ritual.json the way a stranger
// would, because a fragment green in a checkout and 404 at the domain reads as
// success everywhere except where the stranger stands.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

export const CONTRACT = 'ritual/1'

/** The rhythms a liturgy may keep. A closed list, so a new one is a decision. */
export const CADENCES = ['daily', 'weekly', 'monthly', 'seasonal', 'once']

/** The ladder an observance climbs. Order is meaning: no state is skippable upward. */
export const STATES = ['performed', 'witnessed', 'consecrated', 'void']

/**
 * Field names refused outright, at any depth.
 *
 * reward/1 refuses money because a figure beside a balance is a redemption
 * promise. This format refuses money AND amounts for a further reason: an
 * observance that carries value is a slot machine with liturgical vocabulary,
 * and the coupling to accrual must live in reward/1 where its caps are.
 */
export const FORBIDDEN = [
  'usd', 'cad', 'fiat', 'price', 'value', 'valuation', 'worth',
  'redeemable', 'cash', 'currency', 'fx', 'rate', 'nav', 'msrp',
  'amount', 'aurum', 'gold', 'reward', 'points', 'payout',
]

/**
 * Derived elsewhere, never asserted here.
 *
 * Standing comes from what others assert about sealed outcomes — the magician
 * doctrine. An observance that could write its own score would be unilateral
 * activity moving standing, the exact thing the witness requirement exists
 * to refuse.
 */
const DERIVED_ONLY = ['standing', 'streak', 'rank', 'score', 'level', 'balance']

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
const HTTPS = /^https:\/\//

function walkKeys(node, path, out) {
  if (Array.isArray(node)) {
    node.forEach((v, i) => walkKeys(v, `${path}[${i}]`, out))
    return
  }
  if (!isObject(node)) return
  for (const [k, v] of Object.entries(node)) {
    const lower = k.toLowerCase()
    if (FORBIDDEN.includes(lower)) out.push(`${path}.${k}: an observance carries no value — accrual belongs to reward/1, see SPEC.md §4`)
    if (DERIVED_ONLY.includes(lower)) out.push(`${path}.${k}: standing is derived from what others assert, never carried by the act itself`)
    walkKeys(v, `${path}.${k}`, out)
  }
}

function checkWitnessBlock(w, at, performer, principal, evidence, problems) {
  if (!isObject(w)) { problems.push(`${at}.witness must be an object`); return }
  if (typeof w.by !== 'string' || !/^(org|person)\//.test(w.by)) {
    problems.push(`${at}.witness.by must be an org/ or person/ id — an agent cannot witness, because a witness answers for what it signs`)
  }
  if (w.by === performer || w.by === principal) {
    problems.push(`${at}.witness.by is the performer or its principal — self-witness is unwitnessed practice with a signature`)
  }
  if (typeof w.basis !== 'string' || !HTTPS.test(w.basis)) {
    problems.push(`${at}.witness.basis must be a URL a stranger can open — a witness carries its OWN basis; a copy of the performer's evidence is a citation loop`)
  } else if (typeof evidence === 'string' && w.basis.trim() === evidence.trim()) {
    // The line above said this in a comment for as long as the format has
    // existed and nothing enforced it: a witness whose basis IS the
    // performer's evidence validated clean. That is one source counted twice
    // and wearing a second signature, which is worse than no witness at all
    // because it looks like one. Exact equality only — a different URL is a
    // different page, and guessing at near-copies would refuse honest
    // witnesses. Whether two witnesses lean on ONE basis across a whole
    // estate is a cross-fragment question this checker cannot see; that half
    // lives in the estate tool, which reports it as `copied`.
    problems.push(`${at}.witness.basis is the performer's own evidence — a copy is not a witness, it is one source counted twice`)
  }
  if (typeof w.at !== 'string' || !ISO.test(w.at)) problems.push(`${at}.witness.at must be an ISO timestamp`)
}

function checkConsecrationBlock(c, at, problems) {
  if (!isObject(c)) { problems.push(`${at}.consecration must be an object`); return }
  if (typeof c.by !== 'string' || !c.by.startsWith('person/')) {
    problems.push(`${at}.consecration.by must be a person/ id — agents observe, humans consecrate, and there is no third party`)
  }
  if (typeof c.at !== 'string' || !ISO.test(c.at)) problems.push(`${at}.consecration.at must be an ISO timestamp`)
}

/**
 * Every problem, not the first.
 *
 * A validator that stops at the first fault makes a person fix a fragment one
 * run at a time, which is how a fragment ships with the fourth fault still in
 * it.
 */
export function checkFragment(f) {
  const problems = []
  if (!isObject(f)) return ['the fragment is not an object']
  if (f.contract !== CONTRACT) problems.push(`contract must be "${CONTRACT}"`)
  if (typeof f.subject !== 'string' || !/^(org|person)\//.test(f.subject)) {
    problems.push('subject must be an org/ or person/ id — a calendar belongs to somebody who can answer for it')
  }
  if (typeof f.generated !== 'string' || !ISO.test(f.generated)) problems.push('generated must be an ISO timestamp')

  if (!Array.isArray(f.liturgies)) problems.push('liturgies must be an array')
  if (!Array.isArray(f.observances)) problems.push('observances must be an array')
  if (!Array.isArray(f.liturgies) || !Array.isArray(f.observances)) return problems

  // The whole document, depth zero included: "at any depth" was false at the
  // root until an audit probe put a payout beside the observances and
  // validated clean.
  walkKeys(f, 'fragment', problems)

  const liturgyIds = new Set()
  for (const [i, l] of f.liturgies.entries()) {
    const at = `liturgies[${i}]`
    if (!isObject(l)) { problems.push(`${at} is not an object`); continue }
    if (typeof l.id !== 'string' || !l.id) problems.push(`${at}.id is required`)
    else if (liturgyIds.has(l.id)) problems.push(`${at}.id "${l.id}" appears twice`)
    else liturgyIds.add(l.id)
    if (typeof l.title !== 'string' || !l.title) problems.push(`${at}.title is required`)
    if (!CADENCES.includes(l.cadence)) problems.push(`${at}.cadence must be one of: ${CADENCES.join(', ')}`)
    if (!Array.isArray(l.rite) || l.rite.length === 0 || !l.rite.every((s) => typeof s === 'string' && s)) {
      problems.push(`${at}.rite must be a non-empty list of steps — a liturgy with no rite is a name with no practice`)
    }
    if (typeof l.published_by !== 'string' || !l.published_by.startsWith('person/')) {
      problems.push(`${at}.published_by must be a person/ id — publishing a liturgy asks agents to act, and a person answers for the asking`)
    }
    if (typeof l.since !== 'string' || !ISO.test(l.since)) problems.push(`${at}.since must be an ISO timestamp`)
  }

  const obsIds = new Set()
  for (const [i, o] of f.observances.entries()) {
    const at = `observances[${i}]`
    if (!isObject(o)) { problems.push(`${at} is not an object`); continue }
    if (typeof o.id !== 'string' || !o.id) problems.push(`${at}.id is required`)
    else if (obsIds.has(o.id)) problems.push(`${at}.id "${o.id}" appears twice — the log is append-only, a correction is a new observance`)
    else obsIds.add(o.id)

    if (typeof o.liturgy !== 'string' || !liturgyIds.has(o.liturgy)) {
      problems.push(`${at}.liturgy "${o.liturgy ?? ''}" is not a liturgy in this fragment — an observance of nothing is activity, not practice`)
    }
    if (typeof o.performer !== 'string' || !o.performer.startsWith('agent/')) {
      problems.push(`${at}.performer must be an agent/ id — a person's own act is work, recorded in shipped/1; ritual/1 records what agents observe`)
    }
    if (typeof o.for !== 'string' || !/^(org|person)\//.test(o.for)) {
      problems.push(`${at}.for must be an org/ or person/ id — an agent acts for somebody, and the somebody answers`)
    }
    if (typeof o.at !== 'string' || !ISO.test(o.at)) problems.push(`${at}.at must be an ISO timestamp`)
    if (typeof o.recorded !== 'string' || !ISO.test(o.recorded)) problems.push(`${at}.recorded must be an ISO timestamp`)
    if (ISO.test(o.at ?? '') && ISO.test(o.recorded ?? '') && Date.parse(o.recorded) < Date.parse(o.at)) {
      problems.push(`${at}.recorded precedes ${at}.at — an observance cannot be written before the act it records`)
    }
    if (typeof o.evidence !== 'string' || !HTTPS.test(o.evidence)) {
      problems.push(`${at}.evidence must be a URL a stranger can open — an observance without evidence is a claim, and this format does not carry claims`)
    }
    if (!STATES.includes(o.state)) problems.push(`${at}.state must be one of: ${STATES.join(', ')}`)

    // Which blocks each state has EARNED. A block present on a state that has
    // not earned it is refused, and a present block is validated whatever the
    // state — an audit probe once parked an agent/ consecrator on a witnessed
    // observance and validated clean, because only 'performed' was checked.
    const mayCarry = { performed: [], witnessed: ['witness'], consecrated: ['witness', 'consecration'], void: [] }[o.state] ?? []
    for (const block of ['witness', 'consecration']) {
      if (o[block] !== undefined && !mayCarry.includes(block)) {
        problems.push(`${at} is ${o.state} but carries a ${block} block — the ladder is climbed by transition, never by assertion`)
      }
    }
    if (o.witness !== undefined) checkWitnessBlock(o.witness, at, o.performer, o.for, o.evidence, problems)
    if (o.consecration !== undefined) checkConsecrationBlock(o.consecration, at, problems)

    if ((o.state === 'witnessed' || o.state === 'consecrated') && o.witness === undefined) {
      problems.push(`${at} is ${o.state} with no witness block — unwitnessed practice moves nothing`)
    }
    if (o.state === 'consecrated' && o.consecration === undefined) {
      problems.push(`${at} is consecrated with no consecration block — nothing reaches consequence without a named human`)
    }

    if (o.state === 'void') {
      if (typeof o.supersedes !== 'string' || !o.supersedes) {
        problems.push(`${at} is void but names no observance it supersedes — a void that names nothing is a deletion with better manners`)
      } else if (o.supersedes === o.id) {
        problems.push(`${at}.supersedes names itself`)
      }
    } else if (o.supersedes !== undefined) {
      // A correction IS a void. A live observance pointing at another would
      // double-count both halves of the correction in the raw figure — the
      // exact number this format calls the anti-metric.
      problems.push(`${at} carries supersedes but is ${o.state} — only a void supersedes, because a correction that stays live counts twice`)
    }
    if (typeof o.supersedes === 'string' && o.supersedes && o.supersedes !== o.id && !f.observances.some((x) => x.id === o.supersedes)) {
      problems.push(`${at}.supersedes "${o.supersedes}" is not in this log`)
    }
  }
  return problems
}

/** Append a performed observance. The only door into the log. */
export function observe(f, o) {
  for (const k of ['witness', 'consecration', 'state']) {
    if (o[k] !== undefined) {
      throw new Error(`ritual/1: observe() sets state itself — an observance arrives performed, and "${k}" is earned by transition, never carried in`)
    }
  }
  const next = { ...f, observances: [...f.observances, { ...o, state: 'performed' }] }
  const problems = checkFragment(next)
  if (problems.length) throw new Error(`ritual/1: refused —\n  ${problems.join('\n  ')}`)
  return next
}

/**
 * A second party signs. Refuses the performer and its principal: self-witness
 * is unwitnessed practice with a signature.
 */
export function witness(f, id, w) {
  const o = f.observances.find((x) => x.id === id)
  if (!o) throw new Error(`ritual/1: no observance "${id}" in this log`)
  if (o.state !== 'performed') throw new Error(`ritual/1: observance "${id}" is ${o.state}, not performed`)
  const next = {
    ...f,
    observances: f.observances.map((x) => (x.id === id ? { ...x, state: 'witnessed', witness: w } : x)),
  }
  const problems = checkFragment(next)
  if (problems.length) throw new Error(`ritual/1: refused —\n  ${problems.join('\n  ')}`)
  return next
}

/**
 * A named human confers consequence. Refuses anything that is not a person/,
 * and refuses the unwitnessed outright — there is no code path from performed
 * to consecrated.
 */
export function consecrate(f, id, c) {
  const o = f.observances.find((x) => x.id === id)
  if (!o) throw new Error(`ritual/1: no observance "${id}" in this log`)
  if (o.state === 'performed') {
    throw new Error('ritual/1: unwitnessed practice moves nothing — an observance is witnessed before it is consecrated, with no exception for anybody')
  }
  if (o.state !== 'witnessed') throw new Error(`ritual/1: observance "${id}" is ${o.state}, not witnessed`)
  if (typeof c?.by !== 'string' || !c.by.startsWith('person/')) {
    throw new Error('ritual/1: agents observe, humans consecrate — consecration.by must be a person/ id, and no org, agent or flag substitutes for one')
  }
  const next = {
    ...f,
    observances: f.observances.map((x) => (x.id === id ? { ...x, state: 'consecrated', consecration: c } : x)),
  }
  const problems = checkFragment(next)
  if (problems.length) throw new Error(`ritual/1: refused —\n  ${problems.join('\n  ')}`)
  return next
}

/**
 * The figures, in one object.
 *
 * `witnessed` and `consecrated` ship WITH `performed` so a renderer cannot
 * take the flattering number alone: raw activity is the anti-metric, and a
 * surface that shows it without the witnessed share beside it is the slot
 * machine this format refuses to be.
 */
export function metrics(f) {
  const live = f.observances.filter((o) => o.state !== 'void')
  const voided = new Set(f.observances.filter((o) => o.state === 'void').map((o) => o.supersedes))
  const counted = live.filter((o) => !voided.has(o.id))
  const witnessed = counted.filter((o) => o.state === 'witnessed' || o.state === 'consecrated')
  const consecrated = counted.filter((o) => o.state === 'consecrated')
  return {
    liturgies: f.liturgies.length,
    observances: counted.length,
    witnessed: witnessed.length,
    consecrated: consecrated.length,
    voided: f.observances.filter((o) => o.state === 'void').length,
    witnessedShare: counted.length ? witnessed.length / counted.length : 0,
    consecratedShare: counted.length ? consecrated.length / counted.length : 0,
  }
}

/** What a surface must show. Never raw activity without the witnessed share beside it. */
export function project(f) {
  const m = metrics(f)
  return {
    contract: CONTRACT,
    subject: f.subject,
    ...m,
    // Not a field a renderer may drop: the count that means anything is the
    // consecrated one, and a reader deserves to know how much of the activity
    // never earned a witness.
    note: m.observances === 0
      ? 'No observances. An empty calendar is honest; a padded one is not.'
      : `${m.consecrated} of ${m.observances} observances carry consequence. Unwitnessed practice moves nothing.`,
  }
}

// ── The CLI ─────────────────────────────────────────────────────────────────

/** The well-known path a practising domain serves its calendar at. One spelling. */
export const WELL_KNOWN = '/.well-known/ritual.json'

/** Append a liturgy. Publishing is a person's act, and the flag is required, not defaulted. */
export function addLiturgy(f, l) {
  const next = { ...f, liturgies: [...f.liturgies, l] }
  const problems = checkFragment(next)
  if (problems.length) throw new Error(`ritual/1: refused —\n  ${problems.join('\n  ')}`)
  return next
}

/** An empty calendar. Honest by construction: no liturgies, no observances, nothing implied. */
export function emptyFragment(subject) {
  return { contract: CONTRACT, subject, generated: new Date().toISOString(), liturgies: [], observances: [] }
}

/**
 * The validation workflow `init` writes. Assembled from lines rather than a
 * template literal, because this estate has terminated two template literals
 * with a backtick in a comment and shipped the halves.
 */
export function workflowYaml() {
  return [
    '# ritual/1 — validate the calendar on every push.',
    '#',
    '# Written by `node vendor-ritual.mjs init`. This workflow only checks; it',
    '# never commits, so it spends no deploy and needs no [skip ci]. Wiring an',
    '# agent to observe is your machinery to add, where the work already runs.',
    'name: Ritual',
    'on:',
    '  push:',
    '  pull_request:',
    '  workflow_dispatch:',
    'jobs:',
    '  check:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    '      - uses: actions/checkout@v4',
    '      - uses: actions/setup-node@v4',
    '        with:',
    "          node-version: '22'",
    '      - name: Validate the calendar',
    '        run: node vendor-ritual.mjs check ritual.fragment.json',
    '',
  ].join('\n')
}

const flagsOf = (argv) => {
  const flags = {}
  const positional = []
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) { flags[argv[i].slice(2)] = argv[i + 1]; i += 1 }
    else positional.push(argv[i])
  }
  return { flags, positional }
}

const need = (flags, names) => {
  for (const n of names) {
    if (typeof flags[n] !== 'string' || !flags[n]) {
      console.error(`missing --${n}`)
      process.exit(2)
    }
  }
}

const load = (path) => JSON.parse(readFileSync(path, 'utf8'))
const save = (path, f) => writeFileSync(path, `${JSON.stringify(f, null, 2)}\n`)

const report = (f) => {
  const m = metrics(f)
  console.log(`ritual/1: valid — ${m.liturgies} liturgies, ${m.observances} observances, ${m.witnessed} witnessed, ${m.consecrated} consecrated`)
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2)
  const { flags, positional } = flagsOf(rest)

  if (cmd === 'init') {
    // A calendar belongs to somebody who answers for it, and a liturgy is a
    // person's decision — so both ids are asked for and neither is defaulted.
    need(flags, ['subject', 'person'])
    if (!flags.person.startsWith('person/')) { console.error('--person must be a person/ id — publishing a liturgy is a human decision'); process.exit(2) }
    const fragmentPath = flags.fragment ?? 'ritual.fragment.json'
    const workflowPath = flags.workflow ?? '.github/workflows/ritual.yml'
    if (existsSync(fragmentPath)) { console.error(`${fragmentPath} already exists — init writes once, it never overwrites a calendar`); process.exit(1) }
    const f = emptyFragment(flags.subject)
    const problems = checkFragment(f)
    if (problems.length) { for (const p of problems) console.error(`  ✗ ${p}`); process.exit(1) }
    save(fragmentPath, f)
    if (!existsSync(workflowPath)) {
      mkdirSync(dirname(workflowPath), { recursive: true })
      writeFileSync(workflowPath, workflowYaml())
      console.log(`wrote ${workflowPath}`)
    }
    console.log(`wrote ${fragmentPath} for ${flags.subject}`)
    console.log('next:')
    console.log(`  node vendor-ritual.mjs liturgy ${fragmentPath} --id daily-office --title "The Daily Office" --cadence daily --rite "the steps|of the practice" --by ${flags.person}`)
    console.log(`  serve the fragment at ${WELL_KNOWN} so a stranger can check the rhythm`)
    return
  }

  const path = positional[0]
  if (!cmd || !path) {
    console.error('usage: node vendor-ritual.mjs init|liturgy|observe|witness|consecrate|check|metrics — see the header of this file')
    process.exit(2)
  }

  if (cmd === 'check' && /^https:\/\//.test(path)) {
    // Over the network, the way a stranger would. A failed fetch says nothing
    // certain about the domain — a proxy refusing the CONNECT and a host that
    // is down look identical from here — so the failure is reported as this
    // runner's view, never as a fact about somebody else's property.
    const url = new URL(WELL_KNOWN, path).href
    let res
    try { res = await fetch(url, { redirect: 'follow' }) } catch {
      console.error(`could not reach ${url} — from this machine only; a proxy refusal and a down host are indistinguishable here`)
      process.exit(1)
    }
    if (!res.ok) { console.error(`${url} answered ${res.status} — the domain is there and does not serve a calendar at the read path`); process.exit(1) }
    const f = await res.json()
    const problems = checkFragment(f)
    if (problems.length) {
      console.error(`ritual/1: ${url} serves an invalid fragment — ${problems.length} problem(s)`)
      for (const p of problems) console.error(`  ✗ ${p}`)
      process.exit(1)
    }
    console.log(`ritual/1: ${url} serves a valid calendar for ${f.subject}`)
    report(f)
    return
  }

  const f = load(path)
  if (cmd === 'check') {
    const problems = checkFragment(f)
    if (problems.length) {
      console.error(`ritual/1: ${problems.length} problem(s)`)
      for (const p of problems) console.error(`  ✗ ${p}`)
      process.exit(1)
    }
    report(f)
  } else if (cmd === 'metrics') {
    console.log(JSON.stringify(project(f), null, 2))
  } else if (cmd === 'liturgy') {
    need(flags, ['id', 'title', 'cadence', 'rite', 'by'])
    const next = addLiturgy(f, {
      id: flags.id,
      title: flags.title,
      cadence: flags.cadence,
      rite: flags.rite.split('|').map((s) => s.trim()).filter(Boolean),
      published_by: flags.by,
      since: flags.since ?? new Date().toISOString(),
    })
    save(path, next)
    console.log(`liturgy "${flags.id}" published by ${flags.by}`)
  } else if (cmd === 'observe') {
    need(flags, ['id', 'liturgy', 'performer', 'for', 'evidence'])
    const at = flags.at ?? new Date().toISOString()
    const next = observe(f, {
      id: flags.id, liturgy: flags.liturgy, performer: flags.performer,
      for: flags.for, at, recorded: new Date().toISOString(), evidence: flags.evidence,
    })
    save(path, next)
    report(next)
  } else if (cmd === 'witness') {
    need(flags, ['by', 'basis'])
    const next = witness(f, positional[1], { by: flags.by, basis: flags.basis, at: flags.at ?? new Date().toISOString() })
    save(path, next)
    report(next)
  } else if (cmd === 'consecrate') {
    const next = consecrate(f, positional[1], { by: flags.by, at: flags.at ?? new Date().toISOString() })
    save(path, next)
    report(next)
  } else {
    console.error(`unknown command: ${cmd}`)
    process.exit(2)
  }
}

const RUN = import.meta.url === `file://${process.argv[1]}`
if (RUN) {
  await main()
}
