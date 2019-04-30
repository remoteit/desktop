import debug from 'debug'
import * as devices from './devices'
import * as auth from './auth'

const d = debug('r3:reducers')

export const initialState = {
  devices: devices.initialState,
  auth: auth.initialState,
}

export type Store = typeof initialState

export const reducer = (store: Store, action: Action) => {
  d('ACTION:', action)
  d('ORIGINAL STATE:', store)
  // d('NEW STATE:', newState)

  return {
    auth: auth.reducer(store.auth, action),
    devices: devices.reducer(store.devices, action),
  }
}
