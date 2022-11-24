import escapeRegexp from 'escape-string-regexp'
import environment from './environment'

export function getEnvironment() {
  return environment.frontend
}

export function getCloudData(typeId?: number) {
  return {} as IApplicationType
}

export const escapeRegex = escapeRegexp
