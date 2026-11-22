import type { TFunction } from 'i18next'
import type {
  AppHeldBack,
  AvailableApp,
  DeviceApp,
  DeviceAppRootConsent,
  DeviceAppService,
} from '../services/graphQLDeviceApps'
import { needsNewer } from '../services/deviceAppsShared'
import type { SettingLock } from '../services/productPolicy'
import type { CatalogApp, CatalogAppRelease } from '../services/graphQLAppCatalog'
import { timeOptions } from '../components/Timestamp'

/* The words the Apps pages share (presence-server docs/device-apps-design.md, "The Apps pages"): who publishes an app,
   how it runs, its state on a device, why it is held back, its channel, and who consented to its running as root. */

// Its publisher, and the domain it proved where it has (build step 8): "By Acme · Verified: acme.com". The mark says who
// controls the domain, nothing about the code.
export const publisherLine = (t: TFunction, app: { publisher: string; publisherVerifiedDomain?: string | null }) =>
  [
    t('deviceApps.publisher', 'By {{publisher}}', { publisher: app.publisher }),
    app.publisherVerifiedDomain && t('deviceApps.verified', 'Verified: {{domain}}', { domain: app.publisherVerifiedDomain }),
  ]
    .filter(Boolean)
    .join(' · ')

// How it runs, in full: as root, full control of the device; or restricted, an account of its own there.
export const runsAsLine = (t: TFunction, root: boolean) =>
  root
    ? t('deviceApps.runsAsRoot', 'Runs as root: full control of this device')
    : t('deviceApps.runsRestricted', 'Runs restricted: an account of its own on this device')

// What an app needs of the device, said plainly where it needs more than an account of its own.
export const needsLine = (t: TFunction, root: boolean) =>
  root ? t('apps.needsFullControl', 'Needs full control of the device') : undefined

// The terminal app is named for what people use it as.
export const TERMINAL_APP = 'remoteit.console'
export const appName = (t: TFunction, app: { id: string; name: string }) =>
  app.id === TERMINAL_APP ? t('apps.terminalName', 'Terminal') : app.name

/* What an app does: its publisher's description, else a line built only from its name and how it opens, so an app
   without one is never given claims of ours. */
export function appPurpose(
  t: TFunction,
  app: { id: string; name: string; description?: string | null; protocol?: string | null }
): string {
  const said = app.description?.trim()
  if (said) return said
  const name = appName(t, app)
  switch (app.protocol) {
    case 'http':
    case 'https':
      return t('apps.purposeWeb', '{{name}} runs on the device and opens in your browser.', { name })
    case 'ssh':
      return t('apps.purposeTerminal', '{{name}} runs on the device and opens as a terminal.', { name })
    case 'vnc':
    case 'rdp':
      return t('apps.purposeScreen', '{{name}} runs on the device and shows its screen.', { name })
    default:
      return t('apps.purposeOther', '{{name}} runs on the device.', { name })
  }
}

// The same, for a row: Runs as root, or Restricted.
export const runsAsWord = (t: TFunction, root: boolean) =>
  root ? t('apps.runsAsRoot', 'Runs as root') : t('apps.restricted', 'Restricted')

/* What an app asks of the platform beyond an ordinary app's (its capabilities), each in words: shown beside Runs as
   root wherever it is offered, and part of the consent to it (presence-contract docs/self-contained-apps.md,
   "Manifest"). One this portal does not know is said by its name. */
export function capabilityWords(t: TFunction, capability: string): string {
  switch (capability) {
    case 'person-accounts':
      return t('apps.capabilityPersonAccounts', 'Keeps accounts for the people you share with')
    case 'person-certificates':
      return t('apps.capabilityPersonCertificates', 'Signs people in with their Remote.It certificate')
    case 'ssh-exec':
      return t('apps.capabilitySshExec', 'Lets AI run commands you allow')
    default:
      return capability
  }
}

