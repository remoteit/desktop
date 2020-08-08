import { createModel } from '@rematch/core'
import { SharingManager } from '../services/SharingManager'


type ShareParams = { [key: string]: any }

type IShareState = ShareParams & {
  deleting: boolean,
  updating: boolean,
  sharing: boolean
}

const state: IShareState = {
  deleting: false,
  updating: false,
  sharing: false
}

export default createModel({
  state,
  effects: (dispatch: any) => ({

    async delete(userDevice: {deviceID: string, email: string}) {
      const {deviceID, email} = userDevice
      console.log({deviceID, email})
      const { set } = dispatch.shares
      set({deleting: true})
      await SharingManager.unshare({ deviceID, email })
      await dispatch.devices.get(deviceID)
      set({deleting: false})
    },

    async update(updateData?: any) {
      const { set } = dispatch.devices
      set({updating: true})
      await SharingManager.update(updateData)
      set({updating: false})
    },

    async share(newData?: any) {
      const { set } = dispatch.devices
      set({sharing: true})
      await SharingManager.share(newData)
      set({sharing: false})
    },

    async updateDeviceState(infoUpdate: {device: IDevice, contacts: string[], scripting: boolean, services: string[], isNew?: boolean}) {
      const {device, contacts, scripting, services, isNew} = infoUpdate

      const newUsers: IUser[] = contacts.map(email => ({email, scripting}))
      if (isNew) {
        device.access = device.access.concat(newUsers)
      } else {
        device.access = device.access.map(_ac => ({..._ac, scripting}))
      }

      services.length && device.services.map(service => {
      if (!service.access) {
        service.access = []
      }
      service.access = (services.includes(service.id)) ? service.access.concat(newUsers) :
            service.access.filter(_ac => !newUsers.find(user => user.email === _ac.email))
        return service
      })
      dispatch.devices.updateShareDevice(device)
    }
  
  }),
  reducers: {
    set(state: IShareState, params: ShareParams) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
    },
  },
})
