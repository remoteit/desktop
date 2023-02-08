import { createModel } from '@rematch/core'
import { graphQLUnShareDevice, graphQLShareDevice } from '../services/graphQLMutation'
import { getAccess } from '../helpers/userHelper'
import { attributeName } from '../shared/nameHelper'
import { getDevices } from '../selectors/devices'
import { RootModel } from '.'

type ShareParams = { [key: string]: any }

type CurrentDevice = {
  device: IDevice
  serviceId: string
  userSelected: IUserRef | undefined
  selectedServices: string[]
  users: string[]
  indeterminate: string[]
  script: boolean
  hasChange: boolean
  scriptIndeterminate: boolean
  shareChanged: boolean
}

type IShareState = {
  deleting: boolean
  updating: boolean
  sharing: boolean
  currentDevice?: CurrentDevice
}

const defaultState: IShareState = {
  deleting: false,
  updating: false,
  sharing: false,
  currentDevice: undefined,
}

export default createModel<RootModel>()({
  state: defaultState,
  effects: dispatch => ({
    async fetch(data: { email?: string; serviceId: string; device?: IDevice }, state) {
      const { set } = dispatch.shares
      const user = state.contacts.all.find(c => c.email === data.email)
      const permissions = data.device && getAccess(data.device, data.email)

      set({
        currentDevice: {
          device: data.device,
          serviceId: data.serviceId,
          userSelected: user,
          selectedServices: permissions?.services.map(s => s.id).filter(v => v) || [],
          script: permissions?.scripting || false,
          indeterminate: [],
          scriptIndeterminate: false,
        },
      })
    },

    async delete(userDevice: { deviceId: string; email: string }) {
      const { deviceId, email } = userDevice
      const { set } = dispatch.shares
      set({ deleting: true })
      const result = await graphQLUnShareDevice({ deviceId, email: [email] })
      if (result !== 'ERROR') {
        await dispatch.devices.fetchSingle({ id: deviceId })
        await dispatch.organization.fetch()
        dispatch.ui.set({ successMessage: `${email} successfully removed.` })
      }
      set({ deleting: false })
    },

    async share(data: IShareProps, state) {
      const { set } = dispatch.shares
      set({ sharing: true })
      const device = getDevices(state).find((d: IDevice) => d.id === data.deviceId)
      const result = await graphQLShareDevice(data)
      if (result !== 'ERROR') {
        await dispatch.devices.fetchSingle({ id: data.deviceId })
        await dispatch.contacts.fetch()
        dispatch.ui.set({
          successMessage:
            data.email.length > 1
              ? `${data.email.length} accounts shared to ${attributeName(device)}.`
              : `${attributeName(device)} shared to ${data.email[0]}.`,
        })
      }
      set({ sharing: false })
    },

    async setScript(script: boolean, state) {
      const { set } = dispatch.shares
      set({
        currentDevice: {
          ...state.shares.currentDevice,
          script,
        },
      })
    },

    async setSelectedServices(selectedServices: string[], state) {
      const { set } = dispatch.shares
      set({
        currentDevice: {
          ...state.shares.currentDevice,
          selectedServices,
        },
      })
    },

    async changeIndeterminate(indeterminate: string[], state) {
      const { set } = dispatch.shares
      set({
        currentDevice: {
          ...state.shares.currentDevice,
          indeterminate,
        },
      })
    },

    async selectAllServices(_: void, state) {
      const { set } = dispatch.shares
      set({
        currentDevice: {
          ...state.shares.currentDevice,
          indeterminate: [],
        },
      })
    },

    async changeScriptIndeterminate(scriptIndeterminate: boolean, state) {
      const { set } = dispatch.shares
      set({
        currentDevice: {
          ...state.shares.currentDevice,
          scriptIndeterminate,
        },
      })
    },

    async selectContacts(emails: string[], state) {
      const { set } = dispatch.shares
      if (!state.shares.currentDevice) return

      let intersection: string[] = []

      const currentDevice = state.shares.currentDevice
      const { device, serviceId } = currentDevice
      const contacts = state.contacts.all

      let userSelectedServices: string[][] = emails.map(email => {
        return device ? getAccess(device, email, true).services.map(s => s.id) : []
      })

      let userSelectedScript: boolean[] = emails.map(email => {
        return device ? getAccess(device, email).scripting : false
      })

      const match = userSelectedServices.map((services, index) => {
        intersection = index === 0 ? services : intersection.filter(value => services.includes(value))
        return intersection
      })
      const matchServices = match[match.length - 1]
      const indeterminateServices = userSelectedServices
        .flat()
        .filter((v, i, a) => a.indexOf(v) === i)
        .filter(value => !matchServices.includes(value))

      const unique: any = new Set(userSelectedScript)
      let scriptsValue = {}
      switch ([...Array.from(unique)].length) {
        case 1: {
          scriptsValue = {
            scriptIndeterminate: false,
            script: userSelectedScript[0],
          }
          break
        }
        case 0: {
          scriptsValue = {
            scriptIndeterminate: false,
            script: false,
          }
          break
        }
        default: {
          scriptsValue = {
            scriptIndeterminate: true,
            script: undefined,
          }
        }
      }

      const selectedServices = [...(matchServices ? [...matchServices, serviceId] : [serviceId])].filter(v => v)

      set({
        currentDevice: {
          ...currentDevice,
          ...scriptsValue,
          userSelected: contacts.find(c => emails.includes(c.email)),
          users: emails,
          indeterminate: indeterminateServices,
          selectedServices,
        },
      })
    },
  }),
  reducers: {
    set(state: IShareState, params: ShareParams) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})
