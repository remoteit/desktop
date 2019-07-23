import AirbrakeClient from 'airbrake-js'
import {
  AIRBRAKE_PROJECT_ID,
  AIRBRAKE_PROJECT_KEY,
  ENVIRONMENT,
} from './constants'

const airbrake = new AirbrakeClient({
  projectId: AIRBRAKE_PROJECT_ID,
  projectKey: AIRBRAKE_PROJECT_KEY,
  environment: ENVIRONMENT,
})

export default airbrake
