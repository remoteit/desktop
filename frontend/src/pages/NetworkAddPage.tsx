import React from 'react'
import { Typography } from '@mui/material'
import { NetworkAdd } from '../components/NetworkAdd'
import { Container } from '../components/Container'
import { Title } from '../components/Title'

export const NetworkAddPage: React.FC = () => {
  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>Add network</Title>
        </Typography>
      }
    >
      <NetworkAdd />
    </Container>
  )
}
