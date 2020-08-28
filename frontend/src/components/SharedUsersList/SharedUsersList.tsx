import React from 'react'
import { List, ListItemIcon, ListItemText, Divider, Typography } from '@material-ui/core'
import { getUsersConnectedDeviceOrService, getDetailUserPermission } from '../../models/devices'
import { InitiatorPlatform } from '../InitiatorPlatform'
import { ListItemLocation } from '../ListItemLocation/ListItemLocation'
import { ShareDetails } from '../DeviceShareContainer/ContactCardActions'
import { useLocation } from 'react-router-dom'
import { Duration } from '../Duration'

interface Props {
  device: IDevice
  service?: IService
}

export const SharedUsersList: React.FC<Props> = ({ device, service }) => {
  const usersConnected = getUsersConnectedDeviceOrService(device, service)
  const users = service ? service.access : device?.access
  const usersToRender = usersConnected.concat(users.filter(user => !usersConnected.find(_u => _u.email === user.email)))
  const location = useLocation()

  return (
    <>
      {!!usersConnected.length && (
        <Typography variant="subtitle1" color="primary">
          Connected
        </Typography>
      )}
      <List>
        {usersToRender.map((user, index) => {
          const isConnected = usersConnected.includes(user)
          const permission = getDetailUserPermission(device, user.email)
          return (
            <>
              <ListItemLocation pathname={`${location.pathname}/${user.email}`}>
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
                <ShareDetails scripting={permission.scripting} shared={permission.numberServices} />
              </ListItemLocation>
              {usersConnected.length - 1 === index && <Divider />}
            </>
          )
        })}
      </List>
    </>
  )
}
