import React from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectNetwork } from '../models/networks'
import { ApplicationState } from '../store'
import { AccordionMenuItem } from '../components/AccordionMenuItem'
import { NetworkSettings } from '../components/NetworkSettings'
import { NetworkHeaderMenu } from '../components/NetworkHeaderMenu'

export const NetworkEditPage: React.FC = () => {
  const { networkID } = useParams<{ networkID?: string }>()
  const network = useSelector((state: ApplicationState) => selectNetwork(state, networkID))

  return (
    <NetworkHeaderMenu network={network}>
      <AccordionMenuItem gutters subtitle="Configuration" defaultExpanded elevation={0}>
        <NetworkSettings network={network} />
      </AccordionMenuItem>
    </NetworkHeaderMenu>
  )
}
