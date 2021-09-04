import React, { useEffect } from 'react'
import { Invoices } from '../components/Invoices'
import { Container } from '../components/Container'
import { CreditCard } from '../components/CreditCard'
import { Typography } from '@material-ui/core'
import { Plans } from '../components/Plans'
import analyticsHelper from '../helpers/analyticsHelper'

export const PlansPage: React.FC = () => {
  useEffect(() => {
    analyticsHelper.page('PlansPage')
  }, [])

  return (
    <Container gutterBottom header={<Typography variant="h1">Plans</Typography>}>
      <Plans />
      <CreditCard />
      <Invoices />
    </Container>
  )
}
