import { createModel } from '@rematch/core'
import { RootModel } from './rootModel'
import { emit } from '../services/Controller'

type ServiceParams = { [key: string]: any }

type IServiceState = {
  port?: number
  host?: string
  isValid?: boolean
  loading?: boolean
}

const state: IServiceState = {
  port: undefined,
  host: undefined,
  isValid: false,
  loading: false,
}

export default createModel<RootModel>()({
  state,
  effects: dispatch => ({
    async checkService(data: IServiceState) {
      const { set } = dispatch.service
      try {
        set({ loading: true })
        emit('service/check-host-port', data)
      } catch (error) {
        set({ isValid: false })
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
