import { Models } from '@rematch/core'
import accounts from './accounts'
import analytics from './analytics'
import applicationTypes from './applicationTypes'
import auth from './auth'
import backend from './backend'
import binaries from './binaries'
import devices from './devices'
import labels from './labels'
import licensing from './licensing'
import logs from './logs'
import announcements from './announcements'
import shares from './shares'
import ui from './ui'

export interface RootModel extends Models<RootModel> {
  accounts: typeof accounts
  analytics: typeof analytics
  announcements: typeof announcements
  applicationTypes: typeof applicationTypes
  auth: typeof auth
  backend: typeof backend
  binaries: typeof binaries
  devices: typeof devices
  labels: typeof labels
  licensing: typeof licensing
  logs: typeof logs
  shares: typeof shares
  ui: typeof ui
}

export const models: RootModel = {
  accounts,
  analytics,
  announcements,
  applicationTypes,
  auth,
  backend,
  binaries,
  devices,
  labels,
  licensing,
  logs,
  shares,
  ui,
}
