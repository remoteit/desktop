import React from 'react'
import { Icon } from '../Icon'
import { EventState, EventActions } from './EventMessage'
import { JobStatusIcon } from '../JobStatusIcon'

type Props = {
  item: IEvent
  loggedInUser: IUser
}

export function EventIcon({ item, loggedInUser }: Props): JSX.Element {
  let color: Color = 'gray'
  let icon = ''
  let title = ''
  switch (item.type) {
    case 'AUTH_LOGIN':
      icon = 'arrow-right-to-bracket'
      color = 'primary'
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
        icon = 'dot-circle'
        color = 'grayDarker'
        title = 'Device Disconnected'
      }
      break

    case 'DEVICE_SHARE':
      if (EventActions.includes(item.action)) {
        icon = 'user-plus'
        color = 'success'
        title = 'Device Shared'
      } else {
        icon = 'user-minus'
        color = 'dangerLight'
        title = 'Device Share Removed'
      }
      break

    case 'DEVICE_TRANSFER':
      title = 'Device transferred'
      if (item.actor?.email === loggedInUser.email) {
        icon = 'circle-arrow-right'
        color = 'danger'
      } else {
        icon = 'circle-arrow-left'
        color = 'primary'
      }
      break

    case 'DEVICE_DELETE':
      icon = 'circle-xmark'
      color = 'danger'
      title = 'Device deleted'
      break

    case 'JOB':
    case 'DEVICE_JOB':
      return <JobStatusIcon status={item.action.toUpperCase() as IJobStatus} padding={0} />

    case 'LICENSE_UPDATED':
      icon = 'info-circle'
      color = 'primary'
      title = 'License changed'
      break

    default:
      icon = 'question-circle'
      title = 'Unknown Event'
  }

  return <Icon name={icon} size="md" color={color} title={title} />
}
