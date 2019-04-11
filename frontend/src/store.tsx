import React from 'react'
import produce from 'immer'
import debug from 'debug'
import { IFile } from 'remote.it'

// https://medium.com/simply/state-management-with-react-hooks-and-context-api-at-10-lines-of-code-baf6be8302c

const d = debug('r3:state')

//--------------------------------------------------------------------------------
// Initial state
//--------------------------------------------------------------------------------

export const state = {
  files: [] as IFile[],
}

type State = typeof state

//--------------------------------------------------------------------------------
// Actions
//--------------------------------------------------------------------------------

export const FETCHED_FILES = 'files/fetched'

//--------------------------------------------------------------------------------
// Reducer
//--------------------------------------------------------------------------------

export const reducer = (state: State, action: any) => {
  const newState = produce(state, draft => {
    switch (action.type) {
      case FETCHED_FILES:
        draft.files = action.files
    }
  })

  d('ACTION:', action)
  d('ORIGINAL STATE:', state)
  d('NEW STATE:', newState)

  return newState
}

//--------------------------------------------------------------------------------
// Providers
//--------------------------------------------------------------------------------

// @ts-ignore
export const StateContext = React.createContext()

export const StateProvider = ({
  children,
}: {
  children: React.ReactChildren
}) => (
  <StateContext.Provider value={React.useReducer(reducer, state)}>
    {children}
  </StateContext.Provider>
)

//--------------------------------------------------------------------------------
// State hook
//--------------------------------------------------------------------------------

export const useStore = () => React.useContext(StateContext)