export const capabilitiesLine = (t: TFunction, capabilities: string[] = []) =>
  capabilities.map(capability => capabilityWords(t, capability)).join(' · ')

// An app's icon, from how its service opens: a terminal, a page, a screen, else a box. No app has one of its own.
export const appIcon = (protocol?: string | null) =>
  protocol === 'ssh'
    ? 'terminal'
    : protocol === 'http' || protocol === 'https'
    ? 'globe'
    : protocol === 'vnc' || protocol === 'rdp'
    ? 'desktop'
    : 'cube'

// Open, in the words of how its service opens (its protocol): a page, a screen, a UDP service's connection (nothing to
// launch: the person's own UDP client uses its port), else its service's connection.
export function openWord(t: TFunction, protocol?: string | null): string {
  switch (protocol) {
    case 'udp':
      return t('deviceApps.connect', 'Connect')
    case 'http':
    case 'https':
      return t('deviceApps.openPage', 'Open page')
    case 'vnc':
    case 'rdp':
      return t('deviceApps.openScreen', 'Open screen')
    default:
      return t('deviceApps.open', 'Open')
  }
}

/* An app's service's host (graphql src/lib/service-host.ts appHost): remoteit-app-<publisher>-<app>, the id's dot a
   dash — the device itself, which its daemon serves. Every app's service is at its app's host, so only such a
   service is looked for among its device's apps. */
const APP_HOST_PREFIX = 'remoteit-app-'
export const appHost = (id: string) => `${APP_HOST_PREFIX}${id.toLowerCase().replace('.', '-')}`
const hostOf = (service?: Pick<IService, 'host'>) => (service?.host ?? '').trim().toLowerCase()
export const isAppService = (service?: Pick<IService, 'host'>) => hostOf(service).startsWith(APP_HOST_PREFIX)

/* The app a service belongs to: the one that names it among its services (DeviceApp.services' serviceId — an app may
   have several); while an app is disabled graphql names no service (it is kept, stopped), so the one whose host it is.
   An app that names another service is not this one's. */
export function serviceApp(apps: DeviceApp[] | null | undefined, service?: Pick<IService, 'id' | 'host'>) {
  if (!apps || !service || !isAppService(service)) return undefined
  return (
    apps.find(app => app.services.some(served => served.serviceId === service.id)) ??
    apps.find(app => !app.serviceId && appHost(app.id) === hostOf(service))
  )
}

// Which of its app's services a device's service is: the one naming it, or — the app disabled, found by its host —
// its primary.
export function appServiceOf(
  app: DeviceApp | undefined,
  service?: Pick<IService, 'id' | 'host'>
): DeviceAppService | undefined {
  if (!app || !service) return undefined
  const named = app.services.find(served => served.serviceId === service.id)
  if (named) return named
  return !app.serviceId && appHost(app.id) === hostOf(service) ? app.services[0] : undefined
}

// A channel by name: stable or beta, or the account's where none is set.
export const channelName = (t: TFunction, channel: string | null | undefined) =>
  channel === 'beta'
    ? t('deviceApps.beta', 'Beta')
    : channel === 'stable'
    ? t('deviceApps.stable', 'Stable')
    : channel || t('apps.accountChannel', 'Account’s')

// Where a stage's channel points at a release, as CatalogAppRelease.channels says it: "stable", "beta", or a candidate
// rolling out ("beta candidate"), with its share of the channel's devices where the channels say it.
export function releaseChannelName(
  t: TFunction,
  name: string,
  channels: { channel: string; candidate: string | null; share: number }[] = []
): string {
  const candidate = /^(\S+) candidate$/.exec(name)
  if (!candidate) return channelName(t, name)
  const channel = candidate[1]
  const share = channels.find(c => c.channel === channel && c.candidate)?.share
  return share
    ? t('apps.channelCandidateShare', '{{channel}} candidate, {{share}}% of its devices', {
        channel: channelName(t, channel),
        share,
      })
    : t('apps.channelCandidate', '{{channel}} candidate', { channel: channelName(t, channel) })
}

