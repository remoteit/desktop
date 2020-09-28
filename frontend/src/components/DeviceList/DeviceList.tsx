import React from 'react'
import { useSelector } from 'react-redux'
import { DeviceListItem } from '../DeviceListItem'
import { DeviceSetupItem } from '../DeviceSetupItem'
import { ApplicationState } from '../../store'
import { ServiceContextualMenu } from '../ServiceContextualMenu'
import { List, Divider } from '@material-ui/core'
import { LoadMore } from '../LoadMore'

export interface DeviceListProps {
  devices?: IDevice[]
  connections: { [deviceID: string]: IConnection[] }
}

export const DeviceList: React.FC<DeviceListProps> = ({ devices = [], connections = {} }) => {
  const [contextMenu, setContextMenu] = React.useState<IContextMenu>({})
  const { myDevice, deviceOwner, registeredId } = useSelector((state: ApplicationState) => ({
    registeredId: state.backend.device.uid,
    deviceOwner: state.accounts.activeId && state.accounts.activeId === state.auth.user?.id,
    myDevice: state.devices.all.find(device => device.id === state.backend.device.uid),
  }))

  return (
    <>
      <List>
        {registeredId ? (
          deviceOwner && (
            <>
              <DeviceListItem
                key={registeredId}
                device={myDevice}
                connections={connections[registeredId]}
                thisDevice={true}
                setContextMenu={setContextMenu}
              />
              <Divider />
            </>
          )
        ) : (
          <>
            <DeviceSetupItem />
            <Divider />
          </>
        )}
        {devices.map(
          device =>
            device.id !== myDevice?.id && (
              <DeviceListItem
                key={device.id}
                device={device}
                connections={connections[device.id]}
                setContextMenu={setContextMenu}
              />
            )
        )}
      </List>
      <LoadMore />
      <ServiceContextualMenu
        el={contextMenu.el}
        serviceID={contextMenu.serviceID}
        setEl={el => setContextMenu({ ...contextMenu, el })}
      />
    </>
  )
}
