import React from 'react'
import { Typography } from '@mui/material'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import { ConnectedApps } from '../components/ConnectedApps'

export const ConnectedAppsPage: React.FC = () => {
  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>Connected Apps</Title>
        </Typography>
      }
    >
      <ConnectedApps />
    </Container>
  )
}
