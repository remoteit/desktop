import React from 'react'
import { useParams } from 'react-router-dom'
import { Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import { selectNetwork } from '../models/networks'
import { ApplicationState } from '../store'
import { getOrganizationName } from '../models/organization'
import { AccordionMenuItem } from '../components/AccordionMenuItem'
import { NetworkHeaderMenu } from '../components/NetworkHeaderMenu'
import { NetworkSettings } from '../components/NetworkSettings'
import { GuideStep } from '../components/GuideStep'

export const NetworkEditPage: React.FC = () => {
  const { networkID } = useParams<{ networkID?: string }>()
  const { network, owner, email } = useSelector((state: ApplicationState) => {
    const network = selectNetwork(state, networkID)
    return {
      network,
      owner: getOrganizationName(state, network.owner.id),
      email: state.user.email,
    }
  })

  return (
    <GuideStep
      step={3}
      guide="guideNetwork"
      instructions={
        <>
          <Typography variant="body1" gutterBottom>
            Network added!
          </Typography>
          <Typography variant="body2">
            Next add a service. Find the one you want and use the network panel on the connect page.
          </Typography>
        </>
      }
      placement="left"
      hideArrow
      autoNext
    >
      <NetworkHeaderMenu network={network} email={email}>
        <AccordionMenuItem gutters subtitle="Configuration" defaultExpanded elevation={0}>
          <NetworkSettings network={network} owner={owner} />
        </AccordionMenuItem>
      </NetworkHeaderMenu>
    </GuideStep>
  )
}
