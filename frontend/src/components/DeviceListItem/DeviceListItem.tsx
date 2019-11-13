import React from 'react'
import { useHistory } from 'react-router-dom'
import { NextButton } from '../NextButton'
import { IDevice } from 'remote.it'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { ListItem, ListItemIcon, ListItemText } from '@material-ui/core'

export type DeviceListItemProps = {
  device: IDevice
  connections?: IConnection[]
}

export const DeviceListItem = ({ device, connections }: DeviceListItemProps) => {
  const history = useHistory()
  const activeConnection = connections && connections.find(c => c.active)
  return (
    <ListItem onClick={() => history.push(`/devices/${device.id}`)} button>
      <ListItemIcon>
        <ConnectionStateIcon connection={activeConnection} service={device} size="lg" />
      </ListItemIcon>
      <ListItemText primary={device.name} />
      <NextButton />
    </ListItem>
  )
}
