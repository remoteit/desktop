import validateSchema from '../vendor/remoteit-apps/manifestSchema.mjs'
import { semanticErrors } from '../vendor/remoteit-apps/rules.mjs'

/* New app's manifest (presence-server docs/device-apps-new-app.md, "New app"): the guided form's answers as a
   contract-1 source manifest (remoteit/apps docs/contract.md) — what a developer writes, without the build's
   `archives` — and its validation with the very schema and rules graphql takes a release by and devices hold it to,
   vendored from remoteit/apps (vendor/remoteit-apps). The form covers the single listener form; Edit as JSON takes
   any contract-1 manifest, checked the same way. */

export type SettingType = 'bool' | 'int' | 'string' | 'choice' | 'list'

export type SettingRow = {
  name: string
  type: SettingType
  label: string
  help: string
  default: string // as typed: true/false, a number, text, a choice's value, a list's items comma separated
  min: string
  max: string
  maxLength: string
  pattern: string
  choices: string // one a line: value, or value=Label
  maxItems: string
  forcible: boolean
}

export type ListenType = 'none' | 'tcp' | 'udp' | 'unix' | 'stdio'
export type Os = 'linux' | 'darwin' | 'windows'
export const OSES: Os[] = ['linux', 'darwin', 'windows']

export type AppForm = {
  id: string // after "<publisher>."
  name: string
  description: string
  version: string
  notes: string
  command: string
  perOs: boolean
  commands: Record<Os, string> // per OS; empty: not run there
  args: string // one a line
  env: string // NAME=value, one a line
  as: 'restricted' | 'root'
  onChange: 'restart' | 'signal:SIGHUP' | 'nothing'
  listen: ListenType
  portMode: 'auto' | 'fixed' | 'setting'
  port: string
  portSetting: string
  identity: boolean
  serviceName: string
  protocol: string
  servicePort: string // empty: the protocol's own; a number; or ${setting.X}
  health: 'none' | 'tcp' | 'http'
  healthPath: string
  healthInterval: string
  settings: SettingRow[]
  personAccounts: boolean
  personCertificates: boolean
  sshExec: boolean
  sshExecGate: string
}

export const PROTOCOLS = ['ssh', 'http', 'https', 'vnc', 'rdp', 'tcp', 'udp']
// The protocols a listener's service takes: datagrams for udp, a stream's for the rest.
export const protocolsFor = (listen: ListenType) => (listen === 'udp' ? ['udp'] : PROTOCOLS.filter(p => p !== 'udp'))

export const newSetting = (): SettingRow => ({
  name: '',
  type: 'string',
  label: '',
  help: '',
  default: '',
  min: '',
  max: '',
  maxLength: '',
  pattern: '',
  choices: '',
  maxItems: '',
  forcible: false,
})

export const newAppForm = (): AppForm => ({
  id: '',
  name: '',
  description: '',
  version: '1.0.0',
  notes: '',
  command: '',
  perOs: false,
  commands: { linux: '', darwin: '', windows: '' },
  args: '',
  env: '',
  as: 'restricted',
  onChange: 'restart',
  listen: 'tcp',
  portMode: 'auto',
  port: '',
  portSetting: '',
  identity: false,
  serviceName: '',
  protocol: 'http',
  servicePort: '',
  health: 'none',
  healthPath: '/',
  healthInterval: '',
  settings: [],
  personAccounts: false,
  personCertificates: false,
  sshExec: false,
  sshExecGate: '',
})

const lines = (text: string) =>
  text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)

// A number typed, or the text itself where it is not one, so the schema says what is wrong with it.
const number = (text: string): number | string => (/^-?\d+$/.test(text.trim()) ? Number(text.trim()) : text.trim())
const portRef = (text: string): number | string =>
  /^\$\{setting\.[a-z][a-z0-9_]*\}$/.test(text.trim()) ? text.trim() : number(text)

