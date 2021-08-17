import { Models } from '@rematch/core'
import auth from './auth'
import ui from './ui'

export interface RootModel extends Models<RootModel> {
  auth: typeof auth
  ui: typeof ui
}

export const models: RootModel = {
  auth,
  ui
}
