import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, useLocation } from 'react-router-dom'
import { makeStyles, Typography, List } from '@material-ui/core'
import { selectById } from '../models/devices'
import { ServiceConnected } from '../components/ServiceConnected'
import { InitiatorPlatform } from '../components/InitiatorPlatform'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { Title } from '../components/Title'
import { ApplicationState, Dispatch } from '../store'
import { NoConnectionPage } from './NoConnectionPage'
import { EditButton } from '../buttons/EditButton'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Icon } from '../components/Icon'
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
        <>
          <Gutters className={css.gutters} inset>
            {/* <InitiatorPlatform id={session?.platform} connected /> */}
            <Typography variant="h2">
              <Title>{session?.user?.email}</Title>
            </Typography>
            <EditButton device={device} service={service} connection={connection} />
          </Gutters>
          <ServiceConnected connection={connection} session={session} show />
        </>
      }
    >
      <List>
        <InlineTextFieldSetting disabled label="Connection Name" value={session.target.name} />
        {/* <Icon name="arrow-right" size="lg" /> */}
        {/* <Icon name="ellipsis-h" /> */}
        {/* <Title inline>{session?.target.name}</Title> */}
      </List>
    </Container>
  )
}

const useStyles = makeStyles({
  gutters: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: spacing.xl,
    marginRight: spacing.xl,
    paddingLeft: spacing.xs,
  },
})
