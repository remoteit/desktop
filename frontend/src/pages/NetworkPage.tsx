import React from 'react'
import { DeviceContext } from '../services/Context'
import { NoConnectionPage } from './NoConnectionPage'
import { Typography, Button } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { selectOrganizationName } from '../selectors/organizations'
import { networkAttributes } from '../components/Attributes'
import { NetworkHeaderMenu } from '../components/NetworkHeaderMenu'
import { NetworkSettings } from '../components/NetworkSettings'
import { DataDisplay } from '../components/DataDisplay'
import { GuideStep } from '../components/GuideStep'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'

export const NetworkPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const { network } = React.useContext(DeviceContext)
  const { orgName, email } = useSelector((state: State) => ({
    orgName: selectOrganizationName(state, network?.owner.id),
    email: state.user.email,
  }))

  if (!network) return <NoConnectionPage />
  const empty = network.serviceIds.length === 0

  return (
    <GuideStep
      step={3}
      guide="network"
      instructions={
        <>
          <Typography variant="body1" gutterBottom>
            Network added!
          </Typography>
          <Typography variant="body2">
            Next add a service. Find one from the devices page and use the network panel to add.
          </Typography>
          <Typography variant="caption">Note, you can only add from devices you own or manage.</Typography>
        </>
      }
      placement="left"
      hideArrow
      autoNext
    >
      <NetworkHeaderMenu network={network} email={email}>
        {empty && (
          <Notice gutterTop>
            Empty network <em>Add services to this network from a service page</em>
          </Notice>
        )}
        <Typography variant="subtitle1">Connections</Typography>
        <Gutters bottom="xxl">
          <Button
            variant="contained"
            size="small"
            disabled={empty}
            onClick={() => dispatch.connections.queueEnable({ ...network, enabled: true })}
          >
            Start All
          </Button>
          <Button
            variant="contained"
            color="info"
            size="small"
            disabled={empty}
            onClick={() => dispatch.connections.queueEnable({ ...network, enabled: false })}
            sx={{ marginLeft: 1 }}
          >
            Stop All
          </Button>
        </Gutters>
        <Typography variant="subtitle1">Settings</Typography>
        <NetworkSettings network={network} orgName={orgName} />
        <Gutters>
          <DataDisplay attributes={networkAttributes} instance={network} />
        </Gutters>
      </NetworkHeaderMenu>
    </GuideStep>
  )
}
