import { createModel } from '@rematch/core'
import analytics from '../helpers/Analytics'
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
  
  }),
  reducers: {
    set(state: IShareState, params: ShareParams) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
    },
  },
})
