import React from 'react'
import { State, Dispatch } from '../store'
import { Typography, Divider } from '@mui/material'
import { defaultNetwork, recentNetwork } from '../models/networks'
import { selectConnectionsByType, selectConnections, selectConnectionSessions } from '../selectors/connections'
import { selectDeviceModelAttributes } from '../selectors/devices'
import { useSelector, useDispatch } from 'react-redux'
import { initiatorPlatformIcon } from '../components/InitiatorPlatform'
import { LoadingMessage } from '../components/LoadingMessage'
import { SessionsList } from '../components/SessionsList'
import { StickyTitle } from '../components/StickyTitle'
import { Container } from '../components/Container'
import { Network } from '../components/Network'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'

export const ConnectionsPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const allConnections = useSelector(selectConnections)
  const sessions = useSelector(selectConnectionSessions)
  const initialized = useSelector((state: State) => state.connections.initialized)
  const loading = useSelector(selectDeviceModelAttributes).fetching
  const idle = useSelector(selectConnectionsByType)

  let active: ILookup<INetwork> = {}

  sessions.forEach(s => {
    const id = s.user?.id || 'default'
    if (!active[id]) {
      const [icon, iconType] = initiatorPlatformIcon({ id: s.platform })
      active[id] = {
        ...defaultNetwork(),
        id: 'other',
        name: s.user?.email || 'Unknown',
        icon,
        iconType,
        sessions: [],
      }
    }
    active[id].sessions?.push(s)
  })

  if (active) {
    const otherKeys = Object.keys(active)
    if (!otherKeys.length || !active[otherKeys[0]]?.sessions?.length) active = {}
  }

  const recent = { ...recentNetwork, serviceIds: allConnections.filter(c => !c.enabled).map(c => c.id) }
  const empty = !idle?.length

  return (
    <Container bodyProps={{ verticalOverflow: true }} gutterBottom>
      <SessionsList title="Connected" networks={active} />
      <StickyTitle loading={loading}>
        <Title>Idle</Title>
      </StickyTitle>
      {initialized ? (
        <>
          {empty && (
            <Gutters top="xxl" bottom="xxl" center>
              <Typography variant="h1" gutterBottom>
                <Icon name="arrow-right-arrow-left" fontSize={50} type="light" color="grayLight" />
              </Typography>
              <Typography variant="h3">You have no connections</Typography>
              <Typography variant="caption">Begin by selecting a device's service from the Devices menu.</Typography>
            </Gutters>
          )}
          {idle.map(n => (
            <Network key={n.id} network={n} connectionsPage />
          ))}
          {!!recent.serviceIds.length && (
            <>
              <br />
              <Divider variant="inset" />
              <Network network={recent} recent onClear={id => dispatch.connections.clear(id)} connectionsPage />
            </>
          )}
        </>
      ) : (
        <LoadingMessage message="Loading..." spinner={false} />
      )}
    </Container>
  )
}
