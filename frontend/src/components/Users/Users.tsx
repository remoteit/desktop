import React, { useEffect } from 'react'
import { List, ListItemIcon, ListItemText, Divider,  } from '@material-ui/core'
import { Duration } from '../Duration'
import { Platform } from '../Platform'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { ListItemLocation } from '../ListItemLocation/ListItemLocation'
import { ShareDetails } from '../DeviceShareContainer/ContactCardActions'
import { SharingManager } from '../../services/SharingManager'
import { getUsersConnectedDevice } from '../../models/devices'

interface Props {
  deviceId: string
  service?: IService | null
}

export const Users: React.FC<Props> = ({ deviceId, service }) => {
  const [shares, setShares] = React.useState<ShareInfo[]>([])
  const devices = useSelector((state: ApplicationState) => state.devices.all)
  const findDevice = (id: string) => devices.find((d: IDevice) => d.id === id)
  const device = findDevice(deviceId)
  const shared = service ? service?.access.length : device?.access.length
  const usersConnected = getUsersConnectedDevice(device)

  async function handleFetch(): Promise<void> {
    const { shares } = await SharingManager.fetch(deviceId)
    setShares(shares)
  }

  useEffect(() => {
    handleFetch()
  }, [])

  if (!shared) return null

  const users =  service ? service.access : device?.access

  if (!users?.length) return null

  const details = (scripting: boolean, sharedLength: number, totalServices: number) => (
    <ShareDetails
      scripting={scripting}
      shared={sharedLength}
    />
  )

  return (
    <>
      <List>
        {users.map((user, index) => {
            const isConneted = usersConnected.includes(user.email)
            return (<>
              <ListItemLocation key={index} pathname={`/devices/${deviceId}/users/${user.email}`}>
                <ListItemIcon>
                  <Platform id={user.platform} connected={isConneted} />
                </ListItemIcon>
                <ListItemText primary={`${user.email}`} />
                {shares.map(share => {
                  if (share.email === user.email) {
                    return details(share.scripting, share?.services?.length, device?.services?.length || 0)
                  }
                })}
              </ListItemLocation>
              {isConneted && <Divider />}
            </>)
        })}
      </List>
    </>
  )
}