/* What a release asks a consent for, as graphql decides it (app-catalog.ts consentAsked): to run as root, and each
   capability it declares. A release that asks anything is turned on, pinned or moved to only with the person's yes
   (consentRoot), in words saying what it asks — root's full control where it runs as root, the capabilities where it
   declares them —, unless a consent already given covers it. One rule, wherever the portal decides. */
export type ConsentAsking = { root: boolean; capabilities?: string[] | null }
export const consentAsked = (release: ConsentAsking): string[] => [
  ...(release.root ? ['root'] : []),
  ...(release.capabilities ?? []),
]
export const asksConsent = (release: ConsentAsking | null | undefined): boolean =>
  !!release && consentAsked(release).length > 0

/* Whether a consent covers a release (graphql's coversRootAmong): one given to no release (from before consents were
   kept) covers as it always did; one given to a release covers `named` where that release asked everything `named`
   asks, and `named` is that release or an earlier one, or a later one with no release between lacking any of it.
   releases: the app's, newest first (by version), as the catalogue lists them, withdrawn ones too. Where either is not
   among them (only the newest are read), it covers only the release it was given to: asking again is safe — graphql
   keeps the newer yes —, while a yes not asked is refused. */
export function consentCovers(
  consent: { version?: string | null } | null | undefined,
  named: ConsentAsking & { version: string },
  releases: (ConsentAsking & { version: string })[]
): boolean {
  if (!consent) return false
  if (!consent.version) return true
  const asked = consentAsked(named)
  const has = (release: ConsentAsking) => asked.every(ask => consentAsked(release).includes(ask))
  const given = releases.findIndex(release => release.version === consent.version)
  const at = releases.findIndex(release => release.version === named.version)
  if (given < 0 || at < 0) return consent.version === named.version
  if (!has(releases[given])) return false
  return at >= given || releases.slice(at + 1, given).every(has)
}

/* The release a product names for an app (graphql's productRelease): its pin, else its channel's current — the
   account's channel where it names none, else stable —, else stable's current. None where that is withdrawn, or not
   among the releases read. */
export function productRelease(
  app: CatalogApp,
  channel: string | null | undefined,
  pin: string | null | undefined
): CatalogAppRelease | undefined {
  const current = (name: string) => app.channels.find(c => c.channel === name)?.current
  const version = pin || current(channel || app.accountChannel || 'stable') || current('stable')
  const release = app.releases.find(r => r.version === version)
  return release?.withdrawn ? undefined : release
}

/* What adding an app gives the devices, and so what it asks (graphql's releaseFor and channelVersion): the release
   pinned; else what the channel chosen gives — the account's where none is, else stable —: its candidate to the
   devices in its share, its current to the rest, and a channel naming none stable's. A withdrawn release is given to
   none. versions: those releases; root and capabilities: all they ask together, each release's as the catalogue lists
   it. known: false where one is not among the releases read (the newest only): what it asks is not known, and no yes
   is taken for it. */
export type AddAsks = { versions: string[]; root: boolean; capabilities: string[]; known: boolean }
export function addAsks(app: CatalogApp, channel: string | null | undefined, pin?: string | null): AddAsks {
  const gives = (name: string): string[] => {
    const row = app.channels.find(c => c.channel === name)
    const candidate = row?.candidate && row.share > 0 ? [row.candidate] : []
    if (row?.current) return [...candidate, row.current]
    return name === 'stable' ? candidate : [...candidate, ...gives('stable')]
  }
  const versions = pin ? [pin] : [...new Set(gives(channel || app.accountChannel || 'stable'))]
  const given = versions
    .map(version => ({ version, release: app.releases.find(release => release.version === version) }))
    .filter(({ release }) => !release?.withdrawn)
  const listed = given.flatMap(({ release }) => (release ? [release] : []))
  return {
    versions: given.map(({ version }) => version),
    root: listed.some(release => release.root),
    capabilities: [...new Set(listed.flatMap(release => release.capabilities))],
    known: listed.length === given.length,
  }
}

