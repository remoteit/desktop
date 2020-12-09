import { createModel } from '@rematch/core'
import { ApplicationState } from '../store'
import { RootModel } from './rootModel'
import { emit } from '../services/Controller'

type ServiceParams = { [key: string]: any }

type IServiceState = {
  port?: number
  host?: string
  isValid?: boolean
}

const state: IServiceState = {
  port: undefined,
  host: undefined,
  isValid: false,
}

export default createModel<RootModel>()({
  state,
  effects: (dispatch) => ({

    async checkService(data: IServiceProps, globalState) {
      const state = globalState as ApplicationState
      emit('service/check-host-port', data)
      try {
        const { set } = dispatch.shares
        set(data)
      } catch (error) {

      }
    },

  }),
  reducers: {
    set(state: IServiceState, params: ServiceParams) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})
