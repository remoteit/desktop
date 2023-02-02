import { ApplicationState } from '../store'
import { isRemote, isPortal } from '../services/Browser'
import seedRandom from 'seedrandom'

export function isRemoteUI(state: ApplicationState) {
  const { preferences } = state.backend
  return isRemote() && !preferences.remoteUIOverride && !isPortal()
}

export function createColor(email?: string) {
  return Math.ceil(seedRandom(email || '')() * 12)
}
