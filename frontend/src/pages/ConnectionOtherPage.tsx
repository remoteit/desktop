import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { selectById } from '../selectors/devices'
import { Typography } from '@mui/material'
import { newConnection } from '../helpers/connectionHelper'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { NoConnectionPage } from './NoConnectionPage'
import { DynamicButton } from '../buttons/DynamicButton'
import { InfoButton } from '../buttons/InfoButton'
import { Container } from '../components/Container'
import { Connect } from '../components/Connect'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'

export const ConnectionOtherPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const [stopping, setStopping] = useState<string>()
  const { serviceID, sessionID } = useParams<{ serviceID?: string; sessionID?: string }>()
  const { service, device, connection, session } = useSelector((state: State) => {
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
            <Title>{session.target.name}</Title>
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
                await dispatch.sessions.disconnect({ id: connection.id, sessionId: session.id })
              }}
              fullWidth
            />
          </Gutters>
        </>
      }
    >
      <Connect variant="session" />
    </Container>
  )
}
