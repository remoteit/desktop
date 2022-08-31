import React, { useEffect } from 'react'
import { Typography, Collapse } from '@mui/material'
import { defaultNetwork, selectActiveNetwork, selectNetworks, recentNetwork } from '../models/networks'
import { initiatorPlatformIcon } from '../components/InitiatorPlatform'
import { selectConnections } from '../helpers/connectionHelper'
import { selectPermissions } from '../models/organization'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { IconButton } from '../buttons/IconButton'
import { NetworkAdd } from '../components/NetworkAdd'
import { GuideStep } from '../components/GuideStep'
import { Container } from '../components/Container'
import { Network } from '../components/Network'
import { Gutters } from '../components/Gutters'
import { TestUI } from '../components/TestUI'
import { Title } from '../components/Title'
import { Link } from '../components/Link'
import analyticsHelper from '../helpers/analyticsHelper'
import heartbeat from '../services/Heartbeat'

export const NetworksPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const { networks, permissions } = useSelector((state: ApplicationState) => ({
    networks: selectNetworks(state).sort((a: INetwork, b: INetwork) =>
      a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1
    ),
    permissions: selectPermissions(state),
  }))

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
    </Container>
  )
}
