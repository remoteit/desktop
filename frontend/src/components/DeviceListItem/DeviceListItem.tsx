import React from 'react'
import { useHistory } from 'react-router-dom'
import { Icon } from '../Icon'
import { IDevice } from 'remote.it'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction } from '@material-ui/core'

export type DeviceListItemProps = {
  device: IDevice
  key?: string
}

export const DeviceListItem = ({ device, key }: DeviceListItemProps) => {
  const history = useHistory()

  return (
    <ListItem key={key} onClick={() => history.push(`/devices/${device.id}`)} button>
      <ListItemIcon>
        <ConnectionStateIcon state={device.state} size="lg" />
      </ListItemIcon>
      <ListItemText primary={device.name} />
      <ListItemSecondaryAction>
        <Icon name="chevron-right" />
      </ListItemSecondaryAction>
    </ListItem>
  )
}
