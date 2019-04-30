import React from 'react'
import { IDevice } from 'remote.it'
import { DeviceListItem } from '../DeviceListItem'
import { List } from '@material-ui/core'

export interface Props {
  className?: string
  devices?: IDevice[]
}

export function DeviceList({
  className = '',
  devices = [],
}: Props & React.HTMLProps<HTMLDivElement>) {
  if (!devices || !devices.length) {
    return <h1>No devices...</h1>
  }

  return (
    <List component="nav" className={className}>
      {devices.map((device, key) => (
        <DeviceListItem key={key} device={device} />
      ))}
    </List>
  )
}
