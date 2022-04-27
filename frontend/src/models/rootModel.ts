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
import contacts from './contacts'
import devices from './devices'
import feedback from './feedback'
import keys from './keys'
import labels from './labels'
import logs from './logs'
import mfa from './mfa'
import organization from './organization'
import plans from './plans'
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
  billing: typeof billing
  binaries: typeof binaries
  connections: typeof connections
  contacts: typeof contacts
  devices: typeof devices
  feedback: typeof feedback
  keys: typeof keys
  labels: typeof labels
  logs: typeof logs
  mfa: typeof mfa
  organization: typeof organization
  plans: typeof plans
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
  billing,
  binaries,
  connections,
  contacts,
  devices,
  feedback,
  keys,
  labels,
  logs,
  mfa,
  organization,
  plans,
  search,
  sessions,
  shares,
  tags,
  ui,
}
