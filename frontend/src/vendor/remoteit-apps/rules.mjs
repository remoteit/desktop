// Vendored from remoteit/apps@1f15f414ba0147a2e0ca1305e5f60077f3e9ad79 lib/rules.mjs: not edited here (scripts/vendor-remoteit-apps.mjs).
// SPDX-License-Identifier: Apache-2.0
// The contract-1 rules a schema cannot say (docs/contract.md, "Checked beyond the schema"), and the values a setting
// takes: what the validator, the harness and the build tool share with lib/contract.mjs's schemas. Pure — no Node
// module, no ajv —, so a browser runs the same rules: the portal's New app page vendors this file verbatim (desktop
// frontend/src/vendor/remoteit-apps), as graphql ports it word for word (app-contract.ts beyondSchema); the shared
// fixtures (fixtures/manifests) pin all three.

// The ${remoteit.NAME} values remote.it gives (docs/contract.md, "Values"); with named listeners, also
// ${remoteit.listen.<name>.port|ports|path} (LISTENER_VALUES) in place of listen and port.
export const REMOTEIT = ['listen', 'port', 'dir', 'data', 'run', 'state', 'status', 'uid', 'session', 'person_ca']

// The listeners on loopback ports: tcp and udp.
const PORTED = ['tcp', 'udp']
const isPort = value => Number.isInteger(value) && value >= 1 && value <= 65535

