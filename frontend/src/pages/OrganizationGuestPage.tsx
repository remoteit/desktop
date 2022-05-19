import React from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { Typography, List } from '@material-ui/core'
import { ListItemLocation } from '../components/ListItemLocation'
import { TargetPlatform } from '../components/TargetPlatform'
import { ShareDetails } from '../components/ShareDetails'
import { getDevices } from '../models/accounts'
import { Container } from '../components/Container'
import { Title } from '../components/Title'

export const OrganizationGuestPage: React.FC<{ device?: IDevice }> = ({ device }) => {
  const { userID = '' } = useParams<{ userID: string }>()
  const { devices } = useSelector((state: ApplicationState) => ({
    devices: getDevices(state).filter((d: IDevice) => !d.hidden),
  }))

  const guest: IGuest | undefined = devices.reduce((result: IGuest | undefined, device) => {
    device.access.forEach(({ id, email }) => {
      if (id !== userID) return
      if (result) result.devices.push(device)
      else result = { id, email, devices: [device] }
    })
    return result
  }, undefined)

  return (
    <Container
      header={
        <Typography variant="h1">
          <Title>{guest?.email}</Title>
        </Typography>
      }
    >
      <Typography variant="subtitle1">Devices</Typography>
      <List>
        {guest?.devices.map(device => (
          <ListItemLocation
            pathname={`/organization/guests/${guest.id}/${device.id}`}
            icon={<TargetPlatform id={device?.targetPlatform} size="md" />}
            title={device.name}
          >
            <ShareDetails user={guest} device={device} />
          </ListItemLocation>
        ))}
      </List>
    </Container>
  )
}
