import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { Typography, List } from '@material-ui/core'
import { selectNetwork } from '../models/networks'
import { ApplicationState } from '../store'
import { AccordionMenuItem } from '../components/AccordionMenuItem'
import { NetworkName } from '../components/NetworkName'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Title } from '../components/Title'
import analyticsHelper from '../helpers/analyticsHelper'

export const NetworkEditPage: React.FC = () => {
  const { networkID } = useParams<{ networkID?: string }>()
  const network = useSelector((state: ApplicationState) => selectNetwork(state, networkID))

  useEffect(() => {
    analyticsHelper.page('NetworkAddPage')
  }, [])

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <Typography variant="h1" gutterBottom>
          <Title>{network.name}</Title>
        </Typography>
      }
    >
      <Gutters>Network details here</Gutters>
      <AccordionMenuItem gutters subtitle="Configuration" defaultExpanded elevation={0}>
        <List disablePadding>
          <NetworkName network={network} />
        </List>
      </AccordionMenuItem>
    </Container>
  )
}
