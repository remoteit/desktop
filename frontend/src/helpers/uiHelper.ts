import { State } from '../store'
import seedRandom from 'seedrandom'
import browser from '../services/Browser'

export function isRemoteUI(state: State) {
  return browser.isRemote && !state.backend.preferences.remoteUIOverride
}

export function createColor(email?: string) {
  return Math.ceil(seedRandom(email || '')() * 12)
}
