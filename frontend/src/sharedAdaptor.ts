import { store } from './store'
export { isPortal } from './services/Browser'

export function getEnvironment() {
  return store.getState().backend.environment
}
