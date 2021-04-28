import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { Typography, List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction } from '@material-ui/core'
import { selectById } from '../models/devices'
import { ServiceConnected } from '../components/ServiceConnected'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { ApplicationState } from '../store'
import { NoConnectionPage } from './NoConnectionPage'
import { InfoButton } from '../buttons/InfoButton'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'
import analyticsHelper from '../helpers/analyticsHelper'

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

  useEffect(() => {
    analyticsHelper.page('ConnectionOtherPage')
  }, [])

  if (!service || !device || !session) return <NoConnectionPage />

  return (
    <Container
      header={
        <>
          <Typography variant="h1">
            <Title>{session?.user?.email}</Title>
            <InfoButton device={device} service={service} />
          </Typography>
          <Gutters>
            <ServiceConnected connection={connection} session={session} show />
          </Gutters>
          {/* <Icon name="arrow-right" size="lg" /> */}
          {/* <Icon name="ellipsis-h" /> */}
          {/* <Title inline>{session?.target.name}</Title> */}
        </>
      }
    >
      <List>
        <InlineTextFieldSetting disabled label="Connection Name" value={session.target.name} />
      </List>
    </Container>
  )
}
