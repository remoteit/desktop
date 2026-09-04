import { Notifier } from '@airbrake/node'
import { AIRBRAKE_PROJECT_ID, AIRBRAKE_PROJECT_KEY, ENVIRONMENT } from './constants'

const notifier = new Notifier({
  projectId: AIRBRAKE_PROJECT_ID,
  projectKey: AIRBRAKE_PROJECT_KEY,
  environment: ENVIRONMENT,
})

// Only report from production builds. Development and test runs otherwise file
// errors from unreleased code against the production project, where they read
// as real user failures.
notifier.addFilter(notice => (ENVIRONMENT === 'production' ? notice : null))

export default notifier
