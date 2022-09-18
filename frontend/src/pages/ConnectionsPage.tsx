import React from 'react'
import { Typography, Tooltip } from '@mui/material'
import { defaultNetwork, selectActiveNetworks, recentNetwork } from '../models/networks'
import { initiatorPlatformIcon } from '../components/InitiatorPlatform'
import { selectConnections } from '../helpers/connectionHelper'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { getDeviceModel } from '../models/accounts'
import { LoadingMessage } from '../components/LoadingMessage'
import { SessionsList } from '../components/SessionsList'
import { Container } from '../components/Container'
import { Network } from '../components/Network'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'

export const ConnectionsPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const { other, recent, active, initialized } = useSelector((state: ApplicationState) => {
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
      active: selectActiveNetworks(state),
      initialized: getDeviceModel(state).initialized,
    }
  })

  return (
    <Container
      bodyProps={{ verticalOverflow: true }}
      gutterBottom
      header={
        <Typography variant="subtitle1">
          <Title>Connections</Title>
        </Typography>
      }
    >
      {initialized ? (
        <>
          {active.map(n => (
            <Network noLink key={n.id} network={n} />
          ))}
          <SessionsList
            title="Other Connections"
            networks={other}
            action={
              <Tooltip
                title="These are connections to a device of yours that originated from a different application or user."
                placement="top"
                arrow
              >
                <Icon name="circle-question" color="grayDark" size="sm" />
              </Tooltip>
            }
          />
          {!!recent.serviceIds.length && (
            <Network network={recent} recent noLink onClear={id => dispatch.connections.clear(id)} />
          )}
        </>
      ) : (
        <LoadingMessage />
      )}
    </Container>
  )
}
