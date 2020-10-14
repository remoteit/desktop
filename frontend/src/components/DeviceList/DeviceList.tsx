import React from 'react'
import { useSelector } from 'react-redux'
import { DeviceListItem } from '../DeviceListItem'
import { getAccountId, getOwnDevices } from '../../models/accounts'
import { DeviceSetupItem } from '../DeviceSetupItem'
import { ApplicationState } from '../../store'
import { ServiceContextualMenu } from '../ServiceContextualMenu'
import { Notice } from '../Notice'
import { List, Divider, ListItem } from '@material-ui/core'
import { LoadMore } from '../LoadMore'

export interface DeviceListProps {
  devices?: IDevice[]
  connections: { [deviceID: string]: IConnection[] }
}

export const DeviceList: React.FC<DeviceListProps> = ({ devices = [], connections = {} }) => {
  const [contextMenu, setContextMenu] = React.useState<IContextMenu>({})
  const { myDevice, loggedInUser, registeredId } = useSelector((state: ApplicationState) => ({
    registeredId: state.backend.device.uid,
    loggedInUser: getAccountId(state) === state.auth.user?.id,
    myDevice: getOwnDevices(state).find(device => device.id === state.backend.device.uid),
  }))

  return (
    <>
      <List>
        {registeredId ? (
          loggedInUser &&
          (myDevice ? (
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
          ) : (
            <>
              <ListItem>
                <Notice>This device is not registered to you.</Notice>
              </ListItem>
              <Divider />
            </>
          ))
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
