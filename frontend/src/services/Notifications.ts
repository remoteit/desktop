import { DEVICE_TYPE } from '../shared/applications'

export function notify(event: ICloudEvent) {
  event.title = 'remote.it notice'
  event.body = getMessage(event)

  switch (event.type) {
    case 'DEVICE_STATE':
      event.target.forEach(target => {
        // notify if device changes state only
        if (target.typeID === DEVICE_TYPE) {
          new Notification(event.title || '', { body: event.body })
        }
      })
      break

    case 'DEVICE_CONNECT':
      event.target.forEach(target => {
        new Notification(event.title || '', { body: event.body })
      })
      break

    case 'DEVICE_SHARE':
    // @TODO parse and display notice
  }
}

function getMessage(event: ICloudEvent) {
  const actions = {
    active: 'came online',
    inactive: 'went offline',
    connected: 'connected',
    disconnected: 'disconnected',
  }

  if (event.target.length > 1) {
    return `${event.target.map(t => t.name).join(', ')} ${actions[event.state]}`
  }

  return `${event.target[0].name} ${actions[event.state]}`
}
