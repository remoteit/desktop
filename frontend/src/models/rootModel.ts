import { Models } from '@rematch/core'
import accounts from './accounts'
import analytics from './analytics'
import announcements from './announcements'
import applicationTypes from './applicationTypes'
import auth from './auth'
import backend from './backend'
import billing from './billing'
import binaries from './binaries'
import connections from './connections'
import devices from './devices'
import feedback from './feedback'
import labels from './labels'
import licensing from './licensing'
import logs from './logs'
import organization from './organization'
import search from './search'
import sessions from './sessions'
import shares from './shares'
import tags from './tags'
import ui from './ui'
import mfa from './mfa'

export interface RootModel extends Models<RootModel> {
  accounts: typeof accounts
  analytics: typeof analytics
  announcements: typeof announcements
  applicationTypes: typeof applicationTypes
  auth: typeof auth
  backend: typeof backend
  billing: typeof billing
  binaries: typeof binaries
  connections: typeof connections
  devices: typeof devices
  feedback: typeof feedback
  labels: typeof labels
  licensing: typeof licensing
  logs: typeof logs
  organization: typeof organization
  search: typeof search
  sessions: typeof sessions
  shares: typeof shares
  tags: typeof tags
  ui: typeof ui
  mfa: typeof mfa
}

export const models: RootModel = {
  accounts,
  analytics,
  announcements,
  applicationTypes,
  auth,
  backend,
  billing,
  binaries,
  connections,
  devices,
  feedback,
  labels,
  licensing,
  logs,
  organization,
  search,
  sessions,
  shares,
  tags,
  ui,
  mfa
}
