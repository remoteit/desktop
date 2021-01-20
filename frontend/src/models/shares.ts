import { createModel } from '@rematch/core'
import { graphQLUnShareDevice, graphQLShareDevice } from '../services/graphQLMutation'
import { graphQLGetErrors, graphQLCatchError } from '../services/graphQL'
import { attributeName } from '../shared/nameHelper'
import { ApplicationState } from '../store'
import { getDevices } from './accounts'
import { RootModel } from './rootModel'

type ShareParams = { [key: string]: any }

type IShareState = {
  deleting: boolean
  updating: boolean
  sharing: boolean
}

const state: IShareState = {
  deleting: false,
  updating: false,
  sharing: false,
}

export default createModel<RootModel>()({
  state,
  effects: dispatch => ({
    async delete(userDevice: { deviceId: string; email: string }) {
      const { deviceId, email } = userDevice
      const { set } = dispatch.shares
      set({ deleting: true })
      try {
        const response = await graphQLUnShareDevice({ deviceId, email: [email] })
        const errors = graphQLGetErrors(response)
        if (!errors) {
          await dispatch.devices.fetchSingle({ deviceId })
          dispatch.ui.set({ successMessage: `${email} successfully removed.` })
        }
      } catch (error) {
        await graphQLCatchError(error)
      }
      set({ deleting: false })
    },

    async share(data: IShareProps, globalState) {
      const state = globalState as ApplicationState
      const { set } = dispatch.shares
      const device = getDevices(state).find((d: IDevice) => d.id === data.deviceId)
      set({ sharing: true })
      try {
        const response = await graphQLShareDevice(data)
        const errors = graphQLGetErrors(response)
        if (!errors)
          dispatch.ui.set({
            successMessage:
              data.email.length > 1
                ? `${data.email.length} accounts successfully shared to ${attributeName(device)}.`
                : `${data.email[0]} successfully shared to ${attributeName(device)}.`,
          })
      } catch (error) {
        await graphQLCatchError(error)
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

      const newUsers: IUser[] = emails.map(email => ({ email, id: '', scripting }))
      if (isNew) {
        const access = device.access.filter(i => emails.includes(i.email))
        device.access =
          access.length === 0
            ? device.access.concat(newUsers)
            : device.access.map(_ac => (access.find(i => i.email === _ac.email) ? { ..._ac, scripting } : { ..._ac }))
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
      return state
    },
  },
})
