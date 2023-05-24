import escapeRegexp from 'escape-string-regexp'
import environment from './environment'
import preferences from './preferences'

export function getState() {
  return {
    environment: environment.frontend,
    preferences: preferences.get(),
  }
}

export function getCloudData(typeId?: number) {
  return {} as IApplicationType
}

export const escapeRegex = escapeRegexp
