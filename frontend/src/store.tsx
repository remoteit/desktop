import React from 'react'
import { initialState, reducer, Store } from './reducers'

// https://medium.com/simply/state-management-with-react-hooks-and-context-api-at-10-lines-of-code-baf6be8302c

// TODO: Fix the need for the typescript ignore here
// @ts-ignore
export const StateContext = React.createContext<Store>({})

interface StateProviderProps {
  children: React.ReactChild | React.ReactChildren
}

export const StateProvider = ({ children }: StateProviderProps) => (
  <StateContext.Provider value={React.useReducer(reducer, initialState)}>
    {children}
  </StateContext.Provider>
)

type UseStoreProps = [
  Store,
  React.Dispatch<React.ReducerAction<typeof reducer>>
]

export const useStore = (): UseStoreProps => React.useContext(StateContext)

// Rematch
import { init, RematchRootState } from '@rematch/core'
import * as models from './models'
import immerPlugin from '@rematch/immer'

const plugins = [immerPlugin()]

export const store = init({ models, plugins })

// export const { dispatch } = store

// Export types
export type Store = typeof store
export type Dispatch = typeof store.dispatch
export type ApplicationState = RematchRootState<typeof models>
