import network from './Network'
import { dispatch } from '../store'

class CloudSync {
  initialized = false

  constructor() {
    this.all = this.all.bind(this)
  }

  init() {
    if (this.initialized) return
    this.initialized = true
    network.on('connect', this.all)
  }

  reset() {
    this.initialized = false
    network.off('connect', this.all)
  }

  async call(methods: Methods, parallel?: boolean) {
    await dispatch.ui.set({ fetching: true })

    if (parallel) await Promise.all(methods.map(method => method()))
    else for (const method of methods) await method()

    await dispatch.ui.set({ fetching: false })
  }

  async core() {
    await this.call(
      [
        dispatch.user.fetch,
        dispatch.accounts.fetch,
        dispatch.organization.fetch,
        dispatch.networks.fetch,
        dispatch.sessions.fetch,
        dispatch.tags.fetch,
        dispatch.plans.fetch,
        dispatch.announcements.fetch,
        dispatch.applicationTypes.fetch,
      ],
      true
    )
  }

  async all() {
    await this.core()
    await dispatch.devices.set({ from: 0 })
    await this.call([dispatch.devices.fetchList, dispatch.connections.fetch])
  }
}

export default new CloudSync()
