import { Notifier } from '@airbrake/node'
import { ENVIRONMENT } from './constants'
import packageJson from './packageJson'

const { projectId, projectKey } = packageJson.airbrake ?? {}

// Only report from production builds. Development and test runs otherwise file
// errors from unreleased code against the production project, where they read
// as real user failures.
const notifier =
  ENVIRONMENT === 'production' && projectId && projectKey
    ? new Notifier({ projectId, projectKey, environment: ENVIRONMENT })
    : undefined

export default {
  notify: (notice: Parameters<Notifier['notify']>[0]) => notifier?.notify(notice),
}
