import escapeRegexp from 'escape-string-regexp'
import { findType } from './models/applicationTypes'
import { store } from './store'

export function getEnvironment() {
  return store.getState().backend.environment
}

export function getCloudData(typeId?: number) {
  return findType(store.getState().applicationTypes.all, typeId)
}

export const escapeRegex = escapeRegexp
