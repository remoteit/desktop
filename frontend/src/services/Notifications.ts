import { DEVICE_TYPE } from '../shared/applications'
import { TARGET_PLATFORMS } from '../helpers/platformHelper'
import { store } from '../store'

const actions = {
  active: 'came online',
  inactive: 'went offline',
  connected: 'connected',
  disconnected: 'disconnected',
}

export function notify(event: ICloudEvent) {
  switch (event.type) {
    case 'DEVICE_STATE':
    case 'DEVICE_CONNECT':
      simpleNotification(event)
      break

    case 'DEVICE_SHARE':
    // @TODO parse and display notice
  }
}

/* 
  My laptop came online
  Your device
*/
function simpleNotification(event: ICloudEvent) {
  const state = store.getState()

  event.target.forEach(target => {
    // notify if device changes state only
    if (target.typeID === DEVICE_TYPE) {
      const notification = new Notification(`${target.name} ${actions[event.state]}`, {
        body:
          TARGET_PLATFORMS[target.targetPlatform] +
          (state.auth.user?.id === target.owner.id ? '' : ' - ' + target.owner.email),
      })
      notification.onclick = () => store.dispatch.ui.set({ redirect: `/devices/${target.id}` })
      notification.onclose = e => e.preventDefault()
    }
  })
}

// if (event.target.length > 1) {
//   title = `${event.target.map(t => t.name).join(', ')} ${actions[event.state]}
// }