function settingOf(row: SettingRow): Record<string, any> {
  const s: Record<string, any> = { type: row.type }
  if (row.label.trim()) s.label = row.label.trim()
  if (row.help.trim()) s.help = row.help.trim()
  const given = row.default.trim() !== '' || row.type === 'string'
  switch (row.type) {
    case 'bool':
      if (row.default.trim())
        s.default = row.default.trim() === 'true' ? true : row.default.trim() === 'false' ? false : row.default
      if (row.forcible) s.forcible = true
      break
    case 'int':
      if (row.min.trim()) s.min = number(row.min)
      if (row.max.trim()) s.max = number(row.max)
      if (given) s.default = number(row.default)
      break
    case 'string':
      if (row.maxLength.trim()) s.max_length = number(row.maxLength)
      if (row.pattern) s.pattern = row.pattern
      if (row.default !== '') s.default = row.default
      break
    case 'choice': {
      s.choices = lines(row.choices).map(line => {
        const at = line.indexOf('=')
        return at > 0 ? { value: line.slice(0, at).trim(), label: line.slice(at + 1).trim() } : line
      })
      if (given) s.default = row.default.trim()
      if (row.forcible) s.forcible = true
      break
    }
    case 'list':
      if (row.maxItems.trim()) s.max_items = number(row.maxItems)
      if (row.maxLength.trim() || row.pattern) {
        s.item = {}
        if (row.maxLength.trim()) s.item.max_length = number(row.maxLength)
        if (row.pattern) s.item.pattern = row.pattern
      }
      if (given)
        s.default = row.default
          .split(',')
          .map(item => item.trim())
          .filter(Boolean)
      break
  }
  return s
}

// The source manifest the form says: contract 1, its members in the contract's order, none the form left empty.
export function manifestOf(form: AppForm, publisher: string): Record<string, any> {
  const m: Record<string, any> = { contract: 1, app: `${publisher}.${form.id.trim()}`, version: form.version.trim() }
  if (form.name.trim()) m.name = form.name.trim()
  if (form.description.trim()) m.description = form.description.trim()
  const run: Record<string, any> = {}
  if (form.perOs) {
    run.command = Object.fromEntries(
      OSES.filter(os => form.commands[os].trim()).map(os => [os, form.commands[os].trim()])
    )
  } else run.command = form.command.trim()
  if (form.as === 'root') run.as = 'root'
  const args = form.args.split('\n').filter(line => line.trim() !== '')
  if (args.length) run.args = args
  const env = lines(form.env)
  if (env.length)
    run.env = Object.fromEntries(env.map(line => [line.split('=')[0].trim(), line.slice(line.indexOf('=') + 1)]))
  if (form.onChange !== 'restart') run.on_settings_change = form.onChange
  m.run = run
  if (form.listen !== 'none') {
    const listen: Record<string, any> = { type: form.listen }
    if (form.listen === 'tcp' || form.listen === 'udp') {
      if (form.portMode === 'fixed') listen.port = number(form.port)
      if (form.portMode === 'setting') listen.port = `\${setting.${form.portSetting.trim()}}`
    }
    if (form.identity && (form.listen === 'tcp' || form.listen === 'unix')) listen.identity = 'header'
    m.listen = listen
    const service: Record<string, any> = {
      name: form.serviceName.trim() || form.name.trim() || form.id.trim(),
      protocol: form.protocol,
    }
    if (form.servicePort.trim()) service.port = portRef(form.servicePort)
    m.service = service
    if (form.health !== 'none' && form.listen !== 'stdio' && form.listen !== 'udp') {
      const health: Record<string, any> = { type: form.health }
      if (form.health === 'http') health.path = form.healthPath.trim() || '/'
      if (form.healthInterval.trim()) health.interval = number(form.healthInterval)
      m.health = health
    }
  }
  if (form.settings.length) m.settings = Object.fromEntries(form.settings.map(row => [row.name.trim(), settingOf(row)]))
  const capabilities: Record<string, any> = {}
  if (form.personAccounts) capabilities['person-accounts'] = {}
  if (form.personCertificates) capabilities['person-certificates'] = {}
  if (form.sshExec) capabilities['ssh-exec'] = { gate: form.sshExecGate.trim() }
  if (Object.keys(capabilities).length) m.capabilities = capabilities
  if (form.notes.trim()) m.notes = form.notes.replace(/\s+$/, '')
  return m
}

// The manifest's text as the build writes it (remoteit/apps tools/lib/build.mjs manifestText): what is signed.
export const manifestText = (m: Record<string, any>) => `${JSON.stringify(m, null, 2)}\n`

// Everything wrong with a manifest, as graphql and the daemon would say it: the schema's errors (a few, each once),
// else the rules beyond it. readFile reads one of the app's files, for its rendered templates; without the files
// (before any are given) every template is taken as there.
export function manifestProblems(m: unknown, readFile: (path: string) => string = () => ''): string[] {
  if (!validateSchema(m)) {
    const errors = (validateSchema.errors ?? []).map(
      e =>
        `${e.instancePath || '/'} ${e.message}${
          e.params && 'additionalProperty' in e.params ? ` (${e.params.additionalProperty})` : ''
        }`
    )
    return [...new Set(errors)].slice(0, 8)
  }
  return semanticErrors(m as Record<string, any>, readFile)
}

// Whether the manifest asks a consent of whoever adds it: root, or the person-accounts capability (root only).
export const runsAsRoot = (m: Record<string, any>) => m.run?.as === 'root'
