import { DEVICE_TYPE } from '@common/applications'
import { getAccountIds } from '../models/accounts'
import { selectOrganization } from '../selectors/organizations'
import { platforms } from '../platforms'
import { store } from '../store'
import { openNotification, NotificationTap } from './openNotification'
import { emit } from './Controller'
import browser from './browser'
import icon from '../assets/noticeIcon.png'

const actions = {
  // DEVICE_STATE
  active: 'came online',
  inactive: 'went offline',
  connected: 'connected',
  disconnected: 'disconnected',
  // DEVICE_SHARE
  add: 'was shared',
  update: 'share was updated',
  remove: 'was unshared',
}

export async function notify(event: ICloudEvent) {
  if (!notificationSupported()) return
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
      shareNotification(event)
      break

    case 'DEVICE_TRANSFER':
      transferNotification(event)
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
      let body = platforms.name(target.platform)
      let url = `/devices/${target.deviceId}`
      if (target.service?.id) url += `/${target.service?.id}`
      if (event.authUserId !== target.owner?.id) body += ' - ' + target.owner?.email
      createNotification(url, { title: `${target.name} ${actions[event.state]}`, body, time: event.timestamp })
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
    createNotification(url, { title, body, time: event.timestamp })
  })
}

function shareNotification(event: ICloudEvent) {
  // don't notify of actions you've done
  if (event.authUserId === event.actor.id) return

  let name
  const state = store.getState()
  const accountIds = getAccountIds(state)
  const accountTo = event.users.find(u => accountIds.includes(u.id))

  if (accountTo) {
    if (event.authUserId === accountTo.id) name = 'you'
    else name = selectOrganization(state, accountTo.id)?.name || accountTo.email

    event.target.forEach(target => {
      if (target.typeID === DEVICE_TYPE) {
        const title = `${target.name} ${actions[event.action]}`
        const body = `with ${name} by ${event.actor.email}.`
        const url = event.action === 'add' || event.action === 'update' ? `/devices/${target.id}` : '/devices'
        createNotification(url, { title, body, time: event.timestamp })
      }
    })
  }
}

function transferNotification(event: ICloudEvent) {
  event.target.forEach(target => {
    if (target.typeID === DEVICE_TYPE) {
      const isReceiving = target.owner?.id === event.authUserId

      if (isReceiving) {
        const title = `${target.name} was transferred to you`
        const body = `from ${event.actor.email}`
        createNotification(`/devices/${target.deviceId}`, { title, body, time: event.timestamp })
      }
      // Don't notify sender or people losing access
    }
  })
}

function createNotification(url: string, tap: Required<NotificationTap>) {
  const notification = new Notification(tap.title, { body: tap.body, icon: browser.isPortal ? icon : undefined })
  notification.onclick = () => {
    // A click leaves the window where it was: a browser tab behind others, Electron's hidden in the tray
    window.focus()
    if (browser.isElectron) emit('open')
    openNotification(url, tap)
  }
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
  if (Notification?.permission === 'granted') return

  const permission = await Notification?.requestPermission()
  if (permission === 'granted') console.log('User granted notification permission')
}

function notificationSupported() {
  return !!window.Notification && !!Notification.requestPermission
}
