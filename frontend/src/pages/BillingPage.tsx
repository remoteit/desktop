import React from 'react'
import { Typography } from '@mui/material'
import { CreditCard } from '../components/CreditCard'
import { Container } from '../components/Container'
import { Invoices } from '../components/Invoices'
import { Title } from '../components/Title'

export const BillingPage: React.FC = () => {
  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>Billing</Title>
        </Typography>
      }
    >
      <CreditCard />
      <Invoices />
    </Container>
  )
}
