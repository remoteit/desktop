import React from 'react'
import { IDevice } from 'remote.it'
import { DeviceListItem } from '../DeviceListItem'
import { Body } from '../Body'
import { List } from '@material-ui/core'
import { Icon } from '../Icon'
import classnames from 'classnames'

export interface DeviceListProps {
  className?: string
  devices?: IDevice[]
  connections: { [deviceID: string]: IConnection[] }
  searchPerformed: boolean
  searchOnly: boolean
  searching: boolean
  query: string
}

const NoDevicesMessage = () => <Body center>You have no devices, devices added to your account will appear here.</Body>
const NoResultsMessage = () => <Body center>Your search didn't match any results, please try a different search.</Body>
const SearchOnlyMessage = () => <Body center>Please search for a device or service.</Body>
const SearchingMessage = () => <Body center>Searching for devices and services...</Body>

export function DeviceList({
  className = '',
  devices = [],
  connections = {},
  searchOnly = false,
  query = '',
  searching = false,
  searchPerformed = false,
}: DeviceListProps & React.HTMLProps<HTMLDivElement>) {
  if (searching) return <SearchingMessage />

  if (searchOnly) {
    if (!searchPerformed) return <SearchOnlyMessage />
    if (!devices.length) return <NoDevicesMessage />
  } else {
    if (query && !devices.length) return <NoResultsMessage />
    if (!devices.length) return <NoDevicesMessage />
  }

  return (
    <List component="nav" className={classnames(className, 'py-none of-auto fg-1')}>
      {devices.map(device => (
        <DeviceListItem key={device.id} device={device} connections={connections[device.id]} />
      ))}
    </List>
  )
}
