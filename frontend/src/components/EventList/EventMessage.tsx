import React from 'react'
import { ADD_EVENTS_ACTIONS } from '../../shared/constants'
import { combinedName } from '../../shared/nameHelper'

export const EventType = {
  login_state: 'AUTH_LOGIN',
  login_attempt_state: 'AUTH_LOGIN_ATTEMPT',
  login_password_change: 'AUTH_PASSWORD_CHANGE',
  login_password_reset: 'AUTH_PASSWORD_RESET',
  login_password_reset_confirmed: 'AUTH_PASSWORD_RESET_CONFIRMED',
  login_phone_change: 'AUTH_PHONE_CHANGE',
  login_mfa_enabled: 'AUTH_MFA_ENABLED',
  login_mfa_disabled: 'AUTH_MFA_DISABLED',
  license_updated: 'LICENSE_UPDATED',
  device_state: 'DEVICE_STATE',
  device_connect: 'DEVICE_CONNECT',
  device_share: 'DEVICE_SHARE',
}
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
  loggedInUser: IUser | undefined
}): JSX.Element {
  const target = item.target?.[0] //(item.target?.map(service => service.name) || []).join(' + ')
  let name = combinedName(target, target?.device, ' - ')
  if (!name) name = target?.id ? `${target.id} (deleted)` : 'Unknown'

  let message: JSX.Element | string = ''
  switch (item.type) {
    case EventType.login_state:
      message = 'Logged in'
      break
    case EventType.login_attempt_state:
      message = 'Login attempt'
      break
    case EventType.login_password_change:
      message = 'Password changed'
      break
    case EventType.login_password_reset:
      message = 'Password reset started'
      break
    case EventType.login_password_reset_confirmed:
      message = 'Password reset confirmed'
      break
    case EventType.login_phone_change:
      message = 'Phone number changed'
      break
    case EventType.login_mfa_enabled:
      message = 'Multi-factor authentication (MFA) enabled'
      break
    case EventType.login_mfa_disabled:
      message = 'Multi-factor authentication (MFA) disabled'
      break
    case EventType.device_state:
      message = (
        <>
          <b>{name} </b>
          {item.state === EventState.active ? 'went online' : 'went offline'}
        </>
      )
      break

    case EventType.device_connect:
      message = (
        <>
          <b>{item.actor?.email}</b> {item.state === EventState.connected ? 'connected to' : 'disconnected from'}{' '}
          <i>{name} </i>
        </>
      )
      break

    case EventType.device_share:
      const actor = item.actor?.email === loggedInUser?.email ? 'You' : item.actor?.email
      const messageDevice = device || item.devices?.[0]
      const deviceName = messageDevice?.name || ''
      const users = item.users && item.users.map(user => user.email || '(deleted)')
      const userList =
        users && users.length !== 1 ? users.slice(0, -1).join(', ') + ' and ' + users.slice(-1) : users && users[0]
      const affected = userList === loggedInUser?.email ? 'you' : userList

      if (item.shared) {
        message = (
          <>
            {actor} shared <i>{deviceName}</i> and {item.scripting ? 'allowed' : 'restricted'} script execution with
            <b>{affected}</b>
          </>
        )
      } else if (ADD_EVENTS_ACTIONS.includes(item.action)) {
        message = (
          <>
            {actor} shared <i>{deviceName}</i> with <b>{affected}</b>
          </>
        )
      } else if (actor === affected) {
        message = (
          <>
            You left the shared device <i>{deviceName}</i>
          </>
        )
      } else {
        message = (
          <>
            {actor} removed sharing of <i>{deviceName}</i> from <b>{affected}</b>
          </>
        )
      }
      break

    case EventType.license_updated:
      message = <b>Your license was updated</b>
      break
    default:
      message = <>Unknown event type {item.type} occurred</>
  }

  return <div>{message}</div>
}