/* What the machine's administrator refuses of an app here (DeviceApp.adminControl), as graphql refuses it: under
   local, enabling, disabling and removing it (its channel and pin are taken); under off, enabling it (an add too). */
export type AppAdminAction = 'enable' | 'disable' | 'remove'
export const adminRefuses = (app: Pick<DeviceApp, 'adminControl'>, action: AppAdminAction): boolean =>
  app.adminControl === 'local' || (app.adminControl === 'off' && action === 'enable')

// What graphql and the device say of an app its administrator turned off (`<app>_control off`).
const TURNED_OFF = /turned off on this device by its administrator/i

// The administrator's control in words where it refuses enabling the app — an add too (adminRefuses 'enable'): local
// or off. None where it takes one.
export function adminControlLine(t: TFunction, app: { adminControl?: string | null }): string | undefined {
  if (app.adminControl === 'local')
    return t('apps.adminLocal', 'Kept local by this device’s administrator: changed on the device only')
  if (app.adminControl === 'off') return t('apps.adminOff', 'Turned off on this device by its administrator')
}

// The administrator's control in words, said up front where it refuses something — none where its state already says
// it (graphql's "Turned off on this device by its administrator (<app>_control off)").
export const adminLine = (t: TFunction, app: Pick<DeviceApp, 'adminControl' | 'detail'>): string | undefined =>
  app.adminControl === 'off' && TURNED_OFF.test(app.detail ?? '') ? undefined : adminControlLine(t, app)

// A product holding an app: its enable, disable, remove, channel and pin are the product's.
export const managedLine = (t: TFunction, locked: SettingLock) =>
  locked.product
    ? t('apps.managedBy', 'Managed by its product {{product}}', { product: locked.product })
    : t('apps.managed', 'Managed by its product')

// Archive keys as families — the OS, and the C library where it narrows Linux (musl): linux-arm64 and linux-amd64 are
// linux, linux-arm64-musl is linux-musl, any is any platform.
export function platformFamilies(platforms: string[]): string[] {
  const families = platforms.map(key => {
    const parts = key.split('-')
    if (parts[0] === 'any') return 'any'
    return parts[0] + (parts.includes('musl') ? '-musl' : '')
  })
  return families.filter((family, i) => families.indexOf(family) === i)
}

const FAMILY_NAMES: ILookup<string> = {
  linux: 'Linux',
  'linux-musl': 'Linux (musl)',
  darwin: 'macOS',
  windows: 'Windows',
  freebsd: 'FreeBSD',
  android: 'Android',
  ios: 'iOS',
}

export const platformsLine = (t: TFunction, platforms: string[]) =>
  platforms.includes('any')
    ? t('apps.anyPlatform', 'Any platform')
    : platformFamilies(platforms)
        .map(family => FAMILY_NAMES[family] ?? family)
        .join(' · ')

// A time as the person reads it, as Timestamp says a time.
export function when(at: string) {
  const date = new Date(at)
  return isNaN(date.getTime()) ? at : date.toLocaleDateString(navigator.language, timeOptions.minutes)
}

// A day as the person reads it: 14 Nov 2026.
export function day(at: string) {
  const date = new Date(at)
  return isNaN(date.getTime())
    ? at
    : date.toLocaleDateString(navigator.language, { day: 'numeric', month: 'short', year: 'numeric' })
}

