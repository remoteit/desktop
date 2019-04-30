import produce from 'immer'
import { actions } from '../actions'
import { IUser } from 'remote.it'

export const initialState = {
  loginStarted: false,
  user: null as IUser | null,
}

export const reducer = (store: typeof initialState, action: Action) => {
  return produce(store, draft => {
    switch (action.type) {
      case actions.auth.login:
        draft.user = action.user
        draft.loginStarted = false
        break
      case actions.auth.loginStart:
        draft.loginStarted = true
        break
      case actions.auth.loginStopped:
        draft.loginStarted = false
        break
    }
  })
}
