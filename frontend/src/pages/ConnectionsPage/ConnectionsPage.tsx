import React, { useEffect } from 'react'
import { Typography } from '@mui/material'
import { defaultNetwork, recentNetwork } from '../../models/networks'
import { initiatorPlatformIcon } from '../../components/InitiatorPlatform'
import { selectConnections } from '../../helpers/connectionHelper'
import { ApplicationState, Dispatch } from '../../store'
import { useSelector, useDispatch } from 'react-redux'
import { selectNetworks } from '../../models/networks'
import { SessionsList } from '../../components/SessionsList'
import { ClearButton } from '../../buttons/ClearButton'
import { IconButton } from '../../buttons/IconButton'
import { NetworkAdd } from '../../components/NetworkAdd'
import { Container } from '../../components/Container'
import { Network } from '../../components/Network'
import { Title } from '../../components/Title'
import analyticsHelper from '../../helpers/analyticsHelper'
import heartbeat from '../../services/Heartbeat'

export const ConnectionsPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const { other, recent, networks } = useSelector((state: ApplicationState) => {
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
      {networks.map(n => (
        <Network key={n.id} network={n} />
      ))}
      <SessionsList title="Other Connections" networks={other} />
      {!!recent.serviceIds.length && (
        <>
          <Typography variant="subtitle1">
            <Title>Recent</Title>
            <ClearButton all onClick={() => dispatch.connections.clearRecent()} />
          </Typography>
          <Network network={recent} clear />
        </>
      )}
    </Container>
  )
}
