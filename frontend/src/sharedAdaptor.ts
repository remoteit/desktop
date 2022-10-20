import { store } from './store'

export function getEnvironment() {
  return store.getState().backend.environment
}
