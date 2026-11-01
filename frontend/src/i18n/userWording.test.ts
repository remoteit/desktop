import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

// What a device is, in the words customers see (graphql docs/DEVICE-TAXONOMY.md): "device session" has left all
// user-facing text — "Control Link", or "Classic" for its absence (§6, stage 1) — and "CloudShift" never appears.
// Code identifiers, GraphQL field names and URLs keep the old name until stage 2–3; only text people read is checked.

const LOCALES = join(__dirname, 'locales')
const SRC = join(__dirname, '..')
const RETIRED = /device[ -]sessions?|cloud ?shift/i

const flatten = (value: unknown, path: string, out: [string, string][] = []) => {
  if (typeof value === 'string') out.push([path, value])
  else if (value && typeof value === 'object')
    for (const [key, child] of Object.entries(value)) flatten(child, path ? `${path}.${key}` : key, out)
  return out
}

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap(name => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === 'node_modules' ? [] : files(path)
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : []
  })

// The source with its comments gone: what is left in quotes is what the app shows (or a name it uses).
const withoutComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1')

describe('the words people read', () => {
  const locales = readdirSync(LOCALES).filter(name => statSync(join(LOCALES, name)).isDirectory())

  it('every locale is checked', () => {
    expect(locales).toEqual(expect.arrayContaining(['en', 'de', 'es', 'ja']))
  })

  it.each(locales)('no catalog of %s says "device session" or "CloudShift"', locale => {
    const found = readdirSync(join(LOCALES, locale))
      .filter(name => name.endsWith('.json'))
      .flatMap(name => flatten(JSON.parse(readFileSync(join(LOCALES, locale, name), 'utf8')), name))
      .filter(([, text]) => RETIRED.test(text))
    expect(found).toEqual([])
  })

  it('no string in the app says them either: the defaults, labels, tooltips and notices', () => {
    const quoted = /(['"`])((?:(?!\1)[^\\\n]|\\.)*)\1/g
    const found: string[] = []
    for (const path of files(SRC)) {
      const source = withoutComments(readFileSync(path, 'utf8'))
      for (const match of source.matchAll(quoted)) if (RETIRED.test(match[2])) found.push(`${path}: ${match[0]}`)
      // JSX text between tags.
      for (const match of source.matchAll(/>([^<>{}]+)</g)) if (RETIRED.test(match[1])) found.push(`${path}: ${match[1].trim()}`)
    }
    expect(found).toEqual([])
  })

  it("a held device's words are in every catalog, English filled", () => {
    const en = JSON.parse(readFileSync(join(LOCALES, 'en', 'app.json'), 'utf8'))
    expect(en.deviceAgent.held).toBe("Blocked — held by the device's admin")
    expect(en.agentStatus.held).toBe("Blocked — held by the device's admin")
    for (const locale of locales) {
      const app = JSON.parse(readFileSync(join(LOCALES, locale, 'app.json'), 'utf8'))
      expect(typeof app.deviceAgent.held, locale).toBe('string')
      expect(typeof app.deviceAgent.heldHint, locale).toBe('string')
      expect(typeof app.agentStatus.held, locale).toBe('string')
    }
  })
})
