import React from 'react'
import { combinedName } from '@common/nameHelper'

export const EventActions = ['add', 'update']

export const EventState = {
  active: 'active',
  connected: 'connected',
}

export function EventMessage({
  item,
  device,
  loggedInUser,
}: {
  item: IEvent
  device?: IDevice
  loggedInUser: IUser
}): JSX.Element {
  const target = item.target?.[0] //(item.target?.map(service => service.name) || []).join(' + ')
  let name = combinedName(target, target?.device, ' - ')
  if (!name) name = target?.id ? `${target.id} (deleted)` : 'Unknown'
  const actorName = item.actor?.email === loggedInUser.email ? 'You' : item.actor?.email
  const actorAdjective = actorName === 'You' ? 'your' : 'their'

  const messageDevice = device || item.devices?.[0]
  const deviceName = messageDevice?.name || ''
  const users = item.users?.map(user => user.email || '(deleted)') || []
  const userList = users.length === 1 ? users[0] : `${users.slice(0, -1).join(', ')} and ${users.slice(-1)}`
  const affected = userList === loggedInUser.email ? 'you' : userList

  let message: JSX.Element | string = ''
  switch (item.type) {
    case 'AUTH_LOGIN':
      message = (
        <>
          <b>{actorName}</b> logged in
        </>
      )
      break
    case 'AUTH_LOGIN_ATTEMPT':
      message = (
        <>
          <b>{actorName}</b> attempted to log in
        </>
      )
      break
    case 'AUTH_PASSWORD_CHANGE':
      message = (
        <>
          <b>{actorName}</b> changed {actorAdjective} password
        </>
      )
      break
    case 'AUTH_PASSWORD_RESET':
      message = (
        <>
          <b>{actorName}</b> reset {actorAdjective} password
        </>
      )
      break
    case 'AUTH_PASSWORD_RESET_CONFIRMED':
      message = (
        <>
          Reset password was confirmed for <b>{actorName}</b>
        </>
      )
      break
    case 'AUTH_PHONE_CHANGE':
      message = 'Phone number changed'
      break
    case 'AUTH_MFA_ENABLED':
      message = 'Multi-factor authentication (MFA) enabled'
      break
    case 'AUTH_MFA_DISABLED':
      message = 'Multi-factor authentication (MFA) disabled'
      break
    case 'DEVICE_STATE':
      message = (
        <>
          <b>{name} </b>
          {item.state === EventState.active ? 'went online' : 'went offline'}
        </>
      )
      break

    case 'DEVICE_CONNECT':
      message = (
        <>
          <b>{actorName}</b> {item.state === EventState.connected ? 'connected to' : 'disconnected from'} <i>{name} </i>
        </>
      )
      break

    case 'DEVICE_SHARE':
      if (item.shared) {
        message = (
          <>
            {actorName} shared <i>{deviceName}</i> and {item.scripting ? 'allowed' : 'restricted'} script execution with
            <b>{affected}</b>
          </>
        )
      } else if (EventActions.includes(item.action)) {
        message = (
          <>
            {actorName} shared <i>{deviceName}</i> with <b>{affected}</b>
          </>
        )
      } else if (actorName?.toLowerCase() === affected) {
        message = (
          <>
            You left the shared device <i>{deviceName}</i>
          </>
        )
      } else {
        message = (
          <>
            {actorName} removed sharing of <i>{deviceName}</i> from <b>{affected}</b>
          </>
        )
      }
      break

    case 'DEVICE_TRANSFER':
      message = (
        <>
          {actorName} transferred <b>{deviceName}</b> to <i>{affected}</i>
        </>
      )
      break

    case 'DEVICE_DELETE':
      message = (
        <>
          <i>{actorName}</i> deleted <b>{name}</b>
        </>
      )
      break

    case 'LICENSE_UPDATED':
      message = <b>Your license was updated</b>
      break
    default:
      message = <>Unknown event type {item.type} occurred</>
  }

  return <div>{message}</div>
}
