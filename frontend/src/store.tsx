import { init, RematchRootState } from '@rematch/core'
import * as models from './models'
import immerPlugin from '@rematch/immer'
import selectPlugin from '@rematch/select'
import logger from 'redux-logger'

const plugins = [immerPlugin(), selectPlugin()]
const middlewares = []

if (process.env.NODE_ENV !== 'test') middlewares.push(logger)

export const store = init({ models, plugins, redux: { middlewares } })

export const { select } = store

// Export types
export type Store = typeof store
export type Dispatch = typeof store.dispatch
export type ApplicationState = RematchRootState<typeof models>
