import React, { useEffect } from 'react'
import { List, ListItemIcon, ListItemText, Divider,  } from '@material-ui/core'
import { Duration } from '../Duration'
import { Platform } from '../Platform'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { ListItemLocation } from '../ListItemLocation/ListItemLocation'
import { ShareDetails } from '../DeviceShareContainer/ContactCardActions'
import { SharingManager } from '../../services/SharingManager'
import { getUsersConnectedDeviceOrService, getDetailUserPermission } from '../../models/devices'

interface Props {
  deviceId: string
  service?: IService | null
}

export const Users: React.FC<Props> = ({ deviceId, service }) => {
  const devices = useSelector((state: ApplicationState) => state.devices.all)
  const findDevice = (id: string) => devices.find((d: IDevice) => d.id === id)
  const device = findDevice(deviceId)
  const shared = service ? service?.access.length : device?.access.length
  const usersConnected = getUsersConnectedDeviceOrService(device, service)

  if (!shared || !device) return null

  const users =  service ? service.access : device?.access

  if (!users?.length) return null

  const usersToRender = usersConnected.concat(users.filter(user => !usersConnected.find(_u => _u.email === user.email)))

  return (
    <>
      <List>
        {usersToRender.map((user) => {
          const isConneted = usersConnected.includes(user)
          const permission = getDetailUserPermission(device, user.email)
          return (
            <ListItemLocation  pathname={`/devices/${deviceId}/users/${user.email}`}>
                <ListItemIcon>
                  <Platform id={user.platform} connected={isConneted} />
                </ListItemIcon>
                {isConneted ? (
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
                />
                
            </ListItemLocation>
          )
        })}
      </List>
      
    </>
  )
}
