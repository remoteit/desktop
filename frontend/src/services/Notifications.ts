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
      stateNotification(event)
      break

    case 'DEVICE_CONNECT':
      connectNotification(event)
      break

    case 'DEVICE_SHARE':
    // @TODO parse and display notice
  }
}

/* 
  My laptop came online
  Windows - otheruser@email.com
*/
function stateNotification(event: ICloudEvent) {
  const state = store.getState()

  event.target.forEach(target => {
    // notify if device changes state only
    if (target.typeID === DEVICE_TYPE) {
      createNotification({
        title: `${target.name} ${actions[event.state]}`,
        body:
          TARGET_PLATFORMS[target.targetPlatform] +
          (state.auth.user?.id === target.owner.id ? '' : ' - ' + target.owner.email),
        id: target.id,
      })
    }
  })
}

/* 
  You connected
  To connection name
*/
function connectNotification(event: ICloudEvent) {
  const state = store.getState()

  event.target.forEach(target => {
    createNotification({
      title: (state.auth.user?.id === event.actor.id ? 'You ' : event.actor.email + ' ') + actions[event.state],
      body: `To ${target.name}`,
      id: target.id,
    })
  })
}

function createNotification({ title, body, id }: { title: string; body: string; id: string }) {
  const notification = new Notification(title, { body })
  notification.onclick = () => store.dispatch.ui.set({ redirect: `/devices/${id}` })
  notification.onclose = e => e.preventDefault()
}
