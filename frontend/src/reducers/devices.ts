import produce from 'immer'
import { actions } from '../actions'
import { IDevice } from 'remote.it'

export const initialState = {
  all: [] as IDevice[],
  fetched: false,
  fetching: false,
}

export const reducer = (store: typeof initialState, action: Action) => {
  return produce(store, draft => {
    switch (action.type) {
      case actions.devices.fetching:
        draft.fetched = false
        draft.fetching = true
        break
      case actions.devices.fetched:
        draft.all = action.devices
        draft.fetched = true
        draft.fetching = false
        break
    }
  })
}
