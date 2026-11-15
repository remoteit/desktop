import type React from 'react'
import type { TFunction } from 'i18next'
import { CONSOLE, DeviceApp } from '../services/graphQLDeviceApps'
import { CONSOLE_APP } from './ConsoleApp'

/* remote.it's own apps' parts of the Apps section, keyed by app id: the portal's counterpart of graphql's APP_HOOKS
   (presence-server docs/device-apps-design.md, "Hooks: what only code can do"). Only remote.it's apps (`remoteit.*`)
   have one; any other app is drawn from what the API says of it alone. */
export type FirstPartyApp = {
  icon: string
  state?: (t: TFunction, app: DeviceApp) => string | undefined // its own words for a state, where it has them
  settings?: (t: TFunction) => Record<string, { label: string; help?: string }> // its settings' words, translated
  Lines?: React.FC<{ device: IDevice; app: DeviceApp }> // under its state
  Actions?: React.FC<{ device: IDevice; app: DeviceApp }> // beside its switch
}

export const FIRST_PARTY_APPS: Record<string, FirstPartyApp> = { [CONSOLE]: CONSOLE_APP }

export const firstPartyApp = (id: string): FirstPartyApp | undefined =>
  id.startsWith('remoteit.') ? FIRST_PARTY_APPS[id] : undefined
