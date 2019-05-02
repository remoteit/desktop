import React from 'react'
import { IDevice } from 'remote.it'
import { DeviceListItem } from '../DeviceListItem'
import { List } from '@material-ui/core'

export interface DeviceListProps {
  className?: string
  devices?: IDevice[]
}

export function DeviceList({
  className = '',
  devices = [],
}: DeviceListProps & React.HTMLProps<HTMLDivElement>) {
  if (!devices || !devices.length) {
    return <div className="p-md center gray italic">No devices to show...</div>
  }

  return (
    <List component="nav" className={className}>
      {devices.map(device => (
        <DeviceListItem key={device.id} device={device} />
      ))}
    </List>
  )
}
