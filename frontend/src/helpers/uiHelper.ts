import { ApplicationState } from '../store'
import seedRandom from 'seedrandom'
import browser from '../services/Browser'

export function isRemoteUI(state: ApplicationState) {
  const { preferences } = state.backend
  return browser.isRemote && !preferences.remoteUIOverride
}

export function createColor(email?: string) {
  return Math.ceil(seedRandom(email || '')() * 12)
}
