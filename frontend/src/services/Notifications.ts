import { DEVICE_TYPE } from '../shared/applications'
import { getTargetPlatform } from '../helpers/platformHelper'
import { store } from '../store'

const actions = {
  active: 'came online',
  inactive: 'went offline',
  connected: 'connected',
  disconnected: 'disconnected',
}

export function notify(event: ICloudEvent) {
  const target = event.target[0]

  let onlineDeviceNotification
  if (typeof target?.device?.notificationSettings.desktopNotifications === 'boolean') {
    onlineDeviceNotification = !!target?.device?.notificationSettings.desktopNotifications
  }
  else {
    onlineDeviceNotification = !!event?.metadata?.desktopNotifications
  }

  if (!onlineDeviceNotification) return

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
  event.target.forEach(target => {
    // notify if device changes state only
    if (target.typeID === DEVICE_TYPE) {
      createNotification({
        title: `${target.device?.name} ${actions[event.state]}`,
        body:
          getTargetPlatform(target.platform) + (event.authUserId === target.owner.id ? '' : ' - ' + target.owner.email),
        id: target.deviceId,
      })
    }
  })
}

/* 
  You connected
  To connection name
*/
function connectNotification(event: ICloudEvent) {
  event.target.forEach(target => {
    createNotification({
      title: (event.authUserId === event.actor.id ? 'You ' : event.actor.email + ' ') + actions[event.state],
      body: `To ${target.name}` + (event.isP2P ? '' : ' by proxy'),
      id: target.deviceId,
    })
  })
}

function createNotification({ title, body, id }: { title: string; body: string; id: string }) {
  const notification = new Notification(title, { body })
  notification.onclick = () => store.dispatch.ui.set({ redirect: `/devices/${id}` })
  notification.onclose = e => e.preventDefault()
}
