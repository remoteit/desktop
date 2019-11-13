import React from 'react'
import { IDevice } from 'remote.it'
import { DeviceListItem } from '../DeviceListItem'
import { List } from '@material-ui/core'
import classnames from 'classnames'
// import { LoadingMessage } from '../LoadingMessage'
import { Icon } from '../Icon'

export interface DeviceListProps {
  className?: string
  devices?: IDevice[]
  connections: { [deviceID: string]: IConnection[] }
  searchPerformed: boolean
  searchOnly: boolean
  searching: boolean
  query: string
}

const NoDevicesMessage = () => (
  <div className="px-md py-sm center bg-warning white fw-bold">
    You have no devices, please add a device to your account to see it here.
  </div>
)

const NoResultsMessage = () => (
  <div className="px-md py-sm center bg-warning white fw-bold">
    Your search didn't match any results, please try a different search.
  </div>
)

const SearchOnlyMessage = () => (
  <div className="px-md py-sm center gray italic">
    Unable to display your device list because the number of devices in your account is too large. Please search for a
    device or service above instead.
  </div>
)

const SearchingMessage = () => (
  <div className="px-md py-md center gray italic">
    <Icon name="spinner-third" spin className="mr-sm" /> Searching for devices and services...
  </div>
)

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
