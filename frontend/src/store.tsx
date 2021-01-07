import { init, RematchRootState } from '@rematch/core'
import { models } from './models/rootModel'
import { createLogger } from 'redux-logger'
import immer from '@rematch/immer'

const logger = createLogger({
  predicate: () => !!(window as any).LOG_STATE,
})

let immerInstance: any = immer
let middlewares = [logger]

export const store = init({ models, plugins: [immerInstance()], redux: { middlewares } })

// Export types
export type Store = typeof store
export type Dispatch = typeof store.dispatch
export type ApplicationState = RematchRootState
