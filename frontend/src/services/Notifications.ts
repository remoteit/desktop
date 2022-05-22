import { DEVICE_TYPE } from '../shared/applications'
import { getTargetPlatform } from '../helpers/platformHelper'
import { isPortal } from '../services/Browser'
import { store } from '../store'
import icon from '../assets/noticeIcon.png'

const actions = {
  active: 'came online',
  inactive: 'went offline',
  connected: 'connected',
  disconnected: 'disconnected',
}

export async function notify(event: ICloudEvent) {
  if (!showNotice(event)) return
  await checkNotificationPermission()

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
        title: `${target.name} ${actions[event.state]}`,
        body:
          getTargetPlatform(target.platform) +
          (event.authUserId === target.owner?.id ? '' : ' - ' + target.owner?.email),
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
      body: (event.state === 'disconnected' ? 'From ' : 'To ') + target.name + (event.isP2P ? '' : ' by proxy'),
      id: target.deviceId,
    })
  })
}

function createNotification({ title, body, id }: { title: string; body: string; id: string }) {
  const notification = new Notification(title, { body, icon: isPortal() ? icon : undefined })
  notification.onclick = () => store.dispatch.ui.set({ redirect: `/devices/${id}` })
  notification.onclose = e => e.preventDefault()
}

function showNotice(event: ICloudEvent) {
  const state = store.getState()
  const target = event.target[0]
  let show

  if (typeof target?.device?.notificationSettings.desktopNotifications === 'boolean') {
    show = !!target?.device?.notificationSettings.desktopNotifications
  } else {
    show = !!state.user.notificationSettings.desktopNotifications
  }

  return show
}

async function checkNotificationPermission() {
  console.log('NOTIFICATION PERMISSION', Notification.permission)
  if (Notification.permission === 'granted') return

  const permission = await Notification.requestPermission()
  if (permission === 'granted') console.log('User granted notification permission')
}
