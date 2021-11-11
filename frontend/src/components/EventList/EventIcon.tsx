import React from 'react'
import { Icon } from '../Icon'
import { Color } from '../../styling'
import { EventState, EventType } from './EventMessage'
import { ADD_EVENTS_ACTIONS } from '../../shared/constants'

export function EventIcon(item: IEvent): JSX.Element {
  let color: Color = 'grayLighter'
  let icon = ''
  let title = ''
  switch (item.type) {
    case EventType.login_state:
    case EventType.login_attempt_state:
    case EventType.login_password_change:
    case EventType.login_password_reset:
    case EventType.login_phone_change:
    case EventType.login_mfa_enabled:
    case EventType.login_mfa_disabled:
      icon = 'sign-in'
      color = 'success'
      title = 'Activity list:' + item.type
      break
    case EventType.device_state:
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

    case EventType.device_connect:
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

    case EventType.device_share:
      if (ADD_EVENTS_ACTIONS.includes(item.action)) {
        icon = 'user-plus'
        color = 'success'
        title = 'Device Shared'
      } else {
        icon = 'user-minus'
        color = 'dangerLight'
        title = 'Device Share Removed'
      }
      break

    case EventType.license_updated:
      icon = 'info-circle'
      color = 'grayDarker'
      title = 'License changed'
      break
  }

  return <Icon name={icon} size="md" color={color} title={title} />
}
