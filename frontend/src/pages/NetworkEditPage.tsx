import React from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectNetwork } from '../models/networks'
import { ApplicationState } from '../store'
import { getOrganizationName } from '../models/organization'
import { AccordionMenuItem } from '../components/AccordionMenuItem'
import { NetworkHeaderMenu } from '../components/NetworkHeaderMenu'
import { NetworkSettings } from '../components/NetworkSettings'

export const NetworkEditPage: React.FC = () => {
  const { networkID } = useParams<{ networkID?: string }>()
  const { network, owner } = useSelector((state: ApplicationState) => {
    const network = selectNetwork(state, networkID)
    return {
      network,
      owner: getOrganizationName(state, network.owner.id),
    }
  })

  return (
    <NetworkHeaderMenu network={network}>
      <AccordionMenuItem gutters subtitle="Configuration" defaultExpanded elevation={0}>
        <NetworkSettings network={network} owner={owner} />
      </AccordionMenuItem>
    </NetworkHeaderMenu>
  )
}