const TOKEN = /\$\$\{|\$\{(setting|remoteit)\.([a-z_][a-z0-9_]*(?:\.[a-z0-9_]+)*)\}/g
const LISTENER_VALUE = /^listen\.([a-z][a-z0-9_]{0,31})\.(port|ports|path)$/
const SETTING_REF = /^\$\{setting\.([a-z][a-z0-9_]{0,31})\}$/

// ---- listeners and services: the single form (one listen object, one service) and named listeners, one view

// The app's listeners, each {name, where, type, port?, ports?, identity?}: the single form's one (name undefined,
// where "listen"), or the named ones in the manifest's order. named says which form.
export function listenersOf(m) {
  const listen = m.listen
  if (!listen) return {named: false, list: []}
  if (typeof listen.type === 'string') return {named: false, list: [{...listen, where: 'listen'}]}
  return {named: true, list: Object.entries(listen).map(([name, l]) => ({...l, name, where: `listen.${name}`}))}
}

// The app's services, each {...service, where, listeners}: listeners are the listener objects it reaches, in the
// order it names them (the single form's service reaches its one listener). The first service is the primary one.
export function servicesOf(m) {
  if (!m.service) return []
  const {named, list} = listenersOf(m)
  const byName = new Map(list.map(l => [l.name, l]))
  const services = Array.isArray(m.service) ? m.service : [m.service]
  return services.map((s, i) => {
    const names = named ? [s.listen].flat() : []
    return {...s, where: Array.isArray(m.service) ? `service[${i}]` : 'service',
      names, listeners: named ? names.map(n => byName.get(n)).filter(Boolean) : list}
  })
}

// A ports range "low-high" as [low, high], or undefined where it is not one (1 <= low < high <= 65535).
export function rangeOf(ports) {
  const match = /^(\d+)-(\d+)$/.exec(ports ?? '')
  const [low, high] = match ? [Number(match[1]), Number(match[2])] : []
  return match && isPort(low) && isPort(high) && low < high ? [low, high] : undefined
}

// The setting a port names (${setting.X}), or undefined.
export const portSetting = port => (typeof port === 'string' ? SETTING_REF.exec(port)?.[1] : undefined)

// Every template in a manifest: args, env values, and ports given as settings.
function templates(m) {
  return [...(m.run?.args ?? []), ...Object.values(m.run?.env ?? {}),
    ...listenersOf(m).list.map(l => l.port), ...servicesOf(m).map(s => s.port)].filter(t => typeof t === 'string')
}

// Why a ${remoteit.NAME} is not given to this app, or undefined where it is.
function remoteitProblem(m, name) {
  const {named, list} = listenersOf(m)
  const value = LISTENER_VALUE.exec(name)
  if (value) {
    const [, listenerName, part] = value
    const l = list.find(x => x.name === listenerName)
    if (!named) return 'is given only with named listeners (with one listen object: ${remoteit.port}, ${remoteit.listen})'
    if (!l) return `names no listener (${listenerName} is not one)`
    if (part === 'port' && !(PORTED.includes(l.type) && l.ports === undefined)) return `is given only for a tcp or udp listener with one port`
    if (part === 'ports' && l.ports === undefined) return 'is given only for a listener with ports'
    if (part === 'path' && l.type !== 'unix') return 'is given only for a unix listener'
    return
  }
  if (!REMOTEIT.includes(name)) return 'is not one remote.it gives'
  const listen = named ? undefined : list[0]?.type
  if (name === 'session' && !list.some(l => l.type === 'stdio')) return 'is given only with listen stdio (one run a connection)'
  if (name === 'port' || name === 'listen') {
    if (named) return `is given only with one listen object; with named listeners, \${remoteit.listen.<name>.${name === 'port' ? 'port' : 'port|path'}}`
    if (name === 'port' && !PORTED.includes(listen)) return 'is given only with listen tcp or udp'
    if (name === 'listen' && !PORTED.includes(listen) && listen !== 'unix') return 'is given only with listen tcp, udp or unix'
  }
  if (name === 'person_ca' && !m.capabilities?.['person-certificates']) return 'needs the person-certificates capability'
}

// What the schema cannot say of listeners, services and health, in both forms.
function listenErrors(m, settings) {
  const errors = []
  const {named, list} = listenersOf(m)
  const services = servicesOf(m)

  // Every port setting is a port: an int whose bounds are within 1-65535, so no value it can take is not one.
  for (const [where, port] of [...list.map(l => [`${l.where}.port`, l.port]), ...services.map(s => [`${s.where}.port`, s.port])]) {
    const name = portSetting(port)
    if (!name || !settings[name]) continue
    if (settings[name].type !== 'int') errors.push(`${where}: \${setting.${name}} is not an int setting`)
    else if (!isPort(settings[name].min) || !isPort(settings[name].max)) errors.push(`${where}: \${setting.${name}} names a port: its min and max are within 1-65535`)
  }

  if (named) {
    for (const l of list) {
      if (l.ports !== undefined && !rangeOf(l.ports)) errors.push(`${l.where}.ports: ${l.ports} is not a range low-high, 1 <= low < high <= 65535`)
      if (l.type === 'stdio' && list.length > 1) errors.push(`${l.where}: a stdio listener runs the app per connection; it is the app's only listener`)
    }
    // Two listeners of one transport never share a port, overlap a range or name one setting; tcp and udp may.
    for (const [i, a] of list.entries()) {
      for (const b of list.slice(i + 1)) {
        if (a.type !== b.type || !PORTED.includes(a.type)) continue
        const span = l => (typeof l.port === 'number' ? [l.port, l.port] : rangeOf(l.ports))
        const [sa, sb] = [span(a), span(b)]
        if (sa && sb && sa[0] <= sb[1] && sb[0] <= sa[1]) errors.push(`${b.where}: its ${a.type} ports overlap ${a.name}'s`)
        if (portSetting(a.port) && portSetting(a.port) === portSetting(b.port)) errors.push(`${b.where}.port: ${a.name} names \${setting.${portSetting(a.port)}} already`)
      }
    }
    // Each listener is reached by at most one service; one no service names is internal.
    const reached = new Map()
    for (const s of services) {
      for (const name of s.names) {
        if (!list.some(l => l.name === name)) errors.push(`${s.where}.listen: ${name} is not a listener`)
        else if (reached.has(name)) errors.push(`${s.where}.listen: ${name} is ${reached.get(name)}'s already`)
        else reached.set(name, s.where)
      }
    }
  }

  for (const s of services) {
    const [first] = s.listeners
    if (!first) continue
    const several = s.listeners.length > 1
    if (named) {
      for (const l of s.listeners) {
        if (l.type === 'unix' && several) errors.push(`${s.where}.listen: ${l.name} is a unix listener, reached only as its service's one listener`)
      }
      // A multi-port service's ports are its listeners' real ports: each known, the first the launch port.
      if (several || s.listeners.some(l => l.ports !== undefined)) {
        for (const l of s.listeners) {
          if (PORTED.includes(l.type) && l.port === undefined && l.ports === undefined) errors.push(`${s.where}.listen: ${l.name} has no known port (a number, \${setting.X} or ports); a service of several ports is reached on its listeners' own`)
        }
        if (s.port !== undefined) errors.push(`${s.where}.port: a service of ${several ? 'several listeners' : 'a ports listener'} is reached on its listeners' ports; it names none`)
      }
    }
    // One protocol per service, paired with its first listener: udp with udp, a stream (tcp, unix, stdio) with a TCP one.
    const type = first.type
    const on = named && several ? ` (its first listener, ${first.name}, is ${type})` : ''
    if ((type === 'udp') !== (s.protocol === 'udp')) {
      errors.push(type === 'udp' ? `${s.where}.protocol: a udp listener's service is udp, not ${s.protocol}${on}` : `${s.where}.protocol: a ${type} listener carries a stream; its service is ssh, http, https, vnc, rdp or tcp${on}`)
    }
    // A UDP application type (the reference table's 0x8000 bit) routes the service as datagrams: exactly a udp listener's.
    if (Number.isInteger(s.type) && Boolean(s.type & 0x8000) !== (type === 'udp')) {
      errors.push(type === 'udp' ? `${s.where}.type: ${s.type} is a TCP application type; a udp listener's service is a UDP one` : `${s.where}.type: ${s.type} is a UDP application type; a ${type} listener's service is a TCP one`)
    }
    if (!several && first.ports === undefined && (s.protocol === 'tcp' || s.protocol === 'udp') && s.port === undefined && typeof first.port !== 'number') {
      errors.push(`${s.where}.port: a ${s.protocol} service whose app listens on no fixed port names the port people connect to`)
    }
  }

  if (m.health) {
    if (!named) {
      const listen = list[0]?.type
      if (listen === 'stdio') errors.push('health: a stdio app runs per connection; there is nothing to probe')
      if (listen === 'udp') errors.push('health: a udp app has no connection to probe; a running process is running')
    } else if (m.health.listen === undefined && list.length > 1) {
      errors.push('health.listen: with several listeners, health names the one it probes')
    } else {
      const l = m.health.listen === undefined ? list[0] : list.find(x => x.name === m.health.listen)
      if (!l) errors.push(`health.listen: ${m.health.listen} is not a listener`)
      else if (l.type === 'stdio') errors.push(`health.listen: ${l.name} is a stdio listener, run per connection; there is nothing to probe`)
      else if (l.type === 'udp') errors.push(`health.listen: ${l.name} is a udp listener, with no connection to probe`)
      else if (l.ports !== undefined) errors.push(`health.listen: ${l.name} binds a range; health probes a listener with one port or socket`)
    }
  }
  if (list.some(l => l.type === 'stdio') && m.run?.on_settings_change === 'signal:SIGHUP') errors.push('run.on_settings_change: a stdio app runs per connection; its next connection takes the change')
  return errors
}

// A path climbs out of where it is read from when it has a .. part, by either separator: a Windows program path
// climbs with ..\ as a Unix one does with ../, and the daemon refuses both (connectd device/app_manifest.go).
export const climbs = path => typeof path === 'string' && path.split(/[\\/]/).includes('..')

// The paths a manifest names in the app's files or on the device — each run.command, each run.files template —, any
// that climbs out, or that a template path is not one inside the app's files (relative; no backslash or colon, which
// Windows reads as a separator or a drive). The schema says the same: these hold for a caller that has not run it.
function pathErrors(m) {
  const errors = []
  const command = m.run?.command
  const commands = typeof command === 'string' ? [['run.command', command]] : Object.entries(command ?? {}).map(([os, c]) => [`run.command.${os}`, c])
  for (const [where, c] of commands) if (climbs(c)) errors.push(`${where}: ${c} has a .. part: a program is in the app's files or an absolute path, never above them`)
  for (const [name, path] of Object.entries(m.run?.files ?? {})) {
    if (climbs(path) || path.startsWith('/') || /[\\:]/.test(path)) errors.push(`run.files.${name}: ${path} is not a path inside the app's files`)
  }
  return errors
}

// What a schema cannot check. readFile reads a file of the app's, for its rendered templates' references.
export function semanticErrors(m, readFile) {
  const errors = pathErrors(m)
  // A template path that climbs out is never read: the error above says why.
  if (errors.length) return errors
  const settings = m.settings ?? {}
  const texts = templates(m).map(t => ['the manifest', t])
  for (const [name, path] of Object.entries(m.run?.files ?? {})) {
    try {
      texts.push([`run.files.${name} (${path})`, readFile(path)])
    } catch {
      errors.push(`run.files.${name}: ${path} is not in the app's files`)
    }
  }
  for (const [where, text] of texts) {
    for (const [token, kind, name] of text.matchAll(TOKEN)) {
      if (token === '$${') continue
      const ref = `\${${kind}.${name}}`
      if (kind === 'setting' && !settings[name]) errors.push(`${where}: ${ref} is not a declared setting`)
      const problem = kind === 'remoteit' && remoteitProblem(m, name)
      if (problem) errors.push(`${where}: ${ref} ${problem}`)
    }
  }
  errors.push(...listenErrors(m, settings))
  for (const [name, s] of Object.entries(settings)) {
    if (s.type === 'choice') {
      const values = choicesOf(s).map(c => c.value)
      if (new Set(values).size !== values.length) errors.push(`settings.${name}: a choice's values are distinct`)
      if (s.default !== undefined && !values.includes(s.default)) errors.push(`settings.${name}: default ${s.default} is not one of its choices`)
      if (s.off !== undefined && !values.includes(s.off)) errors.push(`settings.${name}: off ${s.off} is not one of its choices`)
      for (const forced of Array.isArray(s.forcible) ? s.forcible : []) {
        if (!values.includes(forced)) errors.push(`settings.${name}: forcible ${forced} is not one of its choices`)
      }
    } else if (Array.isArray(s.forcible) || (s.forcible === true && s.type !== 'bool')) {
      errors.push(`settings.${name}: only a bool or a choice is forcible`)
    }
    if (s.type === 'int' && s.min !== undefined && s.max !== undefined && s.min > s.max) errors.push(`settings.${name}: min is above max`)
    for (const pattern of [s.pattern, s.item?.pattern].filter(p => p !== undefined)) {
      try {
        new RegExp(pattern, 'u')
      } catch {
        errors.push(`settings.${name}: pattern ${pattern} is not a regular expression`)
      }
    }
    // Its default, declared or implied, must be a value it allows: the same check every value meets.
    if (!errors.some(e => e.startsWith(`settings.${name}:`))) {
      const problem = settingProblem(s, defaultOf(s))
      if (problem) errors.push(`settings.${name}: its default ${JSON.stringify(defaultOf(s))} ${problem}`)
    }
  }
  errors.push(...archiveErrors(m))
  if (m.capabilities?.['person-accounts'] && m.run?.as !== 'root') errors.push('capabilities.person-accounts: root apps only')
  const gate = m.capabilities?.['ssh-exec']?.gate
  if (gate && settings[gate]?.type !== 'bool') errors.push(`capabilities.ssh-exec: gate ${gate} is not a declared bool setting`)
  if (gate && servicesOf(m)[0]?.protocol !== 'ssh') errors.push(`capabilities.ssh-exec: the ${Array.isArray(m.service) ? 'primary (first) ' : ''}service is not ssh`)
  return errors
}

// The OSes run.command can name, as an archive key's first part says them (Go's GOOS).
export const COMMAND_OSES = ['linux', 'darwin', 'windows']

// The program run on an OS: run.command's for it, or undefined where it names none (the app is unsupported there).
export function commandFor(m, os) {
  const c = m.run?.command
  return typeof c === 'string' ? c : c?.[os]
}

// What the schema cannot say of archives (written by the build tool): a platform's archive is one its run.command
// runs on, and one file is one SHA-256 under every key that names it.
function archiveErrors(m) {
  const errors = []
  const sums = new Map()
  for (const [key, {file, sha256}] of Object.entries(m.archives ?? {})) {
    const os = key === 'any' ? undefined : key.split('-')[0]
    if (os && commandFor(m, os) === undefined) errors.push(`archives.${key}: run.command names no program for ${os}`)
    if (sums.has(file) && sums.get(file) !== sha256) errors.push(`archives.${key}: ${file} is named with two SHA-256s`)
    sums.set(file, sha256)
  }
  return errors
}

// ---- the icon: a PNG, square, 64 to 512 pixels a side, at most 64 KB

export const ICON_BYTES_MOST = 65536
export const ICON_SIDE_LEAST = 64
export const ICON_SIDE_MOST = 512
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

// Why bytes are not an app's icon, or undefined when they are one. A PNG alone: an image every browser draws as
// pixels, which carries nothing that runs — never SVG, which can carry scripts and fetch what it names. Its size is
// read from its IHDR, the chunk a PNG starts with.
export function iconProblem(bytes) {
  if (bytes.length > ICON_BYTES_MOST) return `is ${bytes.length} bytes: an icon is at most ${ICON_BYTES_MOST}`
  const isPng = bytes.length >= 24 && PNG_SIGNATURE.every((b, i) => bytes[i] === b) && String.fromCharCode(...bytes.slice(12, 16)) === 'IHDR'
  if (!isPng) return 'is not a PNG: an icon is a PNG (never SVG, which can carry scripts)'
  const u32 = at => ((bytes[at] << 24) >>> 0) + (bytes[at + 1] << 16) + (bytes[at + 2] << 8) + bytes[at + 3]
  const [width, height] = [u32(16), u32(20)]
  if (width !== height) return `is ${width}×${height}: an icon is square`
  if (width < ICON_SIDE_LEAST || width > ICON_SIDE_MOST) return `is ${width}×${height}: an icon is ${ICON_SIDE_LEAST} to ${ICON_SIDE_MOST} pixels a side`
}

// ---- setting values: one check for every value, wherever it comes from (a default, the owner, a forcing)

// The JSON Schema a declaration's values meet: its type and every constraint it declares. A pattern matches the whole
// value.
export function valueSchema(s) {
  const anchored = pattern => `^(?:${pattern})$`
  switch (s.type) {
    case 'bool': return {type: 'boolean'}
    case 'int': return {type: 'integer', ...(s.min !== undefined ? {minimum: s.min} : {}), ...(s.max !== undefined ? {maximum: s.max} : {})}
    case 'string': return {type: 'string', maxLength: s.max_length ?? 256, ...(s.pattern !== undefined ? {pattern: anchored(s.pattern)} : {})}
    case 'choice': return {enum: choicesOf(s).map(c => c.value)}
    case 'list': return {
      type: 'array', maxItems: s.max_items ?? 32,
      items: {type: 'string', maxLength: s.item?.max_length ?? 256, ...(s.item?.pattern !== undefined ? {pattern: anchored(s.item.pattern)} : {})},
    }
  }
}

// Why a value is not one a declaration allows, or undefined when it is: valueSchema's every keyword, checked in the
// order and words ajv checks and says them in (so a value's problem reads the same as a schema's), with no ajv — which
// compiles with new Function, refused under a page's Content-Security-Policy without unsafe-eval (the portal's).
export function settingProblem(s, value) {
  const errors = valueErrors(valueSchema(s), value, '')
  return errors.length ? errors.join('; ') : undefined
}

const TYPES = {boolean: v => typeof v === 'boolean', integer: Number.isInteger, string: v => typeof v === 'string', array: Array.isArray}
// A string's length as JSON Schema counts it: code points, not UTF-16 units.
const length = text => [...text].length

function valueErrors(schema, value, at) {
  const say = message => `${at} ${message}`.trim()
  if (schema.enum) return schema.enum.includes(value) ? [] : [say('must be equal to one of the allowed values')]
  if (!TYPES[schema.type](value)) return [say(`must be ${schema.type}`)]
  const errors = []
  if (schema.maximum !== undefined && value > schema.maximum) errors.push(say(`must be <= ${schema.maximum}`))
  if (schema.minimum !== undefined && value < schema.minimum) errors.push(say(`must be >= ${schema.minimum}`))
  if (schema.maxLength !== undefined && length(value) > schema.maxLength) errors.push(say(`must NOT have more than ${schema.maxLength} characters`))
  if (schema.pattern !== undefined && !new RegExp(schema.pattern, 'u').test(value)) errors.push(say(`must match pattern "${schema.pattern}"`))
  if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(say(`must NOT have more than ${schema.maxItems} items`))
  if (schema.items) value.forEach((item, i) => errors.push(...valueErrors(schema.items, item, `${at}/${i}`)))
  return errors
}

// A setting's value before anyone sets it: its default; else false, its min or 0, '', no items, or a choice's off or
// first.
export function defaultOf(s) {
  if (s.default !== undefined) return s.default
  return {bool: false, int: s.min ?? 0, string: '', list: [], choice: s.off ?? choicesOf(s)[0]?.value}[s.type]
}

// A value as typed (--set, the owner's form): text to the setting's type, then checked. Throws why it is not one.
export function settingFrom(s, raw) {
  let value = raw
  if (s.type === 'bool') {
    if (raw !== 'true' && raw !== 'false') throw new Error('true or false')
    value = raw === 'true'
  } else if (s.type === 'int') {
    if (!/^-?\d+$/.test(raw)) throw new Error('an integer')
    value = Number(raw)
  } else if (s.type === 'list') {
    value = raw === '' ? [] : raw.split(',')
  }
  const problem = settingProblem(s, value)
  if (problem) throw new Error(s.type === 'choice' ? `one of ${choicesOf(s).map(c => `${c.value} (${c.label})`).join(', ')}` : problem)
  return value
}

// A choice setting's entries as {value, label}: the shorthand string is both.
export const choicesOf = s => (s.choices ?? []).map(c => (typeof c === 'string' ? {value: c, label: c} : {label: c.value, ...c}))

// A value as a template renders it: a list's items joined by commas, anything else as text.
const asText = value => (Array.isArray(value) ? value.join(',') : String(value))

// A template with its values put in. A value missing here is an error, never an empty string.
export function render(template, settings, remoteit) {
  return template.replace(TOKEN, (token, kind, name) => {
    if (token === '$${') return '${'
    const value = kind === 'setting' ? settings[name] : remoteit[name]
    if (value === undefined) throw new Error(`\${${kind}.${name}} has no value here`)
    return asText(value)
  })
}
