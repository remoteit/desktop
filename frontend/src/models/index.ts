import { Models } from '@rematch/core'
import accounts from './accounts'
import announcements from './announcements'
import applicationTypes from './applicationTypes'
import auth from './auth'
import backend from './backend'
import billing from './billing'
import binaries from './binaries'
import bluetooth from './bluetooth'
import connections from './connections'
import contacts from './contacts'
import devices from './devices'
import feedback from './feedback'
import files from './files'
import jobs from './jobs'
import keys from './keys'
import labels from './labels'
import logs from './logs'
import mfa from './mfa'
import networks from './networks'
import organization from './organization'
import plans from './plans'
import search from './search'
import sessions from './sessions'
import shares from './shares'
import tags from './tags'
import ui from './ui'
import user from './user'

export interface RootModel extends Models<RootModel> {
  accounts: typeof accounts
  announcements: typeof announcements
  applicationTypes: typeof applicationTypes
  auth: typeof auth
  backend: typeof backend
  billing: typeof billing
  binaries: typeof binaries
  bluetooth: typeof bluetooth
  connections: typeof connections
  contacts: typeof contacts
  devices: typeof devices
  feedback: typeof feedback
  files: typeof files
  jobs: typeof jobs
  keys: typeof keys
  labels: typeof labels
  logs: typeof logs
  mfa: typeof mfa
  networks: typeof networks
  organization: typeof organization
  plans: typeof plans
  search: typeof search
  sessions: typeof sessions
  shares: typeof shares
  tags: typeof tags
  ui: typeof ui
  user: typeof user
}

export const models: RootModel = {
  accounts,
  announcements,
  applicationTypes,
  auth,
  backend,
  billing,
  binaries,
  bluetooth,
  connections,
  contacts,
  devices,
  feedback,
  files,
  jobs,
  keys,
  labels,
  logs,
  mfa,
  networks,
  organization,
  plans,
  search,
  sessions,
  shares,
  tags,
  ui,
  user,
}
