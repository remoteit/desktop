import { createModel } from '@rematch/core'
import { getLocalStorage, setLocalStorage, getOs, isPortal } from '../services/Browser'
import { ApplicationState } from '../store'
import { RootModel } from '.'
import { version } from '../helpers/versionHelper'
import { emit } from '../services/Controller'
import sleep from '../services/sleep'

const NOTICE_VERSION_ID = 'notice-version'

type IBackendState = {
  initialized: boolean
  thisId: string
  scanData: IScanData
  interfaces: IInterface[]
  freePort?: number
  updateReady?: string
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
  reachablePort: boolean
  reachablePortLoading: boolean
  filePath?: string
}

const defaultState: IBackendState = {
  initialized: false,
  thisId: '',
  scanData: { wlan0: { data: [], timestamp: 0 } },
  interfaces: [],
  freePort: undefined,
  updateReady: undefined,
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
  reachablePort: true,
  reachablePortLoading: false,
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
            await devices.fetch()
          }
          ui.set({
            silent: true,
            setupRegisteringDevice: false,
            successMessage: 'Device registered successfully!',
          })

          // deleted
        } else if (state.ui.setupDeletingDevice) {
          console.log('DELETE THIS DEVICE', thisId)
          await connections.clearByDevice(thisId)
          await sleep(2000)
          await devices.fetch()
          await connections.fetch()

          ui.set({
            silent: true,
            setupBusy: false,
            setupDeletingDevice: false,
            redirect: '/devices',
            successMessage: 'Device unregistered successfully!',
          })

          // restored
        } else if (state.ui.restoring) {
          devices.fetch()
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
    async setUpdateNotice(updateVersion: string | undefined, globalState) {
      setLocalStorage(globalState, NOTICE_VERSION_ID, updateVersion)
    },
    async restart() {
      dispatch.ui.set({ waitMessage: 'updating' })
      emit('restart')
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

export function selectUpdateNotice(state: ApplicationState) {
  const { updateReady } = state.backend
  if (updateReady && updateReady !== version) {
    let notifiedVersion = getLocalStorage(state, NOTICE_VERSION_ID)
    if (notifiedVersion !== updateReady) return updateReady
  }
}
