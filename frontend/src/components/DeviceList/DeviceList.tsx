import React from 'react'
import { useSelector } from 'react-redux'
import { DeviceListItem } from '../DeviceListItem'
import { getActiveAccountId, getOwnDevices } from '../../models/accounts'
import { DeviceSetupItem } from '../DeviceSetupItem'
import { ApplicationState } from '../../store'
import { ServiceContextualMenu } from '../ServiceContextualMenu'
import { List, Divider, ListItem } from '@material-ui/core'
import { isOffline } from '../../models/devices'
import { LoadMore } from '../LoadMore'
import { Notice } from '../Notice'

export interface DeviceListProps {
  connections: { [deviceID: string]: IConnection[] }
  devices?: IDevice[]
  restore?: boolean
}

export const DeviceList: React.FC<DeviceListProps> = ({ devices = [], connections = {}, restore }) => {
  const [contextMenu, setContextMenu] = React.useState<IContextMenu>({})
  const { myDevice, loggedInUser, registeredId } = useSelector((state: ApplicationState) => ({
    registeredId: state.backend.device.uid,
    loggedInUser: getActiveAccountId(state) === state.auth.user?.id,
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
              <Divider variant="inset" />
            </>
          ) : (
            <>
              <ListItem>
                <Notice>This device is not registered to you.</Notice>
              </ListItem>
              <Divider variant="inset" />
            </>
          ))
        ) : (
          <>
            <DeviceSetupItem restore={restore} />
            <Divider variant="inset" />
          </>
        )}
        {devices?.map(device => {
          const canRestore = isOffline(device) && !device.shared
          if (device.id === myDevice?.id || (restore && !canRestore)) return
          return (
            <DeviceListItem
              key={device.id}
              device={device}
              connections={connections[device.id]}
              setContextMenu={setContextMenu}
              restore={restore && canRestore}
            />
          )
        })}
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
