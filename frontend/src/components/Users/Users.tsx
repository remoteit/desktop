import React from 'react'
import { List, ListItemIcon, ListItemText, Divider, Typography } from '@material-ui/core'
import { Duration } from '../Duration'
import { Platform } from '../Platform'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { ListItemLocation } from '../ListItemLocation/ListItemLocation'
import { ShareDetails } from '../DeviceShareContainer/ContactCardActions'
import { getUsersConnectedDeviceOrService, getDetailUserPermission } from '../../models/devices'

interface Props {
  deviceId: string
  service?: IService
}

export const Users: React.FC<Props> = ({ deviceId, service }) => {
  const devices = useSelector((state: ApplicationState) => state.devices.all)
  const device = devices.find((d: IDevice) => d.id === deviceId)
  const shared = service ? service?.access.length : device?.access.length
  const usersConnected = getUsersConnectedDeviceOrService(device, service)

  if (!shared || !device) return null

  const users = service ? service.access : device?.access

  if (!users?.length) return null

  const usersToRender = usersConnected.concat(users.filter(user => !usersConnected.find(_u => _u.email === user.email)))

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
              <ListItemLocation pathname={`/devices/${deviceId}/users/${user.email}`}>
                <ListItemIcon>
                  <Platform id={user.platform} connected={isConnected} />
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