// Who consented to its running as root, and when — or how it came to run as root without a person's word here.
export function consentLine(t: TFunction, consent: DeviceAppRootConsent): string {
  const words = { by: consent.email || consent.by, when: when(consent.at) }
  switch (consent.via) {
    case 'product':
      return t('deviceApps.consentedProduct', 'Runs as root by its product’s consent: {{by}}, {{when}}', words)
    case 'registration':
      return t('deviceApps.consentedRegistration', 'Runs as root since this device registered, {{when}}', words)
    case 'device':
      return t('deviceApps.consentedDevice', 'Turned on as root on the device by {{by}}, {{when}}', words)
    case 'carried':
      // To a release: switched by itself from its old install (ScreenView), which ran as root. To none: from before
      // consents were kept.
      return consent.version
        ? t('deviceApps.consentedConverted', 'Runs as root, as its old install did: switched to the app by Remote.It, {{when}}', words)
        : t('deviceApps.consentedCarried', 'Runs as root, as it did before consents were kept')
    default:
      return t('deviceApps.consented', 'Consented to run as root by {{by}}, {{when}}', words)
  }
}

// The yes, in words: to full control where a release runs as root, else to what it asks of remote.it.
export function allowLine(t: TFunction, root: boolean, product: boolean, publisher: string, app: string): string {
  const words = { publisher, app }
  if (root)
    return product
      ? t(
          'apps.allowRootProduct',
          'I allow {{publisher}}’s {{app}} full control of every device in this product',
          words
        )
      : t('apps.allowRootDevices', 'I allow {{publisher}}’s {{app}} full control of these devices', words)
  return product
    ? t('apps.allowAsksProduct', 'I allow {{publisher}}’s {{app}} what it asks on every device in this product', words)
    : t('apps.allowAsksDevices', 'I allow {{publisher}}’s {{app}} what it asks on these devices', words)
}

// A release waiting for a consent, by what it asks: to run as root, or more of remote.it (its capabilities).
export const heldConsentWords = (t: TFunction, root: boolean) =>
  root
    ? t('apps.heldConsent', 'A new version needs to run as root')
    : t('apps.heldConsentAsks', 'A new version asks for more access')
// Whether the release a consent is waited for runs as root, as graphql's words for it say (device-apps.ts
// needsConsentOf: "… needs to run as root", else "… asks for <capabilities>"); none said: as before capabilities did.
export const heldConsentRoot = (heldBack: Pick<AppHeldBack, 'detail'>) =>
  !heldBack.detail || /run as root/.test(heldBack.detail)

// The machine's administrator refusing root apps (apps_root_control off), as graphql or the device says it.
const ROOT_REFUSED = /apps_root_control off|no apps that run as root/

/* A release withdrawn by its publisher (presence-server docs/device-apps-design.md, "Lifecycle", Edge cases), as it is
   said of an app: graphql's own sentences (services/device-apps.ts WITHDRAWN, withdrawnDisabled — "Its release was
   withdrawn by its publisher: removed from the device …"), whole as they are; the daemon's own words, as This device
   reads them from connectd (DEVICE_WITHDRAWN "withdrawn by its publisher"); and one its administrator keeps
   (apps_withdrawn_control keep under <app>_control local) — graphql's KEPT_WITHDRAWN, or the daemon's same words in
   lower case. */
const WITHDRAWN = /^its release was withdrawn by its publisher\b/i
const DEVICE_WITHDRAWN = /^withdrawn by its publisher\.?$/i
const KEPT_WITHDRAWN = /^kept by this device.s administrator, though its release was withdrawn\.?$/i

export type Withdrawal = 'withdrawn' | 'kept'
export function withdrawal(app: { detail: string | null }): Withdrawal | undefined {
  const detail = app.detail?.trim() ?? ''
  if (WITHDRAWN.test(detail) || DEVICE_WITHDRAWN.test(detail)) return 'withdrawn'
  if (KEPT_WITHDRAWN.test(detail)) return 'kept'
}

// A withdrawal's words, once: graphql's sentence as it is; the daemon's in the portal's words.
function withdrawalWords(t: TFunction, app: { detail: string | null }): string {
  const detail = app.detail?.trim() ?? ''
  if (DEVICE_WITHDRAWN.test(detail)) return t('apps.withdrawnByPublisher', 'Withdrawn by its publisher')
  if (KEPT_WITHDRAWN.test(detail))
    return t('apps.keptWithdrawn', 'Kept by this device’s administrator, though its release was withdrawn')
  return detail
}

