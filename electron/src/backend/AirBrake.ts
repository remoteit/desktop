import fs from 'fs'
import path from 'path'
import { Notifier } from '@airbrake/node'
import { ENVIRONMENT } from './constants'

type AirbrakeConfig = { projectId?: number; projectKey?: string }

// electron-builder.config.js writes the key into the packaged package.json; source checkouts have none.
function readConfig(): AirbrakeConfig {
  try {
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..', 'package.json'), 'utf8')).airbrake || {}
  } catch {
    return {}
  }
}

const { projectId, projectKey } = readConfig()

const notifier = projectId && projectKey ? new Notifier({ projectId, projectKey, environment: ENVIRONMENT }) : undefined

// Only report from production builds. Development and test runs otherwise file
// errors from unreleased code against the production project, where they read
// as real user failures.
notifier?.addFilter(notice => (ENVIRONMENT === 'production' ? notice : null))

export default {
  notify: (notice: Parameters<Notifier['notify']>[0]) => notifier?.notify(notice),
}
