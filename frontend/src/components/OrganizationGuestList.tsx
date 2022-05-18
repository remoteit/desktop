import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { List, ListSubheader, ListItemSecondaryAction, Box, Chip } from '@material-ui/core'
import { ListItemLocation } from './ListItemLocation'
import { getDevices } from '../models/accounts'
import { Avatar } from './Avatar'
import { Icon } from './Icon'

export const OrganizationGuestList: React.FC = () => {
  const { devices, user } = useSelector((state: ApplicationState) => ({
    user: state.user,
    devices: getDevices(state).filter((d: IDevice) => !d.hidden),
  }))

  const guests = devices.reduce((all: IGuest[], device) => {
    device.access.forEach(({ id, email }) => {
      if (email === user.email) return
      const exists = all.find(g => g.email === email)
      if (exists) exists.devices.push(device)
      else all.push({ id, email, devices: [device] })
    })
    return all
  }, [])

  return (
    <List>
      <ListSubheader>
        Guest
        <ListItemSecondaryAction>Access</ListItemSecondaryAction>
      </ListSubheader>
      {guests.sort(alphaEmailSort).map(guest => (
        <ListItemLocation
          dense
          key={guest.id}
          title={guest.email}
          pathname={`/organization/guests/${guest.id}`}
          icon={<Avatar email={guest.email} size={26} />}
        >
          <ListItemSecondaryAction>
            <Chip
              size="small"
              label={
                <Box display="flex">
                  <Icon name="hdd" size="base" color="grayDarker" inlineLeft />
                  {guest.devices.length}
                </Box>
              }
            />
          </ListItemSecondaryAction>
        </ListItemLocation>
      ))}
    </List>
  )
}

function alphaEmailSort(a, b) {
  const aa = a.email.toLowerCase()
  const bb = b.email.toLowerCase()
  return aa > bb ? 1 : aa < bb ? -1 : 0
}

/*
To display by platform:

type IPlatformCount = { id: number; name: string; type: IconType; count: number }

.reduce((platforms: IPlatformCount[], device: IDevice) => {
  const exists = platforms.find(p => p.id === device.targetPlatform)
  if (exists) exists.count++
  else
    platforms.push({
      id: device.targetPlatform,
      count: 1,
      ...getTargetPlatformIcon(device.targetPlatform),
    })
  return platforms
}, [])
 */
