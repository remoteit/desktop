import { DEVICE_TYPE } from '../shared/applications'
import { platforms } from '../platforms'
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
      let body = platforms.nameLookup[target.platform]
      let url = `/devices/${target.deviceId}`
      if (target.service?.id) url += `/${target.service?.id}`
      if (event.authUserId !== target.owner?.id) body += ' - ' + target.owner?.email
      createNotification(`${target.name} ${actions[event.state]}`, url, { body })
    }
  })
}

/* 
  You connected
  To connection name
*/
function connectNotification(event: ICloudEvent) {
  event.target.forEach(target => {
    const you = event.authUserId === event.actor.id
    const disconnect = event.state === 'disconnected'
    const title = (you ? 'You ' : event.actor.email + ' ') + actions[event.state]
    let url = `/devices/${target.deviceId}`
    if (target.service?.id) url += `/${target.service?.id}`
    let body = (disconnect ? 'From ' : 'To ') + target.name + (event.isP2P ? '' : ' by proxy')
    if (event.state === 'disconnected' && !!event.target[0].connection) {
      body += '\n- Provide connection feedback'
      url = url.replace('devices', 'feedback')
    }
    createNotification(title, url, { body })
  })
}

function createNotification(title: string, redirect: string, options?: NotificationOptions) {
  console.log('CREATE NOTIFICATION', arguments)
  const notification = new Notification(title, { ...options, icon: isPortal() ? icon : undefined })
  notification.onclick = () => store.dispatch.ui.set({ redirect })
  notification.onclose = e => e.preventDefault()
}

function showNotice(event: ICloudEvent) {
  const target = event?.target?.[0]
  let show

  if (typeof target?.device?.notificationSettings?.desktopNotifications === 'boolean') {
    show = !!target?.device?.notificationSettings?.desktopNotifications
  } else {
    show = !!store.getState().user.notificationSettings.desktopNotifications
  }

  return show
}

async function checkNotificationPermission() {
  console.log('NOTIFICATION PERMISSION', Notification.permission)
  if (Notification.permission === 'granted') return

  const permission = await Notification.requestPermission()
  if (permission === 'granted') console.log('User granted notification permission')
}
