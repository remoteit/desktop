import React from 'react'
import { IDevice } from 'remote.it'
import { ServiceName } from '../ServiceName'
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
        <ConnectionStateIcon service={device} connection={activeConnection} size="lg" />
      </ListItemIcon>
      <ListItemText primary={<ServiceName service={device} connection={activeConnection} />} />
    </ListItemLocation>
  )
}
