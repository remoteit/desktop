import React from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { Typography } from '@mui/material'
import { selectById } from '../models/devices'
import { ConnectionDetails } from '../components/ConnectionDetails'
import { ApplicationState } from '../store'
import { NoConnectionPage } from './NoConnectionPage'
import { InfoButton } from '../buttons/InfoButton'
import { Container } from '../components/Container'
import { Title } from '../components/Title'

export const ConnectionOtherPage: React.FC = () => {
  const { serviceID, sessionID } = useParams<{ serviceID?: string; sessionID?: string }>()
  const { service, device, connection, session } = useSelector((state: ApplicationState) => {
    const [service, device] = selectById(state, serviceID)
    return {
      service,
      device,
      connection: state.connections.all.find(c => c.id === serviceID),
      session: state.sessions.all.find(s => s.id === sessionID),
    }
  })

  if (!session) return <NoConnectionPage />

  return (
    <Container
      gutterBottom
      backgroundColor="primaryHighlight"
      bodyProps={{ verticalOverflow: true }}
      header={
        <Typography variant="h1" gutterBottom>
          <Title>{session?.target.name}</Title>
          {device && <InfoButton device={device} service={service} />}
        </Typography>
      }
    >
      <ConnectionDetails
        connection={connection}
        session={session}
        service={service}
        showTitle={session?.user ? session.user.email : undefined}
        show
      />
    </Container>
  )
}
