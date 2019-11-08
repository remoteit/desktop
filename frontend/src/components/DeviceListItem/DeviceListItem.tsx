import React from 'react'
import { useHistory } from 'react-router-dom'
import { NextButton } from '../NextButton'
import { IDevice } from 'remote.it'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { ListItem, ListItemIcon, ListItemText } from '@material-ui/core'

export type DeviceListItemProps = {
  device: IDevice
}

export const DeviceListItem = ({ device }: DeviceListItemProps) => {
  const history = useHistory()

  return (
    <ListItem onClick={() => history.push(`/devices/${device.id}`)} button>
      <ListItemIcon>
        <ConnectionStateIcon state={device.state} size="lg" />
      </ListItemIcon>
      <ListItemText primary={device.name} />
      <NextButton />
    </ListItem>
  )
}
