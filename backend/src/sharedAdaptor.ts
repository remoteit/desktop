import escapeRegexp from 'escape-string-regexp'
import environment from './environment'

export function getEnvironment() {
  return environment.frontend
}

export const escapeRegex = escapeRegexp
