import React from 'react'
import { List, ListItemIcon, ListItemText, Divider, Typography } from '@material-ui/core'
import { getUsersConnectedDeviceOrService, getDetailUserPermission } from '../../models/devices'
import { InitiatorPlatform } from '../InitiatorPlatform'
import { ListItemLocation } from '../ListItemLocation/ListItemLocation'
import { ShareDetails } from '../ShareDetails'
import { useLocation } from 'react-router-dom'
import { Duration } from '../Duration'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'

interface Props {
  device?: IDevice
  service?: IService
}

export const SharedUsersList: React.FC<Props> = ({ device, service }) => {
  const { connections, registeredId } = useSelector((state: ApplicationState) => ({
    registeredId: state.backend.device.uid,
    connections: state.backend.connections.reduce((lookup: { [deviceID: string]: IConnection[] }, c: IConnection) => {
      if (lookup[c.deviceID]) lookup[c.deviceID].push(c)
      else lookup[c.deviceID] = [c]
      return lookup
    }, {}),
  }))
  const activeConnections = connections[registeredId] && connections[registeredId].find(c => c.active)
  const usersConnected = getUsersConnectedDeviceOrService(device, service)
  const users = service ? service.access : device?.access || []
  const usersToRender = usersConnected
    .concat(users.filter(user => !usersConnected.find(_u => _u.email === user.email)))
    .sort((a, b) => (a.email > b.email ? 1 : b.email > a.email ? -1 : 0))
  const location = useLocation()

  if (!device?.access?.length) return null

  return (
    <>
      {!!usersConnected.length && (
        <Typography variant="subtitle1" color="primary">
          Connected
        </Typography>
      )}
      <List>
        {usersToRender.sort().map((user, index) => {
          const isConnected = usersConnected.includes(user)
          const permission = getDetailUserPermission(device, user.email)
          return (
            <>
              <ListItemLocation pathname={`${location.pathname}/${user.email}`} dense>
                <ListItemIcon>
                  <InitiatorPlatform id={user.platform} connected={isConnected} />
                </ListItemIcon>
                {isConnected ? (
                  <ListItemText
                    primaryTypographyProps={{ color: 'primary' }}
                    primary={user.email}
                    secondary={<Duration startTime={user.timestamp?.getTime()} ago />}
                  />
                ) : (
                  <ListItemText primary={`${user.email}`} />
                )}
                <ShareDetails
                  scripting={permission.scripting}
                  shared={permission.numberServices}
                  services={permission.services}
                  service={service}
                  connections={activeConnections}
                />
              </ListItemLocation>
              {usersConnected.length - 1 === index && <Divider />}
            </>
          )
        })}
      </List>
    </>
  )
}
