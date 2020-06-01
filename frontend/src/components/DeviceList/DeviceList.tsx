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
  const myDevice = useSelector((state: ApplicationState) =>
    state.devices.all.find(device => device.id === state.backend.device.uid)
  )

  return (
    <>
      <List>
        {myDevice?.id ? (
          <DeviceListItem
            key={myDevice.id}
            device={myDevice}
            connections={connections[myDevice.id]}
            thisDevice={true}
          />
        ) : (
          <DeviceSetupItem thisDevice={true} />
        )}
        <Divider />
        {devices.map(
          device =>
            device.id !== myDevice?.id && (
              <DeviceListItem key={device.id} device={device} connections={connections[device.id]} />
            )
        )}
      </List>
      <LoadMore />
    </>
  )
}
