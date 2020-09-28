import { createModel } from '@rematch/core'
import { graphQLUnShareDevice, graphQLShareDevice } from '../services/graphQLMutation'
import { graphQLGetErrors, graphQLHandleError } from '../services/graphQL'

type ShareParams = { [key: string]: any }

type IShareState = ShareParams & {
  deleting: boolean
  updating: boolean
  sharing: boolean
}

const state: IShareState = {
  deleting: false,
  updating: false,
  sharing: false,
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
    async delete(userDevice: { deviceId: string; email: string }) {
      const { deviceId, email } = userDevice
      const { set } = dispatch.shares
      set({ deleting: true })
      try {
        await graphQLUnShareDevice({ deviceId, email: [email] })
        await dispatch.devices.get({ deviceId })
      } catch (error) {
        await graphQLHandleError(error)
      }
      set({ deleting: false })
    },

    async share(newData?: any) {
      const { set } = dispatch.shares
      set({ sharing: true })
      try {
        const response = await graphQLShareDevice(newData)
        await graphQLGetErrors(response)
      } catch (error) {
        await graphQLHandleError(error)
      }
      set({ sharing: false })
    },

    async updateDeviceState(infoUpdate: {
      device: IDevice
      emails: string[]
      scripting: boolean
      services: string[]
      isNew?: boolean
    }) {
      const { device, emails, scripting, services, isNew } = infoUpdate

      const newUsers: IUser[] = emails.map(email => ({ email, scripting }))
      if (isNew) {
        device.access = device.access.concat(newUsers)
      } else {
        device.access = device.access.map(_ac => ({ ..._ac, scripting }))
      }

      services.length &&
        device.services.map(service => {
          if (!service.access) {
            service.access = []
          }
          service.access = services.includes(service.id)
            ? service.access.concat(newUsers)
            : service.access.filter(_ac => !newUsers.find(user => user.email === _ac.email))
          return service
        })
      dispatch.devices.updateShareDevice(device)
    },
  }),
  reducers: {
    set(state: IShareState, params: ShareParams) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
    },
  },
})
