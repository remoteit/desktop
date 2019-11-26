import React from 'react'
import { IDevice } from 'remote.it'
import { ListItemLocation } from '../ListItemLocation'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { ListItemIcon, ListItemText } from '@material-ui/core'

export type DeviceListItemProps = {
  device: IDevice
  connections?: IConnection[]
}

export const DeviceListItem = ({ device, connections }: DeviceListItemProps) => {
  const activeConnection = connections && connections.find(c => c.active)
  return (
    <ListItemLocation pathname={`/devices/${device.id}`}>
      <ListItemIcon>
        <ConnectionStateIcon connection={activeConnection} service={device} size="lg" />
      </ListItemIcon>
      <ListItemText primary={device.name} />
    </ListItemLocation>
  )
}
