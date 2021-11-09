import { store } from './store'
import { isWindows as isWin } from './services/Browser'

export function getEnvironment() {
  return store.getState().backend.environment
}

export function isWindows() {
  return isWin()
}
