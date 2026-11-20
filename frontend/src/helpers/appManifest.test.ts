// @vitest-environment node
import { readdirSync, readFileSync } from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { AppForm, manifestOf, manifestProblems, manifestText, newAppForm, newSetting } from './appManifest'

/* New app's validation is remoteit/apps' own, vendored: the shared manifest fixtures — what remoteit/apps, graphql and
   the daemon test against — give the same verdicts here; and the form's answers make a manifest that passes them. */

const fixtures = path.resolve(__dirname, '../vendor/remoteit-apps/fixtures/manifests')
const files = (sub: string) =>
  readdirSync(path.join(fixtures, sub))
    .filter(f => f.endsWith('.json'))
    .sort()
const read = (...parts: string[]) => JSON.parse(readFileSync(path.join(fixtures, ...parts), 'utf8'))

describe('the vendored contract', () => {
  it('passes every valid fixture', () => {
    expect(files('valid').length).toBeGreaterThan(0)
    for (const f of files('valid')) expect([f, manifestProblems(read('valid', f))]).toEqual([f, []])
  })

  it('refuses every invalid-by-schema fixture by the schema', () => {
    for (const f of files('invalid/schema'))
      expect(manifestProblems(read('invalid', 'schema', f)).length, f).toBeGreaterThan(0)
  })

  it('gives each invalid-by-rule fixture exactly the error remoteit/apps expects', () => {
    const expected = read('expected-rules.json')
    for (const f of files('invalid/rules'))
      expect(manifestProblems(read('invalid', 'rules', f)), f).toEqual(expected[f.replace(/\.json$/, '')])
  })
})

const hello = (): AppForm => ({
  ...newAppForm(),
  id: 'hello',
  name: 'Hello',
  description: 'One page',
  command: 'hello.py',
  args: '${remoteit.port}\n${setting.title}',
  protocol: 'http',
  health: 'http',
  settings: [{ ...newSetting(), name: 'title', label: 'Title', default: 'Hi', maxLength: '80' }],
})

describe('the form', () => {
  it('makes the README’s first app, which validates', () => {
    const m = manifestOf(hello(), 'acme')
    expect(m).toEqual({
      contract: 1,
      app: 'acme.hello',
      version: '1.0.0',
      name: 'Hello',
      description: 'One page',
      run: { command: 'hello.py', args: ['${remoteit.port}', '${setting.title}'] },
      listen: { type: 'tcp' },
      service: { name: 'Hello', protocol: 'http' },
      health: { type: 'http', path: '/' },
      settings: { title: { type: 'string', label: 'Title', max_length: 80, default: 'Hi' } },
    })
    expect(manifestProblems(m)).toEqual([])
    expect(manifestText(m).endsWith('}\n')).toBe(true)
  })

  it('says what is wrong in the contract’s words', () => {
    expect(manifestProblems(manifestOf({ ...hello(), args: '${setting.nope}' }, 'acme'))).toEqual([
      'the manifest: ${setting.nope} is not a declared setting',
    ])
    expect(manifestProblems(manifestOf({ ...hello(), id: 'Not Valid' }, 'acme'))[0]).toMatch(
      /^\/app must match pattern/
    )
    expect(manifestProblems(manifestOf({ ...hello(), listen: 'udp', protocol: 'http' }, 'acme'))).toContain(
      "service.protocol: a udp listener's service is udp, not http"
    )
  })

  it('a root ssh app with person accounts, certificates and AI commands, on a port its owner sets', () => {
    const m = manifestOf(
      {
        ...hello(),
        as: 'root',
        perOs: true,
        commands: { linux: 'bin/sshd', darwin: '', windows: 'bin/sshd.exe' },
        args: '-p\n${setting.port}',
        protocol: 'ssh',
        portMode: 'setting',
        portSetting: 'port',
        servicePort: '${setting.port}',
        health: 'tcp',
        personAccounts: true,
        personCertificates: true,
        sshExec: true,
        sshExecGate: 'ai',
        settings: [
          { ...newSetting(), name: 'port', type: 'int', min: '1024', max: '65535', default: '2222' },
          { ...newSetting(), name: 'ai', type: 'bool', default: 'true', forcible: true },
          { ...newSetting(), name: 'mode', type: 'choice', choices: 'a=Alpha\nb', default: 'b' },
          { ...newSetting(), name: 'hosts', type: 'list', maxItems: '4', default: 'x, y' },
        ],
      },
      'acme'
    )
    expect(m.run).toEqual({
      command: { linux: 'bin/sshd', windows: 'bin/sshd.exe' },
      as: 'root',
      args: ['-p', '${setting.port}'],
    })
    expect(m.listen).toEqual({ type: 'tcp', port: '${setting.port}' })
    expect(m.settings.mode).toEqual({ type: 'choice', choices: [{ value: 'a', label: 'Alpha' }, 'b'], default: 'b' })
    expect(m.settings.hosts).toEqual({ type: 'list', max_items: 4, default: ['x', 'y'] })
    expect(m.capabilities).toEqual({ 'person-accounts': {}, 'person-certificates': {}, 'ssh-exec': { gate: 'ai' } })
    expect(manifestProblems(m)).toEqual([])
  })
})

describe('what a manifest cannot hold', () => {
  it('a setting or environment name given twice, an environment line with no NAME=', async () => {
    const { formProblems } = await import('./appManifest')
    const form = {
      ...hello(),
      env: 'A=1\nTOKEN\nA=2\n=x',
      settings: [
        { ...newSetting(), name: 'title' },
        { ...newSetting(), name: 'title ' },
      ],
    }
    expect(formProblems(form)).toEqual([
      { code: 'settingTwice', value: 'title' },
      { code: 'envNoEquals', value: 'TOKEN' },
      { code: 'envNoEquals', value: '=x' },
      { code: 'envTwice', value: 'A' },
    ])
    expect(formProblems(hello())).toEqual([])
  })

  it('a JSON member named twice in one object, at any depth', async () => {
    const { duplicateMembers } = await import('./appManifest')
    expect(
      duplicateMembers('{"a": 1, "b": {"c": 1, "c": 2}, "a": [ {"x": "a:", "x": 1} ], "s": "\\"a\\": 1"}')
    ).toEqual(['/b/c', '/a', '/a/*/x'])
    expect(
      duplicateMembers(JSON.stringify({ settings: { a: { type: 'bool' }, b: { type: 'bool' } }, run: { a: 1 } }))
    ).toEqual([])
  })
})