// Its state as the device says it, with why where it says.
export function stateLine(t: TFunction, app: Pick<DeviceApp, 'state' | 'detail' | 'root' | 'awaitingRoot'>): string {
  if (needsNewer(app)) return t('deviceApps.needsNewer', 'Needs a newer agent on this device')
  // Withdrawn, or kept though withdrawn: the words say it all where it cannot run ("Not available here: Its release
  // was withdrawn …" would say it twice); a state that runs or is disabled keeps its word before them.
  const withdrawn = withdrawal(app)
  if (withdrawn) {
    const words = withdrawalWords(t, app)
    if (app.state === 'unavailable') return words
    if (app.state === 'running') return t('deviceApps.runningDetail', 'Running — {{detail}}', { detail: words })
    if (app.state === 'starting') return t('deviceApps.startingDetail', 'Starting — {{detail}}', { detail: words })
    if (app.state === 'disabled') return t('apps.disabledDetail', 'Disabled — {{detail}}', { detail: words })
  }
  if (app.state === 'unavailable' && app.root && ROOT_REFUSED.test(app.detail ?? ''))
    return t(
      'deviceApps.rootRefused',
      'Not allowed here: this device’s administrator does not allow apps that run as root (apps_root_control off)'
    )
  switch (app.state) {
    case 'running':
      // Why a newer release waits while it runs the one before — but not one waiting for a consent, which says so on
      // its own line.
      return app.detail && !app.awaitingRoot
        ? t('deviceApps.runningDetail', 'Running — {{detail}}', { detail: app.detail })
        : t('deviceApps.running', 'Running')
    case 'starting':
      return app.detail
        ? t('deviceApps.startingDetail', 'Starting — {{detail}}', { detail: app.detail })
        : t('deviceApps.starting', 'Starting — waiting for the device to say so')
    case 'unavailable':
      return app.detail
        ? t('deviceApps.unavailable', 'Not available here: {{detail}}', { detail: app.detail })
        : t('deviceApps.unavailableNoDetail', 'Not available here')
    case 'removing':
      return t('apps.removing', 'Removing…')
    default:
      return app.detail
        ? t('apps.disabledDetail', 'Disabled — {{detail}}', { detail: app.detail })
        : t('apps.disabled', 'Disabled')
  }
}

/* An app's state on a device in a word or two, with what more the device says where it says more: Running, Starting,
   Off, Not available (Withdrawn where its release was), Needs update, Not allowed, Removing. problem marks a state
   that keeps it from running while it is on. */
export function appStatus(
  t: TFunction,
  app: Pick<DeviceApp, 'state' | 'detail' | 'root' | 'awaitingRoot'>
): { word: string; detail?: string; problem?: boolean } {
  if (needsNewer(app))
    return {
      word: t('apps.statusNeedsUpdate', 'Needs update'),
      detail: t('apps.statusNeedsUpdateDetail', 'Update the agent on this device to run this app.'),
      problem: true,
    }
  if (app.state === 'unavailable' && app.root && ROOT_REFUSED.test(app.detail ?? ''))
    return {
      word: t('apps.statusNotAllowed', 'Not allowed'),
      detail: t('apps.statusRootRefused', 'This device’s administrator does not allow apps that need full control.'),
      problem: true,
    }
  const withdrawn = withdrawal(app)
  const detail = (withdrawn ? withdrawalWords(t, app) : app.detail?.trim()) || undefined
  switch (app.state) {
    case 'running':
      return { word: t('apps.stateRunning', 'Running'), detail: app.awaitingRoot ? undefined : detail }
    case 'starting':
      return { word: t('apps.stateStarting', 'Starting'), detail }
    case 'unavailable':
      return {
        word: withdrawn === 'withdrawn' ? t('apps.stateWithdrawn', 'Withdrawn') : t('apps.stateNotAvailable', 'Not available'),
        detail,
        problem: true,
      }
    case 'removing':
      return { word: t('apps.removing', 'Removing…') }
    default:
      return { word: t('apps.stateOff', 'Off'), detail }
  }
}

