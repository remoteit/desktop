import { ApplicationState, store } from '../store'
import { getOwnDevices } from '../models/accounts'
import { TARGET_PLATFORMS } from '../components/TargetPlatform'

export function platformConfiguration(state: ApplicationState) {
  const all: IDevice[] = getOwnDevices(state)
  const targetDevice: ITargetDevice = state.backend.device
  const thisDevice = all.find(d => d.id === targetDevice.uid)
  const targetPlatform = TARGET_PLATFORMS[thisDevice?.targetPlatform || -1]

  if (targetPlatform === 'AWS') {
    store.dispatch.ui.set({
      setupServicesLimit: 100,
      scanEnabled: false,
      routingLock: 'p2p',
      routingMessage: 'For security reasons, AWS devices are restricted to peer to peer connections only.',
    })
    console.log('TARGET PLATFORM', targetPlatform, 'settings applied')
  }
}
