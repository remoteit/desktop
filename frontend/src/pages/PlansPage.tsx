import React from 'react'
import { Container } from '../components/Container'
import { LoadingMessage } from '../components/LoadingMessage'
import { ApplicationState } from '../store'
import { Typography, Divider } from '@material-ui/core'
import { useSelector } from 'react-redux'
import { Gutters } from '../components/Gutters'
import { Plans } from '../components/Plans'

export const PlansPage: React.FC = () => {
  const { initialized } = useSelector((state: ApplicationState) => ({
    initialized: state.licensing.initialized,
  }))

  if (!initialized) return <LoadingMessage message="Loading plans..." />

  return (
    <Container gutterBottom header={<Typography variant="h1">Subscriptions</Typography>}>
      <Plans />
      <Divider variant="inset" />
      <Gutters>
        <Typography variant="caption">
          * Devices are virtual (like AWS EC2) or physical (like Raspberry Pi, Nvidia Jetson, Windows PC, etc) <br />
          &nbsp; Pricing is represented and billed in US$ on most popular credit cards.
        </Typography>
      </Gutters>
    </Container>
  )
}
