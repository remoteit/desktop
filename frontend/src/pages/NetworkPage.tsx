import React from 'react'
import { useParams } from 'react-router-dom'
import { selectNetwork } from '../models/networks'
import { NoConnectionPage } from './NoConnectionPage'
import { Typography, Button } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { getOrganizationName } from '../models/organization'
import { NetworkHeaderMenu } from '../components/NetworkHeaderMenu'
import { NetworkSettings } from '../components/NetworkSettings'
import { GuideStep } from '../components/GuideStep'
import { Gutters } from '../components/Gutters'

export const NetworkPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const { networkID } = useParams<{ networkID?: string }>()
  const { network, orgName, email } = useSelector((state: ApplicationState) => {
    const network = selectNetwork(state, networkID)
    return {
      network,
      orgName: getOrganizationName(state, network.owner.id),
      email: state.user.email,
    }
  })

  if (!network) return <NoConnectionPage />

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
        <Typography variant="subtitle1">Connections</Typography>
        <Gutters bottom="xxl">
          <Button
            variant="contained"
            size="small"
            onClick={() => dispatch.connections.queueEnable({ ...network, enabled: true })}
          >
            Start All
          </Button>
          <Button
            variant="contained"
            color="info"
            size="small"
            onClick={() => dispatch.connections.queueEnable({ ...network, enabled: false })}
          >
            Stop All
          </Button>
        </Gutters>
        <Typography variant="subtitle1">Settings</Typography>
        <NetworkSettings network={network} orgName={orgName} />
      </NetworkHeaderMenu>
    </GuideStep>
  )
}