// A state in one word, for a row: Running, Starting, Disabled, Unavailable — Withdrawn where its release was —, Removing.
export function stateWord(t: TFunction, state: string, detail?: string | null): string {
  if (state === 'unavailable' && withdrawal({ detail: detail ?? null }) === 'withdrawn')
    return t('apps.stateWithdrawn', 'Withdrawn')
  switch (state) {
    case 'running':
      return t('apps.stateRunning', 'Running')
    case 'starting':
      return t('apps.stateStarting', 'Starting')
    case 'unavailable':
      return t('apps.stateUnavailable', 'Unavailable')
    case 'removing':
      return t('apps.removing', 'Removing…')
    default:
      return t('apps.disabled', 'Disabled')
  }
}

// Why it does not run the version its channel gives, in words: graphql's detail where it said one, else the reason's.
export function heldBackLine(t: TFunction, heldBack: AppHeldBack, pinned?: string | null): string {
  const reason = heldBackReason(t, heldBack, pinned)
  return t('apps.heldBack', 'Not updated: {{reason}}', { reason })
}

export function heldBackReason(t: TFunction, heldBack: AppHeldBack, pinned?: string | null): string {
  switch (heldBack.reason) {
    case 'pinned':
      return pinned ? t('apps.heldPinnedTo', 'Pinned to {{version}}', { version: pinned }) : t('apps.heldPinned', 'Pinned')
    case 'consent':
      // graphql says what the release waiting asks (device-apps.ts needsConsentOf): running as root, or capabilities.
      return heldConsentWords(t, heldConsentRoot(heldBack))
    case 'daemon':
      return t('deviceApps.needsNewer', 'Needs a newer agent on this device')
    default:
      if (heldBack.detail) return heldBack.detail
      switch (heldBack.reason) {
        case 'platform':
          return t('apps.heldPlatform', 'No build for this device’s platform')
        case 'untrusted':
          return t('apps.heldUntrusted', 'The device refused its publisher’s signature')
        case 'ungranted':
          return t('apps.heldUngranted', 'The device refused its delivery grant')
        case 'unavailable':
          return t('apps.heldUnavailable', 'Not available on this device')
        case 'pending':
          return t('apps.heldPending', 'Given, and the device has not said it runs it yet')
        default:
          return heldBack.reason
      }
  }
}

// An app offered (the device's catalogue, ScreenView's old install) as the row it will be once added: disabled, with
// nothing installed.
export const offered = (app: AvailableApp): DeviceApp => ({
  id: app.id,
  name: app.name,
  publisher: app.publisher,
  publisherVerifiedDomain: app.publisherVerifiedDomain ?? null,
  root: app.root,
  enabled: false,
  adminControl: app.adminControl,
  channel: null,
  version: null,
  state: 'disabled',
  detail: null,
  serviceId: null,
  protocol: app.protocol ?? null,
  capabilities: app.capabilities ?? [],
  hostKey: null,
  sessions: [],
  sessionsOpen: 0,
  services: app.services ?? [],
  settings: [],
})

// One device's result of a many-device call: Added · Enabled · Already there (or Unchanged) · Changed · Refused: why.
export function outcomeLine(
  t: TFunction,
  change: { outcome: string; error: string | null },
  adding?: boolean
): string {
  switch (change.outcome) {
    case 'added':
      return t('apps.outcomeAdded', 'Added')
    case 'enabled':
      return t('apps.outcomeEnabled', 'Enabled')
    case 'changed':
      return t('apps.outcomeChanged', 'Changed')
    case 'unchanged':
      return adding ? t('apps.outcomeThere', 'Already there') : t('apps.outcomeUnchanged', 'Unchanged')
    default:
      return change.error
        ? t('apps.outcomeRefused', 'Refused: {{why}}', { why: change.error })
        : t('apps.outcomeRefusedNoWhy', 'Refused')
  }
}
