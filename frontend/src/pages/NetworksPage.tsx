import React, { useEffect } from 'react'
import { Typography, Collapse } from '@mui/material'
import { defaultNetwork, selectActiveNetwork, selectNetworks, recentNetwork, DEFAULT_ID } from '../models/networks'
import { initiatorPlatformIcon } from '../components/InitiatorPlatform'
import { selectConnections } from '../helpers/connectionHelper'
import { ApplicationState } from '../store'
import { useSelector } from 'react-redux'
import { SessionsList } from '../components/SessionsList'
import { IconButton } from '../buttons/IconButton'
import { NetworkAdd } from '../components/NetworkAdd'
import { Container } from '../components/Container'
import { Network } from '../components/Network'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'
import { Link } from '../components/Link'
import analyticsHelper from '../helpers/analyticsHelper'
import heartbeat from '../services/Heartbeat'

export const NetworksPage: React.FC = () => {
  const { other, recent, networks, active } = useSelector((state: ApplicationState) => {
    const allConnections = selectConnections(state)
    const activeSessionIds = allConnections.map(c => c.sessionId)
    const otherSessions = state.sessions.all.filter(s => !activeSessionIds.includes(s.id))
    let other: ILookup<INetwork> = {}

    otherSessions.forEach(s => {
      const id = s.user?.id || 'default'
      if (!other[id]) {
        const [icon, iconType] = initiatorPlatformIcon({ id: s.platform })
        other[id] = {
          ...defaultNetwork(),
          id: 'other',
          enabled: true,
          name: s.user?.email || 'Unknown',
          icon,
          iconType,
          sessions: [],
        }
      }
      other[id].sessions?.push(s)
    })

    return {
      other,
      recent: {
        ...recentNetwork,
        serviceIds: allConnections.filter(c => !c.enabled).map(c => c.id),
      },
      active: selectActiveNetwork(state),
      networks: selectNetworks(state),
    }
  })

  useEffect(() => {
    heartbeat.beat()
    analyticsHelper.page('NetworksPage')
  }, [])

  return (
    <Container
      bodyProps={{ verticalOverflow: true }}
      gutterBottom
      header={
        <>
          <NetworkAdd networks={networks} />
          <Typography variant="subtitle1">
            <Title>Networks</Title>
            <IconButton icon="plus" title="Add Network" to="/networks/new" color="primary" fixedWidth size="md" />
          </Typography>
        </>
      }
    >
      <Network key={DEFAULT_ID} network={active} highlight noLink />
      <Collapse in={!networks?.length}>
        <Gutters top="xxl">
          <Typography variant="h3" align="center" gutterBottom>
            Networks appear here
          </Typography>
          <Typography variant="body2" align="center" color="textSecondary">
            Add services from the <Link to="/devices">Devices</Link> tab.
            <br />
            You must be the device owner to add a service.
          </Typography>
        </Gutters>
      </Collapse>
      {networks.map(n => (
        <Network key={n.id} network={n} />
      ))}
      <SessionsList title="Other Connections" networks={other} />
      {!!recent.serviceIds.length && <Network network={recent} recent noLink collapse />}
    </Container>
  )
}
