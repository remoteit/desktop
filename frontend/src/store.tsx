import { init, RematchRootState } from '@rematch/core'
import {models} from './models/rootModel'
import immer from '@rematch/immer'
import logger from 'redux-logger'

let middlewares: any[] = []

if (process.env.NODE_ENV !== 'test') middlewares.push(logger)

export const store = init({ models, plugins: [immer()], redux: { middlewares } })

// Export types
export type Store = typeof store
export type Dispatch = typeof store.dispatch
export type ApplicationState = RematchRootState<typeof RootModel>
