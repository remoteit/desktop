import escapeRegexp from 'escape-string-regexp'
import { store } from './store'

export function getEnvironment() {
  return store.getState().backend.environment
}

export const escapeRegex = escapeRegexp
