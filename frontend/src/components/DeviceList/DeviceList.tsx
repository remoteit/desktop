import React from 'react'
import { DeviceListItem } from '../DeviceListItem'
import { Pager } from '../Pager'
import { List } from '@material-ui/core'

export interface DeviceListProps {
  devices?: IDevice[]
  connections: { [deviceID: string]: IConnection[] }
}

export const DeviceList: React.FC<DeviceListProps> = ({ devices = [], connections = {} }) => {
  return (
    <>
      <List>
        {devices.map((device, index) => (
          <DeviceListItem key={device.id} device={device} connections={connections[device.id]} />
        ))}
      </List>
      <Pager />
    </>
  )
}
