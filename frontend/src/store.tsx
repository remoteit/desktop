import { init, RematchRootState } from '@rematch/core'
import { models, RootModel } from './models'
import { createLogger } from 'redux-logger'
import immer from '@rematch/immer'

console.log(`
                                               _
      S t a r t i n g           _             (_)   _
    ____  _____  ____    ___  _| |_  _____     _  _| |_
   / ___)| ___ ||    \\  / _ \\(_   _)| ___ |   | |(_   _)
  | |    | ____|| | | || |_| | | |_ | ____| _ | |  | |_
  |_|    |_____)|_|_|_| \\___/   \\__)|_____)(_)|_|   \\__)

  set window.stateLogging = true to enable redux state logging

  `)

const logger = createLogger({
  predicate: () => !!(window as any).stateLogging,
})

let immerInstance: any = immer
let middlewares = [logger]

export const store = init({ models, plugins: [immerInstance()], redux: { middlewares } })

// Export types
export type extractStateFromModel<a extends RootModel> = {
  [modelKey in keyof a]: a[modelKey]['state']
}
export type Store = typeof store
export type Dispatch = typeof store.dispatch
export type ApplicationState = RematchRootState<typeof models>
