import React from 'react'
import { Icon } from '../Icon'
import { Color } from '../../styling'
import { EventState, EventActions } from './EventMessage'

export function EventIcon(item: IEvent): JSX.Element {
  let color: Color = 'grayLighter'
  let icon = ''
  let title = ''
  switch (item.type) {
    case 'AUTH_LOGIN':
      icon = 'arrow-right-to-bracket'
      color = 'success'
      break
    case 'AUTH_LOGIN_ATTEMPT':
      icon = 'arrow-right-to-bracket'
      color = 'grayDarker'
      break
    case 'AUTH_PASSWORD_CHANGE':
    case 'AUTH_PASSWORD_RESET':
    case 'AUTH_PASSWORD_RESET_CONFIRMED':
      icon = 'key-skeleton'
      color = 'grayDarker'
      break
    case 'AUTH_PHONE_CHANGE':
      icon = 'phone'
      color = 'grayDarker'
      break
    case 'AUTH_MFA_ENABLED':
      icon = 'shield'
      color = 'success'
      break
    case 'AUTH_MFA_DISABLED':
      icon = 'shield-slash'
      color = 'warning'
      break

    case 'DEVICE_STATE':
      if (item.state === EventState.active) {
        icon = 'check-circle'
        color = 'success'
        title = 'Device Online'
      } else {
        icon = 'minus-circle'
        color = 'gray'
        title = 'Device Offline'
      }
      break

    case 'DEVICE_CONNECT':
      if (item.state === EventState.connected) {
        icon = 'dot-circle'
        color = 'primary'
        title = 'Device Connected'
      } else {
        icon = 'times-circle'
        color = 'dangerLight'
        title = 'Device Disconnected'
      }
      break

    case 'DEVICE_SHARE':
      if (EventActions.includes(item.action)) {
        icon = 'share'
        color = 'success'
        title = 'Device Shared'
      } else {
        icon = 'do-not-enter'
        color = 'dangerLight'
        title = 'Device Share Removed'
      }
      break

    case 'LICENSE_UPDATED':
      icon = 'info-circle'
      color = 'grayDarker'
      title = 'License changed'
      break
  }

  return <Icon name={icon} size="md" color={color} title={title} />
}
