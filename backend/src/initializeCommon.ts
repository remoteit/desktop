import { initialize } from '@common/adaptor'
import escapeRegexp from 'escape-string-regexp'
import environment from './environment'
import preferences from './preferences'

initialize({
  getState: getState,
  getCloudData: getCloudData,
  escapeRegex: escapeRegexp,
  env: process.env,
})

function getState() {
  return {
    environment: environment.frontend,
    preferences: preferences.get(),
  }
}

function getCloudData(typeId?: number) {
  return {} as IApplicationType
}
