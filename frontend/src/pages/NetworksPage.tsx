import React from 'react'
import { Typography, Divider } from '@mui/material'
import { selectNetworks } from '../selectors/networks'
import { selectPermissions } from '../selectors/organizations'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { selectDeviceModelAttributes } from '../selectors/devices'
import { LinearProgress } from '../components/LinearProgress'
import { LoadingMessage } from '../components/LoadingMessage'
import { GuideBubble } from '../components/GuideBubble'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Network } from '../components/Network'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'

export const NetworksPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const all = [...useSelector(selectNetworks)].sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1))
  const initialized = useSelector((state: State) => state.networks.initialized)
  const permissions = useSelector((state: State) => selectPermissions(state))
  const loading = useSelector(selectDeviceModelAttributes).fetching
  const networks = all.filter(n => !n.shared)
  const shared = all.filter(n => n.shared)
  const empty = !all?.length

  return (
    <Container
      bodyProps={{ verticalOverflow: true, gutterTop: true }}
      gutterBottom
      header={
        <>
          <Typography variant="subtitle1">
            <Title>Networks</Title>
            {permissions?.includes('MANAGE') && (
              <GuideBubble
                guide="addNetwork"
                enterDelay={400}
                placement="bottom"
                startDate={new Date('2002-01-01')}
                instructions={
                  <>
                    <Typography variant="h3" gutterBottom>
                      <b>Welcome to networks</b>
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      A network is a custom group of services organized for ease of access and sharing.
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Select the <cite>+</cite> icon to get started.
                    </Typography>
                  </>
                }
              >
                <IconButton icon="plus" title="New Network" to="/networks/add" type="solid" size="md" shiftDown />
              </GuideBubble>
            )}
          </Typography>
          <LinearProgress loading={loading} />
        </>
      }
    >
      {initialized ? (
        <>
          {empty && (
            <Gutters top="xxl" bottom="xxl" center>
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
        <LoadingMessage message="Loading..." spinner={false} />
      )}
    </Container>
  )
}
