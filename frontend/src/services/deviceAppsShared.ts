/* What the device apps' services and pages share that needs nothing else loaded: a change's answer — done, or graphql's
   refusal in its own words —, why an app is held back, and the words graphql gives a release a device's remote.it is
   too old to run. */

export type Refused = { reason: string }
export type AppChange<T> = T | Refused

export const refused = (result: unknown): result is Refused =>
  !!result && typeof result === 'object' && 'reason' in result && typeof (result as Refused).reason === 'string'

// A choice as its owner sees it (label) and as the app gets it (value). The manifest's string shorthand is both, so a
// choice graphql gives as a string, or without a label, is labelled by its value.
export type AppSettingChoice = { value: string; label: string }
export const choiceOf = (choice: any): AppSettingChoice =>
  typeof choice === 'string' ? { value: choice, label: choice } : { value: choice.value, label: choice.label || choice.value }

// What graphql says of a release a device's remote.it is too old to run — restricted, a script or bundle, one served on
// a socket — where it is enabled: its state unavailable, this its detail.
export const NEEDS_NEWER = 'Needs a newer remote.it on this device'
export const needsNewer = (app: { state: string; detail: string | null }) =>
  app.state === 'unavailable' && app.detail === NEEDS_NEWER

/* Why an enabled app does not run the version its channel gives (graphql's AppHeldBack), the first that holds: a pin, a
   new release waiting for root consent, a daemon too old, no build for its platform, its publisher's signature or its
   delivery grant refused there, the release refused or withdrawn, or given and not yet reported. */
export type AppHeldBackReason =
  | 'pinned'
  | 'consent'
  | 'daemon'
  | 'platform'
  | 'untrusted'
  | 'ungranted'
  | 'unavailable'
  | 'pending'
export type AppHeldBack = { reason: AppHeldBackReason | string; detail: string }
