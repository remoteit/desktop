import React, { useEffect } from 'react'
import { Typography } from '@mui/material'
import { defaultNetwork, selectActiveNetwork, selectNetworks, recentNetwork, DEFAULT_ID } from '../../models/networks'
import { initiatorPlatformIcon } from '../../components/InitiatorPlatform'
import { selectConnections } from '../../helpers/connectionHelper'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { SessionsList } from '../../components/SessionsList'
import { IconButton } from '../../buttons/IconButton'
import { NetworkAdd } from '../../components/NetworkAdd'
import { Container } from '../../components/Container'
import { Network } from '../../components/Network'
import { Title } from '../../components/Title'
import analyticsHelper from '../../helpers/analyticsHelper'
import heartbeat from '../../services/Heartbeat'

export const ConnectionsPage: React.FC = () => {
  const { other, recent, networks, active } = useSelector((state: ApplicationState) => {
    const allConnections = selectConnections(state)
    const activeSessionIds = allConnections.map(c => c.sessionId)
    const otherSessions = state.sessions.all.filter(s => !activeSessionIds.includes(s.id))
    let other: ILookup<INetwork> = {}

    otherSessions.forEach(s => {
      const id = s.user?.id || 'default'
      if (!other[id]) {
        other[id] = {
          ...defaultNetwork(),
          id: 'other',
          enabled: true,
          name: s.user?.email || 'Unknown',
          icon: initiatorPlatformIcon({ id: s.platform })[0],
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
    analyticsHelper.page('ConnectionsPage')
  }, [])

  return (
    <Container
      bodyProps={{ verticalOverflow: true }}
      gutterBottom
      integrated
      header={
        <>
          <NetworkAdd networks={networks} />
          {!!networks?.length && (
            <Typography variant="subtitle1">
              <Title>Networks</Title>
              <IconButton icon="plus" title="Add Network" to="/networks/new" fixedWidth size="lg" />
            </Typography>
          )}
        </>
      }
    >
      <Network key={DEFAULT_ID} network={active} highlight noLink />
      {networks.map(n => (
        <Network key={n.id} network={n} />
      ))}
      <SessionsList title="Outside Connections" networks={other} />
      {!!recent.serviceIds.length && <Network network={recent} recent noLink collapse />}
    </Container>
  )
}
