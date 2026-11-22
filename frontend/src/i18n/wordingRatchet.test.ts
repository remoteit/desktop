import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// docs/ux/glossary.md lists these terms and says why some retired words are narrowed or left out.
const TERMS: Record<string, RegExp> = {
  'remote.it (brand in prose)': /(?<![\w.@/-])(?!Remote\.It)[Rr]emote\.[Ii]t(?![\w/-])/,
  'Device subnet': /\bdevice subnets?\b/i,
  'Reach devices by name': /\breach devices by name\b/i,
  Protect: /\bProtect(ing)?\b(?! your)/,
  'exit node': /\bexit nodes?\b/i,
  'Runs on': /\bRuns on\b/,
  'DNS name': /\bDNS names?\b/i,
  'subnet name': /\bsubnet names?\b/i,
  'Name on your network': /\bname on your network\b/i,
  endpoint: /\bendpoints?\b/i,
  Initiator: /\binitiat(or|ors|ing)\b/i,
  daemon: /\bdaemons?\b/i,
  connectd: /\bconnectd\b/i,
  'device package': /\bdevice packages?\b/i,
  'remote.it device': /\bremote\.it devices?\b/i,
  'Control Link': /\bcontrol link\b/i,
  Classic: /\bclassic\b/i,
  upgrade: /^(?!upgrade$)(?!.*\b(plans?|licen[cs]es?|professional)\b).*\bupgrad(e|es|ed|ing)\b/is,
  console: /\bconsole\b/i,
  'web SSH': /\bweb ssh\b/i,
  reflector: /\breflector\b/i,
  decommission: /\bdecommission/i,
  'hosted by / hosts / Hosting': /\bhosted by\b(?! remote\.it)|\bhosts \{\{\}\}|^Hosting$/i,
  'Allow remote access to services': /\ballow remote access to services\b/i,
}

const INTERNAL_WORDS = /\b(stages?|daemons?|connectd|sudo)\b/i
const MAX_WORDS = 25

const EN = join(__dirname, 'locales', 'en')
const BASELINE = join(__dirname, 'wordingBaseline.json')

type Counts = { terms: Record<string, number>; longStrings: number; internalWords: number }

const flatten = (value: unknown, out: string[] = []) => {
  if (typeof value === 'string') out.push(value)
  else if (value && typeof value === 'object') for (const child of Object.values(value)) flatten(child, out)
  return out
}

// Placeholder names such as {{target}} and <1> tags are code, not words people read.
const readable = (text: string) => text.replace(/\{\{[^}]*\}\}/g, '{{}}').replace(/<\/?\d+\/?>/g, ' ')

const strings = readdirSync(EN)
  .filter(name => name.endsWith('.json'))
  .flatMap(name => flatten(JSON.parse(readFileSync(join(EN, name), 'utf8'))))
  .map(readable)

const count = (test: (text: string) => boolean) => strings.filter(test).length

const current: Counts = {
  terms: Object.fromEntries(Object.entries(TERMS).map(([term, pattern]) => [term, count(text => pattern.test(text))])),
  longStrings: count(text => text.trim().split(/\s+/).length > MAX_WORDS),
  internalWords: count(text => INTERNAL_WORDS.test(text)),
}

const lowered = (was: Counts): Counts => ({
  terms: Object.fromEntries(
    Object.entries(current.terms).map(([term, now]) => [term, Math.min(now, was.terms[term] ?? now)])
  ),
  longStrings: Math.min(current.longStrings, was.longStrings),
  internalWords: Math.min(current.internalWords, was.internalWords),
})

// The update only ever lowers a count: a rise has to be written into the file by hand, on purpose.
if (process.env.UPDATE_WORDING_BASELINE)
  writeFileSync(BASELINE, JSON.stringify(lowered(JSON.parse(readFileSync(BASELINE, 'utf8'))), null, 2) + '\n')

const baseline: Counts = JSON.parse(readFileSync(BASELINE, 'utf8'))

const LOWER = 'UPDATE_WORDING_BASELINE=1 npx vitest run src/i18n/wordingRatchet.test.ts (in frontend/)'

const check = (label: string, was: number | undefined, now: number) => {
  if (was === undefined)
    return `${label} has no count in frontend/src/i18n/wordingBaseline.json yet. Add it: run ${LOWER}.`
  if (now > was)
    return `${label} rose from ${was} to ${now} English strings. Reword the new text using docs/ux/glossary.md and docs/ux/voice.md.`
  if (now < was)
    return `${label} fell from ${was} to ${now}. Lower it in frontend/src/i18n/wordingBaseline.json in the same commit: run ${LOWER}.`
}

describe('the English catalogs do not use more retired words than before', () => {
  it.each(Object.keys(TERMS))('%s', term => {
    expect(check(`"${term}"`, baseline.terms[term], current.terms[term])).toBeUndefined()
  })

  it(`strings longer than ${MAX_WORDS} words`, () => {
    expect(check(`Strings longer than ${MAX_WORDS} words`, baseline.longStrings, current.longStrings)).toBeUndefined()
  })

  it('strings with internal words (stage, daemon, connectd, sudo)', () => {
    expect(check('Strings with internal words', baseline.internalWords, current.internalWords)).toBeUndefined()
  })

  it('the baseline names no term the test has dropped', () => {
    expect(Object.keys(baseline.terms).filter(term => !(term in TERMS))).toEqual([])
  })
})
