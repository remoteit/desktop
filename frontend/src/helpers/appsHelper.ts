import type { TFunction } from 'i18next'
import type { AppHeldBack, AvailableApp, DeviceApp, DeviceAppRootConsent } from '../services/graphQLDeviceApps'
import { needsNewer } from '../services/deviceAppsShared'
import type { SettingLock } from '../services/productPolicy'
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

// The same, for a row: Runs as root, or Restricted.
export const runsAsWord = (t: TFunction, root: boolean) =>
  root ? t('apps.runsAsRoot', 'Runs as root') : t('apps.restricted', 'Restricted')

// A channel by name: stable or beta, or the account's where none is set.
export const channelName = (t: TFunction, channel: string | null | undefined) =>
  channel === 'beta'
    ? t('deviceApps.beta', 'Beta')
    : channel === 'stable'
    ? t('deviceApps.stable', 'Stable')
    : channel || t('apps.accountChannel', 'Account’s')

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

export const platformsLine = (t: TFunction, platforms: string[]) =>
  platforms.includes('any') ? t('apps.anyPlatform', 'Any platform') : platformFamilies(platforms).join(' · ')

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
        ? t('deviceApps.consentedConverted', 'Runs as root, as its old install did: switched to the app by remote.it, {{when}}', words)
        : t('deviceApps.consentedCarried', 'Runs as root, as it did before consents were kept')
    default:
      return t('deviceApps.consented', 'Consented to run as root by {{by}}, {{when}}', words)
  }
}

// The machine's administrator refusing root apps (apps_root_control off), as graphql or the device says it.
const ROOT_REFUSED = /apps_root_control off|no apps that run as root/

// Its state as the device says it, with why where it says.
export function stateLine(t: TFunction, app: Pick<DeviceApp, 'state' | 'detail' | 'root' | 'awaitingRoot'>): string {
  if (needsNewer(app)) return t('deviceApps.needsNewer', 'Needs a newer remote.it on this device')
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

// A state in one word, for a row: Running, Starting, Disabled, Unavailable, Removing.
export function stateWord(t: TFunction, state: string): string {
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
  return t('apps.heldBack', 'Held back: {{reason}}', { reason })
}

export function heldBackReason(t: TFunction, heldBack: AppHeldBack, pinned?: string | null): string {
  switch (heldBack.reason) {
    case 'pinned':
      return pinned ? t('apps.heldPinnedTo', 'Pinned to {{version}}', { version: pinned }) : t('apps.heldPinned', 'Pinned')
    case 'consent':
      return t('apps.heldConsent', 'A new version needs to run as root')
    case 'daemon':
      return t('deviceApps.needsNewer', 'Needs a newer remote.it on this device')
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
  channel: null,
  version: null,
  state: 'disabled',
  detail: null,
  serviceId: null,
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
