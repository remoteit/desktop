import { init, RematchRootState } from '@rematch/core'
import { models, RootModel } from './models'
import { createLogger } from 'redux-logger'
import immerPlugin from '@rematch/immer'

const logger = createLogger({
  predicate: () => !!(window as any).stateLogging,
})

let middlewares = [logger]

export const store = init({ models, plugins: [immerPlugin() as any], redux: { middlewares } })

// Export types
export type extractStateFromModel<a extends RootModel> = {
  [modelKey in keyof a]: a[modelKey]['state']
}
export type Store = typeof store
export type Dispatch = typeof store.dispatch
export type ApplicationState = RematchRootState<typeof models>
