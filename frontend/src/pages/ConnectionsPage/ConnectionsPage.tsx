import React, { useEffect } from 'react'
import { Typography } from '@material-ui/core'
import { selectConnections, connectionState } from '../../helpers/connectionHelper'
import { ApplicationState, Dispatch } from '../../store'
import { useSelector, useDispatch } from 'react-redux'
import { selectNetworks } from '../../models/networks'
import { SessionsList } from '../../components/SessionsList'
import { ClearButton } from '../../buttons/ClearButton'
import { IconButton } from '../../buttons/IconButton'
import { selectById } from '../../models/devices'
import { NetworkAdd } from '../../components/NetworkAdd'
import { Network } from '../../components/Network'
import { Title } from '../../components/Title'
import { Body } from '../../components/Body'
import analyticsHelper from '../../helpers/analyticsHelper'
import heartbeat from '../../services/Heartbeat'

export const ConnectionsPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  /* 
    FIXME remove and account for the local and proxy connection info 
  */
  const { local, proxy, other, recent, networks } = useSelector((state: ApplicationState) => {
    const allConnections = selectConnections(state)
    const networks = selectNetworks(state)

    let local: ISession[] = []
    let proxy: ISession[] = []
    let other: ISession[] = []
    let recent: ISession[] = []

    for (const session of state.sessions.all) {
      const index = allConnections.findIndex(c => c.sessionId === session.id) // @TODO assign the connection id to the session if available on parsing
      if (index > -1) {
        session.state = connectionState(undefined, allConnections[index])
        if (session.public) proxy.push(session)
        else local.push(session)
        allConnections.splice(index, 1)
      } else {
        session.state = 'connected'
        other.push(session)
      }
    }

    for (const connection of allConnections) {
      const [service, device] = selectById(state, connection.id)
      const session: ISession = {
        state: connectionState(service, connection),
        timestamp: new Date(connection.createdTime || 0),
        platform: 0,
        user: state.auth.user,
        geo: undefined,
        public: connection.public,
        target: {
          id: connection.id,
          deviceId: device?.id || '',
          platform: device?.targetPlatform,
          name: connection.name || service?.name || '',
        },
      }
      if (connection.enabled) {
        if (session.public) proxy.push(session)
        else local.push(session)
      } else recent.push(session)
    }

    return { local, proxy, other, recent, networks }
  })

  useEffect(() => {
    heartbeat.beat()
    analyticsHelper.page('ConnectionsPage')
  }, [])

  return (
    <Body verticalOverflow gutterBottom>
      <NetworkAdd networks={networks} />
      {!!networks?.length && (
        <>
          <Typography variant="subtitle1">
            <Title>Networks</Title>
            <IconButton icon="plus" title="Add Network" to="/networks/new" fixedWidth />
          </Typography>
          {networks.map(n => (
            <Network key={n.id} network={n} />
          ))}
        </>
      )}
      <SessionsList title="External Connections" sessions={other} other />
      <SessionsList
        title="Recent"
        sessions={recent}
        action={!!recent.length ? <ClearButton all onClick={() => dispatch.connections.clearRecent()} /> : undefined}
        offline
      />
    </Body>
  )
}
