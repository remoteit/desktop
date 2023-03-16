import React from 'react'
import { useParams } from 'react-router-dom'
import { selectById } from '../selectors/devices'
import { Typography } from '@mui/material'
import { newConnection } from '../helpers/connectionHelper'
import { ConnectionDetails } from '../components/ConnectionDetails'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { NoConnectionPage } from './NoConnectionPage'
import { ConnectionData } from '../components/ConnectionData'
import { DynamicButton } from '../buttons/DynamicButton'
import { InfoButton } from '../buttons/InfoButton'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'

export const ConnectionOtherPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const [stopping, setStopping] = React.useState<string>()
  const { serviceID, sessionID } = useParams<{ serviceID?: string; sessionID?: string }>()
  const { service, device, connection, session } = useSelector((state: ApplicationState) => {
    const [service, device] = selectById(state, undefined, serviceID)
    return {
      service,
      device,
      connection: state.connections.all.find(c => c.sessionId === sessionID) || newConnection(service),
      session: state.sessions.all.find(s => s.id === sessionID),
    }
  })

  if (!session) return <NoConnectionPage />

  const thisStopping = stopping === session.id

  return (
    <Container
      gutterBottom
      backgroundColor="primaryHighlight"
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <Typography variant="h1" gutterBottom>
            <Title>{session?.target.name}</Title>
            {device && <InfoButton device={device} service={service} />}
          </Typography>
          <Gutters top={null} bottom="lg">
            <DynamicButton
              size="large"
              title="Disconnect"
              color="primary"
              icon={thisStopping ? 'spinner-third' : 'pause'}
              iconType="solid"
              variant="text"
              loading={thisStopping}
              disabled={thisStopping}
              onClick={async () => {
                setStopping(session.id)
                await dispatch.connections.proxyDisconnect({ ...connection, sessionId: session.id })
              }}
              fullWidth
            />
          </Gutters>
        </>
      }
    >
      <Gutters top={null} size="md" bottom={null}>
        <ConnectionDetails
          connection={connection}
          session={session}
          service={service}
          showTitle={session?.user ? session.user.email : undefined}
          show
        >
          <ConnectionData connection={connection} service={service} session={session} />
        </ConnectionDetails>
      </Gutters>
    </Container>
  )
}
