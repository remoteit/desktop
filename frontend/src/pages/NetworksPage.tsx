import React from 'react'
import { Typography, Collapse, Divider } from '@mui/material'
import { selectNetworks } from '../models/networks'
import { selectPermissions } from '../models/organization'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { IconButton } from '../buttons/IconButton'
import { LoadingMessage } from '../components/LoadingMessage'
import { GuideStep } from '../components/GuideStep'
import { Container } from '../components/Container'
import { Network } from '../components/Network'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'

export const NetworksPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const { initialized, networks, shared, permissions } = useSelector((state: ApplicationState) => {
    const networks = selectNetworks(state).sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1))
    return {
      initialized: state.networks.initialized,
      networks: networks.filter(n => !n.shared),
      shared: networks.filter(n => n.shared),
      permissions: selectPermissions(state),
    }
  })

  const empty = !networks?.length && !shared?.length

  return (
    <Container
      bodyProps={{ verticalOverflow: true, gutterTop: true }}
      gutterBottom
      header={
        <Typography variant="subtitle1">
          <Title>Networks</Title>
          {permissions?.includes('MANAGE') && (
            <GuideStep
              step={1}
              guide="network"
              instructions="Click here to add a virtual network of services."
              placement="top"
              highlight
              autoStart
              autoNext
            >
              <IconButton icon="plus" title="Add Network" to="/networks/add" type="solid" size="md" />
            </GuideStep>
          )}
        </Typography>
      }
    >
      {initialized ? (
        <>
          {empty && (
            <Gutters top="xxl" center>
              <Typography variant="h1" gutterBottom>
                <Icon name="chart-network" fontSize={50} type="light" color="grayLight" />
              </Typography>
              <Typography variant="h3">You have no networks</Typography>
              <Typography variant="caption">Add a network with the '+' button above.</Typography>
            </Gutters>
          )}
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
          {!!shared.length && (
            <>
              {!!networks.length && (
                <>
                  <Typography variant="subtitle1">Shared with you</Typography>
                  <Divider variant="inset" />
                </>
              )}
              {shared.map(n => (
                <Network key={n.id} network={n} />
              ))}
            </>
          )}
        </>
      ) : (
        <LoadingMessage />
      )}
    </Container>
  )
}
