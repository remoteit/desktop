import { init, RematchRootState } from '@rematch/core'
import { models, RootModel } from './models'
import { createLogger } from 'redux-logger'
import { fullVersion } from './helpers/versionHelper'
import immer from '@rematch/immer'

console.log(`

         s t a r t i n g
      ______ _____ ________ _______ ________ _____    __ ________ 
    /  ____/  ___/        /   _   /__   ___/  ___/  /  /__   ___/ 
   /  /   /  ___/  /  /  /  /_/  /  /  /  /  ___/__/  /  /  /     
  /__/   /_____/__/__/__/_______/  /__/  /_____/__/__/  /__/      
   
  ${fullVersion()}
  Set window.stateLogging = true to enable redux state logging

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
