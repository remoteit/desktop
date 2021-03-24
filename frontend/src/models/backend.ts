import { createModel } from '@rematch/core'
import { selectById } from '../models/devices'
import { newConnection, setConnection } from '../helpers/connectionHelper'
import { DEFAULT_TARGET } from '../shared/constants'
import { platformConfiguration } from '../services/platformConfiguration'
import { RootModel } from './rootModel'
import { emit } from '../services/Controller'
import sleep from '../services/sleep'
import analyticsHelper from '../helpers/analyticsHelper'
import { GRAPHQL_API, GRAPHQL_BETA_API } from '../shared/constants'

type IBackendState = {
  connections: IConnection[]
  device: ITargetDevice
  targets: ITarget[]
  scanData: IScanData
  interfaces: IInterface[]
  error: boolean
  freePort?: number
  update?: string
  dataReady: boolean
  environment: {
    os?: Ios
    osVersion?: string
    arch?: string
    manufacturerDetails?: ManufacturerDetails
    adminUsername?: string
    isElevated: boolean
    privateIP: ipAddress
    hostname: string
    oobAvailable: boolean
  }
  preferences: IPreferences
  deferredAttributes?: IService['attributes']
  reachablePort: boolean
  reachablePortLoading: boolean
  backendSetting: IOverridesSetting
  initialized: boolean
}

const state: IBackendState = {
  connections: [],
  device: DEFAULT_TARGET,
  targets: [],
  scanData: { wlan0: { data: [], timestamp: 0 } },
  interfaces: [],
  error: false,
  freePort: undefined,
  update: undefined,
  dataReady: false,
  environment: {
    os: undefined,
    osVersion: '',
    arch: '',
    manufacturerDetails: undefined,
    adminUsername: undefined,
    isElevated: false,
    privateIP: '',
    hostname: '',
    oobAvailable: false,
  },
  preferences: {},
  deferredAttributes: undefined,
  reachablePort: true,
  reachablePortLoading: false,
  backendSetting: {
    apiURL: GRAPHQL_API,
    betaApiURL: GRAPHQL_BETA_API,
  },
  initialized: false,
}

export default createModel<RootModel>()({
  state,
  effects: dispatch => ({
    async targetDeviceUpdated(targetDevice: ITargetDevice, globalState) {
      const { ui, backend, devices } = dispatch
      const { device } = globalState.backend

      if (targetDevice?.uid !== device.uid) {
        // register
        if (targetDevice.uid && globalState.ui.setupRegisteringDevice) {
          const result = await devices.fetchSingle({ id: targetDevice.uid })
          if (!result) {
            // Instances were reported where a device wasn't returned
            await sleep(2000)
            await devices.fetch()
          }
          ui.set({
            setupRegisteringDevice: false,
            successMessage: 'Device registered successfully!',
          })

          // deleting
        } else if (globalState.ui.setupDeletingDevice) {
          const result = await devices.fetchSingle({ id: device.uid })
          if (result) {
            await sleep(2000)
            await devices.fetch()
          }
          ui.set({
            setupDeletingDevice: false,
            successMessage: 'Device unregistered successfully!',
          })

          // restoring
        } else if (globalState.ui.restoring) {
          ui.set({
            restoring: false,
            successMessage: 'Device restored successfully!',
          })
        }
      }

      backend.set({ device: targetDevice })
      platformConfiguration()
    },
    async targetUpdated(_: ITarget[], globalState) {
      const { user } = globalState.auth
      const { fetch } = dispatch.devices as any
      if (globalState.ui.setupBusy) {
        await fetch(user?.id)
        await dispatch.backend.updateDeferredAttributes()
        dispatch.ui.reset()
      }
    },
    async updateDeferredAttributes(_, globalState) {
      const { deferredAttributes, targets } = globalState.backend
      if (deferredAttributes) {
        const last = targets[targets.length - 1]
        if (last) {
          let [service] = selectById(globalState, last.uid)
          if (service) {
            service.attributes = { ...service.attributes, ...deferredAttributes }
            dispatch.devices.setServiceAttributes(service)
            dispatch.devices.set({ deferredAttributes: undefined })
          }
        }
      }
    },
    async registerDevice({ targets, name }: { targets: ITarget[]; name: string }, globalState) {
      const targetDevice = globalState.backend.device
      emit('registration', { device: { ...targetDevice, name }, targets })
      dispatch.ui.set({ setupRegisteringDevice: true })
      analyticsHelper.track('deviceCreated', { ...targetDevice, id: targetDevice.uid })
      targets.forEach(t => analyticsHelper.track('serviceCreated', { ...t, name, id: t.uid }))
    },
    async addTargetService(target: ITarget, globalState) {
      analyticsHelper.track('serviceCreated', { ...target, id: target.uid })
      dispatch.ui.set({ setupBusy: true, setupAddingService: true })
      emit('targets', [...globalState.backend.targets, target])
    },
    async removeTargetService(target: ITarget, globalState) {
      const targets = globalState.backend.targets
      const index = targets?.findIndex(t => t.uid === target.uid)
      analyticsHelper.track('serviceRemoved', { ...target, id: target.uid })
      let copy = [...globalState.backend.targets]
      copy.splice(index, 1)
      dispatch.ui.set({ setupBusy: true, setupServiceBusy: target.uid })
      emit('targets', copy)
    },
    async updateTargetService(target: ITarget, globalState) {
      const targets = globalState.backend.targets
      analyticsHelper.track('serviceUpdated', { ...target, id: target.uid })
      dispatch.ui.set({ setupBusy: true, setupServiceBusy: true })
      const tIndex = targets?.findIndex(t => t.uid === target.uid)
      targets[tIndex] = target
      emit('targets', targets)
    },

    async updateConnection(connection: IConnection, globalState) {
      const state = globalState.backend
      state.connections.some((c, index) => {
        if (c.id === connection.id) {
          state.connections[index] = connection
          dispatch.backend.set({ connections: state.connections })
          if (connection) return true
        }
        return false
      })
    },
    async updateConnections(connections: IConnection[], globalState) {
      connections.forEach(connection => {
        // data missing from cli if our connections file is lost
        if (!connection.owner) {
          const [service] = selectById(globalState, connection.id)
          if (service) {
            connection = { ...newConnection(service), ...connection }
            setConnection(connection)
          }
        }
      })
      dispatch.backend.set({ connections })
    },
  }),

  reducers: {
    set(state: IBackendState, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})
