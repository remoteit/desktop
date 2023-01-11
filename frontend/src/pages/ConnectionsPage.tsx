import React from 'react'
import { Typography, Tooltip, Divider } from '@mui/material'
import { defaultNetwork, recentNetwork } from '../models/networks'
import { selectConnectionsByAccount, selectConnections } from '../selectors/connections'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { initiatorPlatformIcon } from '../components/InitiatorPlatform'
import { getDeviceModel } from '../selectors/devices'
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
  const { other, recent, active, initialized, loading } = useSelector((state: ApplicationState) => {
    const allConnections = selectConnections(state)
    const activeSessionIds = allConnections.map(c => c.sessionId)
    const otherSessions = state.sessions.all.filter(s => !activeSessionIds.includes(s.id))
    const deviceModel = getDeviceModel(state)
    let other: ILookup<INetwork> | undefined

    otherSessions.forEach(s => {
      const id = s.user?.id || 'default'
      other = other || {}
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

    if (other) {
      const otherKeys = Object.keys(other)
      if (!otherKeys.length || !other[otherKeys[0]]?.sessions?.length) other = undefined
    }

    return {
      other,
      recent: {
        ...recentNetwork,
        serviceIds: allConnections.filter(c => !c.enabled).map(c => c.id),
      },
      active: selectConnectionsByAccount(state),
      initialized: deviceModel.initialized,
      loading: deviceModel.fetching,
    }
  })

  const empty = !active?.length

  return (
    <Container bodyProps={{ verticalOverflow: true }} gutterBottom>
      <StickyTitle loading={loading}>
        <Title>Local Connections</Title>
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
          {active.map(n => (
            <Network noLink key={n.id} network={n} connectionsPage />
          ))}
          <SessionsList
            title="External connections"
            networks={other}
            action={
              <Tooltip
                title={
                  <>
                    <Typography variant="body2">
                      Any connection that didn't originate from this user and application.
                    </Typography>
                    <p>These are connections to any device you manage. Even if started by another application.</p>
                  </>
                }
                placement="top"
                arrow
              >
                <Icon name="circle-question" color="grayDark" size="sm" />
              </Tooltip>
            }
          />
          {!!recent.serviceIds.length && (
            <>
              <br />
              <Divider variant="inset" />
              <Network network={recent} recent noLink onClear={id => dispatch.connections.clear(id)} connectionsPage />
            </>
          )}
        </>
      ) : (
        <LoadingMessage message="Loading..." spinner={false} />
      )}
    </Container>
  )
}
