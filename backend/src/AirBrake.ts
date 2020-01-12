import { Notifier } from '@airbrake/node'
import { AIRBRAKE_PROJECT_ID, AIRBRAKE_PROJECT_KEY, ENVIRONMENT } from './constants'

export default new Notifier({
  projectId: AIRBRAKE_PROJECT_ID,
  projectKey: AIRBRAKE_PROJECT_KEY,
  environment: ENVIRONMENT,
})
