import network from './Network'
import { store, dispatch } from '../store'
import { selectDeviceModelAttributes } from '../selectors/devices'

class CloudSync {
  initialized = false

  log(...args) {
    console.log(`%c${args[0]}`, 'color:magenta;font-weight:bold', ...args.slice(1))
  }

  init() {
    if (this.initialized) return
    this.initialized = true
    network.on('active', this.onNetworkActive)
  }

  reset() {
    this.initialized = false
    network.off('active', this.onNetworkActive)
  }

  // 'active' rather than 'connect' so a full re-sync waits until the window is in
  // front - sockets reconnect on 'connect' regardless, so nothing is missed.
  // Named so reset() can actually remove it: an inline closure left a listener
  // behind on every sign out, stacking a full sync per sign in cycle.
  onNetworkActive = async () => {
    await dispatch.devices.expire()
    this.all()
  }

  async call(methods: Methods, parallel?: boolean, spinner: boolean = true) {
    if (spinner) await dispatch.ui.set({ fetching: true })

    if (parallel) await Promise.all(methods.map(method => method()))
    else for (const method of methods) await method()

    if (spinner) await dispatch.ui.set({ fetching: false })
  }

  async cancel() {
    await dispatch.ui.set({ fetching: false })
  }

  async core(spinner: boolean = false) {
    // Account first because organization depends on it
    await this.call([dispatch.accounts.fetch], false, spinner)
    await this.call(
      [
        dispatch.user.fetch,
        dispatch.organization.fetch,
        dispatch.sessions.fetch,
        dispatch.tags.fetch,
        dispatch.plans.fetch,
        dispatch.announcements.fetch,
        dispatch.applicationTypes.fetch,
      ],
      true,
      spinner
    )
  }

  all = async () => {
    console.log('CLOUD SYNC ALL')
    await this.core()
    // Preserve pagination: re-fetch all loaded devices instead of resetting to first page
    const state = store.getState()
    const deviceModel = selectDeviceModelAttributes(state)
    const loadedCount = deviceModel.from + deviceModel.size
    if (loadedCount > deviceModel.size) {
      await dispatch.devices.set({ from: 0, size: loadedCount })
    } else {
      await dispatch.devices.set({ from: 0 })
    }
    await this.call([
      dispatch.files.fetch,
      dispatch.jobs.fetch,
      dispatch.devices.fetchList,
      dispatch.networks.fetch,
      dispatch.connections.fetch,
      dispatch.files.fetch,
      dispatch.products.fetch,
      dispatch.partnerStats.fetch,
    ])
    // Restore original pagination position after refresh
    if (loadedCount > deviceModel.size) {
      await dispatch.devices.set({ from: deviceModel.from, size: deviceModel.size })
    }
  }
}

export default new CloudSync()
