import React from 'react'
import produce from 'immer'
import debug from 'debug'
import { IFile } from 'remote.it'

// https://medium.com/simply/state-management-with-react-hooks-and-context-api-at-10-lines-of-code-baf6be8302c

const d = debug('r3:state')

//--------------------------------------------------------------------------------
// Initial state
//--------------------------------------------------------------------------------

export const initialState = {
  initializing: true,
  files: [] as IFile[],
}

export type Store = typeof initialState

//--------------------------------------------------------------------------------
// Actions
//--------------------------------------------------------------------------------

export const FETCHED_FILES = 'files/fetched'

//--------------------------------------------------------------------------------
// Reducer
//--------------------------------------------------------------------------------

interface Action {
  type: string
  [key: string]: any
}

export const reducer = (store: Store, action: Action) => {
  const newState = produce(store, draft => {
    switch (action.type) {
      case FETCHED_FILES:
        draft.files = action.files
    }
  })

  d('ACTION:', action)
  d('ORIGINAL STATE:', store)
  d('NEW STATE:', newState)

  return newState
}

//--------------------------------------------------------------------------------
// Providers
//--------------------------------------------------------------------------------

// @ts-ignore
export const StateContext = React.createContext<Store>({})

export const StateProvider = ({
  children,
}: {
  children: React.ReactChild | React.ReactChildren
}) => (
  <StateContext.Provider value={React.useReducer(reducer, initialState)}>
    {children}
  </StateContext.Provider>
)

//--------------------------------------------------------------------------------
// State hook
//--------------------------------------------------------------------------------

export const useStore = (): [
  Store,
  React.Dispatch<React.ReducerAction<typeof reducer>>
] => React.useContext(StateContext)
