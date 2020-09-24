import React from 'react'
import { removeDeviceName } from '../../shared/nameHelper'

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
  loggedInUser,
}: {
  props: IEvent
  device: IDevice
  loggedInUser: IUser | undefined
}): JSX.Element {
  const item = props
  const serviceName = (item.services?.map(service => removeDeviceName(device.name, service.name)) || []).join(' + ')
  let message: JSX.Element | string = ''

  switch (item.type) {
    case EventType.device_state:
      message = (
        <>
          <b> {item.services && serviceName !== device?.name ? serviceName : device?.name} </b>
          {item.state === EventState.active ? 'went online' : 'went offline'}
        </>
      )
      break

    case EventType.device_connect:
      message = (
        <>
          <b>{item.actor?.email}</b> {item.state === EventState.connected ? 'connected to' : 'disconnected from'}{' '}
          <i>{serviceName}</i>
        </>
      )
      break

    case EventType.device_share:
      const actor = item.actor?.email
      const users = item.users && item.users.map(user => user.email || '(deleted)')
      const userList =
        users && users.length !== 1 ? users.slice(0, -1).join(', ') + ' and ' + users.slice(-1) : users && users[0]

      const ownerDisplay = device.owner
      if (item.shared) {
        switch (device.owner) {
          case loggedInUser?.email:
            message = (
              <>
                You shared <i>{device.name}</i> and {item.scripting ? 'allowed' : 'restricted'} script execution with
                <b> {userList} </b>
              </>
            )
            break

          default:
            message = (
              <>
                <b>{ownerDisplay}</b> shared <i>{device.name}</i> and {item.scripting ? 'allowed' : 'restricted'} script
                execution with you
              </>
            )
            break
        }
      } else {
        if (device.owner === actor && device.owner === loggedInUser?.email && item.action === 'add') {
          message = (
            <>
              You shared <i>{device.name}</i> with <b>{userList}</b>
            </>
          )
        } else if (actor === device.owner) {
          message = (
            <>
              You removed sharing of <i>{device.name}</i> with <b>{userList}</b>
            </>
          )
        } else {
          message = (
            <>
              You left the shared device <i>{device.name}</i>
            </>
          )
        }
      }
      break

    default:
      break
  }

  return <div>{message}</div>
}
