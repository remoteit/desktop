import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, useLocation } from 'react-router-dom'
import { makeStyles, Typography } from '@material-ui/core'
import { selectById } from '../models/devices'
import { ServiceConnected } from '../components/ServiceConnected'
import { InitiatorPlatform } from '../components/InitiatorPlatform'
import { Title } from '../components/Title'
import { ApplicationState, Dispatch } from '../store'
import { NoConnectionPage } from './NoConnectionPage'
import { EditButton } from '../buttons/EditButton'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { spacing } from '../styling'
import analyticsHelper from '../helpers/analyticsHelper'

export const ConnectionOtherPage: React.FC = () => {
  const css = useStyles()
  const { serviceID, sessionID } = useParams<{ serviceID?: string; sessionID?: string }>()
  const { service, device, connection, session } = useSelector((state: ApplicationState) => {
    const [service, device] = selectById(state, serviceID)
    return {
      service,
      device,
      connection: state.backend.connections.find(c => c.id === serviceID),
      session: state.sessions.all.find(s => s.id === sessionID),
    }
  })

  useEffect(() => {
    analyticsHelper.page('ConnectionOtherPage')
  }, [])

  if (!service || !device || !session) return <NoConnectionPage />

  return (
    <Container
      header={
        <Typography variant="h1">
          <InitiatorPlatform id={session?.platform} connected />
          <Title enabled inline>
            {session?.user?.email}
          </Title>
          <EditButton device={device} service={service} connection={connection} />
        </Typography>
      }
    >
      <Gutters className={css.gutters} inset></Gutters>
      <ServiceConnected connection={connection} session={session} show />
    </Container>
  )
}

const useStyles = makeStyles({
  gutters: {
    display: 'flex',
    margin: spacing.lg,
  },
})
