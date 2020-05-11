import React from 'react'
import { IDevice } from 'remote.it'
import { DeviceListItem } from '../DeviceListItem'
import { DeviceListEmpty } from '../DeviceListEmpty'
import { DeviceSetupItem } from '../DeviceSetupItem'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { Body } from '../Body'
import { List, Divider } from '@material-ui/core'
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

const NoDevicesMessage = () => <DeviceListEmpty />
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
  const myDevice = useSelector((state: ApplicationState) => state.backend.device)
  const thisDevice = devices.find(device => myDevice.uid === device.id)

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
      {thisDevice ? (
        <DeviceListItem
          key={thisDevice.id}
          device={thisDevice}
          connections={connections[thisDevice.id]}
          thisDevice={true}
        />
      ) : (
        <DeviceSetupItem thisDevice={true} />
      )}
      <Divider />
      {devices.map(
        device =>
          thisDevice !== device && (
            <DeviceListItem key={device.id} device={device} connections={connections[device.id]} />
          )
      )}
    </List>
  )
}
