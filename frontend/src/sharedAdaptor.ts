import escapeRegexp from 'escape-string-regexp'
import { findType } from './models/applicationTypes'
import { store } from './store'

export function getState() {
  return store.getState().backend
}

export function getCloudData(typeId?: number) {
  return findType(store.getState().applicationTypes.all, typeId)
}

export const escapeRegex = escapeRegexp
