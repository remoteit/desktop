import { createModel } from '@rematch/core'
import { setLocalStorage, getOs, isPortal } from '../services/Browser'
import { RootModel } from '.'
import { emit } from '../services/Controller'
import sleep from '../services/sleep'

export const NOTICE_VERSION_ID = 'notice-version'

type IBackendState = {
  initialized: boolean
  thisId: string
  scanData: IScanData
  interfaces: IInterface[]
  freePort?: number
  updateStatus: {
    version?: string
    nextCheck: number
    checking: boolean
    available: boolean
    downloaded: boolean
    downloading: boolean
    error: boolean
  }
  environment: {
    os?: Ios
    osVersion?: string
    arch?: string
    manufacturerDetails?: ManufacturerDetails
    privateIP: ipAddress
    hostname: string
    oobAvailable: boolean
    overrides: IOverrides
    portal?: boolean
  }
  preferences: IPreferences
  deferredAttributes?: IService['attributes']
  reachablePort?: IPortScan
  canNavigate: { canGoBack: boolean; canGoForward: boolean }
  filePath?: string
}

const defaultState: IBackendState = {
  initialized: false,
  thisId: '',
  scanData: { wlan0: { data: [], timestamp: 0 } },
  interfaces: [],
  freePort: undefined,
  updateStatus: {
    nextCheck: 0,
    checking: false,
    available: false,
    downloaded: false,
    downloading: false,
    error: false,
  },
  environment: {
    os: getOs(),
    osVersion: '',
    arch: '',
    manufacturerDetails: undefined,
    privateIP: '',
    hostname: '',
    oobAvailable: false,
    overrides: {},
    portal: isPortal(),
  },
  preferences: {
    version: '',
    cliVersion: '',
  },
  deferredAttributes: undefined,
  reachablePort: undefined,
  canNavigate: { canGoBack: false, canGoForward: false },
  filePath: undefined,
}

export default createModel<RootModel>()({
  state: defaultState,
  effects: dispatch => ({
    async environment(_: void, state) {
      let result: string = ''
      const keys = ['os', 'osVersion', 'arch', 'manufacturerDetails']
      keys.forEach(key => {
        if (result) result += '\n'
        result += `${key}: ${JSON.stringify(state.backend.environment[key], null, 2)}`
      })
      return result
    },
    async targetDeviceUpdated(newId: string, state) {
      const { ui, backend, devices, connections } = dispatch
      const { thisId } = state.backend

      if (newId !== thisId) {
        // registered
        if (newId && state.ui.setupRegisteringDevice) {
          const result = await devices.fetchSingle({ id: newId, thisDevice: true })
          if (!result) {
            // Instances were reported where a device wasn't returned
            await sleep(2000)
            await devices.fetchList()
          }
          ui.set({
            setupRegisteringDevice: false,
            successMessage: 'Device registered successfully!',
          })

          // deleted
        } else if (state.ui.setupDeletingDevice) {
          console.log('DELETE THIS DEVICE', thisId)
          await connections.clearByDevice(thisId)
          await sleep(2000)
          await devices.fetchList()
          await connections.fetch()

          ui.set({
            setupBusy: false,
            setupDeletingDevice: false,
            redirect: '/devices',
            successMessage: 'Device unregistered successfully!',
          })

          // restored
        } else if (state.ui.restoring) {
          devices.fetchList()
          ui.set({
            restoring: false,
            successMessage: 'Device restored successfully!',
          })
        }
      }

      backend.set({ thisId: newId })
    },
    async registerDevice({ services, name }: { services: IService[]; name: string }, state) {
      dispatch.ui.set({ setupRegisteringDevice: true })
      const code = await dispatch.devices.createRegistration({
        name,
        services: services.map(t => ({
          name: t.name,
          application: t.typeID,
          port: t.port,
          host: t.host,
        })),
        accountId: state.user.id,
      })
      emit('registration', code)
    },
    async setUpdateNotice(updateVersion: string | undefined, state) {
      setLocalStorage(state, NOTICE_VERSION_ID, updateVersion)
    },
    async disableAutoUpdate(_: void, state) {
      emit('preferences', { ...state.backend.preferences, autoUpdate: false })
    },
    async install() {
      dispatch.ui.set({ waitMessage: 'updating' })
      emit('update/install')
    },
  }),

  reducers: {
    reset(state: IBackendState) {
      state = { ...defaultState }
      return state
    },
    set(state: IBackendState, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})
