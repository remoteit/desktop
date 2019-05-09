import { init, RematchRootState } from '@rematch/core'
import * as models from './models'
import immerPlugin from '@rematch/immer'
import logger from 'redux-logger'

const plugins = [immerPlugin()]
const middlewares = [logger]

export const store = init({ models, plugins, redux: { middlewares } })

// export const { dispatch } = store

// Export types
export type Store = typeof store
export type Dispatch = typeof store.dispatch
export type ApplicationState = RematchRootState<typeof models>
