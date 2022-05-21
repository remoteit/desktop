import React from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { Typography, List } from '@material-ui/core'
import { ListItemLocation } from '../components/ListItemLocation'
import { TargetPlatform } from '../components/TargetPlatform'
import { ShareDetails } from '../components/ShareDetails'
import { getDevices } from '../models/accounts'
import { getOrganization } from '../models/organization'
import { Container } from '../components/Container'
import { Avatar } from '../components/Avatar'
import { Title } from '../components/Title'

export const OrganizationGuestPage: React.FC<{ device?: IDevice }> = ({ device }) => {
  const { userID = '' } = useParams<{ userID: string }>()
  const { devices, guest } = useSelector((state: ApplicationState) => ({
    guest: getOrganization(state).guests.find(g => g.id === userID),
    devices: getDevices(state).filter((d: IDevice) => !d.hidden),
  }))

  return (
    <Container
      header={
        <Typography variant="h1" gutterBottom>
          <Title>
            <Avatar email={guest?.email} inline />
            {guest?.email}
          </Title>
        </Typography>
      }
    >
      <Typography variant="subtitle1">Devices</Typography>
      <List>
        {guest?.deviceIds.map(id => {
          const device = devices.find(d => d.id === id)
          return (
            <ListItemLocation
              key={id}
              pathname={`/organization/guests/${guest.id}/${id}`}
              icon={<TargetPlatform id={device?.targetPlatform} size="md" />}
              title={device?.name}
            >
              <ShareDetails user={guest} device={device} />
            </ListItemLocation>
          )
        })}
      </List>
    </Container>
  )
}
