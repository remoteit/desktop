import { Icon } from '../../components/Icon'
import React from 'react'
import { Color } from '../../styling'
import { EventState, EventType } from './EventMessage'

export function EventIcon(item: IEvent): JSX.Element {
  let color: Color= 'grayLighter'
  let icon = ''
  let title = ''
  switch (item.type) {
    
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
      break;

    case EventType.device_connect:
      if (item.state === EventState.connected) {
        icon = 'exchange'
        color = 'primary'
        title = 'Device Connected'
      } else {
        icon = 'ban'
        color = 'gray'
        title = 'Device Disconnected'
      }
      break;

    case EventType.device_share:
      if (item.shared) {
        icon = 'user-check'
        color = 'success'
        title = 'Device Shared'
      } else {
        icon = 'user-slash'
        color = 'danger'
        title = 'Device Share Removed'
      }
      break;

    default:
      break;
  }

  return <Icon name={icon} fixedWidth title={title} color={color} />
}
