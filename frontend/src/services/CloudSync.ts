import network from './Network'
import { dispatch } from '../store'

class CloudSync {
  initialized = false

  log(...args) {
    console.log(`%c${args[0]}`, 'color:magenta;font-weight:bold', ...args.slice(1))
  }

  init() {
    if (this.initialized) return
    this.initialized = true
    network.on('connect', async () => {
      await dispatch.devices.expire()
      this.all()
    })
  }

  reset() {
    this.initialized = false
    network.off('connect', this.all)
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
    await this.call(
      [
        dispatch.user.fetch,
        dispatch.accounts.fetch,
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
    await dispatch.devices.set({ from: 0 })
    await this.call([dispatch.devices.fetchList, dispatch.networks.fetch, dispatch.connections.fetch])
  }
}

export default new CloudSync()
