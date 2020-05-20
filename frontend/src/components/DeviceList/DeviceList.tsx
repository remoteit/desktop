import React from 'react'
import { DeviceListItem } from '../DeviceListItem'
import { DeviceSetupItem } from '../DeviceSetupItem'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { List, Divider } from '@material-ui/core'
import { LoadMore } from '../LoadMore'

export interface DeviceListProps {
  devices?: IDevice[]
  connections: { [deviceID: string]: IConnection[] }
}

export const DeviceList: React.FC<DeviceListProps> = ({ devices = [], connections = {} }) => {
  const myDevice = useSelector((state: ApplicationState) => state.backend.device)
  const thisDevice = devices.find(device => myDevice.uid === device.id)
  return (
    <>
      <List>
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
        {devices.map((device, index) => (
          <DeviceListItem key={device.id} device={device} connections={connections[device.id]} />
        ))}
      </List>
      <LoadMore />
    </>
  )
}
