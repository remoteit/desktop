import { init, RematchRootState } from '@rematch/core'
import { models, RootModel } from './models'
import { createLogger } from 'redux-logger'
import { fullVersion } from './helpers/versionHelper'
import immerPlugin from '@rematch/immer'

console.log(`

         s t a r t i n g
      ______ _____ ________ _______ ________ _____    __ _______ 
    /  ____/  ___/        /   _   /__   ___/  ___/  /  /__   __/ 
   /  /   /  ___/  /  /  /  /_/  /  /  /  /  ___/__/  /  /  /    
  /__/   /_____/__/__/__/_______/  /__/  /_____/__/__/  /__/     
   
  ${fullVersion()}
  Set window.stateLogging = true to enable redux state logging

  `)

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
