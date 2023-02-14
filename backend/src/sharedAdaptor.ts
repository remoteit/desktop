import escapeRegexp from 'escape-string-regexp'
import environment from './environment'
import preferences from './preferences'

export function getEnvironment() {
  return environment.frontend
}

export function certificateEnabled() {
  return !!preferences.get().useCertificate
}

export function getCloudData(typeId?: number) {
  return {} as IApplicationType
}

export const escapeRegex = escapeRegexp
