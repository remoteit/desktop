import React from 'react'
import { Container } from '../components/Container'
import { LoadingMessage } from '../components/LoadingMessage'
import { State } from '../store'
import { Typography, Divider } from '@mui/material'
import { useSelector } from 'react-redux'
import { Gutters } from '../components/Gutters'
import { Plans } from '../components/Plans'

export const PlansPage: React.FC = () => {
  const { initialized } = useSelector((state: State) => state.plans)

  if (!initialized) return <LoadingMessage message="Loading plans..." />

  return (
    <Container
      integrated
      gutterBottom
      bodyProps={{ verticalOverflow: true, gutterTop: true }}
      header={<Typography variant="h1">Subscriptions</Typography>}
    >
      <Plans />
      <Divider variant="inset" />
      <Gutters>
        <Typography variant="caption">
          Pricing is represented and billed in US$ on most popular credit cards.
        </Typography>
      </Gutters>
    </Container>
  )
}
