import React from 'react'
import { ADD_EVENTS_ACTIONS } from '../../shared/constants'

export const EventType = {
  login_state: 'AUTH_LOGIN',
  login_attempt_state: 'AUTH_LOGIN_ATTEMPT',
  login_password_change: 'AUTH_PASSWORD_CHANGE',
  login_password_reset: 'AUTH_PASSWORD_RESET',
  login_phone_change: 'AUTH_PHONE_CHANGE',
  login_mfa_enabled: 'AUTH_MFA_ENABLED',
  login_mfa_disabled: 'AUTH_MFA_DISABLED',
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
  const serviceName = (item.target?.map(service => service.name) || []).join(' + ')
  let message: JSX.Element | string = ''

  switch (item.type) {
    case EventType.login_state:
    case EventType.login_attempt_state:
    case EventType.login_password_change:
    case EventType.login_password_reset:
    case EventType.login_phone_change:
    case EventType.login_mfa_enabled:
    case EventType.login_mfa_disabled:
      message = <>{'Activity list: ' + item.type}</>
      break
    case EventType.device_state:
      message = (
        <>
          <b> {item.target && serviceName !== device?.name ? serviceName : device?.name + ' [ ' + device?.id + ' ] ' }  </b>
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
      const actor = item.actor?.email === loggedInUser?.email ? 'You' : item.actor?.email
      const deviceName = device ? device.name : item.devices?.length && item.devices[0]?.name
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
  }

  return <div>{message}</div>
}
