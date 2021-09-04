import { Models } from '@rematch/core'
import accounts from './accounts'
import analytics from './analytics'
import announcements from './announcements'
import applicationTypes from './applicationTypes'
import auth from './auth'
import backend from './backend'
import binaries from './binaries'
import connections from './connections'
import devices from './devices'
import feedback from './feedback'
import labels from './labels'
import licensing from './licensing'
import logs from './logs'
import search from './search'
import sessions from './sessions'
import shares from './shares'
import tags from './tags'
import ui from './ui'
export interface RootModel extends Models<RootModel> {
  accounts: typeof accounts
  analytics: typeof analytics
  announcements: typeof announcements
  applicationTypes: typeof applicationTypes
  auth: typeof auth
  backend: typeof backend
  binaries: typeof binaries
  connections: typeof connections
  devices: typeof devices
  feedback: typeof feedback
  labels: typeof labels
  licensing: typeof licensing
  logs: typeof logs
  search: typeof search
  sessions: typeof sessions
  shares: typeof shares
  tags: typeof tags
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
  connections,
  devices,
  feedback,
  labels,
  licensing,
  logs,
  search,
  sessions,
  shares,
  tags,
  ui,
}
