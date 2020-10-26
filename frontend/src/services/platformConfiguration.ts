import { store } from '../store'
import { getOwnDevices } from '../models/accounts'
import { getTargetPlatform } from '../helpers/platformHelper'

export function platformConfiguration() {
  const state = store.getState()
  const all = getOwnDevices(state)
  const targetDevice: ITargetDevice = state.backend.device
  const thisDevice = all.find(d => d.id === targetDevice.uid)
  const targetPlatform = getTargetPlatform(thisDevice)

  if (targetPlatform === 'AWS') {
    store.dispatch.ui.set({
      setupServicesLimit: 100,
      scanEnabled: false,
      routingLock: 'p2p',
      routingMessage: 'For security reasons, connections to services within AWS are restricted to peer to peer.',
    })
    console.log(targetPlatform, 'TARGET PLATFORM settings applied')
  }
}
