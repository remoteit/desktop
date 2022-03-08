import { createModel } from '@rematch/core'
import { selectById } from '../models/devices'
import { DEFAULT_TARGET } from '../shared/constants'
import { getLocalStorage, setLocalStorage, getOs, isPortal } from '../services/Browser'
import { ApplicationState } from '../store'
import { RootModel } from './rootModel'
import { version } from '../../package.json'
import { emit } from '../services/Controller'
import sleep from '../services/sleep'
import analyticsHelper from '../helpers/analyticsHelper'

const NOTICE_VERSION_ID = 'notice-version'

type IBackendState = {
  initialized: boolean
  device: ITargetDevice
  targets: ITarget[]
  scanData: IScanData
  interfaces: IInterface[]
  error: boolean
  freePort?: number
  updateReady?: string
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
  device: DEFAULT_TARGET,
  targets: [],
  scanData: { wlan0: { data: [], timestamp: 0 } },
  interfaces: [],
  error: false,
  freePort: undefined,
  updateReady: undefined,
  environment: {
    os: getOs(),
    osVersion: '',
    arch: '',
    manufacturerDetails: undefined,
    adminUsername: undefined,
    isElevated: false,
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
    async targetDeviceUpdated(targetDevice: ITargetDevice, globalState) {
      const { ui, backend, devices } = dispatch
      const { device } = globalState.backend

      if (targetDevice?.uid !== device.uid) {
        // register
        if (targetDevice.uid && globalState.ui.setupRegisteringDevice) {
          const result = await devices.fetchSingle({ id: targetDevice.uid, thisDevice: true })
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
    },
    async targetUpdated(_: ITarget[], globalState) {
      const { user } = globalState.auth
      const { fetch } = dispatch.devices as any
      if (globalState.ui.setupBusy) {
        await fetch(user?.id)
        await dispatch.backend.updateDeferredAttributes()
        dispatch.ui.updated()
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
    async setUpdateNotice(updateVersion: string | undefined, globalState) {
      setLocalStorage(globalState, NOTICE_VERSION_ID, updateVersion)
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
