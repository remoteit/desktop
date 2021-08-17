import { ApplicationState } from '../store'
import { isRemote } from '../services/Browser'

export function isRemoteUI(state: ApplicationState) {
  const { preferences } = state.backend
  return isRemote() && !preferences.remoteUIOverride
}
