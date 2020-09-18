import React from 'react'

export const EventType = {
  device_state: 'DEVICE_STATE',
  device_connect: 'DEVICE_CONNECT',
  device_share: 'DEVICE_SHARE',
}
export const EventState = {
  active: 'active',
  connected: 'connected',
}

export function EventMessage({
  props,
  device,
  loggedinUser,
}: {
  props: IEvent
  device: IDevice
  loggedinUser: IUser | undefined
}): JSX.Element {
  const item = props
  const serviceName = (item.services?.map(service => service.name) || [])[0]
  let message = ''

  switch (item.type) {
    case EventType.device_state:
      message = `${(item.services && serviceName !== device?.name) ? serviceName : ''} ${item.state === EventState.active ? 'come online' : 'went offline'}`
      break

    case EventType.device_connect:
      message = `${item.actor?.email} ${
        item.state === EventState.connected ? 'connected' : 'disconnected'
      } to ${serviceName}`
      break

    case EventType.device_share:
      const actor = item.actor?.email
      const users = item.users && item.users.map(user => (user.email ? user.email : user.email + ' (deleted)'))
      const userList =
        users && users.length !== 1 ? users.slice(0, -1).join(', ') + ' and ' + users.slice(-1) : users && users[0]

      const ownerDisplay = device.owner
      if (item.shared) {
        switch (device.owner) {
          case loggedinUser?.email:
            message = `You shared ${device.name} and ${
              item.scripting ? 'ellowed' : 'restricted'
            } script execution with ${userList}`
            break

          default:
            message = `${ownerDisplay} shared ${device.name} and ${
              item.scripting ? 'ellowed' : 'restricted'
            } script execution with you`
            break
        }
      } else {
        if (device.owner === actor && device.owner === loggedinUser?.email) {
          message = `You removed sharing of ${device.name} with ${userList}`
        } else if (actor === device.owner) {
          message = `You removed sharing of ${device.name} with ${userList}`
        } else {
          message = `You left the shared device ${device.name}`
        }
      }
      break

    default:
      break
  }

  return <div className="event-message">{message}</div>
}
