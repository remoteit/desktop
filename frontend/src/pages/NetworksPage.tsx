import React, { useEffect } from 'react'
import { Typography, Collapse, Tooltip } from '@mui/material'
import { defaultNetwork, selectActiveNetwork, selectNetworks, recentNetwork, DEFAULT_ID } from '../models/networks'
import { initiatorPlatformIcon } from '../components/InitiatorPlatform'
import { selectConnections } from '../helpers/connectionHelper'
import { selectPermissions } from '../models/organization'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { SessionsList } from '../components/SessionsList'
import { IconButton } from '../buttons/IconButton'
import { NetworkAdd } from '../components/NetworkAdd'
import { GuideStep } from '../components/GuideStep'
import { Container } from '../components/Container'
import { Network } from '../components/Network'
import { Gutters } from '../components/Gutters'
import { TestUI } from '../components/TestUI'
import { Title } from '../components/Title'
import { Link } from '../components/Link'
import { Icon } from '../components/Icon'
import analyticsHelper from '../helpers/analyticsHelper'
import heartbeat from '../services/Heartbeat'

export const NetworksPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const { other, recent, networks, active, permissions } = useSelector((state: ApplicationState) => {
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
      networks: selectNetworks(state).sort((a: INetwork, b: INetwork) =>
        a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1
      ),
      permissions: selectPermissions(state),
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
            <TestUI>
              {permissions?.includes('MANAGE') && (
                <GuideStep
                  step={1}
                  guide="guideNetwork"
                  instructions="Click here to add a virtual network of services."
                  placement="top"
                  highlight
                  autoStart
                  autoNext
                >
                  <IconButton
                    icon="plus"
                    title="Add Network"
                    to="/networks/new"
                    color="primary"
                    type="solid"
                    size="md"
                  />
                </GuideStep>
              )}
            </TestUI>
          </Typography>
        </>
      }
    >
      <Network key={DEFAULT_ID} network={active} highlight noLink />
      <TestUI>
        <Collapse in={!networks?.length}>
          <Gutters top="xxl" bottom="xxl">
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
          <Network
            key={n.id}
            network={n}
            onClear={
              n.permissions.includes('MANAGE')
                ? id => dispatch.networks.remove({ serviceId: id, networkId: n.id })
                : undefined
            }
          />
        ))}
      </TestUI>
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
        <Network network={recent} recent noLink collapse onClear={id => dispatch.connections.clear(id)} />
      )}
    </Container>
  )
}
